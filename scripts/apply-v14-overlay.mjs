import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const overlayRoot = path.join(root, 'overlay-v14');
const manifest = JSON.parse(fs.readFileSync(path.join(overlayRoot, 'manifest.json'), 'utf8'));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

for (const [relativePath, expected] of Object.entries(manifest)) {
  const source = relativePath.startsWith('@main/')
    ? path.join(overlayRoot, 'main-parts', relativePath.slice(6))
    : path.join(overlayRoot, 'files', relativePath);
  const bytes = fs.readFileSync(source);
  const actual = sha256(bytes);
  if (actual !== expected) throw new Error(`Neon Bay v1.4 overlay checksum mismatch: ${relativePath}`);
}

const copyTree = (sourceDir, relative = '') => {
  for (const entry of fs.readdirSync(path.join(sourceDir, relative), { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) copyTree(sourceDir, next);
    else {
      const target = path.resolve(root, next);
      if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`Unsafe overlay path: ${next}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(sourceDir, next), target);
    }
  }
};
copyTree(path.join(overlayRoot, 'files'));

const main = fs.readdirSync(path.join(overlayRoot, 'main-parts'))
  .filter((name) => /^main\.part-\d+\.jsfrag$/.test(name))
  .sort()
  .map((name) => fs.readFileSync(path.join(overlayRoot, 'main-parts', name), 'utf8'))
  .join('');
fs.mkdirSync(path.join(root, 'src'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/main.js'), main, 'utf8');

console.log(`Applied Neon Bay 1.4.0 readable overlay: ${Object.keys(manifest).length} verified files`);
