"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  /** Show blinking caret while typing. Default true */
  caret?: boolean;
  /** ms per 2 chars */
  speed?: number;
  className?: string;
}

/**
 * Typing-reveal display for AI generated text. When `text` changes, restarts
 * the animation.
 */
export function AiText({ text, caret = true, speed = 16, className }: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) {
      setDone(true);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      if (i >= text.length) {
        setShown(text);
        setDone(true);
        clearInterval(id);
      } else {
        setShown(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(id);
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
