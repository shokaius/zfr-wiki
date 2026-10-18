// Zombie Pot combine simulator. Runs the game's OWN combine functions in the
// browser (they are pure, no Pixi), so the outcome matches the real pot exactly.
//
// Manual mode has no owned-zombie instance ids, so the tier-5 special roll can't
// be resolved for a specific pair - we report both branches instead (the 75%
// deterministic species and the 25% special). A future save-import mode can feed
// real ids into createCombineRandom to resolve the actual roll.
import {
  selectCombineSpecies,
  COMBINE_SPECIAL_LEVEL,
  COMBINE_SPECIAL_CHANCE,
  type CombineSpeciesParent,
} from "../../game/src/zombie/combineSpecies";
import { combineMasks, mutationBonus } from "../../game/src/zombie/mutations";
import { zombieByKey, mutations as MUTATIONS, combat } from "../data";
import type { Zombie } from "../data/types";

export { COMBINE_SPECIAL_LEVEL, COMBINE_SPECIAL_CHANCE };

export interface SimParent {
  key: string; // species (a roster zombie key)
  mask: number; // its mutation bitmask (sum of mutation .bit values)
}
export interface SimGraves {
  blue: boolean;
  red: boolean;
}

export interface SimOutcome {
  key: string; // result species key
  zombie: Zombie | undefined;
  childMask: number; // merged mutation mask on the child
  bonus: { str: number; con: number; dex: number }; // flat mutation add
}
export interface SimResult {
  valid: boolean;
  error?: string;
  base: SimOutcome; // the deterministic (special-miss) result - 75%+
  special?: SimOutcome; // present only when an eligible special roll differs
  chance: number; // special-roll chance (when `special` is set)
  minutes: number; // combine duration
  monolithMinutes: number;
  promotion?: string; // short label for how the species changed vs slot 1
}

const isHeadless = (key: string): boolean => zombieByKey[key]?.group === "Headless";

function parentTraits(p: SimParent): CombineSpeciesParent {
  const z = zombieByKey[p.key];
  return { key: z.key, group: z.group, className: z.className, isSpecial: z.category === "special" };
}

function outcomeFor(key: string, maskA: number, maskB: number): SimOutcome {
  const childMask = combineMasks(maskA, maskB, isHeadless(key));
  return { key, zombie: zombieByKey[key], childMask, bonus: mutationBonus(childMask) };
}

function promotionLabel(resultKey: string, slot1Key: string): string | undefined {
  if (resultKey === slot1Key) return undefined;
  const z = zombieByKey[resultKey];
  const cls = z?.className;
  if (cls === "Special") return "tier-5 Special";
  if (cls === "Silver") return "Silver (tier 4)";
  if (cls === "Red") return "Red (tier 3)";
  if (cls === "Blue") return "Blue (tier 2)";
  return "promoted";
}

/** Bit -> mutation lookup for decoding a mask into its mutations. */
export function mutationsInMask(mask: number) {
  return MUTATIONS.filter((m) => (mask & m.bit) === m.bit && m.bit !== 0);
}

export function simulateCombine(pa: SimParent, pb: SimParent, level: number, graves: SimGraves): SimResult {
  const cm = combat.combine;
  const minutes = Math.round(cm.potDurationMs / 60000);
  const monolithMinutes = Math.round((cm.potDurationMs * cm.monolithMult) / 60000);
  const blank: SimResult = { valid: false, base: outcomeFor(pa.key, pa.mask, pb.mask), chance: cm.specialChance, minutes, monolithMinutes };

  const a = parentTraits(pa);
  const b = parentTraits(pb);
  // The pot refuses a Special in slot 2 outright (ZombiePot.start), and two
  // Specials can't combine at all (selectCombineSpecies -> null).
  if (b.isSpecial) return { ...blank, error: "A Special zombie can't go in slot 2 - put it in slot 1." };
  if (a.isSpecial && b.isSpecial) return { ...blank, error: "Two Special zombies can't be combined." };

  const hasGrave = (
  color: "Blue" | "Red" | "Silver" | "Obsidian"
) => (color === "Blue" ? graves.blue : color === "Red" ? graves.red : false);
  // Two deterministic passes: force the special roll to miss, then to hit.
  const missKey = selectCombineSpecies(a, b, level, () => 1, hasGrave);
  const hitKey = selectCombineSpecies(a, b, level, () => 0, hasGrave);
  if (!missKey) return { ...blank, error: "This pair can't be combined." };

  const base = outcomeFor(missKey, pa.mask, pb.mask);
  const result: SimResult = {
    valid: true,
    base,
    chance: cm.specialChance,
    minutes,
    monolithMinutes,
    promotion: promotionLabel(missKey, pa.key),
  };
  if (hitKey && hitKey !== missKey) {
    result.special = outcomeFor(hitKey, pa.mask, pb.mask);
  }
  return result;
}
