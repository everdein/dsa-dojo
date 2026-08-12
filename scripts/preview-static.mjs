import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getListenConfig } from "../studio/server.mjs";

await import("./build-static.mjs");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const deploymentBasePath = "/dsa-dojo";
const allowedExtensions = new Set([".css", ".html", ".jpg", ".mjs", ".svg"]);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};
const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      sendText(response, 405, "Method not allowed", method === "HEAD", { Allow: "GET, HEAD" });
      return;
    }

    const filePath = resolveStaticRequest(request.url ?? "/");
    if (!filePath) {
      sendText(response, 404, "Not found", method === "HEAD");
      return;
    }

    try {
      const content = await readFile(filePath);
      response.writeHead(200, {
        ...securityHeaders,
        "Cache-Control": "no-cache",
        "Content-Length": content.byteLength,
        "Content-Type": contentTypes[path.extname(filePath)]
      });
      response.end(method === "HEAD" ? undefined : content);
    } catch {
      sendText(response, 404, "Not found", method === "HEAD");
    }
  });
}

export async function listenForPreview({ host, port }) {
  const server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  return server;
}

const isDirectInvocation = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const { host, port } = getListenConfig();
  try {
    await listenForPreview({ host, port });
    console.log(`DSA Dojo static preview running at http://${host}:${port}`);
  } catch (error) {
    console.error(`Unable to preview DSA Dojo on ${host}:${port}: ${error.message}`);
    process.exitCode = 1;
  }
}

export function resolveStaticRequest(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  if (pathname.includes("\\") || pathname.includes("\0")) return null;
  if (pathname === deploymentBasePath) pathname = "/";
  if (pathname.startsWith(`${deploymentBasePath}/`)) {
    pathname = pathname.slice(deploymentBasePath.length);
  }
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/studio" || pathname === "/studio/") pathname = "/studio/index.html";

  const resolved = path.resolve(distRoot, `.${pathname}`);
  if (!resolved.startsWith(`${distRoot}${path.sep}`)) return null;
  return allowedExtensions.has(path.extname(resolved)) ? resolved : null;
}

function sendText(response, status, message, omitBody, headers = {}) {
  const body = Buffer.from(`${message}\n`);
  response.writeHead(status, {
    ...securityHeaders,
    "Cache-Control": "no-store",
    "Content-Length": body.byteLength,
    "Content-Type": "text/plain; charset=utf-8",
    ...headers
  });
  response.end(omitBody ? undefined : body);
}
