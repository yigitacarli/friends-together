"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ADMIN_EMAIL } from "@/lib/constants";
import { auth } from "@/lib/firebase/client";
import {
  ensureUserDocument,
  loginInviteOnly,
  logoutCurrentUser,
  registerInviteOnly,
} from "@/lib/firebase/auth";
import { subscribeUserDocument, updateUserProfileDoc } from "@/lib/firebase/users";
import type { UserDoc } from "@/types/firestore";

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  username: string;
  tagId: string;
  inviteCode: string;
};

type UpdateProfileInput = {
  displayName: string;
  username: string;
  tagId: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserDoc | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Bir hata oluştu.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setAuthError("Firebase Auth yapılandırması eksik.");
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setUser(nextUser);

      try {
        if (!nextUser.email) {
          throw new Error("Hesap e-posta bilgisi eksik.");
        }

        await ensureUserDocument(nextUser);

        unsubscribeProfile = subscribeUserDocument(
          nextUser.uid,
          (nextProfile) => {
            setProfile(nextProfile);
            setLoading(false);
          },
          (error) => {
            setAuthError(toMessage(error));
            setLoading(false);
          },
        );
      } catch (error) {
        setAuthError(toMessage(error));
        await logoutCurrentUser();
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await loginInviteOnly(email, password);
    } catch (error) {
      const message = toMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setAuthError(null);
    try {
      await registerInviteOnly(input);
    } catch (error) {
      const message = toMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    await logoutCurrentUser();
  }, []);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!user) {
        throw new Error("Giriş yapılmadan profil güncellenemez.");
      }

      await updateUserProfileDoc(user.uid, input);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          displayName: input.displayName.trim(),
          username: input.username.trim(),
          tagId: input.tagId,
        };
      });
    },
    [user],
  );

  const isAdminUser =
    profile?.role === "admin" ||
    user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: isAdminUser,
      authError,
      clearAuthError,
      login,
      register,
      logout,
      updateProfile,
    }),
    [authError, clearAuthError, loading, login, logout, profile, register, updateProfile, user, isAdminUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
