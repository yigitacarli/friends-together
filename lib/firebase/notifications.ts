import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

const NOTIFICATIONS_COLLECTION = "notifications";

export type AppNotification = {
  id: string;
  toUserId: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Timestamp;
};

type RawNotification = Partial<AppNotification> & Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
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

function normalizeNotification(id: string, raw: RawNotification): AppNotification {
  return {
    id,
    toUserId: asString(raw.toUserId),
    type: asString(raw.type, "system"),
    data: typeof raw.data === "object" && raw.data !== null ? (raw.data as Record<string, unknown>) : {},
    read: asBoolean(raw.read),
    createdAt: asTimestamp(raw.createdAt),
  };
}

export function subscribeUserNotifications(
  uid: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("toUserId", "==", uid),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((docSnapshot) => normalizeNotification(docSnapshot.id, docSnapshot.data() as RawNotification))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        .slice(0, 50);
      onData(notifications);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
    read: true,
  });
}

export async function markAllNotificationsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((notification) => !notification.read);
  await Promise.all(unread.map((notification) => markNotificationRead(notification.id)));
}

export async function clearNotificationsForUser(uid: string): Promise<void> {
  const snapshot = await getDocs(
    query(collection(db, NOTIFICATIONS_COLLECTION), where("toUserId", "==", uid)),
  );

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });
  await batch.commit();
}

export async function clearNotificationsForEveryone(): Promise<void> {
  const snapshot = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
  if (snapshot.empty) return;

  let batch = writeBatch(db);
  let ops = 0;

  for (const docSnapshot of snapshot.docs) {
    batch.delete(docSnapshot.ref);
    ops += 1;

    if (ops === 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }
}
