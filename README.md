# EducationOS 🎓

A Notion-inspired, dark-mode-first **degree planning dashboard** for completing the
**WGU Bachelor of Arts in Elementary Education** as quickly and cheaply as possible —
Sophia first, Study.com for the gaps, then an accelerated run at WGU, ending with
Virginia licensure.

**No backend. No build step. No frameworks.** Pure HTML + CSS + vanilla JavaScript
(+ Tailwind and Chart.js from CDNs). Everything saves to the browser's local storage.
Upload it to GitHub Pages and it just works.

---

## ⚠️ Important: verify the transfer data

This app was built without access to the official **WGU Transfer Pathway Agreement**
and **BAELED Program Guide** PDFs (they weren't in the repository when the data was
compiled). Course lists and equivalencies were reconstructed from publicly documented
WGU/Sophia pathway information and community reports, and **every mapping is labeled**
in the UI:

| Label | Meaning |
|---|---|
| `Pathway-listed · verify` | Widely published on the official pathway — still confirm your catalog year |
| `Community-reported · verify` | Reported to work by students — confirm before purchasing |
| `Needs manual review` | Conflicting or missing information — do not act without confirming |
| `Unlikely to apply` | Probably wasted money for this degree — listed so you don't buy it |

**Before purchasing any course, verify the equivalency against your official
agreement or a WGU enrollment counselor**, then correct `data/*.json` to match
(see [Updating transfer data](#updating-transfer-data)).

---

## Pages

| Page | What it does |
|---|---|
| `dashboard.html` | Progress ring, credits done/remaining, est. graduation, money saved, next recommended course, today's tasks, milestones, recent activity |
| `sophia.html` | Every relevant Sophia course — status, difficulty, hours, notes, completion checkboxes, search/filter/sort |
| `studycom.html` | Study.com gap-fillers — worth/optional/skip, exams, costs, tips |
| `transfer.html` | Charts: credits by source, category completion, overall degree % |
| `wgu.html` | Full WGU degree tracker — OA/PA, prerequisites, resources, notes |
| `timeline.html` | Animated roadmap: FAFSA → Sophia → Study.com → … → Virginia Licensure |
| `calculator.html` | Interactive cost sliders + savings vs a traditional university |
| `tracker.html` | Master milestone checklist (auto-syncs with timeline & dashboard) |
| `reddit.html` | Searchable community-advice cards (clearly labeled as anecdotes) |
| `resources.html` | Official WGU / Sophia / Study.com / Virginia DOE links & templates |
| `settings.html` | Theme, planning assumptions, pricing, export/import/reset |

Completing a course anywhere updates degree progress everywhere — the Sophia and
Study.com courses are linked to the WGU courses they cover.

---

## Deploying to GitHub Pages

1. Create a repository (e.g. `education-os`) and push/upload **all files in this
   folder** (keep the folder structure intact).
2. In the repo: **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → **Save**.
4. Wait ~1 minute. Your dashboard is live at
   `https://<your-username>.github.io/<repo-name>/`.

Any push to `main` re-deploys automatically.

### Running locally

Browsers block `fetch()` of local JSON when a page is opened straight from disk,
so use any static server:

```bash
cd education-os
python3 -m http.server 8080
# open http://localhost:8080
```

---

## Updating transfer data

All content lives in `data/` — no code changes needed:

- **`data/wgu.json`** — the degree plan. Each course has `code`, `name`, `cus`,
  `category`, `assessment` (`OA`/`PA`), `difficulty` (1–5), `estHours`, `prereqs`
  (array of course ids), `transferable`, `sophiaId` / `studycomId` (the transfer
  course that covers it), `resources`, `notes`.
  The **degree total is computed from this list**, so keeping it accurate keeps
  every chart accurate. When you get your official degree plan, correct the codes
  (many are marked `null` — "code: see degree plan") and add/remove courses.
- **`data/sophia.json`** — Sophia courses. `wguCourseId` links a course to the WGU
  requirement it satisfies; `status` is one of `pathway` / `community` / `review`
  / `unlikely` (drives the colored badges).
- **`data/studycom.json`** — same idea, plus `recommendation` (`worth` / `optional`
  / `skip`), `assignments`, `finalExam`, `estCost`.
- **`data/reddit.json`** — advice cards (`title`, `summary`, `tags`, `impact`).
- **`data/settings.json`** — default prices, the timeline stages and the checklist.

### Adding a course

Add an object to the `courses` array of the relevant file with a **unique `id`**
(e.g. `"soph-intro-ethics"`). If it transfers, set `wguCourseId` to the matching id
in `wgu.json`. That's it — search, filters, progress and the recommendation engine
pick it up automatically.

---

## Customizing

- **Colors / branding** — edit the CSS custom properties at the top of
  `css/style.css` (`--accent-1`, `--accent-2`, surfaces, chart palette).
  The chart palette was validated for color-blind safety and contrast in both
  themes; if you change it, keep the hues distinguishable.
- **Prices & pace** — Settings page (persisted per browser), or change the
  defaults in `data/settings.json`.
- **Timeline / checklist stages** — `data/settings.json`.
- **Navigation** — `EOS.nav` in `js/app.js`.

### Your data & backups

Everything (completions, notes, calculator, settings, theme) is stored in
`localStorage` under `eos.*` keys — private to the browser, no account needed.
**Settings → Export backup** downloads a JSON snapshot; **Import backup** restores
it on another device.

---

## Tech notes

- **Stack**: HTML5, custom CSS (+ Tailwind via CDN for utilities), vanilla JS,
  Chart.js (loaded only on the two pages that chart).
- **Performance**: no framework, one small JS bundle per page, `defer`red chart
  library, system-quality font loading, CSS-only animations (transform/opacity),
  `prefers-reduced-motion` respected.
- **Accessibility**: keyboard-navigable cards and checkboxes (`role="checkbox"`,
  Enter/Space), ARIA labels on charts with data-table fallbacks, focus rings,
  skip-to-content link, high-contrast validated palettes.
- **Search**: press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> (or <kbd>/</kbd>) anywhere.
- For maximum Lighthouse scores you can replace the Tailwind CDN `<script>` with a
  pre-compiled Tailwind CSS file — the app's own stylesheets don't depend on it.

## License

MIT — see [LICENSE](LICENSE).
