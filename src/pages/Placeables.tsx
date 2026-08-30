import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains, Xp } from "../components/ui/Currency";
import { Badge, SeasonalBadge, UnavailableBadge } from "../components/ui/Badge";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { placeables, placeableSlug, placeableSlugs, economy } from "../data";
import { PageIcon } from "../components/PageIcon";
import { num, duration, titleCase, levelLabel } from "../lib/format";
import type { Placeable } from "../data/types";

const CATS = ["functional", "tree", "decor", "reward"];

function PriceCell({ p }: { p: Placeable }) {
  return p.brainsNeeded ? <Brains value={p.cost} /> : <Gold value={p.cost} />;
}

export function PlaceablesIndex() {
  const columns: Column<Placeable>[] = [
    {
      key: "name",
      header: "Placeable",
      sortable: true,
      value: (p) => p.name,
      render: (p) => (
        <Link to={`/placeables/${placeableSlug(p)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={p.sprite} alt="" size="sm" fallback="none" />
          {p.name}
          {!p.available && <UnavailableBadge reason={p.themeLabel ? `Seasonal — ${p.themeLabel}` : undefined} />}
        </Link>
      ),
    },
    { key: "category", header: "Type", sortable: true, value: (p) => p.category, render: (p) => <Badge>{titleCase(p.category)}</Badge> },
    { key: "level", header: "Unlock", sortable: true, align: "right", value: (p) => p.level, render: (p) => levelLabel(p.level) },
    { key: "cost", header: "Cost", sortable: true, align: "right", value: (p) => p.cost, render: (p) => <PriceCell p={p} /> },
    { key: "xp", header: "XP", sortable: true, align: "right", value: (p) => p.xp, render: (p) => <Xp value={p.xp} /> },
    { key: "sell", header: "Sell", sortable: true, align: "right", value: (p) => p.sellValue, render: (p) => <Gold value={p.sellValue} /> },
    { key: "tiles", header: "Tiles", align: "right", value: (p) => p.tileW * p.tileH, render: (p) => `${p.tileW}×${p.tileH}` },
    {
      key: "effect",
      header: "Effect / yield",
      value: (p) => p.effect ?? "",
      render: (p) =>
        p.effect ? <span className="text-sm">{p.effect}</span> : p.growMs ? <span className="text-sm text-muted">regrow {duration(p.growMs)}</span> : <span className="text-muted">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Placeables" icon={<PageIcon to="/placeables" />} kicker={`${placeables.length} objects`}>
        <p>
          Decor, functional buildings (monoliths, graves, the pot, storage), and fruit trees. Seasonal items are gated behind the{" "}
          <span className="font-mono">ACTIVE_THEMES</span> list (currently only <em>evergreen</em>); unavailable items sort to the bottom.
        </p>
      </PageHeader>
      <DataTable
        rows={[...placeables].sort((a, b) => Number(b.available) - Number(a.available) || a.level - b.level)}
        columns={columns}
        rowKey={(p) => p.key}
        search={(p) => `${p.name} ${p.category} ${p.effect ?? ""}`}
        searchPlaceholder="Search placeables…"
        selects={[{ key: "cat", label: "Type", options: CATS.map((c) => ({ label: titleCase(c), value: c })), get: (p) => p.category }]}
        toggles={[
          { key: "avail", label: "Buyable now", predicate: (p) => p.available },
          { key: "brains", label: "Brains only", predicate: (p) => p.brainsNeeded },
          { key: "fn", label: "Functional", predicate: (p) => p.category === "functional" || p.armyMax > 0 || p.zombieSlots > 0 || p.storageSlots > 0 },
        ]}
      />
    </div>
  );
}

export function PlaceableDetail() {
  const { slug } = useParams();
  const p = slug ? placeableSlugs.bySlug[slug] : undefined;
  if (!p) return <Note tone="warn">Placeable not found.</Note>;
  const goldPerXp = p.xp > 0 ? (p.cost - p.sellValue) / p.xp : null;

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Placeables", to: "/placeables" }, { label: p.name }]} />
      <PageHeader
        title={p.name}
        icon={<GameIcon file={p.sprite} alt={p.name} size="xl" fallback="none" />}
        kicker={
          <span className="flex items-center gap-2">
            <Badge>{titleCase(p.category)}</Badge>
            {p.seasonal && <SeasonalBadge theme={p.theme ?? "seasonal"} />}
            {!p.available && <UnavailableBadge />}
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
          <KeyRow label="Unlock level">{levelLabel(p.level)}</KeyRow>
          <KeyRow label="Cost"><PriceCell p={p} /></KeyRow>
          <KeyRow label="XP on purchase"><Xp value={p.xp} /></KeyRow>
          <KeyRow label="Sell value"><Gold value={p.sellValue} /></KeyRow>
          <KeyRow label="Footprint">{p.tileW}×{p.tileH} tiles</KeyRow>
          {p.armyMax > 0 && <KeyRow label="Army cap">+{p.armyMax}</KeyRow>}
          {p.zombieSlots > 0 && <KeyRow label="Zombie storage">+{p.zombieSlots}</KeyRow>}
          {p.storageSlots > 0 && <KeyRow label="Item storage">+{p.storageSlots}</KeyRow>}
          {p.growMs > 0 && <KeyRow label="Regrow">{duration(p.growMs)}</KeyRow>}
          {p.harvestValue > 0 && <KeyRow label="Harvest"><Gold value={p.harvestValue} /></KeyRow>}
          <KeyRow label="Buyable now">{p.available ? "Yes" : `No${p.themeLabel ? ` — ${p.themeLabel}` : ""}`}</KeyRow>
        </Panel>
        <div>
          {p.effect && (
            <Section title="Effect">
              <Panel>{p.effect}</Panel>
            </Section>
          )}
          {!p.brainsNeeded && p.xp > 0 && goldPerXp != null && (
            <Section title="XP conversion">
              <Panel>
                <p className="text-sm">
                  Buying and re-selling this item nets{" "}
                  <span className="tabular font-semibold">{num(goldPerXp, { digits: 1 })}</span> gold per XP (cost {num(p.cost)} − sell{" "}
                  {num(p.sellValue)}, ÷ {p.xp} XP). The sell-back ratio is{" "}
                  <span className="font-mono">{Math.round(economy.sellBackRatio * 100)}%</span> for market items.
                </p>
              </Panel>
            </Section>
          )}
          {p.variantOf && (
            <Note>This is a recolor / variant of <span className="font-mono">{p.variantOf}</span>.</Note>
          )}
        </div>
      </div>
    </div>
  );
}
