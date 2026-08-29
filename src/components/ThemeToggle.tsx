import { useEffect, useState } from "react";

type Theme = "light" | "dark" | null;

function current(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || t === "light" ? t : null;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current());

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
    try {
      if (theme) localStorage.setItem("zfr-theme", theme);
      else localStorage.removeItem("zfr-theme");
    } catch {
      /* ignore */
    }
  }, [theme]);

  const systemDark = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === null && systemDark);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn !px-2"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
