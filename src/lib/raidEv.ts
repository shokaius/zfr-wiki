import { useCallback, useEffect, useState } from "react";
import type { Raid } from "../data/types";

export interface RaidSettings {
  dice: number; // 0..5 golden dice
  elite: boolean; // brain ticket
  useVoucher: boolean; // pay 2000 to skip cooldown
  sellDecor: boolean; // cash out decoration drops
  survival: number; // 0..1 fraction of army surviving
}

export const DEFAULT_SETTINGS: RaidSettings = {
  dice: 0,
  elite: false,
  useVoucher: false,
  sellDecor: true,
  survival: 1,
};

const KEY = "zfr-raid-settings";

export function useRaidSettings(): [RaidSettings, (patch: Partial<RaidSettings>) => void] {
  const [s, setS] = useState<RaidSettings>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return DEFAULT_SETTINGS;
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);
  const patch = useCallback((p: Partial<RaidSettings>) => setS((prev) => ({ ...prev, ...p })), []);
  return [s, patch];
}

export interface ComputedRaidEv {
  winGold: number;
  voucherCost: number;
  eliteCost: number;
  alwaysGoldEV: number;
  decorSellEV: number;
  netGold: number;
  brains: number;
  lootBrainsEV: number;
  rareRate: number;
  rareExpectedWins: number | null;
  tierProbs: number[];
}

export function computeRaidEv(raid: Raid, s: RaidSettings): ComputedRaidEv {
  const cell = raid.ev.byDice[Math.min(5, Math.max(0, s.dice))] ?? raid.ev.byDice[0];
  const winGold = Math.round(raid.winGoldFull * s.survival);
  const voucherCost = s.useVoucher ? raid.voucherCost : 0;
  const eliteCost = s.elite ? raid.eliteCost : 0;
  const decorSellEV = s.sellDecor ? cell.decorSellEV : 0;
  const netGold = winGold - voucherCost - eliteCost + cell.alwaysGoldEV + decorSellEV;
  const brains = (s.elite ? raid.ev.brainsElite : raid.ev.brainsNormal) + cell.lootBrainsEV;
  return {
    winGold,
    voucherCost,
    eliteCost,
    alwaysGoldEV: cell.alwaysGoldEV,
    decorSellEV,
    netGold,
    brains,
    lootBrainsEV: cell.lootBrainsEV,
    rareRate: s.elite ? cell.rareRateElite : cell.rareRateNormal,
    rareExpectedWins: s.elite ? cell.rareExpectedWinsElite : cell.rareExpectedWinsNormal,
    tierProbs: cell.tierProbs,
  };
}
