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
import { cn } from "@/lib/utils";
import type { ApiError, Role } from "@/types/auth";

const baseSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "En az 8 karakter"),
  firstName: z.string().min(1, "İsim gerekli"),
  lastName: z.string().min(1, "Soyisim gerekli"),
  role: z.enum(["USER", "COMPANY"]),
  companyName: z.string().optional(),
  taxNo: z.string().optional(),
  sector: z.string().optional(),
});

const schema = baseSchema.refine(
  (d) => d.role !== "COMPANY" || (d.companyName && d.companyName.trim().length > 0),
  { path: ["companyName"], message: "Şirket adı gerekli" }
);

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<Role>("USER");

  const { register, handleSubmit, formState, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "USER" },
  });

  const role = watch("role");

  const switchRole = (r: "USER" | "COMPANY") => {
    setActiveRole(r);
    setValue("role", r);
  };

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const res = await authApi.register(data);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      router.replace(redirectPathForRole(res.user.role));
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setServerError(e.response?.data?.message ?? "Kayıt başarısız");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-1 text-2xl font-bold">Kayıt Ol</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Yeni bir hesap oluştur
        </p>

        {/* Role Switcher */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => switchRole("USER")}
            className={cn(
              "rounded px-3 py-2 text-sm font-medium transition",
              activeRole === "USER"
                ? "bg-white text-brand shadow dark:bg-gray-900"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            👤 Birey
          </button>
          <button
            type="button"
            onClick={() => switchRole("COMPANY")}
            className={cn(
              "rounded px-3 py-2 text-sm font-medium transition",
              activeRole === "COMPANY"
                ? "bg-white text-brand shadow dark:bg-gray-900"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            🏢 Şirket
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("role")} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="İsim"
              error={formState.errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Soyisim"
              error={formState.errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <Input
            label="E-posta"
            type="email"
            autoComplete="email"
            error={formState.errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Şifre (en az 8 karakter)"
            type="password"
            autoComplete="new-password"
            error={formState.errors.password?.message}
            {...register("password")}
          />

          {role === "COMPANY" && (
            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Şirket Bilgileri
              </p>
              <Input
                label="Şirket Adı"
                error={formState.errors.companyName?.message}
                {...register("companyName")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Vergi No" {...register("taxNo")} />
                <Input label="Sektör" placeholder="Yazılım" {...register("sector")} />
              </div>
              <p className="text-xs text-gray-500">
                Şirket kaydın admin onayından sonra ilan açabilirsin.
              </p>
            </div>
          )}

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Hesap Oluştur
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
