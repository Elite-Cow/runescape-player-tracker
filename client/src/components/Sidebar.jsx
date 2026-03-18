import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  Trophy,
  Newspaper,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Coins,
  GitCompareArrows,
  Crown,
  BookOpen,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/analytics", icon: BarChart3, label: "Analytics" },
      { path: "/tracker", icon: TrendingUp, label: "Tracker" },
    ],
  },
  {
    title: "Tools",
    items: [
      { path: "/lookup", icon: Search, label: "Player Lookup" },
      { path: "/compare", icon: GitCompareArrows, label: "Compare" },
      { path: "/ge", icon: Coins, label: "GE Tracker" },
      { path: "/leaderboard", icon: Crown, label: "Leaderboard" },
      { path: "/wiki", icon: BookOpen, label: "Wiki Lookup" },
    ],
  },
  {
    title: "Community",
    items: [
      { path: "/records", icon: Trophy, label: "Records" },
      { path: "/news", icon: Newspaper, label: "News" },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-bg-sidebar border-r border-gold/10
          transition-all duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? "lg:w-[60px]" : "lg:w-[230px]"}
          w-[230px]
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-14 border-b border-gold/10 px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={onMobileClose}>
            <span className="font-cinzel font-bold text-lg gradient-text-gold">RS</span>
            {(!collapsed || mobileOpen) && (
              <span className="font-cinzel font-semibold text-sm text-text-primary">Tracker</span>
            )}
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="ml-auto text-text-muted hover:text-text-primary lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              {(!collapsed || mobileOpen) && (
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-text-dim font-semibold">
                  {section.title}
                </div>
              )}
              {section.items.map(({ path, icon: Icon, label }) => {
                const active = pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onMobileClose}
                    className={`
                      flex items-center gap-3 mx-2 px-3 py-2 rounded-md
                      transition-all duration-200 no-underline group
                      ${active
                        ? "bg-gradient-to-r from-gold/10 to-transparent text-gold border-l-2 border-gold ml-0 pl-[14px]"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5 hover:translate-x-0.5"
                      }
                      ${collapsed && !mobileOpen ? "lg:justify-center lg:px-0 lg:mx-1" : ""}
                    `}
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      size={19}
                      className={`shrink-0 transition-all duration-200 ${
                        active
                          ? "drop-shadow-[0_0_6px_rgba(200,168,75,0.5)]"
                          : "group-hover:drop-shadow-[0_0_4px_rgba(200,168,75,0.3)]"
                      }`}
                    />
                    {(!collapsed || mobileOpen) && (
                      <span className="text-sm font-medium">{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-10 border-t border-gold/10 text-text-muted hover:text-gold transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-bg-sidebar border-b border-gold/10 flex items-center px-4 z-30 lg:hidden">
      <button onClick={onClick} className="text-text-muted hover:text-text-primary">
        <Menu size={22} />
      </button>
      <Link to="/" className="ml-3 flex items-center gap-2 no-underline">
        <span className="font-cinzel font-bold text-lg gradient-text-gold">RS</span>
        <span className="font-cinzel font-semibold text-sm text-text-primary">Tracker</span>
      </Link>
    </div>
  );
}
