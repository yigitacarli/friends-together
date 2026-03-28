"use client";

import { Heart, MessageSquareMore } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionsProps = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentedByMe?: boolean;
  onLikeToggle: () => void;
  onCommentClick: () => void;
  likeDisabled?: boolean;
};

export function Actions({
  likeCount,
  commentCount,
  likedByMe,
  commentedByMe,
  onLikeToggle,
  onCommentClick,
  likeDisabled,
}: ActionsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Button
        type="button"
        variant="subtle"
        size="sm"
        disabled={likeDisabled}
        className={cn(
          "h-9 gap-1.5 rounded-xl border border-[#ff4fd8]/55 bg-[#ff4fd8]/16 px-3 text-xs font-semibold text-[#ffd9f7] hover:bg-[#ff4fd8]/24 hover:text-white",
          likedByMe && "border-[#ff7ae5] bg-[#ff4fd8]/42 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        )}
        onClick={onLikeToggle}
        aria-label="Beğen"
      >
        <Heart className={cn("h-4 w-4", likedByMe && "fill-current")} />
        <span>{likedByMe ? "Beğendin" : "Beğen"}</span>
        <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] leading-none text-current">{likeCount}</span>
      </Button>

      <Button
        type="button"
        variant="subtle"
        size="sm"
        className={cn(
          "h-9 gap-1.5 rounded-xl border border-[#f6d84c]/65 bg-[#f6d84c]/12 px-3 text-xs font-semibold text-[#fff1a6] hover:bg-[#f6d84c]/22 hover:text-white",
          commentedByMe && "bg-[#f6d84c]/34 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        )}
        onClick={onCommentClick}
        aria-label="Yorumlar"
      >
        <MessageSquareMore className="h-4 w-4" />
        <span>Yorum</span>
        <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] leading-none text-current">{commentCount}</span>
      </Button>
    </div>
  );
}
