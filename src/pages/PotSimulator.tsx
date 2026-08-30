import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Panel, Note, Section } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { Badge } from "../components/ui/Badge";
import { ZombieIcon } from "../components/ui/ZombieIcon";
import { GameIcon } from "../components/ui/GameIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { zombies, zombieByKey, mutations, mutationsFile, zombieSlug } from "../data";
import { num } from "../lib/format";
import { scaledStats, hpOf, dpsOf, healPerSec } from "../lib/zombieCalc";
import { simulateCombine, mutationsInMask, COMBINE_SPECIAL_LEVEL, type SimParent, type SimGraves, type SimOutcome } from "../lib/potSim";
import type { Zombie, Mutation } from "../data/types";

const STORAGE_KEY = "zfr-potsim-v1";
interface SimState {
  a: SimParent;
  b: SimParent;
  level: number;
  graves: SimGraves;
  monolith: boolean;
}
const DEFAULTS: SimState = {
  a: { key: "ZombieActorGardenTier1", mask: 0 },
  b: { key: "ZombieActorGardenTier1", mask: 0 },
  level: 25,
  graves: { blue: false, red: false },
  monolith: false,
};

function useSim(): [SimState, (p: Partial<SimState>) => void] {
  const [s, setS] = useState<SimState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return DEFAULTS;
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);
  return [s, (p) => setS((prev) => ({ ...prev, ...p }))];
}

// Roster grouped by body type for the species <select>.
const ROSTER_BY_GROUP: { group: string; items: Zombie[] }[] = (() => {
  const by = new Map<string, Zombie[]>();
  for (const z of [...zombies].sort((x, y) => x.name.localeCompare(y.name))) {
    const arr = by.get(z.group) ?? [];
    arr.push(z);
    by.set(z.group, arr);
  }
  return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([group, items]) => ({ group, items }));
})();

const mutationsBySlot = new Map<string, Mutation[]>();
for (const m of mutations) {
  const arr = mutationsBySlot.get(m.slot) ?? [];
  arr.push(m);
  mutationsBySlot.set(m.slot, arr);
}

