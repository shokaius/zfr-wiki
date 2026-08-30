/**
 * ZF2R wiki extractor.
 *
 * Inputs:  the pinned game submodule at ../../game  (imports src/** constants,
 *          reads public/assets/**.json), so this can never disagree with the game.
 * Outputs: src/data/generated/*.json  (entity + derived-value snapshot)
 *          public/game-assets/all/*   (only the icons the wiki actually references)
 *
 * Run with tsx (see package.json `wiki:extract`). All numbers here are derived by
 * calling the game's own functions, not transcribed.
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

// ---- Game modules (all headless-safe under tsx) ----------------------------
import { SLOTS, MUTATION_LIST } from "../../game/src/zombie/mutations";
import { CROP_MUTATIONS, CROP_MUTATION_CHANCE } from "../../game/src/zombie/cropMutations";
import { classTierRank, CLASS_COLOR } from "../../game/src/zombie/taxonomy";
import {
  GROUP_ABILITIES,
  ABILITY_POOL,
  ABILITY_TIER,
  TIER_BOSS,
  VET_RANKS,
  VET_THRESHOLDS,
  VET_STAT_STEP,
  veterancyMultiplier,
  STATS,
} from "../../game/src/zombie/traits";
import { ABILITY_KIND, ACTIVATED_ABILITY, ABILITY_COMBAT } from "../../game/src/zombie/abilities";
import {
  COMBINE_SPECIAL_LEVEL,
  COMBINE_SPECIAL_CHANCE,
  COMBINE_SPECIAL_BY_GROUP,
  COMBINE_BLUE_BY_GROUP,
  COMBINE_RED_BY_GROUP,
} from "../../game/src/zombie/combineSpecies";
import { POT_DURATION_MS, MONOLITH_MULT } from "../../game/src/zombie/ZombiePot";
import {
  POWER_PER_STR,
  HP_PER_CON,
  ATTACK_INTERVAL_SEC,
  LINEUP_DAMAGE_BANDS,
  LINEUP_SPEED_BANDS,
  LEVEL_SCALE_ENDPOINTS,
  levelScaleStat,
  deriveMaxHp,
  ALIEN_LASER_DAMAGE,
} from "../../game/src/raid/combatStats";
import {
  brainDropChance,
  firstClearBrains,
  rollBrainDropWithPity,
  nextBrainDryStreak,
  BRAIN_PITY_INVASIONS,
} from "../../game/src/raid/brainDrops";
import {
  RAID_ZOMBIE_DROPS,
  raidZombieDropRate,
  rollRaidZombieDropWithPity,
  nextRaidZombieDryWins,
  RAID_ZOMBIE_PITY_WINS,
} from "../../game/src/raid/zombieDrops";
import {
  winGold,
  minArmyFor,
  fightStage,
  RAID_COOLDOWN_MS,
  ARMY_CAP,
  MIN_ARMY,
  maxLuckTiers,
} from "../../game/src/raid/RaidCatalog";
import { raidBoostBundle } from "../../game/src/raid/lootBundles";
import { rollLootTier } from "../../game/src/raid/LootTable";
import { ELITE_BRAIN_LUCK } from "../../game/src/raid/eliteInvasion";
import { awardedSellValue } from "../../game/src/awardSellValue";
import { ACTIVE_THEMES, decorAvailable, themeLabel, EVERGREEN } from "../../game/src/decorThemes";
import { ECONOMY, buyXp } from "../../game/src/economy";
import { plowXp, harvestXp } from "../../game/src/farmRewards";
import { XP_THRESHOLDS } from "../../game/src/GameState";
import { MAX_ZOMBIE_POTS } from "../../game/src/placementLimit";
import { EPIC_BOSSES, EPIC_BOSS_UNLOCK_LEVELS, epicBossHp } from "../../game/src/epicBoss/catalog";
import { EPIC_QUEST_ZOMBIE_REWARDS } from "../../game/src/epicBoss/rewards";
import { EPIC_BOSS_FIGHT_BRAIN_COST } from "../../game/src/epicBoss/tokens";
import { EPIC_BOSS_FAVORITE_CROPS } from "../../game/src/epicBoss/favoriteCrops";

// ---- Paths -----------------------------------------------------------------
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const GAME = join(ROOT, "game");
const ASSETS = join(GAME, "public/assets");
const OUT = join(ROOT, "src/data/generated");
const ASSET_OUT = join(ROOT, "public/game-assets/all");

const PLOW_COST = 10; // src/JobSystem.ts:28 (module-private const)

// ---- Small utils -----------------------------------------------------------
const readJson = (p: string): any => JSON.parse(readFileSync(join(ASSETS, p), "utf8"));
const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
mkdirSync(OUT, { recursive: true });
function writeJson(name: string, data: unknown) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
}
// Deterministic PRNG so EV builds are reproducible.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Load raw JSON ---------------------------------------------------------
const plants = readJson("plants.json") as any[];
const zombiesRaw = readJson("zombies.json") as any[];
const placeablesRaw = readJson("placeables.json") as any[];
const boosts = readJson("boosts.json") as any[];
const upgrades = readJson("upgrades.json") as any;
const questsCore = readJson("quests.json") as Record<string, any>;
const questsReforged = readJson("quests_reforged.json") as Record<string, any>;
const raidsRaw = readJson("raids/raids.json") as any[];
const enemyStats = readJson("raids/enemy_stats.json") as Record<string, any>;
const attacks = readJson("raids/attacks.json") as Record<string, any>;
const drops = readJson("raids/drops.json") as Record<string, any>;

// ---- Asset reference collection --------------------------------------------
const referenced = new Set<string>();
const ref = (f: string | null | undefined) => {
  if (f && typeof f === "string" && f.trim()) referenced.add(f.trim());
};
// Explicit src->dest copies for files whose basename collides in the flat store
// (e.g. every epic boss ships portrait.png in its own dir).
const explicitCopies = new Map<string, string>(); // destName -> absolute src path
const iconBase = (p: string | null | undefined) => {
  if (!p) return null;
  const s = String(p).trim();
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
};
// Enemy keys like "PirateStageActorScallywag" -> "Pirate Scallywag".
function cleanEnemyName(key: string): string {
  return key
    .replace(/StageActor|Stage|Actor/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d+)$/, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

// DERIVED SIGNPOSTS ----------------------------------------------------------
const DPS = (str: number, dex: number) => str * POWER_PER_STR * (dex / ATTACK_INTERVAL_SEC.player);
const HP = (con: number) => Math.round(deriveMaxHp(con));
const ENEMY_DPS = (str: number) => str * POWER_PER_STR * (1 / ATTACK_INTERVAL_SEC.enemy);

// ===========================================================================
// MUTATIONS
// ===========================================================================
const cropByKey: Record<string, any> = Object.fromEntries(plants.map((p) => [p.key, p]));
// reverse map mutationKey -> crop key(s)
const mutationToCrops: Record<string, string[]> = {};
for (const [cropKey, mutKey] of Object.entries(CROP_MUTATIONS)) {
  (mutationToCrops[mutKey] ||= []).push(cropKey);
}
const mutations = MUTATION_LIST.map((m: any) => {
  const cropKeys = mutationToCrops[m.key] ?? [];
  const sources = cropKeys.map((ck) => {
    const c = cropByKey[ck];
    return { cropKey: ck, cropName: c?.name ?? ck, level: c?.level ?? null };
  });
  const minLevel = sources.length ? Math.min(...sources.map((s) => s.level ?? Infinity)) : null;
  return {
    key: m.key,
    name: m.name,
    slot: m.slot,
    stats: m.stats,
    tier: m.tier,
    bit: m.bit,
    sources,
    unlockLevel: Number.isFinite(minLevel) ? minLevel : null,
  };
});
writeJson("mutations", { slots: SLOTS, chancePerPlot: CROP_MUTATION_CHANCE, list: mutations });

// ===========================================================================
// CROPS
// ===========================================================================
const crops = plants.map((p) => {
  ref(p.icon);
  ref(p.stage1);
  ref(p.stage2);
  const mutKey = (CROP_MUTATIONS as Record<string, string>)[p.key] ?? null;
  const mut = mutKey ? MUTATION_LIST.find((m: any) => m.key === mutKey) : null;
  const netGoldPerCycle = p.sell - p.cost - PLOW_COST;
  return {
    key: p.key,
    name: p.name,
    level: p.level,
    cost: p.cost,
    sell: p.sell,
    xp: p.xp,
    growMs: p.growMs,
    seasonal: !!p.seasonal,
    icon: p.icon,
    stage1: p.stage1,
    stage2: p.stage2,
    mutation: mut ? { key: mut.key, name: mut.name, slot: mut.slot, stats: mut.stats, tier: mut.tier } : null,
    netGoldPerCycle,
    netGoldPerCycleMonolith: p.sell - p.cost, // Plowing Monolith zeroes the plow cost
  };
});
writeJson("crops", crops);

// ===========================================================================
// ZOMBIES
// ===========================================================================
const GROUPS = Object.keys(LEVEL_SCALE_ENDPOINTS);
const HEADLESS = "Headless";
// which raids drop each zombie (rare drops)
const zombieDropRaid: Record<string, { raidId: number; name: string }> = {};
for (const [rid, d] of Object.entries(RAID_ZOMBIE_DROPS)) {
  zombieDropRaid[(d as any).key] = { raidId: Number(rid), name: (d as any).name };
}
// which zombies are epic quest rewards
const epicRewardZombies = new Set<string>(Object.values(EPIC_QUEST_ZOMBIE_REWARDS as Record<string, string>));

const scaledLevels = Array.from({ length: 25 }, (_, i) => i + 1);
const zombiesByKey: Record<string, any> = {};

const zombies = zombiesRaw.map((z) => {
  ref(z.specialSprite);
  const group: string = GROUPS.includes(z.group) ? z.group : "Regular";
  const isHeadless = group === HEADLESS;
  const dps = DPS(z.str, z.dex);
  const hp = HP(z.con);
  const abilityTiers = classTierRank(z.className); // how many ability tiers this class carries

  // level-scaling curve 1..25 (mutations added flat afterwards; shown unmutated here)
  const floor = (LEVEL_SCALE_ENDPOINTS as any)[group] ?? (LEVEL_SCALE_ENDPOINTS as any).Regular;
  const scaling = scaledLevels.map((lvl) => {
    const s = levelScaleStat(group, "str", z.str, lvl);
    const c = levelScaleStat(group, "con", z.con, lvl);
    const d = levelScaleStat(group, "dex", z.dex, lvl);
    return { level: lvl, str: round(s, 2), con: round(c, 2), dex: round(d, 2), dps: round(DPS(s, d)), hp: HP(c) };
  });
  const isDecayer = z.str < floor.str || z.con < floor.con || z.dex < floor.dex;

  // veterancy 0..5
  const vet = VET_THRESHOLDS.map((survivals: number, rank: number) => {
    const mult = veterancyMultiplier(survivals);
    return {
      rank,
      name: VET_RANKS[rank],
      mult: round(mult, 4),
      str: round(z.str * mult, 2),
      con: round(z.con * mult, 2),
      dex: round(z.dex * mult, 2),
      dps: round(DPS(z.str * mult, z.dex * mult)),
      hp: HP(round(z.con * mult, 2)),
    };
  });

  // acquisition
  const acquisition: string[] = [];
  if (zombieDropRaid[z.key]) acquisition.push("raid-drop");
  if (epicRewardZombies.has(z.key)) acquisition.push("epic-reward");
  if (z.rewardOnly) acquisition.push("reward-only");
  if (!z.rewardOnly && !z.marketHidden) acquisition.push(z.brainsNeeded ? "market-brains" : "market-gold");
  if (z.category === "mutant") acquisition.push("pre-mutated");
  if (acquisition.length === 0) acquisition.push(z.brainsNeeded ? "market-brains" : "market-gold");

  // group ability ladder (tiers 1..4), each gated on beating a boss
  const abilities = ((GROUP_ABILITIES as any)[group] ?? []).map((abKey: string | null, i: number) => {
    const tier = i + 1;
    const meta = abKey ? (ABILITY_POOL as any)[abKey] : null;
    return {
      tier,
      key: abKey,
      label: meta?.label ?? null,
      effect: meta?.effect ?? null,
      bossGate: (TIER_BOSS as any)[tier] ?? null,
      available: tier <= abilityTiers,
    };
  });

  const out = {
    key: z.key,
    name: z.name,
    group,
    className: z.className,
    classColor: z.classColor ?? (CLASS_COLOR as any)[z.className] ?? null,
    level: z.level,
    cost: z.cost,
    brainsNeeded: !!z.brainsNeeded,
    xp: z.xp,
    growMs: z.growMs,
    category: z.category,
    str: z.str,
    con: z.con,
    dex: z.dex,
    focus: z.focus,
    tier: z.tier,
    mutationMask: z.mutation ?? 0,
    rewardOnly: !!z.rewardOnly,
    marketHidden: !!z.marketHidden,
    specialSprite: z.specialSprite ?? null,
    dps: round(dps),
    hp,
    abilityTiers,
    isDecayer,
    mutatableSlots: isHeadless ? SLOTS.filter((s: string) => s !== "head" && s !== "hair_eye") : SLOTS,
    acquisition,
    scaling,
    veterancy: vet,
    abilities,
    dropRaid: zombieDropRaid[z.key] ?? null,
  };
  zombiesByKey[z.key] = out;
  return out;
});
writeJson("zombies", zombies);

// ===========================================================================
// ABILITIES
// ===========================================================================
// group ability index: ability key -> [{group, tier}]
const abilityGroups: Record<string, { group: string; tier: number }[]> = {};
for (const [group, ladder] of Object.entries(GROUP_ABILITIES as Record<string, (string | null)[]>)) {
  ladder.forEach((abKey, i) => {
    if (!abKey) return;
    (abilityGroups[abKey] ||= []).push({ group, tier: i + 1 });
  });
}
const abilities = Object.entries(ABILITY_POOL as Record<string, any>).map(([key, meta]) => {
  // catalog tier = first ABILITY_TIER bucket containing it
  let poolTier: number | null = null;
  for (const [t, keys] of Object.entries(ABILITY_TIER as Record<string, string[]>)) {
    if (keys.includes(key)) {
      poolTier = Number(t);
      break;
    }
  }
  const icon = iconBase(meta.icon);
  ref(icon);
  return {
    key,
    label: meta.label,
    effect: meta.effect,
    desc: meta.desc ?? null,
    icon,
    kind: (ABILITY_KIND as any)[key] ?? null,
    poolTier,
    groups: abilityGroups[key] ?? [],
    bossGate: poolTier ? (TIER_BOSS as any)[poolTier] ?? null : null,
    activated: (ACTIVATED_ABILITY as any)[key] ?? null,
    combat: (ABILITY_COMBAT as any)[key] ?? null,
  };
});
writeJson("abilities", { list: abilities, tierBoss: TIER_BOSS });

// ===========================================================================
// PLACEABLES  (decor / functional / trees / graves / monoliths)
// ===========================================================================
const placeablesByKey: Record<string, any> = Object.fromEntries(placeablesRaw.map((p) => [p.key, p]));
const placeablesByName: Record<string, any> = Object.fromEntries(placeablesRaw.map((p) => [p.name, p]));

function sellValueOf(p: any): number {
  const authored = awardedSellValue(p.key);
  if (authored != null) return authored;
  return Math.round((p.cost || 0) * ECONOMY.SELL_BACK_RATIO);
}
function functionalEffect(p: any): string | null {
  const bits: string[] = [];
  if (p.armyMax) bits.push(`+${p.armyMax} army cap`);
  if (p.zombieSlots) bits.push(`+${p.zombieSlots} zombie storage`);
  if (p.storageSlots) bits.push(`+${p.storageSlots} item storage`);
  if (p.category === "tree") bits.push(`harvest ${p.harvestValue} gold`);
  return bits.length ? bits.join(", ") : null;
}

const placeables = placeablesRaw.map((p) => {
  ref(p.sprite);
  ref(p.growingSprite);
  const xp = buyXp(p.cost, p.xp, !!p.brainsNeeded, p.category);
  return {
    key: p.key,
    name: p.name,
    category: p.category,
    theme: p.theme ?? null,
    themeLabel: p.theme ? themeLabel(p.theme) : null,
    seasonal: !!p.seasonal,
    available: decorAvailable(p),
    cost: p.cost,
    brainsNeeded: !!p.brainsNeeded,
    level: p.level,
    xp,
    authoredXp: p.xp,
    tileW: p.tileW,
    tileH: p.tileH,
    sprite: p.sprite,
    growingSprite: p.growingSprite || null,
    armyMax: p.armyMax || 0,
    storageSlots: p.storageSlots || 0,
    zombieSlots: p.zombieSlots || 0,
    growMs: p.growMs || 0,
    harvestValue: p.harvestValue || 0,
    sellValue: sellValueOf(p),
    effect: functionalEffect(p),
    variantOf: p.variantOf ?? null,
  };
});
writeJson("placeables", placeables);

// ===========================================================================
// BOOSTS
// ===========================================================================
const boostByName: Record<string, any> = Object.fromEntries(boosts.map((b) => [b.name, b]));
const boostsOut = boosts.map((b) => {
  ref(b.icon);
  return {
    key: b.key,
    name: b.name,
    cost: b.cost,
    brainsNeeded: !!b.brainsNeeded,
    level: b.level,
    effect: b.effect,
    amount: b.amount,
    perPurchase: b.perPurchase,
    giftZombieKey: b.giftZombieKey || null,
    usableOnFarm: !!b.usableOnFarm,
    info: b.info,
    flavorText: b.flavorText,
    icon: b.icon,
    raidBundleQty: raidBoostBundle(b.key),
  };
});
writeJson("boosts", boostsOut);

// ===========================================================================
// QUESTS
// ===========================================================================
function mapQuest(q: any) {
  ref(q.sprite);
  const reqs = (q.requirements ?? []).map((r: any) => {
    ref(r.sprite);
    return { text: r.text, count: r.countTotal, object: r.notificationObject || null, event: r.notificationID, sprite: r.sprite || null };
  });
  return {
    id: q.id,
    title: q.title,
    levelRequired: q.levelRequired,
    prerequisiteQuest: q.prerequisiteQuest,
    requirements: reqs,
    rewardType: q.rewardType,
    rewardValue: q.rewardValue,
    rewardItem: q.rewardItem || null,
    rewardItemKey: q.rewardItemKey || null,
    rewardBrains: q.rewardBrains ?? null,
    tutorialQuest: !!q.tutorialQuest,
    epicEvent: !!q.epicEvent,
    seasonal: !!q.seasonal,
    reachable: !q.epicEvent && !q.seasonal && !q.removeQuest,
  };
}
const coreQuests = Object.values(questsCore).map((q: any) => q.value ?? q).map(mapQuest);
const reforgedQuests = Object.values(questsReforged).map((q: any) => q.value ?? q).map(mapQuest);
writeJson("quests", { core: coreQuests, reforged: reforgedQuests });

// ===========================================================================
// ENEMIES + ATTACKS
// ===========================================================================
const attacksByName = attacks;
const enemyUsedIn: Record<string, string[]> = {};
const enemyFirstRaid: Record<string, { name: string; unlock: number }> = {};
for (const raid of raidsRaw) {
  const names = new Set<string>();
  for (const st of raid.stages ?? []) {
    if (st.bossKey) names.add(st.bossKey);
    for (const k of st.enemyKeys ?? []) names.add(k);
    for (const w of st.weighted ?? []) if (w.enemy) names.add(w.enemy);
  }
  for (const k of raid.obstacleActors ?? []) names.add(k);
  for (const n of names) {
    (enemyUsedIn[n] ||= []).push(raid.name);
    const cur = enemyFirstRaid[n];
    if (!cur || raid.unlockLevel < cur.unlock) enemyFirstRaid[n] = { name: raid.name, unlock: raid.unlockLevel };
  }
}
const enemies = Object.entries(enemyStats).map(([key, valWrap]: [string, any]) => {
  const v = valWrap.value ?? valWrap;
  const iconFile = `${key}.png`;
  ref(iconFile);
  return {
    key,
    name: cleanEnemyName(key),
    firstRaid: enemyFirstRaid[key]?.name ?? null,
    firstRaidUnlock: enemyFirstRaid[key]?.unlock ?? 999,
    icon: iconFile,
    str: v.str,
    con: v.con,
    dex: v.dex,
    hp: HP(v.con),
    meleeDps: round(ENEMY_DPS(v.str)),
    attacks: (v.attacks ?? []).map((a: any) => ({ name: a.name, frequency: a.frequency, meta: attacksByName[a.name]?.value ?? attacksByName[a.name] ?? null })),
    bossActions: (v.bossActions ?? []).map((a: any) => {
      ref(a.sprite);
      return { name: a.name, frequency: a.frequency, damage: a.damage ?? null, sprite: a.sprite ?? null, hp: a.hp ?? null, castTime: a.castTime ?? null, cooldownTime: a.cooldownTime ?? null };
    }),
    standardGoldLoot: !!v.standardGoldLoot,
    standardBossLoot: !!v.standardBossLoot,
    usedIn: enemyUsedIn[key] ?? [],
  };
});
writeJson("enemies", enemies);

const attacksOut = Object.entries(attacks).map(([name, w]: [string, any]) => {
  const v = w.value ?? w;
  return { name, animID: v.animID, sfxID: v.sfxID, damageTiming: v.damageTiming ?? null, damageMultiplier: v.damageMultiplier ?? null, knockBack: !!v.knockBack, stun: !!v.stun, stunTimer: v.stunTimer ?? null, speedMultiplier: v.speedMultiplier ?? null };
});
writeJson("attacks", attacksOut);

// ===========================================================================
// RAIDS  (+ EV grid)
// ===========================================================================
const enemyByKey: Record<string, any> = Object.fromEntries(enemies.map((e) => [e.key, e]));
const VOUCHER_COST = boostByName["Invasion Voucher"]?.cost ?? 2000;
const ELITE_COST = boostByName["Brain Ticket"]?.cost ?? 10000;

// tier probabilities for a loot-luck bonus (dice)
function lootTierProbs(bonus: number): number[] {
  const N = 200000;
  const counts = new Array(6).fill(0);
  for (let i = 0; i < N; i++) counts[rollLootTier((i + 0.5) / N, bonus)]++;
  return counts.map((c) => c / N);
}
// expected brains per brain-eligible win (boss roll + pity), by luck
function simExpectedBrains(recLevel: number, luck: number): number {
  const rng = mulberry32(0x9e3779b9 ^ (recLevel * 131 + luck * 17));
  const N = 300000;
  let dry = 0;
  let total = 0;
  for (let i = 0; i < N; i++) {
    const b = rollBrainDropWithPity(recLevel, dry, rng, luck);
    total += b;
    dry = nextBrainDryStreak(dry, b);
  }
  return total / N;
}
// expected wins per rare-zombie drop (rate + pity), by dice+luck
function simRareExpectedWins(raidId: number, dice: number, luck: number): number | null {
  if (!RAID_ZOMBIE_DROPS[raidId]) return null;
  const rng = mulberry32(0x85ebca6b ^ (raidId * 911 + dice * 53 + luck * 7));
  const N = 400000;
  let dry = 0;
  let dropCount = 0;
  for (let i = 0; i < N; i++) {
    const got = !!rollRaidZombieDropWithPity(raidId, true, rng(), dry, dice, luck);
    if (got) dropCount++;
    dry = nextRaidZombieDryWins(dry, got);
  }
  return dropCount ? N / dropCount : null;
}

// resolve one loot name -> its value profile
function resolveLootItem(name: string, recLevel: number) {
  const boost = boostByName[name];
  const drop = drops[name]?.value ?? drops[name];
  let goldValue = 0;
  let brainValue = 0;
  let sellValue = 0;
  let kind = "item";
  let placeKey: string | null = null;
  if (boost) {
    kind = "boost";
    if (name === "Invasion Voucher") goldValue = VOUCHER_COST; // refunds its own cost
  }
  if (drop) {
    if (drop.gold) {
      kind = "gold";
      goldValue = Math.round(recLevel * 100); // Bonus Gold = recommendedLevel × 100
    } else if (drop.brains) {
      kind = "brains";
      brainValue = parseInt(String(name).replace(/[^0-9]/g, ""), 10) || 0;
    } else if (drop.tile) {
      kind = "decor";
      placeKey = drop.tile;
      const p = placeablesByKey[drop.tile];
      sellValue = p ? sellValueOf(p) : awardedSellValue(drop.tile) ?? 0;
      ref(drop.icon);
    }
  } else if (placeablesByName[name]) {
    kind = "decor";
    const p = placeablesByName[name];
    placeKey = p.key;
    sellValue = sellValueOf(p);
  }
  return { name, kind, goldValue, brainValue, sellValue, placeKey, unique: !!drop?.unique, boostKey: boost?.key ?? null, boostQty: boost ? raidBoostBundle(boost.key) : null };
}

const raids = raidsRaw.map((r) => {
  ref(r.bossPortrait);
  ref(r.enemyIcon);
  const recLevel = r.recommendedLevel;
  // loot tiers resolved
  const lootTiers = (r.loot as string[][]).map((tier, tierIndex) => ({
    tier: tierIndex,
    items: tier.map((n) => resolveLootItem(n, recLevel)),
  }));
  const flatItems = lootTiers.flatMap((t) => t.items.map((it) => ({ ...it, tier: t.tier })));
  const hasVoucherInLoot = flatItems.some((i) => i.name === "Invasion Voucher");

  // waves
  const stages = (r.stages as any[]).map((st, i) => {
    const sumFreq = (st.weighted ?? []).reduce((a: number, w: any) => a + (w.frequency || 0), 0) || 1;
    const minions = (st.weighted ?? []).map((w: any) => {
      const count = st.population ? Math.max(1, Math.round((st.population * (w.frequency || 0)) / sumFreq)) : 1;
      const e = enemyByKey[w.enemy];
      return { key: w.enemy, name: w.enemy, count, hpEach: e?.hp ?? null, dpsEach: e?.meleeDps ?? null };
    });
    // non-weighted explicit lists
    const explicit = (st.enemyKeys ?? []).map((k: string) => ({ key: k, name: k, count: 1, hpEach: enemyByKey[k]?.hp ?? null, dpsEach: enemyByKey[k]?.meleeDps ?? null }));
    const boss = st.bossKey ? enemyByKey[st.bossKey] : null;
    const roster = minions.length ? minions : explicit;
    const totalHp = (boss?.hp ?? 0) + roster.reduce((a: number, m: any) => a + (m.hpEach ?? 0) * m.count, 0);
    const totalDps = (boss?.meleeDps ?? 0) + roster.reduce((a: number, m: any) => a + (m.dpsEach ?? 0) * m.count, 0);
    return {
      index: i,
      wave: st.wave ?? i,
      bossKey: st.bossKey ?? null,
      randomBoss: !!st.randomBoss,
      population: st.population ?? roster.length,
      minions: roster,
      totalEnemyHp: round(totalHp),
      totalEnemyMeleeDps: round(totalDps),
    };
  });

  // EV grid
  const maxDice = Math.min(5, maxLuckTiers(r));
  const byDice = [] as any[];
  for (let dice = 0; dice <= 5; dice++) {
    const probs = lootTierProbs(dice);
    // per-tier expected contributions
    let alwaysGoldEV = 0;
    let voucherRefundEV = 0;
    let decorSellEV = 0;
    let lootBrainsEV = 0;
    lootTiers.forEach((t) => {
      const p = probs[t.tier] ?? 0;
      if (!t.items.length || p === 0) return;
      const share = p / t.items.length;
      for (const it of t.items) {
        // "always" gold = bonus gold + voucher refund
        if (it.kind === "gold") alwaysGoldEV += share * it.goldValue;
        if (it.name === "Invasion Voucher") {
          alwaysGoldEV += share * it.goldValue;
          voucherRefundEV += share * it.goldValue;
        }
        if (it.kind === "decor") decorSellEV += share * it.sellValue;
        if (it.kind === "brains") lootBrainsEV += share * it.brainValue;
      }
    });
    byDice.push({
      dice,
      usable: dice <= maxDice,
      tierProbs: probs.map((x) => round(x, 5)),
      alwaysGoldEV: round(alwaysGoldEV),
      voucherRefundEV: round(voucherRefundEV),
      decorSellEV: round(decorSellEV),
      lootBrainsEV: round(lootBrainsEV, 3),
      rareRateNormal: round(raidZombieDropRate(r.id, dice, 1), 6),
      rareRateElite: round(raidZombieDropRate(r.id, dice, ELITE_BRAIN_LUCK), 6),
      rareExpectedWinsNormal: simRareExpectedWins(r.id, dice, 1),
      rareExpectedWinsElite: simRareExpectedWins(r.id, dice, ELITE_BRAIN_LUCK),
    });
  }

  const rare = RAID_ZOMBIE_DROPS[r.id]
    ? { key: (RAID_ZOMBIE_DROPS[r.id] as any).key, name: (RAID_ZOMBIE_DROPS[r.id] as any).name }
    : null;

  return {
    id: r.id,
    name: r.name,
    bossName: r.bossName,
    bossPortrait: r.bossPortrait,
    enemyIcon: r.enemyIcon,
    unlockLevel: r.unlockLevel,
    recommendedLevel: r.recommendedLevel,
    eliteRecommendedLevel: r.eliteRecommendedLevel,
    xp: r.xp,
    goldReward: r.goldReward,
    bonusGold: r.bonusGold,
    winGoldFull: winGold(r, 1),
    seasonal: !!r.seasonal,
    playable: !!r.playable,
    stageCount: (r.stages ?? []).length,
    firstClearBrains: firstClearBrains(r.unlockLevel),
    minArmyProgression: [0, 1, 2].map((w) => minArmyFor(r, w)),
    cooldownMs: RAID_COOLDOWN_MS,
    voucherCost: VOUCHER_COST,
    eliteCost: ELITE_COST,
    hasVoucherInLoot,
    lootTiers,
    stages,
    rare,
    ev: {
      byDice,
      maxUsefulDice: maxDice,
      brainsNormal: round(simExpectedBrains(recLevel, 1), 4),
      brainsElite: round(simExpectedBrains(recLevel, ELITE_BRAIN_LUCK), 4),
      brainDropChanceNormal: round(brainDropChance(recLevel, 1), 4),
    },
  };
});
writeJson("raids", raids);

// ===========================================================================
// EPIC BOSSES
// ===========================================================================
const questZombieByQuestId = EPIC_QUEST_ZOMBIE_REWARDS as Record<string, string>;
// Epic icons share basenames across boss dirs, so copy them under unique names.
const epicIcon = (id: string, file: string | null | undefined): string | null => {
  const base = iconBase(file);
  if (!base) return null;
  const dest = `epic_${id}_${base}`;
  explicitCopies.set(dest, join(ASSETS, "epic-bosses", id, base));
  return dest;
};
const epicBosses = (EPIC_BOSSES as any[]).map((def) => {
  const portrait = epicIcon(def.id, def.portrait);
  const questIcon = epicIcon(def.id, def.questIcon);
  const lootIcon = epicIcon(def.id, def.lootIcon);
  const unlockLevel = (EPIC_BOSS_UNLOCK_LEVELS as any)[def.id] ?? null;
  const hpCurve = Array.from({ length: def.maxLevel }, (_, i) => ({ level: i + 1, hp: epicBossHp(def, i + 1) }));
  const questZombies = (def.questIds ?? [])
    .filter((qid: string) => questZombieByQuestId[qid])
    .map((qid: string) => {
      const zKey = questZombieByQuestId[qid];
      const z = zombiesByKey[zKey];
      return { questId: qid, key: zKey, name: z?.name ?? zKey, dps: z?.dps ?? null, hp: z?.hp ?? null, className: z?.className ?? null };
    });
  const loot = (def.loot ?? []).map((l: any) => {
    ref(l.sprite);
    return { level: l.level, name: l.name, sprite: l.sprite ?? null, unique: !!l.unique, tile: l.tile ?? null };
  });
  const favCropKey = (EPIC_BOSS_FAVORITE_CROPS as any)[def.id] ?? null;
  return {
    id: def.id,
    name: def.name,
    costBrains: def.costBrains,
    unlockLevel,
    durationMs: def.durationMs,
    encounterMs: def.encounterMs,
    fightMs: def.fightMs,
    maxLevel: def.maxLevel,
    baseHp: def.baseHp,
    unitStats: { str: def.unitStats?.str, con: def.unitStats?.con, dex: def.unitStats?.dex },
    hpCurve,
    questZombies,
    loot,
    favoriteCrop: favCropKey ? { key: favCropKey, name: cropByKey[favCropKey]?.name ?? favCropKey } : null,
    portrait,
    questIcon,
    lootIcon,
    fightBrainCost: EPIC_BOSS_FIGHT_BRAIN_COST,
  };
});
writeJson("epic-bosses", epicBosses);

// ===========================================================================
// UPGRADES (farm size + climate)
// ===========================================================================
writeJson("upgrades", {
  mapSize: (upgrades.mapSize ?? []).map((u: any) => {
    ref(u.icon);
    return { name: u.name, size: u.size, level: u.level, gold: u.gold, brains: u.brains, info: u.info, icon: iconBase(u.icon) };
  }),
  climate: (upgrades.climate ?? []).map((u: any) => {
    ref(u.icon);
    return { name: u.name, level: u.level, gold: u.gold, terrain: u.terrain, icon: iconBase(u.icon) };
  }),
});

// ===========================================================================
// ECONOMY + COMBAT CONSTANTS
// ===========================================================================
const xpThresholds = (XP_THRESHOLDS as number[]).map((cum, i) => ({
  level: i + 1,
  cumulativeXp: cum,
  delta: i === 0 ? 0 : cum - (XP_THRESHOLDS as number[])[i - 1],
}));
writeJson("economy", {
  xpThresholds,
  maxLevel: xpThresholds.length,
  sellBackRatio: ECONOMY.SELL_BACK_RATIO,
  brainSellGoldRate: ECONOMY.BRAIN_SELL_GOLD_RATE,
  plowCost: PLOW_COST,
  plowXpNormal: plowXp(false),
  plowXpMonolith: plowXp(true),
  harvestXpBonusMonolith: harvestXp(0, true) - harvestXp(0, false),
  buyXpRates: {
    // gold/XP conversion at the standard 1%-of-cost authored rate, both currencies
    decorGoldPerXp: round(1 / (buyXp(10000, 0, false, "decor") / 10000), 1),
    functionalGoldPerXp: round(1 / (buyXp(10000, 0, false, "functional") / 10000), 1),
    brainDecorXpPerBrain: buyXp(1, 0, true, "decor"),
    brainFunctionalXpPerBrain: buyXp(1, 0, true, "functional"),
  },
});
writeJson("combat", {
  powerPerStr: POWER_PER_STR,
  hpPerCon: HP_PER_CON,
  attackIntervalSec: ATTACK_INTERVAL_SEC,
  lineupDamageBands: LINEUP_DAMAGE_BANDS,
  lineupSpeedBands: LINEUP_SPEED_BANDS,
  levelScaleEndpoints: LEVEL_SCALE_ENDPOINTS,
  levelScaleStartLevel: 8,
  levelScaleEndLevel: 25,
  vetRanks: VET_RANKS,
  vetThresholds: VET_THRESHOLDS,
  vetStatStep: VET_STAT_STEP,
  alienLaserDamage: ALIEN_LASER_DAMAGE,
  stats: STATS.map((s: any) => ({ key: s.key, label: s.label, desc: s.desc })),
  combine: {
    potDurationMs: POT_DURATION_MS,
    monolithMult: MONOLITH_MULT,
    specialLevel: COMBINE_SPECIAL_LEVEL,
    specialChance: COMBINE_SPECIAL_CHANCE,
    maxPots: MAX_ZOMBIE_POTS,
    blueByGroup: COMBINE_BLUE_BY_GROUP,
    redByGroup: COMBINE_RED_BY_GROUP,
    specialByGroup: COMBINE_SPECIAL_BY_GROUP,
  },
  raid: { armyCap: ARMY_CAP, minArmy: MIN_ARMY, cooldownMs: RAID_COOLDOWN_MS, eliteBrainLuck: ELITE_BRAIN_LUCK, brainPityInvasions: BRAIN_PITY_INVASIONS, rareZombiePityWins: RAID_ZOMBIE_PITY_WINS },
  themes: { active: ACTIVE_THEMES, evergreen: EVERGREEN },
});

// ===========================================================================
// ASSET COPY  (only referenced files, flattened into game-assets/all)
// ===========================================================================
// Always-copy HUD icons (currencies + generic fallbacks) + the game logo.
for (const f of ["topbar_money_icon.png", "topbar_brain_icon.png", "topbar_exp_icon.png", "topbar_level_icon.png", "topbar_zombie_icon.png", "logo.png"]) ref(f);

// Build a basename -> abspath index, walking dirs in priority order (first wins).
const SCAN_ORDER = ["ui", "crop-icons", "boosts", "objects", "zombie", "crops", "raids/images", "raids/enemies", "raids/loot", "raids", "epic-bosses", "player", "pets", "scenery", "ground", "title", "tutorial"];
const index: Record<string, string> = {};
function walk(dir: string) {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full);
    else if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name)) {
      if (!(name in index)) index[name] = full;
    }
  }
}
for (const sub of SCAN_ORDER) walk(join(ASSETS, sub));

// Fresh output dir.
rmSync(ASSET_OUT, { recursive: true, force: true });
mkdirSync(ASSET_OUT, { recursive: true });
let copied = 0;
const missing: string[] = [];
for (const file of referenced) {
  const src = index[file] ?? index[basename(file)];
  if (!src) {
    missing.push(file);
    continue;
  }
  copyFileSync(src, join(ASSET_OUT, basename(file)));
  copied++;
}
// Namespaced copies (epic-boss icons) that would otherwise collide by basename.
for (const [dest, src] of explicitCopies) {
  try {
    copyFileSync(src, join(ASSET_OUT, dest));
    copied++;
  } catch {
    missing.push(dest);
  }
}

// ===========================================================================
// META
// ===========================================================================
function gameCommit(): { hash: string; short: string; date: string } {
  try {
    const hash = execSync("git rev-parse HEAD", { cwd: GAME }).toString().trim();
    const date = execSync("git log -1 --format=%cI", { cwd: GAME }).toString().trim();
    return { hash, short: hash.slice(0, 7), date };
  } catch {
    return { hash: "unknown", short: "unknown", date: "" };
  }
}
const commit = gameCommit();
writeJson("meta", {
  gameCommit: commit.hash,
  gameCommitShort: commit.short,
  gameCommitDate: commit.date,
  repoUrl: "https://github.com/actualdoctornerd-ai/Zombie-Farm-2-Reforged",
  builtAt: new Date().toISOString(),
  counts: {
    crops: crops.length,
    zombies: zombies.length,
    mutations: mutations.length,
    abilities: abilities.length,
    placeables: placeables.length,
    boosts: boostsOut.length,
    quests: coreQuests.length + reforgedQuests.length,
    raids: raids.length,
    enemies: enemies.length,
    epicBosses: epicBosses.length,
  },
});

console.log(`[extract] wrote generated JSON to src/data/generated`);
console.log(`[extract] copied ${copied} icons -> public/game-assets/all (${missing.length} missing)`);
if (missing.length) console.log(`[extract] missing (first 25): ${missing.slice(0, 25).join(", ")}`);
