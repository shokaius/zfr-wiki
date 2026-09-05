export interface NavItem {
  label: string;
  to: string;
  icon: string; // game-asset filename (resolved via iconUrl)
  keywords?: string; // extra terms for quick lookup, beyond the label
  iconClass?: string; // optional per-icon tweak (e.g. scale) applied to the img
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** The NavItem whose route matches (used to reuse its icon on page headers). */
export function navItemFor(to: string): NavItem | undefined {
  for (const g of NAV) for (const i of g.items) if (i.to === to) return i;
  return undefined;
}

export const NAV: NavGroup[] = [
  {
    title: "Entities",
    items: [
      { label: "Crops", to: "/crops", icon: "stex0006.png" },
      { label: "Zombies", to: "/zombies", icon: "ZombieActorOldMcZombie.png" },
      { label: "Enemies", to: "/enemies", icon: "FarmStageActorBoss.png" },
      { label: "Placeables", to: "/placeables", icon: "fruitTreeApple.png", iconClass: "scale-90" },
      { label: "Boosts", to: "/boosts", icon: "golden_dice.png" },
      { label: "Mutations", to: "/mutations", icon: "icon_mutation_garlic.png" },
      { label: "Abilities", to: "/abilities", icon: "ability_bash.png" },
    ],
  },
  {
    title: "Systems",
    items: [
      { label: "Raids", to: "/raids", icon: "portrait_pirate.png" },
      { label: "Epic Bosses", to: "/epic-bosses", icon: "epic_dr-groundhog_portrait.png" },
      { label: "Quests", to: "/quests", icon: "Icon_Quest_HarvestZombies.png" },
      { label: "Social", to: "/social", icon: "zombieGift.png", keywords: "friends gifting gift chance odds brains" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Calculator", to: "/calculator", icon: "ability_buffAllStats.png" },
      { label: "Pot Simulator", to: "/pot-simulator", icon: "zombieCombiner.png" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Leveling", to: "/leveling", icon: "topbar_exp_icon.png" },
      { label: "Progression", to: "/progression", icon: "topbar_level_icon.png" },
      { label: "Sources", to: "/about", icon: "main-icon.png" },
    ],
  },
];
