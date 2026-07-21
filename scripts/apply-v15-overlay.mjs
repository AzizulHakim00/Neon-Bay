import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const overlay = path.join(root, 'overlay-v15');

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`Neon Bay v1.5 patch anchor missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
}

function replaceAllRequired(source, before, after, minimum, label) {
  const count = source.split(before).length - 1;
  if (count < minimum) throw new Error(`Neon Bay v1.5 patch anchor count mismatch: ${label} (${count})`);
  return source.split(before).join(after);
}

const moduleSource = path.join(overlay, 'graphics-overhaul.js');
const moduleTarget = path.join(root, 'src/modules/graphics-overhaul.js');
fs.mkdirSync(path.dirname(moduleTarget), { recursive: true });
fs.copyFileSync(moduleSource, moduleTarget);

const mainPath = path.join(root, 'src/main.js');
let main = fs.readFileSync(mainPath, 'utf8');
main = replaceOnce(main,
  "import { RADIO_STATIONS, DISTRICTS, districtAt, BUSINESS_DEFINITIONS, BusinessEmpire, CHAPTER_TWO_MISSIONS } from './modules/vice-coast.js';",
  "import { RADIO_STATIONS, DISTRICTS, districtAt, BUSINESS_DEFINITIONS, BusinessEmpire, CHAPTER_TWO_MISSIONS } from './modules/vice-coast.js';\nimport { GraphicsOverhaul } from './modules/graphics-overhaul.js';",
  'graphics module import');
main = replaceOnce(main,
  'let composer=null, bloomPass=null, oceanSurface=null, skyDome=null, sunDisc=null;',
  'let composer=null, bloomPass=null, oceanSurface=null, skyDome=null, sunDisc=null, visualOverhaul=null;',
  'graphics system state');
main = replaceOnce(main,
  "bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'high' ? .72 : .4, .68, .7);",
  "bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'ultra' ? .92 : state.quality === 'high' ? .72 : .4, .68, .7);",
  'ultra bloom');
main = replaceOnce(main,
  '  scene.add(sun);\n\n  const ground',
  '  scene.add(sun);\n\n  visualOverhaul = new GraphicsOverhaul({ scene, camera, renderer, quality: state.quality, random, testMode: !!globalThis.__NEON_BAY_TEST__ }).build();\n\n  const ground',
  'graphics system creation');
main = replaceOnce(main,
  '    attachVehicleDamage(this);\n    scene.add(this.mesh);',
  '    attachVehicleDamage(this);\n    visualOverhaul?.registerVehicle(this);\n    scene.add(this.mesh);',
  'vehicle material registration');
main = replaceOnce(main,
  '  const roadMat = material(0x232733, .96); roadMat.metalness=.08; roadMaterials.push(roadMat);',
  '  const roadMat = material(0x232733, .96); roadMat.metalness=.08; roadMaterials.push(roadMat); visualOverhaul?.registerRoadMaterial(roadMat);',
  'road material registration');
main = replaceOnce(main,
  "      if (impact > 8) { applyVehicleImpact(this,impact,'front'); damagePlayer(impact * .1); audio.hit(); }",
  "      if (impact > 8) { applyVehicleImpact(this,impact,'front'); visualOverhaul?.emitImpact(this.mesh.position.clone(), impact); damagePlayer(impact * .1); audio.hit(); }",
  'impact sparks');
main = replaceOnce(main,
  "  state.ammo--;progression.record('shotsFired');audio.shot();if(state.weapon==='shotgun')",
  "  state.ammo--;progression.record('shotsFired');audio.shot();raycaster.setFromCamera(new THREE.Vector2(0,0),camera);visualOverhaul?.emitShot(camera.position.clone(),raycaster.ray.direction.clone(),state.weapon);if(state.weapon==='shotgun')",
  'weapon visual feedback');
main = replaceOnce(main,
  '  updateDistrictDiscovery(dt);\n  updateBusinessEmpire(dt);\n}',
  '  updateDistrictDiscovery(dt);\n  updateBusinessEmpire(dt);\n  visualOverhaul?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted});\n}',
  'graphics update loop');
main = replaceOnce(main,
  "  const ratio=value==='high'?Math.min(devicePixelRatio,2):value==='medium'?Math.min(devicePixelRatio,1.35):1;",
  "  const ratio=value==='ultra'?Math.min(devicePixelRatio,2.25):value==='high'?Math.min(devicePixelRatio,2):value==='medium'?Math.min(devicePixelRatio,1.35):1;",
  'ultra pixel ratio');
main = replaceOnce(main,
  "  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high';renderer.shadowMap.type=THREE.PCFSoftShadowMap;",
  "  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;",
  'ultra shadows');
main = replaceOnce(main,
  "renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='high'?.72:value==='medium'?.4:0;",
  "renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='ultra'?.92:value==='high'?.72:value==='medium'?.4:0;visualOverhaul?.setQuality(value);",
  'quality system update');
main = replaceAllRequired(main,
  "o.castShadow = state.quality === 'high';",
  "o.castShadow = state.quality === 'high' || state.quality === 'ultra';",
  2,
  'ultra mesh shadows');
main = replaceOnce(main,
  "  sun.castShadow = state.quality === 'high';",
  "  sun.castShadow = state.quality === 'high' || state.quality === 'ultra';",
  'ultra sun shadows');
fs.writeFileSync(mainPath, main, 'utf8');

const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8').replaceAll('v1.4', 'v1.5');
index = index.replace('VICE COAST · v1.5', 'GRAPHICS OVERHAUL · v1.5');
index = replaceOnce(index,
  '<select id="quality-select"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>',
  '<select id="quality-select"><option value="ultra">Ultra</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>',
  'ultra quality menu');
fs.writeFileSync(indexPath, index, 'utf8');

const trailerPath = path.join(root, 'public/trailer.html');
let trailer = fs.readFileSync(trailerPath, 'utf8').replaceAll('v1.4', 'v1.5').replaceAll('VICE COAST', 'GRAPHICS OVERHAUL');
fs.writeFileSync(trailerPath, trailer, 'utf8');

const stylesPath = path.join(root, 'src/styles.css');
const css = fs.readFileSync(path.join(overlay, 'graphics-v15.css'), 'utf8');
let styles = fs.readFileSync(stylesPath, 'utf8');
if (!styles.includes('v1.5 cinematic graphics finish')) styles += `\n${css}\n`;
fs.writeFileSync(stylesPath, styles, 'utf8');

console.log('Applied Neon Bay 1.5.0 graphics and world overhaul');
