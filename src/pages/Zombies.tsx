import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { ZombieIcon } from "../components/ui/ZombieIcon";
import { Gold, Brains } from "../components/ui/Currency";
import { ClassBadge, Badge } from "../components/ui/Badge";
import { Formula, Fx } from "../components/ui/Formula";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { RaidChip } from "../components/entities";
import { zombies, zombieSlug, zombieSlugs, combat } from "../data";
import { num, titleCase, duration, levelLabel } from "../lib/format";
import type { Zombie } from "../data/types";

const ACQ_LABEL: Record<string, string> = {
  "raid-drop": "Raid drop",
  "epic-reward": "Epic reward",
  "reward-only": "Reward only",
  "market-brains": "Market (brains)",
  "market-gold": "Market (gold)",
  "pre-mutated": "Pre-mutated",
};

function Cost({ z }: { z: Zombie }) {
  if (z.marketHidden || z.rewardOnly) return <span className="text-muted">—</span>;
  return z.brainsNeeded ? <Brains value={z.cost} /> : <Gold value={z.cost} />;
}

export function ZombiesIndex() {
  const groups = [...new Set(zombies.map((z) => z.group))].sort();
  const classes = [...new Set(zombies.map((z) => z.className))].sort();
  const acqs = [...new Set(zombies.flatMap((z) => z.acquisition))].sort();

  const columns: Column<Zombie>[] = [
    {
      key: "name",
      header: "Zombie",
      sortable: true,
      value: (z) => z.name,
      render: (z) => (
        <Link to={`/zombies/${zombieSlug(z)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <ZombieIcon zombie={z} size="sm" />
          {z.name}
        </Link>
      ),
    },
    { key: "class", header: "Class", sortable: true, value: (z) => z.className, render: (z) => <ClassBadge value={z.className} /> },
    { key: "group", header: "Group", sortable: true, value: (z) => z.group },
    { key: "level", header: "Unlock", sortable: true, align: "right", value: (z) => z.level, render: (z) => levelLabel(z.level) },
    { key: "cost", header: "Cost", sortable: true, align: "right", value: (z) => (z.marketHidden ? Infinity : z.cost), render: (z) => <Cost z={z} /> },
    { key: "str", header: "STR", sortable: true, align: "right", value: (z) => z.str },
    { key: "con", header: "CON", sortable: true, align: "right", value: (z) => z.con },
    { key: "dex", header: "DEX", sortable: true, align: "right", value: (z) => z.dex },
    { key: "dps", header: "DPS", sortable: true, align: "right", hint: "str × 10 × dex ⁄ 2", value: (z) => z.dps },
    { key: "hp", header: "HP", sortable: true, align: "right", hint: "con × 100", value: (z) => z.hp, render: (z) => num(z.hp) },
    {
      key: "acq",
      header: "Acquisition",
      value: (z) => z.acquisition[0],
      render: (z) => (
        <div className="flex flex-wrap gap-1">
          {z.acquisition.map((a) => (
            <Badge key={a}>{ACQ_LABEL[a] ?? a}</Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Zombies" kicker={`${zombies.length} zombies`}>
        <p>
          Your army. DPS is <span className="font-mono">str × 10 × dex ⁄ 2</span> and HP is <span className="font-mono">con × 100</span>.
          Below level 8 every zombie fights at its group's floor stats. Zombies without standalone art show a class-coloured monogram.
        </p>
      </PageHeader>
      <DataTable
        rows={zombies}
        columns={columns}
        rowKey={(z) => z.key}
        search={(z) => `${z.name} ${z.group} ${z.className}`}
        searchPlaceholder="Search zombies…"
        selects={[
          { key: "class", label: "Class", options: classes.map((c) => ({ label: c, value: c })), get: (z) => z.className },
          { key: "group", label: "Group", options: groups.map((g) => ({ label: g, value: g })), get: (z) => z.group },
          { key: "acq", label: "Acquisition", options: acqs.map((a) => ({ label: ACQ_LABEL[a] ?? a, value: a })), get: (z) => z.acquisition },
        ]}
        toggles={[{ key: "decayer", label: "Decayers", predicate: (z) => z.isDecayer }]}
        initialSort={{ key: "level", dir: "asc" }}
      />
    </div>
  );
}

export function ZombieDetail() {
  const { slug } = useParams();
  const z = slug ? zombieSlugs.bySlug[slug] : undefined;
  if (!z) return <Note tone="warn">Zombie not found.</Note>;
  const floor = combat.levelScaleEndpoints[z.group];

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Zombies", to: "/zombies" }, { label: z.name }]} />
      <PageHeader
        title={z.name}
        icon={<ZombieIcon zombie={z} size="2xl" />}
        kicker={
          <span className="flex items-center gap-2">
            <ClassBadge value={z.className} /> {z.group}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Base stats</h2>
            <KeyRow label="STR">{z.str}</KeyRow>
            <KeyRow label="CON">{z.con}</KeyRow>
            <KeyRow label="DEX">{z.dex}</KeyRow>
            <KeyRow label="Focus">{z.focus}</KeyRow>
            <KeyRow label="DPS">
              <Formula result={num(z.dps)} source={{ file: "src/raid/combatStats.ts", label: "combatStats" }}>
                <Fx>str × 10 × dex ⁄ 2</Fx>
                <Fx>= {z.str} × 10 × {z.dex} ⁄ 2 = {num(z.dps)}</Fx>
              </Formula>
            </KeyRow>
            <KeyRow label="HP">
              <Formula result={num(z.hp)} source={{ file: "src/raid/combatStats.ts", label: "deriveMaxHp" }}>
                <Fx>con × 100 = {z.con} × 100 = {num(z.hp)}</Fx>
              </Formula>
            </KeyRow>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
            <KeyRow label="Unlock level">{levelLabel(z.level)}</KeyRow>
            <KeyRow label="Cost"><Cost z={z} /></KeyRow>
            <KeyRow label="Grow time">{duration(z.growMs)}</KeyRow>
            <KeyRow label="Tier">{z.tier}</KeyRow>
            <KeyRow label="Ability tiers">{z.abilityTiers} of 4</KeyRow>
            <KeyRow label="Acquisition">
              <span className="flex flex-wrap justify-end gap-1">
                {z.acquisition.map((a) => (
                  <Badge key={a}>{ACQ_LABEL[a] ?? a}</Badge>
                ))}
              </span>
            </KeyRow>
            {z.dropRaid && (
              <div className="mt-2 text-right text-xs">
                Drops from <RaidChip id={z.dropRaid.raidId} />
              </div>
            )}
          </Panel>
        </div>

        <div>
          {z.isDecayer && (
            <div className="mb-4">
              <Note tone="warn">
                <strong>Decayer.</strong> This zombie's base stats sit below its {z.group} group floor ({floor?.str}/{floor?.con}/
                {floor?.dex}), so it <em>loses</em> effective stats as you level past 8 — invisible in-game.
              </Note>
            </div>
          )}

          <Section title="Level-scaling curve" aside={<span className="text-xs text-muted">unmutated · floor marked</span>}>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-right">Level</th>
                    <th className="text-right">STR</th>
                    <th className="text-right">CON</th>
                    <th className="text-right">DEX</th>
                    <th className="text-right">DPS</th>
                    <th className="text-right">HP</th>
                  </tr>
                </thead>
                <tbody>
                  {z.scaling
                    .filter((s) => [1, 8, 10, 12, 15, 16, 18, 20, 25].includes(s.level))
                    .map((s) => (
                      <tr key={s.level}>
                        <td className="text-right tabular font-medium">{s.level}</td>
                        <td className="text-right tabular">{s.str}</td>
                        <td className="text-right tabular">{s.con}</td>
                        <td className="text-right tabular">{s.dex}</td>
                        <td className="text-right tabular">{num(s.dps)}</td>
                        <td className="text-right tabular">{num(s.hp)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Stats interpolate from the group floor at level 8 to the listed card stats at level 25 (
              <span className="font-mono">levelScaleStat</span>). Mutations and veterancy are added flat on top.
            </p>
          </Section>

          <Section title="Ability ladder">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-right">Tier</th>
                    <th>Ability</th>
                    <th>Effect</th>
                    <th>Unlocked by beating</th>
                    <th className="text-center">This class</th>
                  </tr>
                </thead>
                <tbody>
                  {z.abilities.map((a) => (
                    <tr key={a.tier} className={a.key ? "" : "opacity-50"}>
                      <td className="text-right tabular">t{a.tier}</td>
                      <td className="font-medium">{a.label ?? "—"}</td>
                      <td className="text-muted">{a.effect ?? "—"}</td>
                      <td>{a.bossGate}</td>
                      <td className="text-center">{a.available ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Abilities are double-gated: this zombie's class carries {z.abilityTiers} tier{z.abilityTiers === 1 ? "" : "s"}, and each
              tier also requires its boss beaten globally.
            </p>
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Veterancy (survived invasions)">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th className="text-right">×</th>
                      <th className="text-right">DPS</th>
                      <th className="text-right">HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {z.veterancy.map((v) => (
                      <tr key={v.rank}>
                        <td>{v.name}</td>
                        <td className="text-right tabular">{v.mult}</td>
                        <td className="text-right tabular">{num(v.dps)}</td>
                        <td className="text-right tabular">{num(v.hp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Mutation & combine">
              <Panel>
                <p className="text-sm">
                  <span className="text-muted">Mutatable slots:</span>{" "}
                  {z.mutatableSlots.map((s) => (
                    <Badge key={s} className="mr-1">
                      {titleCase(s)}
                    </Badge>
                  ))}
                </p>
                {z.group === "Headless" && (
                  <p className="mt-2 text-xs text-muted">Headless bodies can't take head or hair/eye mutations.</p>
                )}
                {z.mutationMask > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted">Pre-mutated mask:</span> <span className="font-mono">{z.mutationMask}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Combining resets veterancy to Newbie. See <Link to="/combining">Combining</Link>.
                </p>
              </Panel>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
