import { Link } from "react-router-dom";
import { NAV } from "../nav";
import { GAME } from "../lib/gameMeta";
import { crops, zombies, raids, placeables, mutations, enemies, epicBosses, boosts } from "../data";

const COUNTS: { label: string; value: number; to: string }[] = [
  { label: "Crops", value: crops.length, to: "/crops" },
  { label: "Zombies", value: zombies.length, to: "/zombies" },
  { label: "Mutations", value: mutations.length, to: "/mutations" },
  { label: "Raids", value: raids.length, to: "/raids" },
  { label: "Enemies", value: enemies.length, to: "/enemies" },
  { label: "Placeables", value: placeables.length, to: "/placeables" },
  { label: "Boosts", value: boosts.length, to: "/boosts" },
  { label: "Epic Bosses", value: epicBosses.length, to: "/epic-bosses" },
];

export function Home() {
  return (
    <div>
      <section className="mb-8 rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary-strong">Zombie Farm 2 Reforged</div>
        <h1 className="mt-1 max-w-2xl font-display text-3xl font-bold sm:text-4xl">A reference wiki that reads the game's own code.</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Every number here is computed from the{" "}
          <a href={GAME.repoUrl} target="_blank" rel="noreferrer">
            ZF2R source
          </a>{" "}
          at commit <span className="font-mono">{GAME.gameCommitShort}</span> — no hand-transcribed tables, so a balance patch shows
          up here as a diff rather than drift. Derived values expand to reveal their formula and link to the exact source symbol.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/progression" className="btn btn-active">
            What unlocks at each level →
          </Link>
          <Link to="/raids" className="btn">
            Raid rewards & EV
          </Link>
          <Link to="/mutations" className="btn">
            Mutation catalog
          </Link>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COUNTS.map((c) => (
          <Link key={c.to} to={c.to} className="card p-4 transition-colors hover:border-primary">
            <div className="tabular text-2xl font-bold text-primary-strong">{c.value}</div>
            <div className="text-sm text-muted">{c.label}</div>
          </Link>
        ))}
      </div>

      {NAV.map((group) => (
        <section key={group.title} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{group.title}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.items.map((item) => (
              <Link key={item.to} to={item.to} className="card flex items-center gap-2 p-3 text-sm hover:border-primary">
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
