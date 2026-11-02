# Task 1 Content Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct and guard the Cardiff comparison in the night-time-noise exercise so every teaching statement matches the chart.

**Architecture:** Keep `data/exercises.json` as the source of truth for the chart and its instructional copy. Add one dependency-free Node regression check for the threshold relationship and its repeated wording.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON, CommonJS, Node built-in `assert`.

**Spec:** `docs/superpowers/specs/2026-10-31-practice-content-accuracy.md`

## Global Constraints

- Keep the chart’s reference value at `40` dB and Cardiff’s 2025 value at `41` dB.
- Keep the existing illustrative-data disclosure and exercise IDs unchanged.
- Keep exactly one quiz option marked correct for `t1-noise`.
- Do not add external runtime dependencies.

## File Structure

- `data/exercises.json` remains the source for the chart, quiz, analysis, and model answer; this task corrects the inconsistent Cardiff statements.
- `tests/content-accuracy.test.cjs` contains a dependency-free regression check for the reference value and instructional copy.

## Review Focus

- Cardiff is 1 dB above, not below, the 40 dB line: assert both chart values and the corrected teaching copy in Task 1.
- Check every repeated claim in the quiz option, quiz explanation, analysis, and model answer: include all four fields in the same regression assertion.
- Preserve one correct quiz answer: assert the count remains exactly one in Task 1.
- Keep the chart and threshold intact: assert the existing values in Task 1.
- Keep the practice data disclosure visible: inspect the existing footer during Task 1’s browser verification.

---

### Task 1: Correct and guard the Cardiff threshold interpretation

**Files:**
- Create: `tests/content-accuracy.test.cjs`
- Modify: `data/exercises.json` (`t1-noise` quiz, analysis, and model answer)

**Interfaces:**
- Consumes: `data/exercises.json` exercise object with `id`, `figure.data.ref`, `figure.data.series`, `quiz`, `analysis`, and `model` fields.
- Produces: corrected `t1-noise` instructional copy; a regression check runnable with `node tests/content-accuracy.test.cjs`.

- [x] **Step 1: Write the failing regression check**

```js
const assert = require("node:assert/strict");
const { exercises } = require("../data/exercises.json");

const noise = exercises.find((exercise) => exercise.id === "t1-noise");
const cardiff = noise.figure.data.series.find((series) => series.name === "Cardiff");
const copy = [
  ...noise.quiz.options.map((option) => `${option.text} ${option.why}`),
  ...noise.analysis,
  ...noise.model,
].join("\n");

assert.equal(noise.figure.data.ref.value, 40);
assert.equal(cardiff.values[cardiff.values.length - 1], 41);
assert.equal(noise.quiz.options.filter((option) => option.ok).length, 1);
assert.match(copy, /Cardiff[^.!?]*41[^.!?]*above/i);
assert.doesNotMatch(copy, /Cardiff[^.!?]*below/i);
assert.doesNotMatch(copy, /all four cities except Cardiff/i);
```

- [x] **Step 2: Run the check and confirm it fails on the current copy**

Run: `node tests/content-accuracy.test.cjs`
Expected: FAIL because the current quiz, analysis, and model describe Cardiff as below the 40 dB line.

- [x] **Step 3: Correct all five inaccurate statements in `data/exercises.json`**

Update the correct quiz option, its explanation, the relevant analysis bullet, and both model-answer statements. State that all four cities remain above 40 dB. Use the model sentence `Cardiff finished at 41 decibels, just above the 40-decibel reference line.` Leave all chart values unchanged.

- [x] **Step 4: Run the regression check**

Run: `node tests/content-accuracy.test.cjs`
Expected: PASS.

- [x] **Step 5: Verify the exercise in the browser**

Run: `python -m http.server 8000`, then open `http://localhost:8000`, select Task 1 → Night-time noise, and review the chart, quiz feedback, analysis disclosure, and model answer.
Expected: every reference places Cardiff at 41 dB, above the 40 dB line; the quiz still has one correct answer.

---

**Workspace note:** No `.git` directory was present during planning, so this plan has no commit step.
