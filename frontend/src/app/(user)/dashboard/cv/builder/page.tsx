"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import { cvApi } from "@/lib/cv-api";
import { aiApi } from "@/lib/ai-api";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type {
  CvResponse,
  CvPersonal,
  CvEducation,
  CvExperience,
  CvProject,
} from "@/types/cv";
import type { ApiError } from "@/types/auth";

// ─── Form shape ─────────────────────────────────────────────────────────

interface BuilderState {
  personal: CvPersonal;
  summary: string;
  skillsCsv: string;
  languagesCsv: string;
  education: CvEducation[];
  experience: CvExperience[];
  projects: CvProject[];
}

const EMPTY: BuilderState = {
  personal: { name: "", email: "", phone: "", location: "" },
  summary: "",
  skillsCsv: "",
  languagesCsv: "",
  education: [],
  experience: [],
  projects: [],
};

const DRAFT_KEY = "cv-builder-draft";

// ─── Page ───────────────────────────────────────────────────────────────

export default function CvBuilderPage() {
  const [s, setS] = useState<BuilderState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: prefer localStorage draft (so refresh doesn't drop work),
  // otherwise hydrate from the user's existing CV if any.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const draft = window.localStorage.getItem(DRAFT_KEY);
        if (draft) {
          setS(JSON.parse(draft) as BuilderState);
          setLoading(false);
          return;
        }
        const cv = await cvApi.me().catch(() => null);
        if (!cancelled && cv) setS(fromCv(cv));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-persist draft to localStorage (debounced).
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
    }, 400);
  }, [s, loading]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const cv = await cvApi.saveBuilder(toCv(s));
      // Re-hydrate from server response so canonical IDs / dates align.
      setS(fromCv(cv));
      window.localStorage.removeItem(DRAFT_KEY);
      toast.ai("✓ CV kaydedildi", "Ana CV'n olarak ayarlandı — analiz ve eşleşmelerde kullanılır.");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    if (!confirm("Tüm taslağı silmek istediğinden emin misin?")) return;
    setS(EMPTY);
    window.localStorage.removeItem(DRAFT_KEY);
  };

  const printPdf = () => {
    // The page has a @media print stylesheet that hides everything except
    // .cv-print, so window.print() yields a clean one-page PDF.
    window.print();
  };

  if (loading) {
    return (
      <p className="text-sm text-text-muted">Builder yükleniyor...</p>
    );
  }

  return (
    <>
      {/* Page-local print stylesheet — hides the shell + form, shows only
          the preview pane in print/PDF output. */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .cv-print, .cv-print * { visibility: visible !important; }
          .cv-print {
            position: absolute !important;
            inset: 0 !important;
            background: #fff !important;
            color: #111 !important;
            padding: 28px 36px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .cv-print .cv-print-section h2 { color: #111 !important; }
          .cv-print .cv-print-section { border-color: #ddd !important; }
        }
      `}</style>

      <div className="page-head no-print">
        <div>
          <div className="page-head__crumbs">
            <Link href="/dashboard/cv" className="inline-flex items-center gap-1 hover:text-text">
              <ArrowLeft size={11} /> CV
            </Link>
            <span className="mx-1.5 text-text-muted">/</span>
            <FileText size={11} /> CV BUILDER
          </div>
          <h1 className="page-head__title">
            CV&apos;ni sıfırdan <span className="ai-text">oluştur</span>
          </h1>
          <p className="page-head__sub mt-1.5">
            Bölüm bölüm doldur, sağda canlı önizleme. Her metin alanı için AI
            yardımcı — kelimeleri vurucu, ATS-dostu hale getir. PDF olarak
            indir ya da doğrudan ana CV&apos;n olarak kaydet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={resetDraft} className="btn btn--ghost btn--sm">
            <RotateCcw size={12} /> Sıfırla
          </button>
          <button type="button" onClick={printPdf} className="btn btn--outline btn--sm">
            <Printer size={12} /> PDF olarak indir
          </button>
          <Button onClick={save} loading={saving} variant="ai" size="sm">
            <Save size={13} /> Ana CV olarak kaydet
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 no-print">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr] no-print">
        <BuilderForm state={s} setState={setS} />
        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <CvPreview state={s} className="cv-print" />
        </aside>
      </div>

      {/* Hidden preview that prints clean even on smaller viewports
          (mobile users probably won't print, but defensive). */}
      <div className="hidden print:block">
        <CvPreview state={s} className="cv-print" />
      </div>
    </>
  );
}

// ─── Form ───────────────────────────────────────────────────────────────

function BuilderForm({
  state,
  setState,
}: {
  state: BuilderState;
  setState: (s: BuilderState) => void;
}) {
  const setPersonal = (patch: Partial<CvPersonal>) =>
    setState({ ...state, personal: { ...state.personal, ...patch } });

  return (
    <div className="space-y-4">
      <Section title="Kişisel">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Ad Soyad"
            value={state.personal.name ?? ""}
            onChange={(v) => setPersonal({ name: v })}
            placeholder="Ayşe Yılmaz"
          />
          <TextInput
            label="E-posta"
            value={state.personal.email ?? ""}
            onChange={(v) => setPersonal({ email: v })}
            placeholder="ornek@email.com"
          />
          <TextInput
            label="Telefon"
            value={state.personal.phone ?? ""}
            onChange={(v) => setPersonal({ phone: v })}
            placeholder="+90 555 000 0000"
          />
          <TextInput
            label="Konum"
            value={state.personal.location ?? ""}
            onChange={(v) => setPersonal({ location: v })}
            placeholder="İstanbul, Türkiye"
          />
        </div>
      </Section>

      <Section title="Özet">
        <TextareaWithAi
          rows={4}
          value={state.summary}
          onChange={(v) => setState({ ...state, summary: v })}
          placeholder="2-3 cümle: hedef rolün + en güçlü yanların."
          aiSection="summary"
        />
      </Section>

      <Section title="Yetkinlikler">
        <TextInput
          label="Skill'ler (virgülle ayır)"
          value={state.skillsCsv}
          onChange={(v) => setState({ ...state, skillsCsv: v })}
          placeholder="React, TypeScript, Node.js, PostgreSQL"
        />
        <p className="mt-1 text-[11.5px] text-text-muted">
          Önizlemede chip olarak görünür. Skill graph ve iş eşleşmelerinde
          de kullanılır.
        </p>
      </Section>

      <Section title="Diller">
        <TextInput
          label="Diller (virgülle ayır)"
          value={state.languagesCsv}
          onChange={(v) => setState({ ...state, languagesCsv: v })}
          placeholder="Türkçe (anadil), İngilizce (C1)"
        />
      </Section>

      <Section title="Deneyim">
        <RepeaterList
          items={state.experience}
          empty={{
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            description: "",
          }}
          onChange={(arr) => setState({ ...state, experience: arr })}
          render={(item, set) => (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  label="Pozisyon"
                  value={item.role ?? ""}
                  onChange={(v) => set({ ...item, role: v })}
                  placeholder="Senior Frontend Developer"
                />
                <TextInput
                  label="Şirket"
                  value={item.company ?? ""}
                  onChange={(v) => set({ ...item, company: v })}
                  placeholder="TechNova"
                />
                <TextInput
                  label="Başlangıç"
                  value={item.startDate ?? ""}
                  onChange={(v) => set({ ...item, startDate: v })}
                  placeholder="2022-03"
                />
                <TextInput
                  label="Bitiş"
                  value={item.endDate ?? ""}
                  onChange={(v) => set({ ...item, endDate: v })}
                  placeholder="Devam ediyor"
                />
              </div>
              <TextareaWithAi
                rows={5}
                value={item.description ?? ""}
                onChange={(v) => set({ ...item, description: v })}
                placeholder="• Hangi problemi çözdün, hangi teknolojiyle, sonucu ne oldu (rakam ekle)."
                aiSection="experience"
                aiContext={`${item.role ?? ""} @ ${item.company ?? ""}`}
              />
            </div>
          )}
          addLabel="+ Yeni deneyim"
        />
      </Section>

      <Section title="Eğitim">
        <RepeaterList
          items={state.education}
          empty={{
            school: "",
            degree: "",
            field: "",
            startYear: "",
            endYear: "",
          }}
          onChange={(arr) => setState({ ...state, education: arr })}
          render={(item, set) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput
                label="Okul"
                value={item.school ?? ""}
                onChange={(v) => set({ ...item, school: v })}
                placeholder="Süleyman Demirel Üniversitesi"
              />
              <TextInput
                label="Derece"
                value={item.degree ?? ""}
                onChange={(v) => set({ ...item, degree: v })}
                placeholder="Lisans"
              />
              <TextInput
                label="Bölüm"
                value={item.field ?? ""}
                onChange={(v) => set({ ...item, field: v })}
                placeholder="Bilgisayar Mühendisliği"
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Başlangıç yılı"
                  value={item.startYear ?? ""}
                  onChange={(v) => set({ ...item, startYear: v })}
                  placeholder="2020"
                />
                <TextInput
                  label="Bitiş yılı"
                  value={item.endYear ?? ""}
                  onChange={(v) => set({ ...item, endYear: v })}
                  placeholder="2024"
                />
              </div>
            </div>
          )}
          addLabel="+ Yeni eğitim"
        />
      </Section>

      <Section title="Projeler">
        <RepeaterList
          items={state.projects}
          empty={{ name: "", description: "", technologies: [] }}
          onChange={(arr) => setState({ ...state, projects: arr })}
          render={(item, set) => (
            <div className="space-y-3">
              <TextInput
                label="Proje adı"
                value={item.name ?? ""}
                onChange={(v) => set({ ...item, name: v })}
                placeholder="Synapse"
              />
              <TextInput
                label="Teknolojiler (virgülle ayır)"
                value={(item.technologies ?? []).join(", ")}
                onChange={(v) =>
                  set({
                    ...item,
                    technologies: v
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Next.js, Spring Boot, Gemini"
              />
              <TextareaWithAi
                rows={3}
                value={item.description ?? ""}
                onChange={(v) => set({ ...item, description: v })}
                placeholder="1-2 cümle: ne yaptığı + senin rolün + sonuç."
                aiSection="project"
                aiContext={`${item.name ?? ""} · ${(item.technologies ?? []).join(", ")}`}
              />
            </div>
          )}
          addLabel="+ Yeni proje"
        />
      </Section>
    </div>
  );
}

// ─── Preview (also the print artifact) ──────────────────────────────────

function CvPreview({
  state,
  className,
}: {
  state: BuilderState;
  className?: string;
}) {
  const skills = state.skillsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const languages = state.languagesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-border bg-surface p-7 text-[13.5px] leading-[1.55] text-text ${
        className ?? ""
      }`}
    >
      {/* Header */}
      <header className="border-b border-border pb-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
          {state.personal.name || "Ad Soyad"}
        </h2>
        <p className="mt-1 font-mono text-[11.5px] text-text-muted">
          {[state.personal.email, state.personal.phone, state.personal.location]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {/* Summary */}
      {state.summary && (
        <PreviewSection title="Özet">
          <p className="text-text-2">{state.summary}</p>
        </PreviewSection>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <PreviewSection title="Yetkinlikler">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-sm bg-ai-2/10 px-1.5 py-0.5 font-mono text-[11px] text-ai-2"
              >
                {s}
              </span>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Experience */}
      {state.experience.length > 0 && (
        <PreviewSection title="Deneyim">
          <ul className="space-y-3">
            {state.experience.map((x, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-text">
                    {x.role || "Pozisyon"}
                    {x.company && (
                      <>
                        {" — "}
                        <span className="font-normal text-text-2">{x.company}</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[10.5px] text-text-muted whitespace-nowrap">
                    {x.startDate} – {x.endDate || "şu an"}
                  </span>
                </div>
                {x.description && (
                  <p className="mt-1 whitespace-pre-wrap text-text-2">{x.description}</p>
                )}
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Education */}
      {state.education.length > 0 && (
        <PreviewSection title="Eğitim">
          <ul className="space-y-2">
            {state.education.map((e, i) => (
              <li key={i} className="flex items-baseline justify-between">
                <span>
                  <span className="font-medium text-text">
                    {e.degree} {e.field}
                  </span>
                  {e.school && <span className="text-text-2"> — {e.school}</span>}
                </span>
                <span className="font-mono text-[10.5px] text-text-muted whitespace-nowrap">
                  {e.startYear} – {e.endYear}
                </span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Projects */}
      {state.projects.length > 0 && (
        <PreviewSection title="Projeler">
          <ul className="space-y-3">
            {state.projects.map((p, i) => (
              <li key={i}>
                <span className="font-medium text-text">{p.name}</span>
                {p.description && (
                  <p className="mt-0.5 text-text-2">{p.description}</p>
                )}
                {p.technologies && p.technologies.length > 0 && (
                  <p className="mt-1 font-mono text-[10.5px] text-text-muted">
                    {p.technologies.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <PreviewSection title="Diller">
          <p className="text-text-2">{languages.join(" · ")}</p>
        </PreviewSection>
      )}
    </div>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cv-print-section mt-4 border-t border-border pt-3">
      <h2 className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Reusable form bits ─────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {title}
        </span>
        {open ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
      </button>
      {open && <div className="border-t border-border p-5">{children}</div>}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-text focus:outline-none"
      />
    </label>
  );
}

function TextareaWithAi({
  value,
  onChange,
  placeholder,
  rows = 4,
  aiSection,
  aiContext,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  aiSection: "summary" | "experience" | "project" | "bullet";
  aiContext?: string;
}) {
  const [polishing, setPolishing] = useState(false);
  const polish = async () => {
    if (!value.trim()) {
      toast.info("Önce bir şeyler yaz — AI uydurmaz, sadece zenginleştirir.");
      return;
    }
    setPolishing(true);
    try {
      const next = await aiApi.rewriteCv(aiSection, value, aiContext);
      onChange(next);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("AI yardımcısı çalışmadı", e.response?.data?.message ?? "");
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 pr-[124px] text-sm leading-[1.55] text-text focus:border-text focus:outline-none"
      />
      <button
        type="button"
        onClick={polish}
        disabled={polishing}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-ai-2/40 bg-ai-2/10 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ai-2 transition hover:bg-ai-2/20 disabled:opacity-60"
        title="AI ile vurucu hale getir"
      >
        {polishing ? (
          <>
            <Sparkles size={11} className="animate-pulse" /> Düşünüyor...
          </>
        ) : (
          <>
            <Wand2 size={11} /> AI cilala
          </>
        )}
      </button>
    </div>
  );
}

function RepeaterList<T>({
  items,
  empty,
  onChange,
  render,
  addLabel,
}: {
  items: T[];
  empty: T;
  onChange: (arr: T[]) => void;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative rounded-md border border-border bg-surface-2 p-4"
        >
          <button
            type="button"
            onClick={() =>
              onChange(items.filter((_, i) => i !== idx))
            }
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:border-red-500/40 hover:text-red-300"
            title="Sil"
            aria-label="Sil"
          >
            <Trash2 size={12} />
          </button>
          {render(item, (next) => {
            const arr = items.slice();
            arr[idx] = next;
            onChange(arr);
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, structuredClone(empty)])}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-[12.5px] text-text-2 hover:border-text hover:text-text"
      >
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}

// ─── BuilderState ↔ CvResponse mappers ──────────────────────────────────

function fromCv(cv: CvResponse): BuilderState {
  return {
    personal: cv.personal ?? { name: "", email: "", phone: "", location: "" },
    summary: cv.summary ?? "",
    skillsCsv: (cv.skills ?? []).join(", "),
    languagesCsv: (cv.languages ?? []).join(", "),
    education: cv.education ?? [],
    experience: cv.experience ?? [],
    projects: cv.projects ?? [],
  };
}

function toCv(s: BuilderState): Partial<CvResponse> {
  const splitCsv = (csv: string) =>
    csv.split(",").map((x) => x.trim()).filter(Boolean);
  return {
    personal: s.personal,
    summary: s.summary,
    skills: splitCsv(s.skillsCsv),
    languages: splitCsv(s.languagesCsv),
    education: s.education,
    experience: s.experience,
    projects: s.projects,
  };
}
