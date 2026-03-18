import type { GameType } from "../types/api";

const OSRS_WIKI = "https://oldschool.runescape.wiki/images";
const RS3_WIKI = "https://runescape.wiki/images";

const SKILL_ICON_NAMES: Record<string, string> = {
  Attack: "Attack",
  Defence: "Defence",
  Strength: "Strength",
  Hitpoints: "Hitpoints",
  Ranged: "Ranged",
  Prayer: "Prayer",
  Magic: "Magic",
  Cooking: "Cooking",
  Woodcutting: "Woodcutting",
  Fletching: "Fletching",
  Fishing: "Fishing",
  Firemaking: "Firemaking",
  Crafting: "Crafting",
  Smithing: "Smithing",
  Mining: "Mining",
  Herblore: "Herblore",
  Agility: "Agility",
  Thieving: "Thieving",
  Slayer: "Slayer",
  Farming: "Farming",
  Runecrafting: "Runecrafting",
  Hunter: "Hunter",
  Construction: "Construction",
  Divination: "Divination",
  Invention: "Invention",
  Archaeology: "Archaeology",
  Necromancy: "Necromancy",
  Overall: "Skills",
};

export function getSkillIconUrl(skillName: string, game: GameType = "osrs"): string | null {
  const mapped = SKILL_ICON_NAMES[skillName];
  if (!mapped) return null;
  const base = game === "osrs" ? OSRS_WIKI : RS3_WIKI;
  return `${base}/${mapped}_icon.png`;
}

const SKILL_COLORS: Record<string, string> = {
  Attack: "#9b1c1c",
  Defence: "#6b8cce",
  Strength: "#00b300",
  Hitpoints: "#c23636",
  Ranged: "#408040",
  Prayer: "#ffe066",
  Magic: "#6666cc",
  Cooking: "#8b4513",
  Woodcutting: "#2d5a27",
  Fletching: "#004d40",
  Fishing: "#4682b4",
  Firemaking: "#ff8c00",
  Crafting: "#8b6914",
  Smithing: "#5c5c5c",
  Mining: "#7b6c4a",
  Herblore: "#006400",
  Agility: "#36365e",
  Thieving: "#8b008b",
  Slayer: "#4a4a4a",
  Farming: "#228b22",
  Runecrafting: "#cc9900",
  Hunter: "#654321",
  Construction: "#b8860b",
  Divination: "#9370db",
  Invention: "#ffd700",
  Archaeology: "#cd853f",
  Necromancy: "#2f4f4f",
  Overall: "#c8a84b",
};

export function getSkillColor(skillName: string): string {
  return SKILL_COLORS[skillName] || "#888888";
}
