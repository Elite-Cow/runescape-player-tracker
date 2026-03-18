import React from "react";
import { Clock } from "lucide-react";

export default function ActivityLog({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-text-muted py-12">
        No recent activity data available.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="divide-y divide-border/50">
        {activities.map((activity, i) => (
          <div
            key={i}
            className={`px-4 py-3 hover:bg-white/[0.04] transition-colors animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded bg-gold/10 shrink-0">
                <Clock size={14} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary">{activity.text}</div>
                {activity.details && (
                  <div className="text-xs text-text-muted mt-0.5">{activity.details}</div>
                )}
                {activity.date && (
                  <div className="text-xs text-text-dim mt-1">{activity.date}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
