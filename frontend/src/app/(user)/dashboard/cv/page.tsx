"use client";

import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  if (loading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CV Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            PDF veya DOCX dosyanı yükle, AI içeriğini ayrıştırsın.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            className="hidden"
            id="cv-file-input"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            {cv ? "Yeni CV Yükle" : "CV Yükle"}
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!cv && !error && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Henüz CV yüklenmedi. Üstteki butonla başlayabilirsin.
          </p>
        </div>
      )}

      {cv && <CvDisplay cv={cv} />}
    </div>
  );
}

function CvDisplay({ cv }: { cv: CvResponse }) {
  return (
    <div className="space-y-6">
      <StatusBadge cv={cv} />

      <Section title="📁 Dosya">
        <p className="text-sm">
          <span className="font-medium">{cv.originalFilename}</span>
          {cv.fileDownloadUrl && (
            <>
              {" "}·{" "}
              <a
                href={cv.fileDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                İndir
              </a>
            </>
          )}
        </p>
      </Section>

      {cv.personal && (
        <Section title="👤 Kişisel">
          <Field label="Ad" value={cv.personal.name} />
          <Field label="E-posta" value={cv.personal.email} />
          <Field label="Telefon" value={cv.personal.phone} />
          <Field label="Konum" value={cv.personal.location} />
        </Section>
      )}

      {cv.summary && (
        <Section title="📝 Özet">
          <p className="whitespace-pre-wrap text-sm">{cv.summary}</p>
        </Section>
      )}

      {cv.skills && cv.skills.length > 0 && (
        <Section title="🛠 Yetenekler">
          <div className="flex flex-wrap gap-2">
            {cv.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="💼 Deneyim">
          {cv.experience.map((e, i) => (
            <div key={i} className="border-l-2 border-brand/30 pl-4">
              <p className="font-medium">
                {e.role} · {e.company}
              </p>
              <p className="text-xs text-gray-500">
                {e.startDate} — {e.endDate ?? "günümüz"}
              </p>
              {e.description && (
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {e.description}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.education && cv.education.length > 0 && (
        <Section title="🎓 Eğitim">
          {cv.education.map((e, i) => (
            <div key={i}>
              <p className="font-medium">{e.school}</p>
              <p className="text-sm">
                {[e.degree, e.field].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-gray-500">
                {e.startYear} — {e.endYear ?? "..."}
              </p>
            </div>
          ))}
        </Section>
      )}

      {cv.projects && cv.projects.length > 0 && (
        <Section title="🚀 Projeler">
          {cv.projects.map((p, i) => (
            <div key={i}>
              <p className="font-medium">{p.name}</p>
              {p.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {p.description}
                </p>
              )}
              {p.technologies && p.technologies.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.technologies.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.languages && cv.languages.length > 0 && (
        <Section title="🌐 Diller">
          <p className="text-sm">{cv.languages.join(", ")}</p>
        </Section>
      )}
    </div>
  );
}

function StatusBadge({ cv }: { cv: CvResponse }) {
  if (cv.status === "PARSED") {
    return (
      <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
        ✅ CV başarıyla analiz edildi.
      </div>
    );
  }
  if (cv.status === "PENDING") {
    return (
      <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
        ⏳ Ayrıştırılıyor...
      </div>
    );
  }
  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
      ❌ Hata: {cv.errorMessage ?? "Bilinmeyen"}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="text-sm">
      <span className="text-gray-500">{label}:</span> {value}
    </p>
  );
}
