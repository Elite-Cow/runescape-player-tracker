import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Trophy,
  Newspaper,
  ChevronLeft,
  ChevronRight,
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

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/tracker", icon: TrendingUp, label: "Player Tracker" },
      { path: "/records", icon: Trophy, label: "Records" },
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
      { path: "/news", icon: Newspaper, label: "News" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-bg-sidebar border-r border-[#1a2048]/60
          transition-all duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? "lg:w-[60px]" : "lg:w-[230px]"}
          w-[230px]
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-14 border-b border-[#1a2048]/60 px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={onMobileClose}>
            <span className="font-cinzel font-bold text-lg gradient-text-gold">RS</span>
            {(!collapsed || mobileOpen) && (
              <span className="font-cinzel font-semibold text-sm text-text-primary tracking-wide">Tracker</span>
            )}
          </Link>
          <button
            onClick={onMobileClose}
            className="ml-auto text-text-muted hover:text-text-primary lg:hidden transition-colors"
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
                      flex items-center gap-3 mx-2 px-3 py-2 rounded-lg
                      transition-all duration-200 no-underline group
                      ${active
                        ? "bg-gradient-to-r from-gold/12 to-transparent text-gold border-l-2 border-gold ml-0 pl-[14px]"
                        : "text-text-muted hover:text-text-primary hover:bg-white/[0.03] hover:translate-x-0.5"
                      }
                      ${collapsed && !mobileOpen ? "lg:justify-center lg:px-0 lg:mx-1" : ""}
                    `}
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      size={19}
                      className={`shrink-0 transition-all duration-200 ${
                        active
                          ? "drop-shadow-[0_0_8px_rgba(200,168,75,0.6)]"
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
          className="hidden lg:flex items-center justify-center h-10 border-t border-[#1a2048]/60 text-text-muted hover:text-gold transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-bg-sidebar/95 backdrop-blur-sm border-b border-[#1a2048]/60 flex items-center px-4 z-30 lg:hidden">
      <button onClick={onClick} className="text-text-muted hover:text-text-primary transition-colors">
        <Menu size={22} />
      </button>
      <Link to="/" className="ml-3 flex items-center gap-2 no-underline">
        <span className="font-cinzel font-bold text-lg gradient-text-gold">RS</span>
        <span className="font-cinzel font-semibold text-sm text-text-primary">Tracker</span>
      </Link>
    </div>
  );
}
