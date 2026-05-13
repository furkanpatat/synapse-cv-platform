"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { interviewApi } from "@/lib/interview-api";
import { InterviewListView } from "@/app/(user)/dashboard/interviews/page";
import type { ApiError } from "@/types/auth";
import type { InterviewDto } from "@/types/interview";

export default function CompanyInterviewsPage() {
  const [list, setList] = useState<InterviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    interviewApi
      .mine()
      .then(setList)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Yükleme başarısız")
      )
      .finally(() => setLoading(false));
  }, []);

  return <InterviewListView list={list} loading={loading} error={error} viewer="COMPANY" />;
}
