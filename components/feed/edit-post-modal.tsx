"use client";

import { Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTENT_TYPE_OPTIONS, POST_STATUS_OPTIONS, VISIBILITY_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/feed";
import type { PostContentType, PostStatus, PostVisibility } from "@/types/firestore";

type EditPostModalProps = {
  open: boolean;
  post: FeedItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    postId: string;
    postKind: "share" | "media";
    type: PostContentType;
    title: string;
    rating: 1 | 2 | 3 | 4 | 5;
    status: PostStatus;
    visibility: PostVisibility;
    reviewText: string;
    coverUrl: string;
  }) => Promise<void>;
};

type FormState = {
  type: PostContentType;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl: string;
};

const INITIAL_FORM: FormState = {
  type: "film",
  title: "",
  rating: 3,
  status: "tamamlandi",
  visibility: "herkes",
  reviewText: "",
  coverUrl: "",
};

export function EditPostModal({ open, post, onOpenChange, onSave }: EditPostModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !post) {
      return;
    }

    setForm({
      type: post.type,
      title: post.title,
      rating: post.rating,
      status: post.status,
      visibility: post.visibility,
      reviewText: post.reviewText,
      coverUrl: post.coverUrl ?? "",
    });
    setError(null);
    setSaving(false);
  }, [open, post]);

  const requiredMissing = useMemo(() => {
    if (!post) return "Paylaşım bulunamadı.";
    if (!form.reviewText.trim()) return "Yorum alanı gerekli.";
    if (post.postKind === "media" && !form.title.trim()) return "Başlık gerekli.";
    return null;
  }, [form.reviewText, form.title, post]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post) {
      setError("Paylaşım bulunamadı.");
      return;
    }
    if (requiredMissing) {
      setError(requiredMissing);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        postId: post.postId,
        postKind: post.postKind,
        type: form.type,
        title: form.title,
        rating: form.rating,
        status: form.status,
        visibility: form.visibility,
        reviewText: form.reviewText,
        coverUrl: form.coverUrl,
      });
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={() => onOpenChange(false)}
    >
      <Card
        className="w-full max-w-2xl border-[var(--border-strong)] bg-[var(--surface)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Paylaşımı Düzenle</h2>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {post.postKind === "media" ? (
              <>
                <div>
                  <p className="mb-2 text-sm text-[var(--text-secondary)]">Tür</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CONTENT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, type: option.id }))}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition-colors",
                          form.type === option.id
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-white/5",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--text-secondary)]">Başlık</span>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                      placeholder="Başlık"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--text-secondary)]">Kapak URL</span>
                    <input
                      value={form.coverUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                      placeholder="https://"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--text-secondary)]">Durum</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, status: event.target.value as PostStatus }))
                      }
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                    >
                      {POST_STATUS_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--text-secondary)]">Görünürlük</span>
                    <select
                      value={form.visibility}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          visibility: event.target.value as PostVisibility,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                    >
                      {VISIBILITY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-sm text-[var(--text-secondary)]">Puan</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, rating: star as FormState["rating"] }))}
                        className="rounded-sm p-1"
                        aria-label={`${star} yıldız`}
                      >
                        <Star
                          className={cn(
                            "h-6 w-6",
                            star <= form.rating
                              ? "fill-[var(--accent)] text-[var(--accent)]"
                              : "text-[var(--border-strong)]",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Görünürlük</span>
                <select
                  value={form.visibility}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      visibility: event.target.value as PostVisibility,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Yorum</span>
              <textarea
                value={form.reviewText}
                onChange={(event) => setForm((prev) => ({ ...prev, reviewText: event.target.value }))}
                className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--focus-ring)]"
                placeholder="Yorumunu düzenle"
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
