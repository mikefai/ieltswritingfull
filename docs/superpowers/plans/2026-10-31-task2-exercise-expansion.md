# Task 2 Exercise Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add two original Task 2 exercises covering an advantages-outweigh prompt and a causes-and-solutions prompt.

**Architecture:** Extend the existing exercise array in `data/exercises.json`; reuse the current Task 2 renderer, quiz, planning disclosure, language bank, marking guide, and local draft storage.

**Tech Stack:** Static browser JavaScript, JSON, Node built-in `assert`; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-31-task2-exercise-expansion.md`

## Global Constraints

- Both exercises use `task: "2"`, `type: "2"`, `minutes: 40`, and `words: 250`.
- Preserve the existing schema and all 11 current exercise records; this plan adds two Task 2 records.
- Each quiz has exactly one correct option and gives an explanation for every option.
- Use original, illustrative examples and no unsupported statistics.
- Keep the harder set unchanged.

## File Structure

- `data/exercises.json` stores the two new prompts, plans, quizzes, phrases, and model answers.
- `tests/task2-exercise-expansion.test.cjs` checks the new records’ IDs, settings, quiz structure, and model length.

## Review Focus

- The outweigh prompt has a clear comparative judgement, not two disconnected lists: include that requirement in the `t2-remote-work` plan and quiz check.
- The causes-and-solutions prompt covers both causes and measures: assert the prompt and plan include both parts.
- Both models meet 250 words using the app’s word-count rule: use the same Unicode word-count expression in Task 1’s regression check.
- Neither model relies on an unsupported statistic: review the new model text in Task 2’s browser check.
- Existing exercises and harder-set navigation remain intact: assert existing IDs remain and inspect all three groups in Task 2’s browser check.

---

### Task 1: Add two prompt-specific Task 2 exercises

**Files:**
- Create: `tests/task2-exercise-expansion.test.cjs`
- Modify: `data/exercises.json` (`exercises` array)

**Interfaces:**
- Consumes: existing Task 2 exercise shape: `id`, `task`, `type`, `nav`, `title`, `source`, `kind`, `words`, `minutes`, `instruction`, `question`, `quiz`, `plan`, `phrases`, and `model`.
- Produces: `t2-remote-work` and `t2-food-waste`, both compatible with the current renderer and storage code.

- [x] **Step 1: Write the failing data regression check**

In `tests/task2-exercise-expansion.test.cjs`, load `data/exercises.json`, find both IDs, and assert each has `task === "2"`, `type === "2"`, `words === 250`, `minutes === 40`, exactly one `quiz.options[].ok === true`, a non-empty `plan`, at least one phrase, and at least 250 words across `model` using `/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu`. Assert each exact prompt from the spec is present, all 11 existing IDs (`t1-art`, `t1-noise`, `t1-sugar`, `t2-wealth`, `t2-quiet`, `t2-sugar`, `x1-gallery`, `x2-complaints`, `x3-culture`, `x4-price`, `x5-silence`) remain, and the regular Task 2 group contains five exercises.

- [x] **Step 2: Run the check and confirm it fails because the exercises are missing**

Run: `node tests/task2-exercise-expansion.test.cjs`
Expected: FAIL because `t2-remote-work` and `t2-food-waste` are not in the exercise bank.

- [x] **Step 3: Add `t2-remote-work`**

Use the exact prompt from the spec. Add a plan that compares flexibility/commuting benefits with collaboration, boundary, and access costs, then requires a clear answer to whether the benefits outweigh the drawbacks. Add a quiz whose correct option requires that comparative judgement, tailored phrases, and an original model answer of at least 250 words.

- [x] **Step 4: Add `t2-food-waste`**

Use the exact prompt from the spec. Add a plan that names causes and separates household actions from public measures. Add a quiz whose correct option covers both causes and solutions, tailored phrases, and an original model answer of at least 250 words.

- [x] **Step 5: Run the check and inspect both exercises in the browser**

Run: `node tests/task2-exercise-expansion.test.cjs`
Expected: PASS.

Open `http://localhost:8000`, select **Task 2 → Remote work** and **Task 2 → Food waste**, and inspect each prompt, plan, quiz feedback, model answer, and draft save.
Expected: each exercise covers every prompt part, presents one correct quiz answer, and shows a model answer at or above the 250-word minimum.

---

**Workspace note:** No `.git` directory was present during planning, so this plan has no commit step.
