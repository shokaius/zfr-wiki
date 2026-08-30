import { GameIcon } from "./GameIcon";
import type { Zombie } from "../../data/types";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
const SIZE_PX: Record<Size, number> = { xs: 16, sm: 20, md: 32, lg: 48, xl: 72, "2xl": 112 };
const FONT: Record<Size, string> = { xs: "8px", sm: "9px", md: "12px", lg: "16px", xl: "22px", "2xl": "34px" };

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Special/assembled zombies (tier-5 promotions, Teddy, Diver, …) have no
 * standalone sprite — they're rigged from body parts at runtime. Rather than
 * show one identical generic icon for all of them, art-less zombies get a
 * distinct class-coloured monogram so they read as placeholders, not bugs.
 */
export function ZombieIcon({ zombie, size = "md", className = "" }: { zombie: Zombie; size?: Size; className?: string }) {
  if (zombie.specialSprite) {
    return <GameIcon file={zombie.specialSprite} alt={zombie.name} size={size} fallback="none" className={className} />;
  }
  const px = SIZE_PX[size];
  const color = zombie.classColor ?? "#7a7a7a";
  return (
    <span
      aria-label={zombie.name}
      title={zombie.name}
      style={{
        width: px,
        height: px,
        fontSize: FONT[size],
        background: `${color}22`,
        color,
        borderColor: `${color}66`,
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-display font-bold leading-none ${className}`}
    >
      {initials(zombie.name)}
    </span>
  );
}
