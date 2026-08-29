import { Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { PageHeader, Section, Note } from "../components/ui/layout";
import { crops, cropSlug, zombies, zombieSlug, raids, raidSlug, placeables, placeableSlug, epicBosses, epicBossSlug, upgrades } from "../data";

interface Unlock {
  id: string;
  level: number;
  type: string;
  name: string;
  to: string;
  icon: string | null;
  fallback: "zombie" | "none";
  detail: string;
}

function buildUnlocks(): Unlock[] {
  const out: Unlock[] = [];
  for (const c of crops) out.push({ id: `crop-${c.key}`, level: c.level, type: "Crop", name: c.name, to: `/crops/${cropSlug(c)}`, icon: c.icon, fallback: "none", detail: c.mutation ? `grants ${c.mutation.name}` : `${c.sell}g sell` });
  for (const z of zombies) if (z.level >= 1 && !z.marketHidden) out.push({ id: `z-${z.key}`, level: z.level, type: "Zombie", name: z.name, to: `/zombies/${zombieSlug(z)}`, icon: z.specialSprite, fallback: "zombie", detail: `${z.className} · ${z.dps} DPS` });
  for (const r of raids) out.push({ id: `raid-${r.id}`, level: r.unlockLevel, type: "Raid", name: r.name, to: `/raids/${raidSlug(r)}`, icon: r.enemyIcon, fallback: "none", detail: `${r.winGoldFull}g / win` });
  for (const p of placeables) if ((p.category === "functional" || p.category === "tree") && p.level >= 1) out.push({ id: `p-${p.key}`, level: p.level, type: "Placeable", name: p.name, to: `/placeables/${placeableSlug(p)}`, icon: p.sprite, fallback: "none", detail: p.effect ?? p.category });
  for (const b of epicBosses) if (b.unlockLevel) out.push({ id: `eb-${b.id}`, level: b.unlockLevel, type: "Epic Boss", name: b.name, to: `/epic-bosses/${epicBossSlug(b)}`, icon: b.questIcon, fallback: "none", detail: `${b.costBrains} brains entry` });
  for (const u of upgrades.mapSize) out.push({ id: `farm-${u.size}`, level: u.level, type: "Farm size", name: u.name, to: "/progression", icon: null, fallback: "none", detail: u.info });
  return out.sort((a, b) => a.level - b.level);
}

export function ProgressionPage() {
  const unlocks = buildUnlocks();
  const types = [...new Set(unlocks.map((u) => u.type))];

  const columns: Column<Unlock>[] = [
    { key: "level", header: "Level", sortable: true, align: "right", value: (u) => u.level, render: (u) => <span className="font-semibold tabular">Lv {u.level}</span> },
    { key: "type", header: "Type", sortable: true, value: (u) => u.type, render: (u) => <Badge>{u.type}</Badge> },
    {
      key: "name",
      header: "Unlocks",
      sortable: true,
      value: (u) => u.name,
      render: (u) =>
        u.to === "/progression" ? (
          <span className="inline-flex items-center gap-2 font-medium">{u.name}</span>
        ) : (
          <Link to={u.to} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
            <GameIcon file={u.icon} alt="" size="sm" fallback={u.fallback} />
            {u.name}
          </Link>
        ),
    },
    { key: "detail", header: "Detail", value: (u) => u.detail, render: (u) => <span className="text-sm text-muted">{u.detail}</span> },
  ];

  return (
    <div>
      <PageHeader title="Progression" kicker="what opens at each level">
        <p>Everything gated by level, in one sortable list. This is the "what should I be doing at level N" view — sort by level, filter by type. No opinions, just what unlocks.</p>
      </PageHeader>

      <Section title="Unlock timeline">
        <DataTable
          rows={unlocks}
          columns={columns}
          rowKey={(u) => u.id}
          search={(u) => `${u.name} ${u.type}`}
          searchPlaceholder="Search unlocks…"
          selects={[{ key: "type", label: "Type", options: types.map((t) => ({ label: t, value: t })), get: (u) => u.type }]}
          initialSort={{ key: "level", dir: "asc" }}
        />
      </Section>

      <Section title="Farm sizes">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Upgrade</th>
                <th className="text-right">Size</th>
                <th className="text-right">Level</th>
                <th className="text-right">Gold</th>
                <th className="text-right">Brains</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Starting farm</td>
                <td className="text-right tabular">30×30</td>
                <td className="text-right tabular">—</td>
                <td className="text-right tabular">—</td>
                <td className="text-right tabular">—</td>
              </tr>
              {upgrades.mapSize.map((u) => (
                <tr key={u.size}>
                  <td className="font-medium">{u.name}</td>
                  <td className="text-right tabular">{u.size}×{u.size}</td>
                  <td className="text-right tabular">Lv {u.level}</td>
                  <td className="text-right"><Gold value={u.gold} /></td>
                  <td className="text-right"><Brains value={u.brains} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note tone="muted">Farm-size upgrades are either/or on currency — pay gold or brains, not both. Purchases are sequential (no skipping tiers).</Note>
      </Section>
    </div>
  );
}
