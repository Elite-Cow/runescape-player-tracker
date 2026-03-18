import React, { useState, useEffect, useMemo } from "react";
import { Crown, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatXp } from "../lib/chart-utils";
import { getSkillIconUrl } from "../lib/skillIcons";
import type { GameType, RankingEntry } from "../types/api";

// ---------------------------------------------------------------------------
// Skill definitions
// ---------------------------------------------------------------------------

interface SkillOption {
  index: number;
  name: string;
}

const SKILLS: SkillOption[] = [
  { index: 0, name: "Overall" },
  { index: 1, name: "Attack" },
  { index: 2, name: "Defence" },
  { index: 3, name: "Strength" },
  { index: 4, name: "Hitpoints" },
  { index: 5, name: "Ranged" },
  { index: 6, name: "Prayer" },
  { index: 7, name: "Magic" },
  { index: 8, name: "Cooking" },
  { index: 9, name: "Woodcutting" },
  { index: 10, name: "Fletching" },
  { index: 11, name: "Fishing" },
  { index: 12, name: "Firemaking" },
  { index: 13, name: "Crafting" },
  { index: 14, name: "Smithing" },
  { index: 15, name: "Mining" },
  { index: 16, name: "Herblore" },
  { index: 17, name: "Agility" },
  { index: 18, name: "Thieving" },
  { index: 19, name: "Slayer" },
  { index: 20, name: "Farming" },
  { index: 21, name: "Runecrafting" },
  { index: 22, name: "Hunter" },
  { index: 23, name: "Construction" },
];

// ---------------------------------------------------------------------------
// Helpers
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

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-lg" role="img" aria-label="Gold medal">🥇</span>;
  }
  if (rank === 2) {
    return <span className="text-lg" role="img" aria-label="Silver medal">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-lg" role="img" aria-label="Bronze medal">🥉</span>;
  }
  return <span className="text-[#888888] text-sm">#{rank}</span>;
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [game, setGame] = useState<GameType>("osrs");
  const [skillIndex, setSkillIndex] = useState(0);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSkill = useMemo(
    () => SKILLS.find((s) => s.index === skillIndex) ?? SKILLS[0],
    [skillIndex],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setEntries([]);

    (async () => {
      try {
        const res = await fetch(
          `/api/hiscores/ranking/${game}?table=${skillIndex}&size=50`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        if (!res.ok) throw new Error("Failed to load rankings");

        const json = await res.json();
        if (controller.signal.aborted) return;

        // Handle error in response body
        if (json.error) {
          setError(json.error);
          setEntries(json.rankings ?? []);
          return;
        }

        // Normalise different response shapes
        const list: RankingEntry[] = Array.isArray(json)
          ? json
          : json.rankings ?? json.content ?? [];

        setEntries(list);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [game, skillIndex]);

  const handleGameChange = (g: GameType) => {
    setGame(g);
    setSkillIndex(0);
  };

  const skillIconUrl = getSkillIconUrl(selectedSkill.name, game);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">
          Leaderboard
        </h1>
        <p className="text-sm text-[#888888] mt-1">Top 50 players by skill</p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 animate-fade-in-up stagger-1">
        <GameToggle game={game} onChange={handleGameChange} />

        <div className="w-56">
          <Select
            value={String(skillIndex)}
            onValueChange={(val) => setSkillIndex(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select skill" />
            </SelectTrigger>
            <SelectContent>
              {SKILLS.map((skill) => (
                <SelectItem key={skill.index} value={String(skill.index)}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active skill badge */}
        <div className="flex items-center gap-2">
          {skillIconUrl && (
            <img
              src={skillIconUrl}
              alt={selectedSkill.name}
              width={20}
              height={20}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <Badge variant="default">{selectedSkill.name}</Badge>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="mb-6 border-[#e05c5c]/30 animate-fade-in">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e05c5c]/10 flex items-center justify-center shrink-0">
              <Trophy size={16} className="text-[#e05c5c]" />
            </div>
            <p className="text-sm text-[#e05c5c]">
              Rankings temporarily unavailable. {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="animate-fade-in-up stagger-2">
          <CardContent className="pt-6">
            <LeaderboardSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <Card className="animate-fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown size={18} className="text-[#c8a84b]" />
              Top {entries.length} - {selectedSkill.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Level</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => {
                  const rank = entry.rank > 0 ? entry.rank : i + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <TableRow
                      key={`${entry.name}-${rank}`}
                      className={isTop3 ? "bg-[#c8a84b]/[0.04]" : ""}
                    >
                      <TableCell className="w-16">
                        <MedalIcon rank={rank} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            isTop3 ? "text-[#c8a84b]" : "text-[#e0e0e0]"
                          }`}
                        >
                          {entry.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {entry.level.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-[#888888]">
                        {formatXp(entry.xp)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c8a84b]/5 mb-4">
            <Crown size={32} className="text-[#c8a84b]/40" />
          </div>
          <p className="text-lg text-[#888888]">No ranking data available</p>
          <p className="text-sm text-[#666666] mt-1">
            The ranking API may not be available for this skill
          </p>
        </div>
      )}
    </div>
  );
}
