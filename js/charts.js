/* ============================================================
   EducationOS — charts.js
   Chart theming (validated palette, thin marks, surface gaps,
   tooltips) + the Transfer Credits and Cost Calculator pages.
   Chart.js is only loaded on pages that need it.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});

  /* ---- Palette from CSS custom properties (validated per theme) ---- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function palette() {
    return {
      s1: cssVar("--chart-1"), // blue
      s2: cssVar("--chart-2"), // yellow
      s3: cssVar("--chart-3"), // aqua
      s4: cssVar("--chart-4"), // violet
      track: cssVar("--chart-track"),
      grid: cssVar("--chart-grid"),
      ink: cssVar("--chart-ink"),
      ink2: cssVar("--chart-ink-2"),
      surface: cssVar("--surface"),
    };
  }

  function baseDefaults() {
    if (!window.Chart) return;
    const p = palette();
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = p.ink2;
    Chart.defaults.plugins.legend.display = false; // custom HTML legends
    Chart.defaults.plugins.tooltip.backgroundColor = p.surface;
    Chart.defaults.plugins.tooltip.titleColor = p.ink;
    Chart.defaults.plugins.tooltip.bodyColor = p.ink2;
    Chart.defaults.plugins.tooltip.borderColor = p.grid;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.animation.duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
  }

  /* Registry so charts rebuild when the theme flips */
  const registry = []; // {canvasId, build}
  const instances = {};
  function mountChart(canvasId, build) {
    registry.push({ canvasId, build });
    drawChart(canvasId, build);
  }
  function drawChart(canvasId, build) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    if (instances[canvasId]) instances[canvasId].destroy();
    baseDefaults();
    instances[canvasId] = new Chart(canvas.getContext("2d"), build(palette()));
  }
  EOS.onThemeChange = function () {
    registry.forEach(({ canvasId, build }) => drawChart(canvasId, build));
  };

  function htmlLegend(items) {
    return `<div class="chart-legend" role="list">` + items.map(([color, label]) =>
      `<span class="li" role="listitem"><span class="swatch" style="background:${color}"></span>${label}</span>`).join("") + `</div>`;
  }

  /* ==========================================================
     TRANSFER CREDITS PAGE
     ========================================================== */
  EOS.pages = EOS.pages || {};

  EOS.pages.transfer = {
    init() {
      const mount = document.getElementById("transfer-content");
      const p = EOS.progress();
      const pal = palette();
      const cats = Object.entries(p.categories);

      mount.innerHTML = `
        ${EOS.verifyBanner("transfer", "These charts reflect <em>planned</em> transfers based on your checkboxes — not an official WGU evaluation. Credits only count once WGU's transcript evaluation confirms them.")}

        <div class="two-col reveal-stagger">
          <section class="card" aria-labelledby="src-title">
            <h2 class="card-title" id="src-title">${EOS.icons.transfer}Credits by source</h2>
            <div class="chart-box"><canvas id="chart-sources" role="img"
              aria-label="Doughnut chart of competency units by source: Sophia ${p.cusBySophia}, Study.com ${p.cusByStudy}, WGU ${p.cusAtWgu}, remaining ${p.remainingCUs}."></canvas></div>
            <div id="chart-sources-legend"></div>
          </section>

          <section class="card ring-card" aria-label="Overall degree progress">
            <div class="ring-wrap">${EOS.ringSVG(190, 13)}
              <div class="ring-center"><span class="pct" id="transfer-pct">0%</span><span class="lbl">of degree</span></div>
            </div>
            <p style="color:var(--ink-2);font-size:.86rem">
              <strong id="transfer-done">${p.doneCUs}</strong> of <strong>${p.totalCUs}</strong> CUs planned or complete
            </p>
          </section>
        </div>

        <section class="card reveal" style="margin-top:16px" aria-labelledby="cat-title">
          <h2 class="card-title" id="cat-title">${EOS.icons.target}Category completion</h2>
          <div class="mini-progress">
            ${cats.map(([name, c]) => {
              const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
              return `<div class="mp-row">
                <div class="mp-head"><span class="name">${name}</span><span class="val">${c.done}/${c.total} CUs · ${pct}%</span></div>
                <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${name} completion">
                  <div class="progress-fill" data-w="${pct}"></div>
                </div>
              </div>`;
            }).join("")}
          </div>
        </section>

        <section class="card reveal" style="margin-top:16px" aria-labelledby="tbl-title">
          <h2 class="card-title" id="tbl-title">${EOS.icons.file}Data table</h2>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th scope="col">Source</th><th scope="col">Competency units</th><th scope="col">Share</th></tr></thead>
              <tbody>
                <tr><td><span class="swatch" style="background:${pal.s1}"></span>Sophia (planned transfer)</td><td>${p.cusBySophia}</td><td>${pct(p.cusBySophia, p.totalCUs)}</td></tr>
                <tr><td><span class="swatch" style="background:${pal.s2}"></span>Study.com (planned transfer)</td><td>${p.cusByStudy}</td><td>${pct(p.cusByStudy, p.totalCUs)}</td></tr>
                <tr><td><span class="swatch" style="background:${pal.s4}"></span>Completed at WGU</td><td>${p.cusAtWgu}</td><td>${pct(p.cusAtWgu, p.totalCUs)}</td></tr>
                <tr><td><span class="swatch" style="background:${pal.track}"></span>Remaining</td><td>${p.remainingCUs}</td><td>${pct(p.remainingCUs, p.totalCUs)}</td></tr>
              </tbody>
            </table>
          </div>
        </section>`;

      function pct(v, t) { return t ? Math.round((v / t) * 100) + "%" : "0%"; }

      // Ring + counters + bars
      EOS.setRing(mount.querySelector(".ring-wrap"), p.pct);
      EOS.animateCounter(document.getElementById("transfer-pct"), p.pct, { format: (v) => Math.round(v) + "%" });
      requestAnimationFrame(() => requestAnimationFrame(() =>
        mount.querySelectorAll(".progress-fill[data-w]").forEach((el) => (el.style.width = el.dataset.w + "%"))));

      // Doughnut — remaining wears the neutral track color (not a series hue)
      document.getElementById("chart-sources-legend").innerHTML = htmlLegend([
        [pal.s1, `Sophia · ${p.cusBySophia} CUs`],
        [pal.s2, `Study.com · ${p.cusByStudy} CUs`],
        [pal.s4, `At WGU · ${p.cusAtWgu} CUs`],
        [pal.track, `Remaining · ${p.remainingCUs} CUs`],
      ]);
      mountChart("chart-sources", (pl) => ({
        type: "doughnut",
        data: {
          labels: ["Sophia (planned)", "Study.com (planned)", "Completed at WGU", "Remaining"],
          datasets: [{
            data: [p.cusBySophia, p.cusByStudy, p.cusAtWgu, p.remainingCUs],
            backgroundColor: [pl.s1, pl.s2, pl.s4, pl.track],
            borderColor: pl.surface, borderWidth: 2, // 2px surface gap between segments
            hoverOffset: 6,
          }],
        },
        options: {
          maintainAspectRatio: false, cutout: "68%",
          plugins: { tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} CUs` } } },
        },
      }));
    },
  };

  /* ==========================================================
     COST CALCULATOR PAGE
     ========================================================== */
  EOS.pages.calculator = {
    init() {
      const mount = document.getElementById("calculator-content");
      const s = EOS.getSettings();
      const saved = EOS.store.get("calc", {});
      const state = {
        sophiaMonths: saved.sophiaMonths ?? s.sophiaMonths,
        studycomMonths: saved.studycomMonths ?? s.studycomMonths,
        wguTerms: saved.wguTerms ?? s.wguTerms,
        books: saved.books ?? s.booksAndSupplies,
        fees: saved.fees ?? s.licensureAndTestingFees,
      };

      const sliders = [
        { key: "sophiaMonths", label: "Sophia subscription", min: 0, max: 12, unit: (v) => `${v} mo`, cost: () => state.sophiaMonths * s.sophiaMonthly, hint: `${EOS.fmtMoney(s.sophiaMonthly)}/month` },
        { key: "studycomMonths", label: "Study.com subscription", min: 0, max: 12, unit: (v) => `${v} mo`, cost: () => state.studycomMonths * s.studycomMonthly, hint: `${EOS.fmtMoney(s.studycomMonthly)}/month` },
        { key: "wguTerms", label: "WGU terms (6 months each)", min: 1, max: 8, unit: (v) => `${v} term${v === 1 ? "" : "s"}`, cost: () => state.wguTerms * (s.wguTermCost + s.wguResourceFeePerTerm), hint: `${EOS.fmtMoney(s.wguTermCost + s.wguResourceFeePerTerm)}/term incl. fees` },
        { key: "books", label: "Books & supplies", min: 0, max: 1500, step: 50, unit: (v) => EOS.fmtMoney(v), cost: () => state.books, hint: "one-time estimate" },
        { key: "fees", label: "Licensure & testing fees", min: 0, max: 2000, step: 50, unit: (v) => EOS.fmtMoney(v), cost: () => state.fees, hint: "Praxis/VCLA, background checks…" },
      ];

      mount.innerHTML = `
        ${EOS.verifyBanner("calculator", "All prices are editable estimates (see Settings for per-unit rates). Confirm current Sophia, Study.com and WGU pricing before budgeting.")}

        <div class="two-col">
          <section class="card reveal" aria-labelledby="calc-title">
            <h2 class="card-title" id="calc-title">${EOS.icons.calculator}Plan your spend</h2>
            <div style="display:grid;gap:22px">
              ${sliders.map((sl) => `
                <div>
                  <div class="slider-row">
                    <label class="field-label" for="sl-${sl.key}" style="margin:0">${sl.label}
                      <span style="color:var(--ink-3);font-weight:500">· ${sl.hint}</span></label>
                    <span class="slider-value" id="sl-${sl.key}-val"></span>
                  </div>
                  <input type="range" class="slider" id="sl-${sl.key}" min="${sl.min}" max="${sl.max}" step="${sl.step || 1}" value="${state[sl.key]}"
                    aria-label="${sl.label}"/>
                </div>`).join("")}
            </div>
          </section>

          <div style="display:grid;gap:16px">
            <section class="card recommend-card reveal" aria-label="Totals">
              <div class="stat-label" style="font-size:.76rem;color:var(--ink-3);font-weight:600">YOUR ESTIMATED TOTAL</div>
              <div class="stat-value" id="calc-total" style="font-size:2.1rem;font-weight:800;letter-spacing:-.03em"></div>
              <div style="display:grid;gap:10px;margin-top:14px;font-size:.88rem">
                <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-2)">Traditional university (4-yr est.)</span><strong id="calc-trad"></strong></div>
                <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-2)">Estimated savings</span><strong id="calc-savings" style="color:var(--good)"></strong></div>
                <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-2)">Monthly average over the plan</span><strong id="calc-monthly"></strong></div>
              </div>
            </section>

            <section class="card reveal" aria-labelledby="breakdown-title">
              <h2 class="card-title" id="breakdown-title">${EOS.icons.dollar}Where the money goes</h2>
              <div class="chart-box" style="height:220px"><canvas id="chart-breakdown" role="img" aria-label="Doughnut chart of cost breakdown; a data table follows."></canvas></div>
              <div id="chart-breakdown-legend"></div>
            </section>
          </div>
        </div>

        <section class="card reveal" style="margin-top:16px" aria-labelledby="cmp-title">
          <h2 class="card-title" id="cmp-title">${EOS.icons.zap}EducationOS plan vs traditional path</h2>
          <div class="chart-box" style="height:200px"><canvas id="chart-compare" role="img" aria-label="Bar chart comparing your plan's total cost against a traditional four-year university."></canvas></div>
          <div id="chart-compare-legend"></div>
          <div class="data-table-wrap" style="margin-top:12px">
            <table class="data-table" id="calc-table">
              <thead><tr><th scope="col">Line item</th><th scope="col">Cost</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </section>`;

      const els = {
        total: document.getElementById("calc-total"),
        trad: document.getElementById("calc-trad"),
        savings: document.getElementById("calc-savings"),
        monthly: document.getElementById("calc-monthly"),
        tbody: mount.querySelector("#calc-table tbody"),
      };

      function costs() {
        const sophia = state.sophiaMonths * s.sophiaMonthly;
        const study = state.studycomMonths * s.studycomMonthly;
        const wguC = state.wguTerms * (s.wguTermCost + s.wguResourceFeePerTerm);
        const extras = state.books + state.fees;
        const total = sophia + study + wguC + extras;
        const months = state.sophiaMonths + state.studycomMonths + state.wguTerms * 6;
        return { sophia, study, wguC, extras, total, months };
      }

      let firstPaint = true;
      function update() {
        const c = costs();
        sliders.forEach((sl) => {
          document.getElementById(`sl-${sl.key}-val`).textContent = sl.unit(state[sl.key]);
        });
        if (firstPaint) {
          EOS.animateCounter(els.total, c.total, { format: (v) => EOS.fmtMoney(v) });
          firstPaint = false;
        } else {
          EOS.cancelCounter(els.total); // stop any in-flight intro animation
          els.total.textContent = EOS.fmtMoney(c.total);
        }
        els.trad.textContent = EOS.fmtMoney(s.traditionalFourYearCost);
        els.savings.textContent = EOS.fmtMoney(Math.max(0, s.traditionalFourYearCost - c.total));
        els.monthly.textContent = c.months ? EOS.fmtMoney(c.total / c.months) + "/mo" : "—";
        els.tbody.innerHTML = `
          <tr><td>Sophia (${state.sophiaMonths} mo)</td><td>${EOS.fmtMoney(c.sophia)}</td></tr>
          <tr><td>Study.com (${state.studycomMonths} mo)</td><td>${EOS.fmtMoney(c.study)}</td></tr>
          <tr><td>WGU tuition + fees (${state.wguTerms} terms)</td><td>${EOS.fmtMoney(c.wguC)}</td></tr>
          <tr><td>Books, supplies, licensure & testing</td><td>${EOS.fmtMoney(c.extras)}</td></tr>
          <tr><td><strong>Total</strong></td><td><strong>${EOS.fmtMoney(c.total)}</strong></td></tr>`;
        EOS.store.set("calc", { ...state });
        drawCharts(c);
      }

      function drawCharts(c) {
        const pal = palette();
        document.getElementById("chart-breakdown-legend").innerHTML = htmlLegend([
          [pal.s1, "Sophia"], [pal.s2, "Study.com"], [pal.s4, "WGU tuition"], [pal.s3, "Books & fees"],
        ]);
        drawChart("chart-breakdown", (pl) => ({
          type: "doughnut",
          data: {
            labels: ["Sophia", "Study.com", "WGU tuition + fees", "Books & fees"],
            datasets: [{
              data: [c.sophia, c.study, c.wguC, c.extras],
              backgroundColor: [pl.s1, pl.s2, pl.s4, pl.s3],
              borderColor: pl.surface, borderWidth: 2, hoverOffset: 6,
            }],
          },
          options: {
            maintainAspectRatio: false, cutout: "66%",
            plugins: { tooltip: { callbacks: { label: (x) => ` ${x.label}: ${EOS.fmtMoney(x.parsed)}` } } },
          },
        }));

        document.getElementById("chart-compare-legend").innerHTML = htmlLegend([
          [pal.s1, `Your plan · ${EOS.fmtMoney(c.total)}`],
          [pal.track, `Traditional 4-year · ${EOS.fmtMoney(s.traditionalFourYearCost)}`],
        ]);
        drawChart("chart-compare", (pl) => ({
          type: "bar",
          data: {
            labels: ["Your EducationOS plan", "Traditional 4-year university"],
            datasets: [{
              data: [c.total, s.traditionalFourYearCost],
              backgroundColor: [pl.s1, pl.track],
              borderRadius: { topRight: 4, bottomRight: 4 },
              barThickness: 26, borderSkipped: "start",
            }],
          },
          options: {
            indexAxis: "y", maintainAspectRatio: false,
            scales: {
              x: { grid: { color: pl.grid, drawTicks: false }, border: { display: false },
                   ticks: { callback: (v) => "$" + (v / 1000) + "k" } },
              y: { grid: { display: false }, border: { display: false }, ticks: { color: pl.ink } },
            },
            plugins: { tooltip: { callbacks: { label: (x) => ` ${EOS.fmtMoney(x.parsed.x)}` } } },
          },
        }));
      }

      sliders.forEach((sl) => {
        const input = document.getElementById(`sl-${sl.key}`);
        input.addEventListener("input", () => { state[sl.key] = +input.value; update(); });
      });
      update();
    },
  };
})();
