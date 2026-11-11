#!/usr/bin/env node
/**
 * Generates lib/api/schema.ts — every DTO type and a typed `Operations`
 * map — from the API's OpenAPI document. Run: npm run gen:api
 *
 * The same shape the web console generates, so both clients read the
 * contract the same way. Types only: the app needs nothing at runtime.
 *
 * Spec source, first match wins:
 *   1. SPEC — a file path or an http(s) URL
 *   2. ../qadrahr-backend/openapi.json — the committed contract, which the
 *      API's CI checks against the code
 *
 * No dependencies, so it runs on plain Node.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.env.SPEC ?? path.resolve(root, "../qadrahr-backend/openapi.json");
const OUT = path.join(root, "lib/api/schema.ts");
const METHODS = ["get", "post", "put", "patch", "delete"];

async function loadSpec(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Could not fetch ${source}: HTTP ${res.status}`);
    return res.json();
  }
  if (!fs.existsSync(source)) {
    throw new Error(`No OpenAPI document at ${source}. Set SPEC to a file path or URL.`);
  }
  return JSON.parse(fs.readFileSync(source, "utf8"));
}

const safeName = (n) => n.replace(/[^A-Za-z0-9_]/g, "_");
const refName = (ref) => safeName(ref.split("/").pop());
const doc = (text, pad) => (text ? `${pad}/** ${String(text).replace(/\s+/g, " ").replace(/\*\//g, "*\\/")} */\n` : "");

function tsType(s, depth = 0) {
  if (!s) return "unknown";
  if (s.$ref) return refName(s.$ref);
  if (s.allOf) return s.allOf.map((x) => tsType(x, depth + 1)).join(" & ");
  if (s.oneOf) return s.oneOf.map((x) => tsType(x, depth + 1)).join(" | ");
  if (s.anyOf) return s.anyOf.map((x) => tsType(x, depth + 1)).join(" | ");
  if (s.enum) return s.enum.map((e) => JSON.stringify(e)).join(" | ");
  switch (s.type) {
    case "string":
      return s.format === "binary" ? "Blob" : "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "array": {
      // Parenthesised: `"a" | "b"[]` would mean "a, or an array of b".
      const item = tsType(s.items, depth + 1);
      return item.includes("|") || item.includes("&") ? `(${item})[]` : `${item}[]`;
    }
    default: {
      const props = s.properties ?? {};
      const keys = Object.keys(props);
      if (!keys.length) return "Record<string, unknown>";
      const required = s.required ?? [];
      const pad = "  ".repeat(depth + 1);
      const body = keys
        .map((k) => {
          const p = props[k];
          const opt = required.includes(k) ? "" : "?";
          const nullable = p?.nullable ? " | null" : "";
          return `${doc(p?.description, pad)}${pad}${JSON.stringify(k)}${opt}: ${tsType(p, depth + 1)}${nullable};`;
        })
        .join("\n");
      return `{\n${body}\n${"  ".repeat(depth)}}`;
    }
  }
}

/** `{ "a": T; "b"?: U }`, or `Record<string, never>` when there are none. */
function objectType(fields) {
  if (!fields.length) return "Record<string, never>";
  return `{ ${fields.map(([k, ty, req]) => `${JSON.stringify(k)}${req ? "" : "?"}: ${ty}`).join("; ")} }`;
}

async function main() {
  const spec = await loadSpec(SOURCE);
  const lines = [
    "/* AUTO-GENERATED from the API's openapi.json — do not edit by hand. Run `npm run gen:api`. */",
    "",
  ];

  const schemas = spec.components?.schemas ?? {};
  for (const [name, s] of Object.entries(schemas)) {
    lines.push(`${doc(s.description, "")}export type ${safeName(name)} = ${tsType(s)};`, "");
  }

  const ops = [];
  for (const [p, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const m of METHODS) {
      const o = pathItem[m];
      if (!o) continue;
      const params = [...(pathItem.parameters ?? []), ...(o.parameters ?? [])];
      const ok = o.responses?.["200"] ?? o.responses?.["201"] ?? o.responses?.["202"];
      const response = ok?.content?.["application/json"]?.schema;
      const body = o.requestBody?.content?.["application/json"]?.schema;
      ops.push(
        `  ${JSON.stringify(`${m.toUpperCase()} ${p}`)}: {\n` +
          `    path: ${objectType(params.filter((x) => x.in === "path").map((x) => [x.name, "string", true]))};\n` +
          `    query: ${objectType(params.filter((x) => x.in === "query").map((x) => [x.name, tsType(x.schema, 2), Boolean(x.required)]))};\n` +
          `    body: ${body ? tsType(body, 2) : "never"};\n` +
          // 204s and bodiless 2xx responses resolve to void.
          `    response: ${response ? tsType(response, 2) : "void"};\n` +
          `  };`,
      );
    }
  }

  lines.push(
    "/**",
    " * Every operation, keyed by `METHOD /path` exactly as the API declares it.",
    " * Read it through the helpers in ./types (Body, Res, Query, Item).",
    " */",
    "export interface Operations {",
    ...ops,
    "}",
    "",
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`spec: ${SOURCE}`);
  console.log(`generated ${Object.keys(schemas).length} types and ${ops.length} operations → lib/api/schema.ts`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
