import { useState, useEffect, type ReactNode } from "react";
import Sidebar, { MobileMenuButton } from "./Sidebar";

const STORAGE_KEY = "sidebar-collapsed";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <MobileMenuButton onClick={() => setMobileOpen(true)} />
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 bg-gradient-to-b from-bg-dark to-[#050816]">
        {children}
      </main>
    </div>
  );
}
