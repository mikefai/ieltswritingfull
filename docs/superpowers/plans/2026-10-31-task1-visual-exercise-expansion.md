# Task 1 Visual Exercise Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add process-diagram and map exercises to Task 1 with clear, accessible visuals and original model answers.

**Architecture:** Extend the existing `ChartSVG` builders for two new data-driven visual kinds and route them through the current exercise renderer. Keep exercise content in `data/exercises.json` and use the existing responsive figure shell.

**Tech Stack:** Vanilla JavaScript, SVG/HTML, CSS, JSON, Node built-in `assert`.

**Spec:** `docs/superpowers/specs/2026-10-31-task1-visual-exercise-expansion.md`

## Global Constraints

- Both exercises use `task: "1"`, `type: "1"`, `minutes: 20`, and `words: 150`.
- Keep all practice diagrams original and illustrative.
- Preserve current bar, line, pie, and table output.
- Add no runtime dependencies.

## File Structure

- `js/charts.js` adds process and paired-map builders to `window.ChartSVG`.
- `js/app.js` dispatches `kind: "process"` and `kind: "map"` to those builders.
- `css/styles.css` styles responsive process steps and paired maps.
- `data/exercises.json` stores the two new Task 1 exercises and their instructional content.
- `tests/diagram-renderers.test.cjs` checks the new builder output using Node’s built-in assertions.
- `tests/task1-visual-exercises.test.cjs` checks each new exercise’s fields, quiz, word minimum, and map bounds.
- `README.md` documents the two supported diagram kinds and their data shapes.

## Review Focus

- Process stages remain in source order: assert order in Task 1’s renderer check.
- Long process labels stay readable on mobile: verify the six-stage exercise at a narrow viewport in Task 1.
- Map periods use the same north-up scale: assert both period panels share the same coordinate frame in Task 2.
- Map feature rectangles stay within the 100-by-100 frame and labels remain visible: assert coordinate bounds in Task 2.
- Screen readers receive meaningful figure names and text labels: assert accessible names in both builder checks.

---

### Task 1: Add the process renderer and glass-recycling exercise

**Files:**
- Modify: `js/charts.js` (add `process(f) -> string`)
- Modify: `js/app.js` (`chartMarkup(figure)` dispatch)
- Modify: `css/styles.css` (process sequence presentation)
- Modify: `data/exercises.json` (add `t1-glass-process`)
- Create: `tests/diagram-renderers.test.cjs`
- Create: `tests/task1-visual-exercises.test.cjs`

**Interfaces:**
- Consumes: `{ kind: "process", title: string, aria: string, data: { steps: Array<{ title: string, detail: string }> } }` and the existing exercise fields `id`, `task`, `type`, `nav`, `title`, `source`, `kind`, `words`, `minutes`, `instruction`, `quiz`, `analysis`, `phrases`, and `model`.
- Produces: `window.ChartSVG.process(figure) -> string`, returning an ordered list with class `process-diagram`, an accessible label, six visible steps, and connectors.

- [x] **Step 1: Write the failing process-renderer assertions**

In `tests/diagram-renderers.test.cjs`, initialize `global.window = {}` before requiring `../js/charts.js`. Call `window.ChartSVG.process()` with three sample steps and assert: the result contains `<ol class="process-diagram" aria-label=...>`, contains three `<li class="process-step">` items, and preserves first-to-last title order. In `tests/task1-visual-exercises.test.cjs`, assert the `t1-glass-process` record exists, uses 20 minutes and 150 words, has exactly one correct quiz option, and has at least 150 model words using the app’s word-count expression.

- [x] **Step 2: Run the focused check and confirm it fails**

Run: `node tests/diagram-renderers.test.cjs`
Expected: FAIL because `ChartSVG.process` is not defined.

- [x] **Step 3: Implement `process(f)` and route the new figure kind**

In `js/charts.js`, render `figure.data.steps` as a semantic ordered list with an accessible label and escaped title/detail text. Add a `process` dispatch branch in `chartMarkup(figure)` in `js/app.js`. Style the list as connected step cards that reflow vertically without clipping.

