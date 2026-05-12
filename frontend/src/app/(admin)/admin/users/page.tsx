"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { AdminUserDto } from "@/types/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .users()
      .then(setUsers)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Yükleme başarısız")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleBan = async (u: AdminUserDto) => {
    try {
      const updated = await adminApi.setBanned(u.id, !u.banned);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "İşlem başarısız");
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.firstName ?? "").toLowerCase().includes(q) ||
      (u.lastName ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kullanıcılar ({users.length})</h1>
        <input
          placeholder="Email/isim ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">İsim</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-left">Plan</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-left">Kayıt</th>
              <th className="px-4 py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2">{u.subscriptionType}</td>
                <td className="px-4 py-2">
                  {u.banned ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-200">
                      Banlı
                    </span>
                  ) : u.emailVerified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-200">
                      Aktif
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                      Doğrulanmamış
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-2 text-right">
                  {u.role !== "ADMIN" && (
                    <Button
                      variant={u.banned ? "secondary" : "danger"}
                      onClick={() => handleBan(u)}
                    >
                      {u.banned ? "Banı Kaldır" : "Banla"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
