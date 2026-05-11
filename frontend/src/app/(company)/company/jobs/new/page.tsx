"use client";

import { useRouter } from "next/navigation";
import { companyApi } from "@/lib/company-api";
import { JobForm } from "@/components/jobs/JobForm";

export default function NewJobPage() {
  const router = useRouter();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Yeni İlan</h1>
      <JobForm
        onSubmit={async (data) => {
          const created = await companyApi.createJob(data);
          router.replace(`/company/jobs/${created.id}`);
        }}
        submitLabel="İlanı Oluştur"
      />
    </div>
  );
}
