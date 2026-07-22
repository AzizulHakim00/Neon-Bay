import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.argv[2] || 'vercel-static');
const fail = (message) => { throw new Error(`[static verification] ${message}`); };
const files = [];
const walk = (dir, rel = '') => {
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const next = path.join(rel, entry.name);
    if (entry.isDirectory()) walk(dir, next);
    else files.push(next.split(path.sep).join('/'));
  }
};
if (!fs.existsSync(root)) fail(`missing directory ${root}`);
walk(root);
files.sort();
const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
if (release.version !== '1.5.0') fail(`release version is ${release.version}`);
if (release.files !== files.length) fail(`release.json says ${release.files} files, found ${files.length}`);

const expectedMain = [
  ...Array.from({ length: 13 }, (_, i) => `main.part-${String(i).padStart(2, '0')}.jsfrag`),
  'main.part-13a.jsfrag', 'main.part-13b.jsfrag',
  ...Array.from({ length: 7 }, (_, i) => `main.part-${14 + i}.jsfrag`),
];
if (expectedMain.length !== 22) fail('expected engine part calculation is wrong');
const mainLoader = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
for (const name of expectedMain) {
  if (!mainLoader.includes(`'${name}'`)) fail(`main loader does not include ${name}`);
  if (!fs.existsSync(path.join(root, 'src/main-parts', name))) fail(`missing main fragment ${name}`);
}
if (mainLoader.includes('main.part-13.jsfrag')) fail('obsolete unsplit main part is referenced');
if (!mainLoader.includes('location.origin')) fail('main loader does not make Blob imports origin-qualified');

const main = expectedMain.map(name => fs.readFileSync(path.join(root, 'src/main-parts', name), 'utf8')).join('');
for (const marker of [
  "const MISSIONS = [",
  "function buildWorld()",
  "function updateMission(dt)",
  "function saveGame(silent=false)",
  "version:4",
  "init();",
]) if (!main.includes(marker)) fail(`engine missing marker ${marker}`);
if (!main.startsWith("import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';")) fail('engine does not start with pinned Three.js import');
if (!main.trimEnd().endsWith('init();')) fail('engine is truncated at the end');

const graphicsParts = ['graphics.part-00.jsfrag', 'graphics.part-01.jsfrag', 'graphics.part-02.jsfrag'];
const graphics = graphicsParts.map(name => {
  const file = path.join(root, 'src/modules/graphics-parts', name);
  if (!fs.existsSync(file)) fail(`missing graphics fragment ${name}`);
  return fs.readFileSync(file, 'utf8');
}).join('');
for (const marker of ['export const GRAPHICS_QUALITY', 'export class GraphicsOverhaul', 'emitShot(', 'emitImpact(', 'update(dt,']) {
  if (!graphics.includes(marker)) fail(`graphics module missing ${marker}`);
}

const interiorParts = ['interior.part-00.jsfrag', 'interior.part-01.jsfrag'];
const interior = interiorParts.map(name => {
  const file = path.join(root, 'src/modules/interior-parts', name);
  if (!fs.existsSync(file)) fail(`missing interior fragment ${name}`);
  return fs.readFileSync(file, 'utf8');
}).join('');
for (const marker of ['export class InteriorSystem', "nightclub:", 'collidesAt(']) {
  if (!interior.includes(marker)) fail(`interior module missing ${marker}`);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'neon-static-check-'));
try {
  const syntaxFiles = [
    ['engine.mjs', main],
    ['graphics.mjs', graphics],
    ['interior.mjs', interior],
  ];
  for (const rel of files.filter(name => name.endsWith('.js'))) {
    syntaxFiles.push([rel.replaceAll('/', '_') + '.mjs', fs.readFileSync(path.join(root, rel), 'utf8')]);
  }
  for (const [name, content] of syntaxFiles) {
    const target = path.join(temp, name);
    fs.writeFileSync(target, content);
    const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
    if (result.status !== 0) fail(`syntax failed for ${name}: ${result.stderr || result.stdout}`);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const marker of ['Neon Bay', 'v1.5', 'type="importmap"', 'three@0.179.1', 'href="./src/styles.css"', 'src="./src/main.js"']) {
  if (!html.includes(marker)) fail(`index.html missing ${marker}`);
}
for (const required of ['favicon.svg', 'trailer.html', 'src/styles.css', 'src/assets/neon-citizen-data.js']) {
  if (!files.includes(required)) fail(`missing required file ${required}`);
}
console.log(`Verified Neon Bay ${release.version}: ${files.length} files, ${expectedMain.length} engine fragments, syntax and runtime references valid.`);
