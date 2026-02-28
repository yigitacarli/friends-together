import { cn } from "@/lib/utils";

type AvatarProps = {
  fallback: string;
  className?: string;
};

export function Avatar({ fallback, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[linear-gradient(145deg,#20232a,#15171d)] text-sm font-semibold text-[var(--text-primary)]",
        className,
      )}
      aria-hidden="true"
    >
      {fallback}
    </span>
  );
}
