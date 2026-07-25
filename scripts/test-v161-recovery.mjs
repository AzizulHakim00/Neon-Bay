import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || 'dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script id="neon-bay-v161-recovery">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Embedded v1.6.1 recovery bootstrap was not found');

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    has(key) { return values.has(key); },
  };
}

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
  };
}

function interactiveElement() {
  const listeners = new Map();
  return {
    textContent: '',
    classList: classList(),
    addEventListener(type, handler) { listeners.set(type, handler); },
    click() { listeners.get('click')?.({ preventDefault() {} }); },
  };
}

const domReady = [];
const windowEvents = new Map();
const elements = new Map([
  ['startup-recovery', interactiveElement()],
  ['startup-recovery-diagnostics', interactiveElement()],
  ['startup-recovery-status', interactiveElement()],
  ['recovery-safe', interactiveElement()],
  ['recovery-retry', interactiveElement()],
  ['recovery-reset', interactiveElement()],
  ['loading-screen', { classList: classList(['active']) }],
  ['main-menu', { classList: classList() }],
]);
const loadingText = interactiveElement();
const localStorage = storage({
  'neon-bay-quality': 'high',
  'neon-bay-save-v4': '{"mission":5}',
  'neon-bay-save-v3': '{}',
  'neon-bay-save-v2': '{}',
  'neon-bay-save-v1': '{}',
});
const sessionStorage = storage();
let replacedUrl = '';
const location = {
  search: '?safe=1',
  pathname: '/index.html',
  href: 'https://example.test/index.html?safe=1',
  replace(value) { replacedUrl = String(value); },
};
const document = {
  getElementById(id) { return elements.get(id) || null; },
  querySelector(selector) { return selector === '#loading-screen .loading-card p' ? loadingText : null; },
  createElement(name) {
    if (name !== 'canvas') return interactiveElement();
    return { getContext(type) { return type === 'webgl2' ? {} : null; } };
  },
  addEventListener(type, handler) { if (type === 'DOMContentLoaded') domReady.push(handler); },
};
const window = {
  addEventListener(type, handler) { windowEvents.set(type, handler); },
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout(handler) { handler(); return 1; },
};
const context = vm.createContext({
  window,
  document,
  location,
  navigator: { userAgent: 'Neon Bay recovery smoke test' },
  localStorage,
  sessionStorage,
  URL,
  URLSearchParams,
  Date,
  Error,
  JSON,
  Object,
  String,
  setTimeout: window.setTimeout,
  clearTimeout() {},
});

vm.runInContext(match[1], context, { filename: 'neon-bay-v161-recovery.js' });
for (const handler of domReady) handler();

if (localStorage.getItem('neon-bay-quality') !== 'low') throw new Error('Safe query did not force low graphics');
if (!window.__NEON_BAY_STARTUP_RECOVERY__) throw new Error('Recovery API was not exposed');
window.__NEON_BAY_STARTUP_RECOVERY__.show('SMOKE_TEST', 'recovery path', false);
if (!elements.get('startup-recovery').classList.contains('visible')) throw new Error('Recovery panel did not become visible');
if (!elements.get('startup-recovery-diagnostics').textContent.includes('SMOKE_TEST')) throw new Error('Diagnostics were not rendered');

elements.get('recovery-reset').click();
for (const key of ['neon-bay-save-v4', 'neon-bay-save-v3', 'neon-bay-save-v2', 'neon-bay-save-v1']) {
  if (localStorage.has(key)) throw new Error(`Reset did not remove ${key}`);
}
if (!replacedUrl.includes('safe=1') || !replacedUrl.includes('reset=1') || !replacedUrl.includes('retry=')) {
  throw new Error(`Reset navigation was incomplete: ${replacedUrl}`);
}

console.log(JSON.stringify({ recovery: 'ok', safeGraphics: 'low', resetSave: 'ok', redirected: replacedUrl }, null, 2));
