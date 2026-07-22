import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const publicRoot = path.join(root, 'public');
const outputRoot = path.join(root, 'vercel-static');
const indexSource = path.join(root, 'index.html');

const fail = (message) => {
  throw new Error(`[Neon Bay Vercel static build] ${message}`);
};
const assertInside = (base, target) => {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)) {
    fail(`Unsafe path: ${target}`);
  }
};
const copyTree = (sourceDir, targetDir) => {
  if (!fs.existsSync(sourceDir)) fail(`Missing source directory: ${path.relative(root, sourceDir)}`);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    assertInside(outputRoot, target);
    if (entry.isDirectory()) copyTree(source, target);
    else fs.copyFileSync(source, target);
  }
};
const walkFiles = (directory, relative = '') => {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(directory, next));
    else files.push(next);
  }
  return files;
};

if (!fs.existsSync(indexSource)) fail('Missing index.html');
if (!fs.existsSync(path.join(sourceRoot, 'main.js'))) fail('Missing src/main.js');
if (!fs.existsSync(path.join(sourceRoot, 'styles.css'))) fail('Missing src/styles.css');

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
copyTree(sourceRoot, path.join(outputRoot, 'src'));
copyTree(publicRoot, outputRoot);

const outputMain = path.join(outputRoot, 'src/main.js');
let main = fs.readFileSync(outputMain, 'utf8');
const cssImport = /^import\s+['"]\.\/styles\.css['"];?\s*$/m;
if (!cssImport.test(main)) fail('Expected CSS import was not found in src/main.js');
main = main.replace(cssImport, '');
fs.writeFileSync(outputMain, main, 'utf8');

let index = fs.readFileSync(indexSource, 'utf8');
if (!index.includes('v1.5')) fail('index.html does not identify Neon Bay v1.5');
if (!index.includes('src="/src/main.js"')) fail('Unexpected module entry in index.html');
const browserImports = `    <link rel="stylesheet" href="./src/styles.css" />\n    <script type="importmap">\n      {\n        "imports": {\n          "three": "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js",\n          "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/"\n        }\n      }\n    </script>\n`;
index = index.replace('</head>', `${browserImports}  </head>`);
index = index.replace('src="/src/main.js"', 'src="./src/main.js"');
fs.writeFileSync(path.join(outputRoot, 'index.html'), index, 'utf8');

const jsFiles = walkFiles(path.join(outputRoot, 'src'))
  .filter((relative) => relative.endsWith('.js'));
for (const relative of jsFiles) {
  const file = path.join(outputRoot, 'src', relative);
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) fail(`JavaScript syntax failed for src/${relative}: ${check.stderr || check.stdout}`);
}

const importPattern = /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g;
for (const relative of jsFiles) {
  const file = path.join(outputRoot, 'src', relative);
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1];
    if (specifier === 'three' || specifier.startsWith('three/addons/')) continue;
    if (!specifier.startsWith('.')) fail(`Unmapped browser import in src/${relative}: ${specifier}`);
    const resolved = path.resolve(path.dirname(file), specifier);
    assertInside(path.join(outputRoot, 'src'), resolved);
    if (!fs.existsSync(resolved)) fail(`Missing relative import from src/${relative}: ${specifier}`);
  }
}

for (const required of ['index.html', 'favicon.svg', 'trailer.html', 'src/main.js', 'src/styles.css']) {
  if (!fs.existsSync(path.join(outputRoot, required))) fail(`Missing output: ${required}`);
}
const outputIndex = fs.readFileSync(path.join(outputRoot, 'index.html'), 'utf8');
for (const requiredText of ['type="importmap"', 'three@0.179.1', 'href="./src/styles.css"', 'src="./src/main.js"']) {
  if (!outputIndex.includes(requiredText)) fail(`index.html missing deployment marker: ${requiredText}`);
}

const outputs = walkFiles(outputRoot).map((value) => value.split(path.sep).join('/')).sort();
fs.writeFileSync(path.join(outputRoot, 'release.json'), `${JSON.stringify({
  name: 'Neon Bay',
  version: '1.5.0',
  deployment: 'verified-browser-modules',
  files: outputs.length + 1,
}, null, 2)}\n`);

console.log(`Prepared Neon Bay v1.5 browser-module deployment: ${jsFiles.length} JavaScript modules and ${outputs.length + 1} total files.`);
