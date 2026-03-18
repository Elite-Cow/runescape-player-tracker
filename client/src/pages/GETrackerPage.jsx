import React, { useState } from "react";
import { Coins } from "lucide-react";
import GESearchBar from "../components/ge/GESearchBar";
import GEItemCard from "../components/ge/GEItemCard";
import GEPriceChart from "../components/ge/GEPriceChart";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function GETrackerPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [game, setGame] = useState("osrs");

  async function handleSearch(query, g) {
    setLoading(true);
    setError(null);
    setGame(g);

    try {
      const res = await fetch(`/api/ge/search?q=${encodeURIComponent(query)}&game=${g}`);
      if (!res.ok) throw new Error("Failed to search GE");
      const data = await res.json();
      const itemList = data.items || [];

      if (itemList.length === 0) {
        setError(`No items found for "${query}"`);
        setItems([]);
        setSelectedItem(null);
        return;
      }

      // Fetch detail for each item to get full price info
      const detailed = await Promise.all(
        itemList.slice(0, 12).map(async (item) => {
          try {
            const detailRes = await fetch(`/api/ge/item/${item.id}?game=${g}`);
            if (detailRes.ok) {
              const d = await detailRes.json();
              return d.item || item;
            }
          } catch {}
          return item;
        })
      );

      setItems(detailed);
      if (detailed.length > 0 && !selectedItem) {
        setSelectedItem(detailed[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">GE Price Tracker</h1>
        <p className="text-sm text-text-muted mt-1">
          Search Grand Exchange items and view 180-day price history
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      <div className="glass rounded-lg p-4 mb-6 animate-fade-in-up stagger-1">
        <GESearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner className="py-16" />}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
          {/* Item list */}
          <div className="lg:col-span-1 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => (
              <GEItemCard
                key={item.id}
                item={item}
                game={game}
                onSelect={setSelectedItem}
                selected={selectedItem?.id === item.id}
              />
            ))}
          </div>

          {/* Price chart */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={`/api/ge/image/${selectedItem.id}?game=${game}`}
                    alt={selectedItem.name}
                    width={40}
                    height={40}
                    className="rounded bg-black/20 p-1"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div>
                    <h3 className="font-cinzel text-lg font-semibold text-gold">{selectedItem.name}</h3>
                    {selectedItem.description && (
                      <p className="text-xs text-text-muted">{selectedItem.description}</p>
                    )}
                  </div>
                </div>
                <GEPriceChart itemId={selectedItem.id} game={game} />
              </div>
            ) : (
              <div className="text-center text-text-muted py-16">
                Select an item to view price history
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/5 mb-4">
            <Coins size={32} className="text-gold/40" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
          </div>
          <p className="text-lg text-text-muted mb-2">Search for an item to get started</p>
          <p className="text-sm text-text-dim">Try "Abyssal whip", "Dragon bones", or "Twisted bow"</p>
        </div>
      )}
    </div>
  );
}
