import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.resolve(studioRoot, "..");
const arraysRoot = path.resolve(projectRoot, "arrays");
const srcRoot = path.resolve(studioRoot, "src");
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8"
};

export function resolveRequest(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  if (pathname === "/" || pathname === "/index.html") return path.resolve(studioRoot, "home.html");
  if (pathname === "/studio" || pathname === "/studio/") return path.resolve(studioRoot, "index.html");
  if (pathname === "/home.css") return path.resolve(studioRoot, "home.css");
  if (pathname === "/styles.css") return path.resolve(studioRoot, "styles.css");
  if (pathname === "/pip.css") return path.resolve(studioRoot, "pip.css");
  if (pathname.startsWith("/src/")) {
    return resolveInside(srcRoot, `.${pathname.slice("/src".length)}`);
  }
  if (pathname.startsWith("/arrays/")) {
    return resolveInside(arraysRoot, `.${pathname.slice("/arrays".length)}`);
  }
  return null;
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = resolveRequest(request.url ?? "/");
    if (!filePath) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

const isDirectInvocation = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  server.listen(port, "127.0.0.1", () => {
    console.log(`DSA Dojo studio running at http://127.0.0.1:${port}`);
  });
}
