import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  Timestamp,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import type { FeedSort } from "@/lib/constants";
import { db } from "@/lib/firebase/client";
import { normalizeUserDoc } from "@/lib/firebase/users";
import type {
  PostCommentDoc,
  PostCommentDocWrite,
  PostContentType,
  PostDoc,
  PostDocWrite,
  PostLikeDocWrite,
  PostStatus,
  PostVisibility,
  UserDoc,
} from "@/types/firestore";

const POSTS_COLLECTION = "posts";
const USERS_COLLECTION = "users";

export type FeedPost = {
  post: PostDoc;
  author: UserDoc | null;
  likedByMe: boolean;
};

export type CreatePostInput = {
  authorUid: string;
  postKind?: "share" | "media";
  type: PostContentType;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl?: string;
};

export type CreateSharePostInput = {
  authorUid: string;
  text: string;
  visibility: PostVisibility;
};

export type UpdatePostInput = {
  postId: string;
  uid: string;
  postKind: "share" | "media";
  type: PostContentType;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl?: string;
};

type SubscribeFeedParams = {
  uid: string;
  typeFilter: PostContentType | "tum";
  sort: FeedSort;
  onData: (posts: FeedPost[]) => void;
  onError?: (error: Error) => void;
};

type RawPost = Partial<PostDoc> & Record<string, unknown>;
type RawComment = Partial<PostCommentDoc> & Record<string, unknown>;

function normalizeType(value: unknown): PostContentType {
  if (
    value === "kitap" ||
    value === "film" ||
    value === "dizi" ||
    value === "oyun" ||
    value === "anime" ||
    value === "muzik" ||
    value === "yazilim"
  ) {
    return value;
  }

  if (value === "book") return "kitap";
  if (value === "movie") return "film";
  if (value === "series") return "dizi";
  if (value === "game") return "oyun";
  if (value === "music") return "muzik";
  if (value === "software") return "yazilim";

  return "film";
}

function normalizeStatus(value: unknown): PostStatus {
  if (value === "tamamlandi" || value === "devam" || value === "planlandi" || value === "birakildi") {
    return value;
  }

  if (value === "completed") return "tamamlandi";
  if (value === "in-progress") return "devam";
  if (value === "planned") return "planlandi";
  if (value === "dropped") return "birakildi";

  return "tamamlandi";
}

function normalizeVisibility(value: unknown): PostVisibility {
  if (value === "herkes" || value === "arkadaslar" || value === "sadeceBen") {
    return value;
  }

  if (value === "public") return "herkes";
  if (value === "friends") return "arkadaslar";
  if (value === "private") return "sadeceBen";

  return "herkes";
}

