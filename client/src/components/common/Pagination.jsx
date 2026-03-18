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

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 py-1.5 text-sm rounded-full transition-all duration-200
          ${currentPage === 1
            ? "text-text-dim cursor-not-allowed"
            : "text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer hover:-translate-y-0.5"
          }
        `}
      >
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 text-sm rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer transition-all duration-200"
          >
            1
          </button>
          {start > 2 && <span className="text-text-dim px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`
            px-3 py-1.5 text-sm rounded-full transition-all duration-200
            ${p === currentPage
              ? "font-semibold text-bg-dark"
              : "text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer hover:-translate-y-0.5"
            }
          `}
          style={p === currentPage ? {
            background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
            boxShadow: "0 0 12px rgba(200,168,75,0.2)",
          } : undefined}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-text-dim px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 text-sm rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer transition-all duration-200"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-3 py-1.5 text-sm rounded-full transition-all duration-200
          ${currentPage === totalPages
            ? "text-text-dim cursor-not-allowed"
            : "text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer hover:-translate-y-0.5"
          }
        `}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
