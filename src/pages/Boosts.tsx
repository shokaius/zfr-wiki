import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { PageHeader, Section, Note } from "../components/ui/layout";
import { boosts } from "../data";
import type { Boost } from "../data/types";

const MECHANICS: Record<string, string> = {
  insta_grow: "Ripens one still-growing crop or zombie (no isZombie filter). Fired from the boost menu with no target, it grabs the first growing plot — usually a carrot — so tap the zombie plot first.",
  insta_harvest: "Farm-wide: harvests every ripe plot for full harvest XP + gold, rolls Boss Tokens per plot, and sweeps ripe fruit trees.",
  insta_plow: "Farm-wide: re-plows every spent plot, crediting plow XP × plots. Replaces only the gold cost.",
  concentration: "Keeps zombies focused in battle, bypassing the focus-bar distractions that stall the release cadence.",
  golden_dice: "Shifts the loot-tier roll rarer (bad on tier-2 bundle raids) and multiplies the rare-zombie rate. Does NOT affect brains.",
  invasion_voucher: "Skips a raid's 2-hour cooldown. Nothing else.",
  brain_ticket: "Promotes an invasion to Elite: ×4 brain and rare-zombie luck, at a 10,000-gold cost and much harder enemies.",
};

export function BoostsPage() {
  const columns: Column<Boost>[] = [
    {
      key: "name",
      header: "Boost",
      sortable: true,
      value: (b) => b.name,
      render: (b) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <GameIcon file={b.icon} alt="" size="sm" fallback="none" />
          {b.name}
        </span>
      ),
    },
    { key: "cost", header: "Cost", sortable: true, align: "right", value: (b) => b.cost, render: (b) => (b.brainsNeeded ? <Brains value={b.cost} /> : <Gold value={b.cost} />) },
    { key: "per", header: "Per purchase", sortable: true, align: "right", value: (b) => b.perPurchase },
    { key: "level", header: "Unlock", sortable: true, align: "right", value: (b) => b.level, render: (b) => `Lv ${b.level}` },
    { key: "scope", header: "Scope", value: (b) => (b.usableOnFarm ? "farm" : "battle"), render: (b) => <Badge>{b.usableOnFarm ? "Farm" : "Battle"}</Badge> },
    { key: "bundle", header: "Raid bundle", align: "right", hint: "quantity one raid drop pays", value: (b) => b.raidBundleQty, render: (b) => `×${b.raidBundleQty}` },
    { key: "info", header: "Effect", value: (b) => b.info, render: (b) => <span className="text-sm text-muted">{b.info}</span> },
  ];

  return (
    <div>
      <PageHeader title="Boosts" kicker={`${boosts.length} boosts`}>
        <p>Consumables bought with brains (or gold), used on the farm or mid-battle. Insta-Grow is the only one that drops from raids in a bundle (×10).</p>
      </PageHeader>
      <DataTable rows={boosts} columns={columns} rowKey={(b) => b.key} initialSort={{ key: "level", dir: "asc" }} />

      <Section title="Mechanics notes">
        <div className="grid gap-3 md:grid-cols-2">
          {boosts.map((b) => (
            <div key={b.key} className="card p-3">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <GameIcon file={b.icon} alt="" size="sm" fallback="none" />
                {b.name}
              </div>
              <p className="text-sm text-muted">{MECHANICS[b.key] ?? b.flavorText}</p>
            </div>
          ))}
        </div>
      </Section>
      <Note>Golden Dice affect the loot-tier roll and the rare-zombie rate, but never the brain drop — brain luck is the Elite (Brain Ticket) multiplier only.</Note>
    </div>
  );
}
