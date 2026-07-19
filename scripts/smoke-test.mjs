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
globalThis.location = window.location;
globalThis.THREE = THREE;
const contentModule = await import('../src/modules/content.js');
const playerModule = await import('../src/modules/player-model.js');
const vehicleModule = await import('../src/modules/vehicle-model.js');
const cinematicModule = await import('../src/modules/cinematic.js');
const combatModule = await import('../src/modules/combat-ai.js');
globalThis.NBModules = { ...contentModule, ...playerModule, ...vehicleModule, ...cinematicModule, ...combatModule };

let code = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
code = code.replace(/^import .*;\n/gm, '');
code = `const THREE = globalThis.THREE;\nconst { WEAPONS, VEHICLE_SPECS, FIRST_RIDE_INTRO, FIRST_RIDE_CONTACT, createPlayerModel, setPlayerWeapon, triggerPlayerRecoil, updatePlayerAnimation, createVehicleModel, updateVehicleVisual, CinematicDirector, buildCoverPoints, chooseCoverPoint, moveToward2D } = globalThis.NBModules;\n${code}`;
vm.runInThisContext(code, { filename: 'main.js' });

await new Promise(resolve => setTimeout(resolve, 700));
const menu = document.querySelector('#main-menu');
if (!menu.classList.contains('active')) throw new Error('Main menu did not become active');
document.querySelector('#new-game-btn').click();
await new Promise(resolve => setTimeout(resolve, 50));
if (document.querySelector('#hud').classList.contains('hidden')) throw new Error('HUD did not become visible');
if (document.querySelector('#mission-title').textContent !== 'First Ride') throw new Error('First mission did not initialize');
if (!localStorage.getItem('neon-bay-save-v1')) throw new Error('New game did not create a save');
window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Escape' }));
await new Promise(resolve => setTimeout(resolve, 20));
if (!document.querySelector('#pause-menu').classList.contains('active')) throw new Error('Pause menu did not open');
document.querySelector('#resume-btn').click();
await new Promise(resolve => setTimeout(resolve, 20));
if (document.querySelector('#pause-menu').classList.contains('active')) throw new Error('Pause menu did not close');
console.log(JSON.stringify({ menu: 'ok', newGame: 'ok', mission: document.querySelector('#mission-title').textContent, objective: document.querySelector('#mission-objective').textContent, save: 'ok', pauseResume: 'ok' }, null, 2));
