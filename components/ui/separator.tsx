import { cn } from "@/lib/utils";

type SeparatorProps = {
  className?: string;
};

export function Separator({ className }: SeparatorProps) {
  return <div className={cn("h-px w-full bg-[var(--border)]/80", className)} />;
}
