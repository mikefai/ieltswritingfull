/* IELTS-style Task 1 figures — original practice data, rendered as restrained print-like visuals. */
(function () {
  "use strict";

  var SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';
  var nextChartId = 0;
  var nextMapId = 0;

  function htmlEscape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function round(number) {
    return Number(number).toFixed(1);
  }

  function chartDefs(id) {
    return '<defs>' +
      '<pattern id="' + id + '-gray" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="#bcbcbc"/><path d="M0 8L8 0" stroke="#343434" stroke-width="1"/></pattern>' +
      '<pattern id="' + id + '-cross" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="#f4f4f4"/><path d="M0 8L8 0M-2 2L2-2M6 10L10 6M0 0L8 8" stroke="#4d4d4d" stroke-width="0.8"/></pattern>' +
      '<pattern id="' + id + '-dots" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" fill="#e8e8e8"/><circle cx="2" cy="2" r="1" fill="#353535"/></pattern>' +
      '</defs>';
  }

  function frame(inner, label, height, id, extraClass) {
    return '<svg class="chart' + (extraClass ? " " + extraClass : "") + '" viewBox="0 0 700 ' + height +
      '" ' + SVG_NS + ' role="img" aria-label="' + htmlEscape(label) + '"><title>' +
      htmlEscape(label) + '</title>' + chartDefs(id) + inner + "</svg>";
  }

  function titleMarkup(title) {
    return title ? '<text class="chart-title" x="350" y="25" text-anchor="middle">' +
      htmlEscape(title) + "</text>" : "";
  }

  function seriesItems(figure) {
    var series = figure.data && figure.data.series || [];
    return series.map(function (item, index) {
      var fromLegend = figure.legend && figure.legend[index];
      return {
        name: item.name || (fromLegend && fromLegend.name) || ("Series " + (index + 1)),
        index: index
      };
    });
  }

  function legendRows(items) {
    return Math.ceil(items.length / 2);
  }

  function chartFill(index, id) {
    if (index === 0) return "#242424";
    if (index === 1) return "#a3a3a3";
    if (index === 2) return "url(#" + id + "-gray)";
    return "url(#" + id + "-cross)";
  }

  function lineDash(index) {
    return ["", "9 5", "2 4", "12 4 2 4"][index % 4];
  }

  function svgLegend(items, kind, id, x, y, width) {
    if (!items.length) return "";
    var columns = Math.min(2, items.length);
    var rows = legendRows(items);
    var rowHeight = 18;
    var boxWidth = columns === 1 ? 142 : (kind === "line" ? 360 : 284);
    var boxHeight = rows * rowHeight + 8;
    var startX = x + Math.max(0, (width - boxWidth) / 2);
    var out = '<rect class="chart-legend-box" x="' + round(startX) + '" y="' + round(y) +
      '" width="' + boxWidth + '" height="' + boxHeight + '"/>';

    items.forEach(function (item, index) {
      var column = index % columns;
      var row = Math.floor(index / columns);
      var itemX = startX + 11 + column * (boxWidth / columns);
      var itemY = y + 8 + row * rowHeight + 5;
      if (kind === "line") {
        out += '<line x1="' + itemX + '" x2="' + (itemX + 27) + '" y1="' + itemY + '" y2="' + itemY +
          '" stroke="' + (item.reference ? "#555" : "#222") + '" stroke-width="2" stroke-dasharray="' +
          (item.reference ? "6 4" : lineDash(item.index)) + '"/>';
      } else {
        out += '<rect x="' + itemX + '" y="' + (itemY - 5) + '" width="15" height="10" fill="' +
          chartFill(item.index, id) + '" stroke="#222" stroke-width="1"/>';
      }
      out += '<text class="chart-legend-label" x="' + (itemX + (kind === "line" ? 33 : 21)) +
        '" y="' + (itemY + 4) + '">' + htmlEscape(item.name) + "</text>";
    });
    return out;
  }

  function drawAxes(data, geom, maxKey, stepKey, suffix) {
    var max = Number(data[maxKey]);
    var step = Number(data[stepKey]);
    if (!Number.isFinite(max) || max <= 0) max = 1;
    if (!Number.isFinite(step) || step <= 0) step = max / 5;

    var out = '<line class="axis" x1="' + geom.x0 + '" x2="' + geom.x0 +
      '" y1="' + round(geom.yTop) + '" y2="' + round(geom.yBase) + '"/>' +
      '<line class="axis" x1="' + geom.x0 + '" x2="' + geom.x1 + '" y1="' +
      round(geom.yBase) + '" y2="' + round(geom.yBase) + '"/>';

    for (var value = 0, count = 0; value <= max + step * 0.001 && count < 100; value += step, count += 1) {
      var yy = geom.y(value);
      out += '<line class="axis-tick" x1="' + (geom.x0 - 5) + '" x2="' + geom.x0 +
        '" y1="' + round(yy) + '" y2="' + round(yy) + '"/>' +
        '<text class="tick" x="' + (geom.x0 - 10) + '" y="' + round(yy + 4) +
        '" text-anchor="end">' + htmlEscape(value + (suffix || "")) + "</text>";
    }
    return out;
  }

  function axisLabel(value, x, y, vertical) {
    if (!value) return "";
    if (vertical) {
      return '<text class="axis-label" transform="translate(' + x + " " + y +
        ') rotate(-90)" text-anchor="middle">' + htmlEscape(value) + "</text>";
    }
    return '<text class="axis-label" x="' + x + '" y="' + y +
      '" text-anchor="middle">' + htmlEscape(value) + "</text>";
  }

  function barChart(figure) {
    var data = figure.data;
    var id = "chart-" + (nextChartId++);
    var items = seriesItems(figure);
    var rows = legendRows(items);
    var height = 390 + Math.max(0, rows - 1) * 18;
    var left = 94, right = 22, top = 52, base = height - 89;
    var plotWidth = 700 - left - right;
    var plotHeight = base - top;
    var y = function (value) { return base - (value / data.max) * plotHeight; };
    var geom = { x0: left, x1: left + plotWidth, yTop: top, yBase: base, y: y };
    var out = titleMarkup(figure.title) + drawAxes(data, geom, "max", "step", data.ySuffix || "");
    var groupWidth = plotWidth / data.groups.length;
    var innerWidth = Math.min(groupWidth * 0.65, 104);
    var gap = items.length > 1 ? 5 : 0;
    var barWidth = Math.max(1, (innerWidth - gap * (items.length - 1)) / items.length);

    data.groups.forEach(function (group, groupIndex) {
      var center = left + groupIndex * groupWidth + groupWidth / 2;
      var groupLeft = center - innerWidth / 2;
      group.values.forEach(function (value, seriesIndex) {
        var barX = groupLeft + seriesIndex * (barWidth + gap);
        var barY = y(value);
        out += '<rect class="bar" x="' + round(barX) + '" y="' + round(barY) + '" width="' +
          round(barWidth) + '" height="' + round(Math.max(0, base - barY)) + '" fill="' +
          chartFill(seriesIndex, id) + '" stroke="#222" stroke-width="1"/>';
      });
      out += '<text class="tick category-label" x="' + round(center) + '" y="' + round(base + 20) +
        '" text-anchor="middle">' + htmlEscape(group.label) + "</text>";
    });

    out += axisLabel(data.yLabel, 25, (top + base) / 2, true);
    out += axisLabel(data.xLabel, 350, base + 43, false);
    out += svgLegend(items, "bar", id, left, height - (rows * 18 + 12), plotWidth);
    return frame(out, figure.aria, height, id);
  }

  function lineChart(figure) {
    var data = figure.data;
    var id = "chart-" + (nextChartId++);
    var items = seriesItems(figure);
    if (data.ref) {
      items.push({
        name: (data.ref.label || ["Reference"]).join(" ") + " (" + data.ref.value + (data.ySuffix || "") + ")",
        index: items.length,
        reference: true
      });
    }
    var rows = legendRows(items);
    var height = 410 + Math.max(0, rows - 1) * 18;
    var left = 82, right = 24, top = 63 + rows * 18, base = height - 89;
    var plotWidth = 700 - left - right;
    var plotHeight = base - top;
    var y = function (value) { return base - (value / data.yMax) * plotHeight; };
    var x = function (index) { return left + (plotWidth * index) / Math.max(1, data.xLabels.length - 1); };
    var geom = { x0: left, x1: left + plotWidth, yTop: top, yBase: base, y: y };
    var out = titleMarkup(figure.title) + drawAxes(data, geom, "yMax", "step", data.ySuffix || "");

    data.xLabels.forEach(function (label, index) {
      var xx = x(index);
      out += '<line class="axis-tick" x1="' + round(xx) + '" x2="' + round(xx) +
        '" y1="' + round(base) + '" y2="' + round(base + 5) + '"/>' +
        '<text class="tick" x="' + round(xx) + '" y="' + round(base + 20) +
        '" text-anchor="middle">' + htmlEscape(label) + "</text>";
    });

    if (data.ref) {
      var referenceY = y(data.ref.value);
      out += '<line class="reference-line" x1="' + left + '" x2="' + (left + plotWidth) +
        '" y1="' + round(referenceY) + '" y2="' + round(referenceY) + '"/>';
    }

    data.series.forEach(function (series, index) {
      var points = series.values.map(function (value, pointIndex) {
        return round(x(pointIndex)) + "," + round(y(value));
      }).join(" ");
      out += '<polyline class="line-series" points="' + points +
        '" fill="none" stroke="#222" stroke-width="2.1" stroke-dasharray="' +
        lineDash(index) + '"/>';
    });

    out += axisLabel(data.yLabel, 22, (top + base) / 2, true);
    out += axisLabel(data.xLabel, 350, base + 43, false);
    out += svgLegend(items, "line", id, left, 39, plotWidth);
    return frame(out, figure.aria, height, id);
  }

  function pieChart(figure) {
    var id = "chart-" + (nextChartId++);
    var slices = figure.data || [];
    var total = slices.reduce(function (sum, slice) { return sum + Number(slice.value || 0); }, 0) || 1;
    var height = 340, centerX = 350, centerY = 182, radius = 92;
    var angle = -Math.PI / 2;
    var out = titleMarkup(figure.title);

    slices.forEach(function (slice, index) {
      var sweep = (Number(slice.value) / total) * Math.PI * 2;
      var x1 = centerX + radius * Math.cos(angle);
      var y1 = centerY + radius * Math.sin(angle);
      var x2 = centerX + radius * Math.cos(angle + sweep);
      var y2 = centerY + radius * Math.sin(angle + sweep);
      var large = sweep > Math.PI ? 1 : 0;
      var middle = angle + sweep / 2;
      var rightSide = Math.cos(middle) >= 0;
      var labelX = centerX + (rightSide ? radius + 26 : -(radius + 26));
      var labelY = centerY + (radius + 14) * Math.sin(middle);

      out += '<path class="pie-slice" d="M' + centerX + " " + centerY + " L" + round(x1) + " " +
        round(y1) + " A" + radius + " " + radius + " 0 " + large + " 1 " + round(x2) + " " +
        round(y2) + ' Z" fill="' + chartFill(index, id) + '" stroke="#222" stroke-width="1.3"/>';
      out += '<polyline class="leader" points="' + round(centerX + radius * 1.02 * Math.cos(middle)) +
        "," + round(centerY + radius * 1.02 * Math.sin(middle)) + " " +
        round(centerX + (radius + 10) * Math.cos(middle)) + "," +
        round(centerY + (radius + 10) * Math.sin(middle)) + " " +
        round(centerX + (rightSide ? radius + 22 : -(radius + 22))) + "," +
        round(labelY) + '"/>';
      out += '<text class="pie-label" x="' + round(labelX) + '" y="' + round(labelY - 2) +
        '" text-anchor="' + (rightSide ? "start" : "end") + '">' + htmlEscape(slice.name) +
        ' <tspan class="pie-value">' + htmlEscape(slice.value + "%") + "</tspan></text>";
      angle += sweep;
    });

    return frame(out, figure.aria, height, id, "chart-pie");
  }

  function tableHTML(figure) {
    var data = figure.data;
    var caption = figure.title || data.caption || "";
    var head = '<tr><th scope="col">' + htmlEscape(data.head) + "</th>" +
      data.years.map(function (year) { return '<th scope="col">' + htmlEscape(year) + "</th>"; }).join("") +
      "</tr>";
    var body = data.rows.map(function (row) {
      return "<tr><th scope=\"row\">" + htmlEscape(row[0]) + "</th>" +
        row.slice(1).map(function (cell) { return "<td>" + htmlEscape(cell) + "</td>"; }).join("") +
        "</tr>";
    }).join("");

    return '<div class="table-wrap"><table class="data-table" aria-label="' + htmlEscape(figure.aria || caption) +
      '"><caption>' + htmlEscape(caption) + "</caption><thead>" + head +
      "</thead><tbody>" + body + "</tbody></table></div>";
  }

  function processIcon(step) {
    var text = String((step.icon || "") + " " + (step.title || "")).toLowerCase();
    var art;
    if (/collect/.test(text)) {
      art = '<path d="M24 31h34l-4 18H28zM28 28h26M31 50h21"/>' +
        '<path d="M34 28v-7h7v7m4 0v-9h7v9M36 21l1-5h4l1 5m3-2 1-5h4l1 5"/>';
    } else if (/sort/.test(text)) {
      art = '<path d="M24 20h13v27H24zM27 15h7v5m10 3h12v24H44zM47 18h6v5"/>' +
        '<path d="M28 30h5m14 3h5M29 47h26"/>';
    } else if (/wash|label/.test(text)) {
      art = '<path d="M20 38h46v13H20zM24 35c8 2 14 2 20 0s12-2 18 0"/>' +
        '<path d="M39 19h11l3 7v12H35V26zM41 15h7v4m-4 0v7m-8-2h17"/>' +
        '<path d="M25 28c0-3 3-5 3-8 3 4 4 6 4 8a4 4 0 1 1-7 0z"/>';
    } else if (/crush|fragment/.test(text)) {
      art = '<path d="M18 48 28 31l8 10 8-19 8 16 9-10 8 20z"/>' +
        '<path d="m28 31 5 5m11-14 1 15m16-9-7 7m-18 5 8-4m8 1 4 10"/>';
    } else if (/melt|form/.test(text)) {
      art = '<path d="M19 22h45v29H19zM25 28h33v23H25zM35 51V38h13v13"/>' +
        '<path d="M38 35v-5h7v5m-7-5v-4h7m-25 30h45M27 55v4m29-4v4"/>' +
        '<path d="M33 46c-3-4 3-5 0-9m15 9c-3-4 3-5 0-9"/>';
    } else if (/inspect|distribut/.test(text)) {
      art = '<path d="M18 48h54M23 53h44M28 49l-3 4m39-4 3 4"/>' +
        '<path d="M34 34h16v14H34zM37 29h10v5m-10 0 2-5h6l2 5"/>' +
        '<circle cx="58" cy="25" r="7"/><path d="m63 30 6 6m-14-11 2 2 4-5"/>';
    } else {
      art = '<rect x="24" y="19" width="40" height="34"/><path d="M30 27h28m-28 8h28m-28 8h17"/>';
    }
    return '<svg class="process-icon" viewBox="0 0 84 66" aria-hidden="true" focusable="false">' +
      '<g class="process-illustration">' + art + "</g></svg>";
  }

  function processDiagram(figure) {
    var steps = figure.data.steps || [];
    var layoutClass = steps.length > 6 ? " process-diagram--long" : "";
    var items = steps.map(function (step) {
      return '<li class="process-step">' + processIcon(step) + '<div class="process-copy"><strong>' +
        htmlEscape(step.title) + "</strong><p>" + htmlEscape(step.detail) + "</p></div></li>";
    }).join("");
    return '<div class="process-visual">' +
      (figure.title ? '<h4 class="diagram-title">' + htmlEscape(figure.title) + "</h4>" : "") +
      '<ol class="process-diagram' + layoutClass + '" aria-label="' + htmlEscape(figure.aria) + '">' + items + "</ol></div>";
  }

  function mapLocation(feature) {
    var x = feature.x + feature.width / 2;
    var y = feature.y + feature.height / 2;
    var horizontal = x < 33 ? "west" : x > 66 ? "east" : "";
    var vertical = y < 33 ? "north" : y > 66 ? "south" : "";
    return vertical && horizontal ? vertical + "-" + horizontal : vertical || horizontal || "central";
  }

  function mapDefs(id) {
    return '<defs>' +
      '<pattern id="' + id + '-water" patternUnits="userSpaceOnUse" width="8" height="6"><rect width="8" height="6" fill="#f4f4f4"/><path d="M0 2q2-2 4 0t4 0M0 5q2-2 4 0t4 0" fill="none" stroke="#555" stroke-width="0.55"/></pattern>' +
      '<pattern id="' + id + '-green" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" fill="#f5f5f5"/><circle cx="2" cy="2" r="0.65" fill="#555"/><circle cx="6" cy="6" r="0.65" fill="#555"/></pattern>' +
      '<pattern id="' + id + '-open" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" fill="#fafafa"/><path d="M0 7 7 0" stroke="#777" stroke-width="0.55"/></pattern>' +
      '</defs>';
  }

  function mapFill(kind, id) {
    if (kind === "water") return "url(#" + id + "-water)";
    if (kind === "green") return "url(#" + id + "-green)";
    if (kind === "building") return "#d5d5d5";
    if (kind === "open") return "url(#" + id + "-open)";
    return "#fff";
  }

  function mapKind(name) {
    var value = String(name || "").toLowerCase();
    if (/water|lake|river/.test(value)) return "water";
    if (/green|wood|meadow|park/.test(value)) return "green";
    if (/build|cafe|centre|center/.test(value)) return "building";
    if (/road|street/.test(value)) return "road";
    if (/path|walk/.test(value)) return "path";
    return "open";
  }

  function mapLegend(legend) {
    if (!legend || !legend.length) return "";
    return '<div class="map-key" aria-label="Map key">' + legend.map(function (item) {
      return '<span class="map-key-item"><i class="map-key-swatch map-key-swatch--' +
        mapKind(item.name) + '" aria-hidden="true"></i>' + htmlEscape(item.name) + "</span>";
    }).join("") + "</div>";
  }

  function mapDiagram(figure) {
    var periods = figure.data.periods || [];
    var mapId = "map-" + (nextMapId++);
    var panels = periods.map(function (period, periodIndex) {
      var patternId = mapId + "-" + periodIndex;
      var label = htmlEscape(period.label);
      var accessibleLabel = htmlEscape((figure.title || "Map") + " — " + period.label);
      var descriptionId = "map-features-" + mapId + "-" + periodIndex;
      var features = (period.features || []).map(function (feature) {
        var kind = /^(water|green|building|road|path|open)$/.test(feature.kind) ? feature.kind : "open";
        var centerX = feature.x + feature.width / 2;
        var centerY = feature.y + feature.height / 2 + 1.2;
        var labelFontSize = 4.3;
        var maxChars = Math.max(4, Math.floor((feature.width - 2) / (labelFontSize * 0.56)));
        var lines = [];
        var line = "";
        htmlEscape(feature.name).split(/\s+/).forEach(function (word) {
          if (line && (line + " " + word).length > maxChars) {
            lines.push(line);
            line = word;
          } else {
            line = line ? line + " " + word : word;
          }
        });
        if (line) lines.push(line);
        var text = lines.map(function (part, lineIndex) {
          var y = centerY + (lineIndex - (lines.length - 1) / 2) * 5;
          return '<tspan x="' + centerX + '" y="' + y + '">' + part + "</tspan>";
        }).join("");
        return '<g class="map-feature-group map-feature--' + kind + '" aria-label="' +
          htmlEscape(feature.name) + '"><rect class="map-feature-shape" x="' + feature.x + '" y="' +
          feature.y + '" width="' + feature.width + '" height="' + feature.height + '" fill="' +
          mapFill(kind, patternId) + '"/><text class="map-feature-label" text-anchor="middle">' +
          text + "</text></g>";
      }).join("");
      var featureDescriptions = "<li>North is at the top</li>" + (period.features || []).map(function (feature) {
        return "<li>" + htmlEscape(feature.name) + " — " + mapLocation(feature) + "</li>";
      }).join("");
      return '<section class="map-panel-wrap" aria-label="Map for ' + label + '">' +
        '<h5 class="map-panel-title">' + label + '</h5><svg class="map-panel" viewBox="0 0 100 100" ' +
        SVG_NS + ' role="img" aria-label="' + accessibleLabel + '" aria-describedby="' + descriptionId +
        '"><title>' + accessibleLabel + "</title>" + mapDefs(patternId) +
        '<rect class="map-boundary" x="1" y="1" width="98" height="98"/>' +
        '<g class="north-arrow" aria-label="North"><path d="M92 20 88 28 92 26 96 28z"/>' +
        '<text x="92" y="18" text-anchor="middle">N</text></g>' + features + '</svg>' +
        '<ul class="visually-hidden map-feature-descriptions" id="' + descriptionId +
        '" aria-label="Features in ' + label + '">' + featureDescriptions + "</ul></section>";
    }).join("");
    return '<div class="map-visual">' +
      (figure.title ? '<h4 class="diagram-title">' + htmlEscape(figure.title) + "</h4>" : "") +
      '<div class="map-pair" role="group" aria-label="' + htmlEscape(figure.aria) + '">' + panels + "</div>" +
      mapLegend(figure.legend) + "</div>";
  }

  window.ChartSVG = {
    bar: barChart,
    line: lineChart,
    pie: pieChart,
    table: tableHTML,
    process: processDiagram,
    map: mapDiagram
  };
})();
