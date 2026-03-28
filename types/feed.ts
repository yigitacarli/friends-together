import type { FeedSort } from "@/lib/constants";
import type { PostContentType, PostStatus, PostVisibility, UserRole } from "@/types/firestore";

export type FeedAuthor = {
  uid: string;
  displayName: string;
  avatarLabel: string;
  tagLabel: string;
  role: UserRole;
};

export type FeedItem = {
  postId: string;
  authorUid: string;
  postKind: "share" | "media";
  type: PostContentType;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl?: string;
  createdAtText: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentedByMe?: boolean;
  isOwner?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  author: FeedAuthor;
};

export type FeedFilters = {
  type: PostContentType | "tum";
  sort: FeedSort;
};

export type Member = {
  uid: string;
  name: string;
  avatarLabel: string;
  isOnline: boolean;
};
