"use client";

import { useEffect, useMemo, useState } from "react";

import { ADMIN_TAG_OPTIONS, TAG_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  removeInvite,
  setInviteConfig,
  subscribeInviteConfig,
  subscribeInvites,
  upsertInvite,
  updateMemberBasicInfo,
} from "@/lib/firebase/admin";
import { subscribeMembers } from "@/lib/firebase/users";
import { initialsFromName } from "@/lib/format";
import type { InviteDoc, UserDoc } from "@/types/firestore";

type MemberDraft = {
  displayName: string;
  username: string;
  tagId: string;
};

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [members, setMembers] = useState<UserDoc[]>([]);
  const [memberDrafts, setMemberDrafts] = useState<Record<string, MemberDraft>>({});
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("TRACKER2026");
  const [savingInvite, setSavingInvite] = useState(false);
  const [savingInviteCode, setSavingInviteCode] = useState(false);
  const [savingMemberUid, setSavingMemberUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTags = useMemo(() => [...ADMIN_TAG_OPTIONS, ...TAG_OPTIONS], []);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribeInvites = subscribeInvites(setInvites, (inviteError) => setError(inviteError.message));
    const unsubscribeMembers = subscribeMembers(
      (nextMembers) => {
        setMembers(nextMembers);
        setMemberDrafts((prev) => {
          const nextDrafts: Record<string, MemberDraft> = { ...prev };
              nextMembers.forEach((member) => {
                if (!nextDrafts[member.uid]) {
                  nextDrafts[member.uid] = {
                    displayName: member.displayName,
                    username: member.username,
                    tagId: member.tagId,
                  };
                }
              });
          return nextDrafts;
        });
      },
      (membersError) => setError(membersError.message),
    );

    const unsubscribeInviteConfig = subscribeInviteConfig(
      (code) => {
        setInviteCodeInput(code);
      },
      (inviteCodeError) => setError(inviteCodeError.message),
    );

    return () => {
      unsubscribeInvites();
      unsubscribeMembers();
      unsubscribeInviteConfig();
    };
  }, [isAdmin]);

  const handleAddInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !newInviteEmail.trim()) return;
    setSavingInvite(true);
    setError(null);
    try {
      await upsertInvite(newInviteEmail, user.uid);
      setNewInviteEmail("");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Davet kaydedilemedi.");
    } finally {
      setSavingInvite(false);
    }
  };

  const handleSaveInviteCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSavingInviteCode(true);
    setError(null);
    try {
      await setInviteConfig(inviteCodeInput, user.uid);
    } catch (inviteCodeError) {
      setError(inviteCodeError instanceof Error ? inviteCodeError.message : "Davet kodu güncellenemedi.");
    } finally {
      setSavingInviteCode(false);
    }
  };

  const handleRemoveInvite = async (email: string) => {
    try {
      await removeInvite(email);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Davet silinemedi.");
    }
  };

  const setMemberDraftField = (uid: string, field: keyof MemberDraft, value: string) => {
    setMemberDrafts((prev) => ({
      ...prev,
      [uid]: {
        displayName: prev[uid]?.displayName ?? "",
        username: prev[uid]?.username ?? "",
        tagId: prev[uid]?.tagId ?? TAG_OPTIONS[0].id,
        [field]: value,
      },
    }));
  };

  const handleSaveMember = async (uid: string) => {
    const draft = memberDrafts[uid];
    if (!draft) return;

    setSavingMemberUid(uid);
    setError(null);
    try {
      await updateMemberBasicInfo(uid, {
        displayName: draft.displayName,
        username: draft.username,
        tagId: draft.tagId,
      });
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : "Üye güncellenemedi.");
    } finally {
      setSavingMemberUid(null);
    }
  };

  if (!isAdmin) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <Card className="p-8 text-center text-sm text-[var(--text-muted)]">
          Bu sayfaya yalnızca admin kullanıcıları erişebilir.
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 md:px-8">
      <Card className="p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Admin Paneli</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Davetleri ve üyeleri yönet.</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Davet Kodu</h2>
        <form onSubmit={handleSaveInviteCode} className="mt-4 flex flex-wrap gap-2">
          <input
            value={inviteCodeInput}
            onChange={(event) => setInviteCodeInput(event.target.value)}
            className="h-10 min-w-[16rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
            placeholder="TRACKER2026"
          />
          <Button type="submit" disabled={savingInviteCode}>
            {savingInviteCode ? "Kaydediliyor..." : "Kodu Güncelle"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Kayıt ekranındaki davet kodu doğrulaması bu değerle yapılır.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Davet Yönetimi (E-posta)</h2>
        <form onSubmit={handleAddInvite} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            value={newInviteEmail}
            onChange={(event) => setNewInviteEmail(event.target.value)}
            className="h-10 min-w-[16rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
            placeholder="davet@ornek.com"
          />
          <Button type="submit" disabled={savingInvite}>
            {savingInvite ? "Kaydediliyor..." : "Davet Ekle"}
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aktif davet bulunmuyor.</p>
          ) : (
            invites.map((invite) => (
              <div
                key={invite.email}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3"
              >
                <span className="text-sm">{invite.email}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveInvite(invite.email)}>
                  Kaldır
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Üyeler</h2>
        <div className="mt-4 space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Henüz üye bulunmuyor.</p>
          ) : (
            members.map((member) => {
              const draft = memberDrafts[member.uid] ?? {
                displayName: member.displayName,
                username: member.username,
                tagId: member.tagId,
              };
              return (
                <div
                  key={member.uid}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={initialsFromName(member.displayName)} className="h-10 w-10 text-xs" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent)]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_14rem_auto]">
                    <input
                      value={draft.displayName}
                      onChange={(event) => setMemberDraftField(member.uid, "displayName", event.target.value)}
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                      placeholder="İsim Soyisim"
                    />
                    <input
                      value={draft.username}
                      onChange={(event) => setMemberDraftField(member.uid, "username", event.target.value)}
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                      placeholder="kullanici.adi"
                    />
                    <select
                      value={draft.tagId}
                      onChange={(event) => setMemberDraftField(member.uid, "tagId", event.target.value)}
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                    >
                      {availableTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={() => handleSaveMember(member.uid)}
                      disabled={savingMemberUid === member.uid}
                    >
                      {savingMemberUid === member.uid ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {error ? <Card className="border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</Card> : null}
    </section>
  );
}
