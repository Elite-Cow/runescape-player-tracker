import React from "react";

export default function StatusIndicator({ timestamp }) {
  if (!timestamp) return null;

  const lastUpdate = new Date(timestamp);
  const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
  const isLive = minutesAgo < 10;

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 flex flex-col justify-center items-center gap-3 shadow-md">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-green" : "bg-orange"}`}
            style={isLive ? { boxShadow: "0 0 8px rgba(27,179,124,0.5)" } : { boxShadow: "0 0 8px rgba(255,171,0,0.5)" }}
          />
          {isLive && (
            <div
              className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green"
              style={{ animation: "sonarPing 1.5s ease-out infinite" }}
            />
          )}
        </div>
        <span className={`text-sm font-semibold ${isLive ? "text-green" : "text-orange"}`}>
          {isLive ? "Live" : "Delayed"}
        </span>
      </div>
      <div className="text-xs text-text-muted text-center">
        {minutesAgo < 1
          ? "Updated just now"
          : minutesAgo < 60
            ? `Updated ${minutesAgo}m ago`
            : `Updated ${Math.floor(minutesAgo / 60)}h ago`}
      </div>
      <div className="text-xs text-text-dim text-center">
        {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
