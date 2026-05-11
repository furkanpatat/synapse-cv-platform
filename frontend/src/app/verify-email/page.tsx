"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth-api";

type Status = "verifying" | "success" | "error";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Doğrulama tokenı eksik.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("E-posta adresin başarıyla doğrulandı.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Token geçersiz veya süresi dolmuş.");
      });
  }, [token]);

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-3 text-2xl font-bold">
        {status === "verifying" && "Doğrulanıyor..."}
        {status === "success" && "✅ Doğrulandı"}
        {status === "error" && "❌ Hata"}
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      <Link
        href="/login"
        className="inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Giriş Sayfasına Dön
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<p>Yükleniyor...</p>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
