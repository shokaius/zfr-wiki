import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Panel, Note } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { Badge } from "../components/ui/Badge";
import { ZombieIcon } from "../components/ui/ZombieIcon";
import { GameIcon } from "../components/ui/GameIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { cropByKey, mutationByKey, zombieSlug } from "../data";
import { num } from "../lib/format";
import {
  computeBuilds,
  metricUnit,
  OPTIMIZE_LABELS,
  CROPS_TO_GUARANTEE,
  SCALE_CAP,
  type CalcSettings,
  type OptimizeKind,
  type BuildResult,
  type Source,
} from "../lib/zombieCalc";

const STORAGE_KEY = "zfr-calc-settings-v1";
const DEFAULTS: CalcSettings = {
  optimize: "con",
  level: 45,
  mutations: true,
  combinations: true,
  includeBrains: false,
  includeSpecial: false,
  includeUnobtainable: false,
};

function useCalcSettings(): [CalcSettings, (p: Partial<CalcSettings>) => void] {
  const [s, setS] = useState<CalcSettings>(() => {
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

const SOURCE_META: Record<Source, { label: string; color: string }> = {
  gold: { label: "Gold market", color: "rgb(var(--accent-gold))" },
  brains: { label: "Brain purchase", color: "rgb(var(--accent-brain))" },
  reward: { label: "Reward only", color: "rgb(var(--text-muted))" },
  hidden: { label: "Combine / event", color: "rgb(var(--class-special))" },
};

function Checkbox({ checked, onChange, disabled, children }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[rgb(var(--primary))]"
      />
      {children}
    </label>
  );
}

export function ZombieCalculatorPage() {
  const [s, patch] = useCalcSettings();
  const results = useMemo(() => computeBuilds(s), [s]);
  const [open, setOpen] = useState<string | null>(null);
  const unit = metricUnit(s.optimize);

  return (
    <div>
      <PageHeader title="Zombie Calculator" icon={<PageIcon to="/calculator" />} kicker="best build per stat">
        <p>
          Pick a stat, a level, and how far you'll go to build a zombie. The table ranks every zombie by the best value it can reach,
          then expand a row for the exact recipe - which mutagen crops to plant and how many Zombie Pot combines it takes. Numbers use
          the game's own stat, mutation, and combine rules.
        </p>
      </PageHeader>

      {/* Controls */}
      <Panel className="mb-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Optimize */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Optimize for</label>
            <select
              value={s.optimize}
              onChange={(e) => patch({ optimize: e.target.value as OptimizeKind })}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {(Object.keys(OPTIMIZE_LABELS) as OptimizeKind[]).map((k) => (
                <option key={k} value={k}>
                  {OPTIMIZE_LABELS[k]}
                </option>
              ))}
            </select>
            {s.optimize === "heal" && <div className="mt-1.5 text-xs text-muted">Limited to Garden zombies (the only healers).</div>}
          </div>

          {/* Level */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Current level <span className="text-muted/60">({s.level})</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={45}
                value={s.level}
                onChange={(e) => patch({ level: Number(e.target.value) })}
                className="w-full accent-[rgb(var(--primary))]"
              />
              <input
                type="number"
                min={1}
                max={45}
                value={s.level}
                onChange={(e) => patch({ level: Math.max(1, Math.min(45, Number(e.target.value) || 1)) })}
                className="w-16 rounded-md border border-border bg-surface px-2 py-1.5 text-sm tabular outline-none focus:border-primary"
              />
            </div>
            <div className="mt-1.5 text-xs text-muted">Stats stop scaling at level {SCALE_CAP}; higher levels only unlock more mutations.</div>
          </div>

          {/* Build power */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Build depth</label>
            <div className="space-y-1.5">
              <Checkbox checked={s.mutations} onChange={(v) => patch({ mutations: v })}>
                Enable mutations <span className="text-muted">(plant mutagen crops)</span>
              </Checkbox>
              <div className="pl-6">
                <Checkbox checked={s.combinations && s.mutations} disabled={!s.mutations} onChange={(v) => patch({ combinations: v })}>
                  Enable combinations <span className="text-muted">(stack all slots in the pot)</span>
                </Checkbox>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <FilterToggle on={s.includeBrains} onClick={() => patch({ includeBrains: !s.includeBrains })}>Brain-purchase</FilterToggle>
              <FilterToggle on={s.includeSpecial} onClick={() => patch({ includeSpecial: !s.includeSpecial })}>Special</FilterToggle>
              <FilterToggle on={s.includeUnobtainable} onClick={() => patch({ includeUnobtainable: !s.includeUnobtainable })}>Unobtainable</FilterToggle>
            </div>
          </div>
        </div>
      </Panel>

      {/* Results */}
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          Ranked by <span className="font-semibold text-text">{OPTIMIZE_LABELS[s.optimize]}</span>
          {!s.mutations && " (base stats - mutations off)"}
        </span>
        <span className="tabular">{results.length} zombies</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Zombie</th>
              <th>Source</th>
              <th className="text-center">Mutations</th>
              <th className="text-right">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const id = r.zombie.key;
              const isOpen = open === id;
              const delta = r.value - r.baseValue;
              return (
                <RowGroup key={id}>
                  <tr className="cursor-pointer hover:bg-[rgb(var(--primary)/0.06)]" onClick={() => setOpen(isOpen ? null : id)}>
                    <td className="text-center text-muted">
                      <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-right text-xs text-muted tabular">{i + 1}</span>
                        <ZombieIcon zombie={r.zombie} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium">
                            {r.zombie.name}
                            {r.zombie.classColor && (
                              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: r.zombie.classColor }} title={r.zombie.className} />
                            )}
                          </div>
                          <div className="text-xs text-muted">
                            {r.zombie.group}
                            {r.belowLevel && <span className="ml-1.5 text-danger">unlocks Lv {r.zombie.level}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge color={SOURCE_META[r.source].color}>{SOURCE_META[r.source].label}</Badge>
                    </td>
                    <td className="text-center">
                      {r.picks.length ? (
                        <div className="inline-flex items-center gap-0.5">
                          {r.picks.map((m) => (
                            <GameIcon key={m.key} file={m.icon} alt={m.name} size="xs" fallback="none" className="!h-5 !w-5" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="font-semibold tabular text-primary-strong">{num(r.value)}</div>
                      {delta > 0 && <div className="text-xs text-muted tabular">base {num(r.baseValue)} +{num(delta)}</div>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="!bg-surface-2/40 !p-0">
                        <RecipeView r={r} unit={unit} showCombine={s.combinations && s.mutations} />
                      </td>
                    </tr>
                  )}
                </RowGroup>
              );
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted">
                  No zombies match. Turn on a source toggle above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Note tone="muted">
        Mutations add flat to the level-scaled stat (never multiplied), one per slot - 5 slots, or body/arm/neck plus Pumpking for
        headless. Four identical crops on a growing zombie's neighbouring plots guarantee that mutation, and 8 plots per grow means at
        most two guaranteed mutations per grow; the Zombie Pot then unions two builds slot-by-slot (higher tier wins) while keeping the
        slot-1 species. Combining resets veterancy, so rank up after.
        <div className="mt-1">
          <SourceCite file="src/zombie/mutations.ts" label="mutations.ts" /> · <SourceCite file="src/zombie/cropMutations.ts" label="cropMutations.ts" /> ·{" "}
          <SourceCite file="src/raid/combatStats.ts" label="combatStats.ts" />
        </div>
      </Note>
    </div>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function FilterToggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-primary/10 text-primary-strong" : "border-border bg-surface text-muted hover:bg-surface-2"}`}>
      + {children}
    </button>
  );
}

function RecipeView({ r, unit, showCombine }: { r: BuildResult; unit: string; showCombine: boolean }) {
  const { recipe } = r;
  const promo = recipe.promotion;
  return (
    <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      {/* left: stat breakdown + obtain */}
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Result</div>
          <div className="rounded-md border border-border bg-surface p-3 text-sm">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-muted">{unit}</span>
              <span className="text-lg font-bold tabular text-primary-strong">{num(r.value)}</span>
            </div>
            <StatLine label="STR" base={r.base.str} final={r.stats.str} />
            <StatLine label="CON" base={r.base.con} final={r.stats.con} />
            <StatLine label="DEX" base={r.base.dex} final={r.stats.dex} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Get the base zombie</div>
          <p className="text-sm text-muted">
            {obtainText(r)}{" "}
            <Link to={`/zombies/${zombieSlug(r.zombie)}`} className="whitespace-nowrap">
              view {r.zombie.name} →
            </Link>
          </p>
          {promo && showCombine && (
            <p className="mt-1.5 text-sm text-muted">
              <span className="font-medium text-text">{promo.tier} route:</span> combine {promo.from}
              {promo.needsLevel25 && " at level 25+"}
              {promo.chance != null && ` (${Math.round(promo.chance * 100)}% roll, deterministic per pair - fish with the pot preview)`}.
            </p>
          )}
        </div>
      </div>

      {/* right: mutation recipe */}
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {recipe.picks.length ? `Mutation loadout (${recipe.picks.length})` : "Mutations"}
        </div>
        {recipe.picks.length === 0 ? (
          <p className="text-sm text-muted">No mutations in this build - the base zombie already wins here, or mutations are off / not yet unlocked at this level.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {recipe.picks.map((p) => (
                <MutationPill key={p.slot + p.name} name={p.name} stat={p.stat} crop={p.crop} />
              ))}
            </div>
            <ol className="space-y-1.5 text-sm">
              {recipe.grows.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary-strong">{i + 1}</span>
                  <span className="text-muted">
                    Grow <span className="font-medium text-text">{r.zombie.name}</span> beside{" "}
                    {g.crops.map((c, j) => (
                      <span key={j}>
                        {j > 0 && " + "}
                        <span className="font-medium text-text">
                          {c.qty}× {c.name}
                        </span>
                      </span>
                    ))}{" "}
                    → imprints {g.gains.join(" + ")}.
                  </span>
                </li>
              ))}
              {recipe.combines > 0 && (
                <li className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary-strong">{recipe.grows.length + 1}</span>
                  <span className="text-muted">
                    Combine the {recipe.grows.length} grows in the Zombie Pot ({recipe.combines} merge{recipe.combines > 1 ? "s" : ""}), keeping{" "}
                    <span className="font-medium text-text">{r.zombie.name}</span> in slot 1 each time → all {recipe.picks.length} mutations on one zombie.
                  </span>
                </li>
              )}
            </ol>
            <p className="mt-2 text-xs text-muted">
              {CROPS_TO_GUARANTEE} of one crop = a guaranteed imprint. Pot takes {recipe.potMinutes}m ({recipe.monolithMinutes}m with the Clay Monolith).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatLine({ label, base, final }: { label: string; base: number; final: number }) {
  const up = final > base + 0.001;
  return (
    <div className="flex items-baseline justify-between border-t border-border/50 py-0.5 text-sm first:border-0">
      <span className="text-muted">{label}</span>
      <span className="tabular">
        {up ? (
          <>
            <span className="text-muted">{base.toFixed(1)}</span> <span className="text-muted">→</span> <span className="font-medium">{final.toFixed(1)}</span>
          </>
        ) : (
          <span>{base.toFixed(1)}</span>
        )}
      </span>
    </div>
  );
}

function MutationPill({ name, stat, crop }: { name: string; stat: string; crop: string }) {
  const m = Object.values(mutationByKey).find((x) => x.name === name);
  const cropObj = m ? cropByKey[m.sources[0]?.cropKey] : undefined;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs">
      {m && <GameIcon file={m.icon} alt="" size="xs" fallback="none" className="!h-5 !w-5" />}
      <span className="font-medium">{name}</span>
      <span className="text-muted">{stat}</span>
      <span className="text-muted/60">·</span>
      {cropObj && <GameIcon file={cropObj.icon} alt="" size="xs" fallback="none" className="!h-4 !w-4" />}
      <span className="text-muted">{crop}</span>
    </span>
  );
}

function obtainText(r: BuildResult): string {
  const z = r.zombie;
  const cost = z.cost ? num(z.cost) : "";
  switch (r.source) {
    case "gold":
      return `Buy from the market${cost ? ` for ${cost} gold` : ""}${z.level > 0 ? ` (unlocks Lv ${z.level})` : ""}.`;
    case "brains":
      return `Buy from the market${cost ? ` for ${cost} brains` : ""}.`;
    case "reward":
      return `Reward-only zombie - earned from quests or events, not sold.`;
    case "hidden":
      return `Not sold in the market - obtained by combining or from a limited event.`;
  }
}
