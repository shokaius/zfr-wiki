import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageHeader({
  title,
  icon,
  kicker,
  children,
  actions,
}: {
  title: ReactNode;
  icon?: ReactNode;
  kicker?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            {kicker && <div className="text-xs font-semibold uppercase tracking-wide text-primary-strong">{kicker}</div>}
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
          </div>
        </div>
        {actions}
      </div>
      {children && <div className="prose-tight mt-2 max-w-3xl text-muted">{children}</div>}
    </header>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
      {trail.map((t, i) => (
        <span key={i} className="flex items-center gap-1">
          {t.to ? (
            <Link to={t.to} className="hover:text-primary-strong">
              {t.label}
            </Link>
          ) : (
            <span className="text-text">{t.label}</span>
          )}
          {i < trail.length - 1 && <span className="text-muted/50">/</span>}
        </span>
      ))}
    </nav>
  );
}

export function Section({ title, id, children, aside }: { title?: ReactNode; id?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>;
}

export function StatGrid({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-muted">{it.label}</dt>
          <dd className="tabular text-sm font-medium text-text">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A labelled row for infobox-style key/value lists. */
export function KeyRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="tabular text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" }) {
  return (
    <div
      className={`rounded-md border-l-4 p-3 text-sm ${
        tone === "warn" ? "border-danger bg-danger/5 text-text" : "border-primary bg-primary/5 text-muted"
      }`}
    >
      {children}
    </div>
  );
}
