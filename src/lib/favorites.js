// Favorite ("reference") destinations — the ones a traveler swipes right on.
// Persisted in localStorage so they carry across the wizard and the home screen.

const KEY = 'mora_fav_destinations';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / unavailable */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('favorites-changed'));
  }
}

export function getFavorites() {
  return read();
}

export function isFavorite(id) {
  return read().some((d) => d.id === id);
}

/** Store a compact destination object so consumers can render without a lookup. */
export function addFavorite(dest) {
  const list = read();
  if (list.some((d) => d.id === dest.id)) return list;
  const compact = {
    id: dest.id,
    name: dest.name,
    country: dest.country,
    image: dest.image,
    emoji: dest.emoji,
    gradient: dest.gradient,
  };
  const next = [...list, compact];
  write(next);
  return next;
}

export function removeFavorite(id) {
  const next = read().filter((d) => d.id !== id);
  write(next);
  return next;
}

export function toggleFavorite(dest) {
  return isFavorite(dest.id) ? removeFavorite(dest.id) : addFavorite(dest);
}

export function clearFavorites() {
  write([]);
}
