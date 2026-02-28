"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/header";
import { Nav } from "@/components/layout/nav";
import { useAuth } from "@/components/providers/auth-provider";
import { useCompose } from "@/components/providers/compose-provider";
import { NAV_ITEMS } from "@/lib/constants";
import { subscribeMembers } from "@/lib/firebase/users";
import { initialsFromName, resolveTagLabel } from "@/lib/format";
import type { Member } from "@/types/feed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { profile, isAdmin, logout } = useAuth();
  const { openComposer } = useCompose();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeMembers((nextMembers) => {
      const now = Date.now();
      const mapped = nextMembers
        .filter((member) => member.uid !== profile?.uid)
        .slice(0, 8)
        .map((member) => {
          const lastActivity = member.updatedAt?.toMillis?.() ?? 0;
          return {
            uid: member.uid,
            name: member.displayName,
            avatarLabel: initialsFromName(member.displayName),
            isOnline: now - lastActivity < 15 * 60 * 1000,
          };
        });
      setMembers(mapped);
    });

    return unsubscribe;
  }, [profile?.uid]);

  const navItems = useMemo(() => {
    if (!isAdmin) {
      return NAV_ITEMS;
    }
    return [...NAV_ITEMS, { id: "admin", label: "Admin Paneli", href: "/admin" }];
  }, [isAdmin]);

  const currentUser = useMemo(
    () => ({
      name: profile?.displayName ?? "Üye",
      avatar: initialsFromName(profile?.displayName ?? "Üye"),
      role: profile?.role === "admin" ? "👑 Admin" : resolveTagLabel(profile?.tagId ?? ""),
    }),
    [profile?.displayName, profile?.role, profile?.tagId],
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_35rem_at_15%_-10%,rgba(194,154,98,0.18),transparent_60%),radial-gradient(45rem_25rem_at_95%_0%,rgba(255,255,255,0.05),transparent_55%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 border-r border-[var(--border)] bg-[var(--surface-alt)]/80 backdrop-blur md:block">
          <Nav currentUser={currentUser} navItems={navItems} members={members} activePath={pathname} />
        </aside>

        {sidebarOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/55 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Menüyü kapat"
            />
            <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[var(--surface-alt)]/95 shadow-2xl backdrop-blur md:hidden">
              <Nav currentUser={currentUser} navItems={navItems} members={members} activePath={pathname} />
            </aside>
          </>
        ) : null}

        <div className="min-w-0 flex-1">
          <Header
            onMenuToggle={() => setSidebarOpen(true)}
            onAddClick={openComposer}
            onLogoutClick={handleLogout}
            loggingOut={loggingOut}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