function normalizeRating(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const numeric = typeof value === "number" ? Math.round(value) : Number(value);
  if (numeric <= 1) return 1;
  if (numeric >= 5) return 5;
  if (numeric === 2 || numeric === 3 || numeric === 4) return numeric;
  return 3;
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

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function resolvePostKind(raw: RawPost): "share" | "media" {
  if (raw.postKind === "share" || raw.postKind === "media") {
    return raw.postKind;
  }

  const legacyContent = asString(raw.content).trim();
  const reviewText = asString(raw.reviewText).trim();
  const title = asString(raw.title).trim();

  if (legacyContent.length > 0 && title.length === 0) {
    return "share";
  }

  if (reviewText.length > 0 && title.length === 0 && typeof raw.type !== "string") {
    return "share";
  }

  return "media";
}

function normalizePostDoc(snapshotId: string, raw: RawPost): PostDoc {
  const postId = asString(raw.postId, snapshotId);
  const authorUid = asString(raw.authorUid, asString(raw.userId, `legacy-${snapshotId}`));
  const kind = resolvePostKind(raw);
  const legacyContent = asString(raw.content);
  const reviewText = asString(raw.reviewText, legacyContent).trim();
  const title = kind === "share" ? asString(raw.title).trim() : asString(raw.title, "Paylaşım").trim();
  const likeCount =
    asNumber(raw.likeCount, -1) >= 0
      ? asNumber(raw.likeCount)
      : Math.max(asStringArrayLength(raw.likes), asStringArrayLength(raw.upvotes));

  return {
    postId,
    authorUid,
    postKind: kind,
    type: normalizeType(raw.type),
    title,
    rating: normalizeRating(raw.rating),
    status: normalizeStatus(raw.status),
    visibility: normalizeVisibility(raw.visibility),
    reviewText,
    coverUrl: asString(raw.coverUrl),
    createdAt: asTimestamp(raw.createdAt),
    updatedAt: asTimestamp(raw.updatedAt ?? raw.createdAt),
    likeCount,
    commentCount: asNumber(raw.commentCount, 0),
  };
}

function normalizeCommentDoc(snapshotId: string, raw: RawComment): PostCommentDoc {
  return {
    commentId: asString(raw.commentId, snapshotId),
    uid: asString(raw.uid, asString(raw.userId, "unknown")),
    text: asString(raw.text, asString(raw.content, "")),
    createdAt: asTimestamp(raw.createdAt),
  };
}

function postCreatedAt(post: PostDoc): number {
  return post.createdAt?.toMillis?.() ?? 0;
}

function includeByVisibility(post: PostDoc, currentUid: string): boolean {
  if (post.visibility === "sadeceBen") {
    return post.authorUid === currentUid;
  }

  if (post.visibility === "arkadaslar") {
    // TODO: Arkadaslik modeli eklendiginde burada gercek filtre uygulanmali.
    return true;
  }

  return true;
}

function includeByType(post: PostDoc, typeFilter: PostContentType | "tum"): boolean {
  if (typeFilter === "tum") {
    return true;
  }

  // Share postlar tur bazli filtrede listelenmez.
  if (post.postKind === "share") {
    return false;
  }

  return post.type === typeFilter;
}

async function loadAuthors(authorUids: string[]): Promise<Map<string, UserDoc>> {
  const uniqueUids = uniqueNonEmpty(authorUids);
  const entries = await Promise.all(
    uniqueUids.map(async (uid) => {
      const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (!userSnapshot.exists()) {
        return null;
      }
      return [uid, normalizeUserDoc(userSnapshot.id, userSnapshot.data() as Record<string, unknown>)] as const;
    }),
  );

  const map = new Map<string, UserDoc>();
  entries.forEach((entry) => {
    if (!entry) return;
    map.set(entry[0], entry[1]);
  });
  return map;
}

async function loadLikeMap(postIds: string[], uid: string): Promise<Map<string, boolean>> {
  const validPostIds = uniqueNonEmpty(postIds);
  const entries = await Promise.all(
    validPostIds.map(async (postId) => {
      const likeSnapshot = await getDoc(doc(db, POSTS_COLLECTION, postId, "likes", uid));
      return [postId, likeSnapshot.exists()] as const;
    }),
  );

  const map = new Map<string, boolean>();
  entries.forEach(([postId, liked]) => map.set(postId, liked));
  return map;
}

function sortPosts(items: FeedPost[], sort: FeedSort): FeedPost[] {
  const cloned = [...items];
  if (sort === "populer") {
    cloned.sort((a, b) => {
      if (b.post.likeCount === a.post.likeCount) {
        return postCreatedAt(b.post) - postCreatedAt(a.post);
      }
      return b.post.likeCount - a.post.likeCount;
    });
    return cloned;
  }

  cloned.sort((a, b) => postCreatedAt(b.post) - postCreatedAt(a.post));
  return cloned;
}

export function subscribeFeedPosts(params: SubscribeFeedParams): Unsubscribe {
  const postsQuery = query(collection(db, POSTS_COLLECTION));

  return onSnapshot(
    postsQuery,
    async (snapshot) => {
      const postDocs = snapshot.docs.map((postSnapshot) =>
        normalizePostDoc(postSnapshot.id, postSnapshot.data() as RawPost),
      );
      const visiblePosts = postDocs.filter((post) => includeByVisibility(post, params.uid));
      const typedPosts = visiblePosts.filter((post) => includeByType(post, params.typeFilter));

      const uniqueAuthorUids = uniqueNonEmpty(typedPosts.map((post) => post.authorUid));
      const postIds = typedPosts.map((post) => post.postId);
      const [authorsMap, likesMap] = await Promise.all([
        loadAuthors(uniqueAuthorUids),
        loadLikeMap(postIds, params.uid),
      ]);

      const resolved: FeedPost[] = typedPosts.map((post) => ({
        post,
        author: authorsMap.get(post.authorUid) ?? null,
        likedByMe: likesMap.get(post.postId) ?? false,
      }));

      params.onData(sortPosts(resolved, params.sort));
    },
    (error) => {
      params.onError?.(error);
    },
  );
}

export async function createPost(input: CreatePostInput): Promise<string> {
  const postRef = doc(collection(db, POSTS_COLLECTION));
  const kind = input.postKind ?? "media";
  const cleanReview = input.reviewText.trim();
  const cleanTitle = input.title.trim();

  if (!cleanReview) {
    throw new Error("Paylaşım metni boş olamaz.");
  }

  if (kind === "media" && !cleanTitle) {
    throw new Error("Başlık alanı zorunludur.");
  }

  const payload: PostDocWrite = {
    postId: postRef.id,
    authorUid: input.authorUid,
    postKind: kind,
    type: input.type,
    title: cleanTitle,
    rating: input.rating,
    status: input.status,
    visibility: input.visibility,
    reviewText: cleanReview,
    coverUrl: input.coverUrl?.trim() || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
  };

  await setDoc(postRef, payload);
  return postRef.id;
}

export async function createSharePost(input: CreateSharePostInput): Promise<string> {
  const cleanText = input.text.trim();
  if (!cleanText) {
    throw new Error("Paylaşım metni boş olamaz.");
  }

  return createPost({
    authorUid: input.authorUid,
    postKind: "share",
    type: "film",
    title: "",
    rating: 3,
    status: "tamamlandi",
    visibility: input.visibility,
    reviewText: cleanText,
    coverUrl: "",
  });
}

export async function updatePost(input: UpdatePostInput): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, input.postId);
  const snapshot = await getDoc(postRef);
  if (!snapshot.exists()) {
    throw new Error("Paylaşım bulunamadı.");
  }

  const existing = normalizePostDoc(snapshot.id, snapshot.data() as RawPost);
  if (existing.authorUid !== input.uid) {
    throw new Error("Bu paylaşımı düzenleme iznin yok.");
  }

  const cleanReview = input.reviewText.trim();
  const cleanTitle = input.title.trim();
  if (!cleanReview) {
    throw new Error("Paylaşım metni boş olamaz.");
  }
  if (input.postKind === "media" && !cleanTitle) {
    throw new Error("Başlık alanı zorunludur.");
  }

  await updateDoc(postRef, {
    postKind: input.postKind,
    type: input.type,
    title: cleanTitle,
    rating: input.rating,
    status: input.status,
    visibility: input.visibility,
    reviewText: cleanReview,
    coverUrl: input.coverUrl?.trim() || "",
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string, uid: string): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const snapshot = await getDoc(postRef);
  if (!snapshot.exists()) {
    return;
  }

  const existing = normalizePostDoc(snapshot.id, snapshot.data() as RawPost);
  if (existing.authorUid !== uid) {
    throw new Error("Bu paylaşımı silme iznin yok.");
  }

  const [likesSnapshot, commentsSnapshot] = await Promise.all([
    getDocs(collection(db, POSTS_COLLECTION, postId, "likes")),
    getDocs(collection(db, POSTS_COLLECTION, postId, "comments")),
  ]);

  const batch = writeBatch(db);
  likesSnapshot.docs.forEach((likeDoc) => batch.delete(likeDoc.ref));
  commentsSnapshot.docs.forEach((commentDoc) => batch.delete(commentDoc.ref));
  batch.delete(postRef);
  await batch.commit();
}

