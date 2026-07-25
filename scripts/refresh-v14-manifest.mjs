import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const overlayRoot = path.join(root, 'overlay-v14');
const manifestPath = path.join(overlayRoot, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const repaired = {};

for (const relativePath of Object.keys(manifest)) {
  const source = relativePath.startsWith('@main/')
    ? path.join(overlayRoot, 'main-parts', relativePath.slice(6))
    : path.join(overlayRoot, 'files', relativePath);
  if (!fs.existsSync(source)) throw new Error(`Missing v1.4 overlay source: ${relativePath}`);
  repaired[relativePath] = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
}

fs.writeFileSync(manifestPath, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
console.log(`Refreshed ${Object.keys(repaired).length} v1.4 overlay checksums from committed source files.`);
