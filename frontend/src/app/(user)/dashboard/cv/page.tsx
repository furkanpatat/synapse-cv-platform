"use client";

import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  FileText,
  Upload,
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Rocket,
  Languages,
  Download,
} from "lucide-react";

import { cvApi } from "@/lib/cv-api";
import type { CvResponse } from "@/types/cv";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";

export default function CvPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState<CvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    cvApi
      .me()
      .then((data) => !cancelled && setCv(data))
      .catch((err: AxiosError<ApiError>) => {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message ?? "CV yüklenirken hata oluştu");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const data = await cvApi.upload(file);
      setCv(data);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Yükleme başarısız");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFile(e.target.files?.[0]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <FileText size={12} /> CV YÖNETİMİ
          </div>
          <h1 className="page-head__title">
            CV&apos;ni <span className="ai-text">AI</span> ayrıştırsın
          </h1>
          <p className="page-head__sub mt-1.5">
            PDF veya DOCX yükle, kişisel bilgi/yetkinlik/deneyim/proje bilgilerin
            yapılandırılmış JSON&apos;a çevrilsin.
          </p>
        </div>
        <div className="page-head__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={onPick}
            className="hidden"
            id="cv-file-input"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ai"
            size="lg"
            loading={uploading}
          >
            <Upload size={15} /> {cv ? "Yeni CV yükle" : "CV yükle"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          Yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : !cv ? (
        <Dropzone onDrop={onDrop} onPick={() => fileInputRef.current?.click()} />
      ) : (
        <CvView cv={cv} />
      )}
    </>
  );
}

function Dropzone({
  onDrop,
  onPick,
}: {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onPick: () => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong bg-surface p-16 text-center transition hover:border-ai-2"
    >
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl ai-grad shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.5)]">
        <Upload size={28} className="text-white" />
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
        CV&apos;ni <span className="ai-text">sürükle</span> veya tıkla
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-text-2">
        PDF veya DOCX · maks. 10MB · 5-10 saniye içinde AI ayrıştırır
      </p>
      <Button onClick={onPick} variant="ai" size="lg" className="mt-7">
        <Upload size={15} /> Dosya seç
      </Button>
    </div>
  );
}

function CvView({ cv }: { cv: CvResponse }) {
  return (
    <div className="space-y-5">
      <StatusBar cv={cv} />

      {cv.personal && (
        <Section icon={<User size={14} />} title="Kişisel bilgiler">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={<User size={14} />} label="Ad" value={cv.personal.name} />
            <Field icon={<Mail size={14} />} label="E-posta" value={cv.personal.email} />
            <Field icon={<Phone size={14} />} label="Telefon" value={cv.personal.phone} />
            <Field icon={<MapPin size={14} />} label="Konum" value={cv.personal.location} />
          </div>
        </Section>
      )}

      {cv.summary && (
        <Section icon={<Sparkles size={14} />} title="Özet">
          <p className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-text">
            {cv.summary}
          </p>
        </Section>
      )}

      {cv.skills && cv.skills.length > 0 && (
        <Section
          icon={<Sparkles size={14} />}
          title="Yetkinlikler"
          right={`${cv.skills.length} skill`}
        >
          <div className="flex flex-wrap gap-1.5">
            {cv.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[12.5px] text-text-2 transition hover:border-border-strong hover:text-text"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section icon={<Briefcase size={14} />} title="Deneyim">
          <div className="flex flex-col gap-5">
            {cv.experience.map((e, i) => (
              <div key={i} className="border-l-2 border-ai-2/40 pl-4">
                <div className="font-medium">
                  {e.role} <span className="text-text-muted">·</span> {e.company}
                </div>
                <div className="mt-0.5 font-mono text-[11.5px] uppercase tracking-wider text-text-muted">
                  {e.startDate ?? "—"} → {e.endDate ?? "GÜNÜMÜZ"}
                </div>
                {e.description && (
                  <p className="mt-2 text-[13.5px] leading-[1.55] text-text-2">
                    {e.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {cv.education && cv.education.length > 0 && (
        <Section icon={<GraduationCap size={14} />} title="Eğitim">
          <div className="flex flex-col gap-4">
            {cv.education.map((e, i) => (
              <div key={i}>
                <div className="font-medium">{e.school}</div>
                <div className="text-[13px] text-text-2">
                  {[e.degree, e.field].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1 font-mono text-[11.5px] uppercase tracking-wider text-text-muted">
                  {e.startYear ?? "—"} → {e.endYear ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {cv.projects && cv.projects.length > 0 && (
        <Section icon={<Rocket size={14} />} title="Projeler">
          <div className="flex flex-col gap-4">
            {cv.projects.map((p, i) => (
              <div key={i}>
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <p className="mt-1 text-[13.5px] leading-[1.55] text-text-2">
                    {p.description}
                  </p>
                )}
                {p.technologies && p.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-text-2"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {cv.languages && cv.languages.length > 0 && (
        <Section icon={<Languages size={14} />} title="Diller">
          <div className="flex flex-wrap gap-1.5">
            {cv.languages.map((l) => (
              <span key={l} className="pill">
                {l}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatusBar({ cv }: { cv: CvResponse }) {
  const ok = cv.status === "PARSED";
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          <FileText size={18} />
        </div>
        <div>
          <div className="text-[14px] font-medium">{cv.originalFilename}</div>
          <div className="mt-0.5 font-mono text-[11.5px] uppercase tracking-wider text-text-muted">
            {ok ? "✓ AYRIŞTIRILDI" : cv.status === "PENDING" ? "⏳ İŞLENİYOR" : "✗ BAŞARISIZ"}
            {" · "}
            {new Date(cv.updatedAt).toLocaleDateString("tr-TR")}
          </div>
        </div>
      </div>
      {cv.fileDownloadUrl && (
        <a
          href={cv.fileDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn--outline btn--sm"
        >
          <Download size={13} /> Orijinali indir
        </a>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          {icon} {title}
        </h3>
        {right && (
          <span className="font-mono text-[11.5px] text-text-2">{right}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
        {icon} {label}
      </div>
      <div className="text-[14px] text-text">{value ?? "—"}</div>
    </div>
  );
}
