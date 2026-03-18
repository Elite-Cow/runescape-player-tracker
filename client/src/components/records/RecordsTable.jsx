import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Pagination from "../common/Pagination";

function formatCount(n) {
  if (n == null) return "\u2014";
  return n.toLocaleString();
}

function formatDate(ts) {
  if (!ts) return "\u2014";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 25;

export default function RecordsTable({ data }) {
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const av = sortField === "date" ? new Date(a.date).getTime() : a[sortField];
      const bv = sortField === "date" ? new Date(b.date).getTime() : b[sortField];
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: "date", label: "Date" },
    { key: "peakTotal", label: "Peak Total", color: "text-gold", cellBg: "bg-gold/5" },
    { key: "peakOsrs", label: "Peak OSRS", color: "text-osrs", cellBg: "bg-osrs/5" },
    { key: "peakRs3", label: "Peak RS3", color: "text-rs3", cellBg: "bg-rs3/5" },
    { key: "avgTotal", label: "Avg Total" },
    { key: "avgOsrs", label: "Avg OSRS" },
    { key: "avgRs3", label: "Avg RS3" },
  ];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="inline ml-0.5 text-gold" />
    ) : (
      <ChevronDown size={14} className="inline ml-0.5 text-gold" />
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/30">
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wide
                    cursor-pointer hover:text-text-primary transition-colors select-none text-right first:text-left"
                >
                  {label}
                  <SortIcon field={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr
                key={row.date}
                className={`
                  border-b border-border/50 hover:bg-white/[0.06] transition-colors
                  ${i % 2 === 1 ? "bg-white/[0.01]" : ""}
                `}
              >
                <td className="px-4 py-2.5 text-text-primary font-medium">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-2.5 text-right text-gold font-semibold bg-gold/5">
                  {formatCount(row.peakTotal)}
                </td>
                <td className="px-4 py-2.5 text-right text-osrs bg-osrs/5">
                  {formatCount(row.peakOsrs)}
                </td>
                <td className="px-4 py-2.5 text-right text-rs3 bg-rs3/5">
                  {formatCount(row.peakRs3)}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">
                  {formatCount(row.avgTotal)}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">
                  {formatCount(row.avgOsrs)}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">
                  {formatCount(row.avgRs3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
