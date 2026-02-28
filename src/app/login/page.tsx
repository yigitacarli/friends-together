"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_TAG_ID, TAG_OPTIONS } from "@/lib/constants";

type Mode = "login" | "register";

function firebaseMessage(message: string): string {
  if (message.includes("auth/invalid-credential")) return "E-posta veya şifre hatalı.";
  if (message.includes("auth/user-not-found")) return "E-posta veya şifre hatalı.";
  if (message.includes("auth/wrong-password")) return "E-posta veya şifre hatalı.";
  if (message.includes("auth/email-already-in-use")) return "Bu e-posta zaten kullanılıyor.";
  if (message.includes("auth/weak-password")) return "Şifre en az 6 karakter olmalı.";
  if (message.includes("auth/invalid-email")) return "Geçerli bir e-posta gir.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, register, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [tagId, setTagId] = useState(DEFAULT_TAG_ID);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    clearAuthError();
    setFormError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();
    setFormError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!displayName.trim()) throw new Error("Görünen isim gerekli.");
        if (!username.trim()) throw new Error("Kullanıcı adı gerekli.");
        if (!inviteCode.trim()) throw new Error("Davet kodu gerekli.");
        await register({
          email,
          password,
          displayName,
          username,
          tagId,
          inviteCode,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bir hata oluştu.";
      setFormError(firebaseMessage(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-[var(--border-strong)]">
        <div className="border-b border-[var(--border)] px-6 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Invite-Only</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none">Friends Together</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {mode === "login" ? "Giriş yap" : "Davetli üyeler için hesap oluştur"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          {mode === "register" ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Görünen İsim</span>
                <input
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Adın"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Kullanıcı Adı</span>
                <input
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="kullanici.adi"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Tag</span>
                <select
                  value={tagId}
                  onChange={(event) => setTagId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                >
                  {TAG_OPTIONS.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Davet Kodu</span>
                <input
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="TRACKER2026"
                />
              </label>
            </>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">E-posta</span>
            <input
              type="email"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Şifre</span>
            <input
              type="password"
              minLength={6}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
            />
          </label>

          {formError || authError ? (
            <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {formError ?? authError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "İşleniyor..."
                : mode === "login"
                  ? "Giriş Yap"
                  : "Hesap Oluştur"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Kayıt Ol" : "Giriş Yap"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
