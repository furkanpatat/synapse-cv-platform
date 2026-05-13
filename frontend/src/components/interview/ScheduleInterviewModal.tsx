"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Video, Calendar, X, Sparkles } from "lucide-react";

import { interviewApi } from "@/lib/interview-api";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";

interface Props {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onClose: () => void;
  onScheduled?: () => void;
}

function defaultSlot(): string {
  // Tomorrow at 14:00 local time, as a string for datetime-local input
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleInterviewModal({
  applicationId,
  candidateName,
  jobTitle,
  onClose,
  onScheduled,
}: Props) {
  const router = useRouter();
  const [scheduledLocal, setScheduledLocal] = useState(defaultSlot());
  const [duration, setDuration] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // datetime-local has no timezone — interpret as local, convert to ISO
      const iso = new Date(scheduledLocal).toISOString();
      const session = await interviewApi.schedule(applicationId, iso, duration);
      toast.ai(
        "🎥 Mülakat planlandı",
        `${candidateName} bildirim aldı — odaya yönlendiriliyorsun.`
      );
      onScheduled?.();
      onClose();
      router.push(`/interview/${session.roomToken}`);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Planlanamadı", e.response?.data?.message ?? "Beklenmedik hata");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl ai-grad text-white">
              <Video size={18} />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold tracking-[-0.015em]">
                Video Mülakat Planla
              </h3>
              <p className="text-[12px] text-text-2">
                {candidateName} · {jobTitle}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Kapat">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted mb-1.5">
              TARİH & SAAT
            </span>
            <input
              type="datetime-local"
              required
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-text focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted mb-1.5">
              SÜRE
            </span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-text focus:outline-none"
            >
              <option value={30}>30 dakika</option>
              <option value={45}>45 dakika</option>
              <option value={60}>1 saat</option>
              <option value={90}>1.5 saat</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-md border border-ai-2/30 bg-ai-2/5 p-3 text-[12px] text-text-2 leading-snug">
          <Sparkles size={11} className="inline text-ai-2" /> Aday otomatik
          bildirim alacak ve mülakat takvimine (.ics) ekleyebilir. Görüşme
          tarayıcıda peer-to-peer video ile yapılacak (Zoom gerekmez).
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Vazgeç
          </Button>
          <Button type="submit" variant="ai" loading={submitting} className="flex-1">
            <Calendar size={14} /> Planla & Odaya git
          </Button>
        </div>
      </form>
    </div>
  );
}
