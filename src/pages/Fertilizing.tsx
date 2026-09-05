import { Link } from "react-router-dom";
import { PageHeader, Breadcrumbs, Section } from "../components/ui/layout";
import { GameIcon } from "../components/ui/GameIcon";
import { ZombieIcon } from "../components/ui/ZombieIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { zombies, zombieSlug } from "../data";
import { pct } from "../lib/format";

/** Every zombie that can fertilize, best rate first. */
const GARDEN_ZOMBIES = zombies
  .filter((z) => z.fertilizeChance !== null)
  .sort((a, b) => (b.fertilizeChance ?? 0) - (a.fertilizeChance ?? 0) || a.level - b.level);

/** The distinct rates in play, for the stacking matrix columns. */
const RATES = [...new Set(GARDEN_ZOMBIES.map((z) => z.fertilizeChance as number))].sort((a, b) => a - b);

/** Deployed-copy counts used for the "at least one hit" stacking table. */
const STACK_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10];

export function FertilizingPage() {
  return (
    <div>
      <Breadcrumbs trail={[{ label: "Zombies", to: "/zombies" }, { label: "Fertilizing" }]} />
      <PageHeader
        title="Fertilizing"
        icon={
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface-2">
            <GameIcon file="leafPile.png" alt="" size="lg" fallback="none" />
          </span>
        }
      >
        <p>
          Garden zombies can fertilize a crop as you plant it, doubling what it sells for. Nothing else in the game
          changes the odds: the rate is fixed by the zombie's combat tier.
        </p>
      </PageHeader>

      <Section title="How it works">
        <div className="prose-tight max-w-3xl space-y-3 text-sm">
          <p>
            Every time you plant a veggie crop, each Garden zombie deployed on your farm rolls its own chance in turn.
            The first success wins, that crop is flagged for a double harvest, and the zombie that did it walks over and
            drops leaves on the plot until you harvest.
          </p>
          <p>
            Only zombies actually out on the farm roll. Anything in storage or the Mausoleum is ignored, so a Garden
            zombie you own but haven't deployed does nothing for you.
          </p>
          <p>
            The roll happens once, at the moment of planting. Deploying a Garden zombie while a crop is already growing
            can't fertilize it, and an already-fertilized plot won't roll again.
          </p>
          <p>
            Zombie crops are never fertilized, since they sell for nothing. Veggie crops only.
          </p>
          <p>
            Level, veterancy and mutations have no effect. A level 25 Master Garden Zombie fertilizes at exactly the
            same 4% as the one you just grew.
          </p>
        </div>
        <div className="mt-2">
          <SourceCite file="src/zombie/ZombieField.ts" line={189} label="tryFertilize" />
        </div>
      </Section>

      <Section title="Rates">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zombie</th>
                <th className="text-right">Tier</th>
                <th className="text-right">Unlock</th>
                <th className="text-right">Chance</th>
              </tr>
            </thead>
            <tbody>
              {GARDEN_ZOMBIES.map((z) => (
                <tr key={z.key}>
                  <td>
                    <Link
                      to={`/zombies/${zombieSlug(z)}`}
                      className="inline-flex items-center gap-3 font-medium !text-text hover:!text-primary-strong"
                    >
                      <ZombieIcon zombie={z} size="xl" />
                      {z.name}
                    </Link>
                  </td>
                  <td className="text-right tabular">{z.tier}</td>
                  <td className="text-right tabular text-muted">Lv {z.level}</td>
                  <td className="text-right tabular font-medium">{pct(z.fertilizeChance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Tiers 3 and 4 share the same {pct(0.08)} rate, so a Zombee fertilizes no better than a Flower Zombie despite
          costing more and unlocking later.{" "}
          <SourceCite file="src/zombie/ZombieField.ts" line={34} label="FERTILIZE_BY_TIER" />
        </p>
      </Section>

      <Section title="Deploying several">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-right">Deployed</th>
                {RATES.map((r) => (
                  <th key={r} className="text-right">
                    {pct(r)} each
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STACK_COUNTS.map((n) => (
                <tr key={n}>
                  <td className="text-right tabular font-medium">{n}</td>
                  {RATES.map((r) => (
                    <td key={r} className="text-right tabular">
                      {pct(1 - (1 - r) ** n)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Rolls are independent, so n zombies at the same rate give{" "}
          <span className="font-mono">1 − (1 − p)ⁿ</span>. A mixed line-up is{" "}
          <span className="font-mono">1 − Π(1 − pᵢ)</span> across everyone deployed. Ten Zombutterflies still miss
          about {pct((1 - 0.12) ** 10)} of your plantings.
        </p>
      </Section>
    </div>
  );
}
