"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Layers, LayoutList, Loader2, Search, FolderKanban, BookOpen } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
}

interface SearchResults {
  projects: Array<{ id: string; name: string; type: string }>;
  stories: Array<{ id: string; title: string; projectId: string; projectName: string }>;
  lists: Array<{ id: string; title: string; projectId: string; projectName: string }>;
}

function flattenResults(data: SearchResults): { category: string; items: SearchResult[] }[] {
  const groups: { category: string; items: SearchResult[] }[] = [];

  if (data.projects.length > 0) {
    groups.push({
      category: "Projets",
      items: data.projects.map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        href: `/project/${p.id}`,
        icon: p.type === "LIST" ? <LayoutList size={15} /> : <Layers size={15} />,
      })),
    });
  }

  if (data.stories.length > 0) {
    groups.push({
      category: "Stories",
      items: data.stories.map((s) => ({
        id: `story-${s.id}`,
        label: s.title,
        sub: s.projectName,
        href: `/project/${s.projectId}?tab=backlog`,
        icon: <BookOpen size={15} />,
      })),
    });
  }

  if (data.lists.length > 0) {
    groups.push({
      category: "Listes",
      items: data.lists.map((l) => ({
        id: `list-${l.id}`,
        label: l.title,
        sub: l.projectName,
        href: `/project/${l.projectId}?tab=listes`,
        icon: <FolderKanban size={15} />,
      })),
    });
  }

  return groups;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setActiveIndex(0);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [query]);

  const groups = results ? flattenResults(results) : [];
  const allItems = groups.flatMap((g) => g.items);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[activeIndex]) {
      navigate(allItems[activeIndex].href);
    }
  }

  const hasResults = allItems.length > 0;
  const showEmpty = results !== null && !hasResults && !isLoading && query.length >= 2;

  // Compute cumulative offset per group to determine activeIndex per item
  let offset = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 shadow-lg sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3 gap-3">
          {isLoading ? (
            <Loader2 size={16} className="text-muted-foreground animate-spin flex-shrink-0" />
          ) : (
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher des projets, stories, listes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {showEmpty && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun résultat pour &quot;{query}&quot;
            </p>
          )}

          {!results && !isLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher
            </p>
          )}

          {groups.map((group) => {
            const groupOffset = offset;
            offset += group.items.length;

            return (
              <div key={group.category} className="py-2">
                <p className="px-4 pb-1 text-xs font-medium text-muted-foreground">
                  {group.category}
                </p>
                {group.items.map((item, i) => {
                  const globalIndex = groupOffset + i;
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                        activeIndex === globalIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => navigate(item.href)}
                    >
                      <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.sub && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {item.sub}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> ouvrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> fermer
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-80 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="hidden lg:flex items-center gap-1 rounded border bg-background px-1.5 font-mono text-xs">
          <Command size={11} />
          <span>K</span>
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
