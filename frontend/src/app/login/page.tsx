"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";

import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { redirectPathForRole } from "@/lib/redirect-by-role";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ApiError } from "@/types/auth";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const res = await authApi.login(data);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      router.replace(redirectPathForRole(res.user.role));
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setServerError(e.response?.data?.message ?? "Giriş başarısız");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-1 text-2xl font-bold">Giriş Yap</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          CV Platform hesabına eriş
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="E-posta"
            type="email"
            autoComplete="email"
            error={formState.errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Şifre"
            type="password"
            autoComplete="current-password"
            error={formState.errors.password?.message}
            {...register("password")}
          />

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Giriş Yap
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-brand hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
