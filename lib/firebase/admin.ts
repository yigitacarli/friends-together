import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { ensureTagId, normalizeEmail, slugifyUsername } from "@/lib/firebase/helpers";
import { normalizeUserDoc } from "@/lib/firebase/users";
import type { InviteConfigDoc, InviteConfigDocWrite, InviteDoc, InviteDocWrite, UserDoc } from "@/types/firestore";

const INVITES_COLLECTION = "invites";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const INVITE_CONFIG_DOC = "inviteConfig";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function subscribeInvites(
  onData: (invites: InviteDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const invitesQuery = query(collection(db, INVITES_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    invitesQuery,
    (snapshot) => {
      const invites = snapshot.docs.map((inviteSnapshot) => inviteSnapshot.data() as InviteDoc);
      onData(invites);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function upsertInvite(email: string, createdByUid: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const invitePayload: InviteDocWrite = {
    email: normalizedEmail,
    createdByUid,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, INVITES_COLLECTION, normalizedEmail), invitePayload);
}

export async function removeInvite(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await deleteDoc(doc(db, INVITES_COLLECTION, normalizedEmail));
}

export function subscribeMembers(
  onData: (members: UserDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const membersQuery = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    membersQuery,
    (snapshot) => {
      const members = snapshot.docs.map((memberSnapshot) =>
        normalizeUserDoc(memberSnapshot.id, memberSnapshot.data() as Record<string, unknown>),
      );
      onData(members);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeInviteConfig(
  onData: (code: string) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const defaultCode = process.env.NEXT_PUBLIC_INVITE_CODE?.trim() || "TRACKER2026";
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, INVITE_CONFIG_DOC),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(defaultCode);
        return;
      }

      const data = snapshot.data() as Partial<InviteConfigDoc>;
      onData(asString(data.code, defaultCode));
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function setInviteConfig(code: string, updatedByUid: string): Promise<void> {
  const cleanCode = code.trim();
  if (!cleanCode) {
    throw new Error("Davet kodu boş olamaz.");
  }

  const payload: InviteConfigDocWrite = {
    code: cleanCode,
    updatedByUid,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, SETTINGS_COLLECTION, INVITE_CONFIG_DOC), payload, { merge: true });
}

export async function updateMemberBasicInfo(
  uid: string,
  input: { displayName: string; username: string; tagId: string },
): Promise<void> {
  const cleanName = input.displayName.trim();
  const cleanUsername = input.username.trim();
  if (!cleanName) {
    throw new Error("İsim boş olamaz.");
  }
  if (!cleanUsername) {
    throw new Error("Kullanıcı adı boş olamaz.");
  }

  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    displayName: cleanName,
    username: slugifyUsername(cleanUsername),
    tagId: ensureTagId(input.tagId),
    updatedAt: serverTimestamp(),
  });
}
