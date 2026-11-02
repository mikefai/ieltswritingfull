# Draft Autosave Reliability Spec

## Goal

Make draft saving reliable when learners switch exercises, reload the page, or clear a draft while the 500 ms debounce is pending.

## Evidence

`js/app.js` keeps one global `saveTimer`. Typing in a second exercise clears the first exercise’s timer, so its latest text may never reach `localStorage`. The callback also updates whichever exercise is currently visible. Clearing a draft does not cancel its pending callback, so deleted text can be written back after `storeClear`.

## Requirements

- Preserve the existing storage key prefix `ielts-writing:v1:` and saved value shape (`text`, `checks`, `pick`).
- Track the pending save’s exercise ID and draft so a save cannot be attributed to a different exercise.
- Flush pending text before exercise navigation, task-group changes, and page exit/reload.
- Cancel a pending save for the current exercise before clearing its local storage entry.
- Update the saved message and exercise dot only when the saved exercise is still the visible one.
- Preserve the current graceful behavior when `localStorage` is unavailable.

## Out of scope

- Persisting timer state or changing the countdown behavior.
- Adding cloud sync, accounts, or a new storage dependency.
