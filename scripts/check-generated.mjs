import { generateCatalog } from "./generate-catalog.mjs";
import { generateClaudePlugins } from "./generate-claude-plugins.mjs";
import { listFiles, readText } from "./lib.mjs";

const generatedRoots = [
  ".claude-plugin/",
  ".github/plugin/",
  "dist/",
  "plugins/commentary-review/.claude-plugin/",
  "plugins/commentary-review/plugin.json",
  "plugins/commentary-review/skills/",
];

function snapshotGeneratedFiles() {
  const files = listFiles().filter((file) => generatedRoots.some((root) => file.startsWith(root)));
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
