"use client";

import { Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CONTENT_TYPE_OPTIONS,
  POST_STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
} from "@/lib/constants";
import { searchCatalog, type CatalogSearchItem } from "@/lib/media-search";
import { createPost } from "@/lib/firebase/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import type { PostContentType, PostStatus, PostVisibility } from "@/types/firestore";

type AddItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  type: PostContentType;
  title: string;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  status: PostStatus;
  visibility: PostVisibility;
  reviewText: string;
  coverUrl: string;
  searchText: string;
};

const INITIAL_FORM: FormState = {
  type: "film",
  title: "",
  rating: 0,
  status: "tamamlandi",
  visibility: "herkes",
  reviewText: "",
  coverUrl: "",
  searchText: "",
};

function supportsSearch(type: PostContentType): boolean {
  return type === "film" || type === "kitap";
}

export function AddItemModal({ open, onOpenChange }: AddItemModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CatalogSearchItem[]>([]);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setError(null);
      setSaving(false);
      setSearchError(null);
      setSearching(false);
      setSearchResults([]);
    }
  }, [open]);

  const requiredMissing = useMemo(() => {
    if (!form.title.trim()) return "Başlık gerekli.";
    if (!form.reviewText.trim()) return "Yorum alanı gerekli.";
    if (form.rating < 1) return "Yıldız puanı seçmelisin.";
    return null;
  }, [form.rating, form.reviewText, form.title]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("Paylaşım yapmak için giriş yapmalısın.");
      return;
    }
    if (requiredMissing) {
      setError(requiredMissing);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createPost({
        authorUid: user.uid,
        postKind: "media",
        type: form.type,
        title: form.title,
        rating: form.rating as 1 | 2 | 3 | 4 | 5,
        status: form.status,
        visibility: form.visibility,
        reviewText: form.reviewText,
        coverUrl: form.coverUrl,
      });
      onOpenChange(false);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Kaydetme hatası.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    const queryText = form.searchText.trim();
    if (!supportsSearch(form.type)) {
      setSearchError("Şimdilik sadece Kitap ve Film araması aktif.");
      setSearchResults([]);
      return;
    }

    if (queryText.length < 2) {
      setSearchError("Arama için en az 2 karakter yaz.");
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchCatalog(form.type, queryText);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("Sonuç bulunamadı.");
      }
    } catch (searchErr) {
      setSearchError(searchErr instanceof Error ? searchErr.message : "Arama sırasında hata oldu.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const applySearchResult = (result: CatalogSearchItem) => {
    setForm((prev) => ({
      ...prev,
      title: result.title,
      coverUrl: result.coverUrl ?? prev.coverUrl,
      searchText: result.title,
    }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={() => onOpenChange(false)}
    >
      <Card
        className="w-full max-w-2xl border-[var(--border-strong)] bg-[var(--surface)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Yeni Ekle</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Pencereyi kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <p className="mb-2 text-sm text-[var(--text-secondary)]">Tür</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, type: option.id }));
                      setSearchResults([]);
                      setSearchError(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      form.type === option.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-white/5",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-[var(--text-secondary)]">Ara</p>
              <div className="flex gap-2">
                <input
                  value={form.searchText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, searchText: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  placeholder="İçerik adı ara"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={searching}
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                  {searching ? "Aranıyor..." : "Ara"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {supportsSearch(form.type)
                  ? "Kitap ve Film için kapak/resim otomatik çekilir."
                  : "Bu tür için arama yakında eklenecek."}
              </p>

              {searchError ? <p className="mt-2 text-xs text-rose-300">{searchError}</p> : null}

              {searchResults.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => applySearchResult(result)}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-2 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="h-14 w-10 overflow-hidden rounded bg-black/20">
                        {result.coverUrl ? (
                          <img src={result.coverUrl} alt={result.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{result.title}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {[result.subtitle, result.year].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Başlık</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  placeholder="Başlık"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Kapak URL (opsiyonel)</span>
                <input
                  value={form.coverUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, coverUrl: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                  placeholder="https://"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Durum</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value as PostStatus }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                >
                  {POST_STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">Görünürlük</span>
                <select
                  value={form.visibility}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      visibility: event.target.value as PostVisibility,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm outline-none focus:border-[var(--focus-ring)]"
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm text-[var(--text-secondary)]">Puan</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, rating: star as 1 | 2 | 3 | 4 | 5 }))
                    }
                    className="rounded-sm p-1"
                    aria-label={`${star} yıldız`}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        star <= form.rating
                          ? "fill-[var(--accent)] text-[var(--accent)]"
                          : "text-[var(--border-strong)]",
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Yıldız seçimi zorunlu.</p>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Yorum</span>
              <textarea
                value={form.reviewText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, reviewText: event.target.value }))
                }
                className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--focus-ring)]"
                placeholder="Kısa yorumunu paylaş"
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving || !!requiredMissing}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
