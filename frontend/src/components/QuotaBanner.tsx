import Link from "next/link";

export function QuotaBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-700 dark:bg-yellow-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-yellow-900 dark:text-yellow-100">
            ⭐ Aylık Kotanı Doldurdun
          </p>
          <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">{message}</p>
        </div>
        <Link
          href="/dashboard/billing"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark whitespace-nowrap"
        >
          PREMIUM'a Yükselt →
        </Link>
      </div>
    </div>
  );
}
