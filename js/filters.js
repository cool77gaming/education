/* ============================================================
   EducationOS — filters.js
   Reusable course-list component with search, filter chips,
   sorting, expandable cards, completion checkboxes, per-course
   notes, and inline add/edit/delete. Powers the Sophia,
   Study.com and WGU pages.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});

  /**
   * config = {
   *   mount, collection, storeKey,         // collection: "sophia"|"studycom"|"wgu"
   *   searchFields: ["name", ...],
   *   chips: [{id,label,match(course)}],   // filter chips (first = All)
   *   sorts: [{id,label,fn(a,b)}],
   *   renderHead(course), renderBody(course),
   *   progressEl,                          // optional {bar, label} ids
   *   creditsOf(course)
   * }
   */
  EOS.courseList = function (config) {
    const mount = document.getElementById(config.mount);
    if (!mount) return;

    let query = "";
    let chip = config.chips[0].id;
    let sortId = config.sorts[0].id;
    const openSet = new Set();

    function allCourses() { return EOS.getCourses(config.collection); }
    function done(id) { return EOS.store.isInList(config.storeKey, id); }

    function visibleCourses() {
      const q = query.trim().toLowerCase();
      const activeChip = config.chips.find((c) => c.id === chip);
      let list = allCourses().filter((c) => (activeChip.match ? activeChip.match(c) : true));
      if (q) {
        list = list.filter((c) =>
          config.searchFields.some((f) => String(c[f] ?? "").toLowerCase().includes(q)));
      }
      const sort = config.sorts.find((s) => s.id === sortId);
      return [...list].sort(sort.fn);
    }

    function updateProgress() {
      if (!config.progressEl) return;
      const all = allCourses();
      const doneList = all.filter((c) => done(c.id));
      const doneCr = doneList.reduce((t, c) => t + config.creditsOf(c), 0);
      const totalCr = all.reduce((t, c) => t + config.creditsOf(c), 0);
      const pct = totalCr ? Math.round((doneCr / totalCr) * 100) : 0;
      const bar = document.getElementById(config.progressEl.bar);
      const label = document.getElementById(config.progressEl.label);
      if (bar) { bar.style.width = pct + "%"; bar.setAttribute("aria-valuenow", pct); }
      if (label) label.textContent = `${doneList.length} of ${all.length} courses · ${doneCr} of ${totalCr} credits · ${pct}%`;
    }

    function render() {
      const list = visibleCourses();
      if (!list.length) {
        mount.innerHTML = `<div class="empty-state card">${EOS.icons.search}<p>No courses match. Try a different search or filter.</p></div>`;
        return;
      }
      mount.innerHTML = list.map((c) => {
        const isDone = done(c.id);
        const isOpen = openSet.has(c.id);
        const custom = EOS.isCustomCourse(config.collection, c.id);
        return `
        <article class="card course-card hoverable ${isDone ? "done" : ""} ${isOpen ? "open" : ""}" data-course="${c.id}">
          <div class="course-head" role="button" tabindex="0" aria-expanded="${isOpen}"
               aria-label="${EOS.escape(c.name)} — expand details">
            <span class="check" role="checkbox" aria-checked="${isDone}" tabindex="0"
                  aria-label="Mark ${EOS.escape(c.name)} complete" data-check="${c.id}">${EOS.icons.check}</span>
            <div class="course-main">${config.renderHead(c)}</div>
            ${custom ? '<span class="badge badge-accent" style="flex:none">Custom</span>' : ""}
            <span class="chevron">${EOS.icons.chevronDown}</span>
          </div>
          <div class="course-body"><div><div class="course-body-inner">
            <div style="display:flex;gap:8px">
              <button type="button" class="btn btn-ghost" data-edit-course="${c.id}" style="padding:5px 12px;font-size:.78rem">${EOS.icons.settings}Edit</button>
              <button type="button" class="btn btn-ghost btn-danger" data-delete-course="${c.id}" style="padding:5px 12px;font-size:.78rem">${EOS.icons.trash}Delete</button>
            </div>
            ${config.renderBody(c)}
            <div class="note-box">
              <label class="field-label" for="note-${c.id}">Personal notes</label>
              <textarea class="textarea" id="note-${c.id}" data-note="${c.id}"
                placeholder="Notes, verification status, exam dates…">${EOS.escape(EOS.store.get("notes." + c.id, ""))}</textarea>
              <span class="saved-flash" data-flash="${c.id}">Saved ✓</span>
            </div>
          </div></div></div>
        </article>`;
      }).join("");
      updateProgress();
    }

    /* ---- Event delegation on the mount ---- */
    mount.addEventListener("click", (e) => {
      const check = e.target.closest("[data-check]");
      if (check) {
        e.stopPropagation();
        const id = check.dataset.check;
        const nowDone = EOS.store.toggleInList(config.storeKey, id);
        const course = allCourses().find((c) => c.id === id);
        EOS.store.logActivity(`${nowDone ? "Completed" : "Un-completed"}: ${course.name}`);
        if (nowDone) EOS.toast(`${course.name} marked complete`);
        render();
        return;
      }
      const editBtn = e.target.closest("[data-edit-course]");
      if (editBtn) {
        e.stopPropagation();
        const course = allCourses().find((c) => c.id === editBtn.dataset.editCourse);
        EOS.openCourseEditor(config.collection, course, render);
        return;
      }
      const delBtn = e.target.closest("[data-delete-course]");
      if (delBtn) {
        e.stopPropagation();
        const course = allCourses().find((c) => c.id === delBtn.dataset.deleteCourse);
        if (confirm(`Delete "${course.name}"? You can undo this in Settings → Reset course data.`)) {
          EOS.deleteCourse(config.collection, course.id);
          EOS.toast("Course deleted");
          render();
        }
        return;
      }
      const head = e.target.closest(".course-head");
      if (head) {
        const id = head.closest(".course-card").dataset.course;
        openSet.has(id) ? openSet.delete(id) : openSet.add(id);
        render();
      }
    });

    mount.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const check = e.target.closest("[data-check]");
      const head = e.target.closest(".course-head");
      if (check || head) { e.preventDefault(); (check || head).click(); }
    });

    let noteTimer = null;
    mount.addEventListener("input", (e) => {
      const ta = e.target.closest("[data-note]");
      if (!ta) return;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        EOS.store.set("notes." + ta.dataset.note, ta.value);
        const flash = mount.querySelector(`[data-flash="${ta.dataset.note}"]`);
        if (flash) { flash.classList.add("show"); setTimeout(() => flash.classList.remove("show"), 1400); }
      }, 450);
    });

    /* ---- Toolbar wiring ---- */
    const searchInput = document.getElementById(config.mount + "-search");
    if (searchInput) searchInput.addEventListener("input", () => { query = searchInput.value; render(); });

    const chipRow = document.getElementById(config.mount + "-chips");
    if (chipRow) {
      chipRow.innerHTML = config.chips.map((c) =>
        `<button class="chip ${c.id === chip ? "active" : ""}" data-chip="${c.id}" aria-pressed="${c.id === chip}">${c.label}</button>`).join("");
      chipRow.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-chip]");
        if (!btn) return;
        chip = btn.dataset.chip;
        chipRow.querySelectorAll(".chip").forEach((el) => {
          const on = el.dataset.chip === chip;
          el.classList.toggle("active", on);
          el.setAttribute("aria-pressed", on);
        });
        render();
      });
    }

    const sortSel = document.getElementById(config.mount + "-sort");
    if (sortSel) {
      sortSel.innerHTML = config.sorts.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
      sortSel.addEventListener("change", () => { sortId = sortSel.value; render(); });
    }

    const addBtn = document.getElementById(config.mount + "-add");
    if (addBtn) addBtn.addEventListener("click", () => EOS.openCourseEditor(config.collection, null, render));

    // Deep-link (from global search): ?open=<courseId>
    const openParam = new URLSearchParams(location.search).get("open");
    if (openParam && allCourses().some((c) => c.id === openParam)) {
      openSet.add(openParam);
      render();
      setTimeout(() => {
        const el = mount.querySelector(`[data-course="${openParam}"]`);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.borderColor = "var(--accent-1)"; }
      }, 150);
    } else {
      render();
    }

    return { render };
  };
})();
