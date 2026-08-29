import type { ReactNode } from "react";

export function Badge({
  children,
  color,
  title,
  className = "",
}: {
  children: ReactNode;
  color?: string; // CSS color (e.g. rgb(var(--class-blue)))
  title?: string;
  className?: string;
}) {
  const style = color
    ? { color, borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }
    : undefined;
  return (
    <span
      title={title}
      style={style}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        color ? "" : "border-border bg-surface-2 text-muted"
      } ${className}`}
    >
      {children}
    </span>
  );
}

// Zombie color-class -> theme variable. Unknown values fall back to muted.
const CLASS_VAR: Record<string, string> = {
  green: "--class-green",
  blue: "--class-blue",
  red: "--class-red",
  silver: "--class-silver",
  yellow: "--class-yellow",
  special: "--class-special",
};

export function ClassBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted">—</span>;
  const key = value.toLowerCase();
  const varName = CLASS_VAR[key];
  const color = varName ? `rgb(var(${varName}))` : undefined;
  return (
    <Badge color={color} title={`${value} class`}>
      {value}
    </Badge>
  );
}

export function SeasonalBadge({ theme }: { theme: string | null | undefined }) {
  if (!theme || theme === "evergreen") return null;
  return (
    <Badge color="rgb(var(--accent-brain))" title={`Seasonal — ${theme}`}>
      {theme}
    </Badge>
  );
}

export function UnavailableBadge({ reason }: { reason?: string }) {
  return (
    <Badge color="rgb(var(--danger))" title={reason ?? "Currently unavailable"}>
      unavailable
    </Badge>
  );
}
