"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSavedJobsStore } from "@/lib/saved-jobs-store";
import { toast } from "@/components/ui/Toast";

interface Props {
  jobId: string;
  /** "icon" = round 36px icon button, "pill" = labeled pill */
  variant?: "icon" | "pill";
  className?: string;
}

export function BookmarkButton({ jobId, variant = "icon", className }: Props) {
  const isSaved = useSavedJobsStore((s) => s.ids.has(jobId));
  const toggle = useSavedJobsStore((s) => s.toggle);
  const load = useSavedJobsStore((s) => s.load);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const nowSaved = await toggle(jobId);
      if (nowSaved) toast.success("İlan kaydedildi", "Kayıtlı ilanlar listesinde görebilirsin.");
      else toast.info("Kayıt kaldırıldı");
    } catch {
      toast.error("Kaydedilemedi", "Lütfen tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`btn btn--outline btn--sm ${className ?? ""}`}
      >
        {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
        {isSaved ? "Kaydedildi" : "Kaydet"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`icon-btn relative ${className ?? ""}`}
      aria-label={isSaved ? "Kaydı kaldır" : "İlanı kaydet"}
      title={isSaved ? "Kaydı kaldır" : "İlanı kaydet"}
    >
      {isSaved ? (
        <BookmarkCheck size={16} className="text-ai-2" />
      ) : (
        <Bookmark size={16} />
      )}
    </button>
  );
}
