import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, readCatalogs, repoPath } from "./lib.mjs";

const OUTPUT_ROOT = repoPath("release-assets");
const DOS_DATE = 0x0021; // 1980-01-01, the earliest ZIP date.

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { name, bytes } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    assert(nameBytes.length <= 0xffff, `${name}: ZIP path is too long`);
    assert(bytes.length <= 0xffffffff, `${name}: ZIP64 is not supported`);
    const checksum = crc32(bytes);
    const flags = 0x0800; // Names are UTF-8.

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(0, 8); // Store, without platform-dependent compression.
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, bytes);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);

    offset += local.length + nameBytes.length + bytes.length;
    assert(offset <= 0xffffffff, "ZIP64 is not supported");
  }

  assert(entries.length <= 0xffff, "ZIP64 is not supported");
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  assert(offset + centralSize <= 0xffffffff, "ZIP64 is not supported");
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function filesUnder(relativeRoot) {
  const fullRoot = repoPath(relativeRoot);
  assert(fs.existsSync(fullRoot), `${relativeRoot} is missing; run npm run generate`);
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const fullPath = path.join(directory, entry.name);
      assert(!entry.isSymbolicLink(), `Symlink is not allowed in a release: ${fullPath}`);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        assert(entry.isFile(), `Unsupported release entry: ${fullPath}`);
        files.push(path.relative(repoPath("."), fullPath).split(path.sep).join("/"));
      }
    }
  }

  walk(fullRoot);
  return files;
}

export function releaseEntries(plugin) {
  assert(plugin.targets.includes("claude-code"), `${plugin.name} needs a Claude plugin wrapper for Cowork upload`);
  const root = `plugins/${plugin.name}/`;
  const paths = [
    `${root}.claude-plugin/plugin.json`,
    ...plugin.mcpServers.includes("commentary") ? [`${root}.mcp.json`] : [],
    ...filesUnder(`${root}skills`),
  ];
  for (const skill of plugin.skills) {
    assert(paths.includes(`${root}skills/${skill}/SKILL.md`), `${plugin.name}: missing generated ${skill}/SKILL.md`);
  }
  assert(paths.length > 2, `${plugin.name}: release package is empty`);

  const manifest = JSON.parse(fs.readFileSync(repoPath(paths[0]), "utf8"));
  assert(manifest.name === plugin.name, `${plugin.name}: Claude manifest name differs from catalog`);
  assert(manifest.version === plugin.version, `${plugin.name}: Claude manifest version differs from catalog`);
  if (plugin.mcpServers.includes("commentary")) {
    const mcp = JSON.parse(fs.readFileSync(repoPath(`${root}.mcp.json`), "utf8"));
    assert(mcp.mcpServers?.commentary?.url === "https://commentary.dev/mcp", `${plugin.name}: unexpected MCP URL`);
  }

  return paths
    .map((filePath) => ({
      name: filePath.slice(root.length),
      bytes: fs.readFileSync(repoPath(filePath)),
    }))
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

export function buildRelease() {
  const { plugins } = readCatalogs();
  assert(plugins.length > 0, "No plugins in catalog");
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const expected = new Set([...plugins.map((plugin) => `${plugin.name}-cowork.zip`), "SHA256SUMS.txt"]);
  for (const entry of fs.readdirSync(OUTPUT_ROOT)) {
    assert(expected.has(entry), `Unexpected file in release-assets: ${entry}`);
  }
  const assets = [];

  for (const plugin of plugins) {
    const name = `${plugin.name}-cowork.zip`;
    const bytes = zip(releaseEntries(plugin));
    fs.writeFileSync(path.join(OUTPUT_ROOT, name), bytes);
    assets.push({ name, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
  }

  const checksums = assets.map(({ name, sha256 }) => `${sha256}  ${name}`).join("\n");
  fs.writeFileSync(path.join(OUTPUT_ROOT, "SHA256SUMS.txt"), `${checksums}\n`, "utf8");
  return assets;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const asset of buildRelease()) {
    console.log(`${asset.name}  ${asset.sha256}`);
  }
}
