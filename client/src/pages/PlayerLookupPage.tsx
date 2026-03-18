import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Swords, ScrollText, Clock, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import MonthlyXPChart from "../components/player/MonthlyXPChart";
import { formatXp, formatCount } from "../lib/chart-utils";
import { getSkillIconUrl } from "../lib/skillIcons";
import type {
  GameType,
  HiscoresResponse,
  SkillData,
  RuneMetricsProfile,
  RuneMetricsQuest,
  RuneMetricsActivity,
} from "../types/api";

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SkillSortKey = "name" | "level" | "xp" | "rank";
type SortDir = "asc" | "desc";

function compareSkills(a: SkillData, b: SkillData, key: SkillSortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case "name":
      cmp = a.name.localeCompare(b.name);
      break;
    case "level":
      cmp = a.level - b.level;
      break;
    case "xp":
      cmp = a.xp - b.xp;
      break;
    case "rank":
      cmp = a.rank - b.rank;
      break;
  }
  return dir === "asc" ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GameToggle({
  game,
  onChange,
}: {
  game: GameType;
  onChange: (g: GameType) => void;
}) {
  return (
    <div className="flex rounded-full overflow-hidden border border-[#1a2048] w-fit">
      {(["osrs", "rs3"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
            game === g
              ? g === "osrs"
                ? "text-white"
                : "text-[#080d1f]"
              : "bg-transparent text-[#888888] hover:text-[#e0e0e0]"
          }`}
          style={
            game === g
              ? {
                  background:
                    g === "osrs"
                      ? "linear-gradient(135deg, #5ba3f5, #7bb8ff)"
                      : "linear-gradient(135deg, #c8a84b, #e8c86b)",
                }
              : undefined
          }
        >
          {g.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({
  hiscores,
  profile,
  game,
}: {
  hiscores: HiscoresResponse;
  profile: RuneMetricsProfile | null;
  game: GameType;
}) {
  const displayName = profile?.name ?? hiscores.player;
  const combatLevel = profile?.combatlevel ?? hiscores.combatLevel;
  const totalLevel = profile?.totalskill ?? hiscores.overall?.level ?? 0;
  const totalXp = profile?.totalxp ?? hiscores.overall?.xp ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Avatar + name card */}
      <Card className="md:col-span-1">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          {game === "rs3" ? (
            <img
              src={`/api/player/avatar/${encodeURIComponent(displayName)}`}
              alt={displayName}
              className="w-24 h-24 rounded-full border-2 border-[#c8a84b]/40 mb-3 bg-black/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-[#5ba3f5]/30 mb-3 bg-[#0a1028] flex items-center justify-center">
              <User size={40} className="text-[#5ba3f5]/50" />
            </div>
          )}
          <h2 className="font-cinzel text-xl font-bold text-white">{displayName}</h2>
          <Badge variant={game === "osrs" ? "osrs" : "rs3"} className="mt-2">
            {game.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Stats Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Combat</p>
              <p className="text-2xl font-bold text-[#c8a84b]">{combatLevel}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Total Level</p>
              <p className="text-2xl font-bold text-[#c8a84b]">{totalLevel.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Total XP</p>
              <p className="text-2xl font-bold text-[#c8a84b]">{formatXp(totalXp)}</p>
            </div>
          </div>

          {profile?.rank && (
            <div className="mt-4 text-center">
              <p className="text-xs text-[#888888]">
                Overall Rank: <span className="text-[#e0e0e0] font-medium">#{Number(profile.rank).toLocaleString()}</span>
              </p>
            </div>
          )}

          {profile?.loggedIn && (
            <div className="mt-2 text-center">
              <Badge variant="outline">{profile.loggedIn === "true" ? "Online" : "Offline"}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SkillsTab({
  skills,
  game,
}: {
  skills: SkillData[];
  game: GameType;
}) {
  const [sortKey, setSortKey] = useState<SkillSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SkillSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortedSkills = React.useMemo(
    () => [...skills].sort((a, b) => compareSkills(a, b, sortKey, sortDir)),
    [skills, sortKey, sortDir],
  );

  const arrow = (key: SkillSortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u25B2" : " \u25BC") : "";

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Skill{arrow("name")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("level")}
              >
                Level{arrow("level")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("xp")}
              >
                XP{arrow("xp")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("rank")}
              >
                Rank{arrow("rank")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSkills.map((skill) => {
              const iconUrl = getSkillIconUrl(skill.name, game);
              const isMaxed = skill.level >= 99;
              return (
                <TableRow key={skill.name}>
                  <TableCell className="w-10 pr-0">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={skill.name}
                        width={20}
                        height={20}
                        className="inline-block"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="inline-block w-5 h-5 bg-[#1a2048] rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      isMaxed ? "text-[#c8a84b]" : ""
                    }`}
                  >
                    {skill.level}
                    {isMaxed && (
                      <span className="ml-1 text-xs text-[#c8a84b]/60">MAX</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatXp(skill.xp)}</TableCell>
                  <TableCell className="text-right text-[#888888]">
                    {skill.rank > 0 ? `#${skill.rank.toLocaleString()}` : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function QuestsTab({ quests }: { quests: RuneMetricsQuest[] | null }) {
  if (!quests || quests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-[#888888]">
          No quest data available for this player.
        </CardContent>
      </Card>
    );
  }

  const completed = quests.filter((q) => q.status === "COMPLETED");
  const started = quests.filter((q) => q.status === "STARTED");
  const notStarted = quests.filter(
    (q) => q.status !== "COMPLETED" && q.status !== "STARTED",
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#4ade80]">{completed.length}</p>
            <p className="text-xs text-[#888888] mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#ffab00]">{started.length}</p>
            <p className="text-xs text-[#888888] mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#888888]">{notStarted.length}</p>
            <p className="text-xs text-[#888888] mt-1">Not Started</p>
          </CardContent>
        </Card>
      </div>

      {/* Quest list */}
      <Card>
        <CardHeader>
          <CardTitle>All Quests ({quests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto space-y-1">
            {quests.map((q) => (
              <div
                key={q.title}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#1a2048]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      q.status === "COMPLETED"
                        ? "bg-[#4ade80]"
                        : q.status === "STARTED"
                          ? "bg-[#ffab00]"
                          : "bg-[#666666]"
                    }`}
                  />
                  <span className="text-sm">{q.title}</span>
                  {q.members && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      P2P
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-[#888888]">
                  {q.questPoints > 0 && `${q.questPoints} QP`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityTab({ activities }: { activities: RuneMetricsActivity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-[#888888]">
          No recent activity found for this player.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.map((activity, i) => (
            <div
              key={`${activity.date}-${i}`}
              className="flex items-start gap-3 py-2 px-2 rounded hover:bg-[#1a2048]/30 transition-colors"
            >
              <Clock size={14} className="text-[#888888] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-[#e0e0e0]">{activity.text}</p>
                <p className="text-xs text-[#666666] mt-0.5">{activity.date}</p>
                {activity.details && (
                  <p className="text-xs text-[#888888] mt-0.5">{activity.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function XPGainsTab({ playerName }: { playerName: string }) {
  const [xpData, setXpData] = useState<{ month: string; xp: number }[] | null>(null);
  const [xpLoading, setXpLoading] = useState(false);
  const [xpError, setXpError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  React.useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    setXpLoading(true);
    setXpError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/runemetrics/xp/${encodeURIComponent(playerName)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Failed to fetch XP data");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setXpData(json.monthlyXp ?? json.data ?? json);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setXpError(err instanceof Error ? err.message : "Failed to load XP data");
      } finally {
        setXpLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [playerName]);

  if (xpLoading) return <LoadingSpinner className="py-12" />;
  if (xpError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-[#888888]">{xpError}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly XP Gains</CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyXPChart data={xpData ?? []} skillName="Total XP" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LookupSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-52 md:col-span-2" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PlayerLookupPage() {
  const [game, setGame] = useState<GameType>("osrs");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hiscores, setHiscores] = useState<HiscoresResponse | null>(null);
  const [profile, setProfile] = useState<RuneMetricsProfile | null>(null);
  const [quests, setQuests] = useState<RuneMetricsQuest[] | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = playerName.trim();
      if (!trimmed) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setHiscores(null);
      setProfile(null);
      setQuests(null);

      try {
        const encoded = encodeURIComponent(trimmed);

        // Fetch hiscores (always)
        const hiscoresPromise = fetch(`/api/hiscores/${game}/${encoded}`, {
          signal: controller.signal,
        });

        // RS3 extras
        const extraPromises =
          game === "rs3"
            ? [
                fetch(`/api/runemetrics/profile/${encoded}`, {
                  signal: controller.signal,
                }).catch(() => null),
                fetch(`/api/runemetrics/quests/${encoded}`, {
                  signal: controller.signal,
                }).catch(() => null),
              ]
            : [];

        const [hiscoresRes, ...extraRes] = await Promise.all([
          hiscoresPromise,
          ...extraPromises,
        ]);

        if (controller.signal.aborted) return;

        if (hiscoresRes.status === 404) {
          setError(
            `Player "${trimmed}" not found on ${game.toUpperCase()} hiscores.`,
          );
          return;
        }
        if (!hiscoresRes.ok) throw new Error("Failed to fetch hiscores");

        const hiscoresData: HiscoresResponse = await hiscoresRes.json();
        if (controller.signal.aborted) return;
        setHiscores(hiscoresData);

        // Process RS3 extras
        if (game === "rs3") {
          const profileRes = extraRes[0] as Response | null;
          const questsRes = extraRes[1] as Response | null;

          if (profileRes?.ok) {
            const profileData: RuneMetricsProfile = await profileRes.json();
            if (!profileData.error) setProfile(profileData);
          }
          if (questsRes?.ok) {
            const questData = await questsRes.json();
            if (!questData.error) {
              // quests may come as { quests: [...] } or as array
              setQuests(Array.isArray(questData) ? questData : questData.quests ?? null);
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [game, playerName],
  );

  const isRs3 = game === "rs3";

  return (
    <div className="py-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">
          Player Lookup
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Search any player's hiscores, quests, and activity
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </motion.div>

      {/* Search form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      >
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-3">
              <GameToggle game={game} onChange={setGame} />

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
                  />
                  <Input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    maxLength={12}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={!playerName.trim() || loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-[#e05c5c]/10 border border-[#e05c5c]/30 rounded-lg p-4 text-[#e05c5c] text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <LookupSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {hiscores && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Tabs defaultValue="overview">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="overview">
                  <User size={14} className="mr-1.5 inline-block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="skills">
                  <Swords size={14} className="mr-1.5 inline-block" />
                  Skills
                </TabsTrigger>
                {isRs3 && (
                  <TabsTrigger value="quests">
                    <ScrollText size={14} className="mr-1.5 inline-block" />
                    Quests
                  </TabsTrigger>
                )}
                {isRs3 && (
                  <TabsTrigger value="activity">
                    <Clock size={14} className="mr-1.5 inline-block" />
                    Activity
                  </TabsTrigger>
                )}
                {isRs3 && (
                  <TabsTrigger value="xp">
                    <TrendingUp size={14} className="mr-1.5 inline-block" />
                    XP Gains
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab hiscores={hiscores} profile={profile} game={game} />
              </TabsContent>

              <TabsContent value="skills">
                <SkillsTab skills={hiscores.skills} game={game} />
              </TabsContent>

              {isRs3 && (
                <TabsContent value="quests">
                  <QuestsTab quests={quests} />
                </TabsContent>
              )}

              {isRs3 && (
                <TabsContent value="activity">
                  <ActivityTab activities={profile?.activities ?? []} />
                </TabsContent>
              )}

              {isRs3 && (
                <TabsContent value="xp">
                  <XPGainsTab playerName={hiscores.player} />
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!hiscores && !loading && !error && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c8a84b]/5 mb-4">
              <Search
                size={32}
                className="text-[#c8a84b]/40"
                style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
              />
            </div>
            <p className="text-lg text-[#888888] mb-2">
              Search for a player to get started
            </p>
            <p className="text-sm text-[#666666]">
              Try searching for a well-known player like "Zezima"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
