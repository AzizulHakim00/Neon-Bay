import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceDir = resolve('source');
const outputFile = resolve('src/main.js');
const files = (await readdir(sourceDir))
  .filter((name) => /^main\.part-\d+\.jsfrag$/.test(name))
  .sort();

if (!files.length) throw new Error('No Neon Bay main source parts were found.');
const chunks = await Promise.all(files.map((name) => readFile(resolve(sourceDir, name), 'utf8')));
await mkdir(resolve('src'), { recursive: true });
await writeFile(outputFile, chunks.join(''), 'utf8');
console.log(`Assembled ${files.length} source parts into src/main.js`);
