"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  Github,
} from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { redirectPathForRole } from "@/lib/redirect-by-role";
import type { ApiError } from "@/types/auth";

type RegisterRole = "USER" | "COMPANY";

const schema = z
  .object({
    email: z.string().email("Geçerli bir e-posta gir"),
    password: z.string().min(8, "En az 8 karakter"),
    firstName: z.string().min(1, "İsim gerekli"),
    lastName: z.string().min(1, "Soyisim gerekli"),
    role: z.enum(["USER", "COMPANY"]),
    companyName: z.string().optional(),
    taxNo: z.string().optional(),
    sector: z.string().optional(),
  })
  .refine(
    (d) => d.role !== "COMPANY" || (d.companyName && d.companyName.trim().length > 0),
    { path: ["companyName"], message: "Şirket adı gerekli" }
  );

type Form = z.infer<typeof schema>;

function strengthOf(pwd: string): { level: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pwd) return { level: 0, label: "—" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["—", "Zayıf", "Orta", "İyi", "Güçlü"];
  return { level: Math.min(4, score) as 0 | 1 | 2 | 3 | 4, label: labels[Math.min(4, score)] };
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<RegisterRole>("USER");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState,
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "USER" },
  });

  const password = watch("password") ?? "";
  const strength = useMemo(() => strengthOf(password), [password]);

  const switchRole = (r: RegisterRole) => {
    setRole(r);
    setValue("role", r);
  };

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await authApi.register(data);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      // New USER → onboarding wizard. COMPANY/ADMIN → role default.
      if (res.user.role === "USER") {
        router.replace("/onboarding");
      } else {
        router.replace(redirectPathForRole(res.user.role));
      }
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setServerError(e.response?.data?.message ?? "Kayıt başarısız");
    }
  };

  return (
    <AuthShell
      quote={{
        text: "FREE plan kotamla bile gerçek bir AI yetkinlik raporu aldım. Premium'a geçişim sırf hızlı PDF içindi.",
        name: "Mehmet Aydın",
        role: "Computer Science · ITU",
        initials: "MA",
      }}
      topRightLink={{ text: "Zaten üye misin?", label: "Giriş yap", href: "/login" }}
    >
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <Sparkles size={12} className="text-ai-2" />
        30 saniyede başla
      </div>
      <h1 className="text-[clamp(28px,3.5vw,36px)] font-semibold leading-[1.1] tracking-[-0.035em]">
        Synapse&apos;e <span className="ai-text">katıl</span>
      </h1>
      <p className="mb-6 mt-2 max-w-[380px] text-[14.5px] text-text-2">
        CV&apos;ni yükle, GitHub&apos;ını bağla, AI yetkinlik skoruna ulaş.
      </p>

      {/* Role switcher */}
      <div className="tab-switch mb-5">
        <button
          type="button"
          data-active={role === "USER"}
          onClick={() => switchRole("USER")}
        >
          <User size={14} />
          Birey
        </button>
        <button
          type="button"
          data-active={role === "COMPANY"}
          onClick={() => switchRole("COMPANY")}
        >
          <Building2 size={14} />
          Şirket
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="social-btn">
          <Github size={16} />
          GitHub
        </button>
        <button type="button" className="social-btn">
          <Mail size={16} />
          E-posta
        </button>
      </div>

      <div className="auth-divider my-5">VEYA</div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <input type="hidden" {...register("role")} />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="AD"
            placeholder="Ahmet"
            error={formState.errors.firstName?.message}
            {...register("firstName")}
          />
          <Field
            label="SOYAD"
            placeholder="Yılmaz"
            error={formState.errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        {role === "COMPANY" && (
          <>
            <Field
              label="ŞİRKET ADI"
              icon={<Building2 size={15} />}
              placeholder="Acme A.Ş."
              error={formState.errors.companyName?.message}
              {...register("companyName")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="VERGİ NO" placeholder="1234567890" {...register("taxNo")} />
              <Field label="SEKTÖR" placeholder="Yazılım" {...register("sector")} />
            </div>
          </>
        )}

        <Field
          label="E-POSTA"
          type="email"
          autoComplete="email"
          placeholder="ornek@email.com"
          icon={<Mail size={15} />}
          error={formState.errors.email?.message}
          {...register("email")}
        />
        <div>
          <Field
            label="ŞİFRE"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="En az 8 karakter"
            icon={<Lock size={15} />}
            suffix={
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="text-text-muted hover:text-text"
                aria-label="Şifreyi göster"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            error={formState.errors.password?.message}
            {...register("password")}
          />
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pw-bar" data-on={strength.level >= i} />
            ))}
          </div>
          <p className="mt-1 font-mono text-[11px] tracking-wider text-text-muted">
            ŞİFRE GÜCÜ: {strength.label}
          </p>
        </div>

        <label className="cbox mt-1 text-[12.5px]">
          <input type="checkbox" required defaultChecked />
          <span className="cbox__box">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            KVKK aydınlatma metni ve{" "}
            <a href="#" className="border-b border-border-strong pb-px text-text">
              Kullanım Koşulları
            </a>
            &apos;nı kabul ediyorum.
          </span>
        </label>

        {serverError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          variant="ai"
          size="lg"
          loading={formState.isSubmitting}
          className="mt-2 w-full"
        >
          <Sparkles size={15} />
          {role === "COMPANY" ? "Şirket hesabını oluştur" : "Hesabımı oluştur"}
        </Button>
      </form>
    </AuthShell>
  );
}
