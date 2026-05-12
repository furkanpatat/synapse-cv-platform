"use client";

import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";

import { messagingApi } from "@/lib/messaging-api";
import { getMessagingSocket } from "@/lib/ws-client";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { ConversationDto, MessageDto } from "@/types/messaging";

export function MessagingPanel({ viewer }: { viewer: "USER" | "COMPANY" }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // initial conversation list
  useEffect(() => {
    messagingApi
      .listConversations()
      .then((data) => {
        setConversations(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Konuşmalar yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  // load messages when active changes
  useEffect(() => {
    if (!activeId) return;
    messagingApi.getMessages(activeId).then(setMessages);
    messagingApi.markRead(activeId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeId]);

  // websocket: subscribe to incoming messages
  useEffect(() => {
    if (!accessToken) return;
    const socket = getMessagingSocket();
    socket.connect(accessToken);
    const unsub = socket.onMessage((m) => {
      if (m.conversationId === activeId) {
        setMessages((prev) =>
          prev.some((x) => x.id === m.id) ? prev : [...prev, m]
        );
      }
      // bump conv to top + update lastMessageAt
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === m.conversationId);
        if (idx === -1) {
          // new conversation — refetch list
          messagingApi.listConversations().then(setConversations);
          return prev;
        }
        const updated = {
          ...prev[idx],
          lastMessageAt: m.createdAt,
          unreadCount:
            m.conversationId === activeId
              ? 0
              : prev[idx].unreadCount + (m.senderId !== me?.id ? 1 : 0),
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    });
    return () => {
      unsub();
    };
  }, [accessToken, activeId, me?.id]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !activeId) return;
    const body = draft.trim();
    setDraft("");
    try {
      const m = await messagingApi.send({ conversationId: activeId, body });
      setMessages((prev) =>
        prev.some((x) => x.id === m.id) ? prev : [...prev, m]
      );
    } catch (err) {
      setError("Mesaj gönderilemedi");
      setDraft(body); // restore
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Henüz mesajın yok.
          {viewer === "USER"
            ? " Bir ilana başvurduğunda veya şirket sana yazdığında burada görünecek."
            : " Bir adaya mesaj attığında konuşma burada görünecek."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-160px)] grid-cols-[280px_1fr] overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Conversation list */}
      <aside className="overflow-y-auto border-r border-gray-200 dark:border-gray-800">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`flex w-full items-start justify-between gap-2 border-b border-gray-100 p-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
              activeId === c.id ? "bg-brand/5" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {viewer === "USER" ? c.companyName : c.userName}
              </p>
              <p className="truncate text-xs text-gray-500">
                {viewer === "USER" ? "Şirket" : c.userTitle ?? "Aday"}
              </p>
              <p className="text-xs text-gray-400">
                {c.lastMessageAt
                  ? new Date(c.lastMessageAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                {c.unreadCount}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* Conversation pane */}
      <section className="flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Bu konuşmada henüz mesaj yok. İlk mesajı sen at.
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = m.senderId === me?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-brand text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {!mine && (
                        <p className="mb-0.5 text-xs font-medium opacity-70">
                          {m.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          mine ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
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
              placeholder="Mesaj yaz... (Enter ile gönder)"
              className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={handleSend} disabled={!draft.trim()}>
              Gönder
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
