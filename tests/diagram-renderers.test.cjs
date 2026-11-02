const assert = require("node:assert/strict");

global.window = {};
require("../js/charts.js");

assert.equal(typeof window.ChartSVG.process, "function", "ChartSVG.process is available");
assert.equal(typeof window.ChartSVG.map, "function", "ChartSVG.map is available");

const processFigure = {
  aria: "Bottle recycling sequence",
  data: {
    steps: [
      { title: "Collect bottles", detail: "Used glass is gathered." },
      { title: "Wash bottles", detail: "Labels are removed." },
      { title: "Make new bottles", detail: "The glass is remade." },
    ],
  },
};
const processMarkup = window.ChartSVG.process(processFigure);
assert.match(processMarkup, /<ol class="process-diagram" aria-label="Bottle recycling sequence">/);
assert.equal((processMarkup.match(/<li class="process-step"/g) || []).length, 3);
assert.ok(processMarkup.indexOf("Collect bottles") < processMarkup.indexOf("Wash bottles"));
assert.ok(processMarkup.indexOf("Wash bottles") < processMarkup.indexOf("Make new bottles"));
assert.match(window.ChartSVG.process({ aria: "Safe", data: { steps: [{ title: "<script>", detail: "&" }] } }), /&lt;script&gt;/);

const mapFigure = {
  aria: "Lakeside park plans in 2000 and 2025",
  legend: [
    { name: "Water", color: "#4c9ab1" },
    { name: "Green space", color: "#7d9d77" },
  ],
  data: {
    periods: [
      { label: "2000", features: [
        { name: "Lake", kind: "water", x: 30, y: 30, width: 40, height: 35 },
        { name: "Meadow", kind: "green", x: 10, y: 10, width: 20, height: 20 },
      ] },
      { label: "2025", features: [
        { name: "Lake", kind: "water", x: 30, y: 30, width: 40, height: 35 },
        { name: "Meadow", kind: "green", x: 10, y: 10, width: 20, height: 20 },
      ] },
    ],
  },
};
const mapMarkup = window.ChartSVG.map(mapFigure);
assert.match(mapMarkup, /role="group" aria-label="Lakeside park plans in 2000 and 2025"/);
const mapPanels = mapMarkup.match(/<svg class="map-panel" viewBox="0 0 100 100"/g) || [];
assert.equal(mapPanels.length, 2, "the paired maps share a 100-by-100 coordinate frame");
assert.match(mapMarkup, /2000/);
assert.match(mapMarkup, /2025/);
assert.equal((mapMarkup.match(/class="north-arrow"/g) || []).length, 2);
assert.equal((mapMarkup.match(/class="map-feature-label"/g) || []).length, 4);
assert.equal((mapMarkup.match(/>Lake<\/tspan>/g) || []).length, 2);
assert.equal((mapMarkup.match(/>Meadow<\/tspan>/g) || []).length, 2);
const accessibleLists = Array.from(mapMarkup.matchAll(/<ul class="visually-hidden map-feature-descriptions" id="([^"]+)" aria-label="Features in ([^"]+)">([\s\S]*?)<\/ul>/g));
assert.equal(accessibleLists.length, 2, "each atomic map image has a text equivalent for its features");
for (const match of accessibleLists) {
  const [, id, period, description] = match;
  assert.match(mapMarkup, new RegExp(`aria-describedby="${id}"`), `${period} map references its feature description`);
  assert.match(description, /North is at the top/);
  assert.match(description, /Lake — central/);
  assert.match(description, /Meadow — north-west/);
  assert.match(mapMarkup, new RegExp(`aria-label="Features in ${period}"`));
}

process.stdout.write("Process and paired-map renderers preserve order, labels, and accessible names.\n");
