// One-off migration: pull the exercise content out of the single-file page.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function slice(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error("missing start: " + startMarker);
  const end = html.indexOf(endMarker, start);
  if (end === -1) throw new Error("missing end: " + endMarker);
  return html.slice(start + startMarker.length, end);
}

const reviewSrc = slice("var REVIEW = ", "\n\n  var LANG =");
const langSrc = slice("var LANG = ", "\n\n  var EXERCISES =");
const exercisesSrc = slice("var EXERCISES = ", "\n\n  EXERCISES.forEach(");

const REVIEW = new Function("return " + reviewSrc)();
const LANG = new Function("return " + langSrc)();
const EXERCISES = new Function("return " + exercisesSrc)();

EXERCISES.forEach((e) => {
  if (!e.type) e.type = e.task;
  if (!e.minutes) e.minutes = e.type === "1" ? 20 : 40;
});

const out = { review: REVIEW, language: LANG, exercises: EXERCISES };
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(path.join(root, "data", "exercises.json"), JSON.stringify(out, null, 2) + "\n");

console.log("exercises:", EXERCISES.length);
console.log("groups:", [...new Set(EXERCISES.map((e) => e.task))].join(","));
console.log("ids:", EXERCISES.map((e) => e.id).join(", "));
