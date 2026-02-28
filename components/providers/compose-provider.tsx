"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { AddItemModal } from "@/components/feed/add-item-modal";

type ComposeContextValue = {
  openComposer: () => void;
  closeComposer: () => void;
};

const ComposeContext = createContext<ComposeContextValue | undefined>(undefined);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openComposer = useCallback(() => {
    setOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo<ComposeContextValue>(
    () => ({
      openComposer,
      closeComposer,
    }),
    [closeComposer, openComposer],
  );

  return (
    <ComposeContext.Provider value={value}>
      {children}
      <AddItemModal open={open} onOpenChange={setOpen} />
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  const context = useContext(ComposeContext);
  if (!context) {
    throw new Error("useCompose must be used within ComposeProvider.");
  }
  return context;
}
