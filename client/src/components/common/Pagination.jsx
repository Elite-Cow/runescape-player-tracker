import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnClass = (active, disabled) => `
    px-3 py-1.5 text-sm rounded transition-colors
    ${disabled
      ? "text-text-dim cursor-not-allowed"
      : active
        ? "bg-gold text-bg-dark font-semibold"
        : "text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer"
    }
  `;

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={btnClass(false, currentPage === 1)}
      >
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={btnClass(false, false)}>1</button>
          {start > 2 && <span className="text-text-dim px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={btnClass(p === currentPage, false)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-text-dim px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className={btnClass(false, false)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={btnClass(false, currentPage === totalPages)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
