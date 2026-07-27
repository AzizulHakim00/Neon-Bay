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
  ['frame-rate gate', main.includes('const targetFps = activelyPlaying')],
  ['hidden-tab suspension', main.includes('document.hidden')],
  ['slow world tick', main.includes('worldSlowAccumulator >= .05')],
  ['throttled minimap', main.includes('const redrawMinimap = minimapGate >= .12') || main.includes('const redrawMinimap = minimapGate >= .1')],
  ['throttled HUD', main.includes('const refreshHud = hudGate >= .1') || main.includes('const refreshHud = hudGate >= .08')],
  ['adaptive quality fallback', main.includes('Graphics reduced to keep gameplay responsive.') || main.includes('Graphics adjusted for smoother performance.')],
  ['composer limited to high or ultra', main.includes('const useComposer = composer &&')],
  ['reduced graphics profile', graphics.includes('high: Object.freeze({ particles: 220')],
  ['reduced city profile', city.includes('high: Object.freeze({ shadow: 1024')],
];

for (const [name, passed] of checks) {
  if (!passed) throw new Error(`Performance hotfix check failed: ${name}`);
}

console.log(JSON.stringify({
  release: 'Neon Bay v1.8.2 performance hotfix',
  checks: checks.length,
  status: 'passed',
}, null, 2));
