"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Shield, ShieldCheck, Copy, Check, Sparkles } from "lucide-react";

import { twoFactorApi, type TotpSetupResponse } from "@/lib/twofa-api";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/types/auth";

/**
 * Self-contained card for the profile page: shows current 2FA status and a
 * mini-wizard to enable / disable it.
 *
 * Enable flow:
 *   idle → POST /setup → "show_qr" with secret + QR
 *   user types code → POST /verify → "enabled"
 *
 * Disable flow:
 *   user types current code → POST /disable → "idle"
 */
export function TwoFactorCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [disableMode, setDisableMode] = useState(false);

  useEffect(() => {
    twoFactorApi
      .status()
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, []);

  const beginSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await twoFactorApi.setup();
      setSetup(data);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Kurulum başlatılamadı");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await twoFactorApi.verify(code);
      if (ok) {
        toast.ai("🛡️ 2FA aktif", "Bir sonraki girişte kod istenecek.");
        setEnabled(true);
        setSetup(null);
        setCode("");
      }
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Kod doğrulanamadı");
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await twoFactorApi.disable(code);
      toast.info("2FA kapatıldı");
      setEnabled(false);
      setDisableMode(false);
      setCode("");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Kod doğrulanamadı");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            enabled ? "ai-grad text-white" : "bg-surface-2 text-text-muted"
          }`}
        >
          {enabled ? <ShieldCheck size={18} /> : <Shield size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.015em]">
            İki adımlı doğrulama (2FA)
          </h3>
          <p className="mt-0.5 text-[13px] text-text-2">
            {enabled === null
              ? "Durum yükleniyor..."
              : enabled
                ? "Hesabın TOTP koduyla korunuyor. Her girişte 6 haneli bir kod istenecek."
                : "Google Authenticator / Authy gibi bir uygulamadan üretilen 6 haneli kodla hesabını koru."}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] text-red-300">
          {error}
        </div>
      )}

      {/* IDLE → enable */}
      {enabled === false && !setup && !disableMode && (
        <Button onClick={beginSetup} variant="ai" loading={busy} size="sm">
          <Sparkles size={13} /> 2FA'yı aç
        </Button>
      )}

      {/* QR + verify */}
      {setup && (
        <div className="space-y-3">
          <p className="text-[13px] text-text-2">
            <b>1.</b> Authenticator uygulamanı aç, &quot;Hesap ekle&quot;
            seçeneğinden QR kodunu tara (veya gizli anahtarı manuel gir).
          </p>
          <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrDataUri}
              alt="TOTP QR code"
              className="rounded-md border border-border bg-white p-1.5"
              width={160}
              height={160}
            />
            <div className="space-y-1.5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                Manuel giriş
              </div>
              <button
                type="button"
                onClick={copySecret}
                className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-left font-mono text-[12px] hover:border-text"
              >
                <span className="flex-1 truncate">{setup.secret}</span>
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <p className="text-[13px] text-text-2">
            <b>2.</b> Uygulamanın gösterdiği 6 haneli kodu aşağı yaz:
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-40 rounded-md border border-border bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-text focus:outline-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={confirmEnable}
              variant="ai"
              loading={busy}
              disabled={code.length !== 6}
              size="sm"
            >
              Onayla & aç
            </Button>
            <Button
              onClick={() => {
                setSetup(null);
                setCode("");
                setError(null);
              }}
              variant="outline"
              size="sm"
              type="button"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      )}

      {/* ENABLED → disable prompt */}
      {enabled === true && !disableMode && (
        <Button
          onClick={() => setDisableMode(true)}
          variant="outline"
          size="sm"
          type="button"
        >
          2FA'yı kapat
        </Button>
      )}
      {enabled === true && disableMode && (
        <div className="space-y-3">
          <p className="text-[13px] text-text-2">
            Kapatmadan önce mevcut bir 6 haneli kodu doğrula:
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-40 rounded-md border border-border bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-text focus:outline-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={confirmDisable}
              variant="outline"
              loading={busy}
              disabled={code.length !== 6}
              size="sm"
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                setDisableMode(false);
                setCode("");
                setError(null);
              }}
              variant="ghost"
              size="sm"
              type="button"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
