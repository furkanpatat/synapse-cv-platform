"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";

import { companyApi } from "@/lib/company-api";
import { aiApi } from "@/lib/ai-api";
import { JobForm } from "@/components/jobs/JobForm";
import { AiText } from "@/components/ai/AiText";
import type { ApiError } from "@/types/auth";
import type { JobLevel, JobResponse, RemoteType } from "@/types/jobs";

export default function NewJobPage() {
  const router = useRouter();

  // AI assistant state
  const [aiTitle, setAiTitle] = useState("");
  const [aiSkills, setAiSkills] = useState("");
  const [aiLevel, setAiLevel] = useState<JobLevel>("MID");
  const [aiRemote, setAiRemote] = useState<RemoteType>("HYBRID");
  const [aiNotes, setAiNotes] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Seed for re-mounting JobForm when AI fills it
  const [seed, setSeed] = useState<Partial<JobResponse> | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleGenerate = async () => {
    setAiError(null);
    setAiResult(null);
    setAiLoading(true);
    try {
      const txt = await aiApi.jobDescription({
        title: aiTitle || undefined,
        skills: aiSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        level: aiLevel,
        remoteType: aiRemote,
        notes: aiNotes || undefined,
      });
      setAiResult(txt);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setAiError(e.response?.data?.message ?? "AI cevabı alınamadı");
    } finally {
      setAiLoading(false);
    }
  };

  const applyToForm = () => {
    if (!aiResult) return;
    const skills = aiSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setSeed({
      title: aiTitle || "",
      description: aiResult,
      level: aiLevel,
      remoteType: aiRemote,
      requiredSkills: skills,
      currency: "TRY",
      status: "DRAFT",
    } as Partial<JobResponse>);
    setFormKey((k) => k + 1);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("job-form-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <>
      <Link
        href="/company/jobs"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-text-2 hover:text-text"
      >
        <ArrowLeft size={13} /> İLANLARA DÖN
      </Link>

      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Sparkles size={12} /> YENİ İLAN
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">Yeni</span> ilan oluştur
          </h1>
          <p className="page-head__sub mt-1.5">
            Doğru skill&apos;leri seçersen AI eşleştirmede üst sıralara çıkar — uyumlu
            adaylar başvurur.
          </p>
        </div>
      </div>

      {/* AI Job Description Generator */}
      <div className="mb-5 rounded-[var(--radius-lg)] border border-ai-2/40 bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg ai-grad text-white">
            <Wand2 size={14} />
          </span>
          <div>
            <h3 className="text-[14px] font-medium tracking-[-0.01em]">
              AI ile ilan açıklaması yaz
            </h3>
            <p className="text-[12px] text-text-2">
              Skill listesi ve birkaç ipucu ver, AI tüm açıklamayı senin için yazsın.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={aiTitle}
            onChange={(e) => setAiTitle(e.target.value)}
            placeholder="Rol başlığı — örn. Senior Frontend Engineer"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
          />
          <input
            value={aiSkills}
            onChange={(e) => setAiSkills(e.target.value)}
            placeholder="Skill'ler (virgülle): React, TypeScript, Next.js"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
          />
          <select
            value={aiLevel}
            onChange={(e) => setAiLevel(e.target.value as JobLevel)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
          >
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead</option>
          </select>
          <select
            value={aiRemote}
            onChange={(e) => setAiRemote(e.target.value as RemoteType)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none"
          >
            <option value="ONSITE">Ofisten</option>
            <option value="HYBRID">Hibrit</option>
            <option value="REMOTE">Uzaktan</option>
          </select>
          <input
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="Ek not (opsiyonel): kültür, teknoloji yığını vb."
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-text focus:outline-none sm:col-span-2"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiLoading}
            className="btn btn--ai btn--sm"
          >
            {aiLoading ? "AI yazıyor..." : (
              <>
                <Sparkles size={12} /> Açıklamayı üret
              </>
            )}
          </button>
          {aiResult && (
            <button
              type="button"
              onClick={applyToForm}
              className="btn btn--outline btn--sm"
            >
              ↓ Formu doldur
            </button>
          )}
        </div>

        {aiError && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
            {aiError}
          </div>
        )}

        {aiResult && (
          <div className="mt-4 rounded-md border border-border bg-bg-soft p-4">
            <AiText text={aiResult} className="text-[13.5px] leading-[1.65] text-text" />
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div
          id="job-form-card"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-7"
        >
          <JobForm
            key={formKey}
            initial={seed as JobResponse | null}
            onSubmit={async (data) => {
              const created = await companyApi.createJob(data);
              router.replace(`/company/jobs/${created.id}`);
            }}
            submitLabel="İlanı oluştur"
          />
        </div>

        {/* Sidebar tips */}
        <aside className="lg:sticky lg:top-6 space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-ai-2/30 bg-surface p-6">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
              <Sparkles size={14} className="text-ai-2" /> İyi ilan ipuçları
            </h3>
            <ul className="space-y-2.5 text-[13px] text-text-2">
              <li>
                <b className="text-text">Net başlık</b> — &quot;Senior Backend Engineer&quot;
                tarzı, jargonsuz.
              </li>
              <li>
                <b className="text-text">5-10 skill</b> — AI eşleştirme bu liste
                üzerinden çalışır; aşırı uzun listeler match&apos;i bulandırır.
              </li>
              <li>
                <b className="text-text">Maaş aralığı</b> — adayların güvenini
                arttırır, başvuru oranını yükseltir.
              </li>
              <li>
                <b className="text-text">ACTIVE durumu</b> — sadece onaylı şirket
                yayınlayabilir. Önce TASLAK olarak kaydet, sonra yayınla.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
