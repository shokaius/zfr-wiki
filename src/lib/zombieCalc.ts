// Deterministic zombie build optimizer for the calculator page.
//
// Every number here is derived from the game's own constants (generated JSON),
// never transcribed. The mechanics are grounded in the game source:
//   - stats scale by level (zombie.scaling, capped at level 25), mutations add
//     FLAT on top after scaling (src/raid/CombatEngine.ts) - never multiplied.
//   - HP = round(con x hpPerCon); DPS = round(str x powerPerStr x dex / interval).
//   - heal amount/cast = max(1, round(power x healPowerMult)); casts fire on the
//     dex-derived attack clock, so heal/sec = amount x (dex / interval). Garden only.
//   - one mutation per slot (5 slots; headless uses body/arm/neck + Pumpking), so
//     max 5 mutations (4 for headless). 4 identical adjacent crops = a guaranteed
//     imprint, and 8 plots/grow => at most 2 guaranteed mutations per grow. The
//     Zombie Pot unions two masks per slot (higher tier wins), keeping the slot-1
//     species, so combining stacks grows up to the per-slot cap.
import { zombies, mutations, combat } from "../data";
import type { Zombie, Mutation } from "../data/types";

export type OptimizeKind = "con" | "dps" | "heal";

export interface CalcSettings {
  optimize: OptimizeKind;
  level: number;
  mutations: boolean;
  combinations: boolean;
  includeBrains: boolean;
  includeSpecial: boolean;
  includeUnobtainable: boolean;
}

export const OPTIMIZE_LABELS: Record<OptimizeKind, string> = {
  con: "Health (CON)",
  dps: "DPS",
  heal: "Healing (heal/sec)",
};

const POWER = combat.powerPerStr; // 10
const HP_PER_CON = combat.hpPerCon; // 100
const ATK = combat.attackIntervalSec.player; // 2s base interval
const HEAL_MULT = combat.heal.powerMult; // 0.5
const HEAL_GROUP = "Garden"; // the only group with a heal ability (traits.ts)
export const SCALE_CAP = combat.levelScaleEndLevel; // 25 - stats stop growing here
export const CROPS_TO_GUARANTEE = Math.ceil(1 / combat.cropMutationChance); // 4

export interface Stat3 {
  str: number;
  con: number;
  dex: number;
}

// ---- metric --------------------------------------------------------------
export function hpOf(con: number): number {
  return Math.round(con * HP_PER_CON);
}
export function dpsOf(str: number, dex: number): number {
  return Math.round((str * POWER * dex) / ATK);
}
export function healPerCast(str: number): number {
  return Math.max(1, Math.round(str * POWER * HEAL_MULT));
}
export function healPerSec(str: number, dex: number): number {
  return Math.round(healPerCast(str) * (dex / ATK));
}
export function metricOf(kind: OptimizeKind, s: Stat3): number {
  if (kind === "con") return hpOf(s.con);
  if (kind === "dps") return dpsOf(s.str, s.dex);
  return healPerSec(s.str, s.dex);
}
export function metricUnit(kind: OptimizeKind): string {
  return kind === "con" ? "HP" : kind === "dps" ? "DPS" : "heal/s";
}

// ---- base stats at a level ------------------------------------------------
export function scaledStats(z: Zombie, level: number): Stat3 {
  const idx = Math.min(Math.max(Math.floor(level), 1), SCALE_CAP) - 1;
  const s = z.scaling[idx] ?? z.scaling[z.scaling.length - 1];
  return { str: s.str, con: s.con, dex: s.dex };
}

// ---- which mutations a zombie can wear at a level -------------------------
function usableMutations(z: Zombie, level: number): Mutation[] {
  const headless = z.group === "Headless";
  return mutations.filter((m) => {
    if (m.unlockLevel != null && m.unlockLevel > level) return false;
    if (z.mutatableSlots.includes(m.slot)) return true;
    // Pumpking is the one head bit authored to grow on a headless body.
    return headless && m.key === "pumpking";
  });
}

function addMut(base: Stat3, picks: Mutation[]): Stat3 {
  let { str, con, dex } = base;
  for (const m of picks) {
    str += m.stats.str ?? 0;
    con += m.stats.con ?? 0;
    dex += m.stats.dex ?? 0;
  }
  return { str, con, dex };
}

export interface BestBuild {
  picks: Mutation[]; // chosen mutations (<= cap, one per slot)
  stats: Stat3; // base + mutation flats
  value: number; // optimized metric
}

// Brute-force the best mutation set for the metric. Slots are few and each holds
// a handful of options, so the full cartesian product is tiny (<~1k leaves) and
// this is provably optimal even for the non-linear DPS/heal products.
function bestBuild(z: Zombie, s: CalcSettings): BestBuild {
  const base = scaledStats(z, s.level);
  const nil: BestBuild = { picks: [], stats: base, value: metricOf(s.optimize, base) };
  if (!s.mutations) return nil;

  const cap = s.combinations ? z.mutatableSlots.length + 1 : 2; // +1 gives headless its Pumpking head
  const bySlot = new Map<string, Mutation[]>();
  for (const m of usableMutations(z, s.level)) {
    const arr = bySlot.get(m.slot) ?? [];
    arr.push(m);
    bySlot.set(m.slot, arr);
  }
  const slotOptions = [...bySlot.values()].map((opts) => [null as Mutation | null, ...opts]);

  let best = nil;
  const walk = (i: number, picks: Mutation[]) => {
    if (picks.length > cap) return;
    if (i === slotOptions.length) {
      const stats = addMut(base, picks);
      const value = metricOf(s.optimize, stats);
      if (value > best.value) best = { picks: [...picks], stats, value };
      return;
    }
    for (const opt of slotOptions[i]) {
      if (opt === null) walk(i + 1, picks);
      else {
        picks.push(opt);
        walk(i + 1, picks);
        picks.pop();
      }
    }
  };
  walk(0, []);
  return best;
}

