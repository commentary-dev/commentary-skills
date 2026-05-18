import { spawnSync } from "node:child_process";
import path from "node:path";
import { listFiles, readText, repoPath } from "./lib.mjs";

const blockedPathBasenames = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz"]);
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/, "private key block"],
  [/gh[pousr]_[A-Za-z0-9_]{30,}/, "GitHub token"],
  [/npm_[A-Za-z0-9]{30,}/, "npm token"],
  [/sk-[A-Za-z0-9]{32,}/, "API token"],
  [/commentary_(?:pat|token)_[A-Za-z0-9_-]{20,}/i, "Commentary token"],
];
const localPathPatterns = [
  [/[A-Za-z]:\\(?:Users|code|tmp)\\/i, "Windows local absolute path"],
  [/\/(?:Users|home)\/[A-Za-z0-9._-]+\//, "user home absolute path"],
];

function trackedAndUntrackedFiles() {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: repoPath("."),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return listFiles();
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

const failures = [];

for (const filePath of trackedAndUntrackedFiles()) {
  const basename = path.posix.basename(filePath);
  if (blockedPathBasenames.has(basename)) {
    failures.push(`${filePath}: environment file must not be committed`);
    continue;
  }

  if (binaryExtensions.has(path.posix.extname(filePath).toLowerCase())) {
    continue;
  }

  let content;
  try {
    content = readText(filePath);
  } catch {
    failures.push(`${filePath}: unable to read as UTF-8 text`);
    continue;
  }

  if (content.includes("\u0000")) {
    failures.push(`${filePath}: binary content is not allowed`);
    continue;
  }

  for (const [pattern, label] of [...secretPatterns, ...localPathPatterns]) {
    if (pattern.test(content)) {
      failures.push(`${filePath}: contains ${label}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Public readiness check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Public readiness check passed");
}

