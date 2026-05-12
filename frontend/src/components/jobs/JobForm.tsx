"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuotaBanner } from "@/components/QuotaBanner";
import type { ApiError } from "@/types/auth";
import type { JobRequest, JobResponse } from "@/types/jobs";

interface Props {
  initial?: JobResponse | null;
  onSubmit: (data: JobRequest) => Promise<void>;
  submitLabel?: string;
}

export function JobForm({ initial, onSubmit, submitLabel = "Kaydet" }: Props) {
  const [skillsText, setSkillsText] = useState(
    (initial?.requiredSkills ?? []).join(", ")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setQuotaMessage(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: JobRequest = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      city: (fd.get("city") as string) || undefined,
      remoteType: (fd.get("remoteType") as JobRequest["remoteType"]) || "ONSITE",
      level: (fd.get("level") as JobRequest["level"]) || "MID",
      salaryMin: numberOrUndef(fd.get("salaryMin")),
      salaryMax: numberOrUndef(fd.get("salaryMax")),
      currency: (fd.get("currency") as string) || "TRY",
      requiredSkills: skills,
      status: (fd.get("status") as JobRequest["status"]) || "DRAFT",
    };
    try {
      await onSubmit(payload);
    } catch (e) {
      const axiosErr = e as AxiosError<ApiError>;
      const code = axiosErr.response?.data?.code;
      const msg = axiosErr.response?.data?.message;
      if (code === "QUOTA_EXCEEDED") {
        setQuotaMessage(msg ?? "Aktif ilan kotanı aştın");
      } else if (code === "COMPANY_NOT_VERIFIED") {
        setError("Şirket hesabın admin tarafından onaylanmadan ilan yayınlayamazsın.");
      } else {
        setError(msg ?? (e as Error).message ?? "Kaydetme başarısız");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Başlık"
        name="title"
        required
        defaultValue={initial?.title ?? ""}
        placeholder="Senior Java Backend Geliştirici"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium">Açıklama</label>
        <textarea
          name="description"
          required
          rows={8}
          defaultValue={initial?.description ?? ""}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          placeholder="İş tanımı, sorumluluklar, aranan nitelikler..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input label="Şehir" name="city" defaultValue={initial?.city ?? ""} />
        <Select
          label="Çalışma Şekli"
          name="remoteType"
          defaultValue={initial?.remoteType ?? "ONSITE"}
          options={[
            { value: "ONSITE", label: "Ofisten" },
            { value: "HYBRID", label: "Hibrit" },
            { value: "REMOTE", label: "Uzaktan" },
          ]}
        />
        <Select
          label="Seviye"
          name="level"
          defaultValue={initial?.level ?? "MID"}
          options={[
            { value: "JUNIOR", label: "Junior" },
            { value: "MID", label: "Mid" },
            { value: "SENIOR", label: "Senior" },
            { value: "LEAD", label: "Lead" },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Min Maaş"
          name="salaryMin"
          type="number"
          defaultValue={initial?.salaryMin ?? ""}
        />
        <Input
          label="Max Maaş"
          name="salaryMax"
          type="number"
          defaultValue={initial?.salaryMax ?? ""}
        />
        <Input
          label="Para Birimi"
          name="currency"
          defaultValue={initial?.currency ?? "TRY"}
          placeholder="TRY"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Aranan Yetenekler (virgülle ayır)
        </label>
        <input
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="Java, Spring Boot, PostgreSQL, Docker"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <Select
        label="Durum"
        name="status"
        defaultValue={initial?.status ?? "DRAFT"}
        options={[
          { value: "DRAFT", label: "Taslak (yayınlanmamış)" },
          { value: "ACTIVE", label: "Aktif (yayında)" },
          { value: "CLOSED", label: "Kapalı" },
        ]}
      />

      {quotaMessage && <QuotaBanner message={quotaMessage} />}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={saving}>
        {submitLabel}
      </Button>
    </form>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function numberOrUndef(v: FormDataEntryValue | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
