import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TrackerPage from "./pages/TrackerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PlayerLookupPage from "./pages/PlayerLookupPage";
import RecordsPage from "./pages/RecordsPage";
import NewsPage from "./pages/NewsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/lookup" element={<PlayerLookupPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/news" element={<NewsPage />} />
      </Routes>
    </Layout>
  );
}
