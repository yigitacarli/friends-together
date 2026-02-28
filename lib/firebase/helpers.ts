import { ADMIN_TAG_OPTIONS, AVATAR_OPTIONS, DEFAULT_AVATAR_ID, DEFAULT_TAG_ID, TAG_OPTIONS } from "@/lib/constants";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function slugifyUsername(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return base.length > 2 ? base : `user.${Math.random().toString(36).slice(2, 7)}`;
}

export function avatarLabelById(avatarId: string): string {
  return AVATAR_OPTIONS.find((item) => item.id === avatarId)?.label ?? AVATAR_OPTIONS[0].label;
}

export function avatarDescriptionById(avatarId: string): string {
  return (
    AVATAR_OPTIONS.find((item) => item.id === avatarId)?.description ??
    AVATAR_OPTIONS[0].description
  );
}

export function ensureAvatarId(avatarId?: string): string {
  if (!avatarId) return DEFAULT_AVATAR_ID;
  return AVATAR_OPTIONS.some((option) => option.id === avatarId) ? avatarId : DEFAULT_AVATAR_ID;
}

export function ensureTagId(tagId?: string): string {
  if (!tagId) return DEFAULT_TAG_ID;
  return [...TAG_OPTIONS, ...ADMIN_TAG_OPTIONS].some((option) => option.id === tagId) ? tagId : DEFAULT_TAG_ID;
}
