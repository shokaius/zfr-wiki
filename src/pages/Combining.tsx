import { PageHeader, Section, Panel, Note, KeyRow } from "../components/ui/layout";
import { Badge } from "../components/ui/Badge";
import { SourceCite } from "../components/ui/SourceCite";
import { ZombieChip } from "../components/entities";
import { PageIcon } from "../components/PageIcon";
import { combat, zombieByKey } from "../data";
import { duration } from "../lib/format";

export function CombiningPage() {
  const cm = combat.combine;
  const ladder = [
    { from: "Green", to: "Blue", map: cm.blueByGroup },
    { from: "Blue", to: "Red", map: cm.redByGroup },
  ];

  return (
    <div>
      <PageHeader title="Combining · Zombie Pot" icon={<PageIcon to="/combining" />} kicker="deterministic mutation stacking">
        <p>
          The Zombie Pot merges two zombies with no RNG on the mutation mask. Slot 1 decides the species; both parents' mutations union
          per slot, and a same-slot conflict takes the higher catalog bit (always the higher-tier mutation).
        </p>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Pot rules</h2>
          <KeyRow label="Combine time">{duration(cm.potDurationMs)}</KeyRow>
          <KeyRow label="With Clay Monolith">{duration(cm.potDurationMs * cm.monolithMult)}</KeyRow>
          <KeyRow label="Max pots">{cm.maxPots}</KeyRow>
          <KeyRow label="Special promotion at">Lv {cm.specialLevel}+</KeyRow>
          <KeyRow label="Special roll">{Math.round(cm.specialChance * 100)}%</KeyRow>
        </Panel>

        <div>
          <Section title="What merges — and what doesn't">
            <div className="grid gap-3 md:grid-cols-2">
              <Panel>
                <div className="mb-1 text-sm font-medium text-primary-strong">Inherited</div>
                <ul className="prose-tight list-disc space-y-1 pl-4 text-sm">
                  <li>Mutation mask — unioned per slot, higher bit wins conflicts</li>
                  <li>Species — from slot 1 (your choice, unlike the original binary)</li>
                  <li>Colour — average of parents, or a 35% lightening if they match</li>
                </ul>
              </Panel>
              <Panel>
                <div className="mb-1 text-sm font-medium text-danger">NOT inherited</div>
                <ul className="prose-tight list-disc space-y-1 pl-4 text-sm">
                  <li><strong>Stats</strong> — the child is a fresh zombie of the chosen species; you can't breed stronger parents into a stronger child</li>
                  <li><strong>Veterancy</strong> — resets to Newbie, so combine <em>before</em> ranking up</li>
                </ul>
              </Panel>
            </div>
          </Section>

          <Section title="Colour-class ladder">
            <p className="mb-2 text-sm text-muted">A matched pair of the same species climbs the colour ladder, each step gated on owning that grave. There is no Red→Silver combine — the Silver Grave is the only route.</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Per-group tier-up result</th>
                  </tr>
                </thead>
                <tbody>
                  {ladder.map((l) => (
                    <tr key={l.from}>
                      <td><Badge>{l.from}</Badge></td>
                      <td><Badge>{l.to}</Badge></td>
                      <td className="text-xs text-muted">{Object.keys(l.map).length} group results</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Tier-5 Special promotion">
            <p className="mb-2 text-sm text-muted">
              At level {cm.specialLevel}+, an eligible same-group pair has a {Math.round(cm.specialChance * 100)}% roll to promote to
              its group's Special. Because <span className="font-mono">createCombineRandom</span> is seeded by the sorted parent IDs, the
              outcome is fixed by which pair you pick and <span className="font-mono">previewCombine</span> shows it — so it's a prize to
              fish for, not a risk to dodge.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(cm.specialByGroup).map(([group, key]) => {
                const z = zombieByKey[key];
                return (
                  <span key={group} className="inline-flex items-center gap-1 text-sm">
                    <span className="text-muted">{group}:</span>
                    {z ? <ZombieChip k={key} /> : <span className="chip">{key}</span>}
                  </span>
                );
              })}
            </div>
          </Section>

          <Note>
            Special + Special can't combine, and a Special is rejected in slot 2 outright — so always put a rare/Special parent in slot 1.
            <div className="mt-1"><SourceCite file="src/zombie/combineSpecies.ts" label="combineSpecies.ts" /> · <SourceCite file="src/zombie/ZombiePot.ts" label="ZombiePot.ts" /></div>
          </Note>
        </div>
      </div>
    </div>
  );
}
