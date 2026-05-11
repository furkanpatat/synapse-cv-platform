"use client";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Paneli</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Sistem yönetimi — Faz 7'de tam özellikleriyle aktif olacak.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Toplam Kullanıcı" value="—" />
        <Stat label="Aktif Şirket" value="—" />
        <Stat label="Bekleyen Onay" value="—" />
        <Stat label="Aktif İlan" value="—" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
