import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readCatalogs, repoPath } from './lib.mjs';
import { releaseEntries } from './build-release.mjs';
import { checkPackagedLinks } from './check-packaged-links.mjs';

const { plugins } = readCatalogs();
const taskTempRoot = fs.realpathSync(os.tmpdir());
const consumer = fs.mkdtempSync(path.join(taskTempRoot, 'commentary-project-plugin-'));
let installations = 0;
try {
  for (const [platform, target] of [['codex', 'codex'], ['copilot', 'copilot'], ['claude', 'claude-code']]) {
    const marketplace = JSON.parse(fs.readFileSync(repoPath(platform === 'codex' ? '.agents/plugins/marketplace.json' : platform === 'copilot' ? '.github/plugin/marketplace.json' : '.claude-plugin/marketplace.json')));
    for (const plugin of plugins.filter(item => item.targets.includes(target))) {
      const { name } = plugin;
      const entry = marketplace.plugins.find(item => item.name === name);
      assert.ok(entry, platform + ':' + name);
      const source = typeof entry.source === 'string' ? entry.source : entry.source.path;
      const destination = path.join(consumer, platform, name);
      fs.cpSync(repoPath(source), destination, { recursive: true });
      const manifest = JSON.parse(fs.readFileSync(path.join(destination, platform === 'codex' ? '.codex-plugin/plugin.json' : platform === 'claude' ? '.claude-plugin/plugin.json' : 'plugin.json')));
      assert.equal(manifest.name, name);
      assert.equal(manifest.version, plugin.version);
      const entries = new Map(releaseEntries(plugin).map(item => [item.name, item.bytes]));
      for (const skill of plugin.skills) {
        const skillRoot = `skills/${skill}`;
        assert.equal(fs.readFileSync(path.join(destination, skillRoot, 'SKILL.md'), 'utf8'), fs.readFileSync(repoPath(`${skillRoot}/SKILL.md`), 'utf8'));
        for (const relative of fs.readdirSync(path.join(destination, skillRoot), { recursive: true })) {
          const fullPath = path.join(destination, skillRoot, relative);
          if (!fs.statSync(fullPath).isFile()) continue;
          const key = `${skillRoot}/${relative.split(path.sep).join('/')}`;
          assert.ok(entries.has(key), 'File omitted from ZIP: ' + key);
          assert.deepEqual(entries.get(key), fs.readFileSync(fullPath), 'Packaged bytes differ: ' + key);
        }
      }
      checkPackagedLinks(destination);
      if (manifest.mcpServers) {
        const mcp = JSON.parse(fs.readFileSync(path.join(destination, manifest.mcpServers)));
        assert.equal(mcp.mcpServers.commentary.url, 'https://commentary.dev/mcp');
      }
      installations++;
    }
  }
  console.log(`Portable installation smoke passed: ${plugins.length} plugins, ${installations} wrapper installations; packaged files and local Markdown links survive. Native harness installation remains unverified.`);
} finally {
  const target = path.resolve(consumer);
  assert.equal(path.dirname(target), taskTempRoot);
  assert.ok(path.basename(target).startsWith('commentary-project-plugin-'));
  fs.rmSync(target, { recursive: true, force: true });
}
