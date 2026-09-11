/**
 * storage.js — thin, safe wrapper around LocalStorage.
 * Every key is namespaced under "aartisangrah:" to avoid collisions.
 */

const Storage = (() => {
  const NS = "aartisangrah:";

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(NS + key);
    } catch (e) {
      /* ignore */
    }
  }

  // ---- Favorites --------------------------------------------------
  function getFavorites() {
    return get("favorites", []);
  }
  function isFavorite(id) {
    return getFavorites().includes(id);
  }
  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx > -1) {
      favs.splice(idx, 1);
    } else {
      favs.unshift(id);
    }
    set("favorites", favs);
    return favs.includes(id);
  }

  // ---- Recently read ------------------------------------------------
  function getRecent() {
    return get("recent", []);
  }
  function pushRecent(id) {
    let recent = getRecent().filter((r) => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 10);
    set("recent", recent);
  }

  // ---- Font size ------------------------------------------------
  const FONT_STEPS = ["small", "normal", "large", "xlarge"];
  function getFontSize() {
    return get("fontSize", "normal");
  }
  function setFontSize(size) {
    if (FONT_STEPS.includes(size)) set("fontSize", size);
  }

  // ---- Reading mode (normal | focus) ------------------------------
  function getReadingMode() {
    return get("readingMode", "normal");
  }
  function setReadingMode(mode) {
    set("readingMode", mode);
  }

  // ---- Manual verse markers, per-aarti ------------------------------
  function getMarker(aartiId) {
    const markers = get("markers", {});
    return markers[aartiId] ?? null;
  }
  function setMarker(aartiId, verseId) {
    const markers = get("markers", {});
    markers[aartiId] = verseId;
    set("markers", markers);
  }
  function clearMarker(aartiId) {
    const markers = get("markers", {});
    delete markers[aartiId];
    set("markers", markers);
  }

  // ---- Theme / settings ------------------------------
  function getSettings() {
    return get("settings", { reduceMotion: false });
  }
  function setSettings(patch) {
    set("settings", { ...getSettings(), ...patch });
  }

  return {
    get,
    set,
    remove,
    getFavorites,
    isFavorite,
    toggleFavorite,
    getRecent,
    pushRecent,
    getFontSize,
    setFontSize,
    FONT_STEPS,
    getReadingMode,
    setReadingMode,
    getMarker,
    setMarker,
    clearMarker,
    getSettings,
    setSettings,
  };
})();
