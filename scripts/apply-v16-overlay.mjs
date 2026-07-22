import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = resolve(root, 'vercel-static');
const srcRoot = resolve(root, 'src');
const partNames = Array.from({ length: 14 }, (_, index) => `main.part-${String(index).padStart(2, '0')}.jsfrag`);

await mkdir(resolve(srcRoot, 'modules'), { recursive: true });
const parts = await Promise.all(partNames.map(name => readFile(resolve(staticRoot, 'src/main-parts', name), 'utf8')));
await writeFile(resolve(srcRoot, 'main.js'), parts.join(''), 'utf8');
await copyFile(resolve(staticRoot, 'src/styles.css'), resolve(srcRoot, 'styles.css'));
await copyFile(resolve(staticRoot, 'src/modules/cinematic-city-v16.js'), resolve(srcRoot, 'modules/cinematic-city-v16.js'));

const indexPath = resolve(root, 'index.html');
let index = await readFile(indexPath, 'utf8');
index = index
  .replace(/ORIGINAL WEB GAME · v[\d.]+/g, 'ORIGINAL WEB GAME · v1.6')
  .replace(/GRAPHICS OVERHAUL · v[\d.]+/g, 'CINEMATIC CITY · v1.6')
  .replace(/Watch v[\d.]+ Trailer/g, 'Watch Cinematic Trailer');
await writeFile(indexPath, index, 'utf8');

console.log(`Applied Neon Bay v1.6 cinematic city overlay (${partNames.length} engine fragments).`);
