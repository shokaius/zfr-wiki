// Shapes emitted by tools/wiki/extract.ts. Kept in sync with that file.

export interface MutationStat {
  str?: number;
  con?: number;
  dex?: number;
}
export interface Mutation {
  key: string;
  name: string;
  slot: string;
  stats: MutationStat;
  tier: number;
  bit: number;
  icon: string;
  sources: { cropKey: string; cropName: string; level: number | null }[];
  unlockLevel: number | null;
}
export interface MutationsFile {
  slots: string[];
  chancePerPlot: number;
  list: Mutation[];
}

export interface Crop {
  key: string;
  name: string;
  level: number;
  cost: number;
  sell: number;
  xp: number;
  growMs: number;
  seasonal: boolean;
  icon: string;
  stage1: string;
  stage2: string;
  mutation: { key: string; name: string; slot: string; stats: MutationStat; tier: number } | null;
  netGoldPerCycle: number;
  netGoldPerCycleMonolith: number;
}

export interface ScaledStat {
  level: number;
  str: number;
  con: number;
  dex: number;
  dps: number;
  hp: number;
}
export interface VetRow {
  rank: number;
  name: string;
  mult: number;
  str: number;
  con: number;
  dex: number;
  dps: number;
  hp: number;
}
export interface ZombieAbility {
  tier: number;
  key: string | null;
  label: string | null;
  effect: string | null;
  bossGate: string | null;
  available: boolean;
}
export interface Zombie {
  key: string;
  name: string;
  group: string;
  className: string;
  classColor: string | null;
  level: number;
  cost: number;
  brainsNeeded: boolean;
  xp: number;
  growMs: number;
  category: string;
  str: number;
  con: number;
  dex: number;
  focus: number;
  tier: number;
  mutationMask: number;
  rewardOnly: boolean;
  marketHidden: boolean;
  specialSprite: string | null;
  portrait: string;
  dps: number;
  hp: number;
  abilityTiers: number;
  isDecayer: boolean;
  mutatableSlots: string[];
  acquisition: string[];
  scaling: ScaledStat[];
  veterancy: VetRow[];
  abilities: ZombieAbility[];
  dropRaid: { raidId: number; name: string } | null;
}

export interface Ability {
  key: string;
  label: string;
  effect: string;
  desc: string | null;
  icon: string | null;
  kind: string | null;
  poolTier: number | null;
  groups: { group: string; tier: number }[];
  bossGate: string | null;
  activated: Record<string, unknown> | null;
  combat: Record<string, number> | null;
}
export interface AbilitiesFile {
  list: Ability[];
  tierBoss: Record<string, string>;
}

export interface Placeable {
  key: string;
  name: string;
  category: string;
  theme: string | null;
  themeLabel: string | null;
  seasonal: boolean;
  available: boolean;
  cost: number;
  brainsNeeded: boolean;
  level: number;
  xp: number;
  authoredXp: number;
  tileW: number;
  tileH: number;
  sprite: string;
  growingSprite: string | null;
  armyMax: number;
  storageSlots: number;
  zombieSlots: number;
  growMs: number;
  harvestValue: number;
  sellValue: number;
  effect: string | null;
  variantOf: string | null;
}

export interface Boost {
  key: string;
  name: string;
  cost: number;
  brainsNeeded: boolean;
  level: number;
  effect: string;
  amount: number;
  perPurchase: number;
  giftZombieKey: string | null;
  usableOnFarm: boolean;
  info: string;
  flavorText: string;
  icon: string;
  raidBundleQty: number;
}

export interface QuestReq {
  text: string;
  count: number;
  object: string | null;
  event: string;
  sprite: string | null;
}
export interface Quest {
  id: string;
  title: string;
  levelRequired: number;
  prerequisiteQuest: number;
  requirements: QuestReq[];
  rewardType: number;
  rewardValue: number;
  rewardItem: string | null;
  rewardItemKey: string | null;
  rewardBrains: number | null;
  tutorialQuest: boolean;
  epicEvent: boolean;
  seasonal: boolean;
  reachable: boolean;
}
export interface QuestsFile {
  core: Quest[];
  reforged: Quest[];
}

export interface Enemy {
  key: string;
  name: string;
  firstRaid: string | null;
  firstRaidUnlock: number;
  icon: string;
  str: number;
  con: number;
  dex: number;
  hp: number;
  meleeDps: number;
  attacks: { name: string; frequency: number; meta: Record<string, unknown> | null }[];
  bossActions: { name: string; frequency: number; damage: unknown; sprite: string | null; hp: number | null; castTime: number | null; cooldownTime: number | null }[];
  standardGoldLoot: boolean;
  standardBossLoot: boolean;
  usedIn: string[];
}

export interface Attack {
  name: string;
  animID: number;
  sfxID: string;
  damageTiming: number | null;
  damageMultiplier: number | null;
  knockBack: boolean;
  stun: boolean;
  stunTimer: number | null;
  speedMultiplier: number | null;
}