export function PotSimulatorPage() {
  const [s, patch] = useSim();
  const result = useMemo(() => simulateCombine(s.a, s.b, s.level, s.graves), [s.a, s.b, s.level, s.graves]);

  return (
    <div>
      <PageHeader title="Zombie Pot Simulator" icon={<PageIcon to="/pot-simulator" />} kicker="combine two zombies">
        <p>
          Pick two parents and see exactly what the Zombie Pot produces, run through the game's own combine logic. Slot 1 decides the
          species; a matched pair climbs the colour ladder; at level {COMBINE_SPECIAL_LEVEL}+ an eligible pair can roll the tier-5
          special. In game the pot only reveals the result after it finishes, and the special is a per-pair roll, so both branches are
          shown here.
        </p>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <ParentCard slotLabel="Slot 1" hint="decides the species" parent={s.a} onChange={(a) => patch({ a })} />
        <ParentCard slotLabel="Slot 2" hint="donates mutations" parent={s.b} onChange={(b) => patch({ b })} />
      </div>

      <Panel className="mt-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Player level <span className="text-muted/60">({s.level})</span>
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={45} value={s.level} onChange={(e) => patch({ level: Number(e.target.value) })} className="w-full accent-[rgb(var(--primary))]" />
              <input type="number" min={1} max={45} value={s.level} onChange={(e) => patch({ level: Math.max(1, Math.min(45, Number(e.target.value) || 1)) })} className="w-16 rounded-md border border-border bg-surface px-2 py-1.5 text-sm tabular outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Graves owned</label>
            <div className="flex gap-1.5">
              <Toggle on={s.graves.blue} onClick={() => patch({ graves: { ...s.graves, blue: !s.graves.blue } })}>Blue</Toggle>
              <Toggle on={s.graves.red} onClick={() => patch({ graves: { ...s.graves, red: !s.graves.red } })}>Red</Toggle>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Speed-up</label>
            <Toggle on={s.monolith} onClick={() => patch({ monolith: !s.monolith })}>Clay Monolith</Toggle>
          </div>
        </div>
      </Panel>

      {/* Result */}
      <div className="mt-4">
        {result.error ? (
          <Note tone="warn">{result.error}</Note>
        ) : (
          <ResultView s={s} result={result} />
        )}
      </div>

      <Section title="How the pot works">
        <ul className="prose-tight list-disc space-y-1 pl-5 text-sm text-muted">
          <li><span className="text-text">Species</span> comes from slot 1 - the child is a fresh zombie of that species, so base stats do not carry over from stronger parents.</li>
          <li><span className="text-text">Mutations</span> merge per slot (one of each of the 5 slots); a same-slot clash keeps the higher-tier mutation. A headless child sheds head and hair/eye mutations, except an inherited Pumpking.</li>
          <li><span className="text-text">Colour ladder (guaranteed)</span>: combining two <em>identical</em> zombies breeds them up one colour - two Greens to Blue (needs the Blue Grave), two Blues to Red (Red Grave), two Reds to Silver at level {COMBINE_SPECIAL_LEVEL}+. This is the only route to Silver, and it always works.</li>
          <li><span className="text-text">Tier-5 special ({Math.round(result.chance * 100)}% roll)</span>: at level {COMBINE_SPECIAL_LEVEL}+, <em>any</em> two zombies - any tier, even two basic greens, and they need not match or even share a group - have a {Math.round(result.chance * 100)}% chance to become slot 1's group special (Zombutterfly for a Garden slot 1, Skull Head for Headless, and so on). You do <strong>not</strong> need silver or matched parents. One catch: a matched pair that owns its next grave climbs the ladder instead, so to fish the roll with cheap zombies, use two different ones. The roll is fixed per pair but revealed only after the combine finishes.</li>
          <li><span className="text-text">Veterancy</span> resets to Newbie, so rank up after combining, not before.</li>
        </ul>
        <div className="mt-2">
          <SourceCite file="src/zombie/combineSpecies.ts" label="combineSpecies.ts" /> · <SourceCite file="src/zombie/ZombiePot.ts" label="ZombiePot.ts" /> · <SourceCite file="src/zombie/mutations.ts" label="mutations.ts" />
        </div>
      </Section>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors ${on ? "border-primary bg-primary/10 text-primary-strong" : "border-border bg-surface text-muted hover:bg-surface-2"}`}>
      {children}
    </button>
  );
}

function ParentCard({ slotLabel, hint, parent, onChange }: { slotLabel: string; hint: string; parent: SimParent; onChange: (p: SimParent) => void }) {
  const z = zombieByKey[parent.key];
  const headless = z?.group === "Headless";
  const slots = mutationsFile.slots.filter((slot) => !(headless && slot === "hair_eye"));

  const toggleMut = (m: Mutation) => {
    const has = (parent.mask & m.bit) === m.bit;
    // clear any other mutation in the same slot, then set/unset this bit
    let mask = parent.mask;
    for (const other of mutationsBySlot.get(m.slot) ?? []) mask = mask & ~other.bit;
    if (!has) mask |= m.bit;
    onChange({ ...parent, mask });
  };

  const optionsFor = (slot: string): Mutation[] => {
    const list = mutationsBySlot.get(slot) ?? [];
    if (headless && slot === "head") return list.filter((m) => m.key === "pumpking");
    return list;
  };

  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {slotLabel} <span className="font-normal normal-case text-muted/60">· {hint}</span>
        </span>
        {z && <span className="text-xs text-muted">{z.group} · {z.className}</span>}
      </div>
      <div className="flex items-center gap-3">
        {z && <ZombieIcon zombie={z} size="lg" />}
        <select
          value={parent.key}
          onChange={(e) => onChange({ key: e.target.value, mask: 0 })}
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {ROSTER_BY_GROUP.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((zz) => (
                <option key={zz.key} value={zz.key}>
                  {zz.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Mutations</div>
        <div className="space-y-1.5">
          {slots.map((slot) => (
            <div key={slot} className="flex flex-wrap items-center gap-1.5">
              <span className="w-14 shrink-0 text-xs capitalize text-muted">{slot.replace("_", "/")}</span>
              {optionsFor(slot).map((m) => {
                const on = (parent.mask & m.bit) === m.bit;
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleMut(m)}
                    title={`${m.name} (${statText(m)})`}
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors ${on ? "border-primary bg-primary/10 text-primary-strong" : "border-border bg-surface text-muted hover:bg-surface-2"}`}
                  >
                    <GameIcon file={m.icon} alt="" size="xs" fallback="none" className="!h-4 !w-4" />
                    {m.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ResultView({ s, result }: { s: SimState; result: ReturnType<typeof simulateCombine> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Panel>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Result</div>
        {result.special ? (
          <div className="space-y-2">
            <OutcomeRow tag={`${Math.round((1 - result.chance) * 100)}%+`} outcome={result.base} promotion={result.promotion} level={s.level} />
            <OutcomeRow tag={`${Math.round(result.chance * 100)}%`} outcome={result.special} promotion="tier-5 Special" level={s.level} highlight />
            <p className="text-xs text-muted">
              The special is a {Math.round(result.chance * 100)}% roll fixed per parent pair, revealed only after the {result.minutes}m combine finishes - no in-game preview before you commit.
            </p>
          </div>
        ) : (
          <OutcomeRow tag="result" outcome={result.base} promotion={result.promotion} level={s.level} sole />
        )}
        <div className="mt-3 border-t border-border/60 pt-2 text-xs text-muted">
          Combine time: <span className="text-text">{result.minutes}m</span>
          {s.monolith && <> → <span className="text-text">{result.monolithMinutes}m</span> with the Clay Monolith</>}
        </div>
      </Panel>

      <Panel>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Merged mutations</div>
        <MutationList mask={result.base.childMask} childKey={result.base.key} parentMask={s.a.mask | s.b.mask} />
      </Panel>
    </div>
  );
}

function OutcomeRow({ tag, outcome, promotion, level, highlight, sole }: { tag: string; outcome: SimOutcome; promotion?: string; level: number; highlight?: boolean; sole?: boolean }) {
  const z = outcome.zombie;
  if (!z) return null;
  const base = scaledStats(z, level);
  const f = { str: base.str + outcome.bonus.str, con: base.con + outcome.bonus.con, dex: base.dex + outcome.bonus.dex };
  const heal = z.group === "Garden" ? healPerSec(f.str, f.dex) : null;
  return (
    <div className={`flex items-center gap-3 rounded-md border p-2 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
      <Badge className={sole ? "hidden" : ""} color={highlight ? "rgb(var(--class-special))" : "rgb(var(--text-muted))"}>{tag}</Badge>
      <ZombieIcon zombie={z} size="md" />
      <div className="min-w-0 flex-1">
        <Link to={`/zombies/${zombieSlug(z)}`} className="font-medium !text-text hover:!text-primary-strong">{z.name}</Link>
        {promotion && <span className="ml-1.5 text-xs text-primary-strong">{promotion}</span>}
        <div className="text-xs text-muted">{z.group} · {z.className}</div>
      </div>
      <div className="shrink-0 text-right text-xs tabular text-muted">
        <div><span className="text-text">{num(hpOf(f.con))}</span> HP</div>
        <div><span className="text-text">{num(dpsOf(f.str, f.dex))}</span> DPS{heal != null && <> · <span className="text-text">{num(heal)}</span> heal/s</>}</div>
      </div>
    </div>
  );
}

function MutationList({ mask, childKey, parentMask }: { mask: number; childKey: string; parentMask: number }) {
  const kept = mutationsInMask(mask);
  const lost = mutationsInMask(parentMask).filter((m) => (mask & m.bit) !== m.bit);
  const headless = zombieByKey[childKey]?.group === "Headless";
  if (kept.length === 0 && lost.length === 0) return <p className="text-sm text-muted">Neither parent carries a mutation.</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {kept.map((m) => (
          <span key={m.key} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs">
            <GameIcon file={m.icon} alt="" size="xs" fallback="none" className="!h-4 !w-4" />
            <span className="font-medium">{m.name}</span>
            <span className="text-muted">{statText(m)}</span>
          </span>
        ))}
        {kept.length === 0 && <span className="text-sm text-muted">No mutations on the child.</span>}
      </div>
      {lost.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Dropped: {lost.map((m) => m.name).join(", ")}
          {headless ? " - a headless child sheds head and hair/eye mutations." : " - lost a same-slot clash to a higher-tier mutation."}
        </p>
      )}
    </div>
  );
}

function statText(m: Mutation): string {
  const parts: string[] = [];
  if (m.stats.str) parts.push(`+${m.stats.str} STR`);
  if (m.stats.con) parts.push(`+${m.stats.con} CON`);
  if (m.stats.dex) parts.push(`+${m.stats.dex} DEX`);
  return parts.join(", ");
}
