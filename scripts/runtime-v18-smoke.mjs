import { chromium } from 'playwright';
import fs from 'node:fs';

const failures = [];
const consoleLines = [];
const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
    '--no-sandbox'
  ]
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(() => {
  HTMLCanvasElement.prototype.requestPointerLock = () => Promise.resolve();
  document.exitPointerLock = () => {};
});
page.on('console', msg => {
  const line = `[console:${msg.type()}] ${msg.text()}`;
  consoleLines.push(line);
  console.log(line);
  if (msg.type() === 'error') failures.push(line);
});
page.on('pageerror', error => {
  const line = `[pageerror] ${error.stack || error.message}`;
  consoleLines.push(line);
  failures.push(line);
  console.log(line);
});
page.on('requestfailed', request => {
  const line = `[requestfailed] ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`;
  consoleLines.push(line);
  failures.push(line);
  console.log(line);
});

const response = await page.goto('http://127.0.0.1:4173/index.html?diagnostic=1', {
  waitUntil: 'domcontentloaded',
  timeout: 30000
});
if (!response || !response.ok()) failures.push(`index response was ${response?.status() || 'missing'}`);

const webgl = await page.evaluate(() => {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl1 = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return { ok: Boolean(gl1), mode: gl2 ? 'webgl2' : gl1 ? 'webgl1' : 'none' };
});
console.log('WebGL probe:', webgl);
if (!webgl.ok) failures.push('Chromium did not expose a WebGL context');

await page.waitForTimeout(2500);
const startupState = await page.evaluate(() => ({
  loadingActive: document.querySelector('#loading-screen')?.classList.contains('active') || false,
  menuActive: document.querySelector('#main-menu')?.classList.contains('active') || false,
  recoveryVisible: document.querySelector('#startup-recovery')?.classList.contains('visible') || false,
  canvasWidth: document.querySelector('#game-canvas')?.width || 0,
  canvasHeight: document.querySelector('#game-canvas')?.height || 0,
  build: document.querySelector('meta[name="neon-bay-build"]')?.content || ''
}));
console.log('Startup state:', startupState);

if (!startupState.menuActive) await page.waitForTimeout(12500);
const finalState = await page.evaluate(() => ({
  loadingActive: document.querySelector('#loading-screen')?.classList.contains('active') || false,
  menuActive: document.querySelector('#main-menu')?.classList.contains('active') || false,
  recoveryVisible: document.querySelector('#startup-recovery')?.classList.contains('visible') || false,
  diagnostics: document.querySelector('#startup-recovery-diagnostics')?.textContent || ''
}));
console.log('Final startup state:', finalState);

if (!finalState.menuActive) failures.push(`Main menu did not activate: ${JSON.stringify(finalState)}`);
if (finalState.recoveryVisible) failures.push(`Recovery console became visible: ${finalState.diagnostics}`);

const layout = await page.evaluate(() => {
  const menu = document.querySelector('#main-menu');
  const root = document.querySelector('#game-root');
  let cssRuleCount = 0;
  for (const sheet of document.styleSheets) {
    try { cssRuleCount += sheet.cssRules?.length || 0; } catch {}
  }
  return {
    menuPosition: menu ? getComputedStyle(menu).position : '',
    menuDisplay: menu ? getComputedStyle(menu).display : '',
    rootHeight: root ? getComputedStyle(root).height : '',
    bodyOverflow: getComputedStyle(document.body).overflow,
    bodyScrollHeight: document.body.scrollHeight,
    viewportHeight: innerHeight,
    cssRuleCount
  };
});
console.log('Layout state:', layout);
if (layout.menuPosition !== 'fixed' || layout.menuDisplay !== 'flex') failures.push(`Game stylesheet did not apply correctly: ${JSON.stringify(layout)}`);
if (layout.bodyOverflow !== 'hidden' || layout.bodyScrollHeight > layout.viewportHeight + 4) failures.push(`Page is scrolling instead of behaving like a game viewport: ${JSON.stringify(layout)}`);
if (layout.cssRuleCount < 50) failures.push(`Too few parsed CSS rules: ${layout.cssRuleCount}`);
await page.screenshot({ path: 'runtime-diagnostics/menu.png' });

