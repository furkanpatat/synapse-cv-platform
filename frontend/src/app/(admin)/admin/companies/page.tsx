"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { AdminCompanyDto } from "@/types/admin";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompanyDto[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .companies()
      .then(setCompanies)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Yükleme başarısız")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (c: AdminCompanyDto) => {
    try {
      const updated = await adminApi.setVerified(c.id, !c.verified);
      setCompanies((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "İşlem başarısız");
    }
  };

  const filtered = companies.filter((c) => {
    if (filter === "PENDING") return !c.verified;
    if (filter === "VERIFIED") return c.verified;
    return true;
  });

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Şirketler ({companies.length})</h1>
        <div className="flex gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-800">
          {(["ALL", "PENDING", "VERIFIED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-sm transition ${
                filter === f
                  ? "bg-white text-brand shadow dark:bg-gray-900"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {f === "ALL" ? "Tümü" : f === "PENDING" ? "Bekleyen" : "Onaylı"}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Şirket</th>
              <th className="px-4 py-2 text-left">Vergi No</th>
              <th className="px-4 py-2 text-left">Sektör</th>
              <th className="px-4 py-2 text-left">Yetkili Email</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-left">Kayıt</th>
              <th className="px-4 py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {c.taxNo ?? "—"}
                </td>
                <td className="px-4 py-2">{c.sector ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {c.ownerEmail}
                </td>
                <td className="px-4 py-2">
                  {c.verified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-200">
                      ✓ Onaylı
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                      ⏳ Bekliyor
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant={c.verified ? "secondary" : "primary"}
                    onClick={() => handleVerify(c)}
                  >
                    {c.verified ? "Onayı Geri Al" : "Onayla"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
