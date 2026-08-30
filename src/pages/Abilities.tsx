import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Badge } from "../components/ui/Badge";
import { PageHeader, Section, Panel, Note } from "../components/ui/layout";
import { SourceCite } from "../components/ui/SourceCite";
import { abilities, abilitiesFile } from "../data";
import { titleCase } from "../lib/format";
import type { Ability } from "../data/types";

export function AbilitiesPage() {
  const columns: Column<Ability>[] = [
    {
      key: "label",
      header: "Ability",
      sortable: true,
      value: (a) => a.label,
      render: (a) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <GameIcon file={a.icon} alt="" size="sm" fallback="none" />
          {a.label}
        </span>
      ),
    },
    { key: "effect", header: "Effect", value: (a) => a.effect, render: (a) => <span className="text-sm text-muted">{a.effect}</span> },
    { key: "kind", header: "Kind", sortable: true, value: (a) => a.kind ?? "", render: (a) => (a.kind ? <Badge>{titleCase(a.kind)}</Badge> : "—") },
    { key: "tier", header: "Tier", sortable: true, align: "right", value: (a) => a.poolTier ?? 99, render: (a) => (a.poolTier ? `t${a.poolTier}` : "—") },
    {
      key: "groups",
      header: "Groups",
      value: (a) => a.groups.map((g) => g.group).join(","),
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.groups.map((g) => (
            <Badge key={g.group} title={`tier ${g.tier}`}>
              {g.group} t{g.tier}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: "boss", header: "Boss gate", value: (a) => a.bossGate ?? "", render: (a) => <span className="text-sm">{a.bossGate ?? "—"}</span> },
  ];

  const heal = abilities.find((a) => a.key === "heal");

  return (
    <div>
      <PageHeader title="Abilities" kicker={`${abilities.length} abilities`}>
        <p>
          Combat abilities are granted by a zombie's group across four tiers. A tier is usable when the zombie's class carries it and its
          boss has been beaten ({Object.values(abilitiesFile.tierBoss).join(", ")}).
        </p>
      </PageHeader>

      <DataTable rows={abilities} columns={columns} rowKey={(a) => a.key} search={(a) => `${a.label} ${a.effect}`} searchPlaceholder="Search abilities…" initialSort={{ key: "tier", dir: "asc" }} />

      <Section title="Activated abilities">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ability</th>
                <th className="text-right">Damage ×</th>
                <th className="text-center">AOE</th>
                <th className="text-right">Stun</th>
                <th className="text-right">Cooldown</th>
                <th className="text-center">Hits boss</th>
              </tr>
            </thead>
            <tbody>
              {abilities
                .filter((a) => a.activated)
                .map((a) => {
                  const x = a.activated as Record<string, number | boolean>;
                  return (
                    <tr key={a.key}>
                      <td className="font-medium">{a.label}</td>
                      <td className="text-right tabular">{x.damageFactor ? `${x.damageFactor}×` : "—"}</td>
                      <td className="text-center">{x.aoe ? "✓" : "—"}</td>
                      <td className="text-right tabular">{x.stunMs ? `${Number(x.stunMs) / 1000}s` : "—"}</td>
                      <td className="text-right tabular">{x.cooldownMs ? `${Number(x.cooldownMs) / 1000}s` : "—"}</td>
                      <td className="text-center">{x.hitBoss ? "✓" : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Section>

      {heal && (
        <Section title="Heal (Garden, tier 1)">
          <Panel>
            <p className="prose-tight text-sm">
              Heal is Garden-exclusive. Amount = <span className="font-mono">round(power × 0.5)</span> where power = str × 10, so a
              healer's strength is its throughput. Cadence is the healer's own <span className="font-mono">2.0 ⁄ dex</span> seconds.
              Targeting picks the lowest HP-<em>fraction</em> deployed ally (not lowest absolute HP), excluding only itself — so healers
              are valid targets and high-HP tanks can soak heals while squishies die. <span className="font-mono">wallInWay</span> blocks
              it, and healAOE (tier 4) runs on a separate 20-second timer that includes the caster.
            </p>
            <p className="mt-2 text-xs text-muted">
              Note a comment/code mismatch: the constant says "at or below 50% Life" but the code fires on any missing HP.{" "}
              <SourceCite file="src/zombie/abilities.ts" label="abilities" />
            </p>
          </Panel>
        </Section>
      )}

      <Note tone="muted">Effect values are read from the ability pool and combat tables. Damage factors and cooldowns are exact; the fight resolution itself (a battle simulator) is deferred.</Note>
    </div>
  );
}
