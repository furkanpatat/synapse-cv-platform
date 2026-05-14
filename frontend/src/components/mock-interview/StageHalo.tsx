"use client";

import type { AvatarState } from "./Avatar";

interface Props {
  state: AvatarState;
}

/**
 * Two radial gradient blobs that drift slowly behind the avatar. Colour
 * follows the conversation state (accent for speaking, emerald for
 * listening, amber for thinking, accent fallback otherwise). The drift is
 * deliberately slow (14-18 s) so it reads as ambience rather than motion.
 */
export function StageHalo({ state }: Props) {
  const colour =
    state === "listening"
      ? "#34d399"
      : state === "thinking"
        ? "#fbbf24"
        : "#a78bfa";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 mi-halo-drift"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${colour}55 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 mi-halo-drift-2"
        style={{
          background: `radial-gradient(circle at 30% 70%, ${colour}30 0%, transparent 55%)`,
        }}
      />
    </div>
  );
}
