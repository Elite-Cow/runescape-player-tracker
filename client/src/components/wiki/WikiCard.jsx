import React from "react";
import { ExternalLink } from "lucide-react";

export default function WikiCard({ title, extract, thumbnail, game }) {
  const wikiBase = game === "osrs"
    ? "https://oldschool.runescape.wiki/w/"
    : "https://runescape.wiki/w/";

  const url = `${wikiBase}${encodeURIComponent(title.replace(/ /g, "_"))}`;

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="p-5 flex gap-4 flex-1">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title}
            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-black/20"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gold mb-1 truncate">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
            {extract || "No description available."}
          </p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gold font-semibold no-underline hover:underline group"
        >
          View on Wiki
          <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
