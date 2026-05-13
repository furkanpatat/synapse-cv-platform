"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  Sparkles,
  Upload,
  Github,
  Brain,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { authApi } from "@/lib/auth-api";
import { userApi } from "@/lib/user-api";
import { cvApi } from "@/lib/cv-api";
import { analysisApi } from "@/lib/analysis-api";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireRole } from "@/lib/use-require-role";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { CvResponse } from "@/types/cv";
import type { ApiError, MeResponse } from "@/types/auth";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const { ready } = useRequireRole("USER");
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [cv, setCv] = useState<CvResponse | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingGh, setSavingGh] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setUserInStore = useAuthStore((s) => s.setUser);

  // Determine initial step from existing user state
  useEffect(() => {
    if (!ready) return;
    Promise.all([
      authApi.me().catch(() => null),
      cvApi.me().catch(() => null),
      analysisApi.me().catch(() => null),
    ]).then(([m, c, a]) => {
      if (m) {
        setMe(m);
        setGithubUrl(m.githubUrl ?? "");
      }
      if (c) setCv(c);
      // Already-onboarded → straight to dashboard
      if (a) {
        router.replace("/dashboard");
        return;
      }
      if (c && c.status === "PARSED") {
        if (m && m.githubUrl) setStep(3);
        else setStep(2);
      } else {
        setStep(1);
      }
    });
  }, [ready, router]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await cvApi.upload(file);
      setCv(data);
      toast.success("CV ayrıştırıldı", "Yetkinliklerin JSON'a çevrildi.");
      setStep(2);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Yükleme başarısız", e.response?.data?.message ?? "Tekrar dene.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveGithub = async () => {
    if (!githubUrl.trim()) {
      toast.warning("GitHub URL gerekli", "Analiz için bu adım kritik.");
      return;
    }
    setSavingGh(true);
    try {
      const updated = await userApi.updateProfile({ githubUrl: githubUrl.trim() });
      setMe(updated);
      setUserInStore({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        emailVerified: updated.emailVerified,
      });
      toast.success("GitHub bağlandı", "Artık AI analizini başlatabilirsin.");
      setStep(3);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Kaydedilemedi", e.response?.data?.message ?? "Tekrar dene.");
    } finally {
      setSavingGh(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await analysisApi.start();
      toast.ai("Analiz başladı ✨", "Hazır olunca bildirim göndereceğim.");
      router.replace("/dashboard/analysis");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Başlatılamadı", e.response?.data?.message ?? "Tekrar dene.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-bg-soft px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-[9px] ai-grad">
            <Sparkles size={14} className="text-white" />
          </span>
          Synapse
        </Link>

        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold transition ${
                  s < step
                    ? "ai-grad text-white"
                    : s === step
                      ? "border-2 border-ai-2 text-text"
                      : "border border-border text-text-muted"
                }`}
              >
                {s < step ? <Check size={14} /> : s}
              </div>
              {i < 2 && (
                <div
                  className={`h-px w-12 ${
                    s < step ? "bg-ai-2" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8">
          {step === 1 && <StepOne uploading={uploading} fileRef={fileRef} onFile={onFile} />}
          {step === 2 && (
            <StepTwo
              githubUrl={githubUrl}
              setGithubUrl={setGithubUrl}
              onBack={() => setStep(1)}
              onNext={saveGithub}
              saving={savingGh}
            />
          )}
          {step === 3 && (
            <StepThree
              firstName={me?.firstName ?? ""}
              cv={cv}
              onBack={() => setStep(2)}
              onRun={runAnalysis}
              analyzing={analyzing}
            />
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
          <Link
            href="/dashboard"
            className="hover:text-text border-b border-border-strong"
          >
            Atla, sonra yaparım
          </Link>
        </p>
      </div>
    </div>
  );
}

function StepOne({
  uploading,
  fileRef,
  onFile,
}: {
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        ADIM 1 / 3
      </div>
      <h1 className="text-[26px] font-semibold tracking-[-0.025em]">
        <span className="ai-text">CV&apos;ni</span> yükle
      </h1>
      <p className="mt-2 text-[14px] text-text-2">
        PDF veya DOCX yükle. AI dakikalar içinde yetkinliklerini, deneyimini ve
        projelerini yapılandırılmış veriye çevirir.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        onChange={onFile}
        className="hidden"
      />

      <div
        onClick={() => fileRef.current?.click()}
        className="mt-6 cursor-pointer rounded-[var(--radius)] border-2 border-dashed border-border-strong p-10 text-center transition hover:border-ai-2"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ai-grad shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.5)]">
          <Upload size={22} className="text-white" />
        </div>
        <p className="font-medium">CV&apos;ni sürükle veya tıkla</p>
        <p className="mt-1 text-[12.5px] text-text-muted">
          PDF veya DOCX · maks 10MB
        </p>
      </div>

      <Button
        type="button"
        onClick={() => fileRef.current?.click()}
        variant="ai"
        size="lg"
        loading={uploading}
        className="mt-6 w-full"
      >
        <Upload size={15} /> {uploading ? "Yükleniyor..." : "Dosya seç"}
      </Button>
    </>
  );
}

function StepTwo({
  githubUrl,
  setGithubUrl,
  onBack,
  onNext,
  saving,
}: {
  githubUrl: string;
  setGithubUrl: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        ADIM 2 / 3
      </div>
      <h1 className="text-[26px] font-semibold tracking-[-0.025em]">
        <span className="ai-text">GitHub</span> profilini bağla
      </h1>
      <p className="mt-2 text-[14px] text-text-2">
        Public repo&apos;larını, dillerini ve commit aktiviteni analiz edip CV&apos;deki
        yetkinliklerle karşılaştıracağız.
      </p>

      <div className="mt-6">
        <Field
          label="GITHUB URL VEYA KULLANICI ADI"
          icon={<Github size={14} />}
          placeholder="https://github.com/kullanici"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
        />
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={14} /> Geri
        </Button>
        <Button
          type="button"
          variant="ai"
          size="lg"
          onClick={onNext}
          loading={saving}
          className="flex-1"
        >
          Devam <ArrowRight size={15} />
        </Button>
      </div>
    </>
  );
}

function StepThree({
  firstName,
  cv,
  onBack,
  onRun,
  analyzing,
}: {
  firstName: string;
  cv: CvResponse | null;
  onBack: () => void;
  onRun: () => void;
  analyzing: boolean;
}) {
  return (
    <>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        ADIM 3 / 3
      </div>
      <h1 className="text-[26px] font-semibold tracking-[-0.025em]">
        <span className="ai-text">İlk analizini</span> başlat
      </h1>
      <p className="mt-2 text-[14px] text-text-2">
        Hazırsın {firstName ? `${firstName}! ` : "! "}AI şimdi CV&apos;ni GitHub
        aktivitenle eşleştirip 0-100 arası bir yetkinlik skoru üretecek.
      </p>

      <div className="mt-6 grid gap-2 text-[13px]">
        <Row icon={<Check size={14} className="text-emerald-400" />}>
          CV ayrıştırıldı — {cv?.skills?.length ?? 0} skill tespit edildi
        </Row>
        <Row icon={<Check size={14} className="text-emerald-400" />}>
          GitHub profili bağlandı
        </Row>
        <Row icon={<Brain size={14} className="text-ai-2" />}>
          AI 30-60 saniyede skorunu hazırlayacak
        </Row>
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={14} /> Geri
        </Button>
        <Button
          type="button"
          variant="ai"
          size="lg"
          onClick={onRun}
          loading={analyzing}
          className="flex-1"
        >
          <Sparkles size={15} /> Analizi başlat
        </Button>
      </div>
    </>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-bg-soft px-3 py-2">
      {icon}
      <span>{children}</span>
    </div>
  );
}
