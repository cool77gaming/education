/* ============================================================
   EducationOS — storage.js
   Namespaced localStorage wrapper with pub/sub, plus
   export / import / reset for the whole app state.
   ============================================================ */

(function () {
  "use strict";

  const PREFIX = "eos.";
  const listeners = {}; // key -> [fn]

  function safeParse(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  const Store = {
    get(key, fallback = null) {
      try { return safeParse(localStorage.getItem(PREFIX + key), fallback); }
      catch { return fallback; }
    },

    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
      catch (e) { console.warn("EOS storage write failed", e); }
      (listeners[key] || []).forEach((fn) => fn(value));
      (listeners["*"] || []).forEach((fn) => fn(key, value));
    },

    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch {}
      (listeners[key] || []).forEach((fn) => fn(null));
      (listeners["*"] || []).forEach((fn) => fn(key, null));
    },

    /* Subscribe to changes of one key, or "*" for all. Returns unsubscribe fn. */
    subscribe(key, fn) {
      (listeners[key] = listeners[key] || []).push(fn);
      return () => { listeners[key] = (listeners[key] || []).filter((f) => f !== fn); };
    },

    /* --- Set helpers for completion lists (arrays of ids) --- */
    toggleInList(key, id) {
      const list = new Set(Store.get(key, []));
      const nowDone = !list.has(id);
      if (nowDone) list.add(id); else list.delete(id);
      Store.set(key, [...list]);
      return nowDone;
    },

    isInList(key, id) {
      return (Store.get(key, []) || []).includes(id);
    },

    /* --- Recent activity feed --- */
    logActivity(text) {
      const feed = Store.get("activity", []);
      feed.unshift({ text, ts: Date.now() });
      Store.set("activity", feed.slice(0, 30));
    },

    /* --- Export / import / reset --- */
    exportAll() {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out[k] = safeParse(localStorage.getItem(k), null);
      }
      return JSON.stringify({ app: "EducationOS", version: 1, exportedAt: new Date().toISOString(), data: out }, null, 2);
    },

    importAll(json) {
      const parsed = JSON.parse(json);
      if (!parsed || parsed.app !== "EducationOS" || typeof parsed.data !== "object") {
        throw new Error("Not a valid EducationOS backup file.");
      }
      Object.entries(parsed.data).forEach(([k, v]) => {
        if (k.startsWith(PREFIX)) localStorage.setItem(k, JSON.stringify(v));
      });
    },

    resetAll() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    },
  };

  window.EOS = window.EOS || {};
  window.EOS.store = Store;
})();
