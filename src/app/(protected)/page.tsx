"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Feed } from "@/components/feed/feed";
import { EditPostModal } from "@/components/feed/edit-post-modal";
import { useAuth } from "@/components/providers/auth-provider";
import type { FeedSort } from "@/lib/constants";
import { formatRelativeDate, toFeedAuthor } from "@/lib/format";
import { postPath } from "@/lib/routes";
import {
  createSharePost,
  deletePost,
  subscribeFeedPosts,
  togglePostLike,
  updatePost,
  type FeedPost,
} from "@/lib/firebase/posts";
import type { FeedItem } from "@/types/feed";
import type { PostContentType, PostVisibility } from "@/types/firestore";

function toFeedItems(rows: FeedPost[], currentUid?: string): FeedItem[] {
  return rows.map((row) => {
    const createdAt = row.post.createdAt?.toDate?.() ?? new Date();
    return {
      postId: row.post.postId,
      authorUid: row.post.authorUid,
      postKind: row.post.postKind ?? "media",
      type: row.post.type,
      title: row.post.title,
      rating: row.post.rating,
      status: row.post.status,
      visibility: row.post.visibility,
      reviewText: row.post.reviewText,
      coverUrl: row.post.coverUrl,
      createdAtText: formatRelativeDate(createdAt),
      likeCount: row.post.likeCount,
      commentCount: row.post.commentCount,
      likedByMe: row.likedByMe,
      commentedByMe: row.commentedByMe,
      isOwner: currentUid ? row.post.authorUid === currentUid : false,
      canEdit: currentUid ? row.post.authorUid === currentUid : false,
      canDelete: currentUid ? row.post.authorUid === currentUid : false,
      author: toFeedAuthor(row.author, row.post.authorUid),
    };
  });
}

export default function FeedPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PostContentType | "tum">("tum");
  const [sort, setSort] = useState<FeedSort>("yeni");
  const [pendingLikePostId, setPendingLikePostId] = useState<string | null>(null);
  const [pendingActionPostId, setPendingActionPostId] = useState<string | null>(null);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedItem | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeFeedPosts({
      uid: user.uid,
      typeFilter,
      sort,
      onData: (nextRows) => {
        setRows(nextRows);
        setLoading(false);
        setError(null);
      },
      onError: (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    });

    return unsubscribe;
  }, [sort, typeFilter, user]);

  const items = useMemo(
    () =>
      toFeedItems(rows, user?.uid).map((item) => ({
        ...item,
        canEdit: item.isOwner,
        canDelete: item.isOwner || isAdmin,
      })),
    [isAdmin, rows, user?.uid],
  );

  const onLikeToggle = async (postId: string) => {
    if (!user) return;
    setPendingLikePostId(postId);
    try {
      await togglePostLike(postId, user.uid);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Beğeni güncellenemedi.");
    } finally {
      setPendingLikePostId(null);
    }
  };

  const onOpenPost = (postId: string) => {
    router.push(postPath(postId));
  };

  const onCreateShare = async (input: { text: string; visibility: PostVisibility }) => {
    if (!user) {
      throw new Error("Paylaşım için giriş yapman gerekiyor.");
    }
    setShareSubmitting(true);
    try {
      await createSharePost({
        authorUid: user.uid,
        text: input.text,
        visibility: input.visibility,
      });
    } finally {
      setShareSubmitting(false);
    }
  };

  const onDeletePost = async (item: FeedItem) => {
    if (!user || !item.canDelete) return;
    const confirmed = window.confirm("Bu paylaşımı silmek istediğine emin misin?");
    if (!confirmed) return;

    setPendingActionPostId(item.postId);
    try {
      await deletePost(item.postId, user.uid, isAdmin);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Paylaşım silinemedi.");
    } finally {
      setPendingActionPostId(null);
    }
  };

  const onSaveEdit = async (input: {
    postId: string;
    postKind: "share" | "media";
    type: PostContentType;
    title: string;
    rating: 1 | 2 | 3 | 4 | 5;
    status: "tamamlandi" | "devam" | "planlandi" | "birakildi";
    visibility: PostVisibility;
    reviewText: string;
    coverUrl: string;
  }) => {
    if (!user) throw new Error("Giriş yapman gerekiyor.");
    setPendingActionPostId(input.postId);
    try {
      await updatePost({
        ...input,
        uid: user.uid,
      });
      setEditingPost(null);
    } finally {
      setPendingActionPostId(null);
    }
  };

  return (
    <>
      <Feed
        items={items}
        loading={loading}
        error={error}
        typeFilter={typeFilter}
        sort={sort}
        onTypeChange={setTypeFilter}
        onSortChange={setSort}
        onCreateShare={onCreateShare}
        shareSubmitting={shareSubmitting}
        onOpenPost={onOpenPost}
        onLikeToggle={onLikeToggle}
        onEditPost={(item) => setEditingPost(item)}
        onDeletePost={onDeletePost}
        pendingLikePostId={pendingLikePostId}
        pendingActionPostId={pendingActionPostId}
      />

      <EditPostModal
        open={Boolean(editingPost)}
        post={editingPost}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null);
          }
        }}
        onSave={onSaveEdit}
      />
    </>
  );
}
