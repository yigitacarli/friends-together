"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { subscribeMembers } from "@/lib/firebase/users";
import { initialsFromName, resolveTagLabel } from "@/lib/format";
import { memberPath } from "@/lib/routes";
import type { UserDoc } from "@/types/firestore";

export default function CommunityPage() {
  const [members, setMembers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMembers(
      (nextMembers) => {
        setMembers(nextMembers);
        setLoading(false);
      },
      (subscribeError) => {
        setError(subscribeError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 md:px-8">
      <Card className="p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Topluluk</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Siteye kayıtlı tüm üyeler.</p>
      </Card>

      <Card className="p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Üyeler yükleniyor...</p>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Henüz üye yok.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <Link
                key={member.uid}
                href={memberPath(member.uid)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <Avatar fallback={initialsFromName(member.displayName)} className="h-10 w-10 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{member.displayName}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">@{member.username}</p>
                    <p className="truncate text-xs tracking-wide text-[var(--accent)]">
                      {member.role === "admin" ? "Admin" : resolveTagLabel(member.tagId)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
