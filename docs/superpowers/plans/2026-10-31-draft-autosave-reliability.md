# Draft Autosave Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prevent delayed autosaves from losing, mislabeling, or restoring writing drafts after the learner switches exercises or clears a draft.

**Architecture:** Replace the timer-only global debounce with one pending-save record that carries the exercise ID, draft, and timeout. Flush it at navigation and page-exit boundaries, and cancel it before clearing that exercise’s storage.

**Tech Stack:** Static browser JavaScript, `localStorage`, existing HTML events; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-31-draft-autosave-reliability.md`

## Global Constraints

- Preserve the `ielts-writing:v1:` storage key prefix and the `{ text, checks, pick }` saved value shape.
- Keep the 500 ms debounce for normal typing.
- Keep storage exceptions handled without breaking the writing interface.
- Do not persist or otherwise change timer behavior.

## File Structure

- `js/app.js` owns draft storage, debounce scheduling, navigation, clear behavior, and save-state feedback; all reliability changes stay within this existing module.
- `js/draft-saver.js` isolates the debounce queue behind a small browser/CommonJS API so its timing behavior can be regression-tested without DOM dependencies.
- `tests/draft-saver.test.cjs` uses injected fake timers to check per-exercise flush and cancellation behavior.
- `index.html` loads the helper before `js/app.js`.

## Review Focus

- Switching exercises with a save pending: verify the first exercise is flushed before the new exercise becomes active (Task 1).
- Typing in a second exercise before the first delay expires: verify both drafts survive reload (Task 1).
- Reloading or closing the page during the debounce window: verify pending text is flushed on `pagehide` (Task 1).
- Saving while another exercise is visible: verify the saved message and draft dot update only for the originating exercise (Task 1).
- Clearing within 500 ms of typing: verify the pending callback cannot restore deleted text (Task 2).

---

### Task 1: Track and flush the pending draft by exercise

**Files:**
- Create: `js/draft-saver.js` (testable debounce queue)
- Modify: `index.html` (load the helper before `js/app.js`)
- Modify: `js/app.js` (answer input handler, navigation handlers, page lifecycle)
- Create: `tests/draft-saver.test.cjs`

**Interfaces:**
- Consumes: `write(id, draft)`, `onSaved(id)`, optional `delayMs`, `setTimeout`, and `clearTimeout` callbacks.
- Produces: `DraftSaver.create(options) -> { schedule(id, draft), flush() }`; browser global `window.DraftSaver` and CommonJS `module.exports` share the same API.

- [x] **Step 1: Write the failing scheduler regression check**

In `tests/draft-saver.test.cjs`, first assert that `DraftSaver.create` exists, then create the scheduler with fake timer functions. Schedule distinct drafts for two IDs before the delay expires. Assert the first is flushed immediately when the second is scheduled, the second is written when its timer fires, and `onSaved` receives the matching IDs. If the module does not yet exist, catch only `MODULE_NOT_FOUND` and make the missing factory an assertion failure.

- [x] **Step 2: Run the focused check and confirm it fails**

Run: `node tests/draft-saver.test.cjs`
Expected: FAIL because `DraftSaver.create` is not defined.

- [x] **Step 3: Implement the debounce queue and connect the answer input**

In `js/draft-saver.js`, implement `create(options)` with a pending record `{ id, draft, timer }`. `schedule(id, draft)` flushes a different pending ID before starting the 500 ms delay and resets the delay for repeated input on the same ID. `flush()` writes once and calls `onSaved(id)`; expose the API to both the browser and CommonJS. Load the helper before `app.js` in `index.html`. In `app.js`, route answer input through `draftSaver.schedule(exercise.id, draft)` and update the save message/dot only when `current().id === id` in `onSaved`.

- [x] **Step 4: Flush before navigation and page exit**

Call `draftSaver.flush()` before changing `state.pos` or `state.group`, and register it for the `pagehide` event.

- [x] **Step 5: Run the unit check and repeat the rapid-switch browser scenario**

Run: `node tests/draft-saver.test.cjs`
Expected: PASS.

Type distinct text into two exercises, switch before the first delay expires, then reload and revisit both.
Expected: both drafts are restored under their own exercise IDs, and only the matching exercise shows its saved dot/message.

### Task 2: Cancel a pending save when clearing a draft

**Files:**
- Modify: `js/draft-saver.js` (add cancellation)
- Modify: `js/app.js` (clear-draft handler)
- Modify: `tests/draft-saver.test.cjs` (cancellation checks)

**Interfaces:**
- Consumes: Task 1’s `DraftSaver.create(options)` queue.
- Produces: `saver.cancel(id) -> boolean`, which Task 2 adds to clear the timeout and drop the pending record only when its ID matches.

- [x] **Step 1: Reproduce the clear-draft race**

Add a test that schedules an `id`, captures its pending callback, cancels that ID, and invokes the captured callback. Assert no write or saved notification occurs. Also assert cancelling a different ID returns `false` without changing the pending save.

- [x] **Step 2: Cancel the matching pending save before clearing storage**

Implement `cancel(id)` in `js/draft-saver.js` and call `draftSaver.cancel(exercise.id)` before `storeClear(exercise.id)` in the clear-draft handler. Do not cancel a pending save that belongs to another exercise.

- [x] **Step 3: Repeat the clear-and-reload scenario**

Run: `node tests/draft-saver.test.cjs`
Expected: PASS.

Type text and click **Clear draft** before the 500 ms delay finishes; confirm the dialog, then reload.
Expected: the answer remains empty, its checklist and quiz pick are cleared as before, and no stale save message appears.

---

**Workspace note:** No `.git` directory was present during planning, so this plan has no commit step.