export interface LootItem {
  name: string;
  kind: string;
  goldValue: number;
  brainValue: number;
  sellValue: number;
  placeKey: string | null;
  unique: boolean;
  boostKey: string | null;
  boostQty: number | null;
}
export interface LootTier {
  tier: number;
  items: LootItem[];
}
export interface RaidWaveMinion {
  key: string;
  name: string;
  count: number;
  hpEach: number | null;
  dpsEach: number | null;
}
export interface RaidStage {
  index: number;
  wave: number;
  bossKey: string | null;
  randomBoss: boolean;
  population: number;
  minions: RaidWaveMinion[];
  totalEnemyHp: number;
  totalEnemyMeleeDps: number;
}
export interface RaidEvDice {
  dice: number;
  usable: boolean;
  tierProbs: number[];
  alwaysGoldEV: number;
  voucherRefundEV: number;
  decorSellEV: number;
  lootBrainsEV: number;
  rareRateNormal: number;
  rareRateElite: number;
  rareExpectedWinsNormal: number | null;
  rareExpectedWinsElite: number | null;
}
export interface Raid {
  id: number;
  name: string;
  bossName: string;
  bossPortrait: string;
  enemyIcon: string;
  unlockLevel: number;
  recommendedLevel: number;
  eliteRecommendedLevel: number;
  xp: number;
  goldReward: number;
  bonusGold: number;
  winGoldFull: number;
  seasonal: boolean;
  playable: boolean;
  stageCount: number;
  firstClearBrains: number;
  minArmyProgression: number[];
  cooldownMs: number;
  voucherCost: number;
  eliteCost: number;
  hasVoucherInLoot: boolean;
  lootTiers: LootTier[];
  stages: RaidStage[];
  rare: { key: string; name: string } | null;
  ev: {
    byDice: RaidEvDice[];
    maxUsefulDice: number;
    brainsNormal: number;
    brainsElite: number;
    brainDropChanceNormal: number;
  };
}

export interface EpicBoss {
  id: string;
  name: string;
  costBrains: number;
  unlockLevel: number | null;
  durationMs: number;
  encounterMs: number;
  fightMs: number;
  maxLevel: number;
  baseHp: number;
  unitStats: { str: number; con: number; dex: number };
  hpCurve: { level: number; hp: number }[];
  questZombies: { questId: string; key: string; name: string; dps: number | null; hp: number | null; className: string | null }[];
  loot: { level: number; name: string; sprite: string | null; unique: boolean; tile: string | null }[];
  favoriteCrop: { key: string; name: string } | null;
  portrait: string;
  questIcon: string;
  lootIcon: string;
  fightBrainCost: number;
}

export interface UpgradesFile {
  mapSize: { name: string; size: number; level: number; gold: number; brains: number; info: string; icon: string | null }[];
  climate: { name: string; level: number; gold: number; terrain: string; icon: string | null }[];
}

export interface EconomyFile {
  xpThresholds: { level: number; cumulativeXp: number; delta: number }[];
  maxLevel: number;
  sellBackRatio: number;
  brainSellGoldRate: number;
  plowCost: number;
  plowXpNormal: number;
  plowXpMonolith: number;
  harvestXpBonusMonolith: number;
  buyXpRates: {
    decorGoldPerXp: number;
    functionalGoldPerXp: number;
    brainDecorXpPerBrain: number;
    brainFunctionalXpPerBrain: number;
  };
}

export interface CombatFile {
  powerPerStr: number;
  hpPerCon: number;
  attackIntervalSec: { player: number; enemy: number };
  lineupDamageBands: number[];
  lineupSpeedBands: number[];
  levelScaleEndpoints: Record<string, { str: number; con: number; dex: number }>;
  levelScaleStartLevel: number;
  levelScaleEndLevel: number;
  vetRanks: string[];
  vetThresholds: number[];
  vetStatStep: number;
  alienLaserDamage: number;
  stats: { key: string; label: string; desc: string }[];
  combine: {
    potDurationMs: number;
    monolithMult: number;
    specialLevel: number;
    specialChance: number;
    maxPots: number;
    blueByGroup: Record<string, string>;
    redByGroup: Record<string, string>;
    silverByGroup: Record<string, string>;
    specialByGroup: Record<string, string>;
  };
  heal: { powerMult: number; aoeMs: number };
  cropMutationChance: number;
  maxAdjacentPlots: number;
  raid: { armyCap: number; minArmy: number; cooldownMs: number; eliteBrainLuck: number; brainPityInvasions: number; rareZombiePityWins: number };
  themes: { active: string[]; evergreen: string };
}

export interface MetaFile {
  gameCommit: string;
  gameCommitShort: string;
  gameCommitDate: string;
  repoUrl: string;
  builtAt: string;
  counts: Record<string, number>;
}
