"use client";

import { useEffect, useMemo, useState } from "react";

import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { CONTENT_TYPE_OPTIONS } from "@/lib/constants";
import { subscribePostsByAuthor } from "@/lib/firebase/posts";
import { formatRelativeDate, initialsFromName, resolveTagLabel } from "@/lib/format";
import type { PostDoc } from "@/types/firestore";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribePostsByAuthor(
      user.uid,
      (nextPosts) => {
        setPosts(nextPosts);
        setLoadingPosts(false);
      },
      () => {
        setLoadingPosts(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const statsByType = useMemo(() => {
    return CONTENT_TYPE_OPTIONS.map((type) => ({
      id: type.id,
      label: type.label,
      count: posts.filter((post) => post.type === type.id).length,
    }));
  }, [posts]);

  if (!profile) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Profil yükleniyor...</Card>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 md:px-8">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar fallback={initialsFromName(profile.displayName)} className="h-14 w-14 text-base" />
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none">
                  {profile.displayName}
                </h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">@{profile.username}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--accent)]">
                  {profile.role === "admin" ? "👑 Admin" : resolveTagLabel(profile.tagId)}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowEdit(true)}>
              Profili Düzenle
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">İstatistikler</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Toplam</p>
              <p className="mt-1 text-2xl font-semibold">{posts.length}</p>
            </div>
            {statsByType
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.count}</p>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Paylaşımlar</h2>
          {loadingPosts ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Paylaşımlar yükleniyor...</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Henüz paylaşım yok.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {posts.map((post) => {
                const displayTitle =
                  post.postKind === "share"
                    ? "Paylaşım"
                    : post.title.trim().length > 0
                      ? post.title
                      : "Paylaşım";
                const previewText = post.reviewText.trim().length > 0 ? post.reviewText : post.title;
                return (
                  <div key={post.postId} className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--text-primary)]">{displayTitle}</p>
                      <span className="text-xs text-[var(--text-muted)]">
                        {post.createdAt?.toDate?.() ? formatRelativeDate(post.createdAt.toDate()) : "Yeni"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{previewText}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <EditProfileModal open={showEdit} onOpenChange={setShowEdit} />
    </>
  );
}
