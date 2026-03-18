import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatXp } from "../lib/chart-utils";
import { getSkillIconUrl } from "../lib/skillIcons";
import type { GameType, HiscoresResponse, SkillData } from "../types/api";

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

/** Build a map of skillName -> SkillData for fast look-up */
function skillMap(skills: SkillData[]): Map<string, SkillData> {
  const m = new Map<string, SkillData>();
  for (const s of skills) m.set(s.name, s);
  return m;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  data,
  accent,
}: {
  data: HiscoresResponse;
  accent: "osrs" | "rs3";
}) {
  const borderColor = accent === "osrs" ? "border-[#5ba3f5]/30" : "border-[#e05c5c]/30";
  const textColor = accent === "osrs" ? "text-[#5ba3f5]" : "text-[#e05c5c]";

  return (
    <Card className={`border-t-2 ${borderColor}`}>
      <CardContent className="pt-4">
        <h3 className={`font-cinzel font-bold text-lg ${textColor}`}>
          {data.player}
        </h3>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-wider">Combat</p>
            <p className="text-lg font-semibold text-[#e0e0e0]">{data.combatLevel}</p>
          </div>
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-wider">Total</p>
            <p className="text-lg font-semibold text-[#e0e0e0]">
              {data.overall?.level?.toLocaleString() ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-wider">Total XP</p>
            <p className="text-lg font-semibold text-[#e0e0e0]">
              {data.overall ? formatXp(data.overall.xp) : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({
  skillName,
  skillA,
  skillB,
  game,
}: {
  skillName: string;
  skillA: SkillData | undefined;
  skillB: SkillData | undefined;
  game: GameType;
}) {
  const levelA = skillA?.level ?? 0;
  const levelB = skillB?.level ?? 0;
  const xpA = skillA?.xp ?? 0;
  const xpB = skillB?.xp ?? 0;
  const maxLevel = Math.max(levelA, levelB, 1);
  const pctA = (levelA / maxLevel) * 100;
  const pctB = (levelB / maxLevel) * 100;

  const iconUrl = getSkillIconUrl(skillName, game);

  return (
    <TableRow>
      {/* Player A stats */}
      <TableCell className="text-right text-[#888888] text-xs w-24 hidden sm:table-cell">
        {formatXp(xpA)}
      </TableCell>
      <TableCell className="text-right font-semibold w-14">
        <span className={levelA > levelB ? "text-[#4ade80]" : levelA < levelB ? "text-[#ef4444]" : "text-[#e0e0e0]"}>
          {levelA}
        </span>
      </TableCell>

      {/* Bar A */}
      <TableCell className="w-28 sm:w-36 px-1">
        <div className="flex justify-end">
          <div className="h-3 rounded-l-sm" style={{
            width: `${pctA}%`,
            backgroundColor: levelA >= levelB ? "#4ade80" : "#ef4444",
            opacity: levelA >= levelB ? 0.8 : 0.4,
            minWidth: levelA > 0 ? "4px" : "0px",
          }} />
        </div>
      </TableCell>

      {/* Skill name + icon */}
      <TableCell className="text-center w-24 px-1">
        <div className="flex items-center justify-center gap-1">
          {iconUrl && (
            <img
              src={iconUrl}
              alt={skillName}
              width={16}
              height={16}
              className="inline-block"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span className="text-xs text-[#e0e0e0] font-medium truncate">{skillName}</span>
        </div>
      </TableCell>

      {/* Bar B */}
      <TableCell className="w-28 sm:w-36 px-1">
        <div className="flex justify-start">
          <div className="h-3 rounded-r-sm" style={{
            width: `${pctB}%`,
            backgroundColor: levelB >= levelA ? "#4ade80" : "#ef4444",
            opacity: levelB >= levelA ? 0.8 : 0.4,
            minWidth: levelB > 0 ? "4px" : "0px",
          }} />
        </div>
      </TableCell>

      {/* Player B stats */}
      <TableCell className="font-semibold w-14">
        <span className={levelB > levelA ? "text-[#4ade80]" : levelB < levelA ? "text-[#ef4444]" : "text-[#e0e0e0]"}>
          {levelB}
        </span>
      </TableCell>
      <TableCell className="text-[#888888] text-xs w-24 hidden sm:table-cell">
        {formatXp(xpB)}
      </TableCell>
    </TableRow>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ComparisonPage() {
  const [game, setGame] = useState<GameType>("osrs");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataA, setDataA] = useState<HiscoresResponse | null>(null);
  const [dataB, setDataB] = useState<HiscoresResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleCompare = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimA = nameA.trim();
      const trimB = nameB.trim();
      if (!trimA || !trimB) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setDataA(null);
      setDataB(null);

      try {
        const [resA, resB] = await Promise.all([
          fetch(`/api/hiscores/${game}/${encodeURIComponent(trimA)}`, {
            signal: controller.signal,
          }),
          fetch(`/api/hiscores/${game}/${encodeURIComponent(trimB)}`, {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        if (resA.status === 404) {
          setError(`Player "${trimA}" not found on ${game.toUpperCase()} hiscores.`);
          return;
        }
        if (resB.status === 404) {
          setError(`Player "${trimB}" not found on ${game.toUpperCase()} hiscores.`);
          return;
        }
        if (!resA.ok || !resB.ok) throw new Error("Failed to fetch hiscores");

        const [jsonA, jsonB]: [HiscoresResponse, HiscoresResponse] = await Promise.all([
          resA.json(),
          resB.json(),
        ]);

        if (controller.signal.aborted) return;

        setDataA(jsonA);
        setDataB(jsonB);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [game, nameA, nameB],
  );

  // Build merged skill list from both players
  const allSkillNames = React.useMemo(() => {
    if (!dataA || !dataB) return [];
    const set = new Set<string>();
    for (const s of dataA.skills) set.add(s.name);
    for (const s of dataB.skills) set.add(s.name);
    return Array.from(set);
  }, [dataA, dataB]);

  const mapA = React.useMemo(() => (dataA ? skillMap(dataA.skills) : new Map()), [dataA]);
  const mapB = React.useMemo(() => (dataB ? skillMap(dataB.skills) : new Map()), [dataB]);

  return (
    <div className="py-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">
          Player Comparison
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Compare two players side-by-side
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </motion.div>

      {/* Search form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCompare} className="space-y-3">
              <GameToggle game={game} onChange={setGame} />

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
                  />
                  <Input
                    type="text"
                    value={nameA}
                    onChange={(e) => setNameA(e.target.value)}
                    placeholder="Player 1..."
                    maxLength={12}
                    className="pl-9"
                  />
                </div>

                <span className="text-[#666666] text-xs font-bold">VS</span>

                <div className="relative flex-1 w-full">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
                  />
                  <Input
                    type="text"
                    value={nameB}
                    onChange={(e) => setNameB(e.target.value)}
                    placeholder="Player 2..."
                    maxLength={12}
                    className="pl-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!nameA.trim() || !nameB.trim() || loading}
                  className="shrink-0"
                >
                  Compare
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <ComparisonSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {dataA && dataB && !loading && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryCard data={dataA} accent="osrs" />
            <SummaryCard data={dataB} accent="rs3" />
          </div>

          {/* Overview bars */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                {
                  label: "Combat Level",
                  valA: dataA.combatLevel,
                  valB: dataB.combatLevel,
                },
                {
                  label: "Total Level",
                  valA: dataA.overall?.level ?? 0,
                  valB: dataB.overall?.level ?? 0,
                },
                {
                  label: "Total XP",
                  valA: dataA.overall?.xp ?? 0,
                  valB: dataB.overall?.xp ?? 0,
                },
              ].map(({ label, valA, valB }) => {
                const maxVal = Math.max(valA, valB, 1);
                return (
                  <div key={label} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-xs text-[#888888] mb-1">
                      <span>
                        {dataA.player}:{" "}
                        <span className="text-[#e0e0e0] font-medium">
                          {label === "Total XP" ? formatXp(valA) : valA.toLocaleString()}
                        </span>
                      </span>
                      <span className="font-medium text-[#e0e0e0]">{label}</span>
                      <span>
                        {dataB.player}:{" "}
                        <span className="text-[#e0e0e0] font-medium">
                          {label === "Total XP" ? formatXp(valB) : valB.toLocaleString()}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="h-full rounded-l-sm"
                          style={{
                            width: `${(valA / maxVal) * 100}%`,
                            backgroundColor: valA >= valB ? "#4ade80" : "#ef4444",
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div className="flex-1 flex justify-start">
                        <div
                          className="h-full rounded-r-sm"
                          style={{
                            width: `${(valB / maxVal) * 100}%`,
                            backgroundColor: valB >= valA ? "#4ade80" : "#ef4444",
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Skill comparison table */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right hidden sm:table-cell">XP</TableHead>
                    <TableHead className="text-right">{dataA.player}</TableHead>
                    <TableHead className="px-1" />
                    <TableHead className="text-center">Skill</TableHead>
                    <TableHead className="px-1" />
                    <TableHead>{dataB.player}</TableHead>
                    <TableHead className="hidden sm:table-cell">XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSkillNames.map((name) => (
                    <ComparisonRow
                      key={name}
                      skillName={name}
                      skillA={mapA.get(name)}
                      skillB={mapB.get(name)}
                      game={game}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {!dataA && !loading && !error && (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c8a84b]/5 mb-4">
            <GitCompareArrows
              size={32}
              className="text-[#c8a84b]/40"
              style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
            />
          </div>
          <p className="text-lg text-[#888888] mb-2">
            Enter two player names to compare
          </p>
          <p className="text-sm text-[#666666]">
            See who has the edge in each skill
          </p>
        </motion.div>
      )}
    </div>
  );
}
