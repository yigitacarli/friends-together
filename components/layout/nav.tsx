import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Globe2,
  Home,
  LibraryBig,
  MessageSquare,
  Shield,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/feed";

type NavItem = {
  id: string;
  label: string;
  href: string;
};

const iconMap = {
  feed: Home,
  events: CalendarDays,
  community: Globe2,
  lobby: MessageSquare,
  collection: LibraryBig,
  stats: BarChart3,
  admin: Shield,
} as const;

type NavProps = {
  currentUser: {
    name: string;
    avatar: string;
    role: string;
  };
  navItems: NavItem[];
  members: Member[];
  activePath: string;
};

function isActive(activePath: string, href: string): boolean {
  if (href === "/") {
    return activePath === "/" || activePath.startsWith("/posts/");
  }
  return activePath.startsWith(href);
}

export function Nav({ currentUser, navItems, members, activePath }: NavProps) {
  return (
    <div className="flex h-full flex-col px-4 py-5">
      <Link
        href="/profile"
        className="mb-6 rounded-xl border border-[var(--border)] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3">
          <Avatar fallback={currentUser.avatar} className="h-11 w-11 text-sm" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{currentUser.name}</p>
            <p className="text-xs tracking-wide text-[var(--accent)]">{currentUser.role}</p>
          </div>
        </div>
      </Link>

      <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Menü</p>
      <nav className="space-y-1" aria-label="Ana menü">
        {navItems.map((item) => {
          const Icon = iconMap[item.id as keyof typeof iconMap] ?? Home;
          const active = isActive(activePath, item.href);
          return (
            <Button
              key={item.id}
              asChild
              variant="ghost"
              className={cn(
                "h-10 w-full justify-start gap-2.5 rounded-lg px-3 text-sm",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)]",
              )}
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <Separator className="my-5" />

      <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Üyeler</p>
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)]">
            Henüz üye görünmüyor.
          </div>
        ) : (
          members.map((member) => (
            <Link
              key={member.uid}
              href={`/members/${member.uid}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]"
            >
              <div className="relative">
                <Avatar fallback={member.avatarLabel} className="h-8 w-8 text-xs" />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--surface)]",
                    member.isOnline ? "bg-emerald-400" : "bg-slate-500",
                  )}
                />
              </div>
              <span className="truncate text-sm text-[var(--text-secondary)]">{member.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
