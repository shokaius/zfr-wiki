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
        <p>Garden zombies can fertilize a crop as you plant it, doubling what it sells for.</p>
      </PageHeader>

      <Section title="How it works">
        <p className="max-w-3xl text-sm leading-relaxed text-text">
          Every time you plant a veggie crop, each Garden zombie deployed on your farm has a chance to fertilize the
          crop. This chance is determined by the tier of the zombie. Zombie crops cannot be fertilized. Zombies in the
          mausoleum cannot fertilize crops.
        </p>
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
        <div className="mt-2">
          <SourceCite file="src/zombie/ZombieField.ts" line={34} label="FERTILIZE_BY_TIER" />
        </div>
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
      </Section>
    </div>
  );
}
