import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Brains } from "../components/ui/Currency";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { Formula, Fx } from "../components/ui/Formula";
import { ZombieChip, CropChip } from "../components/entities";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { epicBosses, epicBossSlug, epicBossSlugs, epicTokens } from "../data";
import { num, pct, duration } from "../lib/format";
import type { EpicBoss } from "../data/types";

/** Fastest and slowest crops, for the token throughput comparison. */
const FAST = [...epicTokens.crops].sort((a, b) => b.perPlotDay - a.perPlotDay)[0];
const SLOW = [...epicTokens.crops].sort((a, b) => a.perPlotDay - b.perPlotDay)[0];

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
    { key: "unlock", header: "Unlock", sortable: true, align: "right", value: (b) => b.unlockLevel ?? 999, render: (b) => (b.unlockLevel ? `Lv ${b.unlockLevel}` : "-") },
    { key: "cost", header: "Entry", sortable: true, align: "right", value: (b) => b.costBrains, render: (b) => <Brains value={b.costBrains} /> },
    { key: "levels", header: "Levels", align: "right", value: (b) => b.maxLevel },
    { key: "hp", header: "Base HP", sortable: true, align: "right", value: (b) => b.baseHp, render: (b) => num(b.baseHp) },
    {
      key: "dps",
      header: "DPS",
      sortable: true,
      align: "right",
      hint: "str × 10 per swing, one swing every 1s ⁄ dex",
      value: (b) => b.hpCurve[0]?.dps ?? 0,
      render: (b) => (
        <span className="tabular">
          {num(b.hpCurve[0]?.dps ?? 0)}
          <span className="text-muted"> → {num(b.hpCurve[b.hpCurve.length - 1]?.dps ?? 0)}</span>
        </span>
      ),
    },
    { key: "window", header: "Window", align: "right", value: (b) => b.durationMs, render: (b) => duration(b.durationMs) },
    {
      key: "crop",
      header: "Favorite crop",
      value: (b) => b.favoriteCrop?.name ?? "",
      render: (b) => (b.favoriteCrop ? <CropChip k={b.favoriteCrop.key} /> : "-"),
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
          Epic Bosses are {epicBosses[0]?.maxLevel ?? 10}-level events. You harvest crops to get tokens, and use those to
          attempt the levels. You get strong prize zombies clearing levels 5 and 10.
        </p>
      </PageHeader>
      <DataTable rows={epicBosses} columns={columns} rowKey={(b) => b.id} initialSort={{ key: "unlock", dir: "asc" }} />

      <Section title="Boss Tokens">
        <div className="prose-tight max-w-3xl space-y-3 text-sm">
          <p>
            Every ladder attempt costs one Boss Token, or {epicTokens.fightBrainCost} brain if you have none. Tokens drop
            from veggie crop harvests while a run is active.
          </p>
          <p>
            Longer crops have a better chance per harvest. Anything 8 hours or longer sits at the{" "}
            {pct(epicTokens.ceiling, 2)} cap. The running boss's favourite crop gets {pct(epicTokens.favoriteBonus, 0)}{" "}
            more on top, up to {pct(epicTokens.favoriteCeiling, 2)}. Four of the eight favourites are short crops, so for
            those bosses a plain 8 hour crop still gives better odds.
          </p>
          <p>
            If you play actively, plant 15 minute crops instead. Each harvest has a much worse chance, but you harvest
            them so much more often that you end up with about {num(FAST.perPlotDay, { digits: 2 })} tokens per plot a
            day instead of {num(SLOW.perPlotDay, { digits: 2 })}. Long crops only win if you cannot check in often.
          </p>
        </div>
        <div className="mt-2">
          <SourceCite file="src/epicBoss/tokens.ts" label="epicBossTokenChance" />
        </div>
      </Section>
    </div>
  );
}

