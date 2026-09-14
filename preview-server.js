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

createServer((request, response) => {
  const file = files[new URL(request.url, "http://localhost").pathname];
  if (!file || !existsSync(join(__dirname, file[0]))) return response.writeHead(404).end("Not found");
  response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" });
  createReadStream(join(__dirname, file[0])).pipe(response);
}).listen(5173, "0.0.0.0", () => {
  console.log("Local:  http://127.0.0.1:5173");
  console.log("Celular: http://" + getLanIp() + ":5173");
});
