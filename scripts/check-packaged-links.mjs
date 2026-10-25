import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Check the installed tree, so a canonical sibling cannot hide a missing dependency.
export function checkPackagedLinks(directory) {
  const root = path.resolve(directory);
  for (const relative of fs.readdirSync(root, { recursive: true })) {
    const file = path.join(root, relative);
    if (!relative.endsWith('.md') || !fs.statSync(file).isFile()) continue;
    const text = fs.readFileSync(file, 'utf8');
    const links = [...text.matchAll(/\]\((<?[^\s)]+>?)(?:\s+"[^"]*")?\)/g),
      ...text.matchAll(/^\s*\[[^\]]+\]:\s*(<?[^\s]+>?)/gm)];
    for (const match of links) {
      const href = match[1].replace(/^<|>$/g, '');
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
      const local = decodeURIComponent(href.split(/[?#]/)[0]);
      if (!local) continue;
      const target = path.resolve(path.dirname(file), local);
      const inside = path.relative(root, target);
      assert.ok(inside !== '..' && !inside.startsWith(`..${path.sep}`) && !path.isAbsolute(inside), `${relative}: link escapes package: ${href}`);
      assert.ok(fs.existsSync(target), `${relative}: missing packaged link: ${href}`);
    }
  }
}
