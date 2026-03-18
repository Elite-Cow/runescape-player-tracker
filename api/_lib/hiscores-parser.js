// Skill names in the order they appear in the hiscores CSV
const OSRS_SKILLS = [
  "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
  "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
  "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
  "Thieving", "Slayer", "Farming", "Runecraft", "Hunter", "Construction",
];

const RS3_SKILLS = [
  ...OSRS_SKILLS,
  "Divination", "Invention", "Archaeology", "Necromancy",
];

// Activities/minigames that follow skills in the CSV (OSRS)
const OSRS_ACTIVITIES = [
  "League Points", "Deadman Points", "Bounty Hunter - Hunter",
  "Bounty Hunter - Rogue", "Bounty Hunter (Legacy) - Hunter",
  "Bounty Hunter (Legacy) - Rogue", "Clue Scrolls (all)",
  "Clue Scrolls (beginner)", "Clue Scrolls (easy)", "Clue Scrolls (medium)",
  "Clue Scrolls (hard)", "Clue Scrolls (elite)", "Clue Scrolls (master)",
  "LMS - Rank", "PvP Arena - Rank", "Soul Wars Zeal", "Rifts closed",
  "Colosseum Glory",
];

/**
 * Parse the CSV response from Jagex hiscores API.
 * Each line: rank,level,xp (for skills) or rank,score (for activities)
 */
function parseHiscores(csv, game) {
  const lines = csv.trim().split("\n");
  const skills = game === "osrs" ? OSRS_SKILLS : RS3_SKILLS;
  const result = { skills: [], activities: [] };

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(",").map(Number);
    if (parts.some(isNaN)) continue;

    if (i < skills.length) {
      // Skill entry: rank, level, xp
      const [rank, level, xp] = parts;
      result.skills.push({
        name: skills[i],
        rank: rank === -1 ? null : rank,
        level,
        xp: xp === -1 ? 0 : xp,
      });
    } else if (game === "osrs" && i - skills.length < OSRS_ACTIVITIES.length) {
      // Activity entry: rank, score
      const [rank, score] = parts;
      result.activities.push({
        name: OSRS_ACTIVITIES[i - skills.length],
        rank: rank === -1 ? null : rank,
        score: score === -1 ? 0 : score,
      });
    }
  }

  return result;
}

/**
 * Compute combat level from skill levels.
 * OSRS formula.
 */
function computeCombatLevel(skills) {
  const get = (name) => {
    const s = skills.find((s) => s.name === name);
    return s ? s.level : 1;
  };

  const attack = get("Attack");
  const strength = get("Strength");
  const defence = get("Defence");
  const hitpoints = get("Hitpoints");
  const prayer = get("Prayer");
  const ranged = get("Ranged");
  const magic = get("Magic");

  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * Math.floor((ranged * 3) / 2);
  const mage = 0.325 * Math.floor((magic * 3) / 2);

  return Math.floor(base + Math.max(melee, range, mage));
}

module.exports = { parseHiscores, computeCombatLevel };
