"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { companyApi } from "@/lib/company-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ApiError } from "@/types/auth";
import type { CompanyResponse } from "@/types/jobs";

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .getMyCompany()
      .then(setCompany)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Şirket bilgisi yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await companyApi.updateMyCompany({
        name: (fd.get("name") as string) || undefined,
        taxNo: (fd.get("taxNo") as string) || undefined,
        sector: (fd.get("sector") as string) || undefined,
        website: (fd.get("website") as string) || undefined,
        logoUrl: (fd.get("logoUrl") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
      });
      setCompany(updated);
      setSuccess("Şirket profili güncellendi");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!company) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error ?? "Şirket bulunamadı"}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Şirket Profili</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            İlanlarında ve aday görünümünde kullanılacak şirket bilgileri.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            company.verified
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
        >
          {company.verified ? "✓ Onaylı" : "⏳ Onay bekliyor"}
        </span>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Şirket Adı" name="name" defaultValue={company.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vergi No" name="taxNo" defaultValue={company.taxNo ?? ""} />
          <Input label="Sektör" name="sector" defaultValue={company.sector ?? ""} />
        </div>
        <Input label="Web Sitesi" name="website" defaultValue={company.website ?? ""} />
        <Input label="Logo URL" name="logoUrl" defaultValue={company.logoUrl ?? ""} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Şirket Açıklaması
          </label>
          <textarea
            name="description"
            rows={5}
            defaultValue={company.description ?? ""}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            ✅ {success}
          </div>
        )}

        <Button type="submit" loading={saving}>
          Kaydet
        </Button>
      </form>
    </div>
  );
}
