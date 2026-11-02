"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = process.argv[2] ? Number(process.argv[2]) : 8000;
const publicRoots = ["index.html", "css", "data", "js"];
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("Choose an available local port between 1024 and 65535.");
}

http.createServer(function (request, response) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch (error) { response.writeHead(400).end("Bad request"); return; }

  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const first = relative.split(/[\\/]/)[0];
  const allowed = publicRoots.some(function (entry) {
    return entry === first || (entry === "index.html" && relative === entry);
  });
  const file = path.resolve(root, relative);
  if (!allowed || (file !== root && !file.startsWith(root + path.sep)) || relative.split(/[\\/]/).some(function (part) {
    return part.startsWith(".");
  })) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.stat(file, function (statError, stat) {
    if (statError || !stat.isFile()) { response.writeHead(404).end("Not found"); return; }
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    fs.createReadStream(file).pipe(response);
  });
}).listen(port, "127.0.0.1", function () {
  process.stdout.write("IELTS Writing Course is available at http://localhost:" + port + "\n");
});
