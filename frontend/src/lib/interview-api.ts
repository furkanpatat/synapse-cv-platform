import { api } from "./api";
import type { InterviewDto } from "@/types/interview";

export const interviewApi = {
  schedule: (applicationId: string, scheduledAt: string, durationMin = 45) =>
    api
      .post<InterviewDto>(`/v1/interviews/applications/${applicationId}`, {
        scheduledAt,
        durationMin,
      })
      .then((r) => r.data),

  mine: () =>
    api.get<InterviewDto[]>("/v1/interviews/me").then((r) => r.data),

  byToken: (token: string) =>
    api.get<InterviewDto>(`/v1/interviews/${token}`).then((r) => r.data),

  start: (token: string) =>
    api.post<InterviewDto>(`/v1/interviews/${token}/start`).then((r) => r.data),

  end: (token: string) =>
    api.post<{ ended: boolean }>(`/v1/interviews/${token}/end`).then((r) => r.data),
};

/** Browser-side ICS download for a scheduled interview. */
export function downloadIcs(i: InterviewDto, originUrl: string) {
  const start = new Date(i.scheduledAt);
  const end = new Date(start.getTime() + i.durationMin * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const roomUrl = `${originUrl}/interview/${i.roomToken}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Synapse//Interview//TR",
    "BEGIN:VEVENT",
    `UID:${i.id}@synapse`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Synapse Mülakat — ${i.jobTitle}`,
    `DESCRIPTION:${i.companyName} ile mülakat. Oda: ${roomUrl}`,
    `URL:${roomUrl}`,
    `LOCATION:${roomUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `synapse-mulakat-${i.roomToken}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
