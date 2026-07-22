import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.argv[2] || 'vercel-static');
const required = [
  'index.html','src/styles.css','src/main.js','src/v16-engine-patch.js',
  'src/modules/actor-system.js','src/modules/cinematic-city-v16.js','src/modules/demo-director.js','src/modules/dialogue-system.js',
  'src/modules/graphics-overhaul.js','src/modules/interior-system.js','src/modules/living-city.js','src/modules/vehicle-damage.js','src/modules/vice-coast.js',
  'src/assets/neon-citizen-data.js'
];
for (const file of required) if (!fs.existsSync(path.join(root,file))) throw new Error(`Missing ${file}`);
const loader = fs.readFileSync(path.join(root,'src/main.js'),'utf8');
const match = loader.match(/const parts = (\[[^;]+\]);/);
if (!match) throw new Error('Main loader part list missing');
const parts = Function(`return ${match[1]}`)();
let source = parts.map(name => {
  const file=path.join(root,'src/main-parts',name);
  if (!fs.existsSync(file)) throw new Error(`Missing engine part ${name}`);
  return fs.readFileSync(file,'utf8');
}).join('');
const { V16_ENGINE_PATCHES } = await import(pathToFileURL(path.join(root,'src/v16-engine-patch.js')).href);
for (const [index, patch] of V16_ENGINE_PATCHES.entries()) {
  const occurrences = source.split(patch.before).length - 1;
  if (occurrences !== 1) throw new Error(`Patch ${index + 1} expected one source match, found ${occurrences}`);
  source = source.replace(patch.before, patch.after);
}
new vm.SourceTextModule(source);
for (const file of required.filter(file => file.endsWith('.js'))) new vm.SourceTextModule(fs.readFileSync(path.join(root,file),'utf8'));
for (const marker of ["saveKey: 'neon-bay-save-v4'","CinematicCityOverhaul","CHAPTER_TWO_MISSIONS","beginMission(state.currentMission","SSAOPass","FXAAShader"]) {
  if (!source.includes(marker)) throw new Error(`Engine marker missing: ${marker}`);
}
const cinematic=fs.readFileSync(path.join(root,'src/modules/cinematic-city-v16.js'),'utf8');
for (const marker of ['buildRoadDetails','registerBuilding','registerVehicle','buildClouds','buildRainRipples','CINEMATIC_POST_SHADER']) {
  if (!cinematic.includes(marker)) throw new Error(`Cinematic feature missing: ${marker}`);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if (!html.includes('three@0.179.1') || !html.includes('./src/main.js') || !html.includes('v1.6')) throw new Error('Index deployment references are incomplete');
console.log(JSON.stringify({release:'Neon Bay v1.6',baseEngineParts:parts.length,patches:V16_ENGINE_PATCHES.length,syntax:'ok',markers:'ok'},null,2));
