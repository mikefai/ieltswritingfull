# Build a complete IELTS Academic Writing course

## Goal

Evolve the existing static IELTS timed-practice page into a responsive self-paced course for learners at different starting points, while retaining its 15 exercises and reliable writing tools. Follow the agreed 24-lesson curriculum, use the provided design concepts, and do not publish or deploy the site.

## Architecture

- Keep the existing vanilla HTML/CSS/JavaScript architecture; add no framework or runtime dependency.
- Keep `data/exercises.json` and its renderer as the practice bank.
- Add `data/course.json` for course units, lesson teaching content, examples, checks, challenge variants, and exercise links.
- Add `js/course-progress.js` as a small browser/Node-compatible local progress model; add `js/course-view.js` for escaped lesson/dashboard/progress markup.
- Extend `index.html` with a shared navigation shell and Learn, Practice, Progress view containers. Preserve the current practice IDs and markup within the Practice view.
- Extend `js/app.js` to load both JSON files, switch between views, handle course actions, and keep the existing practice actions intact.
- Extend `css/styles.css` with styles that use the established palette and type, with responsive dashboard, lesson, curriculum navigation, progress summary, controls, and focus states.
- Keep all state on-device. Course progress uses its own versioned key; exercise drafts continue using `ielts-writing:v1:`.

## Task 1 — Establish the course content and progress model

1. Copy the approved visual concepts into `docs/superpowers/design/` and link them from the spec.
2. Create `data/course.json` with the five units and all 24 lessons. Each lesson contains a specific objective, useful teaching explanation, worked example, one single-answer retrieval check with feedback, Guided/Core/Stretch tasks, estimated minutes, and zero or more existing exercise IDs.
3. Make Task 1 cover charts, tables, overview/key features, comparisons, numerical accuracy, maps, processes, and combined visuals. Make Task 2 cover prompt analysis, positions/planning, paragraph structure/development, and the common question families. Cover IELTS vocabulary, grammar, cohesion, and editing explicitly.
4. Implement `js/course-progress.js`: safely load/save versioned route/focus/difficulty, most-recent lesson, completed lesson IDs, checkpoint answers, and practice history. Derive course/unit totals from course data. Expose small deterministic methods for state updates and summary derivation.
5. Verify all authored exercise references exist in `data/exercises.json` by inspecting the data structure during authoring; do not create placeholder links.

## Task 2 — Build the shared app shell and Learn dashboard

1. Add Learn/Practice/Progress navigation with clear current-page semantics and an accessible narrow-screen layout.
2. Keep the current practice masthead, task selector, exercise strip, and timers inside the Practice section.
3. Build Learn dashboard content from `course.json` and progress state: course purpose, derived completion, route/focus/difficulty inputs, recommended next lesson, resume action, upcoming practice link, and all units/lessons.
4. Save route/focus/difficulty changes locally. Each lesson remains available regardless of the selected route.
5. Handle empty, first-visit, and returning-learner states without claiming an IELTS level.

## Task 3 — Build the lesson experience and connect practice

1. Render lesson context, objective, readable teaching sections, example, retrieval check with feedback, selected challenge level, related exercise links, completion state, and next/previous navigation.
2. Support Guided/Core/Stretch selection and lesson completion from controls with keyboard and touch.
3. Add direct course-to-practice navigation while preserving the current selected exercise within its group and keeping learner drafts intact.
4. Keep authored content text escaped and interactive state represented with semantic buttons, labels, and `aria-pressed`/`aria-current` where appropriate.

## Task 4 — Build Progress and responsive visual system

1. Build a Progress page with total completion, progress by unit, route/focus/difficulty settings, recent exercise activity, and an actionable continue/review link.
2. Record meaningful practice history from exercise visits or edits without storing essay text in the course model.
3. Add responsive styles for all course screens using existing design tokens; use a two-column desktop composition and a compact mobile single-column flow.
4. Ensure practice remains legible, charts remain contained, sticky navigation does not obstruct content, and course controls remain easy to use on touch screens.
5. Keep self-assessment, local-storage, and independent-study limits clear where learners encounter progress or criterion feedback.

## Task 5 — Design review and handoff

1. Start a local static server and inspect the implemented Learn, Lesson, Progress, and Practice screens against the generated concepts at desktop and narrow mobile widths. Adjust layout, spacing, type hierarchy, active states, and responsive reading order based on the rendered interface.
2. Exercise the learner path manually: open Learn, choose a route, open a lesson, answer its check, change challenge, complete the lesson, visit Progress, open a linked practice exercise, and confirm course and writing states remain separate.
3. Inspect console/network state for load errors and confirm the course JSON and exercise JSON load locally; do not call any deployment/publishing capability.
4. Update README and local generated `freebuff-sites-build/assets` mirror to reflect the course only if its assets mirror is safe to refresh. Leave deploy metadata and publication state untouched.
5. Report the local preview address, changed files, visual review evidence, and any remaining product limits.

## Working constraints

- Do not add app dependencies or convert to a framework.
- Do not introduce AI scoring or an implied band estimate.
- Do not remove, rename, or reset existing draft storage.
- Do not deploy, publish, or alter hosting configuration.
- Avoid changing unrelated product data.

## Implementation status

Completed on 2026-11-03. The five-unit, 24-lesson course, 15-exercise Practice section, local progress view, responsive course screens, visual learning aids, and README are implemented. The local preview remains available at `http://localhost:8001/`; no deployment or hosting configuration was changed.

Validation completed: JavaScript syntax checks and structural content checks passed. The desktop course/lesson/progress/practice views and learner completion path were reviewed manually; the mobile dashboard was reviewed at 390 × 844.

## Task 1 visual-fidelity follow-up

Compared the practice figures with the official IELTS Academic Writing sample tasks. Refined the chart renderer to use a white figure field, monochrome chart marks, explicit axes, internal titles, boxed series keys, monochrome map keys, and line-art process stages. The original practice datasets remain illustrative.

Verification: all 8 Task 1 figures rendered without errors; the focused Task 1 visual-content and diagram-renderer checks passed. No official IELTS question artwork or data was copied.
