package com.cvplatform.jobs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class EmbeddingClient {

    private final RestClient restClient;

    public EmbeddingClient(RestClient.Builder builder,
                           @Value("${app.ai-service.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(60));

        this.restClient = builder
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Asks ai-service to rank `candidates` against `reference` skill list,
     * returning the top-N IDs with 0..100 cosine-based scores.
     */
    public List<MatchHit> match(List<String> reference,
                                List<CandidateBody> candidates,
                                int topN) {
        Map<String, Object> req = Map.of(
                "reference", reference,
                "candidates", candidates,
                "topN", topN
        );
        try {
            MatchResponse body = restClient.post()
                    .uri("/v1/embeddings/match")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(MatchResponse.class);
            return body == null || body.hits() == null ? List.of() : body.hits();
        } catch (Exception ex) {
            log.warn("Semantic match failed, returning empty: {}", ex.getMessage());
            return List.of();
        }
    }

    public record CandidateBody(String id, List<String> skills, String title) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MatchHit(String id, double score) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MatchResponse(List<MatchHit> hits) {}

    // ===== skill graph =====

    public GraphResponse cluster(List<String> skills,
                                 double edgeThreshold,
                                 int maxEdgesPerSkill) {
        if (skills == null || skills.isEmpty()) {
            return new GraphResponse(List.of(), List.of());
        }
        Map<String, Object> req = Map.of(
                "skills", skills,
                "edgeThreshold", edgeThreshold,
                "maxEdgesPerSkill", maxEdgesPerSkill
        );
        try {
            GraphResponse body = restClient.post()
                    .uri("/v1/embeddings/cluster")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(GraphResponse.class);
            return body == null ? new GraphResponse(List.of(), List.of()) : body;
        } catch (Exception ex) {
            log.warn("Skill cluster failed, returning empty graph: {}", ex.getMessage());
            return new GraphResponse(List.of(), List.of());
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GraphNode(String id, int cluster) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GraphEdge(String source, String target, double weight) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GraphResponse(List<GraphNode> nodes, List<GraphEdge> edges) {}
}
