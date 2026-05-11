"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { authApi } from "@/lib/auth-api";
import { userApi } from "@/lib/user-api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ApiError, MeResponse } from "@/types/auth";

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    authApi
      .me()
      .then(setMe)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!me) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await userApi.updateProfile({
        firstName: (fd.get("firstName") as string) || undefined,
        lastName: (fd.get("lastName") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        title: (fd.get("title") as string) || undefined,
        bio: (fd.get("bio") as string) || undefined,
        githubUrl: (fd.get("githubUrl") as string) || undefined,
        linkedinUrl: (fd.get("linkedinUrl") as string) || undefined,
      });
      setMe(updated);
      setUser({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        emailVerified: updated.emailVerified,
      });
      setSuccess("Profil güncellendi");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!me) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          GitHub profilini bağla, AI analizi için gerekli.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="İsim" name="firstName" defaultValue={me.firstName ?? ""} />
          <Input label="Soyisim" name="lastName" defaultValue={me.lastName ?? ""} />
        </div>
        <Input label="Şehir" name="city" defaultValue={me.city ?? ""} />
        <Input label="Ünvan" name="title" defaultValue={me.title ?? ""} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hakkımda
          </label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={me.bio ?? ""}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <Input
          label="GitHub URL veya kullanıcı adı"
          name="githubUrl"
          placeholder="https://github.com/furkanpatat veya furkanpatat"
          defaultValue={me.githubUrl ?? ""}
        />
        <Input
          label="LinkedIn URL"
          name="linkedinUrl"
          defaultValue={me.linkedinUrl ?? ""}
        />

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
