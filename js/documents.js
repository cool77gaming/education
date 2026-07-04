/* ============================================================
   EducationOS — documents.js
   Lets a user attach their own files (transfer agreement PDF,
   degree plan, observation forms) directly in the browser — no
   server needed. Files are stored as data URLs in localStorage,
   so keep them small (a few MB); browsers cap local storage
   around 5-10MB per origin.
   ============================================================ */

(function () {
  "use strict";
  const EOS = (window.EOS = window.EOS || {});
  const KEY = "documents";
  const MAX_BYTES = 6 * 1024 * 1024;

  EOS.getDocuments = function () { return EOS.store.get(KEY, []); };
  EOS.addDocument = function (doc) {
    const docs = EOS.getDocuments();
    docs.unshift(doc);
    EOS.store.set(KEY, docs);
  };
  EOS.deleteDocument = function (id) {
    EOS.store.set(KEY, EOS.getDocuments().filter((d) => d.id !== id));
  };

  EOS.renderDocumentManager = function (mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    function render() {
      const docs = EOS.getDocuments();
      mount.innerHTML = `
        <div style="margin-bottom:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <label class="btn btn-primary" style="cursor:pointer">
            ${EOS.icons.upload}Upload a document
            <input type="file" id="doc-upload-input" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" class="visually-hidden"/>
          </label>
          <span style="font-size:.76rem;color:var(--ink-3)">Stored only in this browser — keep files under ~5MB.</span>
        </div>
        <div class="grid-cards cols-2">
          ${docs.length ? docs.map((d) => `
            <div class="resource-link" style="align-items:flex-start">
              <span class="rl-icon">${EOS.icons.file}</span>
              <span style="min-width:0;flex:1">
                <span class="rl-title" style="display:block;word-break:break-word">${EOS.escape(d.name)}</span>
                <span class="rl-sub">${(d.size / 1024).toFixed(0)} KB · added ${new Date(d.addedAt).toLocaleDateString()}</span>
                <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                  <a class="btn btn-ghost" href="${d.dataUrl}" download="${EOS.escape(d.name)}" style="padding:5px 11px;font-size:.78rem">${EOS.icons.download}Download</a>
                  <a class="btn btn-ghost" href="${d.dataUrl}" target="_blank" rel="noopener noreferrer" style="padding:5px 11px;font-size:.78rem">${EOS.icons.external}Open</a>
                  <button type="button" class="btn btn-ghost btn-danger" data-del-doc="${d.id}" style="padding:5px 11px;font-size:.78rem">${EOS.icons.trash}Remove</button>
                </div>
              </span>
            </div>`).join("")
            : `<div class="empty-state card" style="grid-column:1/-1">${EOS.icons.file}<p>No documents uploaded yet. Add your Transfer Pathway Agreement or degree plan PDF here so it's always at hand.</p></div>`}
        </div>`;

      const input = mount.querySelector("#doc-upload-input");
      input.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_BYTES) {
          alert(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — that's too large for browser storage. Try a file under 5MB (or compress the PDF).`);
          input.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            EOS.addDocument({ id: "doc-" + Date.now(), name: file.name, size: file.size, type: file.type, dataUrl: reader.result, addedAt: Date.now() });
            EOS.toast("Document added");
            render();
          } catch (err) {
            alert("Couldn't save this file — browser storage may be full. Try removing an old document or using a smaller file.");
          }
        };
        reader.onerror = () => alert("Couldn't read this file. Please try again.");
        reader.readAsDataURL(file);
      });

      mount.querySelectorAll("[data-del-doc]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (confirm("Remove this document?")) { EOS.deleteDocument(btn.dataset.delDoc); render(); }
        });
      });
    }

    render();
  };
})();
