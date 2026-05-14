"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  /** ms per character — design spec is 22ms. */
  speed?: number;
}

/**
 * Lightweight typewriter — reveals `text` one character at a time. Designed
 * to feel synchronous with the AI speaking the question aloud (TTS in the
 * page's useSpeak() hook), so the cursor at the end is purely cosmetic.
 *
 * For screen readers the parent should expose the full text via aria-label
 * — letter-by-letter reveal is not useful for AT users.
 */
export function Typewriter({ text, speed = 22 }: Props) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const id = setInterval(() => {
      setN((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const done = n >= text.length;
  return (
    <>
      {text.slice(0, n)}
      {!done && <span className="mi-tw-cursor" aria-hidden />}
    </>
  );
}