export function EpicBossDetail() {
  const { slug } = useParams();
  const b = slug ? epicBossSlugs.bySlug[slug] : undefined;
  if (!b) return <Note tone="warn">Epic boss not found.</Note>;
  const first = b.hpCurve[0];
  const last = b.hpCurve[b.hpCurve.length - 1];
  const hpGrowth = first?.hp ? (last?.hp ?? 0) / first.hp : 0;
  const dmgGrowth = first?.dps ? (last?.dps ?? 0) / first.dps : 0;

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Epic Bosses", to: "/epic-bosses" }, { label: b.name }]} />
      <PageHeader title={b.name} icon={<GameIcon file={b.portrait} alt={b.name} size="xl" fallback="none" />} kicker="Epic Boss" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Event</h2>
            <KeyRow label="Unlock level">{b.unlockLevel ? `Lv ${b.unlockLevel}` : "-"}</KeyRow>
            <KeyRow label="Entry cost"><Brains value={b.costBrains} /></KeyRow>
            <KeyRow label="Ladder">{b.maxLevel} levels</KeyRow>
            <KeyRow label="Window">{duration(b.durationMs)}</KeyRow>
            <KeyRow label="Encounter">{duration(b.encounterMs)}</KeyRow>
            <KeyRow label="Attempt cost"><Brains value={b.fightBrainCost} /> or 1 token</KeyRow>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Boss unit</h2>
            <KeyRow label="STR">{b.unitStats.str}</KeyRow>
            <KeyRow label="CON">{b.unitStats.con}</KeyRow>
            <KeyRow label="DEX">{b.unitStats.dex}</KeyRow>
            <KeyRow label="Attack">{b.attacks.map((a) => a.name).join(", ") || "-"}</KeyRow>
            <KeyRow label="Swings every">{(b.swingMs / 1000).toFixed(2)}s</KeyRow>
            <KeyRow label="Damage / hit">
              <Formula result={num(first?.damagePerHit ?? 0)} source={{ file: "src/raid/combatStats.ts", label: "POWER_PER_STR" }}>
                <Fx>str × 10 = {b.unitStats.str} × 10 = {num(first?.damagePerHit ?? 0)}</Fx>
                <Fx>level 1; +{pct(b.damageRungStep, 0)} compounding per level</Fx>
              </Formula>
            </KeyRow>
            <KeyRow label="DPS">
              {num(first?.dps ?? 0)} <span className="text-muted">→ {num(last?.dps ?? 0)} at level {b.maxLevel}</span>
            </KeyRow>
            {b.favoriteCrop && (
              <div className="mt-2 text-right text-xs">
                Favorite crop: <CropChip k={b.favoriteCrop.key} />
                <div className="mt-1 text-muted">
                  {pct(b.favoriteCrop.chance, 2)} a harvest while this boss is running
                  <span className="text-muted/70"> (normally {pct(b.favoriteCrop.baseChance, 2)})</span>
                </div>
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
                      <th className="text-right" title="Awarded by more than one quest">Quests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.questZombies.map((z) => (
                      <tr key={z.key}>
                        <td><ZombieChip k={z.key} /></td>
                        <td>{z.className}</td>
                        <td className="text-right tabular">{z.dps != null ? num(z.dps) : "-"}</td>
                        <td className="text-right tabular">{z.hp != null ? num(z.hp) : "-"}</td>
                        <td className="text-right tabular text-muted">{z.questIds.length > 1 ? `${z.questIds.length}×` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Note>No named quest-zombie rewards for this boss.</Note>
            )}
          </Section>

          <Section
            title="The ladder"
            aside={<span className="text-xs text-muted">HP ×{num(hpGrowth, { digits: 0 })} · damage ×{num(dmgGrowth, { digits: 2 })}</span>}
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-right">Level</th>
                    <th className="text-right">Boss HP</th>
                    <th className="text-right">Damage / hit</th>
                    <th className="text-right">DPS</th>
                    <th className="text-right">Most it can deal in one attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {b.hpCurve.map((h) => (
                    <tr key={h.level}>
                      <td className="text-right tabular font-medium">{h.level}</td>
                      <td className="text-right tabular">{num(h.hp)}</td>
                      <td className="text-right tabular">{num(h.damagePerHit)}</td>
                      <td className="text-right tabular">{num(h.dps)}</td>
                      <td className="text-right tabular text-muted">{num(h.maxAttemptDamage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <SourceCite file="src/epicBoss/catalog.ts" label="epicBossDamage" />
            </div>
          </Section>

          <Section title="How a run works">
            <ul className="prose-tight max-w-3xl space-y-1 text-sm">
              <li>Starting the event gives {duration(b.durationMs)} to clear all levels.</li>
              <li>Each individual fight lasts up to {b.fightMs / 1000} seconds.</li>
              <li>
                If a level has too much HP for one {b.fightMs / 1000}-second attempt, you can attempt multiple times over
                a {duration(b.encounterMs)} window.
              </li>
              <li>At the end of that {duration(b.encounterMs)} window, the health resets, but the level stays the same.</li>
            </ul>
            <div className="mt-2">
              <SourceCite file="src/epicBoss/EpicBossManager.ts" label="normalize / finish" />
            </div>
          </Section>

          {b.loot.length > 0 && (
            <Section title="Level loot">
              <div className="flex flex-wrap gap-2">
                {b.loot.map((l, i) => (
                  <span key={i} className="chip" title={`level ${l.level}`}>
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
