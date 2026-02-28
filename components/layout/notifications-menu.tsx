"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  clearNotificationsForEveryone,
  clearNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeUserNotifications,
  type AppNotification,
} from "@/lib/firebase/notifications";
import { formatRelativeDate, initialsFromName } from "@/lib/format";

function notificationText(item: AppNotification): string {
  const name = typeof item.data?.userName === "string" ? item.data.userName : "Bir üye";

  switch (item.type) {
    case "like":
      return `${name} paylaşımını beğendi.`;
    case "comment":
      return `${name} paylaşımına yorum yaptı.`;
    case "friend_request":
      return `${name} sana arkadaşlık isteği gönderdi.`;
    case "friend_accept":
      return `${name} arkadaşlık isteğini kabul etti.`;
    default:
      return `${name} bir bildirim gönderdi.`;
  }
}

function notificationTarget(item: AppNotification): string | null {
  if (typeof item.data?.postId === "string") {
    return `/posts/${item.data.postId}`;
  }
  if (typeof item.data?.userId === "string") {
    return `/members/${item.data.userId}`;
  }
  return null;
}

export function NotificationsMenu() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoClearedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeUserNotifications(
      user.uid,
      (nextItems) => {
        setItems(nextItems);
        setError(null);
      },
      (subscribeError) => {
        setError(subscribeError.message);
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || autoClearedRef.current || items.length === 0) return;

    autoClearedRef.current = true;
    clearNotificationsForEveryone().catch((clearError) => {
      setError(clearError instanceof Error ? clearError.message : "Genel bildirim temizleme başarısız.");
    });
  }, [isAdmin, items]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  if (!user) {
    return null;
  }

  const clearMine = async () => {
    setClearing(true);
    setError(null);
    try {
      await clearNotificationsForUser(user.uid);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Bildirimler temizlenemedi.");
    } finally {
      setClearing(false);
    }
  };

  const clearEveryone = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm("Tüm kullanıcıların bildirimleri silinsin mi?");
    if (!confirmed) return;

    setClearing(true);
    setError(null);
    try {
      await clearNotificationsForEveryone();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Genel bildirim temizleme başarısız.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="relative"
        aria-label="Bildirimler"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[90vw] max-w-[22rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Bildirimler</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  className="text-xs text-[var(--accent)] transition-colors hover:text-[var(--text-primary)]"
                  onClick={() => markAllNotificationsRead(items).catch(() => undefined)}
                >
                  Okundu yap
                </button>
              ) : null}
              <button
                type="button"
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                onClick={clearMine}
                disabled={clearing}
              >
                Temizle
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  className="text-xs text-rose-300 transition-colors hover:text-rose-200"
                  onClick={clearEveryone}
                  disabled={clearing}
                >
                  Herkesi temizle
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto ft-scrollbar">
            {error ? <p className="p-3 text-xs text-rose-300">{error}</p> : null}
            {items.length === 0 ? (
              <p className="p-4 text-sm text-[var(--text-muted)]">Henüz bildirim yok.</p>
            ) : (
              items.map((item) => {
                const date = item.createdAt?.toDate?.() ?? new Date();
                const text = notificationText(item);
                const target = notificationTarget(item);
                const authorName = typeof item.data?.userName === "string" ? item.data.userName : "Üye";
                const content = (
                  <div
                    className={[
                      "flex items-start gap-2 border-b border-[var(--border)] p-3 text-left transition-colors",
                      item.read ? "bg-transparent" : "bg-white/[0.03]",
                      "hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <Avatar fallback={initialsFromName(authorName)} className="h-8 w-8 text-xs" />
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{formatRelativeDate(date)}</p>
                    </div>
                  </div>
                );

                if (target) {
                  return (
                    <Link
                      key={item.id}
                      href={target}
                      onClick={() => {
                        setOpen(false);
                        if (!item.read) {
                          markNotificationRead(item.id).catch(() => undefined);
                        }
                      }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (!item.read) {
                        markNotificationRead(item.id).catch(() => undefined);
                      }
                    }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
