import { DataTable, type Column } from "../components/ui/DataTable";
import { Gold, Xp, Brains } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { PageHeader, Section, Note } from "../components/ui/layout";
import { questsFile } from "../data";
import type { Quest } from "../data/types";

function questColumns(): Column<Quest>[] {
  return [
    { key: "id", header: "ID", sortable: true, align: "right", value: (q) => Number(q.id) || q.id },
    { key: "title", header: "Quest", sortable: true, value: (q) => q.title, render: (q) => <span className="font-medium">{q.title}</span> },
    { key: "level", header: "Level", sortable: true, align: "right", value: (q) => q.levelRequired, render: (q) => `Lv ${q.levelRequired}` },
    {
      key: "obj",
      header: "Objectives",
      value: (q) => q.requirements.map((r) => r.text).join("; "),
      render: (q) => (
        <ul className="space-y-0.5 text-sm text-muted">
          {q.requirements.map((r, i) => (
            <li key={i}>{r.text}</li>
          ))}
        </ul>
      ),
    },
    {
      key: "reward",
      header: "Reward",
      value: (q) => q.rewardValue,
      render: (q) => (
        <span className="inline-flex flex-wrap items-center gap-2 text-sm">
          {q.rewardValue > 0 && (q.rewardType === 0 ? <Xp value={q.rewardValue} /> : <Gold value={q.rewardValue} />)}
          {q.rewardBrains ? <Brains value={q.rewardBrains} /> : null}
          {q.rewardItem && <span className="text-muted">{q.rewardItem}</span>}
        </span>
      ),
    },
    {
      key: "flags",
      header: "Flags",
      value: (q) => (q.epicEvent ? "epic" : q.seasonal ? "seasonal" : q.reachable ? "core" : ""),
      render: (q) => (
        <div className="flex flex-wrap gap-1">
          {q.tutorialQuest && <Badge>tutorial</Badge>}
          {q.epicEvent && <Badge color="rgb(var(--accent-brain))">epic</Badge>}
          {q.seasonal && <Badge color="rgb(var(--accent-brain))">seasonal</Badge>}
          {!q.reachable && !q.epicEvent && !q.seasonal && <Badge color="rgb(var(--danger))">removed</Badge>}
        </div>
      ),
    },
  ];
}

export function QuestsPage() {
  return (
    <div>
      <PageHeader title="Quests" kicker={`${questsFile.core.length + questsFile.reforged.length} quests`}>
        <p>
          Quests are heavily front-loaded XP — the core chain carries you past level 8 on its own, then becomes rounding error. Brain
          rewards live only on epic-event quests. Two catalogs ship in the data; which the client loads at runtime is unresolved, so both
          are shown.
        </p>
      </PageHeader>

      <Section title={`Core chain (${questsFile.core.length})`}>
        <DataTable
          rows={questsFile.core}
          columns={questColumns()}
          rowKey={(q) => q.id}
          search={(q) => `${q.title} ${q.requirements.map((r) => r.text).join(" ")}`}
          searchPlaceholder="Search quests…"
          toggles={[
            { key: "reachable", label: "Reachable now", predicate: (q) => q.reachable },
            { key: "epic", label: "Epic-event", predicate: (q) => q.epicEvent },
            { key: "reward", label: "Item/zombie reward", predicate: (q) => !!q.rewardItem },
          ]}
          initialSort={{ key: "level", dir: "asc" }}
        />
      </Section>

      <Section title={`Reforged set (${questsFile.reforged.length})`}>
        <DataTable rows={questsFile.reforged} columns={questColumns()} rowKey={(q) => q.id} initialSort={{ key: "level", dir: "asc" }} />
      </Section>

      <Note>Reward type 0 pays XP; other types pay gold or items. <span className="font-mono">rewardBrains</span> appears only in the reforged set.</Note>
    </div>
  );
}
