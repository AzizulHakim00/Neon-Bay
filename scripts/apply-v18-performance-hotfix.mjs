import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const mainPath = resolve(root, 'src/main.js');
const graphicsPath = resolve(root, 'src/modules/graphics-overhaul.js');
const cityPath = resolve(root, 'src/modules/cinematic-city-v16.js');

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(before, after);
}

let main = await readFile(mainPath, 'utf8');
main = replaceOnce(main,
  "  quality: localStorage.getItem('neon-bay-quality') || 'high',",
  "  quality: localStorage.getItem('neon-bay-quality') || 'medium',",
  'default quality');
main = replaceOnce(main,
  "    state.quality=localStorage.getItem('neon-bay-quality')||'high';state.voiceEnabled=localStorage.getItem('neon-bay-voice')!=='false';",
  "    state.quality=localStorage.getItem('neon-bay-quality')||'medium';state.voiceEnabled=localStorage.getItem('neon-bay-voice')!=='false';",
  'startup quality');
main = replaceOnce(main,
  "let worldTime = 0;",
  "let worldTime = 0;\nlet worldSlowAccumulator = 0;\nlet frameGate = 0;\nlet minimapGate = 0;\nlet hudGate = 0;\nlet slowFrameBudget = 0;",
  'performance accumulators');
main = replaceOnce(main,
  "  if (globalThis.__NEON_BAY_TEST__ || state.quality === 'low') return;",
  "  if (globalThis.__NEON_BAY_TEST__ || state.quality === 'low' || state.quality === 'medium') return;",
  'postfx quality gate');
main = replaceOnce(main,
  "    composer = new EffectComposer(renderer);\n    composer.addPass(new RenderPass(scene, camera));\n    if (state.quality === 'high' || state.quality === 'ultra') {",
  "    composer = new EffectComposer(renderer);\n    composer.setPixelRatio?.(state.quality === 'ultra' ? 1.25 : 1);\n    composer.addPass(new RenderPass(scene, camera));\n    if (state.quality === 'ultra') {",
  'postfx setup');
main = replaceOnce(main,
  "      ssaoPass.kernelRadius = state.quality === 'ultra' ? 13 : 9;",
  "      ssaoPass.kernelRadius = 8;",
  'ssao radius');
main = replaceOnce(main,
  "    bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'ultra' ? .82 : state.quality === 'high' ? .64 : .34, .62, .78);",
  "    bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'ultra' ? .58 : .38, .5, .82);",
  'bloom profile');
main = replaceOnce(main,
  "  renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: state.quality !== 'low', powerPreference: 'high-performance' });",
  "  renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: false, powerPreference: 'high-performance' });",
  'renderer antialias');
main = replaceOnce(main,
  "  sun.shadow.mapSize.set(2048, 2048);",
  "  sun.shadow.mapSize.set(1024, 1024);",
  'initial shadow map');
main = replaceOnce(main,
  "  const count = state.quality === 'low' ? 350 : 900;",
  "  const count = state.quality === 'low' ? 180 : state.quality === 'medium' ? 350 : state.quality === 'high' ? 600 : 800;",
  'rain count');
main = replaceOnce(main,
  "  updateLighting(dt);\n  updateTrafficSignals();",
  "  worldSlowAccumulator += dt;\n  const runSlowTick = worldSlowAccumulator >= .05;\n  const slowDt = runSlowTick ? worldSlowAccumulator : 0;\n  if (runSlowTick) {\n    worldSlowAccumulator = 0;\n    updateLighting(slowDt);\n    updateTrafficSignals();\n  }",
  'slow world tick start');
