package com.cvplatform.ai;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.common.ApiException;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AiAssistantService {

    private final AiAssistantClient client;
    private final UserRepository userRepository;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;
    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    /* ============ 1. AI Cover Letter ============ */
    public String generateCoverLetter(UUID userId, UUID jobId) {
        User user = mustUser(userId);
        CvDocument cv = mustCv(userId);
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));

        String system = """
                Sen profesyonel bir kariyer asistanısın. Verilen CV verisine ve iş ilanına bakarak,
                adayın bu pozisyona neden uygun olduğunu vurgulayan, samimi ve özlü bir ön yazı yaz.

                KURALLAR:
                - 150-200 kelime arası, Türkçe.
                - "Merhaba [Şirket]," ile başla.
                - 3 paragraf: tanıtım, deneyim eşleşmesi, motivasyon ve teşekkür.
                - CV'deki gerçek deneyim/projelerden 1-2 somut örnek ver.
                - Klişe ifadelerden ("dinamik takım oyuncusu" vb.) kaçın.
                - Asla yalan yazma, sadece verilen veriden yararlan.
                """;

        String userPrompt = String.format("""
                ADAY:
                İsim: %s
                Ünvan: %s
                Şehir: %s

                CV ÖZETİ:
                %s

                CV SKILL'LERİ:
                %s

                İLAN:
                Şirket: %s
                Pozisyon: %s
                Şehir/Uzaktan: %s / %s
                Seviye: %s
                Aranan Skill'ler: %s

                İLAN AÇIKLAMASI:
                %s
                """,
                fullName(user),
                user.getTitle() == null ? "—" : user.getTitle(),
                user.getCity() == null ? "—" : user.getCity(),
                truncate(cv.getSummary(), 600),
                joinList(cv.getSkills()),
                job.getCompany().getName(),
                job.getTitle(),
                job.getCity() == null ? "—" : job.getCity(),
                job.getRemoteType(),
                job.getLevel(),
                joinList(job.getRequiredSkills()),
                truncate(job.getDescription(), 1500)
        );

        return client.generateText(system, userPrompt, 0.75);
    }

    /* ============ 2. AI Bio Writer ============ */
    public String generateBio(UUID userId) {
        User user = mustUser(userId);
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);

        String system = """
                Sen profesyonel bir kariyer copywriter'ısın. CV verisinden 2-3 cümlelik bir
                'hakkımda' metni yaz.

                KURALLAR:
                - İlk şahıs ağzından, Türkçe, akıcı.
                - 40-70 kelime arası.
                - Profesyonel ama samimi ton.
                - En güçlü 1-2 yetkinliği ve deneyim alanını vurgula.
                - Klişe kelimelerden ("dinamik", "yenilikçi") kaçın.
                """;

        String topExperience = "—";
        if (cv != null && cv.getExperience() != null && !cv.getExperience().isEmpty()) {
            var first = cv.getExperience().get(0);
            topExperience = String.format("%s @ %s", first.getRole(), first.getCompany());
        }

        String userPrompt = String.format("""
                İsim: %s
                Ünvan: %s
                Son deneyim: %s
                Yetenekler: %s
                CV özeti: %s
                """,
                fullName(user),
                user.getTitle() == null ? "—" : user.getTitle(),
                topExperience,
                cv == null ? "—" : joinList(cv.getSkills()),
                cv == null ? "—" : truncate(cv.getSummary(), 400)
        );

        return client.generateText(system, userPrompt, 0.7);
    }

    /* ============ 3. AI Match Explanation ============ */
    public String generateMatchExplanation(UUID userId, UUID jobId) {
        CvDocument cv = mustCv(userId);
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        AnalysisReport analysis = analysisRepository
                .findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElse(null);

        Set<String> mine = lower(cv.getSkills());
        Set<String> required = lower(job.getRequiredSkills());
        Set<String> matched = new HashSet<>(mine);
        matched.retainAll(required);
        Set<String> missing = new HashSet<>(required);
        missing.removeAll(mine);

        int pct = required.isEmpty() ? 0 :
                (int) Math.round(100.0 * matched.size() / required.size());

        String system = """
                Sen bir İK analistisin. CV ve AI yetkinlik raporuna bakarak, adayın bu ilana neden
                belirtilen oranda uyduğunu açıkla.

                KURALLAR:
                - 3-4 cümle, Türkçe.
                - 1. cümle: güçlü yön (eşleşen kritik skill'ler).
                - 2. cümle: zayıf nokta veya eksik skill (varsa).
                - 3. cümle: aday için somut tavsiye.
                - Asla yüzde sayısını cümlede tekrar etme, sadece içerik üzerinden konuş.
                """;

        String userPrompt = String.format("""
                İLAN: %s @ %s (Seviye: %s)
                ARANAN: %s
                ADAYIN SKILL'LERİ: %s
                EŞLEŞEN: %s
                EKSİK: %s
                AI ANALIZ ÖZETİ: %s

                Eşleşme oranı: %%%d
                """,
                job.getTitle(),
                job.getCompany().getName(),
                job.getLevel(),
                joinList(job.getRequiredSkills()),
                joinList(cv.getSkills()),
                joinSet(matched),
                joinSet(missing),
                analysis == null ? "—" : truncate(analysis.getSummary(), 500),
                pct
        );

        return client.generateText(system, userPrompt, 0.6);
    }

    /* ============ 4. AI Skill Gap ============ */
    public String generateSkillGap(UUID userId, UUID jobId) {
        CvDocument cv = mustCv(userId);
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        AnalysisReport analysis = analysisRepository
                .findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElse(null);

        Set<String> mine = lower(cv.getSkills());
        Set<String> required = lower(job.getRequiredSkills());
        Set<String> missing = new HashSet<>(required);
        missing.removeAll(mine);

        // Add LOW-confidence skills from analysis as "zayıf"
        StringBuilder weak = new StringBuilder();
        if (analysis != null && analysis.getSkillScores() != null) {
            analysis.getSkillScores().stream()
                    .filter(s -> "LOW".equals(s.getConfidence()))
                    .forEach(s -> weak.append(s.getSkill()).append(", "));
        }

        String system = """
                Sen bir kariyer mentorusun. İlanda istenen ama adayda olmayan veya zayıf olan
                yetkinlikleri madde madde listele ve her biri için öğrenme önerisi yap.

                KURALLAR:
                - En fazla 5 madde, Türkçe.
                - Format: "- **[Skill]**: tek cümle öğrenme önerisi (kaynak/proje fikri)"
                - Aday için en yüksek etkili olanları seç.
                - Klişe ("kursları izle") yerine somut öneri ver (örn. "React Query ile küçük bir
                  todo uygulaması yap", "Spring Cloud Gateway resmi rehberini bitir").
                """;

        String userPrompt = String.format("""
                İLAN: %s @ %s
                ARANAN: %s
                EKSİK SKILL'LER: %s
                ZAYIF KANITLI SKILL'LER: %s
                """,
                job.getTitle(),
                job.getCompany().getName(),
                joinList(job.getRequiredSkills()),
                joinSet(missing),
                weak.length() == 0 ? "—" : weak.toString()
        );

        return client.generateText(system, userPrompt, 0.6);
    }

    /* ============ 5. AI Hiring Brief (COMPANY) ============ */
    public String generateHiringBrief(UUID applicationId, UUID companyOwnerId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND", "Application not found"));
        if (!app.getJob().getCompany().getOwner().getId().equals(companyOwnerId)) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "This application belongs to another company");
        }

        UUID candidateId = app.getUser().getId();
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(candidateId).orElse(null);
        AnalysisReport analysis = analysisRepository
                .findFirstByUserIdOrderByCreatedAtDesc(candidateId)
                .orElse(null);

        String system = """
                Sen bir hiring manager'a aday özeti sunan İK analistisin. CV ve AI yetkinlik
                raporundan yola çıkarak yapılandırılmış bir "Hiring Brief" üret.

                FORMAT:
                ## İşe Alma Nedenleri
                - madde 1 (somut delil ile)
                - madde 2
                - madde 3

                ## Potansiyel Riskler
                - madde 1
                - madde 2

                ## Tavsiye
                Tek cümlede: "Mülakata çağrılmalı / İkinci aşamaya uygun / Tereddütle bakılmalı".

                KURALLAR:
                - Türkçe.
                - Spekülasyon yapma; verilen veriye dayan.
                - Tutarsızlık varsa "Risk" bölümünde belirt.
                """;

        String userPrompt = String.format("""
                ADAY: %s %s
                İLAN: %s (Seviye: %s)
                ARANAN SKILL'LER: %s

                AI GENEL SKOR: %s/100
                AI ÖZET: %s

                CV YETKİNLİKLERİ: %s

                AI TUTARSIZLIKLAR:
                %s
                """,
                app.getUser().getFirstName(),
                app.getUser().getLastName(),
                app.getJob().getTitle(),
                app.getJob().getLevel(),
                joinList(app.getJob().getRequiredSkills()),
                analysis == null || analysis.getOverallScore() == null ? "—" : analysis.getOverallScore(),
                analysis == null ? "—" : truncate(analysis.getSummary(), 500),
                cv == null ? "—" : joinList(cv.getSkills()),
                analysis == null || analysis.getInconsistencies() == null
                        ? "Yok"
                        : analysis.getInconsistencies().stream()
                            .map(i -> "- " + i.getClaimedSkill() + " (" + i.getSeverity() + "): " + i.getIssue())
                            .collect(Collectors.joining("\n"))
        );

        return client.generateText(system, userPrompt, 0.55);
    }

    /* ============ helpers ============ */

    private User mustUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
    }

    private CvDocument mustCv(UUID userId) {
        return cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.badRequest("CV_NOT_FOUND",
                        "Upload a CV first to use AI features"));
    }

    private static String fullName(User u) {
        String n = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                + (u.getLastName() == null ? "" : u.getLastName())).trim();
        return n.isEmpty() ? u.getEmail() : n;
    }

    private static String joinList(List<String> list) {
        if (list == null || list.isEmpty()) return "—";
        return String.join(", ", list);
    }

    private static String joinSet(Set<String> set) {
        if (set == null || set.isEmpty()) return "Yok";
        return String.join(", ", set);
    }

    private static Set<String> lower(List<String> list) {
        if (list == null) return Set.of();
        return list.stream()
                .filter(Objects::nonNull)
                .map(s -> s.toLowerCase(Locale.ROOT).trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static String truncate(String s, int max) {
        if (s == null) return "—";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "...";
    }
}
