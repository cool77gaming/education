# EducationOS 🎓

A Notion-inspired, dark-mode-first **degree planning dashboard** for completing the
**WGU Bachelor of Arts in Elementary Education** as quickly and cheaply as possible —
Sophia first, Study.com for the gaps, then an accelerated run at WGU, ending with
Virginia licensure.

**No backend. No build step. No frameworks.** Pure HTML + CSS + vanilla JavaScript
(+ Tailwind and Chart.js from CDNs). Everything saves to the browser's local storage.
Upload it to GitHub Pages and it just works.

---

## Data sources

The WGU and Sophia data in this app is sourced directly from official documents:

- **`data/wgu.json`** — WGU Program Guidebook, *Bachelor of Arts, Elementary Education*,
  Catalog Version 202603 (published 12/11/2025). All 37 courses / 120 competency units
  match that guide exactly.
- **`data/sophia.json`** — WGU × Sophia Learning Transfer Pathway Agreement for this
  program (uniqueId BAELED7113). All 9 confirmed transfer requirements (26 of 120 CUs)
  match that agreement exactly, including every alternative course code offered per
  requirement.
- **`data/studycom.json`** — No official Study.com articulation agreement exists for
  this program. The two WGU requirements with no confirmed transfer path are flagged
  as "needs manual review" rather than guessed.

Course names, codes, and prices can change between catalog versions — if your degree
plan differs, re-verify with your WGU enrollment counselor and update the data using
the in-app editor described below (no JSON editing required).

| Label | Meaning |
|---|---|
| `Confirmed · official agreement` | Directly from the signed Transfer Pathway Agreement |
| `Community-reported · verify` | Reported to work by students — confirm before purchasing |
| `Needs manual review` | Conflicting or missing information — do not act without confirming |
| `Unlikely to apply` | Probably wasted money for this degree — listed so you don't buy it |

## Editing data from the app — no JSON required

Every course list (Sophia, Study.com, WGU) has a **"+ Add course"** button in the
toolbar, and each course card has **Edit** and **Delete** buttons once expanded.
Changes save to this browser's local storage as an overlay on top of the shipped
data — nothing on disk changes, and search, progress, and the recommendation engine
all pick up your edits immediately. If you want to start over, **Settings → Course
data edits** has a one-click reset per list (Sophia / Study.com / WGU).

You can still hand-edit the JSON files in `data/` before publishing if you prefer —
see [Updating transfer data](#updating-transfer-data) below.

## Attaching your own documents

The **Resources** page has a **Your documents** section where you can upload files
(your Transfer Pathway Agreement, degree plan, observation forms, etc.) directly from
the browser — no server, no `assets/` folder editing. Files are stored as the browser's
local storage, so keep them under ~5MB each; use **Download** or **Open** to get them
back, and **Remove** to delete.

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

Prefer the in-app editor (see above) for day-to-day changes. To bulk-edit or reset
the baseline data before publishing, edit the JSON files in `data/` directly —
no code changes needed:

- **`data/wgu.json`** — the degree plan. Each course has `code` (usually `null` —
  WGU's Program Guide doesn't publish codes; check MyWGU for yours), `name`, `cus`,
  `category`, `assessment` (`PA` if the Program Guide explicitly describes a
  performance/observation task, otherwise `Verify`), `difficulty` (1–5), `estHours`,
  `prereqs` (array of course ids), `transferable`, `sophiaId` / `studycomId` (the
  transfer course that covers it), `resources`, `notes`.
  The **degree total is computed from this list**, so keeping it accurate keeps
  every chart accurate.
- **`data/sophia.json`** — Sophia courses. `wguCourseId` links a course to the WGU
  requirement it satisfies; `status` is one of `pathway` / `community` / `review`
  / `unlikely` (drives the colored badges).
- **`data/studycom.json`** — same idea, plus `recommendation` (`worth` / `optional`
  / `skip`), `assignments`, `finalExam`, `estCost`.
- **`data/reddit.json`** — advice cards (`title`, `summary`, `tags`, `impact`).
- **`data/settings.json`** — default prices, the timeline stages and the checklist.

### Adding a course

Easiest: use the **"+ Add course"** button on the Sophia, Study.com, or WGU page.
To add one in the JSON instead, add an object to the `courses` array with a
**unique `id`** (e.g. `"soph-intro-ethics"`). If it transfers, set `wguCourseId` to
the matching id in `wgu.json`. Either way, search, filters, progress and the
recommendation engine pick it up automatically.

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
