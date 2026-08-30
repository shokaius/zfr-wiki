import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Brains } from "../components/ui/Currency";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { ZombieChip, CropChip } from "../components/entities";
import { PageIcon } from "../components/PageIcon";
import { epicBosses, epicBossSlug, epicBossSlugs } from "../data";
import { num, duration } from "../lib/format";
import type { EpicBoss } from "../data/types";

export function EpicBossesIndex() {
  const columns: Column<EpicBoss>[] = [
    {
      key: "name",
      header: "Boss",
      sortable: true,
      value: (b) => b.name,
      render: (b) => (
        <Link to={`/epic-bosses/${epicBossSlug(b)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={b.questIcon} alt="" size="sm" fallback="none" />
          {b.name}
        </Link>
      ),
    },
    { key: "unlock", header: "Unlock", sortable: true, align: "right", value: (b) => b.unlockLevel ?? 999, render: (b) => (b.unlockLevel ? `Lv ${b.unlockLevel}` : "—") },
    { key: "cost", header: "Entry", sortable: true, align: "right", value: (b) => b.costBrains, render: (b) => <Brains value={b.costBrains} /> },
    { key: "rungs", header: "Rungs", align: "right", value: (b) => b.maxLevel },
    { key: "hp", header: "Base HP", sortable: true, align: "right", value: (b) => b.baseHp, render: (b) => num(b.baseHp) },
    { key: "window", header: "Window", align: "right", value: (b) => b.durationMs, render: (b) => duration(b.durationMs) },
    {
      key: "crop",
      header: "Favorite crop",
      value: (b) => b.favoriteCrop?.name ?? "",
      render: (b) => (b.favoriteCrop ? <CropChip k={b.favoriteCrop.key} /> : "—"),
    },
    {
      key: "prizes",
      header: "Prize zombies",
      value: (b) => b.questZombies.length,
      render: (b) => (
        <div className="flex flex-wrap gap-1">
          {b.questZombies.map((z) => (
            <ZombieChip key={z.key} k={z.key} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Epic Bosses" icon={<PageIcon to="/epic-bosses" />} kicker={`${epicBosses.length} bosses`}>
        <p>
          Time-limited, level-gated events bought with brains. Each is a {epicBosses[0]?.maxLevel ?? 10}-rung ladder that rewards named
          Yellow-class quest zombies. Cost, unlock level, HP curve, and prize zombies are listed per boss.
        </p>
      </PageHeader>
      <DataTable rows={epicBosses} columns={columns} rowKey={(b) => b.id} initialSort={{ key: "unlock", dir: "asc" }} />

      <Section title="Boss Tokens">
        <Note>
          A run is a purchase with a 14-day clock — there's no season calendar. Each ladder attempt costs one Boss Token, or{" "}
          {epicBosses[0]?.fightBrainCost ?? 1} brain if you have none. Tokens drop only from <strong>crop</strong> harvests while a run is
          active (never from zombies or trees), and the count resets to zero the moment the run completes or expires — they don't bank
          across events. Each boss has a favorite crop that raises its token rate. A rung is an HP pool chipped down across attempts
          inside a 2-hour encounter window; miss the window and the rung's HP fully restores. Per-plot-day token rates are a throughput
          calculation, deliberately out of scope here.
        </Note>
      </Section>
    </div>
  );
}

export function EpicBossDetail() {
  const { slug } = useParams();
  const b = slug ? epicBossSlugs.bySlug[slug] : undefined;
  if (!b) return <Note tone="warn">Epic boss not found.</Note>;

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Epic Bosses", to: "/epic-bosses" }, { label: b.name }]} />
      <PageHeader title={b.name} icon={<GameIcon file={b.portrait} alt={b.name} size="xl" fallback="none" />} kicker="Epic Boss" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Event</h2>
            <KeyRow label="Unlock level">{b.unlockLevel ? `Lv ${b.unlockLevel}` : "—"}</KeyRow>
            <KeyRow label="Entry cost"><Brains value={b.costBrains} /></KeyRow>
            <KeyRow label="Ladder">{b.maxLevel} rungs</KeyRow>
            <KeyRow label="Window">{duration(b.durationMs)}</KeyRow>
            <KeyRow label="Encounter">{duration(b.encounterMs)}</KeyRow>
            <KeyRow label="Attempt cost"><Brains value={b.fightBrainCost} /> or 1 token</KeyRow>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Boss unit</h2>
            <KeyRow label="STR">{b.unitStats.str}</KeyRow>
            <KeyRow label="CON">{b.unitStats.con}</KeyRow>
            <KeyRow label="DEX">{b.unitStats.dex}</KeyRow>
            {b.favoriteCrop && (
              <div className="mt-2 text-right text-xs">
                Favorite crop: <CropChip k={b.favoriteCrop.key} />
              </div>
            )}
          </Panel>
        </div>

        <div>
          <Section title="Prize zombies">
            {b.questZombies.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zombie</th>
                      <th>Class</th>
                      <th className="text-right">DPS</th>
                      <th className="text-right">HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.questZombies.map((z) => (
                      <tr key={z.key}>
                        <td><ZombieChip k={z.key} /></td>
                        <td>{z.className}</td>
                        <td className="text-right tabular">{z.dps != null ? num(z.dps) : "—"}</td>
                        <td className="text-right tabular">{z.hp != null ? num(z.hp) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Note>No named quest-zombie rewards for this boss.</Note>
            )}
          </Section>

          <Section title="HP by rung">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    {b.hpCurve.map((h) => (
                      <th key={h.level} className="text-right">
                        {h.level}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {b.hpCurve.map((h) => (
                      <td key={h.level} className="text-right tabular">
                        {num(h.hp)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-muted">HP = baseHp × per-rung multiplier (<span className="font-mono">epicBossHp</span>). A rung is an HP pool chipped down across attempts within a 2-hour window.</p>
          </Section>

          {b.loot.length > 0 && (
            <Section title="Rung loot">
              <div className="flex flex-wrap gap-2">
                {b.loot.map((l, i) => (
                  <span key={i} className="chip" title={`rung ${l.level}`}>
                    {l.name}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
