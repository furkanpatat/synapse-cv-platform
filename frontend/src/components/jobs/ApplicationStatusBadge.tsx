import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/jobs";

const styles: Record<ApplicationStatus, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  REVIEWING: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  INTERVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  OFFERED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

const labels: Record<ApplicationStatus, string> = {
  NEW: "Yeni",
  REVIEWING: "İnceleniyor",
  INTERVIEW: "Mülakat",
  OFFERED: "Teklif",
  REJECTED: "Reddedildi",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
