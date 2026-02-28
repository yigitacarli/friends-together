import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type RatingProps = {
  value: number;
};

export function Rating({ value }: RatingProps) {
  return (
    <div
      className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
      aria-label={`Puan: ${value} / 5`}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= value
                ? "fill-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--border-strong)]",
            )}
          />
        ))}
      </div>
      <span className="font-medium text-[var(--text-secondary)]">{value.toFixed(1)}</span>
    </div>
  );
}
