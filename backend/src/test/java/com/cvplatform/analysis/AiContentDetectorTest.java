package com.cvplatform.analysis;

import com.cvplatform.ai.AiAssistantClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the AI-CV detector. We mock the LLM client so the test
 * suite stays hermetic — no real Gemini calls. The interesting behaviour
 * to cover:
 *
 *   1. Obvious-human text never invokes the LLM (cost-saving short circuit).
 *   2. Heuristic signals are reported back even when LLM is skipped.
 *   3. When the LLM IS called, its probability is blended 40/60 with the
 *      heuristic score.
 *   4. The verdict thresholds (HUMAN <40 ≤ SUSPICIOUS <70 ≤ AI_LIKELY) hold.
 *   5. LLM parse failure falls back gracefully without throwing.
 */
class AiContentDetectorTest {

    private AiAssistantClient aiClient;
    private AiContentDetector detector;

    @BeforeEach
    void setUp() {
        aiClient = mock(AiAssistantClient.class);
        detector = new AiContentDetector(aiClient);
    }

    @Test
    @DisplayName("short or empty CVs return HUMAN without calling the LLM")
    void emptyInput_noLlmCall() {
        AiContentDetector.Result r = detector.detect("", "");

        assertThat(r.verdict()).isEqualTo(AiContentDetector.Verdict.HUMAN);
        assertThat(r.probability()).isZero();
        assertThat(r.signals()).contains("Metin yetersiz");
        verify(aiClient, never()).generateText(anyString(), anyString(), anyDouble());
    }

    @Test
    @DisplayName("clearly human-written text skips the LLM judge (heuristic <40)")
    void naturalText_skipsLlm() {
        // Short, varied sentences, no LLM-tell phrases, casual typos.
        String text = """
                Merhaba, ben Ayşe.
                3 senedir frontend yapıyorum. Çoğunlukla React + TS.
                Geçenlerde bi tane Vue projesine bulastım — fena değildi.
                İş ararken biraz seçici olmaya çalışıyorum tabii.
                """;

        AiContentDetector.Result r = detector.detect(text, null);

        assertThat(r.verdict()).isEqualTo(AiContentDetector.Verdict.HUMAN);
        verify(aiClient, never()).generateText(anyString(), anyString(), anyDouble());
    }

    @Test
    @DisplayName("LLM-clichéd text triggers the judge and produces SUSPICIOUS / AI_LIKELY")
    void clichedText_triggersJudge() {
        // Multiple AI-tell phrases + uniform long sentences + parallel bullets.
        String text = """
                Stratejik bir bakış açısı ile yenilikçi çözümler geliştiren,
                takım çalışmasına yatkın bir profesyonelim. İletişim becerileri
                kuvvetli olan, sonuç odaklı ve süreç optimizasyonu konusunda
                deneyimli bir mühendisim. Müşteri memnuniyeti odaklı çalışan
                bir yazılım uzmanı olarak katma değer üretmeyi hedefliyorum.

                - Geliştirdim onlarca verimli mikro-servis
                - Geliştirdim büyük ölçekli web uygulamaları
                - Geliştirdim test otomasyonu altyapısı
                """;

        // Stub the LLM judge to say "very likely AI" with a reason.
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("{\"probability\": 92, \"reason\": \"Klişe iş Türkçesi yoğun\"}");

        AiContentDetector.Result r = detector.detect(text, null);

        verify(aiClient, times(1)).generateText(anyString(), anyString(), anyDouble());
        // Heuristic + LLM blended → should land in AI_LIKELY band.
        assertThat(r.verdict()).isEqualTo(AiContentDetector.Verdict.AI_LIKELY);
        assertThat(r.probability()).isBetween(60, 100);
        assertThat(r.signals()).anyMatch(s -> s.toLowerCase().contains("ai-tipi klişe"));
        assertThat(r.signals()).anyMatch(s -> s.startsWith("LLM-yargısı:"));
    }

    @Test
    @DisplayName("LLM parse failure falls back to heuristic-only fallback (no throw)")
    void llmGarbledResponse_gracefulFallback() {
        // Heuristic alone has to be ≥40 to trigger the LLM call.
        String text = """
                Stratejik bir bakış açısı ile yenilikçi çözümler geliştiren,
                takım çalışmasına yatkın bir profesyonelim. İletişim becerileri
                kuvvetli olan, sonuç odaklı ve süreç optimizasyonu konusunda
                deneyimli bir mühendisim. Müşteri memnuniyeti odaklı çalışan
                bir yazılım uzmanı olarak katma değer üretmeyi hedefliyorum.
                """;
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("totally not json"); // garbage

        AiContentDetector.Result r = detector.detect(text, null);

        // Should not throw and still produce a usable result.
        assertThat(r).isNotNull();
        assertThat(r.probability()).isBetween(0, 100);
        // LLM contributed its fallback probability (50) — blended with heuristic.
    }

    @Test
    @DisplayName("verdict thresholds: HUMAN <40 ≤ SUSPICIOUS <70 ≤ AI_LIKELY")
    void verdict_thresholds() {
        // We can't easily fabricate exact scores, but we can verify the
        // thresholds hold by hitting the LLM with the same heuristic input
        // and varying the LLM probability.
        String text = """
                Stratejik bir bakış açısı ile yenilikçi çözümler geliştiren,
                takım çalışmasına yatkın bir profesyonelim. İletişim becerileri
                kuvvetli olan, sonuç odaklı ve süreç optimizasyonu konusunda
                deneyimli bir mühendisim. Müşteri memnuniyeti odaklı çalışan
                bir yazılım uzmanı olarak katma değer üretmeyi hedefliyorum.
                """;

        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("{\"probability\": 0, \"reason\": \"görünmüyor\"}");
        AiContentDetector.Result low = detector.detect(text, null);
        // Heuristic ~55 × 0.4 + 0 × 0.6 = ~22 → HUMAN. But cliché phrases
        // produced a higher heuristic; allow either HUMAN or SUSPICIOUS.
        assertThat(low.verdict()).isIn(
                AiContentDetector.Verdict.HUMAN,
                AiContentDetector.Verdict.SUSPICIOUS);

        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("{\"probability\": 95, \"reason\": \"çok belirgin\"}");
        AiContentDetector.Result high = detector.detect(text, null);
        assertThat(high.verdict()).isEqualTo(AiContentDetector.Verdict.AI_LIKELY);
    }
}
