export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">CV Platform</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI Destekli CV Doğrulama ve Yetkinlik Analiz Platformu
        </p>
        <p className="text-sm text-gray-500">
          Faz 0 — İskelet kuruldu. Sırada Faz 1: Auth & DB şeması.
        </p>
      </div>
    </main>
  );
}
