import React, { useState } from "react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsCard from "../components/player/PlayerStatsCard";
import SkillsTable from "../components/player/SkillsTable";

export default function PlayerLookupPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(name, game) {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/hiscores/${game}/${encodeURIComponent(name)}`);
      if (res.status === 404) {
        setError(`Player "${name}" not found on ${game.toUpperCase()} hiscores.`);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch hiscores");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold">Player Lookup</h1>
        <p className="text-sm text-text-muted mt-1">
          Search any player's hiscores from OSRS or RS3
        </p>
      </div>

      <div className="mb-6">
        <PlayerSearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-text-muted py-16">
          Fetching hiscores...
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-5">
          <PlayerStatsCard data={data} />
          <SkillsTable skills={data.skills} game={data.game} />
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-text-dim py-20">
          <p className="text-lg mb-2">Search for a player to get started</p>
          <p className="text-sm">Try searching for a well-known player like "Zezima"</p>
        </div>
      )}
    </div>
  );
}
