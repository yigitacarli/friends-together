"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { ADMIN_TAG_OPTIONS, TAG_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [tagId, setTagId] = useState(TAG_OPTIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagOptions = useMemo(
    () => (profile?.role === "admin" ? [...ADMIN_TAG_OPTIONS, ...TAG_OPTIONS] : TAG_OPTIONS),
    [profile?.role],
  );

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setTagId(profile.tagId);
  }, [profile, open]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      setError("İsim ve kullanıcı adı gerekli.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        displayName,
        username,
        tagId,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profil güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={() => onOpenChange(false)}
    >
      <Card
        className="w-full max-w-lg border-[var(--border-strong)] bg-[var(--surface)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Profili Düzenle</h2>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Görünen İsim</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Kullanıcı Adı</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Tag</span>
              <select
                value={tagId}
                onChange={(event) => setTagId(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
              >
                {tagOptions.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
