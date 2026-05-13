"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Play,
  RefreshCw,
  Check,
  Star,
  Trophy,
} from "lucide-react";

import { mockInterviewApi, type MockInterviewDto } from "@/lib/mock-interview-api";
import { useSpeak, useListen } from "@/lib/use-voice";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { ApiError } from "@/types/auth";

type Phase = "setup" | "speaking" | "listening" | "between" | "finalizing" | "done";

const LEVEL_OPTIONS: { value: "JUNIOR" | "MID" | "SENIOR" | "LEAD"; label: string }[] = [
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
];

export default function MockInterviewPage() {
  // Wizard state
  const [role, setRole] = useState("Frontend Developer");
  const [level, setLevel] = useState<"JUNIOR" | "MID" | "SENIOR" | "LEAD">("MID");
  const [muted, setMuted] = useState(false);

  // Active session state
  const [session, setSession] = useState<MockInterviewDto | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const speak = useSpeak();
  const listen = useListen();
  const speakRef = useRef(speak);
  speakRef.current = speak;

  const currentQuestion = session?.questions[questionIdx] ?? "";

  const askQuestion = async (q: string) => {
    setPhase("speaking");
    if (!muted) {
      await speakRef.current.speak(q, { lang: "tr-TR", rate: 1.05 });
    }
    setPhase("listening");
    listen.start({ lang: "tr-TR", continuous: true, interim: true });
  };

  // When a new session arrives, kick off the first question.
  useEffect(() => {
    if (session && phase === "setup") {
      setQuestionIdx(0);
      askQuestion(session.questions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const startSession = async () => {
    setError(null);
    setBusy(true);
    try {
      const iv = await mockInterviewApi.start(role.trim(), level);
      setSession(iv);
      // useEffect above triggers askQuestion(0)
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Mülakat başlatılamadı");
    } finally {
      setBusy(false);
    }
  };

  const submitAndAdvance = async () => {
    if (!session) return;
    listen.stop();
    setPhase("between");
    setBusy(true);
    const transcript = (listen.transcript + " " + listen.interimText).trim();
    try {
      const updated = await mockInterviewApi.submit(session.id, questionIdx, transcript);
      setSession(updated);
      listen.reset();
      const next = questionIdx + 1;
      if (next >= updated.questions.length) {
        // Finalize
        setPhase("finalizing");
        const finalSession = await mockInterviewApi.finalize(updated.id);
        setSession(finalSession);
        setPhase("done");
        if (!muted) {
          await speakRef.current.speak(
            `Mülakat tamam, genel skorun ${finalSession.overallScore ?? 0} üzerinden 100. ` +
              "Detaylı geri bildirimi aşağıda görebilirsin.",
            { lang: "tr-TR" }
          );
        }
      } else {
        setQuestionIdx(next);
        await askQuestion(updated.questions[next]);
      }
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Cevap kaydedilemedi");
      setPhase("listening");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    listen.stop();
    listen.reset();
    speak.cancel();
    setSession(null);
    setPhase("setup");
    setQuestionIdx(0);
    setError(null);
  };

  const liveCaption = useMemo(() => {
    const f = listen.transcript;
    const i = listen.interimText;
    if (!f && !i) return "";
    return (f ? f + " " : "") + (i ? "[ " + i + " ]" : "");
  }, [listen.transcript, listen.interimText]);

  // =================== SETUP ===================
  if (phase === "setup") {
    return (
      <>
        <Hero />
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 max-w-2xl">
          <h2 className="mb-1 text-[18px] font-semibold tracking-[-0.02em]">
            <Sparkles size={16} className="inline text-ai-2" /> Yeni pratik
            mülakatı
          </h2>
          <p className="mb-5 text-[13px] text-text-2">
            AI senin için 5 soru üretecek, hem sesli soracak hem cevaplarını
            dinleyip değerlendirecek. Mikrofon iznine ihtiyacımız var.
          </p>

          <label className="block mb-4">
            <span className="block mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              POZİSYON
            </span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="ör. Frontend Developer, Data Engineer..."
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
            />
          </label>

          <div className="mb-5">
            <span className="block mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              SEVİYE
            </span>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setLevel(o.value)}
                  className={`pill ${level === o.value ? "pill--ai" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 text-[12.5px] text-text-2">
            <input
              id="muteToggle"
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
            />
            <label htmlFor="muteToggle">
              Sessiz modda çalıştır (AI soruyu sesli sormaz, sadece yazılı gösterir)
            </label>
          </div>

          {error && (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          {!speak.supported && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-[12.5px] text-amber-300">
              Tarayıcın TTS desteklemiyor — soruyu yine yazılı göreceksin.
            </div>
          )}
          {!listen.supported && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-[12.5px] text-amber-300">
              Tarayıcın mikrofon tanımayı desteklemiyor — Chrome veya Edge öner.
              Cevaplarını yine yazabilirsin.
            </div>
          )}

          <Button onClick={startSession} loading={busy} variant="ai" size="lg">
            <Play size={15} /> Mülakatı başlat
          </Button>
        </div>
      </>
    );
  }

  // =================== DONE ===================
  if (phase === "done" && session) {
    return (
      <>
        <Hero />
        <ReportView session={session} onRestart={restart} />
      </>
    );
  }

  // =================== ACTIVE (speaking/listening/between/finalizing) ===================
  return (
    <>
      <Hero />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT: question + transcript */}
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              <span>SORU {questionIdx + 1} / {session?.questions.length}</span>
              <span>
                {phase === "speaking" && (<><Volume2 size={11} className="inline text-ai-2 animate-pulse" /> AI konuşuyor...</>)}
                {phase === "listening" && (<><Mic size={11} className="inline text-emerald-400" /> Dinleniyor</>)}
                {phase === "between" && "Kaydediliyor..."}
                {phase === "finalizing" && "AI değerlendiriyor..."}
              </span>
            </div>
            <p className="text-[18px] leading-snug font-medium tracking-[-0.015em]">
              {currentQuestion || "Yükleniyor..."}
            </p>
            {muted && (
              <p className="mt-2 text-[12px] text-text-muted">
                Sessiz mod — soruyu sesli sormadım, hazır olduğunda cevapla.
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 min-h-[180px]">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              CANLI TRANSKRİPT
            </div>
            <p className="text-[15px] leading-[1.6] whitespace-pre-wrap text-text">
              {liveCaption || (
                <span className="text-text-muted italic">
                  Konuşmaya başla — sözlerin anlık olarak buraya yazılacak.
                </span>
              )}
            </p>
          </div>

          {listen.error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] text-red-300">
              {listen.error}
            </div>
          )}
        </div>

        {/* RIGHT: controls + nav */}
        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-ai-2/40 bg-surface p-5">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              KONTROL
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => (listen.listening ? listen.stop() : listen.start({ lang: "tr-TR" }))}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface-2 p-3 hover:border-text"
                disabled={phase === "speaking" || phase === "finalizing"}
              >
                {listen.listening ? <Mic size={18} className="text-emerald-400" /> : <MicOff size={18} />}
                <span className="text-[11px]">{listen.listening ? "Dinleniyor" : "Mikrofon"}</span>
              </button>
              <button
                type="button"
                onClick={() => (speak.speaking ? speak.cancel() : speak.speak(currentQuestion))}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface-2 p-3 hover:border-text"
                disabled={muted}
              >
                {speak.speaking ? <Volume2 size={18} className="text-ai-2 animate-pulse" /> : <VolumeX size={18} />}
                <span className="text-[11px]">Tekrar dinle</span>
              </button>
              <button
                type="button"
                onClick={() => listen.reset()}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface-2 p-3 hover:border-text"
                disabled={phase !== "listening"}
              >
                <RefreshCw size={18} />
                <span className="text-[11px]">Temizle</span>
              </button>
            </div>
          </div>

          <Button
            onClick={submitAndAdvance}
            loading={busy || phase === "finalizing"}
            variant="ai"
            size="lg"
            className="w-full"
            disabled={
              phase !== "listening" || (!listen.transcript && !listen.interimText)
            }
          >
            {questionIdx + 1 === session?.questions.length ? (
              <>
                <Trophy size={15} /> Bitir & değerlendir
              </>
            ) : (
              <>
                Sonraki soru <ArrowRight size={15} />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={restart}
            className="btn btn--ghost btn--sm w-full"
          >
            Vazgeç & yeniden başla
          </button>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              İLERLEME
            </div>
            <div className="flex gap-1">
              {session?.questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < questionIdx
                      ? "bg-emerald-400"
                      : i === questionIdx
                        ? "bg-ai-2"
                        : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] text-text-2">
              <span className="font-mono text-text">
                {role.trim()} · {LEVEL_OPTIONS.find((l) => l.value === level)?.label}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Hero() {
  return (
    <div className="page-head">
      <div>
        <div className="page-head__crumbs">
          <Mic size={12} /> AI MÜLAKAT KOÇU
        </div>
        <h1 className="page-head__title">
          Sesli <span className="ai-text">mülakat pratiği</span>
        </h1>
        <p className="page-head__sub mt-1.5">
          AI sana role özel sorular sorar, mikrofonla cevaplarsın. Sonunda
          STAR formatı uyumu, güçlü/zayıf yönler ve genel skor verir.
        </p>
      </div>
    </div>
  );
}

function ReportView({
  session,
  onRestart,
}: {
  session: MockInterviewDto;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Score banner */}
      <div className="card--grad-border">
        <div className="card__inner flex flex-wrap items-center gap-6">
          <ScoreRing score={session.overallScore ?? 0} size="xl" animate />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              GENEL SKOR
            </div>
            <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.025em]">
              {session.roleTitle} · {session.level}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="pill pill--ai">
                <Star size={11} /> STAR uyumu: {session.starCompliance ?? 0}/100
              </span>
              <span className="pill">
                <Check size={11} /> {session.questions.length} soru
              </span>
            </div>
          </div>
          <button onClick={onRestart} className="btn btn--outline btn--sm">
            <RefreshCw size={13} /> Yeni pratik
          </button>
        </div>
      </div>

      {/* Summary */}
      {session.overallSummary && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            <Sparkles size={11} className="inline text-ai-2" /> AI GENEL DEĞERLENDİRME
          </div>
          <p className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-text">
            {session.overallSummary}
          </p>
        </div>
      )}

      {/* Per-question breakdown */}
      {session.questions.map((q, i) => {
        const scoreObj = session.perQuestionScores?.[i];
        const answer = session.answers[i];
        return (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
          >
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              <span>SORU {i + 1}</span>
              {scoreObj && (
                <span className={`pill ${scoreObj.score >= 70 ? "pill--ai" : ""}`}>
                  {scoreObj.score}/100
                </span>
              )}
            </div>
            <p className="mb-3 text-[15px] font-medium">{q}</p>

            <div className="mb-3">
              <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                Cevabın
              </div>
              <p className="rounded-md bg-surface-2 p-3 text-[13.5px] leading-snug text-text-2">
                {answer || <span className="italic text-text-muted">(boş bırakıldı)</span>}
              </p>
            </div>

            {scoreObj && (
              <>
                <p className="mb-3 text-[13.5px] leading-snug text-text">
                  <Sparkles size={11} className="inline text-ai-2" /> {scoreObj.feedback}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scoreObj.strengths?.length > 0 && (
                    <div>
                      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-emerald-400">
                        Güçlü yönler
                      </div>
                      <ul className="space-y-1 text-[13px] text-text-2">
                        {scoreObj.strengths.map((s, k) => (
                          <li key={k}>+ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scoreObj.gaps?.length > 0 && (
                    <div>
                      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-amber-400">
                        Geliştirilecek
                      </div>
                      <ul className="space-y-1 text-[13px] text-text-2">
                        {scoreObj.gaps.map((s, k) => (
                          <li key={k}>! {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
