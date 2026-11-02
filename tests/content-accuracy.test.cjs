const assert = require("node:assert/strict");
const { exercises } = require("../data/exercises.json");

const noise = exercises.find((exercise) => exercise.id === "t1-noise");
assert.ok(noise, "t1-noise exercise exists");

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

process.stdout.write("Task 1 noise content matches its 40 dB reference.\n");
