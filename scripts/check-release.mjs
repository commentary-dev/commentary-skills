import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { buildRelease, crc32, releaseEntries } from "./build-release.mjs";
import { readCatalogs, repoPath } from "./lib.mjs";

function readZip(bytes) {
  const end = bytes.length - 22;
  assert.equal(bytes.readUInt32LE(end), 0x06054b50, "Missing ZIP end record");
  const count = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  const centralOffset = bytes.readUInt32LE(end + 16);
  assert.equal(centralOffset + centralSize, end, "Invalid central directory bounds");
  const entries = new Map();
  let cursor = centralOffset;

  for (let index = 0; index < count; index += 1) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50, "Invalid central directory entry");
    assert.equal(bytes.readUInt16LE(cursor + 10), 0, "ZIP entry must be stored");
    const checksum = bytes.readUInt32LE(cursor + 16);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50, `${name}: invalid local header`);
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.subarray(dataOffset, dataOffset + size);
    assert.equal(data.length, size, `${name}: truncated entry`);
    assert.equal(crc32(data), checksum, `${name}: CRC mismatch`);
    assert(!entries.has(name), `${name}: duplicate entry`);
    entries.set(name, data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  assert.equal(cursor, end, "Central directory has extra data");
  return entries;
}

const { plugins } = readCatalogs();
const firstBuild = new Map();
const checksumLines = [];

for (const plugin of plugins) {
  const name = `${plugin.name}-cowork.zip`;
  const bytes = fs.readFileSync(repoPath(`release-assets/${name}`));
  const actual = readZip(bytes);
  const expected = releaseEntries(plugin);
  assert.deepEqual([...actual.keys()], expected.map((entry) => entry.name), `${name}: unexpected ZIP layout`);
  for (const entry of expected) {
    assert(actual.get(entry.name).equals(entry.bytes), `${name}: ${entry.name} differs from generated plugin`);
  }
  firstBuild.set(name, bytes);
  checksumLines.push(`${crypto.createHash("sha256").update(bytes).digest("hex")}  ${name}`);
}

assert.equal(
  fs.readFileSync(repoPath("release-assets/SHA256SUMS.txt"), "utf8"),
  `${checksumLines.join("\n")}\n`,
  "Release checksums differ from ZIP contents",
);

buildRelease();
for (const [name, bytes] of firstBuild) {
  assert(fs.readFileSync(repoPath(`release-assets/${name}`)).equals(bytes), `${name}: build is not deterministic`);
}
console.log(`Release ZIPs passed: ${plugins.length} packages, deterministic and source-matched`);