- [x] **Step 4: Add `t1-glass-process` to the question bank**

Add six ordered stages: collect used bottles; sort by color; wash and remove labels; crush into glass fragments; melt and form new bottles; inspect and distribute. Include a process-specific quiz with one correct overview, 3–5 analysis points, tailored phrases, and a model answer of at least 150 words. Use the standard Task 1 instruction and identify the diagram as illustrative practice material.

- [x] **Step 5: Run the focused check and inspect the exercise**

Run: `node tests/diagram-renderers.test.cjs` and `node tests/task1-visual-exercises.test.cjs`
Expected: PASS for process output.

Run: `python -m http.server 8000`, open `http://localhost:8000`, select **Task 1 → Glass recycling**, and inspect desktop and narrow layouts.
Expected: six stages read in order, the overview quiz has one correct option, and the sequence is legible at both widths.

### Task 2: Add the paired-map renderer and lakeside-park exercise

**Files:**
- Modify: `js/charts.js` (add `map(f) -> string`)
- Modify: `js/app.js` (`chartMarkup(figure)` dispatch)
- Modify: `css/styles.css` (map panel layout and legend)
- Modify: `data/exercises.json` (add `t1-lakeside-map`)
- Modify: `tests/diagram-renderers.test.cjs` (paired-map checks)
- Modify: `README.md` (document `process` and `map` figure data shapes)

**Interfaces:**
- Consumes: `{ kind: "map", title: string, aria: string, legend: Array<{ name: string, color: string }>, data: { periods: Array<{ label: string, features: Array<{ name: string, kind: "water" | "green" | "building" | "road" | "path" | "open", x: number, y: number, width: number, height: number }> }> } }`.
- Produces: `window.ChartSVG.map(figure) -> string`, rendering exactly two period panels, each with `viewBox="0 0 100 100"`, readable feature names, and the existing legend.

- [x] **Step 1: Add failing map-renderer assertions**

Extend `tests/diagram-renderers.test.cjs` with a two-period fixture. Assert the output contains two `.map-panel` SVGs, each with `viewBox="0 0 100 100"`; both period labels, north arrows, and every feature name appear; and the accessible label appears. In `tests/task1-visual-exercises.test.cjs`, assert every `t1-lakeside-map` feature uses a supported kind, nonnegative coordinates, positive dimensions, and remains within the frame (`x + width <= 100`, `y + height <= 100`).

- [x] **Step 2: Run the focused check and confirm the map assertions fail**

Run: `node tests/diagram-renderers.test.cjs`
Expected: FAIL because `ChartSVG.map` is not defined.

- [x] **Step 3: Implement `map(f)` and route the map figure kind**

Render the two periods in side-by-side SVG panels using the shared 100-by-100 frame. Use the `kind` value and the existing legend to distinguish water, green space, buildings, roads, paths, and open land. Add a `map` dispatch branch in `chartMarkup(figure)`; keep both panels scrollable and readable on narrow screens.

- [x] **Step 4: Add `t1-lakeside-map` and document the schema**

Create two consistent north-up fictional park plans for 2000 and 2025, with 4–6 labeled features per period and coordinates within 0–100. Make the changes internally consistent with the model answer. Add a prompt, one-correct-answer quiz, 3–5 analysis points, tailored phrases, and a model answer of at least 150 words. Update the README data-shape table for both diagram kinds.

- [x] **Step 5: Run renderer checks and inspect the map exercise**

Run: `node tests/diagram-renderers.test.cjs`
Expected: PASS for both process and map outputs.

Open the app at `http://localhost:8000`, select **Task 1 → Lakeside park**, and inspect both maps, the legend, quiz feedback, analysis, and model answer at desktop and narrow widths. Also inspect **Art collections**, **Night-time noise**, and **Gallery visits and income** to confirm the existing chart kinds still render.
Expected: locations align across periods, each north arrow points up, labels are readable, model claims match the mapped changes, and existing charts still render.

---

**Workspace note:** No `.git` directory was present during planning, so this plan has no commit step.
