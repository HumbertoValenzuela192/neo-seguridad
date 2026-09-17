const { createServer } = require("node:http");
const { createReadStream, existsSync } = require("node:fs");
const { join } = require("node:path");
const { networkInterfaces } = require("node:os");

const files = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/admin.html": ["admin.html", "text/html; charset=utf-8"],
  "/tigrr.html": ["tigrr.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/tigrr.css": ["tigrr.css", "text/css; charset=utf-8"],
  "/a2791a37-6fe2-413d-9f5a-526532134dcc.jpg": ["a2791a37-6fe2-413d-9f5a-526532134dcc.jpg", "image/jpeg"],
  "/tigrr.png": ["tigrr.png", "image/png"],
};

function getLanIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const server = createServer((request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const file = files[pathname];
    if (!file || !existsSync(join(__dirname, file[0]))) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" });
    const stream = createReadStream(join(__dirname, file[0]));
    stream.on("error", () => {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
    stream.pipe(response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(500);
    response.end("Server error");
  }
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
});
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

server.listen(5173, "0.0.0.0", () => {
  console.log("Local:  http://127.0.0.1:5173");
  console.log("Celular: http://" + getLanIp() + ":5173");
});
