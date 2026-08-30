import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { ZombieChip } from "../components/entities";
import { PageIcon } from "../components/PageIcon";
import { boosts, boostSlug, boostSlugs, zombieByKey } from "../data";
import { levelLabel } from "../lib/format";
import type { Boost } from "../data/types";

const MECHANICS: Record<string, string> = {
  insta_grow:
    "Ripens one still-growing crop or zombie (there is no zombie filter). Fired from the boost menu with no target, it grabs the first growing plot, so tap the zombie plot first to target it.",
  insta_harvest:
    "Farm-wide: harvests every ripe plot for full harvest XP and gold, rolls Boss Tokens per plot, and sweeps every ripe fruit tree in the same activation.",
  insta_plow: "Farm-wide: re-plows every spent plot, crediting plow XP for each. It replaces the gold cost only.",
  concentration: "Keeps zombies focused in battle, bypassing the focus-bar distractions that stall the release cadence.",
  golden_dice: "Shifts the loot-tier roll toward rarer tiers and multiplies the rare-zombie rate. It does not affect brain drops.",
  invasion_voucher: "Skips a raid's 2-hour cooldown, and nothing else.",
  brain_ticket: "Promotes an invasion to Elite: ×4 brain and rare-zombie luck, at a 10,000-gold cost and harder enemies.",
};

export function BoostsPage() {
  const columns: Column<Boost>[] = [
    {
      key: "name",
      header: "Boost",
      sortable: true,
      value: (b) => b.name,
      render: (b) => (
        <Link to={`/boosts/${boostSlug(b)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={b.icon} alt="" size="sm" fallback="none" />
          {b.name}
        </Link>
      ),
    },
    { key: "cost", header: "Cost", sortable: true, align: "right", value: (b) => b.cost, render: (b) => (b.brainsNeeded ? <Brains value={b.cost} /> : <Gold value={b.cost} />) },
    { key: "per", header: "Per purchase", sortable: true, align: "right", value: (b) => b.perPurchase },
    { key: "level", header: "Unlock", sortable: true, align: "right", value: (b) => b.level, render: (b) => levelLabel(b.level) },
    { key: "scope", header: "Scope", value: (b) => (b.usableOnFarm ? "farm" : "battle"), render: (b) => <Badge>{b.usableOnFarm ? "Farm" : "Battle"}</Badge> },
    { key: "bundle", header: "Raid bundle", align: "right", hint: "quantity one raid drop pays", value: (b) => b.raidBundleQty, render: (b) => `×${b.raidBundleQty}` },
    { key: "info", header: "Effect", value: (b) => b.info, render: (b) => <span className="text-sm text-muted">{b.info}</span> },
  ];

  return (
    <div>
      <PageHeader title="Boosts" icon={<PageIcon to="/boosts" />} kicker={`${boosts.length} boosts`}>
        <p>Consumables bought with brains or gold and used on the farm or in battle. Insta-Grow is the only one that drops from raids in a bundle of ten.</p>
      </PageHeader>
      <DataTable rows={boosts} columns={columns} rowKey={(b) => b.key} initialSort={{ key: "level", dir: "asc" }} />
      <Note>Golden Dice affect the loot-tier roll and the rare-zombie rate, not the brain drop. Brain luck comes only from the Elite (Brain Ticket) multiplier.</Note>
    </div>
  );
}

export function BoostDetail() {
  const { slug } = useParams();
  const b = slug ? boostSlugs.bySlug[slug] : undefined;
  if (!b) return <Note tone="warn">Boost not found.</Note>;
  const gift = b.giftZombieKey ? zombieByKey[b.giftZombieKey] : null;

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Boosts", to: "/boosts" }, { label: b.name }]} />
      <PageHeader title={b.name} icon={<GameIcon file={b.icon} alt={b.name} size="xl" fallback="none" />} kicker="Boost" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
          <KeyRow label="Cost">{b.brainsNeeded ? <Brains value={b.cost} /> : <Gold value={b.cost} />}</KeyRow>
          <KeyRow label="Per purchase">{b.perPurchase}</KeyRow>
          <KeyRow label="Unlock level">{levelLabel(b.level)}</KeyRow>
          <KeyRow label="Scope">{b.usableOnFarm ? "Farm" : "Battle"}</KeyRow>
          <KeyRow label="Effect type">{b.effect}</KeyRow>
          <KeyRow label="Raid bundle">×{b.raidBundleQty}</KeyRow>
          {gift && (
            <div className="mt-2 text-right text-xs">
              Gifts <ZombieChip k={gift.key} />
            </div>
          )}
        </Panel>
        <div>
          <Section title="What it does">
            <Panel>
              <p className="text-sm">{b.info}</p>
              <p className="mt-2 text-sm text-muted">{MECHANICS[b.key] ?? b.flavorText}</p>
            </Panel>
          </Section>
        </div>
      </div>
    </div>
  );
}
