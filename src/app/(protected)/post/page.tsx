"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EditPostModal } from "@/components/feed/edit-post-modal";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import {
  addComment,
  deletePost,
  getCommentAuthors,
  subscribeComments,
  subscribePostById,
  togglePostLike,
  updatePost,
  type FeedPost,
} from "@/lib/firebase/posts";
import { formatRelativeDate, toFeedAuthor } from "@/lib/format";
import { memberPath } from "@/lib/routes";
import type { FeedItem } from "@/types/feed";
import type { PostCommentDoc, UserDoc } from "@/types/firestore";

function toFeedItem(row: FeedPost, currentUid?: string): FeedItem {
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
    createdAtText: formatRelativeDate(row.post.createdAt?.toDate?.() ?? new Date()),
    likeCount: row.post.likeCount,
    commentCount: row.post.commentCount,
    likedByMe: row.likedByMe,
    isOwner: currentUid ? row.post.authorUid === currentUid : false,
    author: toFeedAuthor(row.author, row.post.authorUid),
  };
}

export default function PostDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [postRow, setPostRow] = useState<FeedPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<PostCommentDoc[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<Map<string, UserDoc>>(new Map());
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingActionPostId, setPendingActionPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<FeedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postId = searchParams?.get("id")?.trim() ?? "";

  useEffect(() => {
    if (!user || !postId) return;

    const unsubscribe = subscribePostById(
      postId,
      user.uid,
      (row) => {
        setPostRow(row);
        setLoadingPost(false);
      },
      (postError) => {
        setError(postError.message);
        setLoadingPost(false);
      },
    );

    return unsubscribe;
  }, [postId, user]);

  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeComments(
      postId,
      (nextComments) => {
        setComments(nextComments);
      },
      (commentError) => {
        setError(commentError.message);
      },
    );

    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const map = await getCommentAuthors(comments);
      if (!cancelled) {
        setCommentAuthors(map);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [comments]);

  const postItem = useMemo(() => (postRow ? toFeedItem(postRow, user?.uid) : null), [postRow, user?.uid]);

  const handleLikeToggle = async () => {
    if (!user || !postId) return;
    setPendingLike(true);
    try {
      await togglePostLike(postId, user.uid);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Beğeni güncellenemedi.");
    } finally {
      setPendingLike(false);
    }
  };

  const handleDeletePost = async (item: FeedItem) => {
    if (!user || !item.isOwner) return;
    const confirmed = window.confirm("Bu paylaşımı silmek istediğine emin misin?");
    if (!confirmed) return;

    setPendingActionPostId(item.postId);
    try {
      await deletePost(item.postId, user.uid);
      router.replace("/");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Paylaşım silinemedi.");
    } finally {
      setPendingActionPostId(null);
    }
  };

  const handleSavePost = async (input: {
    postId: string;
    postKind: "share" | "media";
    type: "kitap" | "film" | "dizi" | "oyun" | "anime" | "muzik" | "yazilim";
    title: string;
    rating: 1 | 2 | 3 | 4 | 5;
    status: "tamamlandi" | "devam" | "planlandi" | "birakildi";
    visibility: "herkes" | "arkadaslar" | "sadeceBen";
    reviewText: string;
    coverUrl: string;
  }) => {
    if (!user) {
      throw new Error("Giriş yapman gerekiyor.");
    }

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

  const handleAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !postId) return;
    if (!commentInput.trim()) return;
    setSendingComment(true);
    try {
      await addComment(postId, user.uid, commentInput);
      setCommentInput("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Yorum eklenemedi.");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
      </div>

      {!postId ? (
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Geçersiz paylaşım bağlantısı.</Card>
      ) : loadingPost ? (
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Paylaşım yükleniyor...</Card>
      ) : !postItem ? (
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">
          Paylaşım bulunamadı veya görüntüleme iznin yok.
        </Card>
      ) : (
        <PostCard
          item={postItem}
          index={0}
          onLikeToggle={handleLikeToggle}
          onCommentClick={() => undefined}
          onEditClick={(item) => setEditingPost(item)}
          onDeleteClick={handleDeletePost}
          likeDisabled={pendingLike}
          actionsDisabled={pendingActionPostId === postItem.postId}
        />
      )}

      <Card className="mt-4 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Yorumlar</h2>

        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <input
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
            placeholder="Yorum yaz"
          />
          <Button type="submit" disabled={sendingComment}>
            {sendingComment ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Henüz yorum yok.</p>
          ) : (
            comments.map((comment) => {
              const author = commentAuthors.get(comment.uid);
              return (
                <div
                  key={comment.commentId}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={memberPath(comment.uid)}
                      className="text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
                    >
                      {author?.displayName ?? "Üye"}
                    </Link>
                    <span className="text-xs text-[var(--text-muted)]">
                      {comment.createdAt?.toDate?.() ? formatRelativeDate(comment.createdAt.toDate()) : "Yeni"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{comment.text}</p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <EditPostModal
        open={Boolean(editingPost)}
        post={editingPost}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null);
          }
        }}
        onSave={handleSavePost}
      />
    </section>
  );
}
