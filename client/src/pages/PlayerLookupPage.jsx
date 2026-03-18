import React, { useState } from "react";
import { Search, User, Swords, ScrollText, Clock, TrendingUp } from "lucide-react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerProfileCard from "../components/player/PlayerProfileCard";
import SkillsTable from "../components/player/SkillsTable";
import ActivityLog from "../components/player/ActivityLog";
import QuestProgress from "../components/player/QuestProgress";
import MonthlyXPChart from "../components/player/MonthlyXPChart";
import LoadingSpinner from "../components/common/LoadingSpinner";

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "skills", label: "Skills", icon: Swords },
  { key: "quests", label: "Quests", icon: ScrollText, rs3Only: true },
  { key: "activity", label: "Activity", icon: Clock, rs3Only: true },
  { key: "xp", label: "XP Gains", icon: TrendingUp, rs3Only: true },
];

export default function PlayerLookupPage() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [quests, setQuests] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentGame, setCurrentGame] = useState("osrs");

  async function handleSearch(name, game) {
    setLoading(true);
    setError(null);
    setData(null);
    setProfile(null);
    setQuests(null);
    setActiveTab("overview");
    setCurrentGame(game);

    try {
      // Always fetch hiscores
      const hiscoresPromise = fetch(`/api/hiscores/${game}/${encodeURIComponent(name)}`);

      // For RS3, also fetch RuneMetrics profile and quests
      const extraPromises = game === "rs3" ? [
        fetch(`/api/runemetrics/profile/${encodeURIComponent(name)}`).catch(() => null),
        fetch(`/api/runemetrics/quests/${encodeURIComponent(name)}`).catch(() => null),
      ] : [];

      const [hiscoresRes, ...extraRes] = await Promise.all([hiscoresPromise, ...extraPromises]);

      if (hiscoresRes.status === 404) {
        setError(`Player "${name}" not found on ${game.toUpperCase()} hiscores.`);
        return;
      }
      if (!hiscoresRes.ok) throw new Error("Failed to fetch hiscores");

      setData(await hiscoresRes.json());

      // Process RS3 extras
      if (game === "rs3") {
        if (extraRes[0]?.ok) {
          const profileData = await extraRes[0].json();
          if (!profileData.error) setProfile(profileData);
        }
        if (extraRes[1]?.ok) {
          const questData = await extraRes[1].json();
          if (!questData.error) setQuests(questData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const visibleTabs = TABS.filter((t) => !t.rs3Only || currentGame === "rs3");

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Player Lookup</h1>
        <p className="text-sm text-text-muted mt-1">
          Search any player's hiscores, quests, and activity
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      <div className="mb-6 glass rounded-lg p-4 animate-fade-in-up stagger-1">
        <PlayerSearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner className="py-16" />}

      {data && (
        <div className="animate-fade-in-up">
          {/* Profile Card */}
          <div className="mb-5">
            <PlayerProfileCard data={data} profile={profile} game={currentGame} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
            {visibleTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${activeTab === key
                    ? "text-bg-dark"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }
                `}
                style={activeTab === key ? {
                  background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
                  boxShadow: "0 0 12px rgba(200,168,75,0.2)",
                } : undefined}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="animate-fade-in">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <SkillsTable skills={data.skills} game={data.game} />
              </div>
            )}

            {activeTab === "skills" && (
              <SkillsTable skills={data.skills} game={data.game} />
            )}

            {activeTab === "quests" && currentGame === "rs3" && (
              <QuestProgress quests={quests} />
            )}

            {activeTab === "activity" && currentGame === "rs3" && (
              <ActivityLog activities={profile?.activities || []} />
            )}

            {activeTab === "xp" && currentGame === "rs3" && (
              <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-lg">
                <h3 className="font-cinzel text-base font-semibold text-text-primary mb-4">
                  Monthly XP Gains
                </h3>
                <MonthlyXPChart playerName={data.player} skillId={0} />
              </div>
            )}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/5 mb-4">
            <Search size={32} className="text-gold/40" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
          </div>
          <p className="text-lg text-text-muted mb-2">Search for a player to get started</p>
          <p className="text-sm text-text-dim">Try searching for a well-known player like "Zezima"</p>
        </div>
      )}
    </div>
  );
}
