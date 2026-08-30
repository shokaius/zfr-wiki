import { PageHeader, Section } from "../components/ui/layout";
import { SourceCite } from "../components/ui/SourceCite";
import { economy } from "../data";
import { num } from "../lib/format";

export function LevelingPage() {
  const e = economy;
  return (
    <div>
      <PageHeader title="Leveling" kicker={`max level ${e.maxLevel}`}>
        <p>XP required to reach each level. XP comes from harvesting crops, first-clearing raids, quests, and buying placeables. Raids pay XP only on the first clear.</p>
      </PageHeader>

      <Section title="XP thresholds">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-right">Level</th>
                <th className="text-right">Cumulative XP</th>
                <th className="text-right">XP from previous level</th>
              </tr>
            </thead>
            <tbody>
              {e.xpThresholds.map((t) => (
                <tr key={t.level}>
                  <td className="text-right tabular font-medium">{t.level}</td>
                  <td className="text-right tabular">{num(t.cumulativeXp)}</td>
                  <td className="text-right tabular text-muted">{t.level === 1 ? "—" : num(t.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1">
          <SourceCite file="src/GameState.ts" label="XP_THRESHOLDS" />
        </div>
      </Section>
    </div>
  );
}
