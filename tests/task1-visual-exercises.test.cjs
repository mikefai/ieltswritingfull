const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { exercises } = require("../data/exercises.json");

const wordCount = (text) => ((Array.isArray(text) ? text.join(" ") : text).match(/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu) || []).length;
const byId = (id) => exercises.find((exercise) => exercise.id === id);
const checkCommon = (exercise, id) => {
  assert.ok(exercise, `${id} is present in the exercise bank`);
  assert.equal(exercise.task, "1");
  assert.equal(exercise.type, "1");
  assert.equal(exercise.words, 150);
  assert.equal(exercise.minutes, 20);
  assert.ok(exercise.source.toLowerCase().includes("illustrative"));
  assert.equal(exercise.quiz.options.filter((option) => option.ok).length, 1);
  assert.ok(exercise.analysis.length >= 3 && exercise.analysis.length <= 5);
  assert.ok(exercise.phrases.length >= 1);
  assert.ok(wordCount(exercise.model.join(" ")) >= 150, `${id} model answer meets the 150-word minimum`);
};

const processExercise = byId("t1-glass-process");
checkCommon(processExercise, "t1-glass-process");
assert.equal(processExercise.figure.kind, "process");
assert.equal(processExercise.figure.data.steps.length, 6);
const styles = fs.readFileSync(path.join(__dirname, "../css/styles.css"), "utf8");
for (const [step, column] of [[4, 3], [5, 2], [6, 1]]) {
  const placement = new RegExp(`\\.process-step:nth-child\\(${step}\\)\\s*\\{[^}]*grid-column:\\s*${column};[^}]*grid-row:\\s*2;`);
  assert.match(styles, placement, `process step ${step} occupies row two, column ${column}`);
}
assert.match(styles, /\.process-step:nth-child\(4\),\s*\.process-step:nth-child\(5\),\s*\.process-step:nth-child\(6\)\s*\{[^}]*grid-row:\s*auto;/, "mobile process layout resets explicit desktop rows");

const mapExercise = byId("t1-lakeside-map");
checkCommon(mapExercise, "t1-lakeside-map");
assert.equal(mapExercise.figure.kind, "map");
assert.equal(mapExercise.figure.data.periods.length, 2);
const kinds = new Set(["water", "green", "building", "road", "path", "open"]);
for (const period of mapExercise.figure.data.periods) {
  assert.ok(period.features.length >= 4 && period.features.length <= 6);
  for (const feature of period.features) {
    assert.ok(kinds.has(feature.kind), `${feature.name} has a supported map feature kind`);
    assert.ok(feature.x >= 0 && feature.y >= 0);
    assert.ok(feature.width > 0 && feature.height > 0);
    assert.ok(feature.x + feature.width <= 100, `${feature.name} fits within the map width`);
    assert.ok(feature.y + feature.height <= 100, `${feature.name} fits within the map height`);
  }
  for (let i = 0; i < period.features.length; i++) {
    for (let j = i + 1; j < period.features.length; j++) {
      const first = period.features[i];
      const second = period.features[j];
      const overlaps = first.x < second.x + second.width && second.x < first.x + first.width &&
        first.y < second.y + second.height && second.y < first.y + first.height;
      assert.equal(overlaps, false, `${first.name} does not cover ${second.name} in ${period.label}`);
    }
  }
}

process.stdout.write("Both new Task 1 exercises meet their content and figure constraints.\n");
