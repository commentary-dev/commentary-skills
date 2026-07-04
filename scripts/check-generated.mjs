import { generateCatalog } from "./generate-catalog.mjs";
import { generateClaudePlugins } from "./generate-claude-plugins.mjs";
import { listFiles, readCatalogs, readText } from "./lib.mjs";

function generatedRoots() {
  const { plugins } = readCatalogs();
  return [
    ".agents/plugins/",
    ".claude-plugin/",
    ".github/plugin/",
    "dist/",
    ...plugins.flatMap((plugin) => [
      `plugins/${plugin.name}/.claude-plugin/`,
      `plugins/${plugin.name}/.codex-plugin/`,
      `plugins/${plugin.name}/.mcp.json`,
      `plugins/${plugin.name}/plugin.json`,
      `plugins/${plugin.name}/skills/`,
    ]),
  ];
}

function snapshotGeneratedFiles() {
  const roots = generatedRoots();
  const files = listFiles().filter((file) => roots.some((root) => file.startsWith(root)));
  return new Map(files.map((file) => [file, readText(file)]));
}

function diffSnapshots(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()]);
  const changed = [];

  for (const filePath of [...paths].sort()) {
    if (before.get(filePath) !== after.get(filePath)) {
      changed.push(filePath);
    }
  }

  return changed;
}

const before = snapshotGeneratedFiles();
generateCatalog();
generateClaudePlugins();
const after = snapshotGeneratedFiles();
const changed = diffSnapshots(before, after);

if (changed.length > 0) {
  console.error("Generated artifacts were stale:");
  for (const filePath of changed) {
    console.error(`- ${filePath}`);
  }
  process.exitCode = 1;
} else {
  console.log("Generated artifacts are up to date");
}
