"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { Avatar, type AvatarState } from "./Avatar";
import { StageHalo } from "./StageHalo";
import { StageWave } from "./StageWave";
import { StatusPill } from "./StatusPill";

interface Props {
  state: AvatarState;
  sector: string;
  role: string;
  level: string;
}

/**
 * Reads <html data-theme> and re-renders when ThemeToggle flips it. Mira's
 * stroke colours need to contrast with the surface background, which is
 * white-ish in light mode and near-black in dark — so we can't ship a
 * single hardcoded ink colour.
 */
function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/**
 * Left column of the active interview screen. Houses the Mira avatar plus
 * its ambient halo + waveform + role-card. Background is a soft top-radial
 * gradient over the surface token so the avatar feels lit from above.
 */
export function Stage({ state, sector, role, level }: Props) {
  const theme = useTheme();
  const isDark = theme === "dark";

  // Stroke / fill palette per theme. Dark = cream on near-black; light =
  // near-black ink on white surface. Pupils stay dark in both so the eye
  // whites can read as distinct shapes inside the lashes.
  const avatarColours = isDark
    ? {
        ink: "#e8e3cf",
        faceFill: "rgba(232, 227, 207, 0.04)",
        hairFill: "#e8e3cf",
        pupil: "#0a0a0a",
        eyeWhite: "#e8e3cf",
      }
    : {
        ink: "#1a1a1f",
        faceFill: "rgba(20, 20, 30, 0.03)",
        hairFill: "#1a1a1f",
        pupil: "#0a0a0a",
        eyeWhite: "#ffffff",
      };

  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-[14px] border border-border"
      style={{
        minHeight: 600,
        background:
          "radial-gradient(ellipse at top, rgba(167,139,250,0.06), transparent 70%), var(--surface)",
      }}
    >
      <StageHalo state={state} />

      {/* Top — breadcrumb + status pill */}
      <div className="relative z-10 flex items-center justify-between border-b border-border px-5 py-4">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          <Sparkles size={11} style={{ color: "#a78bfa" }} />
          AI MÜLAKAT KOÇU · MIRA
        </div>
        <StatusPill state={state} />
      </div>

      {/* Avatar slot */}
      <div className="relative z-10 flex flex-1 items-center justify-center py-3" style={{ minHeight: 280 }}>
        <Avatar
          state={state}
          size={280}
          accent="#a78bfa"
          ink={avatarColours.ink}
          faceFill={avatarColours.faceFill}
          hairFill={avatarColours.hairFill}
          pupil={avatarColours.pupil}
          eyeWhite={avatarColours.eyeWhite}
        />
      </div>

      {/* Live waveform between avatar and role card */}
      <div className="relative z-10">
        <StageWave state={state} />
      </div>

      {/* Bottom — role card */}
      <div className="relative z-10 p-4 pt-1">
        <div className="rounded-[10px] border border-border bg-surface-2 px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] tracking-[0.06em]">
            <span
              className="rounded-[4px] border px-2 py-0.5 text-[10.5px] tracking-[0.12em]"
              style={{
                background: "rgba(167,139,250,0.12)",
                color: "#d3c2ff",
                borderColor: "rgba(167,139,250,0.24)",
              }}
            >
              {sector}
            </span>
            <span className="h-[3px] w-[3px] rounded-full bg-text-muted" />
            <span className="text-text">{role}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-text-muted" />
            <span className="text-text-2">{level}</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-snug text-text-muted">
            Mira sana role özel sorular soracak. Sesli cevapla ya da yazılıya geç —
            her ikisi de değerlendirmeye dahil.
          </p>
        </div>
      </div>
    </section>
  );
}
