import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = resolve(root, 'vercel-static');
const srcRoot = resolve(root, 'src');
const mainPath = resolve(srcRoot, 'main.js');
const { V16_ENGINE_PATCHES } = await import(pathToFileURL(resolve(staticRoot, 'src/v16-engine-patch.js')).href);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const flexiblePattern = (value) => value
  .trim()
  .split(/\s+/)
  .map(escapeRegExp)
  .join('\\s+');

let source = await readFile(mainPath, 'utf8');
let exact = 0;
let flexible = 0;

for (const [index, patch] of V16_ENGINE_PATCHES.entries()) {
  const exactOccurrences = source.split(patch.before).length - 1;
  if (exactOccurrences === 1) {
    source = source.replace(patch.before, patch.after);
    exact += 1;
    continue;
  }

  const patternSource = flexiblePattern(patch.before);
  const globalPattern = new RegExp(patternSource, 'gm');
  const matches = source.match(globalPattern) || [];
  if (matches.length !== 1) {
    const anchor = patch.before.trim().split('\n')[0].slice(0, 140);
    throw new Error(`v1.6 flexible patch ${index + 1} expected one source match, found ${matches.length}; anchor: ${anchor}`);
  }
  source = source.replace(new RegExp(patternSource, 'm'), patch.after.trim());
  flexible += 1;
}

await mkdir(resolve(srcRoot, 'modules'), { recursive: true });
await writeFile(mainPath, source, 'utf8');
await copyFile(resolve(staticRoot, 'src/styles.css'), resolve(srcRoot, 'styles.css'));
await copyFile(resolve(staticRoot, 'src/modules/cinematic-city-v16.js'), resolve(srcRoot, 'modules/cinematic-city-v16.js'));

const indexPath = resolve(root, 'index.html');
let index = await readFile(indexPath, 'utf8');
index = index
  .replace(/ORIGINAL WEB GAME · v[\d.]+/g, 'ORIGINAL WEB GAME · v1.6')
  .replace(/GRAPHICS OVERHAUL · v[\d.]+/g, 'CINEMATIC CITY · v1.6')
  .replace(/Watch v[\d.]+ Trailer/g, 'Watch Cinematic Trailer');
await writeFile(indexPath, index, 'utf8');

console.log(`Applied Neon Bay v1.6 cinematic city overlay (${exact} exact patches, ${flexible} whitespace-tolerant patches).`);
