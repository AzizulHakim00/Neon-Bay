import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'source');
const output = path.join(root, 'src', 'main.js');
const parts = fs.readdirSync(partsDir)
  .filter(name => /^main\.part-\d+\.jsfrag$/.test(name))
  .sort();

if (!parts.length) {
  throw new Error('No Neon Bay source fragments were found.');
}

const source = parts
  .map(name => fs.readFileSync(path.join(partsDir, name), 'utf8'))
  .join('');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, source);
console.log(`Assembled ${parts.length} fragments into src/main.js`);