if (finalState.menuActive) {
  await page.locator('#how-btn').click();
  await page.waitForTimeout(200);
  const howVisible = await page.locator('#how-panel').evaluate(el => !el.classList.contains('hidden'));
  if (!howVisible) failures.push('How to Play button did not open its modal');
  await page.locator('#how-panel .close-modal').click();

  await page.locator('#settings-btn').click();
  await page.waitForTimeout(200);
  const settingsVisible = await page.locator('#settings-panel').evaluate(el => !el.classList.contains('hidden'));
  if (!settingsVisible) failures.push('Settings button did not open its modal');
  await page.locator('#quality-select').selectOption('low');
  await page.locator('#settings-panel .close-modal').click();

  await page.locator('#v17-save-slot').selectOption('2');
  await page.locator('#new-game-btn').click();
  await page.waitForTimeout(1800);
  const gameplay = await page.evaluate(() => ({
    hudVisible: !document.querySelector('#hud')?.classList.contains('hidden'),
    menuActive: document.querySelector('#main-menu')?.classList.contains('active') || false,
    pauseActive: document.querySelector('#pause-menu')?.classList.contains('active') || false,
    missionTitle: document.querySelector('#mission-title')?.textContent || '',
    objective: document.querySelector('#mission-objective')?.textContent || '',
    canvasDisplay: getComputedStyle(document.querySelector('#game-canvas')).display
  }));
  console.log('Gameplay state:', gameplay);
  if (!gameplay.hudVisible || gameplay.menuActive || gameplay.pauseActive || !gameplay.missionTitle || !gameplay.objective || gameplay.canvasDisplay === 'none') {
    failures.push(`New Game did not enter a playable HUD state: ${JSON.stringify(gameplay)}`);
  }
  await page.screenshot({ path: 'runtime-diagnostics/gameplay.png' });

  await page.keyboard.press('p');
  await page.waitForTimeout(200);
  const phoneOpen = await page.locator('#phone-panel').evaluate(el => !el.classList.contains('hidden'));
  if (!phoneOpen) failures.push('Phone did not open with P');
  await page.keyboard.press('p');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const paused = await page.locator('#pause-menu').evaluate(el => el.classList.contains('active'));
  if (!paused) failures.push('Pause menu did not open with Escape');
  await page.locator('#skills-btn').click();
  await page.waitForTimeout(150);
  const skillsVisible = await page.locator('#skills-panel').evaluate(el => !el.classList.contains('hidden'));
  if (!skillsVisible) failures.push('Skills & Upgrades panel did not open');
  await page.locator('#skills-panel .close-modal').click();

  await page.locator('#empire-btn').click();
  await page.waitForTimeout(180);
  const empireInitial = await page.evaluate(() => ({
    visible: !document.querySelector('#v18-empire-panel')?.classList.contains('hidden'),
    properties: document.querySelectorAll('#v18-content .v18-card').length,
    empireChip: Boolean(document.querySelector('#v18-empire-chip')),
    phoneEmpire: Boolean(document.querySelector('#phone-empire-btn')),
    shards: document.querySelectorAll('.v18-shard-list i').length
  }));
  console.log('Empire initial state:', empireInitial);
  if (!empireInitial.visible || empireInitial.properties !== 5 || !empireInitial.empireChip || !empireInitial.phoneEmpire) failures.push(`Empire panel missing systems: ${JSON.stringify(empireInitial)}`);
  await page.locator('[data-v18-tab="contracts"]').click();
  await page.waitForTimeout(100);
  const contractCount = await page.locator('#v18-content .v18-card').count();
  if (contractCount !== 8) failures.push(`Expected 8 contracts, found ${contractCount}`);
  await page.locator('#v18-content [data-v18-action="start-contract"]').first().click();
  await page.locator('#v18-empire-panel .close-modal').click();
  await page.waitForTimeout(120);
  const contractActive = await page.locator('#v18-contract-hud').evaluate(el => !el.classList.contains('hidden'));
  if (!contractActive) failures.push('Empire contract HUD did not activate');

  await page.locator('#save-btn').click();
  const saveState = await page.evaluate(() => ({
    slot: localStorage.getItem('neon-bay-save-v6-index'),
    save: localStorage.getItem('neon-bay-save-v6-slot-2'),
    director: document.querySelector('#v17-director-tier')?.textContent || '',
    wantedStars: document.querySelector('#wanted')?.textContent || '',
    skillsButton: Boolean(document.querySelector('#skills-btn')),
    phoneSkills: Boolean(document.querySelector('#phone-skills-btn')),
    empireButton: Boolean(document.querySelector('#empire-btn')),
    contractTitle: document.querySelector('#v18-contract-title')?.textContent || ''
  }));
  console.log('v1.8 state:', saveState);
  if (saveState.slot !== '2' || !saveState.save) failures.push(`Save v6 slot 2 was not created: ${JSON.stringify(saveState)}`);
  if (!saveState.director || saveState.wantedStars.replace(/\s/g, '').length !== 5 || !saveState.skillsButton || !saveState.phoneSkills || !saveState.empireButton || !saveState.contractTitle) failures.push(`v1.8 UI systems missing: ${JSON.stringify(saveState)}`);
  await page.locator('#quit-btn').click();
  const returned = await page.evaluate(() => ({
    menuActive: document.querySelector('#main-menu')?.classList.contains('active') || false,
    continueDisabled: document.querySelector('#continue-btn')?.disabled ?? true,
    hudHidden: document.querySelector('#hud')?.classList.contains('hidden') || false
  }));
  if (!returned.menuActive || returned.continueDisabled || !returned.hudHidden) failures.push(`Main-menu return/save state failed: ${JSON.stringify(returned)}`);
}

await page.screenshot({ path: 'runtime-diagnostics/final.png' });
fs.writeFileSync('runtime-diagnostics/summary.json', JSON.stringify({ webgl, startupState, finalState, layout, failures, consoleLines }, null, 2));
await browser.close();
if (failures.length) {
  console.error(`Runtime smoke test found ${failures.length} failure(s).`);
  process.exit(1);
}
console.log('Neon Bay v1.8 runtime smoke test passed.');
