/* ============================================================
   EducationOS — search.js
   Global search overlay (⌘K / Ctrl+K). Indexes every page,
   course, advice card and resource; results deep-link with
   ?open=<id> so target pages expand the right card.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});

  let index = [];
  let selected = 0;
  let results = [];

  function buildIndex() {
    index = [];
    EOS.nav.filter((n) => n.id).forEach((n) =>
      index.push({ type: "Page", title: n.label, sub: "Open page", href: n.href, icon: n.icon }));

    (EOS.data.sophia.courses || []).forEach((c) =>
      index.push({ type: "Sophia", title: c.name, sub: `${c.credits} cr → ${c.wguEquivalent}`, href: `sophia.html?open=${c.id}`, icon: "sophia", extra: c.notes }));

    (EOS.data.studycom.courses || []).forEach((c) =>
      index.push({ type: "Study.com", title: c.name, sub: `${c.credits} cr → ${c.wguEquivalent}`, href: `studycom.html?open=${c.id}`, icon: "studycom", extra: c.notes }));

    (EOS.data.wgu.courses || []).forEach((c) =>
      index.push({ type: "WGU", title: c.name + (c.code ? ` (${c.code})` : ""), sub: `${c.cus} CUs · ${c.category}`, href: `wgu.html?open=${c.id}`, icon: "wgu", extra: c.notes }));

    (EOS.data.reddit.advice || []).forEach((a) =>
      index.push({ type: "Advice", title: a.title, sub: a.tags.join(" · "), href: `reddit.html?open=${a.id}`, icon: "reddit", extra: a.summary }));

    (EOS.data.settings.checklist || []).forEach((c) =>
      index.push({ type: "Checklist", title: c.label, sub: c.hint, href: "tracker.html", icon: "checklist" }));
  }

  function score(item, q) {
    const title = item.title.toLowerCase();
    const hay = `${title} ${item.sub || ""} ${item.extra || ""} ${item.type}`.toLowerCase();
    if (title.startsWith(q)) return 3;
    if (title.includes(q)) return 2;
    if (hay.includes(q)) return 1;
    return 0;
  }

  function query(q) {
    q = q.trim().toLowerCase();
    if (!q) return index.filter((i) => i.type === "Page");
    return index
      .map((i) => ({ i, s: score(i, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.i);
  }

  function overlay() { return document.getElementById("search-overlay"); }

  function renderResults() {
    const box = overlay().querySelector(".search-results");
    if (!results.length) {
      box.innerHTML = `<div class="empty-state">${EOS.icons.search}<p>No results.</p></div>`;
      return;
    }
    box.innerHTML = results.map((r, i) => `
      <div class="search-result ${i === selected ? "selected" : ""}" role="option"
           aria-selected="${i === selected}" data-idx="${i}">
        <span class="sr-icon">${EOS.icons[r.icon] || EOS.icons.search}</span>
        <span class="sr-text">
          <span class="sr-title">${EOS.escape(r.title)}</span>
          <span class="sr-sub">${EOS.escape(r.type)} · ${EOS.escape(r.sub || "")}</span>
        </span>
      </div>`).join("");
  }

  function open() {
    const ov = overlay();
    ov.classList.add("open");
    ov.setAttribute("aria-hidden", "false");
    const input = ov.querySelector("input");
    input.value = "";
    results = query("");
    selected = 0;
    renderResults();
    setTimeout(() => input.focus(), 30);
  }

  function close() {
    const ov = overlay();
    ov.classList.remove("open");
    ov.setAttribute("aria-hidden", "true");
  }

  function go(r) { if (r) location.href = r.href; }

  function init() {
    buildIndex();
    const ov = overlay();
    if (!ov) return;
    ov.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Global search">
        <div class="search-input-row">
          ${EOS.icons.search}
          <input type="text" placeholder="Search courses, advice, pages…" aria-label="Search" autocomplete="off" spellcheck="false"/>
          <button class="icon-btn" data-search-close aria-label="Close search">${EOS.icons.x}</button>
        </div>
        <div class="search-results" role="listbox" aria-label="Search results"></div>
        <div class="search-footer">
          <span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span>
        </div>
      </div>`;

    const input = ov.querySelector("input");
    input.addEventListener("input", () => { results = query(input.value); selected = 0; renderResults(); });

    ov.addEventListener("click", (e) => {
      if (e.target === ov || e.target.closest("[data-search-close]")) { close(); return; }
      const row = e.target.closest(".search-result");
      if (row) go(results[+row.dataset.idx]);
    });

    document.addEventListener("keydown", (e) => {
      const isOpen = ov.classList.contains("open");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen ? close() : open(); return; }
      if (e.key === "/" && !isOpen && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); return; }
      if (!isOpen) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(results.length - 1, selected + 1); renderResults(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(0, selected - 1); renderResults(); }
      else if (e.key === "Enter") go(results[selected]);
    });

    const trigger = document.getElementById("global-search-btn");
    if (trigger) trigger.addEventListener("click", open);
  }

  EOS.search = { init, open };
})();