export async function togglePostLike(postId: string, uid: string): Promise<boolean> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const likeRef = doc(db, POSTS_COLLECTION, postId, "likes", uid);

  return runTransaction(db, async (transaction) => {
    const postSnapshot = await transaction.get(postRef);
    const likeSnapshot = await transaction.get(likeRef);

    if (!postSnapshot.exists()) {
      throw new Error("Paylaşım bulunamadı.");
    }

    const post = normalizePostDoc(postSnapshot.id, postSnapshot.data() as RawPost);
    const currentLikeCount = post.likeCount ?? 0;

    if (likeSnapshot.exists()) {
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
        updatedAt: serverTimestamp(),
      });
      return false;
    }

    const likePayload: PostLikeDocWrite = {
      uid,
      postId,
      createdAt: serverTimestamp(),
    };
    transaction.set(likeRef, likePayload);
    transaction.update(postRef, {
      likeCount: currentLikeCount + 1,
      updatedAt: serverTimestamp(),
    });
    return true;
  });
}

export function subscribePostById(
  postId: string,
  uid: string,
  onData: (post: FeedPost | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  return onSnapshot(
    postRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const post = normalizePostDoc(snapshot.id, snapshot.data() as RawPost);
      if (!includeByVisibility(post, uid)) {
        onData(null);
        return;
      }

      const [authorSnapshot, likeSnapshot] = await Promise.all([
        getDoc(doc(db, USERS_COLLECTION, post.authorUid)),
        getDoc(doc(db, POSTS_COLLECTION, postId, "likes", uid)),
      ]);

      onData({
        post,
        author: authorSnapshot.exists()
          ? normalizeUserDoc(authorSnapshot.id, authorSnapshot.data() as Record<string, unknown>)
          : null,
        likedByMe: likeSnapshot.exists(),
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeComments(
  postId: string,
  onData: (comments: PostCommentDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const commentsQuery = query(collection(db, POSTS_COLLECTION, postId, "comments"));

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments = snapshot.docs
        .map((commentSnapshot) => normalizeCommentDoc(commentSnapshot.id, commentSnapshot.data() as RawComment))
        .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      onData(comments);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function addComment(postId: string, uid: string, text: string): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Yorum boş olamaz.");
  }

  const postRef = doc(db, POSTS_COLLECTION, postId);
  const commentRef = doc(collection(db, POSTS_COLLECTION, postId, "comments"));

  await runTransaction(db, async (transaction) => {
    const postSnapshot = await transaction.get(postRef);
    if (!postSnapshot.exists()) {
      throw new Error("Paylaşım bulunamadı.");
    }

    const post = normalizePostDoc(postSnapshot.id, postSnapshot.data() as RawPost);
    const payload: PostCommentDocWrite = {
      commentId: commentRef.id,
      uid,
      text: cleanText,
      createdAt: serverTimestamp(),
    };

    transaction.set(commentRef, payload);
    transaction.update(postRef, {
      commentCount: (post.commentCount ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getCommentAuthors(comments: PostCommentDoc[]): Promise<Map<string, UserDoc>> {
  const uniqueUids = uniqueNonEmpty(comments.map((comment) => comment.uid));
  return loadAuthors(uniqueUids);
}

export async function getPostCountByAuthor(authorUid: string): Promise<number> {
  const snapshot = await getDocs(collection(db, POSTS_COLLECTION));
  return snapshot.docs.reduce((count, docSnapshot) => {
    const post = normalizePostDoc(docSnapshot.id, docSnapshot.data() as RawPost);
    return post.authorUid === authorUid ? count + 1 : count;
  }, 0);
}

export function subscribePostsByAuthor(
  authorUid: string,
  onData: (posts: PostDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const postsQuery = query(collection(db, POSTS_COLLECTION));

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs
        .map((postSnapshot) => normalizePostDoc(postSnapshot.id, postSnapshot.data() as RawPost))
        .filter((post) => post.authorUid === authorUid)
        .sort((a, b) => postCreatedAt(b) - postCreatedAt(a));
      onData(posts);
    },
    (error) => {
      onError?.(error);
    },
  );
}
