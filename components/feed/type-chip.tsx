import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PostContentType, PostStatus } from "@/types/firestore";

const mediaMap: Record<PostContentType, { label: string; className: string }> = {
  film: {
    label: "Film",
    className: "border-[#66513d] bg-[#c29a62]/10 text-[#d8b27e]",
  },
  kitap: {
    label: "Kitap",
    className: "border-[#445b4a] bg-[#6f8e72]/10 text-[#9ec7a3]",
  },
  dizi: {
    label: "Dizi",
    className: "border-[#514568] bg-[#7d6c9f]/10 text-[#b6a2dc]",
  },
  oyun: {
    label: "Oyun",
    className: "border-[#3f5673] bg-[#4b6b90]/10 text-[#9dc1ea]",
  },
  anime: {
    label: "Anime",
    className: "border-[#6c4d73] bg-[#88529a]/10 text-[#d2ace0]",
  },
  muzik: {
    label: "Müzik",
    className: "border-[#6f6a40] bg-[#7f7a50]/10 text-[#dbd398]",
  },
  yazilim: {
    label: "Yazılım",
    className: "border-[#3f6b65] bg-[#4d7e76]/10 text-[#9bd0c6]",
  },
};

const statusMap: Record<PostStatus, { label: string; className: string }> = {
  tamamlandi: {
    label: "Tamamlandı",
    className: "border-[var(--border-strong)] bg-white/5 text-[var(--text-secondary)]",
  },
  devam: {
    label: "Devam",
    className: "border-[var(--border-strong)] bg-white/5 text-[var(--text-secondary)]",
  },
  planlandi: {
    label: "Planlandı",
    className: "border-[var(--border-strong)] bg-white/5 text-[var(--text-secondary)]",
  },
  birakildi: {
    label: "Bırakıldı",
    className: "border-[var(--border-strong)] bg-white/5 text-[var(--text-secondary)]",
  },
};

type TypeChipProps =
  | { kind: "media"; value: PostContentType }
  | { kind: "status"; value: PostStatus };

export function TypeChip(props: TypeChipProps) {
  const conf = props.kind === "media" ? mediaMap[props.value] : statusMap[props.value];

  return (
    <Badge
      variant="default"
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] tracking-[0.12em]",
        conf.className,
      )}
    >
      {conf.label}
    </Badge>
  );
}
