/* ============================================================
   EducationOS — app.js
   App shell (sidebar / topbar / bottom nav), data loading,
   progress engine, recommendation engine, shared utilities,
   and per-page init dispatch.
   ============================================================ */

(function () {
  "use strict";

  const EOS = (window.EOS = window.EOS || {});

  /* ----------------------------------------------------------
     Icon library (inline SVG, stroke style — Lucide-inspired)
     ---------------------------------------------------------- */
  const I = (paths, viewBox = "0 0 24 24") =>
    `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  EOS.icons = {
    dashboard: I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    sophia: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    studycom: I('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5"/><path d="M22 10v5"/>'),
    transfer: I('<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>'),
    wgu: I('<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/><path d="M12 8h.01"/>'),
    timeline: I('<circle cx="5" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h9M5 8v7a2 2 0 0 0 2 2h3M14 12h3a2 2 0 0 1 2 2v2"/>'),
    calculator: I('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>'),
    checklist: I('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8.5 12 2.5 2.5 5-5.5"/>'),
    reddit: I('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    resources: I('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
    settings: I('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    menu: I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    chevronDown: I('<path d="m6 9 6 6 6-6"/>'),
    chevronsLeft: I('<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>'),
    check: I('<path d="M20 6 9 17l-5-5"/>'),
    external: I('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    dollar: I('<path d="M12 2v20"/><path d="M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    award: I('<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>'),
    calendar: I('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    flame: I('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 2.5.5 5 2.5 5 6a4.5 4.5 0 1 1-9 0c0-1.15.43-2.2 1-3 0 1.38 1.12 2.5 1.5 2.5z"/><path d="M12 2s4 3.5 4 7c0 .5 0 1-.09 1.5C17.6 9.3 20 11.5 20 15a8 8 0 1 1-16 0c0-4 2.5-6.5 4-8 0 1 .23 2.23 1 3 .5-3 1.5-5.5 3-8z"/>'),
    target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    sparkles: I('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>'),
    alert: I('<path d="m21.7 18.3-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7Z"/><path d="M12 9v4M12 17h.01"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
    download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
    upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'),
    trash: I('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    book: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    zap: I('<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>'),
    file: I('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>'),
    video: I('<path d="m16 10 5-3v10l-5-3"/><rect x="3" y="6" width="13" height="12" rx="2"/>'),
    link: I('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19"/>'),
  };

  /* ----------------------------------------------------------
     Navigation model
     ---------------------------------------------------------- */
  EOS.nav = [
    { section: "Overview" },
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
    { section: "Credits" },
    { id: "sophia", label: "Sophia", href: "sophia.html", icon: "sophia" },
    { id: "studycom", label: "Study.com", href: "studycom.html", icon: "studycom" },
    { id: "transfer", label: "Transfer Credits", href: "transfer.html", icon: "transfer" },
    { id: "wgu", label: "WGU Degree", href: "wgu.html", icon: "wgu" },
    { section: "Planning" },
    { id: "timeline", label: "Timeline", href: "timeline.html", icon: "timeline" },
    { id: "calculator", label: "Calculator", href: "calculator.html", icon: "calculator" },
    { id: "tracker", label: "Checklist", href: "tracker.html", icon: "checklist" },
    { section: "Knowledge" },
    { id: "reddit", label: "Reddit Advice", href: "reddit.html", icon: "reddit" },
    { id: "resources", label: "Resources", href: "resources.html", icon: "resources" },
    { id: "settings", label: "Settings", href: "settings.html", icon: "settings" },
  ];

  const BOTTOM_NAV = ["dashboard", "sophia", "transfer", "timeline", "tracker"];

  /* ----------------------------------------------------------
     Data loading (all JSON fetched once, in parallel)
     ---------------------------------------------------------- */
  let dataPromise = null;
  EOS.loadData = function () {
    if (dataPromise) return dataPromise;
    const files = ["wgu", "sophia", "studycom", "reddit", "settings"];
    dataPromise = Promise.all(
      files.map((f) =>
        fetch(`data/${f}.json`).then((r) => {
          if (!r.ok) throw new Error(`Failed to load data/${f}.json (${r.status})`);
          return r.json();
        })
      )
    ).then(([wgu, sophia, studycom, reddit, settings]) => {
      EOS.data = { wgu, sophia, studycom, reddit, settings };
      return EOS.data;
    }).catch((err) => {
      console.error(err);
      const main = document.getElementById("page-content");
      if (main) {
        main.insertAdjacentHTML("afterbegin",
          `<div class="verify-banner" role="alert">${EOS.icons.alert}
            <div><strong>Couldn't load app data.</strong> If you opened this file directly from disk, browsers block local JSON fetches —
            serve the folder instead (e.g. <code>python3 -m http.server</code>) or publish to GitHub Pages.</div></div>`);
      }
      throw err;
    });
    return dataPromise;
  };

  /* ----------------------------------------------------------
     User settings (defaults from settings.json, overridden
     by anything saved in localStorage)
     ---------------------------------------------------------- */
  EOS.getSettings = function () {
    const defaults = (EOS.data && EOS.data.settings.defaults) || {};
    return Object.assign({}, defaults, EOS.store.get("settings", {}));
  };
  EOS.saveSetting = function (key, value) {
    const s = EOS.store.get("settings", {});
    s[key] = value;
    EOS.store.set("settings", s);
  };

  /* ----------------------------------------------------------
     Progress engine
     ---------------------------------------------------------- */
  EOS.progress = function () {
    const { wgu, sophia, studycom } = EOS.data;
    const doneSophia = new Set(EOS.store.get("completed.sophia", []));
    const doneStudy = new Set(EOS.store.get("completed.studycom", []));
    const doneWgu = new Set(EOS.store.get("completed.wgu", []));

    // Which WGU courses are covered by a completed transfer course?
    const coveredBy = {}; // wguCourseId -> {source, courseName}
    sophia.courses.forEach((c) => {
      if (c.wguCourseId && doneSophia.has(c.id) && !coveredBy[c.wguCourseId])
        coveredBy[c.wguCourseId] = { source: "sophia", name: c.name };
    });
    studycom.courses.forEach((c) => {
      if (c.wguCourseId && doneStudy.has(c.id) && !coveredBy[c.wguCourseId])
        coveredBy[c.wguCourseId] = { source: "studycom", name: c.name };
    });

    const categories = {};
    let totalCUs = 0, doneCUs = 0, cusBySophia = 0, cusByStudy = 0, cusAtWgu = 0;

    wgu.courses.forEach((c) => {
      totalCUs += c.cus;
      const cat = (categories[c.category] = categories[c.category] || { total: 0, done: 0 });
      cat.total += c.cus;
      const atWgu = doneWgu.has(c.id);
      const transfer = coveredBy[c.id];
      if (atWgu || transfer) {
        doneCUs += c.cus;
        cat.done += c.cus;
        if (atWgu) cusAtWgu += c.cus;
        else if (transfer.source === "sophia") cusBySophia += c.cus;
        else cusByStudy += c.cus;
      }
    });

    const pct = totalCUs ? Math.round((doneCUs / totalCUs) * 100) : 0;

    // ETA: remaining transfer-phase days + remaining WGU terms
    const s = EOS.getSettings();
    const remSophiaDays = sophia.courses
      .filter((c) => !doneSophia.has(c.id) && (c.status === "pathway" || c.status === "community"))
      .reduce((t, c) => t + (c.estDays || 0), 0);
    const remStudyDays = studycom.courses
      .filter((c) => !doneStudy.has(c.id) && c.recommendation === "worth")
      .reduce((t, c) => t + Math.round((c.estHours || 30) / 3), 0);
    const remWguCUs = wgu.courses
      .filter((c) => !doneWgu.has(c.id) && !coveredBy[c.id])
      .reduce((t, c) => t + c.cus, 0);
    const pacePerTerm = s.paceCUsPerTerm || 20;
    const termsLeft = Math.max(remWguCUs > 0 ? 1 : 0, Math.ceil(remWguCUs / pacePerTerm));
    const gradDate = new Date();
    gradDate.setDate(gradDate.getDate() + remSophiaDays + remStudyDays);
    gradDate.setMonth(gradDate.getMonth() + termsLeft * 6);

    return {
      totalCUs, doneCUs, remainingCUs: totalCUs - doneCUs, pct,
      cusBySophia, cusByStudy, cusAtWgu,
      categories, coveredBy, doneSophia, doneStudy, doneWgu,
      termsLeft, gradDate, remWguCUs,
    };
  };

  /* Money saved estimate (transfer credits vs paying WGU terms for them) */
  EOS.moneySaved = function (p) {
    const s = EOS.getSettings();
    const calc = EOS.store.get("calc", {});
    const sophiaMonths = calc.sophiaMonths ?? s.sophiaMonths;
    const studyMonths = calc.studycomMonths ?? s.studycomMonths;
    const transferCUs = p.cusBySophia + p.cusByStudy;
    // Terms those CUs would have cost at WGU pace vs what the subscriptions cost
    const termsAvoided = transferCUs / (s.paceCUsPerTerm || 20);
    const wguCostAvoided = termsAvoided * (s.wguTermCost + (s.wguResourceFeePerTerm || 0));
    const spent = sophiaMonths * s.sophiaMonthly + studyMonths * s.studycomMonthly;
    return Math.max(0, Math.round(wguCostAvoided - spent));
  };

  /* ----------------------------------------------------------
     Recommendation engine
     ---------------------------------------------------------- */
  EOS.recommend = function () {
    const { sophia, studycom, wgu } = EOS.data;
    const p = EOS.progress();

    const nextSophia = sophia.courses
      .filter((c) => !p.doneSophia.has(c.id) && (c.status === "pathway" || c.status === "community")
        && !(c.wguCourseId && (p.coveredBy[c.wguCourseId] || p.doneWgu.has(c.wguCourseId))))
      .sort((a, b) => a.difficulty - b.difficulty || a.estHours - b.estHours)[0];
    if (nextSophia) {
      return {
        phase: "Sophia", course: nextSophia.name, href: "sophia.html",
        credits: nextSophia.credits, difficulty: nextSophia.difficulty,
        time: `~${nextSophia.estHours} hrs · ~${nextSophia.estDays} days`,
        reason: nextSophia.status === "pathway"
          ? "Lowest-effort course still open on the published transfer pathway — bank cheap credits before enrolling."
          : "Quick win reported by the community — verify the equivalency, then bank it before enrolling.",
        verify: true,
      };
    }

    const nextStudy = studycom.courses
      .filter((c) => c.recommendation === "worth" && !p.doneStudy.has(c.id)
        && !(c.wguCourseId && (p.coveredBy[c.wguCourseId] || p.doneWgu.has(c.wguCourseId))))
      .sort((a, b) => a.difficulty - b.difficulty)[0];
    if (nextStudy) {
      return {
        phase: "Study.com", course: nextStudy.name, href: "studycom.html",
        credits: nextStudy.credits, difficulty: nextStudy.difficulty,
        time: `~${nextStudy.estHours} hrs`,
        reason: "Sophia can't cover this requirement — Study.com is the usual gap-filler. Verify the equivalency first.",
        verify: true,
      };
    }

    const nextWgu = wgu.courses
      .filter((c) => !p.doneWgu.has(c.id) && !p.coveredBy[c.id])
      .filter((c) => (c.prereqs || []).every((pr) => p.doneWgu.has(pr) || p.coveredBy[pr]))
      .sort((a, b) => a.difficulty - b.difficulty || a.cus - b.cus)[0];
    if (nextWgu) {
      return {
        phase: "WGU", course: nextWgu.name + (nextWgu.code ? ` (${nextWgu.code})` : ""), href: "wgu.html",
        credits: nextWgu.cus, difficulty: nextWgu.difficulty,
        time: `~${nextWgu.estHours} hrs`,
        reason: "All prerequisites are met and it's the lightest remaining WGU course — keep the momentum.",
        verify: false,
      };
    }

    return {
      phase: "Done", course: "Degree plan complete 🎉", href: "tracker.html",
      credits: 0, difficulty: 0, time: "",
      reason: "Every tracked course is complete. Finish the licensure checklist!",
      verify: false,
    };
  };

  /* ----------------------------------------------------------
     Shared UI utilities
     ---------------------------------------------------------- */
  EOS.fmtMoney = (n) => "$" + Math.round(n).toLocaleString("en-US");
  EOS.fmtDate = (d) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  EOS.escape = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  EOS.difficultyDots = function (level) {
    let dots = "";
    for (let i = 1; i <= 5; i++) dots += `<i class="${i <= level ? "on" : ""}"></i>`;
    return `<span class="difficulty" role="img" aria-label="Difficulty ${level} of 5">${dots}</span>`;
  };

  EOS.statusBadge = function (status) {
    const map = {
      pathway: ["badge-good", "Confirmed · official agreement"],
      community: ["badge-info", "Community-reported · verify"],
      review: ["badge-warn", "Needs manual review"],
      unlikely: ["badge-danger", "Unlikely to apply"],
    };
    const [cls, label] = map[status] || ["badge-neutral", status];
    return `<span class="badge ${cls}">${label}</span>`;
  };

  let counterSeq = 0;
  EOS.animateCounter = function (el, target, opts = {}) {
    const dur = opts.duration || 900;
    const fmt = opts.format || ((v) => Math.round(v).toLocaleString("en-US"));
    const start = performance.now();
    // Token invalidates any in-flight animation on this element, and lets a
    // later direct textContent write win over a stale animation frame.
    const token = String(++counterSeq);
    el.dataset.counterToken = token;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(target);
      return;
    }
    function frame(now) {
      if (el.dataset.counterToken !== token) return;
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
  EOS.cancelCounter = function (el) { el.dataset.counterToken = String(++counterSeq); };

  EOS.toast = function (msg) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = `${EOS.icons.check}<span>${EOS.escape(msg)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, 2400);
  };

  /* SVG progress ring markup. Progress applied via EOS.setRing. */
  EOS.ringSVG = function (size = 190, stroke = 13) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}"/>
        <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}"
          stroke-dasharray="${c}" stroke-dashoffset="${c}" data-circumference="${c}"/>
      </svg>`;
  };
  EOS.setRing = function (container, pct) {
    const fg = container.querySelector(".ring-fg");
    if (!fg) return;
    const c = parseFloat(fg.dataset.circumference);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { fg.style.strokeDashoffset = c * (1 - Math.min(100, Math.max(0, pct)) / 100); }));
  };

  /* Reveal-on-scroll */
  EOS.initReveal = function () {
    const els = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("revealed")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("revealed"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  };

  /* Dismissible "verify data" banner */
  EOS.verifyBanner = function (id, message) {
    if (EOS.store.get("banner." + id) === "dismissed") return "";
    return `
      <div class="verify-banner reveal" role="note" data-banner="${id}">
        ${EOS.icons.alert}
        <div><strong>Verify before acting.</strong> ${message}</div>
        <button class="dismiss icon-btn" aria-label="Dismiss notice" data-banner-dismiss="${id}">${EOS.icons.x}</button>
      </div>`;
  };

  /* ----------------------------------------------------------
     Layout: sidebar, topbar, bottom nav, drawer
     ---------------------------------------------------------- */
  function renderSidebar(active) {
    const el = document.getElementById("sidebar");
    if (!el) return;
    let html = `
      <a class="brand" href="dashboard.html" aria-label="EducationOS home">
        <img src="assets/logo.svg" alt="" width="34" height="34"/>
        <div class="brand-text">
          <div class="brand-name">Education<span>OS</span></div>
          <div class="brand-sub">Degree operating system</div>
        </div>
      </a>`;
    EOS.nav.forEach((item) => {
      if (item.section) { html += `<div class="nav-section-label">${item.section}</div>`; return; }
      html += `
        <a class="nav-item ${item.id === active ? "active" : ""}" href="${item.href}"
           ${item.id === active ? 'aria-current="page"' : ""}>
          ${EOS.icons[item.icon]}<span class="nav-label">${item.label}</span>
        </a>`;
    });
    html += `
      <div class="sidebar-footer">
        <button class="nav-item" id="sidebar-collapse" aria-label="Collapse sidebar" style="width:100%">
          ${EOS.icons.chevronsLeft}<span class="nav-label">Collapse</span>
        </button>
      </div>`;
    el.innerHTML = html;

    const shell = document.querySelector(".app-shell");
    if (EOS.store.get("sidebarCollapsed")) shell.classList.add("sb-collapsed");
    el.querySelector("#sidebar-collapse").addEventListener("click", () => {
      const collapsed = shell.classList.toggle("sb-collapsed");
      EOS.store.set("sidebarCollapsed", collapsed);
    });
  }

  function renderTopbar(active) {
    const el = document.getElementById("topbar");
    if (!el) return;
    const page = EOS.nav.find((n) => n.id === active);
    el.innerHTML = `
      <button class="icon-btn mobile-menu-btn" id="drawer-open" aria-label="Open navigation menu">${EOS.icons.menu}</button>
      <div class="page-title">${page ? page.label : "EducationOS"}</div>
      <div class="spacer"></div>
      <button class="search-trigger" id="global-search-btn" aria-label="Open global search">
        ${EOS.icons.search}<span>Search everything…</span><kbd>⌘K</kbd>
      </button>
      <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>`;
    el.querySelector("[data-theme-toggle]").addEventListener("click", EOS.theme.toggle);
    EOS.theme.updateToggleIcon(el.querySelector("[data-theme-toggle]"));

    const shell = document.querySelector(".app-shell");
    el.querySelector("#drawer-open").addEventListener("click", () => shell.classList.add("drawer-open"));
  }

  function renderBottomNav(active) {
    const el = document.getElementById("bottom-nav");
    if (!el) return;
    el.setAttribute("aria-label", "Primary");
    el.innerHTML = BOTTOM_NAV.map((id) => {
      const item = EOS.nav.find((n) => n.id === id);
      return `<a href="${item.href}" class="${id === active ? "active" : ""}" ${id === active ? 'aria-current="page"' : ""}>
        ${EOS.icons[item.icon]}<span>${item.label.split(" ")[0]}</span></a>`;
    }).join("");
  }

  function bindGlobalEvents() {
    const shell = document.querySelector(".app-shell");
    const backdrop = document.getElementById("drawer-backdrop");
    if (backdrop) backdrop.addEventListener("click", () => shell.classList.remove("drawer-open"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") shell.classList.remove("drawer-open");
    });
    // Banner dismissal (event delegation)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-banner-dismiss]");
      if (btn) {
        EOS.store.set("banner." + btn.dataset.bannerDismiss, "dismissed");
        btn.closest(".verify-banner").remove();
      }
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  EOS.pages = EOS.pages || {};

  document.addEventListener("DOMContentLoaded", () => {
    const active = document.body.dataset.page;
    renderSidebar(active);
    renderTopbar(active);
    renderBottomNav(active);
    bindGlobalEvents();

    EOS.loadData().then(() => {
      if (EOS.pages[active] && typeof EOS.pages[active].init === "function") {
        EOS.pages[active].init();
      }
      if (EOS.search && typeof EOS.search.init === "function") EOS.search.init();
      EOS.initReveal();
    });
  });
})();