main = replaceOnce(main,
  "  updateDistrictDiscovery(dt);\n  updateBusinessEmpire(dt);\n  updateV17Systems(dt);\n  updateV18Systems(dt);\n  visualOverhaul?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted});\n  cinematicCity?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted,mission:state.currentMission,cinematic:state.cinematic,health:state.health});",
  "  if (runSlowTick) {\n    const playerPosition = getPlayerPosition();\n    updateDistrictDiscovery(slowDt);\n    updateBusinessEmpire(slowDt);\n    updateV17Systems(slowDt);\n    updateV18Systems(slowDt);\n    visualOverhaul?.update(slowDt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition,activeVehicle:state.activeVehicle,wanted:state.wanted});\n    cinematicCity?.update(slowDt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition,activeVehicle:state.activeVehicle,wanted:state.wanted,mission:state.currentMission,cinematic:state.cinematic,health:state.health});\n  }",
  'slow world tick systems');
main = replaceOnce(main,
  "  const ratio=value==='ultra'?Math.min(devicePixelRatio,2.25):value==='high'?Math.min(devicePixelRatio,2):value==='medium'?Math.min(devicePixelRatio,1.35):1;\n  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n  renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='ultra'?.82:value==='high'?.64:value==='medium'?.34:0;visualOverhaul?.setQuality(value);cinematicCity?.setQuality(value);cinematicCity?.resize(innerWidth,innerHeight);",
  "  const ratio=value==='ultra'?Math.min(devicePixelRatio,1.5):value==='high'?Math.min(devicePixelRatio,1.25):value==='medium'?Math.min(devicePixelRatio,1):Math.min(devicePixelRatio,.8);\n  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n  const shadowSize=value==='ultra'?1536:value==='high'?1024:512;if(sun?.shadow)sun.shadow.mapSize.set(shadowSize,shadowSize);\n  renderer.setSize(innerWidth,innerHeight,false);composer?.setPixelRatio?.(value==='ultra'?1.25:1);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='ultra'?.58:value==='high'?.38:0;visualOverhaul?.setQuality(value);cinematicCity?.setQuality(value);cinematicCity?.resize(innerWidth,innerHeight);",
  'quality scaling');

const animateStart = main.indexOf('function animate() {');
const animateEnd = main.indexOf('\nfunction startDemoMode()', animateStart);
if (animateStart < 0 || animateEnd < 0) throw new Error('animate block not found');
const animateBlock = `function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  if (!renderer || !scene || document.hidden) return;
  const activelyPlaying = state.running && !state.paused && !state.gameOver && !state.cinematic;
  const targetFps = activelyPlaying ? (state.quality === 'low' ? 45 : 60) : 24;
  if (now - frameGate < 1000 / targetFps) return;
  frameGate = now;

  const dt = Math.min(clock.getDelta(), .05);
  minimapGate += dt;
  hudGate += dt;
  const redrawMinimap = minimapGate >= .1;
  const refreshHud = hudGate >= .08;
  if (redrawMinimap) minimapGate = 0;
  if (refreshHud) hudGate = 0;

  if (activelyPlaying && dt > .034) slowFrameBudget += dt;
  else slowFrameBudget = Math.max(0, slowFrameBudget - dt * .75);
  if (slowFrameBudget > 3 && (state.quality === 'ultra' || state.quality === 'high')) {
    applyQuality(state.quality === 'ultra' ? 'high' : 'medium');
    notify('Graphics adjusted for smoother performance.', 2.4);
    slowFrameBudget = 0;
  }

  if(state.demoMode&&demoDirector){
    demoDirector.update(dt,{camera,player,playerActor,vehicles,enemies,state,enterDemoInterior,exitDemoInterior});
    vehicles.forEach(v=>v.update(dt));pedestrians.forEach(p=>p.actor?.update(dt,'Walk'));updateWorld(dt);if(redrawMinimap)drawMinimap();
  } else if(state.cinematic){
    updateCinematic(dt);updateWorld(dt);updateNotification(dt);if(redrawMinimap)drawMinimap();
  } else if(activelyPlaying){
    dialogue?.update(dt);updatePlayer(dt);updateAI(dt);updateCamera(dt);updateMission(dt);updateSideActivity(dt);updateWanted(dt);updateWorld(dt);updateInteractions();updateNotification(dt);if(refreshHud)updateHUD();if(redrawMinimap)drawMinimap();
    if(input.fire)shoot();saveTimer+=dt;if(saveTimer>30){saveTimer=0;saveGame(true);}
  } else if(scene){dialogue?.update(dt);updateCamera(dt);updateWorld(dt*.18);updateNotification(dt);if(redrawMinimap)drawMinimap();}
  const useComposer = composer && (state.quality === 'high' || state.quality === 'ultra');
  if(useComposer)composer.render();else renderer.render(scene,camera);
}
`;
main = main.slice(0, animateStart) + animateBlock + main.slice(animateEnd);
await writeFile(mainPath, main);

