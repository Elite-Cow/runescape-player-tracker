import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TrackerPage from "./pages/TrackerPage";
import PlayerLookupPage from "./pages/PlayerLookupPage";
import RecordsPage from "./pages/RecordsPage";
import NewsPage from "./pages/NewsPage";
import GETrackerPage from "./pages/GETrackerPage";
import WikiLookupPage from "./pages/WikiLookupPage";
import ComparisonPage from "./pages/ComparisonPage";
import LeaderboardPage from "./pages/LeaderboardPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/lookup" element={<PlayerLookupPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/ge" element={<GETrackerPage />} />
        <Route path="/wiki" element={<WikiLookupPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </Layout>
  );
}
