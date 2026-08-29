export interface NavItem {
  label: string;
  to: string;
  icon: string; // emoji marker, kept subtle
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Entities",
    items: [
      { label: "Crops", to: "/crops", icon: "🌱" },
      { label: "Zombies", to: "/zombies", icon: "🧟" },
      { label: "Enemies", to: "/enemies", icon: "👤" },
      { label: "Placeables", to: "/placeables", icon: "🏠" },
      { label: "Boosts", to: "/boosts", icon: "⚡" },
      { label: "Mutations", to: "/mutations", icon: "🧬" },
      { label: "Abilities", to: "/abilities", icon: "✦" },
    ],
  },
  {
    title: "Systems",
    items: [
      { label: "Raids", to: "/raids", icon: "⚔" },
      { label: "Combat", to: "/combat", icon: "🎯" },
      { label: "Combining", to: "/combining", icon: "⚗" },
      { label: "Epic Bosses", to: "/epic-bosses", icon: "👑" },
      { label: "Quests", to: "/quests", icon: "📜" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Economy", to: "/economy", icon: "💰" },
      { label: "Progression", to: "/progression", icon: "📈" },
      { label: "Sources", to: "/about", icon: "❋" },
    ],
  },
];
