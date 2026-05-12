"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { companyApi } from "@/lib/company-api";
import { JobForm } from "@/components/jobs/JobForm";

export default function NewJobPage() {
  const router = useRouter();
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

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <JobForm
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
                <b className="text-text">Net başlık</b> — "Senior Backend Engineer"
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
