import { LogOut, Menu, Plus } from "lucide-react";

import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onMenuToggle: () => void;
  onAddClick: () => void;
  onLogoutClick: () => void;
  loggingOut?: boolean;
};

export function Header({ onMenuToggle, onAddClick, onLogoutClick, loggingOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-base)]/85 px-3 py-3 backdrop-blur md:px-8 md:py-4">
      <div className="flex w-full items-center justify-between gap-2 md:gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="truncate font-[family-name:var(--font-sans)] text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">
            Friends Together
          </p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <NotificationsMenu />
          <Button type="button" variant="default" size="sm" onClick={onAddClick} aria-label="Yeni Ekle">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Yeni Ekle</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLogoutClick}
            disabled={loggingOut}
            aria-label="Çıkış"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Çıkış</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
