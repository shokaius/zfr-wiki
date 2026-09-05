import {
  crops,
  cropSlug,
  zombies,
  zombieSlug,
  enemies,
  enemySlug,
  placeables,
  placeableSlug,
  boosts,
  boostSlug,
  mutations,
  abilities,
  raids,
  raidSlug,
  epicBosses,
  epicBossSlug,
} from "../data";
import { num } from "./format";
import { NAV } from "../nav";

export interface SearchItem {
  id: string;
  type: string;
  name: string;
  subtitle: string;
  to: string;
  iconFile?: string | null;
  iconFallback?: string | null;
  iconKind?: "game" | "zombie";
  emoji?: string;
  keywords: string;
}

let cache: SearchItem[] | null = null;

export function searchItems(): SearchItem[] {
  if (cache) return cache;
  const out: SearchItem[] = [];

  for (const c of crops)
    out.push({
      id: `crop-${c.key}`,
      type: "Crop",
      name: c.name,
      subtitle: c.mutation ? `grants ${c.mutation.name}` : `sells for ${num(c.sell)} gold`,
      to: `/crops/${cropSlug(c)}`,
      iconFile: c.icon,
      iconFallback: c.stage2,
      keywords: `${c.key} ${c.mutation?.name ?? ""}`,
    });

  for (const z of zombies)
    out.push({
      id: `z-${z.key}`,
      type: "Zombie",
      name: z.name,
      subtitle: `${z.className} · ${z.group} · ${num(z.dps)} DPS`,
      to: `/zombies/${zombieSlug(z)}`,
      iconFile: z.portrait,
      iconFallback: z.specialSprite,
      iconKind: "zombie",
      keywords: `${z.key} ${z.className} ${z.group} ${z.acquisition.join(" ")}${z.fertilizeChance !== null ? " fertilize fertilizer fertilization" : ""}`,
    });

  for (const e of enemies)
    out.push({
      id: `e-${e.key}`,
      type: "Enemy",
      name: e.name,
      subtitle: `${e.firstRaid ?? ""} · ${num(e.hp)} HP`,
      to: `/enemies/${enemySlug(e)}`,
      iconFile: e.icon,
      keywords: e.key,
    });

  for (const p of placeables)
    out.push({
      id: `p-${p.key}`,
      type: "Placeable",
      name: p.name,
      subtitle: `${p.category}${p.effect ? ` · ${p.effect}` : ""}`,
      to: `/placeables/${placeableSlug(p)}`,
      iconFile: p.sprite,
      keywords: `${p.key} ${p.category}`,
    });

  for (const b of boosts)
    out.push({
      id: `b-${b.key}`,
      type: "Boost",
      name: b.name,
      subtitle: b.info,
      to: `/boosts/${boostSlug(b)}`,
      iconFile: b.icon,
      keywords: `${b.key} ${b.effect}`,
    });

  for (const m of mutations)
    out.push({
      id: `m-${m.key}`,
      type: "Mutation",
      name: m.name,
      subtitle: `${m.slot} · ${Object.entries(m.stats).map(([k, v]) => `+${v} ${k}`).join(", ")}`,
      to: `/mutations#${m.key}`,
      iconFile: m.icon,
      keywords: `${m.key} ${m.slot} ${m.sources.map((s) => s.cropName).join(" ")}`,
    });

  for (const a of abilities)
    out.push({
      id: `a-${a.key}`,
      type: "Ability",
      name: a.label,
      subtitle: a.effect,
      to: `/abilities`,
      iconFile: a.icon,
      keywords: `${a.key} ${a.kind ?? ""} ${a.groups.map((g) => g.group).join(" ")}`,
    });

  for (const r of raids)
    out.push({
      id: `r-${r.id}`,
      type: "Raid",
      name: r.name,
      subtitle: `boss ${r.bossName} · net ${num(r.winGoldFull)} gold`,
      to: `/raids/${raidSlug(r)}`,
      iconFile: r.enemyIcon,
      keywords: `${r.bossName} ${r.rare?.name ?? ""}`,
    });

  for (const b of epicBosses)
    out.push({
      id: `eb-${b.id}`,
      type: "Epic Boss",
      name: b.name,
      subtitle: `Lv ${b.unlockLevel} · ${b.costBrains} brains`,
      to: `/epic-bosses/${epicBossSlug(b)}`,
      iconFile: b.questIcon,
      keywords: `${b.id} ${b.questZombies.map((z) => z.name).join(" ")}`,
    });

  // Top-level pages.
  for (const group of NAV)
    for (const item of group.items)
      out.push({ id: `pg-${item.to}`, type: "Page", name: item.label, subtitle: "Go to page", to: item.to, iconFile: item.icon, keywords: `${group.title} ${item.keywords ?? ""}` });

  cache = out;
  return out;
}
