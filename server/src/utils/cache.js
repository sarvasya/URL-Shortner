// Tiny in-memory cache with TTL. Illustrates caching; Redis would replace
// it when running multiple servers (this cache is per-process).
const store = new Map();
const TTL_MS = 60 * 1000;
const MAX_ENTRIES = 1000;

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value) => {
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value); // evict oldest
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
};

const del = (key) => store.delete(key);

module.exports = { get, set, del };
