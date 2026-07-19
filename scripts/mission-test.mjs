import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import * as RealTHREE from 'three';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'https://neon-bay.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;

const gradient = { addColorStop() {} };
const ctx2d = {
  clearRect() {}, fillRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, closePath() {},
  createRadialGradient() { return gradient; },
  set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}
};
window.HTMLCanvasElement.prototype.getContext = function(type) { return type === '2d' ? ctx2d : {}; };
window.HTMLCanvasElement.prototype.requestPointerLock = function() { window.document.pointerLockElement = this; window.document.dispatchEvent(new window.Event('pointerlockchange')); };
window.document.exitPointerLock = function() { window.document.pointerLockElement = null; window.document.dispatchEvent(new window.Event('pointerlockchange')); };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.requestAnimationFrame = () => 1;
window.cancelAnimationFrame = () => {};

class MockRenderer {
  constructor({ canvas }) { this.domElement = canvas; this.shadowMap = {}; }
  setPixelRatio() {}
  setSize() {}
  render() {}
  set outputColorSpace(v) { this._outputColorSpace = v; }
  set toneMapping(v) { this._toneMapping = v; }
  set toneMappingExposure(v) { this._toneMappingExposure = v; }
}
const THREE = { ...RealTHREE, WebGLRenderer: MockRenderer };

globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
globalThis.matchMedia = window.matchMedia;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
globalThis.addEventListener = window.addEventListener.bind(window);
globalThis.removeEventListener = window.removeEventListener.bind(window);
globalThis.innerWidth = 1440;
globalThis.innerHeight = 900;
globalThis.devicePixelRatio = 1;
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.KeyboardEvent = window.KeyboardEvent;
globalThis.MouseEvent = window.MouseEvent;
globalThis.Event = window.Event;
globalThis.THREE = THREE;


let code = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
code = code.replace("import * as THREE from 'three';", 'const THREE = globalThis.THREE;');
code = code.replace("import './styles.css';", '');
code += `\nglobalThis.__NB = { state, get player(){ return player; }, getVehicle, enterVehicle, startMission, updateMission, collidesAt };`;
vm.runInThisContext(code, { filename: 'main.js' });

await new Promise(resolve => setTimeout(resolve, 700));

const nb = globalThis.__NB;
const checkpoints = [
  ['apartment', -118, -136], ['garage', 108, -90], ['beach', 132, -132], ['pier', 193, 125],
  ['harbor', 112, 96], ['safehouse', -141, 112], ['warehouse yard', 96, 114], ['ledger', 112, 104], ['hotel arena', 0, 120]
];
for (const [name, x, z] of checkpoints) {
  if (nb.collidesAt(x, z, .55)) throw new Error(`Mission checkpoint blocked by collision: ${name}`);
}

document.querySelector('#new-game-btn').click();
await new Promise(resolve => setTimeout(resolve, 20));

// Job 1
nb.player.position.set(-118, 0, -136); nb.updateMission(.016);
if (nb.state.missionStep !== 1) throw new Error('Job 1 contact step failed');
nb.enterVehicle(nb.getVehicle('sunset')); nb.updateMission(.016);
if (nb.state.missionStep !== 2) throw new Error('Job 1 enter-car step failed');
nb.getVehicle('sunset').mesh.position.set(108, 0, -90); nb.updateMission(.016);
if (nb.state.running !== false) throw new Error('Job 1 did not complete');

// Job 2
nb.startMission(1, true); nb.state.running = true;
nb.player.position.set(132, 0, -132); nb.updateMission(.016);
if (nb.state.missionStep !== 1 || nb.state.missionTargetKills !== 3) throw new Error('Job 2 ambush failed');
nb.state.missionKills = nb.state.missionTargetKills; nb.updateMission(.016);
if (nb.state.missionStep !== 2) throw new Error('Job 2 combat completion failed');
nb.state.wanted = 0; nb.player.position.set(193, 0, 125); nb.updateMission(.016);
if (nb.state.running !== false) throw new Error('Job 2 did not complete');

// Job 3
nb.startMission(2, true); nb.state.running = true;
nb.player.position.set(112, 0, 96); nb.updateMission(.016);
if (nb.state.missionStep !== 1) throw new Error('Job 3 package step failed');
nb.enterVehicle(nb.getVehicle('ocean')); nb.updateMission(.016);
if (nb.state.missionStep !== 2 || nb.state.missionTimer !== 90) throw new Error('Job 3 vehicle/timer step failed');
nb.getVehicle('ocean').mesh.position.set(-141, 0, 112); nb.updateMission(.016);
if (nb.state.running !== false) throw new Error('Job 3 did not complete');

// Job 4
nb.startMission(3, true); nb.state.running = true;
nb.player.position.set(96, 0, 114); nb.updateMission(.016);
if (nb.state.missionStep !== 1 || nb.state.missionTargetKills !== 6) throw new Error('Job 4 combat setup failed');
nb.state.missionKills = nb.state.missionTargetKills; nb.updateMission(.016);
if (nb.state.missionStep !== 2) throw new Error('Job 4 combat completion failed');
nb.player.position.set(112, 0, 104); nb.updateMission(.016);
if (nb.state.missionStep !== 3) throw new Error('Job 4 ledger step failed');
nb.player.position.set(-141, 0, 112); nb.updateMission(.016);
if (nb.state.running !== false) throw new Error('Job 4 did not complete');

// Job 5
nb.startMission(4, true); nb.state.running = true;
nb.player.position.set(0, 0, 120); nb.updateMission(.016);
if (nb.state.missionStep !== 1 || nb.state.missionTargetKills !== 5) throw new Error('Job 5 boss setup failed');
nb.state.missionKills = nb.state.missionTargetKills; nb.updateMission(.016);
if (nb.state.missionStep !== 2) throw new Error('Job 5 boss completion failed');
nb.state.wanted = 0; nb.player.position.set(200, 0, 125); nb.updateMission(.016);
if (!nb.state.chapterComplete) throw new Error('Chapter completion flag was not set');

console.log(JSON.stringify({
  collisionCheckpoints: checkpoints.length,
  job1: 'passed', job2: 'passed', job3: 'passed', job4: 'passed', job5: 'passed',
  chapterComplete: nb.state.chapterComplete
}, null, 2));
