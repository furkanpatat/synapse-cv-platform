"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Play,
  RefreshCw,
  Check,
  Star,
  Briefcase,
  Target,
  Search,
} from "lucide-react";

import {
  mockInterviewApi,
  MOCK_INTERVIEW_SECTORS,
  type MockInterviewDto,
  type MockInterviewSector,
} from "@/lib/mock-interview-api";
import { userJobsApi } from "@/lib/jobs-user-api";
import type { JobResponse } from "@/types/jobs";
import { useSpeak, useListen } from "@/lib/use-voice";
import { normaliseTechTerms } from "@/lib/transcript-cleanup";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
// Mira (mock-interview) hi-fi components — used only on the active phase.
import { WobbleFilter } from "@/components/mock-interview/WobbleFilter";
import { Stage } from "@/components/mock-interview/Stage";
import { QuestionCard } from "@/components/mock-interview/QuestionCard";
import { TranscriptCard } from "@/components/mock-interview/TranscriptCard";
import { ControlDock } from "@/components/mock-interview/ControlDock";
import { ProgressStrip } from "@/components/mock-interview/ProgressStrip";
import type { AvatarState } from "@/components/mock-interview/Avatar";
import type { ApiError } from "@/types/auth";

/** Maps the canonical Phase to the Avatar/StatusPill state union. */
function avatarStateFor(phase: Phase): AvatarState {
  if (phase === "speaking") return "speaking";
  if (phase === "listening") return "listening";
  if (phase === "between") return "between";
  if (phase === "finalizing") return "finalizing";
  // "setup" / "done" never reach the active screen, but TS needs an exit.
  return "between";
}

type Phase = "setup" | "speaking" | "listening" | "between" | "finalizing" | "done";

const LEVEL_OPTIONS: { value: "JUNIOR" | "MID" | "SENIOR" | "LEAD"; label: string }[] = [
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
];

