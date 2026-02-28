import { ADMIN_TAG_OPTIONS, CONTENT_TYPE_OPTIONS, TAG_OPTIONS } from "@/lib/constants";
import type { FeedAuthor } from "@/types/feed";
import type { PostContentType, UserDoc } from "@/types/firestore";

export function formatRelativeDate(input: Date): string {
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - input.getTime()) / 1000));

  if (diffSeconds < 60) return "Az önce";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} dk önce`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} sa önce`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} gün önce`;

  return input.toLocaleDateString("tr-TR");
}

export function typeLabel(type: PostContentType): string {
  return CONTENT_TYPE_OPTIONS.find((option) => option.id === type)?.label ?? "İçerik";
}

export function typeToneClass(type: PostContentType): string {
  return (
    CONTENT_TYPE_OPTIONS.find((option) => option.id === type)?.toneClass ??
    CONTENT_TYPE_OPTIONS[0].toneClass
  );
}

export function resolveTagLabel(tagId: string): string {
  const allTags = [...TAG_OPTIONS, ...ADMIN_TAG_OPTIONS];
  return (
    allTags.find((tag) => tag.id === tagId)?.label ??
    allTags.find((tag) => tag.label === tagId)?.label ??
    (tagId.trim().length > 0 ? tagId : TAG_OPTIONS[0].label)
  );
}

export function initialsFromName(name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "FT";
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function toFeedAuthor(profile: UserDoc | null, fallbackUid: string): FeedAuthor {
  if (!profile) {
    return {
      uid: fallbackUid,
      displayName: "Üye",
      avatarLabel: "FT",
      tagLabel: "Üye",
      role: "user",
    };
  }

  return {
    uid: profile.uid,
    displayName: profile.displayName,
    avatarLabel: initialsFromName(profile.displayName) || "FT",
    tagLabel: profile.role === "admin" ? "👑 Admin" : resolveTagLabel(profile.tagId),
    role: profile.role,
  };
}
