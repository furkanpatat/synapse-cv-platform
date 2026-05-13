"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Web Speech API typings — TypeScript doesn't ship these and we don't want
// to add another @types dep. We only declare the bits we actually call.
// ============================================================================

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ============================================================================
// useSpeak — wraps SpeechSynthesisUtterance with a "wait until done" promise.
// ============================================================================

export interface SpeakOptions {
  lang?: string;        // default "tr-TR"
  rate?: number;        // 0.1 – 10, default 1
  pitch?: number;       // 0 – 2, default 1
  voiceName?: string;   // exact SpeechSynthesisVoice.name match
}

export function useSpeak() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) =>
      new Promise<void>((resolve) => {
        if (!supported || !text.trim()) {
          resolve();
          return;
        }
        // Cancel anything currently queued so we never overlap.
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = opts.lang ?? "tr-TR";
        u.rate = opts.rate ?? 1;
        u.pitch = opts.pitch ?? 1;
        if (opts.voiceName) {
          const v = window.speechSynthesis
            .getVoices()
            .find((vv) => vv.name === opts.voiceName);
          if (v) u.voice = v;
        } else {
          // Prefer a native Turkish voice if available.
          const tr = window.speechSynthesis
            .getVoices()
            .find((vv) => vv.lang.toLowerCase().startsWith("tr"));
          if (tr) u.voice = tr;
        }
        u.onstart = () => setSpeaking(true);
        u.onend = () => {
          setSpeaking(false);
          resolve();
        };
        u.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        window.speechSynthesis.speak(u);
      }),
    [supported]
  );

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, speak, cancel };
}

// ============================================================================
// useListen — wraps SpeechRecognition. Accumulates interim results into a
// single transcript so the UI can display live partial captions.
// ============================================================================

export interface ListenOptions {
  lang?: string;       // default "tr-TR"
  continuous?: boolean; // default true — keeps listening across pauses
  interim?: boolean;    // default true — emit partial results live
}

export function useListen() {
  const ctorRef = useRef<SpeechRecognitionCtor | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctor = getRecognitionCtor();
    ctorRef.current = ctor;
    setSupported(ctor !== null);
  }, []);

  const start = useCallback(
    (opts: ListenOptions = {}) => {
      const ctor = ctorRef.current;
      if (!ctor) {
        setError("Tarayıcı ses tanımayı desteklemiyor — Chrome veya Edge öner.");
        return;
      }
      // Reset state for a fresh recording
      finalRef.current = "";
      setTranscript("");
      setInterimText("");
      setError(null);

      const rec = new ctor();
      rec.lang = opts.lang ?? "tr-TR";
      rec.continuous = opts.continuous ?? true;
      rec.interimResults = opts.interim ?? true;
      rec.maxAlternatives = 1;

      rec.onresult = (e: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            finalRef.current += r[0].transcript + " ";
            setTranscript(finalRef.current.trim());
          } else {
            interim += r[0].transcript;
          }
        }
        setInterimText(interim);
      };
      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(`Mikrofon hatası: ${e.error}`);
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
        setInterimText("");
      };

      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch (ex) {
        setError("Mikrofon başlatılamadı: " + String(ex));
      }
    },
    []
  );

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterimText("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interimText,
    error,
    start,
    stop,
    reset,
  };
}
