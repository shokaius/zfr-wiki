import { PageHeader, Section, Panel, Note, KeyRow } from "../components/ui/layout";
import { SourceCite } from "../components/ui/SourceCite";
import { economy } from "../data";
import { num } from "../lib/format";

export function EconomyPage() {
  const e = economy;
  return (
    <div>
      <PageHeader title="Economy" kicker="XP · gold · brains">
        <p>
          XP is the only clock — raids farm gold, brains, boosts, and zombies, but never XP after a first clear. Gold and brains become
          renewable early; XP gates crop and grave unlocks all the way up.
        </p>
      </PageHeader>

      <Section title="XP thresholds">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-right">Level</th>
                <th className="text-right">Cumulative XP</th>
                <th className="text-right">XP from previous</th>
              </tr>
            </thead>
            <tbody>
              {e.xpThresholds.map((t) => (
                <tr key={t.level}>
                  <td className="text-right tabular font-medium">{t.level}</td>
                  <td className="text-right tabular">{num(t.cumulativeXp)}</td>
                  <td className="text-right tabular text-muted">{t.level === 1 ? "—" : num(t.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1"><SourceCite file="src/GameState.ts" label="XP_THRESHOLDS" /> · max level {e.maxLevel}</div>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Gold: sources & sinks">
          <Panel>
            <div className="mb-2 text-sm font-medium text-primary-strong">Sources</div>
            <ul className="prose-tight list-disc space-y-1 pl-4 text-sm text-muted">
              <li>Crop sales & tree harvests</li>
              <li>Raid win gold + loot (see Raids)</li>
              <li>Decoration sell-back at {Math.round(e.sellBackRatio * 100)}% of cost</li>
            </ul>
            <div className="mb-2 mt-3 text-sm font-medium text-danger">Sinks</div>
            <ul className="prose-tight list-disc space-y-1 pl-4 text-sm text-muted">
              <li>Seed cost + {num(e.plowCost)}-gold plow every crop cycle</li>
              <li>Market items, farm upgrades, vouchers ({num(2000)}g), Brain Tickets ({num(10000)}g)</li>
            </ul>
          </Panel>
        </Section>

        <Section title="Brains: sources & sinks">
          <Panel>
            <div className="mb-2 text-sm font-medium text-primary-strong">Sources</div>
            <ul className="prose-tight list-disc space-y-1 pl-4 text-sm text-muted">
              <li>Raid boss drops (with an 8-dry-win pity floor) + first-clear guarantees</li>
              <li>Epic-boss rungs & epic quests, social gifts</li>
            </ul>
            <div className="mb-2 mt-3 text-sm font-medium text-danger">Sinks</div>
            <ul className="prose-tight list-disc space-y-1 pl-4 text-sm text-muted">
              <li>Graves, monoliths, boosts, market zombies, epic entry, revive</li>
              <li>Level-ups grant <strong>none</strong> (post-brainflation revert)</li>
            </ul>
          </Panel>
        </Section>
      </div>

      <Section title="Plowing & the Plowing Monolith">
        <Panel>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KeyRow label="Plow XP (normal)">{e.plowXpNormal}</KeyRow>
            <KeyRow label="Plow XP (monolith)">{e.plowXpMonolith}</KeyRow>
            <KeyRow label="Harvest XP bonus (monolith)">+{e.harvestXpBonusMonolith}</KeyRow>
            <KeyRow label="Plow cost">{num(e.plowCost)} gold</KeyRow>
          </div>
          <p className="mt-2 text-sm text-muted">
            The Plowing Monolith moves the 1 plow XP onto every harvest and zeroes the {num(e.plowCost)}-gold plow cost. Because you
            re-plow every cycle, a crop cycle pays the same XP either way — the monolith's real effect is +{num(e.plowCost)} gold per
            cycle. <SourceCite file="src/farmRewards.ts" label="farmRewards.ts" />
          </p>
        </Panel>
      </Section>

      <Section title="Resource conversion (buy-XP)">
        <Panel>
          <p className="mb-2 text-sm text-muted">Buying and re-selling decor converts gold → XP. These are the game's authored rates — a neutral exchange table, not a recommendation.</p>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KeyRow label="Decor gold per XP">{num(e.buyXpRates.decorGoldPerXp, { digits: 1 })}</KeyRow>
            <KeyRow label="Functional gold per XP">{num(e.buyXpRates.functionalGoldPerXp, { digits: 1 })}</KeyRow>
            <KeyRow label="Brain → XP (decor)">{num(e.buyXpRates.brainDecorXpPerBrain)} XP</KeyRow>
            <KeyRow label="Brain → XP (functional)">{num(e.buyXpRates.brainFunctionalXpPerBrain)} XP</KeyRow>
            <KeyRow label="Brain → gold rate">{num(e.brainSellGoldRate)}</KeyRow>
          </div>
          <div className="mt-1"><SourceCite file="src/economy.ts" label="buyXp / ECONOMY" /></div>
        </Panel>
      </Section>

      <Note tone="muted">Per-hour and per-tap throughput (carrot XP/hour, etc.) are deliberately out of scope — this reference sticks to static values and expected values.</Note>
    </div>
  );
}