export default function MockInterviewPage() {
  // Wizard state
  const [mode, setMode] = useState<"general" | "job">("general");
  const [sector, setSector] = useState<MockInterviewSector>("TEKNOLOJI");
  const [role, setRole] = useState("Frontend Developer");
  const [level, setLevel] = useState<"JUNIOR" | "MID" | "SENIOR" | "LEAD">("MID");
  const [muted, setMuted] = useState(false);

  // Job-specific prep state
  const [pickedJob, setPickedJob] = useState<JobResponse | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<JobResponse[]>([]);
  const [allActiveJobs, setAllActiveJobs] = useState<JobResponse[]>([]);
  const [jobSearch, setJobSearch] = useState("");

  // Pull the user's applied jobs + a sampling of active jobs when the user
  // first switches to "job" mode. Done lazily to keep the wizard light.
  useEffect(() => {
    if (mode !== "job") return;
    if (appliedJobs.length > 0 || allActiveJobs.length > 0) return;
    (async () => {
      try {
        const apps = await userJobsApi.myApplications();
        // Hydrate the application list with full job records.
        const jobs = await Promise.all(
          apps.slice(0, 20).map((a) =>
            userJobsApi.get(a.jobId).catch(() => null)
          )
        );
        setAppliedJobs(jobs.filter(Boolean) as JobResponse[]);
      } catch {}
      try {
        const list = await userJobsApi.list(0, 50);
        setAllActiveJobs(list.content);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Smart role suggestion per sector — pre-fills the input when sector changes
  // but only if the user hasn't typed a custom value yet.
  const sectorRolePlaceholders: Record<MockInterviewSector, string> = {
    TEKNOLOJI: "Frontend Developer",
    SAGLIK: "Hemşire",
    EGITIM: "İlkokul Öğretmeni",
    FINANS: "Kredi Risk Analisti",
    PAZARLAMA: "Dijital Pazarlama Uzmanı",
    TASARIM: "UX Designer",
    HUKUK: "Avukat",
    INSAN_KAYNAKLARI: "İK Uzmanı",
    OPERASYON: "Lojistik Koordinatörü",
    URETIM: "Üretim Mühendisi",
    MEDYA: "İçerik Editörü",
    SATIS: "Satış Temsilcisi",
    MUSTERI_HIZMETLERI: "Müşteri Hizmetleri Uzmanı",
    DANISMANLIK: "Yönetim Danışmanı",
  };
  const switchSector = (s: MockInterviewSector) => {
    setSector(s);
    // Replace role if it matches the previous sector's default — otherwise
    // keep the user's custom typing.
    const prevDefault = sectorRolePlaceholders[sector];
    if (role === prevDefault || role.trim() === "") {
      setRole(sectorRolePlaceholders[s]);
    }
  };

  // Active session state
  const [session, setSession] = useState<MockInterviewDto | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Voice ↔ Text hybrid input (new). Defaults to "voice" so existing
  // muscle memory still works; localStorage persists the user's pick.
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textDraft, setTextDraft] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("mi-input-mode");
    if (stored === "voice" || stored === "text") setInputMode(stored);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("mi-input-mode", inputMode);
  }, [inputMode]);

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
      const iv = await mockInterviewApi.start(
        mode === "job" && pickedJob ? pickedJob.title : role.trim(),
        level,
        sector,
        mode === "job" ? pickedJob?.id ?? null : null
      );
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
    // Voice → live transcript+interim, Text → textarea draft. Either way
    // we normalise the same way so the AI judge sees canonical terms.
    const raw =
      inputMode === "text"
        ? textDraft.trim()
        : (listen.transcript + " " + listen.interimText).trim();
    const transcript = normaliseTechTerms(raw);
    try {
      const updated = await mockInterviewApi.submit(session.id, questionIdx, transcript);
      setSession(updated);
      listen.reset();
      setTextDraft("");
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
    setTextDraft("");
  };

  // Toggle mic from the ControlDock — pauses if listening, starts otherwise.
  const toggleMic = () => {
    if (listen.listening) {
      listen.stop();
    } else {
      listen.start({ lang: "tr-TR", continuous: true, interim: true });
    }
  };

  // Manual "soruyu tekrar dinle" — re-speak the current question.
  const repeatQuestion = () => {
    if (!session || muted) return;
    void speak.speak(session.questions[questionIdx], { lang: "tr-TR", rate: 1.05 });
  };

  // Right-column "Next" enabled when we have content for the current mode.
  const canSubmit =
    inputMode === "text"
      ? textDraft.trim().length > 0
      : (listen.transcript.trim().length > 0 || listen.interimText.trim().length > 0);

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

          {/* Mode tabs */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("general")}
              className={`flex items-start gap-2.5 rounded-md border px-3 py-3 text-left transition ${
                mode === "general"
                  ? "border-ai-2 bg-ai-2/10"
                  : "border-border bg-surface-2 hover:border-text"
              }`}
            >
              <Target size={16} className="mt-0.5 text-ai-2 shrink-0" />
              <div>
                <div className="text-[13px] font-medium">Genel pratik</div>
                <div className="mt-0.5 text-[11.5px] text-text-2">
                  Sektör + rol seç, geniş hazırlık yap
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("job")}
              className={`flex items-start gap-2.5 rounded-md border px-3 py-3 text-left transition ${
                mode === "job"
                  ? "border-ai-2 bg-ai-2/10"
                  : "border-border bg-surface-2 hover:border-text"
              }`}
            >
              <Briefcase size={16} className="mt-0.5 text-ai-2 shrink-0" />
              <div>
                <div className="text-[13px] font-medium">İlana göre hazırlık</div>
                <div className="mt-0.5 text-[11.5px] text-text-2">
                  Belirli bir ilan + şirket için özel sorular
                </div>
              </div>
            </button>
          </div>

          {/* Job-specific mode: picker */}
          {mode === "job" && (
            <JobPicker
              applied={appliedJobs}
              all={allActiveJobs}
              search={jobSearch}
              setSearch={setJobSearch}
              picked={pickedJob}
              onPick={(j) => {
                setPickedJob(j);
                // Auto-derive level + role from the job; user can still
                // tweak level afterwards.
                if (j) {
                  setRole(j.title);
                  if (j.level) setLevel(j.level);
                }
              }}
            />
          )}

          <div className="mb-4">
            <span className="block mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              SEKTÖR
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {MOCK_INTERVIEW_SECTORS.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => switchSector(s.value)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-left text-[12.5px] transition ${
                    sector === s.value
                      ? "border-ai-2 bg-ai-2/10"
                      : "border-border bg-surface-2 hover:border-text"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              POZİSYON / ROL
            </span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={sectorRolePlaceholders[sector]}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
            />
            <span className="mt-1 block text-[11.5px] text-text-muted">
              Hangi pozisyon için pratik yapmak istersin? İstediğin başlığı yazabilirsin.
            </span>
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

          <Button
            onClick={startSession}
            loading={busy}
            variant="ai"
            size="lg"
            disabled={mode === "job" && !pickedJob}
          >
            <Play size={15} />{" "}
            {mode === "job" && pickedJob
              ? `${pickedJob.companyName} mülakatına başla`
              : mode === "job"
                ? "Önce ilan seç"
                : "Mülakatı başlat"}
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
  const total = session?.questions.length ?? 0;
  const avState = avatarStateFor(phase);
  const sectorMeta = MOCK_INTERVIEW_SECTORS.find((s) => s.value === sector);
  const sectorLabel = sectorMeta
    ? `${sectorMeta.icon} ${sectorMeta.label.toUpperCase()}`
    : "TEKNOLOJİ";
  const levelLabel = LEVEL_OPTIONS.find((l) => l.value === level)?.label ?? level;

  return (
    <>
      <WobbleFilter />
      <Hero />

      <ProgressStrip idx={questionIdx} total={total} state={avState} />

      <div className="grid gap-[18px] lg:grid-cols-[1.18fr_1fr]">
        {/* LEFT: stage */}
        <Stage
          state={avState}
          sector={sectorLabel}
          role={
            session?.jobPostingTitle
              ? `${session.jobPostingTitle} · ${session.jobPostingCompany ?? ""}`.trim()
              : role.trim()
          }
          level={levelLabel}
        />

        {/* RIGHT: question + transcript + controls */}
        <div className="flex flex-col gap-3.5">
          <QuestionCard
            state={avState}
            question={currentQuestion || ""}
            idx={questionIdx}
            total={total}
            muted={muted}
            onRepeat={repeatQuestion}
          />

          <TranscriptCard
            state={avState}
            inputMode={inputMode}
            finalTranscript={listen.transcript}
            interimText={listen.interimText}
            draft={textDraft}
            setDraft={setTextDraft}
          />

          {listen.error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] text-red-300">
              {listen.error}
            </div>
          )}

          <ControlDock
            state={avState}
            inputMode={inputMode}
            setInputMode={setInputMode}
            muted={muted}
            setMuted={setMuted}
            onClear={() => {
              if (inputMode === "text") setTextDraft("");
              else listen.reset();
            }}
            onNext={submitAndAdvance}
            onToggleMic={toggleMic}
            isLast={questionIdx + 1 === total}
            canSubmit={canSubmit && phase === "listening"}
            busy={busy || phase === "finalizing"}
          />

          <button
            type="button"
            onClick={restart}
            className="self-end font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted transition hover:text-text"
          >
            ✕ Vazgeç & yeniden başla
          </button>
        </div>
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
            {session.jobPostingCompany && (
              <p className="mt-1 text-[13px] text-text-2">
                <Briefcase size={12} className="inline" /> {session.jobPostingCompany}
                {" · "}
                {session.jobPostingTitle}
              </p>
            )}
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

/** Job picker for job-specific prep mode. Shows applied jobs first, then a
 *  searchable list of active jobs from the marketplace. */
function JobPicker({
  applied,
  all,
  search,
  setSearch,
  picked,
  onPick,
}: {
  applied: JobResponse[];
  all: JobResponse[];
  search: string;
  setSearch: (s: string) => void;
  picked: JobResponse | null;
  onPick: (j: JobResponse | null) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all.slice(0, 12);
    return all
      .filter((j) =>
        `${j.title} ${j.companyName}`.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [all, search]);

  if (picked) {
    return (
      <div className="mb-5 rounded-md border border-ai-2/30 bg-ai-2/5 p-4">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ai-2">
          <Briefcase size={11} /> SEÇİLEN İLAN
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-medium tracking-[-0.01em]">
              {picked.title}
            </h4>
            <p className="mt-0.5 text-[12.5px] text-text-2">
              🏢 {picked.companyName}
              {picked.city && <> · 📍 {picked.city}</>}
              {picked.level && <> · {picked.level}</>}
            </p>
            {picked.requiredSkills && picked.requiredSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {picked.requiredSkills.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-2"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted hover:text-text"
          >
            Değiştir
          </button>
        </div>
        <p className="mt-3 text-[11.5px] text-text-2 leading-snug">
          <Sparkles size={11} className="inline text-ai-2" /> AI; bu ilana özel
          5 soru hazırlayacak — şirket-kültür fit + ilan açıklamasındaki spesifik
          teknolojiler + role uygun davranışsal sorular.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 space-y-3">
      {applied.length > 0 && (
        <div>
          <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
            BAŞVURDUĞUN İLANLAR
          </div>
          <div className="space-y-1.5">
            {applied.map((j) => (
              <JobPickRow key={j.id} job={j} onPick={() => onPick(j)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
          <span>TÜM AKTİF İLANLAR</span>
        </div>
        <div className="relative mb-2">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pozisyon veya şirket ara..."
            className="w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 py-2 text-[13px] focus:border-text focus:outline-none"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-[12.5px] text-text-muted italic">
            Aramana uygun ilan yok.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
            {filtered.map((j) => (
              <JobPickRow key={j.id} job={j} onPick={() => onPick(j)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobPickRow({
  job,
  onPick,
}: {
  job: JobResponse;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-left transition hover:border-text"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{job.title}</div>
        <div className="truncate font-mono text-[11px] text-text-muted">
          {job.companyName}
          {job.level && <> · {job.level}</>}
        </div>
      </div>
      <ArrowRight size={13} className="text-text-muted shrink-0" />
    </button>
  );
}
