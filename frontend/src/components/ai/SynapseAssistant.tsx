"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2, Bot } from "lucide-react";

import { chatApi, type ChatMessage } from "@/lib/chat-api";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/auth-store";

export function SynapseAssistant() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lazy-load history first time the widget opens
  useEffect(() => {
    if (!open || loadedOnce || !accessToken) return;
    chatApi.history()
      .then((h) => setHistory(h))
      .catch(() => setHistory([]))
      .finally(() => setLoadedOnce(true));
  }, [open, loadedOnce, accessToken]);

  // Autoscroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, open]);

  const handleSend = async () => {
    const msg = draft.trim();
    if (!msg || sending) return;
    setDraft("");
    setHistory((h) => [...h, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await chatApi.send(msg);
      setHistory(res.history);
    } catch {
      toast.error(
        "Yanıt alınamadı",
        "Asistan şu an yanıt veremiyor. Birkaç saniye sonra tekrar dene."
      );
      // Restore the user message for editing
      setHistory((h) => h.slice(0, -1));
      setDraft(msg);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Konuşma geçmişi silinsin mi?")) return;
    try {
      await chatApi.clear();
      setHistory([]);
      toast.info("Geçmiş silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  if (!accessToken) return null;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full ai-grad text-white shadow-[0_20px_40px_-12px_rgba(59,130,246,0.6)] transition hover:scale-105"
          aria-label="Synapse AI Asistan"
          style={{ animation: "brightness-pulse 3s ease-in-out infinite" }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]"
             style={{ height: "min(620px, calc(100vh - 5rem))" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3.5"
               style={{ background: "linear-gradient(110deg, hsla(280,88%,67%,0.08), hsla(190,85%,56%,0.08))" }}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg ai-grad text-white">
                <Bot size={15} />
              </span>
              <div>
                <p className="text-[13px] font-semibold tracking-tight">Synapse Asistan</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  <Sparkles size={9} className="inline text-ai-2" /> Senin verilerini biliyor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="icon-btn"
                  style={{ width: 28, height: 28 }}
                  aria-label="Geçmişi sil"
                  title="Geçmişi sil"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                aria-label="Kapat"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5">
            {history.length === 0 && !sending ? (
              <Welcome onPick={(q) => setDraft(q)} />
            ) : (
              <div className="space-y-2.5">
                {history.map((m, i) => (
                  <Bubble key={i} message={m} />
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                      <span className="inline-flex gap-1">
                        <Dot delay="0s" />
                        <Dot delay="0.15s" />
                        <Dot delay="0.3s" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder="Synapse'e sor... (Enter ile gönder)"
                className="flex-1 resize-none rounded-md border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-text-muted focus:border-text focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="btn btn--ai btn--sm"
                style={{ alignSelf: "stretch" }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  const samples = [
    "Bu hafta hangi ilana başvurmalıyım?",
    "CV'mi nasıl iyileştiririm?",
    "AI skorumu yorumlar mısın?",
    "Eksik yetkinliklerim neler?",
  ];
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ai-grad text-white">
        <Sparkles size={20} />
      </div>
      <h3 className="text-[15px] font-semibold tracking-[-0.015em]">
        Merhaba, ben <span className="ai-text">Synapse</span>
      </h3>
      <p className="mt-1.5 text-[12.5px] text-text-2 leading-snug">
        CV&apos;ni, AI yetkinlik raporunu ve başvurularını biliyorum.
        Soru sor ya da aşağıdaki örneklerle başla:
      </p>
      <div className="mt-4 flex flex-col gap-1.5">
        {samples.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-[12.5px] text-text-2 transition hover:border-ai-2/50 hover:text-text"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap ${
          mine
            ? "ai-grad text-white"
            : "bg-surface-2 text-text"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted"
      style={{
        animation: `core-pulse 1.2s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}
