import type { ReactNode } from "react";
import TopNav from "./TopNav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mesh-gradient noise-overlay min-h-screen">
      <TopNav />
      <main className="relative z-10 pt-16">
        <div className="max-w-[1400px] mx-auto px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
