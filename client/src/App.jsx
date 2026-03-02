import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";
import NewsPage from "./pages/NewsPage";

const navStyles = {
  nav: {
    background: "#111",
    borderBottom: "1px solid #222",
    padding: "0 16px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    height: "52px",
    gap: "28px",
  },
  brand: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#c8a84b",
    textDecoration: "none",
    marginRight: "4px",
  },
  link: (active) => ({
    fontSize: "14px",
    fontWeight: active ? "600" : "400",
    color: active ? "#c8a84b" : "#666",
    textDecoration: "none",
    paddingBottom: "3px",
    borderBottom: active ? "2px solid #c8a84b" : "2px solid transparent",
  }),
};

function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav style={navStyles.nav}>
      <div style={navStyles.inner}>
        <Link to="/" style={navStyles.brand}>RS Tracker</Link>
        <Link to="/" style={navStyles.link(pathname === "/")}>Tracker</Link>
        <Link to="/news" style={navStyles.link(pathname === "/news")}>News</Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<TrackerPage />} />
        <Route path="/news" element={<NewsPage />} />
      </Routes>
    </>
  );
}
