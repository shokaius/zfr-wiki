import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { NAV } from "../nav";
import { ThemeToggle } from "./ThemeToggle";
import { QuickLookup, openQuickLookup } from "./QuickLookup";
import { GameIcon } from "./ui/GameIcon";
import { GAME } from "../lib/gameMeta";

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
                  <GameIcon file={item.icon} alt="" size="sm" fallback="none" className={`!h-5 !w-5 ${item.iconClass ?? ""}`} />
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
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold !text-text">
            <span className="hidden lg:inline-flex">
              <GameIcon file="ZombieActorOldMcZombie.png" alt="" fallback="none" className="!h-7 !w-7" />
            </span>
            <span>
              ZFR <span className="text-muted">Wiki</span>
            </span>
            <span className="hidden lg:inline-flex">
              <GameIcon file="stex0006.png" alt="" fallback="none" className="!h-6 !w-6" />
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openQuickLookup}
              className="btn gap-2 !px-2.5 text-muted"
              aria-label="Quick lookup"
              title="Quick lookup (Shift+P)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="hidden text-xs sm:inline">Search</span>
              <kbd className="hidden rounded border border-border px-1.5 text-[10px] sm:inline">Shift + P</kbd>
            </button>
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

      <QuickLookup />


      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-6 text-xs text-muted">
          <p className="max-w-3xl">
            Auto-generated from{" "}
            <a href={GAME.repoUrl} target="_blank" rel="noreferrer">
              Zombie Farm 2 Reforged
            </a>{" "}
            at commit <span className="font-mono">{GAME.gameCommitShort}</span> ({GAME.gameCommitDate?.slice(0, 10)}). Numbers are
            computed from the game's own code. Zombie Farm is © The Playforge; this is a non-commercial fan reference.
          </p>
          <a
            href="https://github.com/mwaterman29/zfr-wiki"
            target="_blank"
            rel="noreferrer"
            aria-label="View this wiki's source on GitHub"
            title="Source on GitHub"
            className="shrink-0 !text-muted transition-colors hover:!text-text"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
