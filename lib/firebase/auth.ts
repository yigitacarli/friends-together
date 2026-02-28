import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { ADMIN_EMAIL, DEFAULT_AVATAR_ID, DEFAULT_TAG_ID } from "@/lib/constants";
import { auth, db } from "@/lib/firebase/client";
import { ensureAvatarId, ensureTagId, normalizeEmail, slugifyUsername } from "@/lib/firebase/helpers";
import type { UserDoc, UserDocWrite } from "@/types/firestore";

const USERS_COLLECTION = "users";
const INVITES_COLLECTION = "invites";
const SETTINGS_COLLECTION = "settings";
const INVITE_CONFIG_DOC = "inviteConfig";

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  username?: string;
  avatarId?: string;
  tagId?: string;
  inviteCode?: string;
};

function requireAuth() {
  if (!auth) {
    throw new Error("Firebase Auth bu ortamda kullanılamıyor.");
  }
  return auth;
}

export async function isEmailInvited(email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const inviteRef = doc(db, INVITES_COLLECTION, normalizedEmail);
  const inviteSnapshot = await getDoc(inviteRef);

  return inviteSnapshot.exists();
}

export async function assertEmailInvited(email: string): Promise<void> {
  const invited = await isEmailInvited(email);
  if (!invited) {
    throw new Error("Bu e-posta için davet bulunamadı.");
  }
}

function defaultDisplayNameFromEmail(email: string): string {
  const local = normalizeEmail(email).split("@")[0] ?? "uye";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function defaultUsernameFromEmail(email: string): string {
  const local = normalizeEmail(email).split("@")[0] ?? "uye";
  return slugifyUsername(local);
}

async function getActiveInviteCode(): Promise<string> {
  const defaultCode = process.env.NEXT_PUBLIC_INVITE_CODE?.trim() || "TRACKER2026";
  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, INVITE_CONFIG_DOC));
  if (!snapshot.exists()) {
    return defaultCode;
  }

  const rawCode = (snapshot.data() as Record<string, unknown>).code;
  return typeof rawCode === "string" && rawCode.trim().length > 0 ? rawCode.trim() : defaultCode;
}

export async function registerInviteOnly(input: RegisterInput): Promise<void> {
  const normalizedInviteCode = input.inviteCode?.trim() ?? "";
  const globalInviteCode = await getActiveInviteCode();
  const hasValidCode = normalizedInviteCode.length > 0 && normalizedInviteCode === globalInviteCode;

  if (!hasValidCode) {
    await assertEmailInvited(input.email);
  }

  const normalizedEmail = normalizeEmail(input.email);
  const credential = await createUserWithEmailAndPassword(requireAuth(), normalizedEmail, input.password);
  const finalDisplayName = input.displayName.trim() || defaultDisplayNameFromEmail(normalizedEmail);
  const finalUsername = slugifyUsername(input.username?.trim() || finalDisplayName);
  const finalAvatarId = ensureAvatarId(input.avatarId ?? DEFAULT_AVATAR_ID);
  const finalTagId = ensureTagId(input.tagId ?? DEFAULT_TAG_ID);

  await updateProfile(credential.user, {
    displayName: finalDisplayName,
  });

  const userPayload: UserDocWrite = {
    uid: credential.user.uid,
    email: normalizedEmail,
    displayName: finalDisplayName,
    username: finalUsername,
    avatarId: finalAvatarId,
    tagId: finalTagId,
    role: normalizedEmail === ADMIN_EMAIL ? "admin" : "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), userPayload);
}

export async function loginInviteOnly(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(requireAuth(), normalizeEmail(email), password);
}

export async function logoutCurrentUser(): Promise<void> {
  await signOut(requireAuth());
}

export async function ensureUserDocument(user: User): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const normalizedEmail = normalizeEmail(user.email ?? "");
    const displayName = user.displayName?.trim() || defaultDisplayNameFromEmail(normalizedEmail);
    const username = defaultUsernameFromEmail(normalizedEmail);

    const fallbackPayload: UserDocWrite = {
      uid: user.uid,
      email: normalizedEmail,
      displayName,
      username,
      avatarId: DEFAULT_AVATAR_ID,
      tagId: DEFAULT_TAG_ID,
      role: normalizedEmail === ADMIN_EMAIL ? "admin" : "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, fallbackPayload);
    return;
  }

  const existing = snapshot.data() as Partial<UserDoc>;
  const normalizedEmail = normalizeEmail(user.email ?? "");
  const patch: Partial<UserDocWrite> = {
    updatedAt: serverTimestamp(),
  };

  if (!existing.avatarId) patch.avatarId = DEFAULT_AVATAR_ID;
  if (!existing.tagId) {
    patch.tagId =
      typeof (existing as Record<string, unknown>).title === "string"
        ? ((existing as Record<string, unknown>).title as string)
        : DEFAULT_TAG_ID;
  }
  if (!existing.displayName) patch.displayName = user.displayName || defaultDisplayNameFromEmail(user.email ?? "");
  if (!existing.username) patch.username = defaultUsernameFromEmail(user.email ?? "");
  if (!existing.role) patch.role = normalizedEmail === ADMIN_EMAIL ? "admin" : "user";
  if (normalizedEmail === ADMIN_EMAIL && existing.role !== "admin") patch.role = "admin";
  if (!existing.email) patch.email = normalizeEmail(user.email ?? "");

  await updateDoc(userRef, patch);
}
