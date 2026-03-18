import React, { useState } from "react";
import { User } from "lucide-react";

export default function PlayerAvatar({ name, size = 64, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !name) {
    return (
      <div
        className={`rounded-lg bg-white/5 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <User size={size * 0.5} className="text-text-dim" />
      </div>
    );
  }

  return (
    <img
      src={`/api/player/avatar/${encodeURIComponent(name)}`}
      alt={`${name}'s avatar`}
      width={size}
      height={size}
      className={`rounded-lg bg-white/5 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
