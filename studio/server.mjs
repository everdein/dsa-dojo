import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.resolve(studioRoot, "..");
const arraysRoot = path.resolve(projectRoot, "arrays");
const linkedListsRoot = path.resolve(projectRoot, "linked-lists");
const srcRoot = path.resolve(studioRoot, "src");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;
const allowedMethods = new Set(["GET", "HEAD"]);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8"
};
const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

export function resolveRequest(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  if (pathname.includes("\\") || pathname.includes("\0")) return null;
  if (pathname === "/" || pathname === "/index.html") return path.resolve(studioRoot, "home.html");
  if (pathname === "/studio" || pathname === "/studio/") return path.resolve(studioRoot, "index.html");
  if (pathname === "/home.css") return path.resolve(studioRoot, "home.css");
  if (pathname === "/styles.css") return path.resolve(studioRoot, "styles.css");
  if (pathname === "/pip.css") return path.resolve(studioRoot, "pip.css");
  if (pathname === "/favicon.svg") return path.resolve(studioRoot, "favicon.svg");
  if (pathname === "/social-preview.jpg") return path.resolve(studioRoot, "social-preview.jpg");
  if (pathname.startsWith("/studio/src/")) {
    return resolveModuleInside(srcRoot, pathname.slice("/studio/src/".length));
  }
  if (pathname.startsWith("/src/")) {
    return resolveModuleInside(srcRoot, pathname.slice("/src/".length));
  }
  if (pathname.startsWith("/arrays/")) {
    return resolveModuleInside(arraysRoot, pathname.slice("/arrays/".length));
  }
  if (pathname.startsWith("/linked-lists/")) {
    return resolveModuleInside(linkedListsRoot, pathname.slice("/linked-lists/".length));
  }
  return null;
}

function resolveModuleInside(root, relativePath) {
  if (path.posix.extname(relativePath) !== ".mjs") return null;

  const resolved = path.resolve(root, relativePath);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

export function parsePort(value) {
  const port = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new RangeError(`PORT must be an integer from 0 through 65535; received ${JSON.stringify(value)}.`);
  }
  return port;
}

export function getListenConfig({ env = process.env, argv = process.argv } = {}) {
  const configuredHost = typeof env.HOST === "string" ? env.HOST.trim() : "";
  const configuredPort = typeof env.PORT === "string" ? env.PORT.trim() : env.PORT;
  return {
    host: configuredHost || defaultHost,
    port: parsePort(configuredPort || argv[2] || defaultPort)
  };
}

export function createStudioServer() {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    if (!allowedMethods.has(method)) {
      sendText(response, 405, "Method not allowed", method === "HEAD", { Allow: "GET, HEAD" });
      return;
    }

    const filePath = resolveRequest(request.url ?? "/");
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
        "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream"
      });
      response.end(method === "HEAD" ? undefined : content);
    } catch {
      sendText(response, 404, "Not found", method === "HEAD");
    }
  });
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

function formatHostForUrl(host) {
  if (host === "0.0.0.0" || host === "::") return "localhost";
  return host.includes(":") ? `[${host}]` : host;
}

const isDirectInvocation = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  let config;
  try {
    config = getListenConfig();
  } catch (error) {
    console.error(`Unable to start DSA Dojo: ${error.message}`);
    process.exitCode = 1;
  }

  if (config) {
    const server = createStudioServer();
    server.once("error", (error) => {
      console.error(`Unable to start DSA Dojo on ${config.host}:${config.port}: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(config.port, config.host, () => {
      const address = server.address();
      const listeningPort = typeof address === "object" && address ? address.port : config.port;
      console.log(`DSA Dojo studio running at http://${formatHostForUrl(config.host)}:${listeningPort}`);
    });
  }
}
