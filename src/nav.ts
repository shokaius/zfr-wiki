export interface NavItem {
  label: string;
  to: string;
  icon: string; // game-asset filename (resolved via iconUrl)
  iconClass?: string; // optional per-icon tweak (e.g. scale) applied to the img
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Entities",
    items: [
      { label: "Crops", to: "/crops", icon: "stex0006.png" },
      { label: "Zombies", to: "/zombies", icon: "ZombieActorOldMcZombie.png" },
      { label: "Enemies", to: "/enemies", icon: "FarmStageActorFarmhand.png" },
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
      { label: "Combining", to: "/combining", icon: "zombieCombiner.png" },
      { label: "Epic Bosses", to: "/epic-bosses", icon: "epic_dr-groundhog_portrait.png" },
      { label: "Quests", to: "/quests", icon: "Icon_Quest_HarvestZombies.png" },
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
