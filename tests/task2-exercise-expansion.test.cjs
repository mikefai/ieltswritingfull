const assert = require("node:assert/strict");
const { exercises } = require("../data/exercises.json");

const existingIds = [
  "t1-art", "t1-noise", "t1-sugar", "t2-wealth", "t2-quiet", "t2-sugar",
  "x1-gallery", "x2-complaints", "x3-culture", "x4-price", "x5-silence",
];
const wordCount = (text) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu) || []).length;
const byId = (id) => exercises.find((exercise) => exercise.id === id);
const remotePrompt = "Some employers allow staff to work remotely for part of the week. Do the advantages of this arrangement outweigh the disadvantages?";
const foodPrompt = "Many households throw away edible food. What are the main causes of this problem, and what measures could households and governments take to reduce it?";

for (const id of existingIds) assert.ok(byId(id), `existing exercise ${id} is preserved`);
for (const [id, prompt] of [["t2-remote-work", remotePrompt], ["t2-food-waste", foodPrompt]]) {
  const exercise = byId(id);
  assert.ok(exercise, `${id} is present in the exercise bank`);
  assert.equal(exercise.task, "2");
  assert.equal(exercise.type, "2");
  assert.equal(exercise.words, 250);
  assert.equal(exercise.minutes, 40);
  assert.equal(exercise.question, prompt);
  assert.equal(exercise.quiz.options.filter((option) => option.ok).length, 1);
  assert.ok(exercise.quiz.options.every((option) => option.why));
  assert.ok(exercise.plan.length >= 3);
  assert.ok(exercise.phrases.length >= 1);
  assert.ok(wordCount(exercise.model.join(" ")) >= 250, `${id} model answer meets the 250-word minimum`);
}

const remotePlan = byId("t2-remote-work").plan.map((step) => `${step.h} ${step.d}`).join(" ").toLowerCase();
assert.match(remotePlan, /outweigh|compar/);
const foodPlan = byId("t2-food-waste").plan.map((step) => `${step.h} ${step.d}`).join(" ").toLowerCase();
assert.match(foodPlan, /caus/);
assert.match(foodPlan, /household/);
assert.match(foodPlan, /government/);
assert.equal(exercises.filter((exercise) => exercise.task === "2").length, 5);
assert.equal(exercises.filter((exercise) => exercise.task === "3").length, 5);
assert.equal(exercises.length, 15);

process.stdout.write("The two Task 2 additions cover their prompts and meet the question-bank constraints.\n");
