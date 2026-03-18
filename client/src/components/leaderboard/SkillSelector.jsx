import React from "react";
import { getSkillIconUrl } from "../../lib/skillIcons";

const OSRS_SKILLS = [
  "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
  "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
  "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
  "Thieving", "Slayer", "Farming", "Runecrafting", "Hunter", "Construction",
];

const RS3_EXTRA = ["Divination", "Invention", "Archaeology", "Necromancy"];

export default function SkillSelector({ game, selected, onSelect }) {
  const skills = game === "rs3" ? [...OSRS_SKILLS, ...RS3_EXTRA] : OSRS_SKILLS;

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill, i) => {
        const active = selected === i;
        const icon = getSkillIconUrl(skill, game);
        return (
          <button
            key={skill}
            onClick={() => onSelect(i)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${active
                ? "text-bg-dark"
                : "bg-bg-card text-text-muted hover:text-text-primary hover:bg-white/5"
              }
            `}
            style={active ? {
              background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
              boxShadow: "0 0 10px rgba(200,168,75,0.2)",
            } : undefined}
            title={skill}
          >
            {icon && <img src={icon} alt="" width={14} height={14} className="shrink-0" loading="lazy" />}
            <span className="hidden sm:inline">{skill}</span>
          </button>
        );
      })}
    </div>
  );
}
