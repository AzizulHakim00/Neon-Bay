import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = resolve(root, 'vercel-static');
const srcRoot = resolve(root, 'src');
const partNames = ['main.part-00.jsfrag', 'main.part-01.jsfrag', 'main.part-02.jsfrag', 'main.part-03.jsfrag', 'main.part-04.jsfrag', 'main.part-05.jsfrag', 'main.part-06.jsfrag', 'main.part-07.jsfrag', 'main.part-08.jsfrag', 'main.part-09.jsfrag', 'main.part-10.jsfrag', 'main.part-11.jsfrag', 'main.part-12.jsfrag', 'main.part-13a.jsfrag', 'main.part-13b.jsfrag', 'main.part-14.jsfrag', 'main.part-15.jsfrag', 'main.part-16.jsfrag', 'main.part-17.jsfrag', 'main.part-18.jsfrag', 'main.part-19.jsfrag', 'main.part-20.jsfrag'];
const { V16_ENGINE_PATCHES } = await import(pathToFileURL(resolve(staticRoot, 'src/v16-engine-patch.js')).href);

await mkdir(resolve(srcRoot, 'modules'), { recursive: true });
const parts = await Promise.all(partNames.map(name => readFile(resolve(staticRoot, 'src/main-parts', name), 'utf8')));
let source = parts.join('');
for (const [index, patch] of V16_ENGINE_PATCHES.entries()) {
  const occurrences = source.split(patch.before).length - 1;
  if (occurrences !== 1) throw new Error(`v1.6 patch ${index + 1} expected one source match, found ${occurrences}`);
  source = source.replace(patch.before, patch.after);
}
await writeFile(resolve(srcRoot, 'main.js'), source, 'utf8');
await copyFile(resolve(staticRoot, 'src/styles.css'), resolve(srcRoot, 'styles.css'));
await copyFile(resolve(staticRoot, 'src/modules/cinematic-city-v16.js'), resolve(srcRoot, 'modules/cinematic-city-v16.js'));

const indexPath = resolve(root, 'index.html');
let index = await readFile(indexPath, 'utf8');
index = index
  .replace(/ORIGINAL WEB GAME · v[\d.]+/g, 'ORIGINAL WEB GAME · v1.6')
  .replace(/GRAPHICS OVERHAUL · v[\d.]+/g, 'CINEMATIC CITY · v1.6')
  .replace(/Watch v[\d.]+ Trailer/g, 'Watch Cinematic Trailer');
await writeFile(indexPath, index, 'utf8');

console.log(`Applied Neon Bay v1.6 cinematic city overlay (${V16_ENGINE_PATCHES.length} verified source patches).`);
