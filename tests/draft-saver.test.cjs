const assert = require("node:assert/strict");

let DraftSaver = {};
try {
  DraftSaver = require("../js/draft-saver.js");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}

assert.equal(typeof DraftSaver.create, "function", "DraftSaver.create is available");

const timers = new Map();
const writes = [];
const savedIds = [];
let nextTimerId = 0;

const saver = DraftSaver.create({
  write: (id, draft) => writes.push([id, draft.text]),
  onSaved: (id) => savedIds.push(id),
  delayMs: 500,
  setTimeout: (callback) => {
    const id = ++nextTimerId;
    timers.set(id, callback);
    return id;
  },
  clearTimeout: (id) => timers.delete(id),
});

saver.schedule("first", { text: "first draft" });
saver.schedule("second", { text: "second draft" });
assert.deepEqual(writes, [["first", "first draft"]]);
assert.deepEqual(savedIds, ["first"]);

const secondTimer = Array.from(timers.values())[0];
secondTimer();
assert.deepEqual(writes, [["first", "first draft"], ["second", "second draft"]]);
assert.deepEqual(savedIds, ["first", "second"]);

const callbacks = new Map();
const cancellationWrites = [];
const cancellationNotifications = [];
let nextCallbackId = 0;
const cancellable = DraftSaver.create({
  write: (id, draft) => cancellationWrites.push([id, draft.text]),
  onSaved: (id) => cancellationNotifications.push(id),
  setTimeout: (callback) => {
    const id = ++nextCallbackId;
    callbacks.set(id, callback);
    return id;
  },
  clearTimeout: (id) => callbacks.delete(id),
});

cancellable.schedule("clear-me", { text: "stale text" });
const staleCallback = Array.from(callbacks.values())[0];
assert.equal(cancellable.cancel("other-id"), false);
assert.equal(cancellable.cancel("clear-me"), true);
staleCallback();
assert.deepEqual(cancellationWrites, []);
assert.deepEqual(cancellationNotifications, []);

cancellable.schedule("keep-me", { text: "preserved text" });
assert.equal(cancellable.cancel("other-id"), false);
Array.from(callbacks.values())[0]();
assert.deepEqual(cancellationWrites, [["keep-me", "preserved text"]]);
assert.deepEqual(cancellationNotifications, ["keep-me"]);

let failedSaveResult;
const failedSaver = DraftSaver.create({
  write: () => false,
  onSaved: (id, persisted) => { failedSaveResult = [id, persisted]; },
  setTimeout: (callback) => { failedSaveCallback = callback; return 1; },
  clearTimeout: () => {},
});
let failedSaveCallback;
failedSaver.schedule("storage-blocked", { text: "cannot persist" });
failedSaveCallback();
assert.deepEqual(failedSaveResult, ["storage-blocked", false], "a failed write reaches the status callback");

process.stdout.write("Draft saves flush under their originating exercise IDs and cancellation drops only matching pending writes.\n");
