package com.cvplatform.ai.chat;

import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.user.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Stateful conversational AI assistant. Each user has a Redis-backed rolling
 * window of the last N messages (key=chat:{userId}, TTL refreshed on each
 * write). On every send we rebuild the prompt with: system, user context
 * snapshot (CV summary + AI analysis summary + recent applications), then
 * the conversation history.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private static final String SYSTEM_PROMPT = """
            Sen Synapse platformunun resmi AI kariyer asistanısın. Görevin:
            - Kullanıcının CV'si, AI yetkinlik raporu ve son başvuruları üzerinden
              kişiselleştirilmiş yorum yap.
            - Kısa, samimi, eyleme yönlendiren cevaplar ver (Türkçe).
            - Asla yalan bilgi üretme; sadece sana verilen bağlamı + genel kariyer
              bilgisini kullan. Bilmiyorsan "elimde bu veri yok" de.
            - Cevapları 1-3 paragrafla sınırla, gerekirse madde listesi kullan.
            - Platform içi yönlendirme yapabilirsin: /dashboard/cv, /dashboard/analysis,
              /dashboard/jobs, /dashboard/billing.
            """;

    private static final int HISTORY_LIMIT = 20;
    private static final Duration TTL = Duration.ofDays(7);

    private final AiAssistantClient client;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;
    private final ApplicationRepository applicationRepository;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ChatResponse send(User user, String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return new ChatResponse("Lütfen bir soru yazar mısın?", List.of());
        }

        List<ChatMessage> history = loadHistory(user.getId());
        history.add(new ChatMessage("user", userMessage));

        String contextBlock = buildContext(user);
        String fullPrompt = contextBlock
                + "\n\n----- KONUŞMA GEÇMİŞİ -----\n"
                + history.stream()
                .map(m -> (m.role().equals("user") ? "Kullanıcı: " : "Asistan: ") + m.content())
                .collect(Collectors.joining("\n"));

        String reply;
        try {
            reply = client.generateText(SYSTEM_PROMPT, fullPrompt, 0.7);
        } catch (Exception ex) {
            log.error("Chat generation failed: {}", ex.getMessage(), ex);
            reply = "Şu an yanıt veremiyorum, biraz sonra tekrar dene.";
        }

        history.add(new ChatMessage("assistant", reply));
        // Trim to last HISTORY_LIMIT messages
        if (history.size() > HISTORY_LIMIT) {
            history = new ArrayList<>(history.subList(history.size() - HISTORY_LIMIT, history.size()));
        }
        saveHistory(user.getId(), history);

        return new ChatResponse(reply, history);
    }

    public List<ChatMessage> getHistory(User user) {
        return loadHistory(user.getId());
    }

    public void clearHistory(User user) {
        try {
            redis.delete(key(user.getId()));
        } catch (Exception ex) {
            log.warn("Failed to clear chat history: {}", ex.getMessage());
        }
    }

    /* ============ helpers ============ */

    private String buildContext(User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("KULLANICI:\n");
        sb.append("- Ad: ").append(safe(user.getFirstName())).append(" ").append(safe(user.getLastName())).append("\n");
        if (user.getTitle() != null) sb.append("- Ünvan: ").append(user.getTitle()).append("\n");
        if (user.getCity() != null) sb.append("- Şehir: ").append(user.getCity()).append("\n");
        sb.append("- Plan: ").append(user.getSubscriptionType()).append("\n");

        cvRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId()).ifPresent(cv -> {
            sb.append("\nCV:\n");
            if (cv.getSummary() != null) {
                sb.append("- Özet: ").append(truncate(cv.getSummary(), 300)).append("\n");
            }
            if (cv.getSkills() != null && !cv.getSkills().isEmpty()) {
                sb.append("- Yetkinlikler: ").append(String.join(", ", cv.getSkills())).append("\n");
            }
        });

        analysisRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                .filter(r -> r.getStatus() == null || r.getStatus() == AnalysisReport.Status.COMPLETED)
                .ifPresent(a -> {
                    sb.append("\nAI YETKİNLİK RAPORU:\n");
                    if (a.getOverallScore() != null) {
                        sb.append("- Genel skor: ").append(a.getOverallScore()).append("/100\n");
                    }
                    if (a.getSummary() != null) {
                        sb.append("- Özet: ").append(truncate(a.getSummary(), 300)).append("\n");
                    }
                });

        List<Application> apps = applicationRepository.findAllByUser_IdOrderByAppliedAtDesc(user.getId());
        if (!apps.isEmpty()) {
            sb.append("\nSON BAŞVURULAR (").append(apps.size()).append(" toplam):\n");
            apps.stream().limit(5).forEach(a -> sb.append("- ")
                    .append(a.getJob().getTitle())
                    .append(" @ ").append(a.getJob().getCompany().getName())
                    .append(" · ").append(a.getStatus())
                    .append("\n"));
        }
        return sb.toString();
    }

    private List<ChatMessage> loadHistory(UUID userId) {
        try {
            String raw = redis.opsForValue().get(key(userId));
            if (raw == null) return new ArrayList<>();
            return new ArrayList<>(objectMapper.readValue(raw,
                    new TypeReference<List<ChatMessage>>() {}));
        } catch (Exception ex) {
            log.warn("Failed to load chat history: {}", ex.getMessage());
            return new ArrayList<>();
        }
    }

    private void saveHistory(UUID userId, List<ChatMessage> history) {
        try {
            String json = objectMapper.writeValueAsString(history);
            redis.opsForValue().set(key(userId), json, TTL);
        } catch (Exception ex) {
            log.warn("Failed to save chat history: {}", ex.getMessage());
        }
    }

    private String key(UUID userId) {
        return "chat:" + userId;
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "...";
    }

    public record ChatMessage(String role, String content) {}
    public record ChatResponse(String reply, List<ChatMessage> history) {}
}
