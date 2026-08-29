import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Xp } from "../components/ui/Currency";
import { SeasonalBadge, Badge } from "../components/ui/Badge";
import { Formula, Fx } from "../components/ui/Formula";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { MutationChip } from "../components/entities";
import { crops, cropSlug, cropSlugs, mutations } from "../data";
import { num, duration, titleCase } from "../lib/format";
import type { Crop } from "../data/types";

const SLOTS = ["head", "hair_eye", "arm", "body", "neck"];

export function CropsIndex() {
  const columns: Column<Crop>[] = [
    {
      key: "name",
      header: "Crop",
      sortable: true,
      value: (c) => c.name,
      render: (c) => (
        <Link to={`/crops/${cropSlug(c)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={c.icon} alt="" size="sm" fallback="none" />
          {c.name}
          {c.seasonal && <SeasonalBadge theme="seasonal" />}
        </Link>
      ),
    },
    { key: "level", header: "Unlock", sortable: true, align: "right", value: (c) => c.level, render: (c) => <span>Lv {c.level}</span> },
    { key: "cost", header: "Seed", sortable: true, align: "right", value: (c) => c.cost, render: (c) => <Gold value={c.cost} /> },
    { key: "sell", header: "Sell", sortable: true, align: "right", value: (c) => c.sell, render: (c) => <Gold value={c.sell} /> },
    { key: "xp", header: "XP", sortable: true, align: "right", value: (c) => c.xp, render: (c) => <Xp value={c.xp} /> },
    { key: "grow", header: "Grow", sortable: true, align: "right", value: (c) => c.growMs, render: (c) => duration(c.growMs) },
    {
      key: "mutation",
      header: "Grants",
      sortable: true,
      value: (c) => c.mutation?.name ?? "",
      render: (c) => (c.mutation ? <MutationChip k={c.mutation.key} /> : <span className="text-muted">—</span>),
    },
    {
      key: "net",
      header: "Net gold / cycle",
      sortable: true,
      align: "right",
      hint: "sell − seed − plow (10g)",
      value: (c) => c.netGoldPerCycle,
      render: (c) => (
        <Formula
          result={<Gold value={c.netGoldPerCycle} />}
          source={{ file: "src/JobSystem.ts", line: 28, label: "plow cost" }}
        >
          <Fx>sell − seed − plow</Fx>
          <Fx>= {c.sell} − {c.cost} − 10 = {c.netGoldPerCycle}</Fx>
          <Fx>with Plowing Monolith: {c.netGoldPerCycleMonolith}</Fx>
        </Formula>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Crops" kicker={`${crops.length} crops`}>
        <p>
          Crops are planted, grown, and harvested for gold and XP. Surrounding a zombie plot with a crop at harvest can grant its{" "}
          <Link to="/mutations">mutation</Link>. Net gold per cycle counts the 10-gold re-plow you pay every cycle.
        </p>
      </PageHeader>
      <DataTable
        rows={crops}
        columns={columns}
        rowKey={(c) => c.key}
        search={(c) => `${c.name} ${c.mutation?.name ?? ""}`}
        searchPlaceholder="Search crops…"
        selects={[
          {
            key: "slot",
            label: "Mutation slot",
            options: SLOTS.map((s) => ({ label: titleCase(s), value: s })),
            get: (c) => c.mutation?.slot ?? null,
          },
        ]}
        toggles={[
          { key: "mut", label: "Grants a mutation", predicate: (c) => !!c.mutation },
          { key: "seasonal", label: "Seasonal", predicate: (c) => c.seasonal },
        ]}
        initialSort={{ key: "level", dir: "asc" }}
      />
    </div>
  );
}

export function CropDetail() {
  const { slug } = useParams();
  const crop = slug ? cropSlugs.bySlug[slug] : undefined;
  if (!crop) return <Note tone="warn">Crop not found.</Note>;

  const sameSlot = crop.mutation
    ? mutations.filter((m) => m.slot === crop.mutation!.slot && m.key !== crop.mutation!.key)
    : [];

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Crops", to: "/crops" }, { label: crop.name }]} />
      <PageHeader title={crop.name} icon={<GameIcon file={crop.icon} alt={crop.name} size="xl" fallback="none" />} kicker="Crop" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
          <KeyRow label="Unlock level">Lv {crop.level}</KeyRow>
          <KeyRow label="Seed cost"><Gold value={crop.cost} /></KeyRow>
          <KeyRow label="Sell value"><Gold value={crop.sell} /></KeyRow>
          <KeyRow label="Harvest XP"><Xp value={crop.xp} /></KeyRow>
          <KeyRow label="Grow time">{duration(crop.growMs)}</KeyRow>
          <KeyRow label="Seasonal">{crop.seasonal ? "Yes" : "No"}</KeyRow>
          <KeyRow label="Net gold / cycle"><Gold value={crop.netGoldPerCycle} /></KeyRow>
          <KeyRow label="Net / cycle (monolith)"><Gold value={crop.netGoldPerCycleMonolith} /></KeyRow>
        </Panel>

        <div>
          <Section title="Mutation granted">
            {crop.mutation ? (
              <Panel>
                <div className="flex flex-wrap items-center gap-3">
                  <MutationChip k={crop.mutation.key} />
                  <Badge>{titleCase(crop.mutation.slot)} slot</Badge>
                  <Badge>Tier {crop.mutation.tier}</Badge>
                  <span className="tabular text-sm">
                    {Object.entries(crop.mutation.stats)
                      .map(([k, v]) => `+${v} ${k}`)
                      .join(", ")}
                  </span>
                </div>
                {sameSlot.length > 0 && (
                  <p className="mt-3 text-sm text-muted">
                    Competes for the {titleCase(crop.mutation.slot)} slot with:{" "}
                    {sameSlot.map((m) => (
                      <span key={m.key} className="mr-1 inline-block">
                        <MutationChip k={m.key} />
                      </span>
                    ))}
                  </p>
                )}
              </Panel>
            ) : (
              <Note>This crop grants no mutation — it's grown purely for gold and XP.</Note>
            )}
          </Section>

          <Section title="Cycle breakdown">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th className="text-right">Gold</th>
                    <th className="text-right">XP</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Plow (till)</td>
                    <td className="text-right tabular">−10</td>
                    <td className="text-right tabular">+1</td>
                    <td className="text-muted">Every cycle re-plows dirt → plowed</td>
                  </tr>
                  <tr>
                    <td>Plant seed</td>
                    <td className="text-right tabular">−{crop.cost}</td>
                    <td className="text-right tabular">0</td>
                    <td className="text-muted">Seed cost</td>
                  </tr>
                  <tr>
                    <td>Harvest</td>
                    <td className="text-right tabular">+{crop.sell}</td>
                    <td className="text-right tabular">+{crop.xp}</td>
                    <td className="text-muted">Mutations roll here, vs adjacent crops</td>
                  </tr>
                  <tr className="font-semibold">
                    <td>Net / cycle</td>
                    <td className="text-right tabular">{num(crop.netGoldPerCycle)}</td>
                    <td className="text-right tabular">{crop.xp + 1}</td>
                    <td className="text-muted">Monolith: {num(crop.netGoldPerCycleMonolith)} gold, {crop.xp + 1} XP</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Mutation crops are read at the instant a zombie is harvested; crop age is ignored, so a bare seed counts. Per-hour and
              per-tap rates are deliberately out of scope here.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
