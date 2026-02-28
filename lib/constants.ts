import type { PostContentType, PostStatus, PostVisibility } from "@/types/firestore";

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type AvatarOption = {
  id: string;
  label: string;
  description: string;
};

export type TagOption = {
  id: string;
  label: string;
};

export const ADMIN_EMAIL = "acarliyigit@gmail.com";

export const NAV_ITEMS: NavItem[] = [
  { id: "feed", label: "Akış", href: "/" },
  { id: "events", label: "Etkinlikler", href: "/events" },
  { id: "community", label: "Topluluk", href: "/community" },
  { id: "lobby", label: "Meydan", href: "/lobby" },
];

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "atlas", label: "AT", description: "Atlas" },
  { id: "luna", label: "LU", description: "Luna" },
  { id: "nova", label: "NV", description: "Nova" },
  { id: "poyraz", label: "PY", description: "Poyraz" },
  { id: "arya", label: "AR", description: "Arya" },
  { id: "deniz", label: "DN", description: "Deniz" },
  { id: "riva", label: "RV", description: "Riva" },
  { id: "mira", label: "MR", description: "Mira" },
];

export const TAG_OPTIONS: TagOption[] = [
  { id: "Caylak Uye", label: "Çaylak Üye" },
  { id: "Dizi Maratoncusu", label: "Dizi Maratoncusu" },
  { id: "Film Gurmesi", label: "Film Gurmesi" },
  { id: "Spoiler Canavari", label: "Spoiler Canavarı" },
  { id: "Uyku Tutmayan", label: "Uyku Tutmayan" },
  { id: "Keksever", label: "Keksever" },
  { id: "Profesyonel Tembel", label: "Profesyonel Tembel" },
  { id: "Meme Lordu", label: "Meme Lordu" },
  { id: "Kaos Yoneticisi", label: "Kaos Yöneticisi" },
  { id: "Haftasonu Savascisi", label: "Haftasonu Savaşçısı" },
  { id: "Gece Kusu", label: "Gece Kuşu" },
  { id: "Kitap Kurdu", label: "Kitap Kurdu" },
  { id: "Pixel Sanatcisi", label: "Pixel Sanatçısı" },
  { id: "Kod Buyucusu", label: "Kod Büyücüsü" },
  { id: "Kahve Bagimlisi", label: "Kahve Bağımlısı" },
];

export const ADMIN_TAG_OPTIONS: TagOption[] = [
  { id: "Admin Kurucu", label: "👑 Admin Kurucu" },
  { id: "Admin Moderator", label: "🛡️ Admin Moderatör" },
  { id: "Admin Topluluk", label: "✨ Admin Topluluk" },
];

export const DEFAULT_AVATAR_ID = AVATAR_OPTIONS[0].id;
export const DEFAULT_TAG_ID = TAG_OPTIONS[0].id;

export const CONTENT_TYPE_OPTIONS: Array<{
  id: PostContentType;
  label: string;
  toneClass: string;
}> = [
  { id: "film", label: "Film", toneClass: "from-[#2a2220] via-[#1f1b1a] to-[#161515] border-[#3f3430]/70" },
  { id: "kitap", label: "Kitap", toneClass: "from-[#1f2427] via-[#1a1f22] to-[#14181b] border-[#2f3a3f]/70" },
  { id: "dizi", label: "Dizi", toneClass: "from-[#262033] via-[#1e1a28] to-[#171520] border-[#3a3150]/70" },
  { id: "oyun", label: "Oyun", toneClass: "from-[#1e2431] via-[#171d29] to-[#121722] border-[#33435d]/70" },
  { id: "anime", label: "Anime", toneClass: "from-[#2f2131] via-[#281b29] to-[#1f1620] border-[#5b3a5f]/70" },
  { id: "muzik", label: "Müzik", toneClass: "from-[#2a2a1d] via-[#202017] to-[#17170f] border-[#5d5c34]/70" },
  { id: "yazilim", label: "Yazılım", toneClass: "from-[#1d2a2a] via-[#162020] to-[#101717] border-[#34615c]/70" },
];

export const POST_STATUS_OPTIONS: Array<{ id: PostStatus; label: string }> = [
  { id: "tamamlandi", label: "Tamamlandı" },
  { id: "devam", label: "Devam" },
  { id: "planlandi", label: "Planlandı" },
  { id: "birakildi", label: "Bırakıldı" },
];

export const VISIBILITY_OPTIONS: Array<{ id: PostVisibility; label: string }> = [
  { id: "herkes", label: "Herkes" },
  { id: "arkadaslar", label: "Arkadaşlar" },
  { id: "sadeceBen", label: "Sadece Ben" },
];

export const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  herkes: "Herkes",
  arkadaslar: "Arkadaşlar",
  sadeceBen: "Sadece Ben",
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  tamamlandi: "Tamamlandı",
  devam: "Devam",
  planlandi: "Planlandı",
  birakildi: "Bırakıldı",
};

export const SORT_OPTIONS = [
  { id: "yeni", label: "Yeni" },
  { id: "populer", label: "Popüler" },
] as const;

export type FeedSort = (typeof SORT_OPTIONS)[number]["id"];
