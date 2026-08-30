import { PageHeader, Section, Panel, Note } from "../components/ui/layout";
import { SourceCite } from "../components/ui/SourceCite";
import { combat } from "../data";
import { titleCase } from "../lib/format";

export function CombatPage() {
  const c = combat;
  return (
    <div>
      <PageHeader title="Combat" kicker="formulas & mechanics">
        <p>
          Everything that turns a zombie's card into battle output. The live fight is resolved by <span className="font-mono">BattleSim</span>{" "}
          (the authority); <span className="font-mono">CombatEngine</span> is a deterministic dev/test resolver.
        </p>
      </PageHeader>

      <Section title="Core formulas">
        <div className="grid gap-3 md:grid-cols-2">
          <Panel>
            <ul className="space-y-2 text-sm">
              <li><span className="font-mono">power = str × {c.powerPerStr}</span> - damage per hit</li>
              <li><span className="font-mono">hitPoints = con × {c.hpPerCon}</span></li>
              <li><span className="font-mono">attackInterval = {c.attackIntervalSec.player} ⁄ dex</span> (players); enemies use {c.attackIntervalSec.enemy}s flat</li>
              <li><span className="font-mono">DPS = str × {c.powerPerStr} × dex ⁄ {c.attackIntervalSec.player}</span></li>
              <li>Veterancy multiplier: <span className="font-mono">1 + {c.vetStatStep} × rank</span> on all stats (max ×{(1 + c.vetStatStep * (c.vetThresholds.length - 1)).toFixed(2)} at {c.vetRanks[c.vetRanks.length - 1]})</li>
              <li>Mutations are added <em>flat</em>, after level scaling - never multiplied.</li>
            </ul>
            <div className="mt-2"><SourceCite file="src/raid/combatStats.ts" label="combatStats.ts" /></div>
          </Panel>
          <Panel>
            <div className="mb-1 text-sm font-medium">Stats</div>
            <table className="w-full text-sm">
              <tbody>
                {c.stats.map((s) => (
                  <tr key={s.key} className="border-b border-border/50 last:border-0">
                    <td className="py-1 pr-2 font-medium">{s.label}</td>
                    <td className="py-1 text-muted">{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </Section>

      <Section title="Level scaling">
        <p className="mb-2 text-sm text-muted">
          Below level {c.levelScaleStartLevel} every zombie fights at its group floor. Stats interpolate from that floor up to the card
          stats by level {c.levelScaleEndLevel}, then stop. A card stat below the floor means the zombie <em>decays</em> as you level.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group</th>
                <th className="text-right">STR floor</th>
                <th className="text-right">CON floor</th>
                <th className="text-right">DEX floor</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(c.levelScaleEndpoints).map(([g, f]) => (
                <tr key={g}>
                  <td className="font-medium">{g}</td>
                  <td className="text-right tabular">{f.str}</td>
                  <td className="text-right tabular">{f.con}</td>
                  <td className="text-right tabular">{f.dex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Lineup depth bands">
        <p className="mb-2 text-sm text-muted">
          Applied to player zombies only (enemies never pass through them). Zombies past the front five swing softer and slower - so
          slots 0–4 are your damage, and deeper slots are pure HP soak.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lineup slot</th>
                <th className="text-right">Damage ×</th>
                <th className="text-right">Interval ×</th>
                <th className="text-right">Effective DPS</th>
              </tr>
            </thead>
            <tbody>
              {c.lineupDamageBands.map((dmg, i) => {
                const spd = c.lineupSpeedBands[i];
                const eff = (dmg / spd) * 100;
                return (
                  <tr key={i}>
                    <td>{i * 5}–{i * 5 + 4}</td>
                    <td className="text-right tabular">{dmg.toFixed(2)}</td>
                    <td className="text-right tabular">{spd.toFixed(3)}</td>
                    <td className="text-right tabular">{eff.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-1"><SourceCite file="src/raid/combatStats.ts" label="LINEUP_DAMAGE_BANDS / LINEUP_SPEED_BANDS" /></div>
      </Section>

      <Section title="Veterancy">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th className="text-right">Survived invasions</th>
                <th className="text-right">All-stat ×</th>
              </tr>
            </thead>
            <tbody>
              {c.vetRanks.map((name, i) => (
                <tr key={name}>
                  <td className="font-medium">{name}</td>
                  <td className="text-right tabular">{c.vetThresholds[i]}</td>
                  <td className="text-right tabular">{(1 + c.vetStatStep * c.vetThresholds[i]).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Battle model (BattleSim)">
        <Note>
          Zombies mill on the left; one at a time the front zombie charges a focus bar, is released, advances, and fights the first
          living enemy. The boss perches top-right lobbing ballistics until minions clear, preferring Garden zombies as throw targets.
          Focus-bar distractions stall the release cadence (Concentration bypasses them). Because it's deterministic, a zero-casualty
          clear repeats exactly.
        </Note>
      </Section>
    </div>
  );
}
