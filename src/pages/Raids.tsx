import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains, Xp } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { Formula, Fx } from "../components/ui/Formula";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { ZombieChip, EnemyChip, PlaceableChip, BoostChip } from "../components/entities";
import { RaidToggleBar } from "../components/RaidToggleBar";
import { PageIcon } from "../components/PageIcon";
import { useRaidSettings, computeRaidEv, type ComputedRaidEv } from "../lib/raidEv";
import { raids, raidSlug, raidBySlug } from "../data";
import { num, duration, pct, levelLabel } from "../lib/format";
import type { Raid } from "../data/types";

interface Row {
  raid: Raid;
  ev: ComputedRaidEv;
}

export function RaidsIndex() {
  const [s, patch] = useRaidSettings();
  const rows = useMemo<Row[]>(() => raids.map((raid) => ({ raid, ev: computeRaidEv(raid, s) })), [s]);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Raid",
      sortable: true,
      value: (r) => r.raid.name,
      render: ({ raid }) => (
        <Link to={`/raids/${raidSlug(raid)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={raid.enemyIcon} alt="" size="sm" fallback="none" />
          {raid.name}
        </Link>
      ),
    },
    { key: "unlock", header: "Unlock", sortable: true, align: "right", value: (r) => r.raid.unlockLevel, render: (r) => levelLabel(r.raid.unlockLevel) },
    { key: "win", header: "Win gold", sortable: true, align: "right", hint: "(goldReward + bonusGold) × survival", value: (r) => r.ev.winGold, render: (r) => <Gold value={r.ev.winGold} /> },
    {
      key: "net",
      header: "Net gold / run",
      sortable: true,
      align: "right",
      value: (r) => r.ev.netGold,
      render: ({ raid, ev }) => (
        <Formula
          result={<Gold value={ev.netGold} />}
          source={{ file: "src/raid/RaidCatalog.ts", line: 299, label: "winGold" }}
        >
          <Fx>win {num(ev.winGold)} − voucher {num(ev.voucherCost)} − elite {num(ev.eliteCost)}</Fx>
          <Fx>+ bonus/refund {num(ev.alwaysGoldEV)} + decor {num(ev.decorSellEV)}</Fx>
          <Fx>= {num(ev.netGold)} gold</Fx>
        </Formula>
      ),
    },
    { key: "brains", header: "Brains / win", sortable: true, align: "right", hint: "boss roll + pity", value: (r) => r.ev.brains, render: (r) => <Brains value={r.ev.brains} digits={3} /> },
    {
      key: "rare",
      header: "Rare zombie",
      sortable: true,
      value: (r) => (r.raid.rare ? r.ev.rareExpectedWins ?? 0 : Infinity),
      render: ({ raid, ev }) =>
        raid.rare ? (
          <span className="text-sm">
            <ZombieChip k={raid.rare.key} /> <span className="text-muted">{pct(ev.rareRate, 2)} · ~{num(ev.rareExpectedWins ?? 0)} wins</span>
          </span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Raids" icon={<PageIcon to="/raids" />} kicker={`${raids.length} raids`}>
        <p>
          Raids pay gold, brains, and boosts on every win, and four of them can also drop a rare zombie. XP only comes from your first
          clear of each. The gold, brains, and rare-zombie figures below update as you change the toggle bar.
        </p>
      </PageHeader>

      <RaidToggleBar s={s} patch={patch} />

      <DataTable rows={rows} columns={columns} rowKey={(r) => String(r.raid.id)} initialSort={{ key: "unlock", dir: "asc" }} />

      <Note tone="muted">
        Net gold counts win gold (scaled by survival), the bonus-gold and voucher-refund loot picks, and - when "Sell decorations" is
        on - the expected decoration sell value. Elite subtracts the 10,000-gold Brain Ticket and quadruples brain & rare luck; enemy
        difficulty (much harder) isn't modeled here.
      </Note>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { gold: "Bonus gold", brains: "Brains", boost: "Boost", decor: "Decoration", item: "Item" };

export function RaidDetail() {
  const { slug } = useParams();
  const [s, patch] = useRaidSettings();
  const raid = slug ? raidBySlug[slug] : undefined;
  if (!raid) return <Note tone="warn">Raid not found.</Note>;
  const ev = computeRaidEv(raid, s);

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Raids", to: "/raids" }, { label: raid.name }]} />
      <PageHeader
        title={raid.name}
        icon={<GameIcon file={raid.bossPortrait} alt={raid.bossName} size="xl" fallback="none" />}
        kicker={`Boss: ${raid.bossName}`}
      />

      <RaidToggleBar s={s} patch={patch} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Rewards @ current settings</h2>
            <KeyRow label="Net gold / run"><Gold value={ev.netGold} /></KeyRow>
            <KeyRow label="Win gold"><Gold value={ev.winGold} /></KeyRow>
            <KeyRow label="Bonus + refund"><Gold value={ev.alwaysGoldEV} /></KeyRow>
            <KeyRow label="Decor sell EV"><Gold value={ev.decorSellEV} /></KeyRow>
            <KeyRow label="Brains / win"><Brains value={ev.brains} digits={3} /></KeyRow>
            {raid.rare && <KeyRow label="Rare rate">{pct(ev.rareRate, 2)}</KeyRow>}
            {raid.rare && <KeyRow label="Expected wins">~{num(ev.rareExpectedWins ?? 0)}</KeyRow>}
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Fixed</h2>
            <KeyRow label="Unlock level">{levelLabel(raid.unlockLevel)}</KeyRow>
            <KeyRow label="Recommended">Lv {raid.recommendedLevel}</KeyRow>
            <KeyRow label="First-clear XP"><Xp value={raid.xp} /></KeyRow>
            <KeyRow label="First-clear brains"><Brains value={raid.firstClearBrains} /></KeyRow>
            <KeyRow label="Cooldown">{duration(raid.cooldownMs)}</KeyRow>
            <KeyRow label="Min army">{raid.minArmyProgression.join(" → ")}</KeyRow>
            <KeyRow label="Stages">{raid.stageCount}</KeyRow>
            {raid.rare && (
              <div className="mt-2 text-right text-xs">
                Rare drop: <ZombieChip k={raid.rare.key} />
              </div>
            )}
          </Panel>
        </div>

        <div>
          <Section title="Loot table" aside={<span className="text-xs text-muted">per-item chance @ {s.dice} dice</span>}>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Item</th>
                    <th>Kind</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">Chance / win</th>
                  </tr>
                </thead>
                <tbody>
                  {raid.lootTiers.flatMap((t) =>
                    t.items.map((it, j) => {
                      const p = (ev.tierProbs[t.tier] ?? 0) / t.items.length;
                      return (
                        <tr key={`${t.tier}-${j}`}>
                          {j === 0 && (
                            <td rowSpan={t.items.length} className="align-top tabular font-medium">
                              t{t.tier}
                              <div className="text-xs font-normal text-muted">{pct(ev.tierProbs[t.tier] ?? 0)}</div>
                            </td>
                          )}
                          <td>
                            {it.placeKey ? <PlaceableChip k={it.placeKey} /> : it.boostKey ? <BoostChip k={it.boostKey} /> : it.name}
                            {it.boostQty && it.boostQty > 1 ? <span className="ml-1 text-xs text-muted">×{it.boostQty}</span> : null}
                          </td>
                          <td><Badge>{KIND_LABEL[it.kind] ?? it.kind}</Badge></td>
                          <td className="text-right tabular">
                            {it.kind === "brains" ? <Brains value={it.brainValue} /> : it.kind === "decor" ? <Gold value={it.sellValue} /> : it.goldValue ? <Gold value={it.goldValue} /> : "-"}
                          </td>
                          <td className="text-right tabular">{pct(p, 1)}</td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Waves">
            {raid.stages.map((st) => (
              <div key={st.index} className="mb-4">
                {raid.stages.length > 1 && <div className="mb-1 text-sm font-medium">Stage {st.index + 1}</div>}
                <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {st.bossKey && (
                    <span>
                      Boss: <EnemyChip k={st.bossKey} />
                    </span>
                  )}
                  <span className="text-muted">Total enemy HP: <span className="tabular text-text">{num(st.totalEnemyHp)}</span></span>
                  <span className="text-muted">Aggregate melee DPS: <span className="tabular text-text">{num(st.totalEnemyMeleeDps)}</span></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {st.minions.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <EnemyChip k={m.key} />
                      <span className="text-xs text-muted">×{m.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">
              Enemy HP is con × 100 and melee DPS is str × 10 (1s enemy interval). Boss throws and specials add damage beyond melee and
              aren't in the aggregate.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
