import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  Trophy,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/lookup", icon: Search, label: "Player Lookup" },
  { path: "/records", icon: Trophy, label: "Records" },
  { path: "/news", icon: Newspaper, label: "News" },
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
          bg-bg-sidebar border-r border-border
          transition-all duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? "lg:w-[60px]" : "lg:w-[230px]"}
          w-[230px]
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-14 border-b border-border px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={onMobileClose}>
            <span className="text-gold font-bold text-lg">RS</span>
            {(!collapsed || mobileOpen) && (
              <span className="text-text-primary font-semibold text-sm">Tracker</span>
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
        <nav className="flex-1 py-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={onMobileClose}
                className={`
                  flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md
                  transition-colors duration-150 no-underline
                  ${active
                    ? "bg-gold/10 text-gold"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }
                  ${collapsed && !mobileOpen ? "lg:justify-center lg:px-0 lg:mx-1" : ""}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="text-sm font-medium">{label}</span>
                )}
                {active && (!collapsed || mobileOpen) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-10 border-t border-border text-text-muted hover:text-text-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-bg-sidebar border-b border-border flex items-center px-4 z-30 lg:hidden">
      <button onClick={onClick} className="text-text-muted hover:text-text-primary">
        <Menu size={22} />
      </button>
      <Link to="/" className="ml-3 flex items-center gap-2 no-underline">
        <span className="text-gold font-bold text-lg">RS</span>
        <span className="text-text-primary font-semibold text-sm">Tracker</span>
      </Link>
    </div>
  );
}
