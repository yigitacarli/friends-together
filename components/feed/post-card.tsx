import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Actions } from "@/components/feed/actions";
import { Rating } from "@/components/feed/rating";
import { TypeChip } from "@/components/feed/type-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VISIBILITY_LABELS } from "@/lib/constants";
import type { FeedItem } from "@/types/feed";

type PostCardProps = {
  item: FeedItem;
  index: number;
  onLikeToggle: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onEditClick?: (item: FeedItem) => void;
  onDeleteClick?: (item: FeedItem) => void;
  likeDisabled?: boolean;
  actionsDisabled?: boolean;
};

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.localeCompare(b, "tr", { sensitivity: "accent" }) === 0;
}

export function PostCard({
  item,
  index,
  onLikeToggle,
  onCommentClick,
  onEditClick,
  onDeleteClick,
  likeDisabled,
  actionsDisabled,
}: PostCardProps) {
  const isShare = item.postKind === "share";
  const cleanTitle = item.title.trim();
  const cleanReview = item.reviewText.trim();
  const duplicateTitleAndReview =
    cleanTitle.length > 0 && cleanReview.length > 0 && equalsIgnoreCase(cleanTitle, cleanReview);
  const showMediaReview = !isShare && cleanReview.length > 0 && !duplicateTitleAndReview;
  const shareText = cleanReview || cleanTitle;

  return (
    <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: `${index * 70}ms` }}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar fallback={item.author.avatarLabel} />
            <div>
              <Link
                href={`/members/${item.author.uid}`}
                className="text-left text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
              >
                {item.author.displayName}
              </Link>
              <p className="mt-0.5 text-xs tracking-wide text-[var(--text-muted)]">{item.author.tagLabel}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {item.createdAtText} · {VISIBILITY_LABELS[item.visibility]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isShare ? null : (
              <>
                <TypeChip kind="media" value={item.type} />
                <TypeChip kind="status" value={item.status} />
              </>
            )}
            {item.isOwner ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={actionsDisabled}
                  onClick={() => onEditClick?.(item)}
                  aria-label="Paylaşımı düzenle"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-300 hover:text-rose-200"
                  disabled={actionsDisabled}
                  onClick={() => onDeleteClick?.(item)}
                  aria-label="Paylaşımı sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {isShare ? (
          <Link
            href={`/posts/${item.postId}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 transition-colors hover:bg-white/[0.04]"
          >
            <p className="whitespace-pre-wrap text-[1.02rem] leading-relaxed text-[var(--text-primary)]">{shareText}</p>
          </Link>
        ) : (
          <Link
            href={`/posts/${item.postId}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              {item.coverUrl ? (
                <div className="h-[124px] w-[88px] shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-black/20">
                  <img
                    src={item.coverUrl}
                    alt={cleanTitle || "Kapak"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <CardTitle className="text-[1.7rem] leading-tight">{cleanTitle || "Paylaşım"}</CardTitle>
                <div className="mt-2">
                  <Rating value={item.rating} />
                </div>
                {showMediaReview ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">“{cleanReview}”</p>
                ) : null}
              </div>
            </div>
          </Link>
        )}

        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-[var(--border)] pt-4">
          <Actions
            likeCount={item.likeCount}
            commentCount={item.commentCount}
            likedByMe={item.likedByMe}
            onLikeToggle={() => onLikeToggle(item.postId)}
            onCommentClick={() => onCommentClick(item.postId)}
            likeDisabled={likeDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
