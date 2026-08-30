import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GameIcon } from "./ui/GameIcon";
import { ZombieIcon } from "./ui/ZombieIcon";
import {
  cropByKey,
  cropSlug,
  zombieByKey,
  zombieSlug,
  placeableByKey,
  placeableSlug,
  enemyByKey,
  enemySlug,
  raidById,
  raidSlug,
  epicBossById,
  epicBossSlug,
  boostByKey,
  boostSlug,
  mutationByKey,
} from "../data";

function Chip({ to, icon, children, title }: { to: string; icon?: ReactNode; children: ReactNode; title?: string }) {
  return (
    <Link
      to={to}
      title={title}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary-strong"
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function CropChip({ k }: { k: string }) {
  const c = cropByKey[k];
  if (!c) return <span className="chip">{k}</span>;
  return (
    <Chip to={`/crops/${cropSlug(c)}`} icon={<GameIcon file={c.icon} fallbackFile={c.stage2} alt="" size="xs" fallback="none" />}>
      {c.name}
    </Chip>
  );
}

export function ZombieChip({ k }: { k: string }) {
  const z = zombieByKey[k];
  if (!z) return <span className="chip">{k}</span>;
  return (
    <Chip to={`/zombies/${zombieSlug(z)}`} icon={<ZombieIcon zombie={z} size="xs" />} title={`${z.className} · ${z.group}`}>
      {z.name}
    </Chip>
  );
}

export function PlaceableChip({ k }: { k: string }) {
  const p = placeableByKey[k];
  if (!p) return <span className="chip">{k}</span>;
  return (
    <Chip to={`/placeables/${placeableSlug(p)}`} icon={<GameIcon file={p.sprite} alt="" size="xs" fallback="none" />}>
      {p.name}
    </Chip>
  );
}

export function EnemyChip({ k }: { k: string }) {
  const e = enemyByKey[k];
  if (!e) return <span className="chip">{k}</span>;
  return (
    <Chip to={`/enemies/${enemySlug(e)}`} icon={<GameIcon file={e.icon} alt="" size="xs" />}>
      {e.name}
    </Chip>
  );
}

export function BoostChip({ k }: { k: string }) {
  const b = boostByKey[k];
  if (!b) return <span className="chip">{k}</span>;
  return (
    <Chip to={`/boosts/${boostSlug(b)}`} icon={<GameIcon file={b.icon} alt="" size="xs" fallback="none" />}>
      {b.name}
    </Chip>
  );
}

export function RaidChip({ id }: { id: number }) {
  const r = raidById[String(id)];
  if (!r) return <span className="chip">raid {id}</span>;
  return (
    <Chip to={`/raids/${raidSlug(r)}`} icon={<GameIcon file={r.enemyIcon} alt="" size="xs" fallback="none" />}>
      {r.name}
    </Chip>
  );
}

export function EpicBossChip({ id }: { id: string }) {
  const b = epicBossById[id];
  if (!b) return <span className="chip">{id}</span>;
  return (
    <Chip to={`/epic-bosses/${epicBossSlug(b)}`} icon={<GameIcon file={b.questIcon} alt="" size="xs" fallback="none" />}>
      {b.name}
    </Chip>
  );
}

export function MutationChip({ k }: { k: string }) {
  const m = mutationByKey[k];
  if (!m) return <span className="chip">{k}</span>;
  return (
    <Link to={`/mutations#${m.key}`} className="chip gap-1 hover:border-primary hover:text-primary-strong" title={`${m.slot} slot`}>
      <GameIcon file={m.icon} alt="" size="xs" fallback="none" />
      {m.name}
    </Link>
  );
}
