/* ============================================================
   EducationOS — editor.js
   Lets a user add, edit, or delete Sophia/Study.com/WGU courses
   entirely from the browser — no JSON editing required. Changes
   are stored as a localStorage overlay on top of the shipped
   data/*.json files (added / edited / deleted), merged at read
   time via EOS.getCourses(collection). Nothing on disk changes;
   "Reset to official data" (Settings) clears the overlay.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});

  function editsKey(collection) { return "edits." + collection; }
  function getEdits(collection) {
    return EOS.store.get(editsKey(collection), { added: [], edited: {}, deleted: [] });
  }
  function setEdits(collection, edits) { EOS.store.set(editsKey(collection), edits); }

  /* Merged view: base JSON courses, minus deleted, with edits applied, plus added. */
  EOS.getCourses = function (collection) {
    const base = EOS.data[collection].courses;
    const edits = getEdits(collection);
    const deleted = new Set(edits.deleted || []);
    const merged = base
      .filter((c) => !deleted.has(c.id))
      .map((c) => (edits.edited[c.id] ? Object.assign({}, c, edits.edited[c.id]) : c));
    return merged.concat(edits.added || []);
  };

  EOS.isCustomCourse = function (collection, id) {
    return (getEdits(collection).added || []).some((c) => c.id === id);
  };

  EOS.addCourse = function (collection, course) {
    const edits = getEdits(collection);
    edits.added = edits.added || [];
    edits.added.push(course);
    setEdits(collection, edits);
    EOS.store.logActivity(`Added a custom course: ${course.name}`);
  };

  EOS.updateCourse = function (collection, id, patch) {
    const edits = getEdits(collection);
    const addedIdx = (edits.added || []).findIndex((c) => c.id === id);
    if (addedIdx >= 0) edits.added[addedIdx] = Object.assign({}, edits.added[addedIdx], patch);
    else {
      edits.edited = edits.edited || {};
      edits.edited[id] = Object.assign({}, edits.edited[id] || {}, patch);
    }
    setEdits(collection, edits);
  };

  EOS.deleteCourse = function (collection, id) {
    const edits = getEdits(collection);
    const addedIdx = (edits.added || []).findIndex((c) => c.id === id);
    if (addedIdx >= 0) edits.added.splice(addedIdx, 1);
    else {
      edits.deleted = edits.deleted || [];
      if (!edits.deleted.includes(id)) edits.deleted.push(id);
    }
    setEdits(collection, edits);
  };

  EOS.hasCourseEdits = function (collection) {
    const e = getEdits(collection);
    return (e.added && e.added.length) || Object.keys(e.edited || {}).length || (e.deleted && e.deleted.length);
  };

  EOS.resetCourseEdits = function (collection) { EOS.store.remove(editsKey(collection)); };

  /* ----------------------------------------------------------
     Generic modal editor — one field schema per collection
     ---------------------------------------------------------- */
  const SCHEMAS = {
    sophia: [
      { key: "name", label: "Course name", type: "text", required: true },
      { key: "credits", label: "Credits", type: "number", required: true },
      { key: "wguCourseId", label: "WGU requirement this satisfies", type: "wguSelect" },
      { key: "wguEquivalent", label: "WGU equivalent (display text)", type: "text" },
      { key: "status", label: "Status", type: "select", options: [["pathway", "Confirmed / official"], ["community", "Community-reported"], ["review", "Needs manual review"], ["unlikely", "Unlikely to apply"]] },
      { key: "difficulty", label: "Difficulty (1–5)", type: "number", min: 1, max: 5 },
      { key: "estHours", label: "Est. hours", type: "number" },
      { key: "estDays", label: "Est. days", type: "number" },
      { key: "notes", label: "Official notes", type: "textarea" },
      { key: "tips", label: "Tip", type: "textarea" },
    ],
    studycom: [
      { key: "name", label: "Course name", type: "text", required: true },
      { key: "credits", label: "Credits", type: "number", required: true },
      { key: "recommendation", label: "Recommendation", type: "select", options: [["worth", "Worth taking"], ["optional", "Optional"], ["skip", "Skip"]] },
      { key: "wguCourseId", label: "WGU requirement this satisfies", type: "wguSelect" },
      { key: "wguEquivalent", label: "WGU equivalent (display text)", type: "text" },
      { key: "status", label: "Status", type: "select", options: [["pathway", "Confirmed / official"], ["community", "Community-reported"], ["review", "Needs manual review"], ["unlikely", "Unlikely to apply"]] },
      { key: "difficulty", label: "Difficulty (1–5)", type: "number", min: 1, max: 5 },
      { key: "estHours", label: "Est. hours", type: "number" },
      { key: "assignments", label: "Assignments", type: "number" },
      { key: "finalExam", label: "Final exam", type: "text" },
      { key: "estCost", label: "Est. cost ($)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "tips", label: "Tip", type: "textarea" },
    ],
    wgu: [
      { key: "name", label: "Course name", type: "text", required: true },
      { key: "code", label: "Course code (if known)", type: "text" },
      { key: "cus", label: "Competency units", type: "number", required: true },
      { key: "category", label: "Category", type: "select", optionsFrom: "wguCategories" },
      { key: "assessment", label: "Assessment type", type: "select", options: [["PA", "Performance Assessment"], ["Verify", "Not stated / verify"]] },
      { key: "difficulty", label: "Difficulty (1–5)", type: "number", min: 1, max: 5 },
      { key: "estHours", label: "Est. hours", type: "number" },
      { key: "transferable", label: "Transferable", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  };

  function fieldHtml(f, existing) {
    const val = existing ? existing[f.key] : f.type === "checkbox" ? false : "";
    const id = "ce-" + f.key;
    if (f.type === "textarea") {
      return `<div><label class="field-label" for="${id}">${f.label}</label><textarea class="textarea" id="${id}" name="${f.key}">${EOS.escape(val || "")}</textarea></div>`;
    }
    if (f.type === "checkbox") {
      return `<div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="${id}" name="${f.key}" ${val ? "checked" : ""}/><label class="field-label" style="margin:0" for="${id}">${f.label}</label></div>`;
    }
    if (f.type === "select" || f.type === "wguSelect") {
      let opts;
      if (f.type === "wguSelect") {
        const wguCourses = EOS.getCourses("wgu");
        opts = `<option value="">— none —</option>` + wguCourses.map((c) => `<option value="${c.id}" ${val === c.id ? "selected" : ""}>${EOS.escape(c.name)}</option>`).join("");
      } else if (f.optionsFrom === "wguCategories") {
        opts = EOS.data.wgu.meta.categories.map((cat) => `<option value="${cat}" ${val === cat ? "selected" : ""}>${cat}</option>`).join("");
      } else {
        opts = f.options.map(([v, l]) => `<option value="${v}" ${val === v ? "selected" : ""}>${l}</option>`).join("");
      }
      return `<div><label class="field-label" for="${id}">${f.label}</label><select class="select" id="${id}" name="${f.key}">${opts}</select></div>`;
    }
    return `<div><label class="field-label" for="${id}">${f.label}</label><input class="input" type="${f.type}" id="${id}" name="${f.key}" value="${EOS.escape(val == null ? "" : val)}" ${f.required ? "required" : ""}/></div>`;
  }

  function slugify(collection, name) {
    const prefix = collection === "wgu" ? "wgu-" : collection === "sophia" ? "soph-" : "study-";
    const base = prefix + String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
    const existing = new Set(EOS.getCourses(collection).map((c) => c.id));
    let id = base || prefix + "course", n = 1;
    while (existing.has(id)) id = base + "-" + ++n;
    return id;
  }

  EOS.openCourseEditor = function (collection, existing, onSave) {
    const schema = SCHEMAS[collection];
    const overlay = document.createElement("div");
    overlay.className = "search-overlay open";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", existing ? "Edit course" : "Add course");
    overlay.innerHTML = `
      <div class="search-panel" style="max-width:560px">
        <div class="search-input-row">
          <strong style="font-size:1rem">${existing ? "Edit course" : "Add a course"}</strong>
          <button type="button" class="icon-btn" data-close aria-label="Close" style="margin-left:auto">${EOS.icons.x}</button>
        </div>
        <form id="course-editor-form" style="padding:18px;display:grid;gap:14px;max-height:56vh;overflow-y:auto">
          ${schema.map((f) => fieldHtml(f, existing)).join("")}
        </form>
        <div class="search-footer" style="justify-content:flex-end;gap:10px">
          ${existing ? `<button type="button" class="btn btn-danger" data-delete>${EOS.icons.trash}Delete</button>` : ""}
          <button type="button" class="btn" data-close>Cancel</button>
          <button type="submit" form="course-editor-form" class="btn btn-primary">Save</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("input,select,textarea").focus();

    function close() { overlay.remove(); }
    overlay.addEventListener("click", (e) => { if (e.target === overlay || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });

    const delBtn = overlay.querySelector("[data-delete]");
    if (delBtn) delBtn.addEventListener("click", () => {
      if (confirm(`Delete "${existing.name}"? This can be undone in Settings → Reset course data.`)) {
        EOS.deleteCourse(collection, existing.id);
        EOS.toast("Course deleted");
        close();
        onSave && onSave();
      }
    });

    overlay.querySelector("#course-editor-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const obj = {};
      schema.forEach((f) => {
        if (f.type === "checkbox") { obj[f.key] = fd.has(f.key); return; }
        let v = fd.get(f.key);
        if (f.type === "number") v = v === "" ? 0 : Number(v);
        else if (v === "") v = f.key === "wguCourseId" ? null : (existing ? existing[f.key] ?? "" : "");
        obj[f.key] = v;
      });
      if (existing) {
        EOS.updateCourse(collection, existing.id, obj);
        EOS.toast("Course updated");
      } else {
        obj.id = slugify(collection, obj.name);
        EOS.addCourse(collection, obj);
        EOS.toast("Course added");
      }
      close();
      onSave && onSave();
    });
  };
})();
