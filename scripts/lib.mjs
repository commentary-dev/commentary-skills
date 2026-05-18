import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function repoPath(relativePath) {
  return path.join(ROOT, relativePath);
}

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

export function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

export function writeText(relativePath, content) {
  const target = repoPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function pathExists(relativePath) {
  return fs.existsSync(repoPath(relativePath));
}

export function listDirectoryNames(relativePath) {
  const target = repoPath(relativePath);
  if (!fs.existsSync(target)) {
    return [];
  }

  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function listFiles(relativePath = ".") {
  const root = repoPath(relativePath);
  const files = [];
  const ignored = new Set([".git", "node_modules"]);

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (ignored.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(toPosixPath(path.relative(ROOT, fullPath)));
      }
    }
  }

  if (fs.existsSync(root)) {
    walk(root);
  }

  return files.sort();
}

export function copyDirectory(sourceRelativePath, targetRelativePath) {
  const source = repoPath(sourceRelativePath);
  const target = repoPath(targetRelativePath);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

export function parseFrontmatter(relativePath) {
  const content = readText(relativePath);
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${relativePath} must start with YAML frontmatter`);
  }

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const lineMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!lineMatch) {
      throw new Error(`${relativePath} has unsupported frontmatter line: ${line}`);
    }

    frontmatter[lineMatch[1]] = parseScalar(lineMatch[2]);
  }

  return { frontmatter, body: match[2] };
}

export function parseOpenAiYaml(relativePath) {
  const content = readText(relativePath);
  const result = {};
  let inInterface = false;

  for (const line of content.split(/\r?\n/)) {
    if (line.trim() === "interface:") {
      inInterface = true;
      continue;
    }

    if (!inInterface || !line.trim()) {
      continue;
    }

    const match = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`${relativePath} has unsupported interface line: ${line}`);
    }

    result[match[1]] = parseScalar(match[2]);
  }

  return result;
}

export function parseYamlList(relativePath, rootKey) {
  const lines = readText(relativePath).split(/\r?\n/);
  if (lines[0]?.trim() !== `${rootKey}:`) {
    throw new Error(`${relativePath} must start with ${rootKey}:`);
  }

  const items = [];
  let current = null;

  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      continue;
    }

    const itemMatch = line.match(/^\s{2}-\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (itemMatch) {
      current = {};
      current[itemMatch[1]] = parseScalar(itemMatch[2]);
      items.push(current);
      continue;
    }

    const fieldMatch = line.match(/^\s{4}([A-Za-z0-9_-]+):\s*(.*)$/);
    if (fieldMatch && current) {
      current[fieldMatch[1]] = parseScalar(fieldMatch[2]);
      continue;
    }

    throw new Error(`${relativePath} has unsupported YAML line: ${line}`);
  }

  return items;
}

export function readCatalogs() {
  return {
    skills: parseYamlList("catalog/skills.yaml", "skills"),
    plugins: parseYamlList("catalog/plugins.yaml", "plugins"),
  };
}

export function readPackageJson() {
  return JSON.parse(readText("package.json"));
}

export function fail(message) {
  throw new Error(message);
}

export function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    return inner.split(",").map((entry) => stripQuotes(entry.trim()));
  }

  return stripQuotes(value);
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

