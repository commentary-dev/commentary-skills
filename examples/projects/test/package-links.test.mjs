import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkPackagedLinks } from '../../../scripts/check-packaged-links.mjs';

test('installed links include references and siblings but cannot escape the plugin', () => {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, 'commentary-links-'));
  try {
    fs.mkdirSync(path.join(root, 'skills/a/references'), { recursive: true });
    fs.mkdirSync(path.join(root, 'skills/b'), { recursive: true });
    const entry = path.join(root, 'skills/a/SKILL.md');
    fs.writeFileSync(path.join(root, 'skills/b/SKILL.md'), '# Companion\n');
    fs.writeFileSync(path.join(root, 'skills/a/references/work.md'), '[companion](../../b/SKILL.md#use)\n');
    fs.writeFileSync(entry, '[work](references/work.md) [web](https://example.com) [section](#use)\n');
    assert.doesNotThrow(() => checkPackagedLinks(root));
    fs.writeFileSync(entry, '[companion](../absent/SKILL.md)\n');
    assert.throws(() => checkPackagedLinks(root), /missing packaged link/);
    fs.writeFileSync(entry, '[work][missing]\n\n[missing]: references/absent.md\n');
    assert.throws(() => checkPackagedLinks(root), /missing packaged link/);
    fs.writeFileSync(entry, '[outside](../../../outside.md)\n');
    assert.throws(() => checkPackagedLinks(root), /link escapes package/);
  } finally {
    assert.equal(path.dirname(root), temp);
    assert.ok(path.basename(root).startsWith('commentary-links-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
