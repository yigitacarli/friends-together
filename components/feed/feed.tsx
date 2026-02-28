"use client";

import { useState } from "react";

import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPE_OPTIONS, SORT_OPTIONS, VISIBILITY_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FeedSort } from "@/lib/constants";
import type { FeedItem } from "@/types/feed";
import type { PostContentType, PostVisibility } from "@/types/firestore";

type FeedProps = {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  typeFilter: PostContentType | "tum";
  sort: FeedSort;
  onTypeChange: (type: PostContentType | "tum") => void;
  onSortChange: (sort: FeedSort) => void;
  onCreateShare: (input: { text: string; visibility: PostVisibility }) => Promise<void>;
  shareSubmitting: boolean;
  onOpenPost: (postId: string) => void;
  onLikeToggle: (postId: string) => void;
  onEditPost: (item: FeedItem) => void;
  onDeletePost: (item: FeedItem) => void;
  pendingLikePostId: string | null;
  pendingActionPostId: string | null;
};

export function Feed({
  items,
  loading,
  error,
  typeFilter,
  sort,
  onTypeChange,
  onSortChange,
  onCreateShare,
  shareSubmitting,
  onOpenPost,
  onLikeToggle,
  onEditPost,
  onDeletePost,
  pendingLikePostId,
  pendingActionPostId,
}: FeedProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareVisibility, setShareVisibility] = useState<PostVisibility>("herkes");
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShareSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanText = shareText.trim();
    if (!cleanText) {
      setShareError("Paylaşım metni gerekli.");
      return;
    }

    setShareError(null);
    try {
      await onCreateShare({
        text: cleanText,
        visibility: shareVisibility,
      });
      setShareText("");
      setComposerOpen(false);
    } catch (shareSubmitError) {
      setShareError(
        shareSubmitError instanceof Error ? shareSubmitError.message : "Paylaşım gönderilemedi.",
      );
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex items-center justify-between gap-4 md:mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-wide text-[var(--text-primary)] md:text-5xl">
            Akış
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Arkadaş çevrenin paylaşımları</p>
        </div>
        <Button type="button" size="lg" className="shrink-0" onClick={() => setComposerOpen((prev) => !prev)}>
          Paylaş
        </Button>
      </header>

      {composerOpen ? (
        <form
          onSubmit={handleShareSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4"
        >
          <textarea
            value={shareText}
            onChange={(event) => setShareText(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--focus-ring)]"
            placeholder="Ne düşünüyorsun?"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              Görünürlük
              <select
                value={shareVisibility}
                onChange={(event) => setShareVisibility(event.target.value as PostVisibility)}
                className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--focus-ring)]"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setComposerOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={shareSubmitting}>
                {shareSubmitting ? "Paylaşılıyor..." : "Paylaş"}
              </Button>
            </div>
          </div>
          {shareError ? <p className="text-xs text-rose-300">{shareError}</p> : null}
        </form>
      ) : null}

      <div className="mb-5 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTypeChange("tum")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors",
              typeFilter === "tum"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)]",
            )}
          >
            Tümü
          </button>
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onTypeChange(option.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors",
                typeFilter === option.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Sırala</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as FeedSort)}
            className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--focus-ring)]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-10 text-center text-sm text-[var(--text-muted)]">
          Akış yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-10 text-center text-sm text-[var(--text-muted)]">
          Bu filtrede paylaşım bulunamadı.
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {items.map((item, index) => (
            <PostCard
              key={item.postId}
              item={item}
              index={index}
              onLikeToggle={onLikeToggle}
              onCommentClick={onOpenPost}
              onEditClick={onEditPost}
              onDeleteClick={onDeletePost}
              likeDisabled={pendingLikePostId === item.postId}
              actionsDisabled={pendingActionPostId === item.postId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
