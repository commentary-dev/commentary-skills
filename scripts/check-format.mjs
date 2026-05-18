import path from "node:path";
import { listFiles, readText } from "./lib.mjs";

const textExtensions = new Set([
  "",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yaml",
  ".yml",
]);

const failures = [];

for (const filePath of listFiles()) {
  if (!textExtensions.has(path.posix.extname(filePath))) {
    continue;
  }

  const content = readText(filePath);
  if (content.length > 0 && !content.endsWith("\n")) {
    failures.push(`${filePath}: missing trailing newline`);
  }

  const lines = content.split(/\n/);
  lines.forEach((line, index) => {
    if (/[ \t]+\r?$/.test(line)) {
      failures.push(`${filePath}:${index + 1}: trailing whitespace`);
    }
  });
}

if (failures.length > 0) {
  console.error("Format check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Format check passed");
}

