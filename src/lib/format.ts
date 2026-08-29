export function num(n: number | null | undefined, opts?: { digits?: number }): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const digits = opts?.digits ?? (Number.isInteger(n) ? 0 : 2);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function pct(fraction: number | null | undefined, digits = 1): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return "—";
  return `${(fraction * 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}%`;
}

export function signed(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n > 0 ? `+${num(n)}` : num(n);
}

export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = m / 60;
  if (h < 24) return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  const d = h / 24;
  return Number.isInteger(d) ? `${d}d` : `${d.toFixed(1)}d`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
