"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribePostsByAuthor } from "@/lib/firebase/posts";
import { subscribeUserDocument } from "@/lib/firebase/users";
import { formatRelativeDate, initialsFromName, resolveTagLabel } from "@/lib/format";
import type { PostDoc, UserDoc } from "@/types/firestore";

export default function MemberProfilePage() {
  const params = useParams<{ uid: string }>();
  const uid = params?.uid;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeUserDocument(
      uid,
      (nextProfile) => {
        setProfile(nextProfile);
        setLoadingProfile(false);
      },
      (subscribeError) => {
        setError(subscribeError.message);
        setLoadingProfile(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribePostsByAuthor(
      uid,
      (nextPosts) => {
        setPosts(nextPosts);
        setLoadingPosts(false);
      },
      (subscribeError) => {
        setError(subscribeError.message);
        setLoadingPosts(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  if (!uid) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Geçersiz profil.</Card>
      </section>
    );
  }

  if (loadingProfile) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Profil yükleniyor...</Card>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">Üye bulunamadı.</Card>
      </section>
    );
  }

  const isCurrentUser = user?.uid === profile.uid;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 md:px-8">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar fallback={initialsFromName(profile.displayName)} className="h-14 w-14 text-base" />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none">{profile.displayName}</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">@{profile.username}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--accent)]">
                {profile.role === "admin" ? "Admin" : resolveTagLabel(profile.tagId)}
              </p>
            </div>
          </div>
          {isCurrentUser ? (
            <Button asChild type="button" variant="outline">
              <Link href="/profile">Kendi Profili Düzenle</Link>
            </Button>
          ) : null}
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
              const title = post.postKind === "share" ? "Paylaşım" : post.title.trim() || "Paylaşım";
              const preview = post.reviewText.trim() || post.title.trim();
              return (
                <Link
                  key={post.postId}
                  href={`/posts/${post.postId}`}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[var(--text-primary)]">{title}</p>
                    <span className="text-xs text-[var(--text-muted)]">
                      {post.createdAt?.toDate?.() ? formatRelativeDate(post.createdAt.toDate()) : "Yeni"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{preview}</p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {error ? <Card className="p-4 text-sm text-rose-300">{error}</Card> : null}
    </section>
  );
}
