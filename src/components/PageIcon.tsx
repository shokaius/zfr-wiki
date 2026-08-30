import { GameIcon } from "./ui/GameIcon";
import { navItemFor } from "../nav";

/** Renders a section's nav icon for use in an index page header. */
export function PageIcon({ to }: { to: string }) {
  const item = navItemFor(to);
  if (!item) return null;
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface-2">
      <GameIcon file={item.icon} alt="" size="lg" fallback="none" className={item.iconClass} />
    </span>
  );
}
