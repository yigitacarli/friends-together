import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

const CHAT_COLLECTION = "chat_messages";

export type LobbyMessage = {
  id: string;
  uid: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
};

type RawLobbyMessage = Partial<LobbyMessage> & Record<string, unknown>;

type SendLobbyMessageInput = {
  uid: string;
  userName: string;
  text: string;
};

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

function normalizeLobbyMessage(id: string, raw: RawLobbyMessage): LobbyMessage {
  return {
    id,
    uid: asString(raw.uid, asString(raw.userId, "unknown")),
    userName: asString(raw.userName, asString(raw.displayName, "Üye")),
    text: asString(raw.text, asString(raw.content, "")),
    createdAt: asTimestamp(raw.createdAt),
  };
}

export function subscribeLobbyMessages(
  onData: (messages: LobbyMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(db, CHAT_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(80),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map((docSnapshot) => normalizeLobbyMessage(docSnapshot.id, docSnapshot.data() as RawLobbyMessage))
        .reverse();
      onData(messages);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function sendLobbyMessage(input: SendLobbyMessageInput): Promise<void> {
  const cleanText = input.text.trim();
  if (!cleanText) {
    throw new Error("Mesaj boş olamaz.");
  }

  await addDoc(collection(db, CHAT_COLLECTION), {
    uid: input.uid,
    userId: input.uid,
    userName: input.userName,
    text: cleanText,
    createdAt: serverTimestamp(),
  });
}
