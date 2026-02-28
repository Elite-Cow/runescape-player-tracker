import React from "react";

const RANGES = ["24h", "7d", "30d", "6m", "1y", "all"];

const styles = {
  container: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  button: (active, disabled) => ({
    padding: "6px 16px",
    borderRadius: "4px",
    border: "1px solid",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: active ? "700" : "400",
    fontSize: "14px",
    transition: "all 0.15s",
    borderColor: disabled ? "#333" : active ? "#c8a84b" : "#555",
    background: active ? "#c8a84b" : "transparent",
    color: disabled ? "#444" : active ? "#0e0e0e" : "#e0e0e0",
    opacity: disabled ? 0.5 : 1,
  }),
};

export default function RangeButtons({ availability, selected, onSelect }) {
  return (
    <div style={styles.container}>
      {RANGES.map((range) => {
        const disabled = !availability[range];
        return (
          <button
            key={range}
            style={styles.button(selected === range, disabled)}
            disabled={disabled}
            onClick={() => !disabled && onSelect(range)}
          >
            {range.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
