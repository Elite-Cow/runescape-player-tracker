// Player count data
export interface PlayerCountData {
  timestamp: string;
  total_players: number;
  osrs: number;
  rs3: number;
}

export interface HistoryPoint {
  timestamp: string;
  total_players: number;
  osrs: number;
  rs3: number;
}

export interface AvailabilityMap {
  "24h": boolean;
  "7d": boolean;
  "30d": boolean;
  "6m": boolean;
  "1y": boolean;
  all: boolean;
}

export type TimeRange = "24h" | "7d" | "30d" | "6m" | "1y" | "all";

// Records
export interface RecordEntry {
  timestamp: string;
  total_players: number;
  osrs: number;
  rs3: number;
}

export interface RecordsResponse {
  peaks: { total: RecordEntry; osrs: RecordEntry; rs3: RecordEntry };
  lows: { total: RecordEntry; osrs: RecordEntry; rs3: RecordEntry };
  delta24h: { total: number; osrs: number; rs3: number };
}

export interface DailyRecord {
  _id: string;
  date: string;
  peakTotal: number;
  lowTotal: number;
  avgTotal: number;
  peakOsrs: number;
  lowOsrs: number;
  avgOsrs: number;
  peakRs3: number;
  lowRs3: number;
  avgRs3: number;
}

// Sparkline
export interface SparklinePoint {
  timestamp: string;
  total_players: number;
  osrs: number;
  rs3: number;
}

// Player / Hiscores
export type GameType = "osrs" | "rs3";

export interface SkillData {
  name: string;
  rank: number;
  level: number;
  xp: number;
}

export interface ActivityData {
  name: string;
  rank: number;
  score: number;
}

export interface HiscoresResponse {
  player: string;
  game: GameType;
  overall: SkillData | null;
  combatLevel: number;
  skills: SkillData[];
  activities: ActivityData[];
}

export interface RankingEntry {
  name: string;
  rank: number;
  level: number;
  xp: number;
}

export interface RankingResponse {
  error?: string;
  rankings?: RankingEntry[];
}

// RuneMetrics (RS3)
export interface RuneMetricsProfile {
  name: string;
  rank?: string;
  totalskill?: number;
  totalxp?: number;
  combatlevel?: number;
  activities?: RuneMetricsActivity[];
  skillvalues?: RuneMetricsSkillValue[];
  loggedIn?: string;
  error?: string;
}

export interface RuneMetricsActivity {
  date: string;
  details: string;
  text: string;
}

export interface RuneMetricsSkillValue {
  level: number;
  xp: number;
  rank: number;
  id: number;
}

export interface RuneMetricsQuest {
  title: string;
  status: string;
  difficulty: number;
  members: boolean;
  questPoints: number;
  userEligible: boolean;
}

// GE (Grand Exchange)
export interface GEItemOSRS {
  id: number;
  name: string;
  examine: string;
  members: boolean;
  lowalch: number | null;
  highalch: number | null;
  limit: number | null;
  icon: string;
  high: number | null;
  low: number | null;
  highTime: number | null;
  lowTime: number | null;
}

export interface GESearchResponseOSRS {
  items: GEItemOSRS[];
  total: number;
}

export interface GETimeseriesPoint {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number;
  lowPriceVolume: number;
}

export interface GETimeseriesResponse {
  data: GETimeseriesPoint[];
}

// RS3 legacy GE format
export interface GEItemRS3Legacy {
  icon: string;
  icon_large: string;
  id: number;
  type: string;
  typeIcon: string;
  name: string;
  description: string;
  current: { trend: string; price: string | number };
  today: { trend: string; price: string | number };
  day30?: { trend: string; change: string };
  day90?: { trend: string; change: string };
  day180?: { trend: string; change: string };
  members: string;
}

// Wiki
export interface WikiSearchResult {
  title: string;
  url: string;
}

export interface WikiPage {
  title: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  fullurl?: string;
}

// News
export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
  source: string;
  game: "rs3" | "osrs" | "both";
  type: "official" | "youtube" | "reddit";
}
