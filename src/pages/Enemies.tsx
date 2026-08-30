import { useParams, Link } from "react-router-dom";
import { GameIcon } from "../components/ui/GameIcon";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { enemies, enemySlug, enemySlugs } from "../data";
import { num } from "../lib/format";
import type { Enemy } from "../data/types";

function EnemyRow({ e }: { e: Enemy }) {
  return (
    <tr>
      <td>
        <Link to={`/enemies/${enemySlug(e)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={e.icon} alt="" size="sm" />
          {e.name}
        </Link>
      </td>
      <td className="text-right tabular">{e.str}</td>
      <td className="text-right tabular">{e.con}</td>
      <td className="text-right tabular">{e.dex}</td>
      <td className="text-right tabular">{num(e.hp)}</td>
      <td className="text-right tabular">{num(e.meleeDps)}</td>
      <td className="text-xs text-muted">{e.usedIn.length > 1 ? `also ${e.usedIn.filter((r) => r !== e.firstRaid).join(", ")}` : ""}</td>
    </tr>
  );
}

export function EnemiesIndex() {
  // Group by first encounter (the earliest raid an enemy appears in).
  const order: string[] = [];
  const byRaid = new Map<string, Enemy[]>();
  for (const e of [...enemies].sort((a, b) => a.firstRaidUnlock - b.firstRaidUnlock || b.hp - a.hp)) {
    const key = e.firstRaid ?? "Other";
    if (!byRaid.has(key)) {
      byRaid.set(key, []);
      order.push(key);
    }
    byRaid.get(key)!.push(e);
  }

  return (
    <div>
      <PageHeader title="Enemies" kicker={`${enemies.length} units`}>
        <p>Every unit that fights you, grouped by the raid it first appears in. Enemies attack once per second; HP is con × 100 and melee DPS is str × 10.</p>
      </PageHeader>

      {order.map((raid) => (
        <Section key={raid} title={raid}>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enemy</th>
                  <th className="text-right">STR</th>
                  <th className="text-right">CON</th>
                  <th className="text-right">DEX</th>
                  <th className="text-right">HP</th>
                  <th className="text-right">Melee DPS</th>
                  <th>Reused in</th>
                </tr>
              </thead>
              <tbody>
                {byRaid.get(raid)!.map((e) => (
                  <EnemyRow key={e.key} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ))}
    </div>
  );
}

export function EnemyDetail() {
  const { slug } = useParams();
  const e = slug ? enemySlugs.bySlug[slug] : undefined;
  if (!e) return <Note tone="warn">Enemy not found.</Note>;
  return (
    <div>
      <Breadcrumbs trail={[{ label: "Enemies", to: "/enemies" }, { label: e.name }]} />
      <PageHeader title={e.name} icon={<GameIcon file={e.icon} alt={e.name} size="xl" />} kicker="Enemy" />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Stats</h2>
          <KeyRow label="STR">{e.str}</KeyRow>
          <KeyRow label="CON">{e.con}</KeyRow>
          <KeyRow label="DEX">{e.dex}</KeyRow>
          <KeyRow label="HP">{num(e.hp)}</KeyRow>
          <KeyRow label="Melee DPS">{num(e.meleeDps)}</KeyRow>
          <KeyRow label="Key"><span className="font-mono text-xs">{e.key}</span></KeyRow>
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
