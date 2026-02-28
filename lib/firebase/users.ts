import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { DEFAULT_TAG_ID } from "@/lib/constants";
import { db } from "@/lib/firebase/client";
import { ensureAvatarId, ensureTagId, slugifyUsername } from "@/lib/firebase/helpers";
import type { UserDoc } from "@/types/firestore";

const USERS_COLLECTION = "users";

type UpdateProfileInput = {
  displayName: string;
  username: string;
  tagId: string;
};

type RawUser = Partial<UserDoc> & Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  if (typeof value === "object" && value !== null) {
    const seconds = (value as { seconds?: unknown }).seconds;
    const nanoseconds = (value as { nanoseconds?: unknown }).nanoseconds;
    if (typeof seconds === "number") {
      return new Timestamp(seconds, typeof nanoseconds === "number" ? nanoseconds : 0);
    }
  }
  return Timestamp.now();
}

function asRole(value: unknown): "admin" | "user" {
  return value === "admin" ? "admin" : "user";
}

export function normalizeUserDoc(uid: string, raw: RawUser): UserDoc {
  const displayName = asString(raw.displayName, "Üye");
  const username = asString(raw.username, slugifyUsername(displayName));
  const legacyTitle = asString(raw.title).trim();
  const existingTagId = asString(raw.tagId).trim();
  const resolvedTagId = existingTagId || legacyTitle || DEFAULT_TAG_ID;

  return {
    uid,
    email: asString(raw.email),
    displayName,
    username,
    avatarId: ensureAvatarId(asString(raw.avatarId)),
    tagId: resolvedTagId,
    role: asRole(raw.role),
    createdAt: asTimestamp(raw.createdAt),
    updatedAt: asTimestamp(raw.updatedAt ?? raw.lastSeen),
  };
}

export function subscribeUserDocument(
  uid: string,
  onData: (profile: UserDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(normalizeUserDoc(snapshot.id, snapshot.data() as RawUser));
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function updateUserProfileDoc(uid: string, input: UpdateProfileInput): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    displayName: input.displayName.trim(),
    username: slugifyUsername(input.username.trim()),
    tagId: ensureTagId(input.tagId),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserByUid(uid: string): Promise<UserDoc | null> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserDoc(snapshot.id, snapshot.data() as RawUser);
}

export function subscribeMembers(
  onData: (members: UserDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const membersQuery = query(collection(db, USERS_COLLECTION));
  return onSnapshot(
    membersQuery,
    (snapshot) => {
      const members = snapshot.docs
        .map((memberSnapshot) => normalizeUserDoc(memberSnapshot.id, memberSnapshot.data() as RawUser))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(members);
    },
    (error) => {
      onError?.(error);
    },
  );
}