let graphics = await readFile(graphicsPath, 'utf8');
graphics = replaceOnce(graphics,
`export const GRAPHICS_QUALITY = Object.freeze({
  low: Object.freeze({ particles: 0, puddles: 0, props: 18, lightPools: 0, headlights: false, effects: 18, pixelRatio: 1 }),
  medium: Object.freeze({ particles: 180, puddles: 14, props: 34, lightPools: 18, headlights: true, effects: 28, pixelRatio: 1.35 }),
  high: Object.freeze({ particles: 420, puddles: 28, props: 56, lightPools: 32, headlights: true, effects: 44, pixelRatio: 2 }),
  ultra: Object.freeze({ particles: 720, puddles: 42, props: 82, lightPools: 48, headlights: true, effects: 64, pixelRatio: 2.25 }),
});`,
`export const GRAPHICS_QUALITY = Object.freeze({
  low: Object.freeze({ particles: 0, puddles: 0, props: 12, lightPools: 0, headlights: false, effects: 12, pixelRatio: .8 }),
  medium: Object.freeze({ particles: 90, puddles: 8, props: 24, lightPools: 10, headlights: true, effects: 20, pixelRatio: 1 }),
  high: Object.freeze({ particles: 220, puddles: 16, props: 38, lightPools: 20, headlights: true, effects: 30, pixelRatio: 1.25 }),
  ultra: Object.freeze({ particles: 420, puddles: 26, props: 54, lightPools: 30, headlights: true, effects: 42, pixelRatio: 1.5 }),
});`,
'graphics profiles');
await writeFile(graphicsPath, graphics);

let city = await readFile(cityPath, 'utf8');
city = replaceOnce(city,
`export const CITY_QUALITY = Object.freeze({
  low: Object.freeze({ shadow: 768, shadowDistance: 45, windows: 90, decals: 42, clouds: 3, ripples: 0, vehicleFx: false, ao: false, post: .2 }),
  medium: Object.freeze({ shadow: 1024, shadowDistance: 70, windows: 170, decals: 78, clouds: 5, ripples: 18, vehicleFx: true, ao: false, post: .55 }),
  high: Object.freeze({ shadow: 2048, shadowDistance: 105, windows: 280, decals: 122, clouds: 8, ripples: 38, vehicleFx: true, ao: true, post: .82 }),
  ultra: Object.freeze({ shadow: 3072, shadowDistance: 145, windows: 420, decals: 170, clouds: 11, ripples: 62, vehicleFx: true, ao: true, post: 1 }),
});`,
`export const CITY_QUALITY = Object.freeze({
  low: Object.freeze({ shadow: 512, shadowDistance: 38, windows: 70, decals: 32, clouds: 2, ripples: 0, vehicleFx: false, ao: false, post: 0 }),
  medium: Object.freeze({ shadow: 768, shadowDistance: 55, windows: 110, decals: 55, clouds: 3, ripples: 8, vehicleFx: true, ao: false, post: .35 }),
  high: Object.freeze({ shadow: 1024, shadowDistance: 80, windows: 180, decals: 82, clouds: 5, ripples: 18, vehicleFx: true, ao: false, post: .62 }),
  ultra: Object.freeze({ shadow: 1536, shadowDistance: 105, windows: 260, decals: 110, clouds: 7, ripples: 30, vehicleFx: true, ao: true, post: .82 }),
});`,
'city profiles');
await writeFile(cityPath, city);

console.log('Applied Neon Bay v1.8 performance hotfix');
