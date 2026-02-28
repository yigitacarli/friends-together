import type { FieldValue, Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "user";

export type PostContentType =
  | "kitap"
  | "film"
  | "dizi"
  | "oyun"
  | "anime"
  | "muzik"
  | "yazilim";

export type PostStatus = "tamamlandi" | "devam" | "planlandi" | "birakildi";

export type PostVisibility = "herkes" | "arkadaslar" | "sadeceBen";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  avatarId: string;
  tagId: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDocWrite extends Omit<UserDoc, "createdAt" | "updatedAt"> {
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface PostDoc {
  postId: string;
  authorUid: string;
  postKind?: "share" | "media";
  type: PostContentType;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likeCount: number;
  commentCount: number;
}

export interface PostDocWrite extends Omit<PostDoc, "createdAt" | "updatedAt"> {
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface PostLikeDoc {
  uid: string;
  postId: string;
  createdAt: Timestamp;
}

export interface PostLikeDocWrite extends Omit<PostLikeDoc, "createdAt"> {
  createdAt: FieldValue;
}

export interface PostCommentDoc {
  commentId: string;
  uid: string;
  text: string;
  createdAt: Timestamp;
}

export interface PostCommentDocWrite extends Omit<PostCommentDoc, "createdAt"> {
  createdAt: FieldValue;
}

export interface InviteDoc {
  email: string;
  createdAt: Timestamp;
  createdByUid: string;
}

export interface InviteDocWrite extends Omit<InviteDoc, "createdAt"> {
  createdAt: FieldValue;
}

export interface InviteConfigDoc {
  code: string;
  updatedByUid: string;
  updatedAt: Timestamp;
}

export interface InviteConfigDocWrite extends Omit<InviteConfigDoc, "updatedAt"> {
  updatedAt: FieldValue;
}
