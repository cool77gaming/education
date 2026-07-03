/* ============================================================
   EducationOS — dashboard.js
   Home screen: progress ring, animated stats, recommendation,
   today's tasks, milestones and recent activity.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});
  EOS.pages = EOS.pages || {};

  function todayKey() {
    const d = new Date();
    return `tasks.${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function buildTasks(rec, p) {
    const tasks = [];
    if (rec.phase !== "Done") {
      tasks.push({ id: "t-course", label: `Work on “${rec.course}” (${rec.time || "next up"})` });
    }
    const checklist = EOS.data.settings.checklist;
    const doneChk = new Set(EOS.store.get("checklist", []));
    const nextChk = checklist.find((c) => !doneChk.has(c.id));
    if (nextChk) tasks.push({ id: "t-chk", label: `Milestone prep: ${nextChk.label} — ${nextChk.hint}` });
    if (p.cusBySophia + p.cusByStudy > 0) {
      tasks.push({ id: "t-verify", label: "Verify planned transfers against the official pathway agreement" });
    } else {
      tasks.push({ id: "t-plan", label: "Review the Sophia list and pick this week's courses" });
    }
    return tasks;
  }

  function relTime(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  EOS.pages.dashboard = {
    init() {
      const mount = document.getElementById("dashboard-content");
      const p = EOS.progress();
      const rec = EOS.recommend();
      const saved = EOS.moneySaved(p);
      const s = EOS.getSettings();

      const doneChk = new Set(EOS.store.get("checklist", []));
      const milestones = EOS.data.settings.timeline
        .filter((t) => !t.checklistId || !doneChk.has(t.checklistId))
        .slice(0, 4);

      const currentCourse = EOS.store.get("currentCourse", "") ||
        (rec.phase !== "Done" ? rec.course : "—");

      const activity = EOS.store.get("activity", []);
      const tasks = buildTasks(rec, p);
      const tasksDone = new Set(EOS.store.get(todayKey(), []));

      mount.innerHTML = `
        ${EOS.verifyBanner("dashboard", "Transfer equivalency data in this app was compiled from public sources and could not be checked against your uploaded agreement PDFs. Treat progress as <em>planned</em> until WGU's official evaluation confirms it.")}

        <div class="dash-hero">
          <section class="card ring-card reveal" aria-label="Overall degree progress">
            <div class="ring-wrap">${EOS.ringSVG(190, 13)}
              <div class="ring-center"><span class="pct" id="dash-pct">0%</span><span class="lbl">Degree complete</span></div>
            </div>
            <p style="color:var(--ink-2);font-size:.86rem;max-width:230px">
              ${p.doneCUs} of ${p.totalCUs} competency units planned or complete
            </p>
          </section>

          <div style="display:grid;gap:16px">
            <div class="stat-grid reveal-stagger">
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.award}</span>
                <span class="stat-value" data-count="${p.doneCUs}">0</span>
                <span class="stat-label">Credits completed</span>
                <span class="stat-sub">incl. planned transfers</span>
              </div>
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.target}</span>
                <span class="stat-value" data-count="${p.remainingCUs}">0</span>
                <span class="stat-label">Credits remaining</span>
                <span class="stat-sub">~${p.termsLeft} WGU term${p.termsLeft === 1 ? "" : "s"} left</span>
              </div>
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.calendar}</span>
                <span class="stat-value" style="font-size:1.25rem">${EOS.fmtDate(p.gradDate)}</span>
                <span class="stat-label">Est. graduation</span>
                <span class="stat-sub">at ~${s.paceCUsPerTerm || 20} CUs/term</span>
              </div>
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.dollar}</span>
                <span class="stat-value" data-count="${saved}" data-money>$0</span>
                <span class="stat-label">Money saved</span>
                <span class="stat-sub up">vs paying WGU for those CUs</span>
              </div>
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.sparkles}</span>
                <span class="stat-value">${EOS.store.get("gpa", "P/F")}</span>
                <span class="stat-label">GPA</span>
                <span class="stat-sub">WGU is pass/fail — placeholder</span>
              </div>
              <div class="card stat-tile hoverable">
                <span class="stat-icon">${EOS.icons.book}</span>
                <span class="stat-value" style="font-size:.95rem;line-height:1.3">${EOS.escape(currentCourse)}</span>
                <span class="stat-label">Current course</span>
              </div>
            </div>

            <section class="card recommend-card reveal" aria-labelledby="rec-title">
              <div class="card-title" id="rec-title" style="margin-bottom:4px">${EOS.icons.zap}Next recommended course</div>
              <div class="rec-course">${EOS.escape(rec.course)}</div>
              <p class="rec-reason">${EOS.escape(rec.reason)}</p>
              <div class="recommend-meta">
                <span class="badge badge-accent">${rec.phase}</span>
                ${rec.credits ? `<span class="badge badge-neutral">${rec.credits} credits</span>` : ""}
                ${rec.time ? `<span class="badge badge-neutral">${EOS.icons.clock}${rec.time}</span>` : ""}
                ${rec.difficulty ? `<span class="badge badge-neutral">difficulty ${rec.difficulty}/5</span>` : ""}
                ${rec.verify ? `<span class="badge badge-warn">verify equivalency first</span>` : ""}
              </div>
              <div style="margin-top:16px"><a class="btn btn-primary" href="${rec.href}">Open ${rec.phase === "Done" ? "checklist" : rec.phase}</a></div>
            </section>
          </div>
        </div>

        <div class="grid-cards cols-3 dash-section reveal-stagger">
          <section class="card" aria-labelledby="tasks-title">
            <h2 class="card-title" id="tasks-title">${EOS.icons.checklist}Today's tasks</h2>
            <div id="dash-tasks">
              ${tasks.map((t) => `
                <div class="task-row ${tasksDone.has(t.id) ? "done" : ""}" data-task="${t.id}">
                  <span class="check" role="checkbox" aria-checked="${tasksDone.has(t.id)}" tabindex="0"
                        aria-label="Mark task done">${EOS.icons.check}</span>
                  <span class="task-label">${EOS.escape(t.label)}</span>
                </div>`).join("")}
            </div>
          </section>

          <section class="card" aria-labelledby="ms-title">
            <h2 class="card-title" id="ms-title">${EOS.icons.flame}Upcoming milestones</h2>
            ${milestones.map((m) => `
              <div class="milestone-row">
                <span class="ms-dot"></span>
                <span class="ms-label">${EOS.escape(m.label)}</span>
                <span class="ms-eta">${EOS.escape(m.duration)}</span>
              </div>`).join("") || `<p class="empty-state">All milestones complete 🎉</p>`}
            <div style="margin-top:12px"><a class="btn btn-ghost" href="timeline.html">View full timeline →</a></div>
          </section>

          <section class="card" aria-labelledby="act-title">
            <h2 class="card-title" id="act-title">${EOS.icons.clock}Recent activity</h2>
            ${activity.length
              ? activity.slice(0, 6).map((a) => `
                  <div class="activity-row"><span class="dot"></span>
                    <span>${EOS.escape(a.text)}</span><time>${relTime(a.ts)}</time></div>`).join("")
              : `<div class="empty-state">${EOS.icons.sparkles}<p>Complete your first course and activity shows up here.</p></div>`}
          </section>
        </div>

        <section class="card dash-section reveal" aria-labelledby="mp-title">
          <h2 class="card-title" id="mp-title">${EOS.icons.transfer}Progress by source</h2>
          <div class="mini-progress">
            ${[
              ["Sophia (planned transfer)", p.cusBySophia],
              ["Study.com (planned transfer)", p.cusByStudy],
              ["Completed at WGU", p.cusAtWgu],
            ].map(([name, v]) => {
              const pctv = p.totalCUs ? Math.round((v / p.totalCUs) * 100) : 0;
              return `<div class="mp-row">
                <div class="mp-head"><span class="name">${name}</span><span class="val">${v} CUs · ${pctv}%</span></div>
                <div class="progress-track" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100" aria-label="${name}">
                  <div class="progress-fill" data-w="${pctv}"></div>
                </div></div>`;
            }).join("")}
          </div>
        </section>`;

      /* Animations */
      EOS.setRing(mount.querySelector(".ring-wrap"), p.pct);
      EOS.animateCounter(document.getElementById("dash-pct"), p.pct, { format: (v) => Math.round(v) + "%" });
      mount.querySelectorAll("[data-count]").forEach((el) => {
        const money = el.hasAttribute("data-money");
        EOS.animateCounter(el, +el.dataset.count, money ? { format: (v) => EOS.fmtMoney(v) } : {});
      });
      requestAnimationFrame(() => requestAnimationFrame(() =>
        mount.querySelectorAll(".progress-fill[data-w]").forEach((el) => (el.style.width = el.dataset.w + "%"))));

      /* Task checkboxes */
      const taskBox = document.getElementById("dash-tasks");
      function toggleTask(row) {
        const id = row.dataset.task;
        const key = todayKey();
        const set = new Set(EOS.store.get(key, []));
        set.has(id) ? set.delete(id) : set.add(id);
        EOS.store.set(key, [...set]);
        row.classList.toggle("done", set.has(id));
        row.querySelector(".check").setAttribute("aria-checked", set.has(id));
      }
      taskBox.addEventListener("click", (e) => {
        const row = e.target.closest(".task-row");
        if (row) toggleTask(row);
      });
      taskBox.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.closest(".check")) {
          e.preventDefault();
          toggleTask(e.target.closest(".task-row"));
        }
      });
    },
  };
})();
