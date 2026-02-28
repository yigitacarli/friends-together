"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { sendLobbyMessage, subscribeLobbyMessages, type LobbyMessage } from "@/lib/firebase/chat";
import { initialsFromName } from "@/lib/format";

function formatChatTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LobbyPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeLobbyMessages(
      (nextMessages) => {
        setMessages(nextMessages);
        setLoading(false);
      },
      (subscribeError) => {
        setError(subscribeError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const cleanText = input.trim();
    if (!cleanText) return;

    setSending(true);
    setError(null);
    try {
      await sendLobbyMessage({
        uid: user.uid,
        userName: profile?.displayName?.trim() || user.displayName || "Üye",
        text: cleanText,
      });
      setInput("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-3 px-3 py-4 md:space-y-4 md:px-8 md:py-8">
      <Card className="p-4 md:p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">Sohbet Alanı</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Tüm üyelerin görebildiği ortak sohbet alanı.</p>
      </Card>

      <Card className="p-3 sm:p-4 md:p-5">
        <div className="ft-scrollbar max-h-[62vh] space-y-3 overflow-y-auto pr-1 sm:pr-2 md:max-h-[55vh]">
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Mesajlar yükleniyor...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Henüz mesaj yok.</p>
          ) : (
            messages.map((message) => {
              const isMine = message.uid === user?.uid;
              const messageTime = message.createdAt?.toDate?.() ?? new Date();
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {isMine ? null : <Avatar fallback={initialsFromName(message.userName)} className="h-8 w-8 text-xs" />}

                  <div
                    className={[
                      "max-w-[84%] rounded-xl border px-3 py-2 sm:max-w-[78%]",
                      isMine
                        ? "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[var(--text-primary)]"
                        : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {isMine ? null : (
                      <p className="mb-0.5 text-xs font-semibold tracking-wide text-[var(--text-muted)]">
                        {message.userName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                    <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">{formatChatTime(messageTime)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
            placeholder="Mesajını yaz..."
          />
          <Button type="submit" disabled={sending || !user} className="shrink-0">
            {sending ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </Card>
    </section>
  );
}
