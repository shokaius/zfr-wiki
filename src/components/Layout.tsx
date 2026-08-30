import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { NAV } from "../nav";
import { ThemeToggle } from "./ThemeToggle";
import { GAME } from "../lib/gameMeta";
import { iconUrl } from "../lib/assets";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-5">
      {NAV.map((group) => (
        <div key={group.title}>
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">{group.title}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive ? "bg-primary/12 font-semibold text-primary-strong" : "text-text hover:bg-surface-2"
                    }`
                  }
                >
                  <span className="w-4 text-center text-xs opacity-70" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-4">
          <button className="btn !px-2 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2" title="Zombie Farm 2 Reforged Wiki">
            <img src={iconUrl("logo.png") ?? ""} alt="Zombie Farm 2 Reforged" className="h-8 w-auto" />
            <span className="text-xl leading-none" aria-hidden="true">📖</span>
            <span className="font-display text-base font-semibold text-muted">Wiki</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={GAME.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden font-mono text-xs text-muted hover:text-primary-strong sm:inline"
              title={`Generated from game commit ${GAME.gameCommit}`}
            >
              @{GAME.gameCommitShort}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-content gap-6 px-4">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto py-6 pr-1">
            <SidebarNav />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-border bg-bg p-4">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 py-6">{children}</main>
      </div>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto max-w-content px-4 py-6 text-xs text-muted">
          <p>
            Auto-generated from{" "}
            <a href={GAME.repoUrl} target="_blank" rel="noreferrer">
              Zombie Farm 2 Reforged
            </a>{" "}
            at commit <span className="font-mono">{GAME.gameCommitShort}</span> ({GAME.gameCommitDate?.slice(0, 10)}). Numbers are
            computed from the game's own code. Zombie Farm is © The Playforge; this is a non-commercial fan reference.
          </p>
        </div>
      </footer>
    </div>
  );
}
