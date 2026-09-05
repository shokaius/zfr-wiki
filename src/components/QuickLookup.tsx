import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { searchItems, type SearchItem } from "../lib/searchIndex";
import { GameIcon } from "./ui/GameIcon";

const OPEN_EVENT = "zfr-quicklookup";
/** Fire from anywhere (e.g. the header button) to open the palette. */
export function openQuickLookup() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

function isEditable(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable;
}

function Highlight({ text, indices }: { text: string; indices: readonly [number, number][] }) {
  if (!indices?.length) return <>{text}</>;
  const ranges = [...indices].sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let last = 0;
  ranges.forEach(([s, e], i) => {
    if (s > last) parts.push(text.slice(last, s));
    parts.push(
      <mark key={i} className="rounded-sm bg-primary/25 text-text">
        {text.slice(s, e + 1)}
      </mark>,
    );
    last = e + 1;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

interface Row {
  item: SearchItem;
  matches: { key?: string; indices: readonly [number, number][] }[];
}

export function QuickLookup() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => searchItems(), []);
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        includeMatches: true,
        ignoreLocation: true,
        threshold: 0.4,
        minMatchCharLength: 1,
        keys: [
          { name: "name", weight: 0.7 },
          { name: "keywords", weight: 0.2 },
          { name: "type", weight: 0.12 },
          { name: "subtitle", weight: 0.08 },
        ],
      }),
    [items],
  );

  const results = useMemo<Row[]>(() => {
    const query = q.trim();
    if (!query) {
      // Empty state: page shortcuts first, so the palette is useful with no query.
      return items.filter((i) => i.type === "Page").map((item) => ({ item, matches: [] }));
    }
    return fuse.search(query, { limit: 40 }).map((r) => ({ item: r.item, matches: (r.matches ?? []) as Row["matches"] }));
  }, [q, fuse, items]);

  useEffect(() => setSel(0), [q]);

  // Global open shortcuts + custom event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      if (isEditable(e.target)) return;
      const shiftP = e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "P" || e.key === "p");
      const cmdK = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === "k" || e.key === "K");
      if (shiftP || cmdK) {
        e.preventDefault();
        setOpen(true);
        setQ("");
      }
    };
    const onOpen = () => {
      setOpen(true);
      setQ("");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    setOpen(false);
    setQ("");
    navigate(item.to);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[sel]?.item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Keep the selected row visible.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Quick lookup">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search crops, zombies, raids, mutations…"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline">esc</kbd>
        </div>

        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">No matches for “{q}”.</li>}
          {results.map((r, i) => {
            const it = r.item;
            const nameMatch = r.matches.find((m) => m.key === "name");
            const active = i === sel;
            return (
              <li key={it.id} data-idx={i}>
                <button
                  onMouseMove={() => setSel(i)}
                  onClick={() => go(it)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${active ? "bg-primary/10" : ""}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {it.emoji ? (
                      <span className="text-lg" aria-hidden="true">{it.emoji}</span>
                    ) : (
                      <GameIcon file={it.iconFile} fallbackFile={it.iconFallback} alt="" size="md" fallback="none" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={it.name} indices={nameMatch?.indices ?? []} />
                    </span>
                    <span className="block truncate text-xs text-muted">{it.subtitle}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">{it.type}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[11px] text-muted">
          <span><kbd className="rounded border border-border px-1">↑</kbd><kbd className="ml-0.5 rounded border border-border px-1">↓</kbd> navigate</span>
          <span><kbd className="rounded border border-border px-1">↵</kbd> open</span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
