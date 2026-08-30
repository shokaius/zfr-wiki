import { useState } from "react";
import { iconUrl } from "../../lib/assets";
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
 * Every zombie has a pre-rendered portrait (zombie/portrait/<key>.png), so this
 * shows real art for all of them — including the part-assembled specials. The
 * class-coloured monogram remains only as a last resort if a portrait fails.
 */
export function ZombieIcon({ zombie, size = "md", className = "" }: { zombie: Zombie; size?: Size; className?: string }) {
  const chain = [iconUrl(zombie.portrait), iconUrl(zombie.specialSprite)].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const px = SIZE_PX[size];
  const src = chain[idx];

  if (src) {
    return (
      <img
        src={src}
        alt={zombie.name}
        width={px}
        height={px}
        onError={() => setIdx((i) => i + 1)}
        className={`inline-block shrink-0 object-contain ${className}`}
        loading="lazy"
      />
    );
  }
  const color = zombie.classColor ?? "#7a7a7a";
  return (
    <span
      aria-label={zombie.name}
      title={zombie.name}
      style={{ width: px, height: px, fontSize: FONT[size], background: `${color}22`, color, borderColor: `${color}66` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-display font-bold leading-none ${className}`}
    >
      {initials(zombie.name)}
    </span>
  );
}
