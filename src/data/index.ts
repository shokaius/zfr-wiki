// Central typed access to the generated snapshot. Generated JSON is gitignored;
// run `npm run wiki:extract` (predev/prebuild do this) before dev/build.
import cropsJson from "./generated/crops.json";
import zombiesJson from "./generated/zombies.json";
import mutationsJson from "./generated/mutations.json";
import abilitiesJson from "./generated/abilities.json";
import placeablesJson from "./generated/placeables.json";
import boostsJson from "./generated/boosts.json";
import questsJson from "./generated/quests.json";
import raidsJson from "./generated/raids.json";
import enemiesJson from "./generated/enemies.json";
import attacksJson from "./generated/attacks.json";
import epicBossesJson from "./generated/epic-bosses.json";
import upgradesJson from "./generated/upgrades.json";
import economyJson from "./generated/economy.json";
import combatJson from "./generated/combat.json";
import socialJson from "./generated/social.json";

import type {
  Crop,
  Zombie,
  MutationsFile,
  AbilitiesFile,
  Placeable,
  Boost,
  QuestsFile,
  Raid,
  Enemy,
  Attack,
  EpicBoss,
  UpgradesFile,
  EconomyFile,
  CombatFile,
  SocialFile,
} from "./types";
import { slugify } from "../lib/format";

export const crops = cropsJson as unknown as Crop[];
export const zombies = zombiesJson as unknown as Zombie[];
export const mutationsFile = mutationsJson as unknown as MutationsFile;
export const mutations = mutationsFile.list;
export const abilitiesFile = abilitiesJson as unknown as AbilitiesFile;
export const abilities = abilitiesFile.list;
export const placeables = placeablesJson as unknown as Placeable[];
export const boosts = boostsJson as unknown as Boost[];
export const questsFile = questsJson as unknown as QuestsFile;
export const raids = raidsJson as unknown as Raid[];
export const enemies = enemiesJson as unknown as Enemy[];
export const attacks = attacksJson as unknown as Attack[];
export const epicBosses = epicBossesJson as unknown as EpicBoss[];
export const upgrades = upgradesJson as unknown as UpgradesFile;
export const economy = economyJson as unknown as EconomyFile;
export const combat = combatJson as unknown as CombatFile;
export const social = socialJson as unknown as SocialFile;

// ---- Lookup maps -----------------------------------------------------------
const by = <T,>(arr: T[], k: (t: T) => string) => Object.fromEntries(arr.map((t) => [k(t), t])) as Record<string, T>;

export const cropByKey = by(crops, (c) => c.key);
export const zombieByKey = by(zombies, (z) => z.key);
export const mutationByKey = by(mutations, (m) => m.key);
export const abilityByKey = by(abilities, (a) => a.key);
export const placeableByKey = by(placeables, (p) => p.key);
export const boostByKey = by(boosts, (b) => b.key);
export const enemyByKey = by(enemies, (e) => e.key);
export const raidById = Object.fromEntries(raids.map((r) => [String(r.id), r])) as Record<string, Raid>;
export const epicBossById = by(epicBosses, (b) => b.id);

// ---- Slug helpers (stable URLs from names, unique within a domain) ---------
function slugMap<T>(arr: T[], name: (t: T) => string): { toSlug: Map<T, string>; bySlug: Record<string, T> } {
  const seen: Record<string, number> = {};
  const toSlug = new Map<T, string>();
  const bySlug: Record<string, T> = {};
  for (const t of arr) {
    let s = slugify(name(t));
    if (bySlug[s] !== undefined) s = `${s}-${(seen[s] = (seen[s] ?? 1) + 1)}`;
    else seen[s] = 1;
    toSlug.set(t, s);
    bySlug[s] = t;
  }
  return { toSlug, bySlug };
}

export const cropSlugs = slugMap(crops, (c) => c.key);
export const zombieSlugs = slugMap(zombies, (z) => z.name);
export const placeableSlugs = slugMap(placeables, (p) => p.key);
export const enemySlugs = slugMap(enemies, (e) => e.key);
export const epicBossSlugs = slugMap(epicBosses, (b) => b.id);
export const boostSlugs = slugMap(boosts, (b) => b.key);

export const cropSlug = (c: Crop) => cropSlugs.toSlug.get(c)!;
export const zombieSlug = (z: Zombie) => zombieSlugs.toSlug.get(z)!;
export const placeableSlug = (p: Placeable) => placeableSlugs.toSlug.get(p)!;
export const enemySlug = (e: Enemy) => enemySlugs.toSlug.get(e)!;
export const epicBossSlug = (b: EpicBoss) => epicBossSlugs.toSlug.get(b)!;
export const boostSlug = (b: Boost) => boostSlugs.toSlug.get(b)!;
export const raidSlug = (r: Raid) => slugify(r.name);
export const raidBySlug = Object.fromEntries(raids.map((r) => [slugify(r.name), r])) as Record<string, Raid>;
