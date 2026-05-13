package com.cvplatform.ai.chat;

import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
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
 * Role-aware conversational AI. The context block and system instructions
 * change based on USER / COMPANY / ADMIN so the assistant talks the right
 * "language" for each role.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private static final String SYSTEM_USER = """
            Sen Synapse platformunun resmi AI KARİYER asistanısın — birey kullanıcılarla
            (iş arayan adaylar) konuşuyorsun.

            Görevin:
            - Kullanıcının CV'si, AI yetkinlik raporu ve son başvuruları üzerinden
              kişiselleştirilmiş yorum yap.
            - "Hangi ilana başvurayım", "CV'mi nasıl iyileştiririm", "AI skorum ne
              anlama geliyor" tarzı sorulara cevap verebilirsin.
            - Kısa, samimi, eyleme yönlendiren cevaplar ver (Türkçe).
            - Asla yalan üretme; sadece verilen bağlam + genel kariyer bilgisi.
              Bilmiyorsan "elimde bu veri yok" de.
            - Cevapları 1-3 paragrafla sınırla, gerekirse madde listesi kullan.
            - Platform içi yönlendirme yapabilirsin: /dashboard/cv, /dashboard/analysis,
              /dashboard/jobs, /dashboard/billing.
            """;

    private static final String SYSTEM_COMPANY = """
            Sen Synapse platformunun resmi AI İK / HIRING asistanısın — ŞİRKET
            kullanıcılarıyla (recruiter / hiring manager) konuşuyorsun.

            Görevin:
            - Şirketin ilanları, gelen başvurular, aday AI skorları ve hiring funnel'ı
              üzerinden yorum yap.
            - "İlan açıklamamı nasıl iyileştiririm", "Hangi adayı önce inceleyeyim",
              "En yüksek skorlu adaylar kimler", "İlanım az başvuru alıyor sebebi
              ne olabilir" tarzı sorulara cevap verebilirsin.
            - KESİNLİKLE birey kullanıcı odaklı tavsiye verme: "CV'mi nasıl
              iyileştiririm", "Hangi ilana başvurayım" gibi soruların öznesi
              ADAYLAR değil, ŞİRKETtir.
            - Kısa, profesyonel, eyleme yönlendiren cevaplar ver (Türkçe).
            - Asla yalan üretme; sadece verilen bağlam + genel HR pratik bilgisi.
            - Platform içi yönlendirme: /company/jobs, /company/analytics,
              /company/applications/{id}, /company/messages.
            """;

    private static final String SYSTEM_ADMIN = """
            Sen Synapse platformunun resmi AI SİSTEM asistanısın — ADMIN kullanıcısıyla
            konuşuyorsun.

            Görevin:
            - Platform geneli istatistikler, bekleyen şirket onayları, plan dağılımı,
              kullanıcı büyümesi üzerinden yorum yap.
            - Kısa, teknik-profesyonel cevaplar ver (Türkçe).
            - Platform içi yönlendirme: /admin/analytics, /admin/users,
              /admin/companies.
            """;

    private static final int HISTORY_LIMIT = 20;
    private static final Duration TTL = Duration.ofDays(7);

    private final AiAssistantClient client;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ChatResponse send(User user, String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return new ChatResponse("Lütfen bir soru yazar mısın?", List.of());
        }

        List<ChatMessage> history = loadHistory(user.getId());
        history.add(new ChatMessage("user", userMessage));

        String system = pickSystemPrompt(user.getRole());
        String contextBlock = buildContext(user);
        String fullPrompt = contextBlock
                + "\n\n----- KONUŞMA GEÇMİŞİ -----\n"
                + history.stream()
                .map(m -> (m.role().equals("user") ? "Kullanıcı: " : "Asistan: ") + m.content())
                .collect(Collectors.joining("\n"));

        String reply;
        try {
            reply = client.generateText(system, fullPrompt, 0.7);
        } catch (Exception ex) {
            log.error("Chat generation failed: {}", ex.getMessage(), ex);
            reply = "Şu an yanıt veremiyorum, biraz sonra tekrar dene.";
        }

        history.add(new ChatMessage("assistant", reply));
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

    /* ============ system prompt / context routing ============ */

    private String pickSystemPrompt(Role role) {
        return switch (role) {
            case COMPANY -> SYSTEM_COMPANY;
            case ADMIN -> SYSTEM_ADMIN;
            case USER -> SYSTEM_USER;
        };
    }

    private String buildContext(User user) {
        return switch (user.getRole()) {
            case COMPANY -> buildCompanyContext(user);
            case ADMIN -> buildAdminContext(user);
            case USER -> buildUserContext(user);
        };
    }

    /* ============ USER context ============ */
    private String buildUserContext(User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("KULLANICI (BİREY):\n");
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

    /* ============ COMPANY context ============ */
    private String buildCompanyContext(User owner) {
        StringBuilder sb = new StringBuilder();
        Company company = companyRepository.findByOwner_Id(owner.getId()).orElse(null);

        sb.append("ŞİRKET KULLANICISI:\n");
        sb.append("- Kullanıcı: ").append(safe(owner.getFirstName())).append(" ").append(safe(owner.getLastName())).append("\n");
        if (company != null) {
            sb.append("- Şirket: ").append(company.getName()).append("\n");
            if (company.getSector() != null) sb.append("- Sektör: ").append(company.getSector()).append("\n");
            sb.append("- Onay durumu: ").append(company.isVerified() ? "ONAYLI" : "ONAY BEKLİYOR").append("\n");
        }

        if (company == null) {
            sb.append("\n(Şirket profili henüz oluşturulmamış.)\n");
            return sb.toString();
        }

        List<JobPosting> jobs = jobRepository.findAllByCompany_IdOrderByCreatedAtDesc(company.getId());
        long active = jobs.stream().filter(j -> j.getStatus() == JobStatus.ACTIVE).count();
        long draft = jobs.stream().filter(j -> j.getStatus() == JobStatus.DRAFT).count();
        sb.append("\nİLANLAR (").append(jobs.size()).append(" toplam · ")
                .append(active).append(" aktif · ").append(draft).append(" taslak):\n");
        jobs.stream().limit(8).forEach(j -> {
            long apps = applicationRepository.countByJob_Id(j.getId());
            sb.append("- [").append(j.getStatus()).append("] ").append(j.getTitle())
                    .append(" · ").append(j.getLevel())
                    .append(" · ").append(apps).append(" başvuru")
                    .append(" · ").append(j.getViewCount() == null ? 0 : j.getViewCount())
                    .append(" görüntüleme\n");
        });

        // Funnel + total apps across this company
        long total = 0, news = 0, reviewing = 0, interview = 0, offered = 0, rejected = 0;
        List<Application> topApps = new ArrayList<>();
        for (JobPosting j : jobs) {
            List<Application> jobApps = applicationRepository.findAllByJob_IdOrderByAppliedAtDesc(j.getId());
            total += jobApps.size();
            for (Application a : jobApps) {
                switch (a.getStatus()) {
                    case NEW -> news++;
                    case REVIEWING -> reviewing++;
                    case INTERVIEW -> interview++;
                    case OFFERED -> offered++;
                    case REJECTED -> rejected++;
                }
                if (a.getAiOverallScore() != null && a.getAiOverallScore() >= 70) {
                    topApps.add(a);
                }
            }
        }

        sb.append("\nFUNNEL: NEW ").append(news)
                .append(" · REVIEWING ").append(reviewing)
                .append(" · INTERVIEW ").append(interview)
                .append(" · OFFERED ").append(offered)
                .append(" · REJECTED ").append(rejected)
                .append(" · TOPLAM ").append(total).append("\n");

        if (!topApps.isEmpty()) {
            topApps.sort((a, b) -> Integer.compare(
                    b.getAiOverallScore() == null ? 0 : b.getAiOverallScore(),
                    a.getAiOverallScore() == null ? 0 : a.getAiOverallScore()));
            sb.append("\nYÜKSEK AI SKORLU ADAYLAR (>=70):\n");
            topApps.stream().limit(5).forEach(a -> sb.append("- ")
                    .append(a.getUser().getFirstName()).append(" ").append(a.getUser().getLastName())
                    .append(" · ").append(a.getJob().getTitle())
                    .append(" · AI ").append(a.getAiOverallScore()).append("/100")
                    .append(" · ").append(a.getStatus())
                    .append("\n"));
        }
        return sb.toString();
    }

    /* ============ ADMIN context ============ */
    private String buildAdminContext(User admin) {
        StringBuilder sb = new StringBuilder();
        sb.append("ADMIN KULLANICISI: ").append(safe(admin.getFirstName())).append(" ").append(safe(admin.getLastName())).append("\n");

        List<User> users = userRepository.findAll();
        long banned = users.stream().filter(User::isBanned).count();
        long verifiedEmails = users.stream().filter(User::isEmailVerified).count();
        long companies = companyRepository.count();
        long verifiedCompanies = companyRepository.findAll().stream().filter(Company::isVerified).count();
        long pendingCompanies = companies - verifiedCompanies;
        long totalJobs = jobRepository.count();
        long activeJobs = jobRepository.findAllByStatus(JobStatus.ACTIVE,
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
        long totalApps = applicationRepository.count();
        long totalAnalyses = analysisRepository.count();

        sb.append("\nPLATFORM ÖZETİ:\n");
        sb.append("- Toplam kullanıcı: ").append(users.size())
                .append(" (banlı ").append(banned).append(" · e-posta doğrulanmış ").append(verifiedEmails).append(")\n");
        sb.append("- Şirket: ").append(companies)
                .append(" (onaylı ").append(verifiedCompanies)
                .append(" · onay bekleyen ").append(pendingCompanies).append(")\n");
        sb.append("- İlan: ").append(totalJobs).append(" (aktif ").append(activeJobs).append(")\n");
        sb.append("- Başvuru: ").append(totalApps).append("\n");
        sb.append("- AI analiz: ").append(totalAnalyses).append("\n");
        return sb.toString();
    }

    /* ============ Redis IO ============ */

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
