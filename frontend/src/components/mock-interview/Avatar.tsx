"use client";

import { useEffect, useRef, useState } from "react";

export type AvatarState =
  | "speaking"
  | "listening"
  | "thinking"
  | "between"
  | "finalizing";

interface AvatarProps {
  state: AvatarState;
  size?: number;
  accent?: string;
  ink?: string;
  faceFill?: string;
  hairFill?: string;
  pupil?: string;
  eyeWhite?: string;
}

/**
 * Mira — sketchy humanoid AI coach. Wobble filter for hand-drawn feel,
 * pupils that subtly track the cursor, blink + idle-breathing + visemes
 * driven by a single rAF loop.
 *
 * Renders a single 200x200 viewBox SVG, plus state-aware overlays
 * (speaking rings / listening pulse ring / thinking swirl) layered on top.
 *
 * The `#wobble` filter is provided globally by <WobbleFilter />.
 */
export function Avatar({
  state = "speaking",
  size = 220,
  accent = "#a78bfa",
  ink = "#e8e3cf",
  faceFill = "rgba(232, 227, 207, 0.04)",
  hairFill = "#e8e3cf",
  pupil = "#0a0a0a",
  eyeWhite = "#e8e3cf",
}: AvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Single rAF clock driving breathing + visemes.
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Eye tracking — clamped offset relative to the avatar's centre.
  const [eye, setEye] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / Math.max(window.innerWidth / 2, 600);
      const dy = (e.clientY - cy) / Math.max(window.innerHeight / 2, 400);
      const max = 1.8;
      setEye({
        x: Math.max(-max, Math.min(max, dx * max * 1.8)),
        y: Math.max(-max, Math.min(max, dy * max * 1.4)),
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Blink — slower on idle, faster while listening.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const intervalMs = state === "listening" ? 2400 : 4200;
    const id = setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 130);
    }, intervalMs);
    return () => clearInterval(id);
  }, [state]);

  // Thinking dots cycle — only animated while state === thinking.
  const [dot, setDot] = useState(0);
  useEffect(() => {
    if (state !== "thinking") return;
    const id = setInterval(() => setDot((d) => (d + 1) % 3), 380);
    return () => clearInterval(id);
  }, [state]);

  const breathe = Math.sin(t * 1.4) * 0.5;
  const headTiltBase = state === "listening" ? -5 : state === "thinking" ? 4 : 0;
  const headTilt = headTiltBase + Math.sin(t * 0.6) * 0.6;
  const browLift = state === "thinking" ? -3 : 0;
  const browFurrow = state === "thinking" ? 2 : 0;

  // Viseme lips — 4 mouth shapes cycled while speaking.
  const visemes = [
    "M 89 134 Q 100 132, 111 134 Q 100 138, 89 134 Z",
    "M 90 132 Q 100 128, 110 132 Q 100 142, 90 132 Z",
    "M 87 134 Q 100 130, 113 134 Q 100 140, 87 134 Z",
    "M 90 130 Q 100 124, 110 130 Q 100 144, 90 130 Z",
  ];
  const visemeIdx = Math.floor((t * 5) % visemes.length);
  const lip = visemes[visemeIdx];

  // Pupil offsets with cursor tracking.
  const pupilL = { cx: 84 + eye.x, cy: 104 + eye.y };
  const pupilR = { cx: 116 + eye.x, cy: 104 + eye.y };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: size, height: size }}
      aria-hidden
    >
      {/* Speaking rings — accent-coloured dashed rings, breathing radius */}
      {state === "speaking" && (
        <svg
          viewBox="-50 -50 300 300"
          width={size * 1.4}
          height={size * 1.4}
          style={{
            position: "absolute",
            top: -size * 0.2,
            left: -size * 0.2,
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2].map((i) => {
            const r = 112 + i * 20 + Math.sin(t * Math.PI * 2 + i) * 5;
            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeDasharray="3 7"
                opacity={0.55 - i * 0.15}
                filter="url(#wobble)"
              />
            );
          })}
        </svg>
      )}

      {/* Listening pulse ring */}
      {state === "listening" && (
        <svg
          viewBox="-50 -50 300 300"
          width={size * 1.4}
          height={size * 1.4}
          style={{
            position: "absolute",
            top: -size * 0.2,
            left: -size * 0.2,
            pointerEvents: "none",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="118"
            fill="none"
            stroke="#34d399"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.4"
            filter="url(#wobble)"
          >
            <animate
              attributeName="r"
              values="115;132;115"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;0.08;0.5"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      )}

      {/* Thinking swirl */}
      {state === "thinking" && (
        <svg
          viewBox="-50 -50 300 300"
          width={size * 1.4}
          height={size * 1.4}
          style={{
            position: "absolute",
            top: -size * 0.2,
            left: -size * 0.2,
            pointerEvents: "none",
          }}
        >
          <g
            style={{
              transformOrigin: "100px 100px",
              animation: "mi-avatar-spin 5s linear infinite",
            }}
          >
            <path
              d="M 100 -10 A 110 110 0 0 1 210 100"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.2"
              strokeDasharray="4 8"
              filter="url(#wobble)"
            />
          </g>
        </svg>
      )}

      {/* Portrait */}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${headTilt}deg) translateY(${breathe}px)`,
          transformOrigin: "50% 65%",
          transition: "transform 600ms ease-out",
        }}
      >
        <g
          filter="url(#wobble)"
          fill="none"
          stroke={ink}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shoulders */}
          <g
            style={{
              transform: `translateY(${breathe * 0.6}px)`,
              transition: "transform 600ms ease-out",
            }}
          >
            <path d="M 26 200 Q 48 166, 78 158 L 122 158 Q 152 166, 174 200" />
            <path d="M 82 160 Q 100 174, 118 160" strokeOpacity="0.55" />
            <path
              d="M 36 188 L 42 182 M 46 192 L 52 186 M 156 188 L 150 182 M 146 192 L 140 186"
              strokeOpacity="0.35"
              strokeWidth="1.1"
            />
          </g>

          {/* Neck */}
          <line x1="86" y1="146" x2="86" y2="160" />
          <line x1="114" y1="146" x2="114" y2="160" />
          <path
            d="M 88 152 L 92 156 M 94 150 L 98 154 M 102 150 L 106 154 M 108 152 L 112 156"
            strokeOpacity="0.28"
            strokeWidth="1"
          />

          {/* Hair back */}
          <path
            d="M 52 76 Q 50 32, 100 26 Q 150 32, 148 76 Q 158 112, 148 142 L 138 138 Q 144 110, 142 88 Q 130 96, 118 94 Q 100 86, 82 94 Q 70 96, 58 88 Q 56 110, 62 138 L 52 142 Q 42 112, 52 76 Z"
            fill={hairFill}
            fillOpacity="0.08"
            stroke={ink}
            strokeWidth="1.3"
          />

          {/* Face */}
          <path
            d="M 64 86 Q 64 60, 100 58 Q 136 60, 136 86 Q 138 118, 124 136 Q 110 152, 100 152 Q 90 152, 76 136 Q 62 118, 64 86 Z"
            fill={faceFill}
          />

          {/* Hair front */}
          <path
            d="M 60 78 Q 64 48, 100 44 Q 142 48, 144 80 Q 132 70, 116 72 Q 108 60, 96 70 Q 80 64, 70 72 Q 64 76, 60 78 Z"
            fill={ink}
            fillOpacity="0.82"
            stroke={ink}
            strokeWidth="1.2"
          />
          <path d="M 58 80 Q 52 110, 60 140" strokeWidth="1.1" />
          <path d="M 142 80 Q 148 110, 140 140" strokeWidth="1.1" />

          {/* Ears — accent when listening */}
          <path
            d="M 62 102 Q 56 108, 60 122 Q 64 128, 68 124"
            stroke={state === "listening" ? "#34d399" : ink}
            strokeWidth={state === "listening" ? 2.2 : 1.5}
          />
          <path
            d="M 138 102 Q 144 108, 140 122 Q 136 128, 132 124"
            stroke={state === "listening" ? "#34d399" : ink}
            strokeWidth={state === "listening" ? 2.2 : 1.5}
          />
          <path d="M 62 112 Q 60 116, 63 120" strokeOpacity="0.5" />
          <path d="M 138 112 Q 140 116, 137 120" strokeOpacity="0.5" />

          {/* Eyebrows — lift + furrow when thinking */}
          <g
            style={{
              transform: `translateY(${browLift}px)`,
              transition: "transform 300ms ease",
            }}
          >
            <path
              d={`M 74 ${92 + browFurrow} Q 84 ${88 + browFurrow}, 94 92`}
              strokeWidth="1.7"
            />
            <path
              d={`M 106 92 Q 116 ${88 + browFurrow}, 126 ${92 + browFurrow}`}
              strokeWidth="1.7"
            />
          </g>

          {/* Eye lashes */}
          {!blink && state !== "thinking" && (
            <>
              <path
                d="M 74 102 L 73 100 M 77 100 L 76 98 M 81 99 L 81 97"
                strokeWidth="1"
              />
              <path
                d="M 126 102 L 127 100 M 123 100 L 124 98 M 119 99 L 119 97"
                strokeWidth="1"
              />
            </>
          )}

          {/* Eyes */}
          {state === "thinking" ? (
            <>
              <path d="M 74 104 Q 84 108, 94 104" />
              <path d="M 106 104 Q 116 108, 126 104" />
              <circle cx="84" cy="105" r="1.8" fill={pupil} stroke="none" />
              <circle cx="116" cy="105" r="1.8" fill={pupil} stroke="none" />
            </>
          ) : blink ? (
            <>
              <path d="M 74 104 Q 84 106, 94 104" />
              <path d="M 106 104 Q 116 106, 126 104" />
            </>
          ) : (
            <>
              <path
                d="M 74 104 Q 84 97, 94 104 Q 84 111, 74 104 Z"
                fill={eyeWhite}
              />
              <path
                d="M 106 104 Q 116 97, 126 104 Q 116 111, 106 104 Z"
                fill={eyeWhite}
              />
              <circle
                cx={pupilL.cx}
                cy={pupilL.cy}
                r="2.6"
                fill={pupil}
                stroke="none"
              />
              <circle
                cx={pupilR.cx}
                cy={pupilR.cy}
                r="2.6"
                fill={pupil}
                stroke="none"
              />
              <circle
                cx={pupilL.cx + 0.8}
                cy={pupilL.cy - 1}
                r="0.9"
                fill={eyeWhite}
                stroke="none"
              />
              <circle
                cx={pupilR.cx + 0.8}
                cy={pupilR.cy - 1}
                r="0.9"
                fill={eyeWhite}
                stroke="none"
              />
            </>
          )}

          {/* Nose */}
          <path
            d="M 100 110 Q 95 123, 100 127 Q 105 127, 105 124"
            strokeWidth="1.3"
            strokeOpacity="0.75"
          />
          <path
            d="M 97 125 Q 100 126, 103 125"
            strokeOpacity="0.4"
            strokeWidth="1"
          />

          {/* Mouth — state aware */}
          {state === "speaking" && (
            <>
              <path d={lip} fill={ink} fillOpacity="0.55" stroke={ink} />
              <path
                d="M 89 132 Q 94 131, 100 132 Q 106 131, 111 132"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
            </>
          )}
          {state === "listening" && (
            <>
              <path d="M 88 134 Q 100 141, 112 134" strokeWidth="1.6" />
              <path
                d="M 90 135 Q 100 138, 110 135"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </>
          )}
          {state === "thinking" && (
            <path d="M 90 136 Q 100 134, 110 138" strokeWidth="1.6" />
          )}
          {state === "between" && (
            <path
              d="M 90 136 Q 100 138, 110 136"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          )}
          {state === "finalizing" && (
            <path
              d="M 90 136 Q 100 138, 110 136"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          )}
        </g>

        {/* Thinking dots above head */}
        {state === "thinking" && (
          <g>
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={82 + i * 18}
                cy={20}
                r={dot === i ? 3.8 : 2.2}
                fill={ink}
                opacity={dot === i ? 1 : 0.35}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
