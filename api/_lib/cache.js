// Shared LRU-ish in-memory cache with configurable TTL
const MAX_ENTRIES = 500;

class MemCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (entry && entry.expiry > Date.now()) return entry.data;
    this.store.delete(key);
    return null;
  }

  set(key, data, ttlMs) {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
    if (this.store.size > MAX_ENTRIES) {
      const now = Date.now();
      for (const [k, v] of this.store) {
        if (v.expiry < now) this.store.delete(k);
      }
      // If still over limit, delete oldest entries
      if (this.store.size > MAX_ENTRIES) {
        const keys = [...this.store.keys()];
        for (let i = 0; i < keys.length - MAX_ENTRIES; i++) {
          this.store.delete(keys[i]);
        }
      }
    }
  }
}

module.exports = new MemCache();
