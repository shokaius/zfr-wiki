import { PageHeader, Section, Note, Panel } from "../components/ui/layout";
import { Badge } from "../components/ui/Badge";
import { GameIcon } from "../components/ui/GameIcon";
import { CropChip } from "../components/entities";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { mutationsFile, mutations } from "../data";
import { titleCase, pct } from "../lib/format";

const SLOT_ORDER = ["head", "hair_eye", "arm", "body", "neck"];

export function MutationsPage() {
  const bySlot = SLOT_ORDER.map((slot) => ({
    slot,
    items: mutations.filter((m) => m.slot === slot).sort((a, b) => a.bit - b.bit),
  }));

  return (
    <div>
      <PageHeader title="Mutations" icon={<PageIcon to="/mutations" />} kicker={`${mutations.length} mutations · ${mutationsFile.slots.length} slots`}>
        <p>
          A zombie has five anatomical slots, each holding at most one mutation. Mutations roll at harvest against whatever crop is
          planted in adjacent plots. Same-slot mutations conflict — the higher catalog bit wins in the Zombie Pot, or the lower random
          roll wins at harvest.
        </p>
      </PageHeader>

      {bySlot.map(({ slot, items }) => (
        <Section key={slot} title={`${titleCase(slot)} slot`}>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mutation</th>
                  <th>Effect</th>
                  <th className="text-right">Tier</th>
                  <th className="text-right">Bit</th>
                  <th>Granted by</th>
                  <th className="text-right">Crop unlock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.key} id={m.key} className="scroll-mt-20">
                    <td className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <GameIcon file={m.icon} alt="" size="sm" fallback="none" />
                        {m.name}
                      </span>
                    </td>
                    <td className="tabular">
                      {Object.entries(m.stats)
                        .map(([k, v]) => `+${v} ${k}`)
                        .join(", ")}
                    </td>
                    <td className="text-right tabular">{m.tier}</td>
                    <td className="text-right tabular font-mono text-xs">{m.bit}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {m.sources.map((s) => (
                          <CropChip key={s.cropKey} k={s.cropKey} />
                        ))}
                      </div>
                    </td>
                    <td className="text-right tabular">{m.unlockLevel != null ? `Lv ${m.unlockLevel}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ))}

      <Section title="How mutations are rolled">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <ul className="prose-tight list-disc space-y-1 pl-4 text-sm">
              <li>
                Each adjacent plot growing a mutation crop adds{" "}
                <span className="font-semibold">{pct(mutationsFile.chancePerPlot)}</span> to that mutation's chance, capped at 100%.
              </li>
              <li>Adjacency is a distance test (within one plot-width on both axes) — up to 8 neighbours, corners included.</li>
              <li>Crop age is ignored; only the planted crop key is read, so bare seeds count. Rolled once, at harvest.</li>
              <li>Rolls are independent per mutation; expected count = neighbours × {mutationsFile.chancePerPlot} regardless of layout.</li>
              <li>Same-slot conflict: at harvest the lower random roll wins; in the Zombie Pot the higher catalog bit wins.</li>
              <li>Headless bodies refuse head and hair/eye entirely. Pumpking inverts it — only headless can grow one, but any zombie can wear one via the pot.</li>
              <li>A Mutant Monolith forces every eligible roll to succeed; pre-mutated seed zombies enter with their bit already set.</li>
            </ul>
          </Panel>
          <div className="space-y-2">
            <Note>
              <strong>Bit order is catalog order.</strong> A higher-bit mutation overwrites a lower one in the same slot when combining,
              so filling a slot early (e.g. Potato head) costs nothing later — Coffee then Garlic overwrite it cleanly.
            </Note>
            <div className="card p-3 text-sm">
              <div className="mb-1 font-medium">Sources</div>
              <div className="flex flex-col gap-1">
                <SourceCite file="src/zombie/mutations.ts" label="mutation catalog + bits" />
                <SourceCite file="src/zombie/cropMutations.ts" label="adjacency + chance" />
                <SourceCite file="src/Field.ts" label="harvest roll" />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
