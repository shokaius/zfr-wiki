// Icons are copied (flattened) into public/game-assets/all/<basename> by the
// extractor. BASE_URL is "/" in dev and "./" for the GitHub Pages build.

const BASE = import.meta.env?.BASE_URL ?? "./";
const DIR = `${BASE}game-assets/all/`;

function leaf(file: string): string {
  const i = file.lastIndexOf("/");
  return i >= 0 ? file.slice(i + 1) : file;
}

export function iconUrl(file: string | null | undefined): string | null {
  if (!file || !file.trim()) return null;
  return `${DIR}${leaf(file.trim())}`;
}

export const CURRENCY_ICON = {
  gold: "topbar_money_icon.png",
  brains: "topbar_brain_icon.png",
  xp: "topbar_exp_icon.png",
  level: "topbar_level_icon.png",
  zombie: "topbar_zombie_icon.png",
} as const;

export function currencyIcon(kind: keyof typeof CURRENCY_ICON): string {
  return `${DIR}${CURRENCY_ICON[kind]}`;
}

export function genericZombieIcon(): string {
  return `${DIR}${CURRENCY_ICON.zombie}`;
}
