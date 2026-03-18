import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";

export default function QuestProgress({ quests }) {
  if (!quests || !quests.quests) {
    return (
      <div className="text-center text-text-muted py-12">
        Quest data not available for this player.
      </div>
    );
  }

  const list = quests.quests;
  const completed = list.filter((q) => q.status === "COMPLETED").length;
  const started = list.filter((q) => q.status === "STARTED").length;
  const notStarted = list.filter((q) => q.status === "NOT_STARTED").length;
  const total = list.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-cinzel text-base font-semibold text-text-primary">Quest Progress</h3>
          <span className="text-sm font-bold text-gold">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #c8a84b, #e8c86b)",
              boxShadow: "0 0 8px rgba(200,168,75,0.3)",
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-lg bg-green/5">
            <CheckCircle size={16} className="text-green mx-auto mb-1" />
            <div className="text-lg font-bold text-green">{completed}</div>
            <div className="text-[10px] text-text-dim uppercase">Complete</div>
          </div>
          <div className="p-2 rounded-lg bg-orange/5">
            <Clock size={16} className="text-orange mx-auto mb-1" />
            <div className="text-lg font-bold text-orange">{started}</div>
            <div className="text-[10px] text-text-dim uppercase">Started</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <Circle size={16} className="text-text-dim mx-auto mb-1" />
            <div className="text-lg font-bold text-text-secondary">{notStarted}</div>
            <div className="text-[10px] text-text-dim uppercase">Not Started</div>
          </div>
        </div>
      </div>

      {/* Quest list */}
      <QuestList quests={list} />
    </div>
  );
}

function QuestList({ quests }) {
  const [filter, setFilter] = React.useState("all");
  const [sortField, setSortField] = React.useState("title");
  const [sortDir, setSortDir] = React.useState("asc");

  const filtered = quests.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    if (typeof av === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const statusIcon = (status) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle size={14} className="text-green" />;
      case "STARTED": return <Clock size={14} className="text-orange" />;
      default: return <Circle size={14} className="text-text-dim" />;
    }
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "COMPLETED", label: "Complete" },
    { key: "STARTED", label: "Started" },
    { key: "NOT_STARTED", label: "Not Started" },
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
              ${filter === key
                ? "text-bg-dark"
                : "bg-transparent text-text-muted hover:text-text-primary"
              }
            `}
            style={filter === key ? {
              background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
            } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-border/30">
        {sorted.map((quest) => (
          <div
            key={quest.title}
            className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
          >
            {statusIcon(quest.status)}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-primary truncate">{quest.title}</div>
              {quest.difficulty != null && (
                <div className="text-[10px] text-text-dim uppercase">
                  Difficulty: {quest.difficulty} {quest.members ? "| Members" : "| Free"}
                </div>
              )}
            </div>
            {quest.questPoints != null && (
              <div className="text-xs text-gold font-semibold shrink-0">{quest.questPoints} QP</div>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center text-text-muted py-8 text-sm">No quests match this filter.</div>
        )}
      </div>
    </div>
  );
}
