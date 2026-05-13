"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  /** Show blinking caret while typing. Default true */
  caret?: boolean;
  /** ms per chunk (faster = smaller). Default 8 */
  speed?: number;
  className?: string;
}

/**
 * Typing-reveal display for AI generated text. Animates in chunks so even
 * long responses finish in <1.5 s. Falls back to instant render for very
 * long texts to avoid stuck mid-word states.
 */
export function AiText({ text, caret = true, speed = 8, className }: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  // Keep latest text in a ref so cleanups don't drop the final value.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) {
      setDone(true);
      return;
    }
    // For long outputs (>600 chars) skip animation entirely — typing through
    // a 2k char response is annoying and prone to stuck states on re-render.
    if (text.length > 600) {
      setShown(text);
      setDone(true);
      return;
    }
    // Animate: ~80 frames total regardless of length
    const totalFrames = 80;
    const charsPerFrame = Math.max(1, Math.ceil(text.length / totalFrames));
    let i = 0;
    const id = setInterval(() => {
      i += charsPerFrame;
      if (i >= text.length) {
        setShown(text);
        setDone(true);
        clearInterval(id);
      } else {
        setShown(text.slice(0, i));
      }
    }, speed);
    return () => {
      clearInterval(id);
      // Ensure the full text is shown if the effect is torn down mid-animation
      // (e.g., React strict-mode double-invoke, parent re-render with same prop).
      setShown(textRef.current);
      setDone(true);
    };
  }, [text, speed]);

  return (
    <span
      className={`whitespace-pre-wrap ${className ?? ""}`}
      style={{ wordBreak: "break-word" }}
    >
      {shown}
      {caret && !done && (
        <span
          className="ml-0.5 inline-block"
          style={{
            color: "hsl(218 92% 62%)",
            animation: "caret 1s steps(2) infinite",
          }}
        >
          ▍
        </span>
      )}
    </span>
  );
}