// ---- candidate pool (the additive source toggles) ------------------------
export type Source = "gold" | "brains" | "reward" | "hidden";
export function sourceOf(z: Zombie): Source {
  if (!z.brainsNeeded && !z.rewardOnly && !z.marketHidden) return "gold";
  if (z.brainsNeeded && !z.rewardOnly && !z.marketHidden) return "brains";
  return z.rewardOnly ? "reward" : "hidden";
}

function included(z: Zombie, s: CalcSettings): boolean {
  const src = sourceOf(z);
  if (src === "gold") return true;
  if (src === "brains") return s.includeBrains;
  // reward-only / market-hidden: opt in via "special" (named/promoted) or "unobtainable"
  if (s.includeSpecial && z.category === "special") return true;
  return s.includeUnobtainable;
}

// ---- combine-promotion recipe (silver/special) ---------------------------
export interface Promotion {
  tier: string; // "Blue" | "Red" | "Silver" | "Special"
  from: string; // the matched-parent requirement, plain text
  needsLevel25: boolean;
  chance: number | null; // 0..1 for the special roll, else null (deterministic)
}
function promotionFor(z: Zombie): Promotion | null {
  const c = combat.combine;
  const g = z.group;
  if (c.specialByGroup[g] === z.key)
    return { tier: "Special (tier 5)", from: `any two ${g} zombies`, needsLevel25: true, chance: c.specialChance };
  if (c.silverByGroup[g] === z.key)
    return { tier: "Silver (tier 4)", from: `two matching Red ${g} zombies`, needsLevel25: true, chance: null };
  if (c.redByGroup[g] === z.key)
    return { tier: "Red (tier 3)", from: `two matching Blue ${g} zombies (needs the Red Grave)`, needsLevel25: false, chance: null };
  if (c.blueByGroup[g] === z.key)
    return { tier: "Blue (tier 2)", from: `two matching Green ${g} zombies (needs the Blue Grave)`, needsLevel25: false, chance: null };
  return null;
}

// ---- recipe --------------------------------------------------------------
export interface GrowStep {
  crops: { name: string; qty: number; mutation: string }[]; // 4x each to guarantee
  gains: string[]; // mutation display names imprinted this grow
}
export interface Recipe {
  picks: { slot: string; name: string; stat: string; crop: string }[];
  grows: GrowStep[];
  combines: number; // number of pot merges
  potMinutes: number;
  monolithMinutes: number;
  promotion: Promotion | null;
}

function statText(m: Mutation): string {
  const parts: string[] = [];
  if (m.stats.str) parts.push(`+${m.stats.str} STR`);
  if (m.stats.con) parts.push(`+${m.stats.con} CON`);
  if (m.stats.dex) parts.push(`+${m.stats.dex} DEX`);
  return parts.join(", ");
}

function buildRecipe(z: Zombie, picks: Mutation[]): Recipe {
  const c = combat.combine;
  const picksOut = picks.map((m) => ({
    slot: m.slot,
    name: m.name,
    stat: statText(m),
    crop: m.sources[0]?.cropName ?? m.key,
  }));

  // Pack mutations into grows of at most 2 (each guaranteed by 4 identical crops).
  const grows: GrowStep[] = [];
  for (let i = 0; i < picks.length; i += 2) {
    const chunk = picks.slice(i, i + 2);
    grows.push({
      crops: chunk.map((m) => ({ name: m.sources[0]?.cropName ?? m.key, qty: CROPS_TO_GUARANTEE, mutation: m.name })),
      gains: chunk.map((m) => m.name),
    });
  }

  return {
    picks: picksOut,
    grows,
    combines: Math.max(0, grows.length - 1),
    potMinutes: Math.round(c.potDurationMs / 60000),
    monolithMinutes: Math.round((c.potDurationMs * c.monolithMult) / 60000),
    promotion: promotionFor(z),
  };
}

// ---- top-level -----------------------------------------------------------
export interface BuildResult {
  zombie: Zombie;
  source: Source;
  base: Stat3; // level-scaled, unmutated
  stats: Stat3; // with mutations
  value: number; // optimized metric
  baseValue: number; // metric without mutations
  picks: Mutation[];
  recipe: Recipe;
}

export function computeBuilds(s: CalcSettings): BuildResult[] {
  const pool = zombies.filter((z) => {
    if (s.optimize === "heal" && z.group !== HEAL_GROUP) return false;
    // Unlock gate: market zombies carry a real unlock level; specials/event
    // zombies carry a sentinel (<=0) and pass, governed by their source toggle.
    if (z.level > s.level) return false;
    return included(z, s);
  });

  const out = pool.map((z): BuildResult => {
    const build = bestBuild(z, s);
    const base = scaledStats(z, s.level);
    return {
      zombie: z,
      source: sourceOf(z),
      base,
      stats: build.stats,
      value: build.value,
      baseValue: metricOf(s.optimize, base),
      picks: build.picks,
      recipe: buildRecipe(z, build.picks),
    };
  });

  out.sort((a, b) => b.value - a.value || a.zombie.name.localeCompare(b.zombie.name));
  return out;
}
