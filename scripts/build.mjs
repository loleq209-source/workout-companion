import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const driveSyncHtml = path.resolve(rootDir, "..", "workout-drive-sync", "index.html");

const MODULE_ORDER = [
  "js/date.mjs",
  "js/exercisesData.mjs",
  "js/data.mjs",
  "js/swapEngine.mjs",
  "js/recommendEngine.mjs",
  "js/bridge.mjs",
  "js/metrics.mjs",
  "js/muscleMap.mjs",
  "js/store.mjs",
  "js/timer.mjs",
  "js/sync.mjs",
  "js/ui/toast.mjs",
  "js/ui/report.mjs",
  "js/ui/modals.mjs",
  "js/ui/dashboard.mjs",
  "js/ui/card.mjs",
  "js/ui/catalog.mjs",
  "js/ui/syncTab.mjs",
  "js/main.mjs"
];

function resolveImportPath(fromRel, spec) {
  const fromDir = path.posix.dirname(fromRel);
  return path.posix.normalize(path.posix.join(fromDir, spec));
}

function transformEsmToCommonJs(relPath, code) {
  let out = code;

  // Replace multi-line and single-line named imports: import { a, b as c } from "./foo.mjs";
  out = out.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];?/g,
    (_, specifiers, target) => {
      const resolved = resolveImportPath(relPath, target);
      const mapped = specifiers
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/\s+as\s+/g, ": "))
        .join(", ");
      return `const { ${mapped} } = __req("${resolved}");`;
    }
  );

  // Replace re-exports: export { A, B };
  out = out.replace(/export\s*\{([\s\S]*?)\};?/g, (_, names) => {
    return names
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => {
        const parts = n.split(/\s+as\s+/);
        const local = parts[0].trim();
        const exported = (parts[1] || local).trim();
        return `__exp.${exported} = ${local};`;
      })
      .join("\n");
  });

  // Replace export async function foo(...) / export function foo(...)
  const exportedDecls = [];
  out = out.replace(/export\s+(async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(/g, (_, isAsync, fnName) => {
    exportedDecls.push(fnName);
    return `${isAsync || ""}function ${fnName}(`;
  });

  // Replace export const / let NAME =
  out = out.replace(/export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)/g, (_, kind, varName) => {
    exportedDecls.push(varName);
    return `${kind} ${varName}`;
  });

  if (exportedDecls.length > 0) {
    out += "\n" + exportedDecls.map(name => `__exp.${name} = ${name};`).join("\n") + "\n";
  }

  return out;
}

function bundle() {
  const enrichedPath = path.join(rootDir, "data", "exercises_enriched_34.json");
  const enrichedJson = JSON.parse(fs.readFileSync(enrichedPath, "utf8"));
  const enrichedMap = enrichedJson.exercises || {};

  const template = fs.readFileSync(path.join(srcDir, "template.html"), "utf8");
  const css = fs.readFileSync(path.join(srcDir, "styles", "main.css"), "utf8");

  const moduleDefs = MODULE_ORDER.map(rel => {
    const abs = path.join(srcDir, rel);
    const raw = fs.readFileSync(abs, "utf8");
    const cjs = transformEsmToCommonJs(rel, raw);
    const indented = cjs
      .split("\n")
      .map(l => "    " + l)
      .join("\n");
    return `  __mods[${JSON.stringify(rel)}] = function(__req, __exp) {\n${indented}\n  };`;
  }).join("\n\n");

  const runtimeJs = `(function() {
  "use strict";
  const __INJECTED_ENRICHED_DB__ = ${JSON.stringify(enrichedMap)};
  const __mods = {};
  const __cache = {};
  function __req(id) {
    if (__cache[id]) return __cache[id].exports;
    if (!__mods[id]) throw new Error("Module not found: " + id);
    const mod = { exports: {} };
    __cache[id] = mod;
    __mods[id](__req, mod.exports);
    return mod.exports;
  }

${moduleDefs}

  __req("js/main.mjs");
})();`;

  // Verify JS syntax strictly before writing output artifacts
  new Function(runtimeJs);

  const builtHtml = template
    .replace("/* __INLINE_CSS__ */", () => css)
    .replace("/* __INLINE_JS__ */", () => runtimeJs);

  const pagesOut = path.join(rootDir, "index.html");
  fs.writeFileSync(pagesOut, builtHtml, "utf8");

  if (fs.existsSync(path.dirname(driveSyncHtml))) {
    fs.writeFileSync(driveSyncHtml, builtHtml, "utf8");
  }

  console.log(`Built bundle cleanly:`);
  console.log(` - ${pagesOut} (${(Buffer.byteLength(builtHtml) / 1024).toFixed(1)} KB)`);
  console.log(` - ${driveSyncHtml}`);
}

bundle();
