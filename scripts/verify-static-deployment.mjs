import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'vercel-static');
const indexPath = path.join(output, 'index.html');
const assetsPath = path.join(output, 'assets');

if (!fs.existsSync(indexPath)) throw new Error('vercel-static/index.html is missing.');
if (!fs.existsSync(assetsPath) || !fs.statSync(assetsPath).isDirectory()) throw new Error('vercel-static/assets is missing.');

const html = fs.readFileSync(indexPath, 'utf8');
const references = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)[^\"]*"/g)].map((match) => match[1]);
if (!references.length) throw new Error('No local deployment assets were referenced by index.html.');

for (const relative of references) {
  const target = path.join(output, relative);
  if (!fs.existsSync(target)) throw new Error(`Static deployment asset is missing: ${relative}`);
}

const engine = references.find((file) => /assets\/neon-bay-v1\.8\.0-engine\..+\.js$/.test(file));
if (!engine) throw new Error('The v1.8 cache-busted engine asset is not referenced.');

const buildInfoPath = path.join(output, 'BUILD_INFO.json');
if (!fs.existsSync(buildInfoPath)) throw new Error('vercel-static/BUILD_INFO.json is missing.');
const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
if (!String(buildInfo.version || buildInfo.release || '').includes('1.8')) throw new Error('BUILD_INFO does not identify v1.8.');

console.log(JSON.stringify({
  output: 'vercel-static',
  referencedFiles: references.length,
  engine,
  status: 'deployable',
}, null, 2));
