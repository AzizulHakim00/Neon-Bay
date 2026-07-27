import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const graphics = fs.readFileSync(path.join(root, 'src/modules/graphics-overhaul.js'), 'utf8');
const city = fs.readFileSync(path.join(root, 'src/modules/cinematic-city-v16.js'), 'utf8');

const checks = [
  ['medium default quality', main.includes("quality: localStorage.getItem('neon-bay-quality') || 'medium'")],
  ['medium startup fallback', main.includes("state.quality=localStorage.getItem('neon-bay-quality')||'medium'")],
  ['medium skips post processing', main.includes("state.quality === 'low' || state.quality === 'medium'")],
  ['frame-rate gate', main.includes("const targetFps = activelyPlaying")],
  ['hidden-tab suspension', main.includes("document.hidden")],
  ['slow world tick', main.includes("worldSlowAccumulator >= .05")],
  ['throttled minimap', main.includes("const redrawMinimap = minimapGate >= .1")],
  ['throttled HUD', main.includes("const refreshHud = hudGate >= .08")],
  ['adaptive quality fallback', main.includes("Graphics adjusted for smoother performance.")],
  ['composer limited to high/ultra', main.includes("const useComposer = composer && (state.quality === 'high' || state.quality === 'ultra')")],
  ['reduced graphics profile', graphics.includes("high: Object.freeze({ particles: 220")],
  ['reduced city profile', city.includes("high: Object.freeze({ shadow: 1024")],
];

for (const [name, passed] of checks) {
  if (!passed) throw new Error(`Performance hotfix check failed: ${name}`);
}

const forbidden = [
  ["legacy high DPR", "value==='high'?Math.min(devicePixelRatio,2)"],
  ['legacy 900 rain particles', "state.quality === 'low' ? 350 : 900"],
  ['legacy 2048 initial shadow', 'sun.shadow.mapSize.set(2048, 2048)'],
];
for (const [name, token] of forbidden) {
  if (main.includes(token)) throw new Error(`Performance regression found: ${name}`);
}

console.log(JSON.stringify({
  release: 'Neon Bay v1.8 performance hotfix',
  checks: checks.length,
  forbiddenRegressions: forbidden.length,
  status: 'passed',
}, null, 2));
