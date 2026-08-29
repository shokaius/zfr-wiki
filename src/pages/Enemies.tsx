import { useParams } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { enemies, enemySlug, enemySlugs } from "../data";
import { num, titleCase } from "../lib/format";
import type { Enemy } from "../data/types";
import { Link } from "react-router-dom";

export function EnemiesIndex() {
  const columns: Column<Enemy>[] = [
    {
      key: "key",
      header: "Enemy",
      sortable: true,
      value: (e) => e.key,
      render: (e) => (
        <Link to={`/enemies/${enemySlug(e)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={e.icon} alt="" size="sm" />
          {titleCase(e.key.replace(/StageActor|Stage|Actor/g, " "))}
        </Link>
      ),
    },
    { key: "str", header: "STR", sortable: true, align: "right", value: (e) => e.str },
    { key: "con", header: "CON", sortable: true, align: "right", value: (e) => e.con },
    { key: "dex", header: "DEX", sortable: true, align: "right", value: (e) => e.dex },
    { key: "hp", header: "HP", sortable: true, align: "right", hint: "con × 100", value: (e) => e.hp, render: (e) => num(e.hp) },
    { key: "dps", header: "Melee DPS", sortable: true, align: "right", hint: "str × 10 (1s interval)", value: (e) => e.meleeDps, render: (e) => num(e.meleeDps) },
    {
      key: "usedIn",
      header: "Appears in",
      value: (e) => e.usedIn.join(", "),
      render: (e) => <span className="text-xs text-muted">{e.usedIn.join(", ") || "—"}</span>,
    },
  ];
  return (
    <div>
      <PageHeader title="Enemies" kicker={`${enemies.length} units`}>
        <p>Every unit that fights you across the raid ladder. Enemies attack once per second (players use 2 ⁄ dex).</p>
      </PageHeader>
      <DataTable
        rows={enemies}
        columns={columns}
        rowKey={(e) => e.key}
        search={(e) => `${e.key} ${e.usedIn.join(" ")}`}
        searchPlaceholder="Search enemies…"
        initialSort={{ key: "hp", dir: "desc" }}
      />
    </div>
  );
}

export function EnemyDetail() {
  const { slug } = useParams();
  const e = slug ? enemySlugs.bySlug[slug] : undefined;
  if (!e) return <Note tone="warn">Enemy not found.</Note>;
  return (
    <div>
      <Breadcrumbs trail={[{ label: "Enemies", to: "/enemies" }, { label: e.key }]} />
      <PageHeader title={titleCase(e.key.replace(/StageActor|Stage|Actor/g, " "))} icon={<GameIcon file={e.icon} alt={e.key} size="xl" />} kicker="Enemy" />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Stats</h2>
          <KeyRow label="Key"><span className="font-mono text-xs">{e.key}</span></KeyRow>
          <KeyRow label="STR">{e.str}</KeyRow>
          <KeyRow label="CON">{e.con}</KeyRow>
          <KeyRow label="DEX">{e.dex}</KeyRow>
          <KeyRow label="HP">{num(e.hp)}</KeyRow>
          <KeyRow label="Melee DPS">{num(e.meleeDps)}</KeyRow>
        </Panel>
        <div>
          <Section title="Attacks">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attack</th>
                    <th className="text-right">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {e.attacks.map((a, i) => (
                    <tr key={i}>
                      <td>{a.name}</td>
                      <td className="text-right tabular">{a.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          {e.bossActions.length > 0 && (
            <Section title="Boss actions">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th className="text-right">Frequency</th>
                      <th className="text-right">Damage</th>
                      <th className="text-right">HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.bossActions.map((a, i) => (
                      <tr key={i}>
                        <td>{a.name}</td>
                        <td className="text-right tabular">{a.frequency}</td>
                        <td className="text-right tabular">{a.damage != null ? String(a.damage) : "—"}</td>
                        <td className="text-right tabular">{a.hp != null ? num(a.hp) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
          <Section title="Appears in">
            <div className="flex flex-wrap gap-2">
              {e.usedIn.length ? e.usedIn.map((r) => <span key={r} className="chip">{r}</span>) : <span className="text-muted">—</span>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
