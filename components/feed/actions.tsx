"use client";

import { Heart, MessageSquareMore } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionsProps = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  onLikeToggle: () => void;
  onCommentClick: () => void;
  likeDisabled?: boolean;
};

export function Actions({
  likeCount,
  commentCount,
  likedByMe,
  onLikeToggle,
  onCommentClick,
  likeDisabled,
}: ActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="subtle"
        size="sm"
        disabled={likeDisabled}
        className={cn(
          "gap-1.5 rounded-lg border border-transparent px-2.5",
          likedByMe && "border-[#4d5f4e] bg-[#3f5a42]/20 text-[#9dc8a0]",
        )}
        onClick={onLikeToggle}
        aria-label="Beğen"
      >
        <Heart className={cn("h-4 w-4", likedByMe && "fill-current")} />
        <span>{likeCount}</span>
      </Button>

      <Button
        type="button"
        variant="subtle"
        size="sm"
        className="gap-1.5 rounded-lg border border-[var(--border)] px-2.5 text-xs text-[var(--text-muted)]"
        onClick={onCommentClick}
        aria-label="Yorumlar"
      >
        <MessageSquareMore className="h-3.5 w-3.5" />
        <span>{commentCount}</span>
      </Button>
    </div>
  );
}
