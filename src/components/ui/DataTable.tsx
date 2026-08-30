import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number | boolean | null | undefined;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  hint?: string;
  className?: string;
}

export interface SelectFilter<T> {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  get: (row: T) => string | string[] | null | undefined;
}
export interface ToggleFilter<T> {
  key: string;
  label: string;
  predicate: (row: T) => boolean;
  /** "keep" (default): when on, show only rows matching the predicate.
   *  "include": when OFF, hide predicate matches; turning it on adds them back. */
  mode?: "keep" | "include";
}

export function DataTable<T>({
  rows,
  columns,
  search,
  searchPlaceholder = "Filter…",
  selects = [],
  toggles = [],
  initialSort,
  rowKey,
  empty = "No matches.",
}: {
  rows: T[];
  columns: Column<T>[];
  search?: (row: T) => string;
  searchPlaceholder?: string;
  selects?: SelectFilter<T>[];
  toggles?: ToggleFilter<T>[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowKey: (row: T) => string;
  empty?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Record<string, string>>({});
  const [tog, setTog] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const colByKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q.trim() && search) {
      const needle = q.trim().toLowerCase();
      out = out.filter((r) => search(r).toLowerCase().includes(needle));
    }
    for (const s of selects) {
      const v = sel[s.key];
      if (v) out = out.filter((r) => {
        const g = s.get(r);
        return Array.isArray(g) ? g.includes(v) : g === v;
      });
    }
    for (const t of toggles) {
      const on = tog[t.key];
      if ((t.mode ?? "keep") === "include") {
        if (!on) out = out.filter((r) => !t.predicate(r));
      } else if (on) {
        out = out.filter((r) => t.predicate(r));
      }
    }

    if (sort) {
      const col = colByKey[sort.key];
      const val = col?.value;
      if (val) {
        out = [...out].sort((a, b) => {
          const av = val(a);
          const bv = val(b);
          const an = av === null || av === undefined || av === "";
          const bn = bv === null || bv === undefined || bv === "";
          if (an && bn) return 0;
          if (an) return 1;
          if (bn) return -1;
          let c: number;
          if (typeof av === "number" && typeof bv === "number") c = av - bv;
          else c = String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.dir === "asc" ? c : -c;
        });
      }
    }
    return out;
  }, [rows, q, sel, tog, sort, selects, toggles, search, colByKey]);

  const toggleSort = (key: string) => {
    const col = colByKey[key];
    if (!col?.sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const hasControls = !!search || selects.length > 0 || toggles.length > 0;

  return (
    <div>
      {hasControls && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {search && (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          )}
          {selects.map((s) => (
            <select
              key={s.key}
              value={sel[s.key] ?? ""}
              onChange={(e) => setSel((p) => ({ ...p, [s.key]: e.target.value }))}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
            >
              <option value="">{s.label}: all</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          {toggles.map((t) => (
            <button
              key={t.key}
              onClick={() => setTog((p) => ({ ...p, [t.key]: !p[t.key] }))}
              className={`btn ${tog[t.key] ? "btn-active" : ""}`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted tabular">{filtered.length} of {rows.length}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    title={c.hint}
                    onClick={() => toggleSort(c.key)}
                    className={`${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"} ${
                      c.sortable ? "cursor-pointer select-none hover:text-text" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && <span className={`text-[9px] ${active ? "text-primary-strong" : "text-muted/50"}`}>{active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}</span>}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`${c.align === "right" ? "text-right tabular" : c.align === "center" ? "text-center" : ""} ${c.className ?? ""}`}
                  >
                    {c.render ? c.render(row) : String(c.value?.(row) ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-muted">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
