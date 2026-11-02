# IELTS Academic Writing Course

A self-paced, English-first course for learners preparing for IELTS Academic Writing. It combines 24 lessons with 15 focused writing exercises and ten original full-length mock papers, alongside worked answers, language resources and criterion-based self-review.

The course supports different starting points through three adjustable routes and Guided, Core and Stretch practice. Routes are recommendations; every lesson remains open. Progress, checkpoint choices and recent exercise history are saved locally in the current browser. Writing drafts continue to use their existing per-exercise local storage. Nothing is sent to a server.

Self-review is for practice. The page does not grade essays or predict an IELTS band, and it is an independent study aid rather than an official IELTS product.

The full mock papers each pair an Academic Task 1 visual question with a Task 2 essay prompt under one shared 60-minute timer. Their timing and minimum word counts follow the IELTS Academic Writing format; the questions and illustrative data are original, deliberately high-challenge course material rather than official IELTS papers. Mock exam drafts and timer progress are saved locally in the current browser.

## Run locally

The page fetches its course and exercise data, so open it through a local web server rather than double-clicking `index.html`:

```sh
node scripts/serve.cjs
# then visit http://localhost:8000
```

Choose another available port with `node scripts/serve.cjs 8001` if needed.

You can also use any static HTTP server. No package installation or framework is required.

## Main files

| Path | Purpose |
| --- | --- |
| `index.html` | Shared Learn, Practice and Progress shell; existing practice workspace remains in Practice. |
| `css/styles.css` | Shared palette plus responsive course and writing layouts. |
| `data/course.json` | Five units, 24 lessons, teaching notes, examples, retrieval checks and level-adjusted activities. |
| `data/exercises.json` | Fifteen Task 1, Task 2 and stretch writing exercises with visuals, model answers and review resources. |
| `data/mock-exams.json` | Ten original paired Academic Writing mock papers with Task 1 visuals and advanced Task 2 prompts. |
| `js/course-progress.js` | Local course settings, lesson completion, checkpoint answers and practice history. |
| `js/course-view.js` | Dashboard, lesson, curriculum and progress rendering. |
| `js/app.js` | View navigation, course actions, exercise selection, timers and draft persistence. |
| `js/mock-exams.js` | Full-paper selection, shared 60-minute timing, task switching, word counts and local mock drafts. |
| `js/charts.js` | Plain-SVG chart, table, map and process renderers. |
| `js/draft-saver.js` | Debounced local draft saving and lifecycle handling. |
| `docs/superpowers/specs/2026-11-03-ielts-academic-writing-course.md` | Product scope and acceptance criteria. |
| `docs/superpowers/plans/2026-11-03-ielts-academic-writing-course.md` | Implementation plan and design review steps. |

## Editing lessons

Course content lives in `data/course.json`. Each lesson has an objective, short teaching sections, a worked example, one single-answer checkpoint with feedback, Guided/Core/Stretch tasks and optional links to exercise IDs in `data/exercises.json`.

Exercise drafts remain keyed under `ielts-writing:v1:`. Course state uses the separate key `ielts-writing-course:v1`; clearing course state does not delete writing drafts.

## Design references

The dashboard, lesson, practice and progress concepts are saved in `docs/superpowers/design/`. They guide layout and hierarchy; the app uses actual lesson and exercise content from the data files.
