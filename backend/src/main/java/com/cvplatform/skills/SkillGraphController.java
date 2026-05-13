package com.cvplatform.skills;

import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.EmbeddingClient;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

/**
 * Build a semantic skill graph for the authenticated user.
 *
 * Nodes:
 *   - "my" skills come from the user's latest CvDocument
 *   - "market" skills come from the top-N most-required skills across active
 *     job postings (so the user can see how their skillset overlaps with
 *     real demand)
 * Edges + cluster assignments are computed by ai-service via sentence-
 * transformers cosine similarity.
 */
@RestController
@RequestMapping("/v1/skills")
@RequiredArgsConstructor
public class SkillGraphController {

    private final CvDocumentRepository cvRepository;
    private final JobPostingRepository jobRepository;
    private final EmbeddingClient embeddingClient;

    @GetMapping("/graph")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> graph(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0.45") double threshold,
            @RequestParam(defaultValue = "4") int maxEdges,
            @RequestParam(defaultValue = "25") int marketTop) {

        // 1) User's skills (latest CV)
        List<String> mine = cvRepository
                .findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                .map(CvDocument::getSkills)
                .orElse(List.of())
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // 2) Market skills — aggregate from active job postings.
        Map<String, Integer> counts = new HashMap<>();
        jobRepository
                .findAllByStatus(JobStatus.ACTIVE, PageRequest.of(0, 200))
                .forEach(j -> {
                    if (j.getRequiredSkills() == null) return;
                    for (String s : j.getRequiredSkills()) {
                        if (s == null || s.isBlank()) continue;
                        counts.merge(s.trim(), 1, Integer::sum);
                    }
                });
        List<String> market = counts.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(Math.max(0, marketTop))
                .map(Map.Entry::getKey)
                .toList();

        // 3) Union of skills passed to the cluster endpoint.
        LinkedHashSet<String> all = new LinkedHashSet<>();
        all.addAll(mine);
        all.addAll(market);
        List<String> union = new ArrayList<>(all);

        EmbeddingClient.GraphResponse graph =
                embeddingClient.cluster(union, threshold, maxEdges);

        // 4) Annotate each node with whether the user has it.
        Set<String> mineLc = new HashSet<>();
        for (String s : mine) mineLc.add(s.toLowerCase());

        List<Map<String, Object>> nodes = graph.nodes().stream()
                .map(n -> {
                    boolean owned = mineLc.contains(n.id().toLowerCase());
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", n.id());
                    m.put("cluster", n.cluster());
                    m.put("owned", owned);
                    m.put("demand", counts.getOrDefault(n.id(), 0));
                    return m;
                })
                .toList();

        return ResponseEntity.ok(Map.of(
                "nodes", nodes,
                "edges", graph.edges(),
                "mySkillsCount", mine.size(),
                "marketSkillsCount", market.size()
        ));
    }
}
