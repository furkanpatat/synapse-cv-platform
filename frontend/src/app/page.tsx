import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">CV Platform</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI Destekli CV Doğrulama ve Yetkinlik Analiz Platformu
        </p>
        <p className="text-sm text-gray-500">
          GitHub verilerinle CV'ndeki yetkinlikleri yapay zekâ ile doğrula. Sana en uygun ilanları bul.
        </p>

        <div className="flex justify-center gap-3 pt-4">
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  );
}
