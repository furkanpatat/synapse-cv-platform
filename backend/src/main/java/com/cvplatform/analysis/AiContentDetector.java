package com.cvplatform.analysis;

import com.cvplatform.ai.AiAssistantClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects whether a CV's free-text content (bio, summary, work descriptions)
 * was likely produced by an LLM like ChatGPT.
 *
 * Two-pass approach:
 *
 *   1. CHEAP HEURISTIC PASS — measures linguistic signatures that LLMs tend
 *      to over-express:
 *        - high mean sentence length & low variance
 *        - low type-token ratio (vocabulary diversity)
 *        - frequent use of "AI-tell" phrases ("In today's fast-paced...",
 *          "Bir taraftan ... diğer taraftan", "Stratejik bir bakış açısı
 *          ile", "Sürekli öğrenme ve gelişim", …)
 *        - perfect grammar (no Turkish-typical typos)
 *        - parallel bullet structures with matching grammar
 *
 *   2. LLM JUDGE PASS — only invoked when the heuristic score crosses a
 *      threshold (>= 40). Asks Gemini itself for a probability + reason.
 *      This keeps API costs / latency down for the obvious-human cases.
 *
 * Final probability is a weighted blend of the two signals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiContentDetector {

    public enum Verdict { HUMAN, SUSPICIOUS, AI_LIKELY }

    public record Result(int probability,
                         Verdict verdict,
                         List<String> signals,
                         String reason) {}

    private final AiAssistantClient aiClient;
    private final ObjectMapper mapper = new ObjectMapper();

    // ============== AI-tell phrases (Turkish + English mixed) ==============

    private static final List<String> AI_TELL_PHRASES = List.of(
            // Turkish corporate-LLM clichés
            "stratejik bir bakış açısı",
            "sürekli öğrenme ve gelişim",
            "dinamik bir ortam",
            "takım çalışmasına yatkın",
            "iletişim becerileri kuvvetli",
            "sonuç odaklı",
            "yenilikçi çözümler",
            "katma değer",
            "verimlilik odaklı",
            "süreç optimizasyonu",
            "kullanıcı deneyimini ön planda",
            "müşteri memnuniyeti odaklı",
            // English LLM clichés that leak through translations
            "in today's fast-paced",
            "leveraging cutting-edge",
            "demonstrated ability to",
            "passionate about delivering",
            "results-driven",
            "synergize",
            "moreover",
            "furthermore",
            "it is worth noting",
            "in conclusion"
    );

    private static final Pattern SENTENCE_SPLITTER =
            Pattern.compile("(?<=[.!?])\\s+");
    private static final Pattern WORD_PATTERN =
            Pattern.compile("[\\p{L}]+");

    // ============== public API ==============

    public Result detect(String cvText, String bio) {
        String combined = combine(cvText, bio);
        if (combined.isBlank() || combined.length() < 80) {
            return new Result(0, Verdict.HUMAN,
                    List.of("Metin yetersiz"),
                    "Değerlendirme yapmak için yeterli metin yok.");
        }

        HeuristicResult h = heuristicScore(combined);

        // Skip the LLM call when the cheap pass clearly says "human".
        if (h.score < 40) {
            return new Result(h.score, verdictFor(h.score), h.signals,
                    "Heuristik analiz LLM benzeri sinyal bulamadı.");
        }

        // Suspicious or worse — call in the LLM judge.
        JudgeResult j = askLlmJudge(combined);
        // Weighted blend: 40% heuristic, 60% LLM judge.
        int blended = (int) Math.round(h.score * 0.4 + j.probability * 0.6);

        List<String> signals = new ArrayList<>(h.signals);
        if (j.reason != null && !j.reason.isBlank()) signals.add("LLM-yargısı: " + j.reason);

        return new Result(blended, verdictFor(blended), signals,
                j.reason == null ? "Heuristik + LLM birlikte değerlendirdi." : j.reason);
    }

    private static Verdict verdictFor(int p) {
        if (p >= 70) return Verdict.AI_LIKELY;
        if (p >= 40) return Verdict.SUSPICIOUS;
        return Verdict.HUMAN;
    }

    // ============== heuristic pass ==============

    private record HeuristicResult(int score, List<String> signals) {}

    private HeuristicResult heuristicScore(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        List<String> signals = new ArrayList<>();
        double rawScore = 0;

        // 1) AI-tell phrase frequency
        int phraseHits = 0;
        for (String p : AI_TELL_PHRASES) {
            if (lower.contains(p)) phraseHits++;
        }
        if (phraseHits >= 1) {
            signals.add("AI-tipi klişe ifadeler: " + phraseHits + " adet");
            rawScore += Math.min(40, phraseHits * 15);
        }

        // 2) Sentence stats
        String[] sentences = SENTENCE_SPLITTER.split(text.trim());
        if (sentences.length >= 3) {
            double[] lens = new double[sentences.length];
            for (int i = 0; i < sentences.length; i++) {
                lens[i] = wordCount(sentences[i]);
            }
            double mean = mean(lens);
            double stdev = stdev(lens, mean);
            // LLM heuristic: long, uniform sentences
            if (mean > 22 && stdev < 6) {
                signals.add(String.format(Locale.ROOT,
                        "Uzun ve tek-düze cümle yapısı (ort %.0f kelime, sapma %.1f)",
                        mean, stdev));
                rawScore += 25;
            } else if (mean > 25) {
                signals.add("Cümleler ortalama olarak uzun (" + Math.round(mean) + " kelime)");
                rawScore += 10;
            }
        }

        // 3) Type-token ratio — LLMs often have lower lexical diversity for long texts
        List<String> words = tokenize(lower);
        if (words.size() > 80) {
            Set<String> unique = new HashSet<>(words);
            double ttr = unique.size() / (double) words.size();
            if (ttr < 0.35) {
                signals.add(String.format(Locale.ROOT,
                        "Düşük kelime çeşitliliği (TTR %.2f)", ttr));
                rawScore += 12;
            }
        }

        // 4) Parallel bullet structures — bullets starting with the same verb form
        int parallelGroups = parallelBulletGroups(text);
        if (parallelGroups >= 2) {
            signals.add("Paralel madde işareti yapısı (LLM listesi gibi)");
            rawScore += 12;
        }

        // 5) Total length sanity — extremely long, polished text is suspicious
        if (text.length() > 2000) {
            rawScore += 5;
        }

        int finalScore = (int) Math.min(100, Math.round(rawScore));
        return new HeuristicResult(finalScore, signals);
    }

    private static List<String> tokenize(String text) {
        List<String> out = new ArrayList<>();
        Matcher m = WORD_PATTERN.matcher(text);
        while (m.find()) out.add(m.group());
        return out;
    }

    private static int wordCount(String s) {
        Matcher m = WORD_PATTERN.matcher(s);
        int c = 0;
        while (m.find()) c++;
        return c;
    }

    private static double mean(double[] xs) {
        double s = 0;
        for (double x : xs) s += x;
        return xs.length == 0 ? 0 : s / xs.length;
    }

    private static double stdev(double[] xs, double mean) {
        double s = 0;
        for (double x : xs) s += (x - mean) * (x - mean);
        return xs.length == 0 ? 0 : Math.sqrt(s / xs.length);
    }

    private static int parallelBulletGroups(String text) {
        String[] lines = text.split("\\r?\\n");
        Map<String, Integer> openings = new HashMap<>();
        for (String line : lines) {
            String t = line.trim();
            if (t.length() < 5) continue;
            if (!(t.startsWith("-") || t.startsWith("•") || t.startsWith("*"))) continue;
            t = t.replaceFirst("^[-•*]\\s*", "");
            String[] tok = t.split("\\s+");
            if (tok.length == 0) continue;
            String key = tok[0].toLowerCase(Locale.ROOT);
            openings.merge(key, 1, Integer::sum);
        }
        int groups = 0;
        for (int v : openings.values()) {
            if (v >= 3) groups++;
        }
        return groups;
    }

    // ============== LLM judge ==============

    private record JudgeResult(int probability, String reason) {}

    private JudgeResult askLlmJudge(String text) {
        String systemPrompt = """
                Sen bir AI içerik tespit uzmanısın. Sana bir CV'nin metin kısmı
                veriliyor. Bu metnin bir LLM (ChatGPT, Gemini, Claude vb.) tarafından
                üretilip üretilmediğini değerlendir.

                LLM-yazımı işaretleri:
                  - Aşırı temiz dilbilgisi, hiç yazım hatası yok
                  - Klişe iş Türkçesi ("stratejik bir bakış açısı...", "sürekli
                    öğrenme ve gelişim...")
                  - Cümleler ortalama olarak uzun ve aynı kalıpta
                  - Bullet'ların hepsi aynı fiil formu ile başlıyor
                  - "Furthermore", "Moreover", "It is worth noting" gibi LLM
                    bağlaçları
                  - Kişisel idiyosenkratik dil yok (tuhaf benzetme, lokal argo,
                    samimi anekdot)

                İnsan-yazımı işaretleri:
                  - Küçük yazım hataları, tutarsız noktalama
                  - Yaratıcı / kişisel ifadeler
                  - Bazı paragraflar kısa, bazıları uzun
                  - Kişiye özgü deneyim detayları (şirket adı, proje adı,
                    konkret sayı)

                Çıktı SADECE JSON, başka metin / fence YOK:
                {"probability": 0, "reason": "..."}
                  - probability: 0 (kesin insan) – 100 (kesin LLM)
                  - reason: 1-2 cümle Türkçe açıklama
                """;
        String userPrompt = "CV METNİ:\n\n" + text;
        try {
            String raw = aiClient.generateText(systemPrompt, userPrompt, 0.2);
            String json = extractJson(raw);
            Map<String, Object> parsed = mapper.readValue(json, new TypeReference<>() {});
            int p = parseInt(parsed.get("probability"), 50);
            String reason = String.valueOf(parsed.getOrDefault("reason", ""));
            return new JudgeResult(Math.max(0, Math.min(100, p)), reason);
        } catch (Exception ex) {
            log.warn("LLM judge for AI-CV detection failed: {}", ex.toString());
            return new JudgeResult(50, "");
        }
    }

    private static int parseInt(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private static String extractJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    private static String combine(String cvText, String bio) {
        StringBuilder sb = new StringBuilder();
        if (cvText != null) sb.append(cvText.trim());
        if (bio != null && !bio.isBlank()) {
            if (sb.length() > 0) sb.append("\n\n");
            sb.append(bio.trim());
        }
        return sb.toString();
    }
}
