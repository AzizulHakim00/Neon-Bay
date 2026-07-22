import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.argv[2] || 'vercel-static');
const fail = message => { throw new Error(`[v1.6 static verification] ${message}`); };
const files = [];
const walk = (dir, rel = '') => {
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const next = path.join(rel, entry.name);
    if (entry.isDirectory()) walk(dir, next); else files.push(next.split(path.sep).join('/'));
  }
};
if (!fs.existsSync(root)) fail(`missing directory ${root}`);
walk(root); files.sort();
const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
if (release.version !== '1.6.0') fail(`release version is ${release.version}`);
if (release.files !== files.length) fail(`release.json says ${release.files} files, found ${files.length}`);

const required = [
  'index.html','src/styles.css','src/main.js','src/v16-engine-patch.js',
  'src/modules/actor-system.js','src/modules/cinematic-city-v16.js','src/modules/demo-director.js','src/modules/dialogue-system.js',
  'src/modules/graphics-overhaul.js','src/modules/interior-system.js','src/modules/living-city.js','src/modules/vehicle-damage.js','src/modules/vice-coast.js',
  'src/assets/neon-citizen-data.js'
];
for (const file of required) if (!files.includes(file)) fail(`missing ${file}`);
const loader = fs.readFileSync(path.join(root,'src/main.js'),'utf8');
const match = loader.match(/const parts = (\[[^;]+\]);/);
if (!match) fail('main loader part list missing');
const parts = Function(`return ${match[1]}`)();
if (parts.length !== 22) fail(`expected 22 base engine parts, found ${parts.length}`);
let source = parts.map(name => {
  const file=path.join(root,'src/main-parts',name);
  if (!fs.existsSync(file)) fail(`missing engine part ${name}`);
  return fs.readFileSync(file,'utf8');
}).join('');
if (!source.startsWith("import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';")) fail('base engine does not use pinned Three.js import');
source = source
  .replace(/from '\/src\/modules\//g, "from './modules/")
  .replace(/from \"\/src\/modules\//g, 'from \"./modules/')
  .replace(/from '\/src\/assets\//g, "from './assets/")
  .replace(/from \"\/src\/assets\//g, 'from \"./assets/');
const { V16_ENGINE_PATCHES } = await import(pathToFileURL(path.join(root,'src/v16-engine-patch.js')).href);
for (const [index, patch] of V16_ENGINE_PATCHES.entries()) {
  const occurrences = source.split(patch.before).length - 1;
  if (occurrences !== 1) fail(`patch ${index + 1} expected one normalized source match, found ${occurrences}`);
  source = source.replace(patch.before, patch.after);
}
new vm.SourceTextModule(source);
for (const file of required.filter(file => file.endsWith('.js'))) new vm.SourceTextModule(fs.readFileSync(path.join(root,file),'utf8'));
for (const marker of ["saveKey: 'neon-bay-save-v4'","CinematicCityOverhaul","CHAPTER_TWO_MISSIONS","beginMission(state.currentMission","SSAOPass","FXAAShader","init();"]) {
  if (!source.includes(marker)) fail(`engine marker missing: ${marker}`);
}
if (!source.trimEnd().endsWith('init();')) fail('engine is truncated at the end');
const cinematic=fs.readFileSync(path.join(root,'src/modules/cinematic-city-v16.js'),'utf8');
for (const marker of ['buildRoadDetails','registerBuilding','registerVehicle','buildClouds','buildRainRipples','CINEMATIC_POST_SHADER']) {
  if (!cinematic.includes(marker)) fail(`cinematic feature missing: ${marker}`);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const marker of ['Neon Bay','v1.6','type="importmap"','three@0.179.1','href="./src/styles.css"','src="./src/main.js"']) {
  if (!html.includes(marker)) fail(`index.html missing ${marker}`);
}
if (!loader.includes('location.origin')) fail('main loader does not origin-qualify module imports');
console.log(JSON.stringify({release:'Neon Bay v1.6',files:files.length,baseEngineParts:parts.length,patches:V16_ENGINE_PATCHES.length,syntax:'ok',markers:'ok'},null,2));
