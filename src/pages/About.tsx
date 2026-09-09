import { PageHeader, Section, Panel, Note, KeyRow } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { GAME } from "../lib/gameMeta";

const REGISTRY: { domain: string; file: string }[] = [
  { domain: "Crops", file: "public/assets/plants.json" },
  { domain: "Zombies", file: "public/assets/zombies.json" },
  { domain: "Placeables", file: "public/assets/placeables.json" },
  { domain: "Boosts", file: "public/assets/boosts.json" },
  { domain: "Quests", file: "public/assets/quests.json" },
  { domain: "Farm & climate upgrades", file: "public/assets/upgrades.json" },
  { domain: "Raids, stages, loot", file: "public/assets/raids/raids.json" },
  { domain: "Enemy stats", file: "public/assets/raids/enemy_stats.json" },
  { domain: "Drop tables", file: "public/assets/raids/drops.json" },
  { domain: "Epic bosses", file: "public/assets/epic-bosses/*/catalog.json" },
  { domain: "Mutation catalog + bits", file: "src/zombie/mutations.ts" },
  { domain: "Adjacency + chance", file: "src/zombie/cropMutations.ts" },
  { domain: "Veterancy, group abilities", file: "src/zombie/traits.ts" },
  { domain: "Ability combat effects", file: "src/zombie/abilities.ts" },
  { domain: "Combine rules", file: "src/zombie/combineSpecies.ts" },
  { domain: "Class tiers", file: "src/zombie/taxonomy.ts" },
  { domain: "Combat formulas, scaling, lineup bands", file: "src/raid/combatStats.ts" },
  { domain: "Loot tier brackets", file: "src/raid/LootTable.ts" },
  { domain: "Brain drops + pity", file: "src/raid/brainDrops.ts" },
  { domain: "Rare zombie drops + pity", file: "src/raid/zombieDrops.ts" },
  { domain: "Win gold, min army, cooldown", file: "src/raid/RaidCatalog.ts" },
  { domain: "Elite invasions", file: "src/raid/eliteInvasion.ts" },
  { domain: "Decor sell values", file: "src/awardSellValue.ts" },
  { domain: "Seasonal decor gating", file: "src/decorThemes.ts" },
  { domain: "Buy-XP, sell-back ratio", file: "src/economy.ts" },
  { domain: "Plow / harvest XP", file: "src/farmRewards.ts" },
  { domain: "XP thresholds", file: "src/GameState.ts" },
  { domain: "Epic boss tokens & rewards", file: "src/epicBoss/*.ts" },
];

export function AboutPage() {
  return (
    <div>
      <PageHeader title="Sources & about" icon={<PageIcon to="/about" />} kicker="how this wiki is built">
        <p>Every page is generated from the Zombie Farm 2 Reforged repo.</p>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Build</h2>
            <KeyRow label="Game commit"><span className="font-mono">{GAME.gameCommitShort}</span></KeyRow>
            <KeyRow label="Commit date">{GAME.gameCommitDate?.slice(0, 10)}</KeyRow>
            <KeyRow label="Generated">{GAME.builtAt.slice(0, 16).replace("T", " ")}</KeyRow>
            {Object.entries(GAME.counts).map(([k, v]) => (
              <KeyRow key={k} label={k}>{v}</KeyRow>
            ))}
          </Panel>
        </div>

        <div>
          <Section title="Source-of-truth registry">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {REGISTRY.map((r) => (
                    <tr key={r.file}>
                      <td className="font-medium">{r.domain}</td>
                      <td>
                        {r.file.includes("*") ? (
                          <span className="font-mono text-xs text-muted">{r.file}</span>
                        ) : (
                          <SourceCite file={r.file} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Provenance">
            <Note>
              Zombie Farm 2 was a mobile game by The Playforge (pulled from the App Store in 2017). ZF2R is a non-commercial preservation
              reimplementation - art, audio, and formulas recovered from the shipped iOS binary. The underlying IP belongs to The
              Playforge; this wiki is a fan reference over that project.
            </Note>
          </Section>
        </div>
      </div>
    </div>
  );
}
