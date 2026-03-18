import React from "react";

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`bg-bg-card rounded-lg p-5 ${className}`}>
      <div className="h-3 w-24 rounded bg-white/[0.06] shimmer-bg mb-3" />
      <div className="h-7 w-32 rounded bg-white/[0.06] shimmer-bg mb-4" />
      <div className="h-[60px] w-full rounded bg-white/[0.06] shimmer-bg" />
    </div>
  );
}

export function SkeletonChart({ className = "" }) {
  return (
    <div className={`bg-bg-card rounded-lg p-5 ${className}`}>
      <div className="h-4 w-40 rounded bg-white/[0.06] shimmer-bg mb-4" />
      <div className="h-[300px] w-full rounded bg-white/[0.06] shimmer-bg" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <div className="h-4 w-24 rounded bg-white/[0.06] shimmer-bg" />
      <div className="h-4 w-16 rounded bg-white/[0.06] shimmer-bg ml-auto" />
      <div className="h-4 w-16 rounded bg-white/[0.06] shimmer-bg" />
      <div className="h-4 w-16 rounded bg-white/[0.06] shimmer-bg" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = "" }) {
  return (
    <div className={`bg-bg-card rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center gap-4 py-3 px-4 border-b border-border bg-black/20">
        <div className="h-3 w-16 rounded bg-white/[0.06] shimmer-bg" />
        <div className="h-3 w-12 rounded bg-white/[0.06] shimmer-bg ml-auto" />
        <div className="h-3 w-12 rounded bg-white/[0.06] shimmer-bg" />
        <div className="h-3 w-12 rounded bg-white/[0.06] shimmer-bg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
