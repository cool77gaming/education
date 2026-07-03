/* ============================================================
   EducationOS — theme.js
   Dark-mode-first theming. An inline snippet in each page's
   <head> applies the stored theme before first paint; this
   file owns the toggle + persistence.
   ============================================================ */

(function () {
  "use strict";

  const KEY = "eos.theme"; // stored raw (also read by the inline head snippet)

  function current() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem(KEY, theme); } catch {}
    // Keep Chart.js instances in sync if present
    if (window.EOS && typeof window.EOS.onThemeChange === "function") {
      window.EOS.onThemeChange(theme);
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(updateToggleIcon);
  }

  function toggle() {
    apply(current() === "dark" ? "light" : "dark");
  }

  function updateToggleIcon(btn) {
    const dark = current() === "dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  }

  window.EOS = window.EOS || {};
  window.EOS.theme = { current, apply, toggle, updateToggleIcon };
})();
