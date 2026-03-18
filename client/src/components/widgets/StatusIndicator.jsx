import React from "react";

export default function StatusIndicator({ timestamp }) {
  if (!timestamp) return null;

  const lastUpdate = new Date(timestamp);
  const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
  const isLive = minutesAgo < 10;

  return (
    <div className="bg-bg-card rounded-lg p-5 flex flex-col justify-center items-center gap-3">
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isLive ? "bg-green animate-pulse" : "bg-orange"
          }`}
        />
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
