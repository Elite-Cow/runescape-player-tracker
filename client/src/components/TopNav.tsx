import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Trophy,
  Newspaper,
  Menu,
  X,
  Coins,
  GitCompareArrows,
  Crown,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tracker", icon: TrendingUp, label: "Tracker" },
  { path: "/records", icon: Trophy, label: "Records" },
  { path: "/lookup", icon: Search, label: "Lookup" },
  { path: "/compare", icon: GitCompareArrows, label: "Compare" },
  { path: "/ge", icon: Coins, label: "GE" },
  { path: "/leaderboard", icon: Crown, label: "Leaderboard" },
  { path: "/wiki", icon: BookOpen, label: "Wiki" },
  { path: "/news", icon: Newspaper, label: "News" },
];

export default function TopNav() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop + Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl bg-[rgba(8,13,31,0.85)] border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0 mr-8">
            <span className="font-cinzel font-bold text-xl gradient-text-gold">RS</span>
            <span className="font-cinzel font-semibold text-sm text-text-primary tracking-wide">Tracker</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200 no-underline
                    ${active ? "text-[#c8a84b]" : "text-[#888888] hover:text-[#e0e0e0]"}
                  `}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-[#c8a84b] to-[#e8c86b] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status dot (desktop) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1bb37c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1bb37c]" />
            </span>
            <span className="text-xs text-[#888888]">Live</span>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden ml-auto text-[#888888] hover:text-[#e0e0e0] transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-down panel */}
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 right-0 z-50 lg:hidden glass-card rounded-b-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <Link to="/" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
                  <span className="font-cinzel font-bold text-xl gradient-text-gold">RS</span>
                  <span className="font-cinzel font-semibold text-sm text-text-primary">Tracker</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-[#888888] hover:text-[#e0e0e0] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="p-4 grid grid-cols-3 gap-2">
                {NAV_ITEMS.map(({ path, icon: Icon, label }, i) => {
                  const active = pathname === path;
                  return (
                    <motion.div
                      key={path}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <Link
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium
                          transition-all duration-200 no-underline
                          ${active
                            ? "bg-[#c8a84b]/15 text-[#c8a84b] border border-[#c8a84b]/30"
                            : "text-[#888888] hover:text-[#e0e0e0] hover:bg-white/[0.03]"
                          }
                        `}
                      >
                        <Icon size={20} />
                        <span>{label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
