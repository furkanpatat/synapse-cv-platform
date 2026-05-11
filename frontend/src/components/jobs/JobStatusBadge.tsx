import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/jobs";

const styles: Record<JobStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  CLOSED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

const labels: Record<JobStatus, string> = {
  ACTIVE: "Aktif",
  DRAFT: "Taslak",
  CLOSED: "Kapalı",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
