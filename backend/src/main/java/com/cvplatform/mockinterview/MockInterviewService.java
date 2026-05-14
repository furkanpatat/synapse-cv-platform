package com.cvplatform.mockinterview;

import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.common.ApiException;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Solo AI-driven mock interview practice.
 *
 * Flow:
 *  1. start(user, role, level) → Gemini drafts 5 interview questions for the
 *     role/level. We persist them up-front so the user always knows what's
 *     coming next, even if Gemini hiccups later.
 *  2. submitAnswer(sessionId, idx, transcript) → just stores the answer.
 *  3. finalize(sessionId) → second Gemini call scores every Q/A pair,
 *     computes an overall score and a STAR-compliance number, writes a
 *     paragraph-long verbal summary.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MockInterviewService {

    private static final int QUESTION_COUNT = 5;

    private final MockInterviewRepository repository;
    private final AiAssistantClient aiClient;
    private final JobPostingRepository jobRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public MockInterview start(User user, String roleTitle, String level, String sector,
                                UUID jobPostingId) {
        // If a job is linked, pull its title/level so the candidate sees the
        // exact role they're preparing for — but still allow manual override.
        JobPosting job = null;
        if (jobPostingId != null) {
            job = jobRepository.findById(jobPostingId).orElse(null);
            if (job != null && job.getStatus() != JobStatus.ACTIVE) {
                // Allow practising for closed jobs too, but warn-by-context;
                // we don't hard-fail.
            }
        }

        String effectiveRole = (roleTitle == null || roleTitle.isBlank()) && job != null
                ? job.getTitle()
                : roleTitle;
        if (effectiveRole == null || effectiveRole.isBlank()) {
            throw ApiException.badRequest("ROLE_REQUIRED", "Rol başlığı gerekli");
        }
        String normalizedLevel;
        if ((level == null || level.isBlank()) && job != null && job.getLevel() != null) {
            normalizedLevel = job.getLevel().name();
        } else {
            normalizedLevel = level == null ? "MID" : level.toUpperCase();
        }
        if (!Set.of("JUNIOR", "MID", "SENIOR", "LEAD").contains(normalizedLevel)) {
            normalizedLevel = "MID";
        }
        String normalizedSector = (sector == null || sector.isBlank()) ? "TEKNOLOJI"
                : sector.trim().toUpperCase();

        List<String> questions = generateQuestions(
                effectiveRole, normalizedLevel, normalizedSector, job);

        MockInterview iv = MockInterview.builder()
                .user(user)
                .roleTitle(effectiveRole.trim())
                .level(normalizedLevel)
                .sector(normalizedSector)
                .jobPosting(job)
                .language("tr")
                .questions(questions)
                .answers(new ArrayList<>())
                .status("IN_PROGRESS")
                .build();
        return repository.save(iv);
    }

    @Transactional
    public MockInterview submitAnswer(User user, UUID sessionId, int index, String transcript) {
        MockInterview iv = ownedOrThrow(user, sessionId);
        if (!"IN_PROGRESS".equals(iv.getStatus())) {
            throw ApiException.badRequest("MOCK_IV_NOT_OPEN",
                    "Bu mülakat zaten tamamlanmış");
        }
        if (index < 0 || index >= iv.getQuestions().size()) {
            throw ApiException.badRequest("MOCK_IV_BAD_INDEX",
                    "Soru indeksi geçersiz");
        }
        List<String> answers = new ArrayList<>(iv.getAnswers());
        while (answers.size() <= index) answers.add("");
        answers.set(index, transcript == null ? "" : transcript.trim());
        iv.setAnswers(answers);
        return repository.save(iv);
    }

    @Transactional
    public MockInterview finalize(User user, UUID sessionId) {
        MockInterview iv = ownedOrThrow(user, sessionId);
        if ("COMPLETED".equals(iv.getStatus())) {
            return iv;
        }
        Evaluation ev = evaluate(iv);
        iv.setPerQuestionScores(ev.perQuestion());
        iv.setOverallScore(ev.overallScore());
        iv.setOverallSummary(ev.summary());
        iv.setStarCompliance(ev.starCompliance());
        iv.setStatus("COMPLETED");
        iv.setCompletedAt(Instant.now());
        return repository.save(iv);
    }

    public List<MockInterview> listMine(User user) {
        return repository.findAllByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public MockInterview get(User user, UUID id) {
        return ownedOrThrow(user, id);
    }

    // ============== internals ==============

    private MockInterview ownedOrThrow(User user, UUID id) {
        MockInterview iv = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("MOCK_IV_NOT_FOUND",
                        "Mock interview bulunamadı"));
        if (!iv.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("MOCK_IV_NOT_OWNED", "Bu mülakat sana ait değil");
        }
        return iv;
    }

    private List<String> generateQuestions(String role, String level, String sector,
                                            JobPosting job) {
        String sectorLabel = sectorLabel(sector);
        boolean jobLinked = job != null;

        String systemPrompt = jobLinked ? """
                Sen deneyimli bir mülakatçısın. Türkçe konuşuyorsun.
                Aday SPESİFİK BİR İŞ İLANINA hazırlanıyor — sana o ilanın
                başlığını, açıklamasını, aranan yetkinliklerini ve şirket adını
                veriyorum. Adayı O İLANA özel hazırla.

                5 sorunun dağılımı:
                  - 1 soru: "Neden bu şirket?" / "Şirket hakkında ne biliyorsun?"
                    tipi şirket-kültür fit sorusu (şirket adından yola çık)
                  - 2 soru: İlanda aranan yetkinliklerden seçilmiş teknik /
                    uzmanlık deep-dive (description'da geçen spesifik
                    teknolojilere veya konulara değin)
                  - 2 soru: Davranışsal / STAR tetikleyici, ilanın gerektirdiği
                    seviyeye ve rolün gerçek günlük zorluklarına uygun

                Sorular Türkçe, doğal sohbet tonunda, açık uçlu olsun.
                Çıktıyı SADECE şu JSON formatında ver, ek metin yok:
                {"questions":["soru 1","soru 2","soru 3","soru 4","soru 5"]}
                """ : """
                Sen deneyimli bir mülakatçısın. Türkçe konuşuyorsun.
                Verilen SEKTÖR + ROL + SEVİYE için aday değerlendirmek üzere
                5 mülakat sorusu hazırlıyorsun.

                ÖNEMLİ:
                  - Sektör yazılım/teknoloji değilse soruları o sektörün
                    gerçek günlük diline ve sorunlarına göre kur — örn.
                    "Sağlık" için hasta bakımı/etik vakalar, "Eğitim" için
                    sınıf yönetimi, "Pazarlama" için kampanya metriği,
                    "Finans" için risk analizi, "Hukuk" için içtihat vs.
                  - Sektör teknoloji ise role özgü teknik konulara gir.

                Sorular:
                  - Davranışsal / STAR tetikleyici (en az 2 tane)
                  - Role özgü uzmanlık sorusu (en az 2 tane)
                  - Açık uçlu olmalı, evet/hayır cevaplanmamalı
                  - Türkçe ve doğal sohbet tonunda
                Çıktıyı SADECE şu JSON formatında ver, ek metin yok:
                {"questions":["soru 1","soru 2","soru 3","soru 4","soru 5"]}
                """;
        StringBuilder up = new StringBuilder();
        up.append("Sektör: ").append(sectorLabel)
                .append("\nRol: ").append(role)
                .append("\nSeviye: ").append(level);
        if (jobLinked) {
            up.append("\nŞirket: ").append(job.getCompany() == null ? "—" : job.getCompany().getName());
            up.append("\nİlan başlığı: ").append(job.getTitle());
            if (job.getCity() != null) up.append("\nLokasyon: ").append(job.getCity());
            if (job.getRequiredSkills() != null && !job.getRequiredSkills().isEmpty()) {
                up.append("\nAranan yetkinlikler: ")
                        .append(String.join(", ", job.getRequiredSkills()));
            }
            if (job.getDescription() != null && !job.getDescription().isBlank()) {
                String desc = job.getDescription().length() > 1500
                        ? job.getDescription().substring(0, 1500)
                        : job.getDescription();
                up.append("\n\nİlan açıklaması:\n").append(desc);
            }
        }
        up.append("\n\n5 soru üret. Cevap sadece JSON.");
        String userPrompt = up.toString();
        try {
            String raw = aiClient.generateText(systemPrompt, userPrompt, 0.7);
            String json = extractJson(raw);
            Map<String, Object> parsed = mapper.readValue(json, new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            List<String> qs = (List<String>) parsed.get("questions");
            if (qs == null || qs.isEmpty()) throw new IllegalStateException("no questions");
            return qs.stream().limit(QUESTION_COUNT).toList();
        } catch (Exception ex) {
            log.warn("Question generation failed, falling back to defaults: {}", ex.toString());
            return defaultQuestions(role, level);
        }
    }

    private record Evaluation(List<Map<String, Object>> perQuestion,
                              int overallScore, int starCompliance, String summary) {}

    private Evaluation evaluate(MockInterview iv) {
        String systemPrompt = """
                Sen mülakat değerlendirme uzmanısın. Türkçe konuşuyorsun.
                Sana bir aday için soru-cevap çiftleri veriyorum.

                ÖNEMLİ: Cevaplar sesli kayıttan otomatik transkripsiyon ile
                yazıya geçirilmiştir; teknik terimler veya yabancı kelimeler
                Türkçe ses bilgisi ile yanlış yazılmış olabilir
                (örn. "riak" = React, "kıbırnitis" = Kubernetes, "ce esen" = JSON).
                Bunları zihninde normalize ederek değerlendir, transkripsiyon
                hatasını adayın bilgisizliği olarak sayma.

                Her cevabı:
                  - 0-100 arası bir score ile değerlendir
                  - 1-2 cümle feedback yaz
                  - strengths: cevabın güçlü yönleri (maks 3 madde)
                  - gaps: eksik / geliştirilebilir noktalar (maks 3 madde)
                Sonunda:
                  - overallScore: 0-100 (cevapların ağırlıklı ortalaması)
                  - starCompliance: STAR (Situation-Task-Action-Result) formatına ne
                    kadar uygun cevap verdi? 0-100
                  - summary: aday için 4-6 cümle yapıcı genel değerlendirme
                Çıktı SADECE JSON, başka metin yok:
                {
                  "perQuestion":[{"score":0,"feedback":"","strengths":[],"gaps":[]}],
                  "overallScore":0,
                  "starCompliance":0,
                  "summary":""
                }
                """;
        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Sektör: ").append(sectorLabel(iv.getSector()))
                .append("\nRol: ").append(iv.getRoleTitle())
                .append(" · Seviye: ").append(iv.getLevel()).append("\n\n");
        for (int i = 0; i < iv.getQuestions().size(); i++) {
            String q = iv.getQuestions().get(i);
            String a = i < iv.getAnswers().size() ? iv.getAnswers().get(i) : "";
            userPrompt.append("S").append(i + 1).append(": ").append(q).append("\n");
            userPrompt.append("C").append(i + 1).append(": ")
                    .append(a == null || a.isBlank() ? "(boş bırakıldı)" : a)
                    .append("\n\n");
        }
        userPrompt.append("Her soru için bir perQuestion girişi olmalı.");

        try {
            String raw = aiClient.generateText(systemPrompt, userPrompt.toString(), 0.4);
            Map<String, Object> parsed = mapper.readValue(extractJson(raw), new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> perQ = (List<Map<String, Object>>) parsed.getOrDefault(
                    "perQuestion", List.of());
            int overall = parseInt(parsed.get("overallScore"), 60);
            int star = parseInt(parsed.get("starCompliance"), 50);
            String summary = String.valueOf(parsed.getOrDefault("summary", ""));
            return new Evaluation(perQ, overall, star, summary);
        } catch (Exception ex) {
            log.warn("Evaluation failed, returning fallback: {}", ex.toString());
            return new Evaluation(
                    List.of(),
                    50,
                    50,
                    "AI değerlendirmesi şu an üretilemedi. Cevapların kayıtlı, daha sonra yeniden deneyebilirsin."
            );
        }
    }

    private static int parseInt(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    /** Strip ```json fences and any leading/trailing prose. */
    private static String extractJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        // Common Gemini wrapping ```json … ```
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    /** User-facing label for the persisted sector code. */
    private static String sectorLabel(String sector) {
        if (sector == null) return "Genel";
        return switch (sector.toUpperCase()) {
            case "TEKNOLOJI"   -> "Teknoloji / Yazılım";
            case "SAGLIK"      -> "Sağlık";
            case "EGITIM"      -> "Eğitim";
            case "FINANS"      -> "Finans / Bankacılık";
            case "PAZARLAMA"   -> "Pazarlama / Reklam";
            case "TASARIM"     -> "Tasarım / UX";
            case "HUKUK"       -> "Hukuk";
            case "INSAN_KAYNAKLARI" -> "İnsan Kaynakları";
            case "OPERASYON"   -> "Operasyon / Lojistik";
            case "URETIM"      -> "Üretim / Mühendislik";
            case "MEDYA"       -> "Medya / İçerik";
            case "SATIS"       -> "Satış";
            case "MUSTERI_HIZMETLERI" -> "Müşteri Hizmetleri";
            case "DANISMANLIK" -> "Danışmanlık";
            default            -> sector;
        };
    }

    private static List<String> defaultQuestions(String role, String level) {
        return List.of(
                "Kendini kısaca tanıtır mısın? Şu ana kadar üzerinde çalıştığın en heyecan verici proje hangisiydi?",
                "Mevcut iş tanımındaki en zorlu teknik problemi anlatır mısın? Nasıl yaklaştın, sonucu ne oldu?",
                role + " rolünde sende olduğunu düşündüğün en güçlü yetkinlik hangisi, neden?",
                "Geliştirmek istediğin bir alan söyle ve bunun için son 6 ayda ne yaptığını paylaş.",
                "Hiç bir takım arkadaşınla ciddi bir teknik fikir ayrılığı yaşadın mı? Nasıl çözdünüz?"
        );
    }
}
