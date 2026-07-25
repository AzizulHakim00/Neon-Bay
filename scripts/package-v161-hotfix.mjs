import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const VERSION = '1.6.1';
const BUILD = 'Stable Cinematic Hotfix';
const ROOT = process.cwd();
const args = process.argv.slice(2);
const verifyOnly = args[0] === '--verify-only';
const targetArg = verifyOnly ? args[1] : args[0];
const target = path.resolve(ROOT, targetArg || 'dist');

const textExtensions = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt']);
const saveKeys = ['neon-bay-save-v4', 'neon-bay-save-v3', 'neon-bay-save-v2', 'neon-bay-save-v1'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const recoveryCss = `
<style id="neon-bay-v161-recovery-style">
#startup-recovery{position:fixed;inset:0;z-index:10000;display:none;place-items:center;padding:24px;background:radial-gradient(circle at 50% 12%,rgba(27,55,104,.96),rgba(3,5,16,.985) 58%);color:#fff;font-family:Arial,Helvetica,system-ui,sans-serif}
#startup-recovery.visible{display:grid}
#startup-recovery .recovery-card{width:min(720px,100%);border:1px solid rgba(56,232,255,.34);border-radius:22px;padding:28px;background:rgba(4,8,24,.94);box-shadow:0 28px 90px rgba(0,0,0,.58),0 0 48px rgba(56,232,255,.12)}
#startup-recovery .recovery-eyebrow{font-size:12px;font-weight:900;letter-spacing:.16em;color:#38e8ff}
#startup-recovery h2{margin:8px 0 10px;font-size:clamp(28px,5vw,48px);line-height:.95}
#startup-recovery p{margin:0 0 15px;color:#d7dfef;line-height:1.55}
#startup-recovery pre{max-height:180px;overflow:auto;margin:14px 0 18px;padding:14px;border-radius:12px;background:#02040d;border:1px solid rgba(255,255,255,.1);color:#aeefff;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;user-select:text}
#startup-recovery .recovery-actions{display:flex;flex-wrap:wrap;gap:10px}
#startup-recovery button{min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:#151c32;color:#fff;font:800 14px/1 Arial,Helvetica,sans-serif;cursor:pointer}
#startup-recovery button.primary{border-color:#38e8ff;background:linear-gradient(135deg,#0aaec4,#1760d7)}
#startup-recovery button.danger{border-color:rgba(255,75,92,.65);background:#40131d}
#startup-recovery .recovery-note{margin-top:14px;font-size:12px;color:#9eabc4}
</style>`;

const recoveryMarkup = `
<div id="startup-recovery" role="alertdialog" aria-modal="true" aria-labelledby="startup-recovery-title">
  <div class="recovery-card">
    <div class="recovery-eyebrow">NEON BAY v${VERSION} · RECOVERY CONSOLE</div>
    <h2 id="startup-recovery-title">The city could not start normally.</h2>
    <p id="startup-recovery-status">A safe recovery option is available.</p>
    <pre id="startup-recovery-diagnostics">Collecting diagnostics…</pre>
    <div class="recovery-actions">
      <button id="recovery-safe" class="primary" type="button">Start Safe Graphics</button>
      <button id="recovery-retry" type="button">Retry Startup</button>
      <button id="recovery-reset" class="danger" type="button">Reset Save and Retry</button>
    </div>
    <div class="recovery-note">Safe Graphics changes only the graphics preset. Reset Save permanently removes local save-v1 through save-v4 data from this browser.</div>
  </div>
</div>`;

const recoveryScript = `
<script id="neon-bay-v161-recovery">
(() => {
  'use strict';
  const VERSION = ${JSON.stringify(VERSION)};
  const BUILD = ${JSON.stringify(BUILD)};
  const QUALITY_KEY = 'neon-bay-quality';
  const SAVE_KEYS = ${JSON.stringify(saveKeys)};
  const ATTEMPT_KEY = 'neon-bay-v161-auto-safe-attempt';
  const params = new URLSearchParams(location.search);
  const boot = { error: '', resource: '', started: Date.now(), timer: 0 };

  if (params.get('safe') === '1') localStorage.setItem(QUALITY_KEY, 'low');

  function messageOf(value) {
    if (value instanceof Error) return value.stack || value.message || String(value);
    if (value && typeof value === 'object') {
      try { return JSON.stringify(value); } catch {}
    }
    return String(value || 'Unknown startup error');
  }

  function webglProbe() {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
      if (gl2) return { ok: true, mode: 'WebGL 2' };
      const gl1 = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) || canvas.getContext('experimental-webgl');
      if (gl1) return { ok: true, mode: 'WebGL 1' };
      return { ok: false, mode: 'Unavailable' };
    } catch (error) {
      return { ok: false, mode: messageOf(error) };
    }
  }

  function isStarting() {
    const loading = document.getElementById('loading-screen');
    const menu = document.getElementById('main-menu');
    return !!loading?.classList.contains('active') && !menu?.classList.contains('active');
  }

  function diagnosticText(code, detail) {
    const webgl = webglProbe();
    return [
      'Code: ' + code,
      'Build: Neon Bay v' + VERSION + ' — ' + BUILD,
      'WebGL: ' + webgl.mode,
      'Graphics: ' + (localStorage.getItem(QUALITY_KEY) || 'high'),
      'Safe attempt: ' + (sessionStorage.getItem(ATTEMPT_KEY) || 'no'),
      'Path: ' + location.pathname,
      'User agent: ' + navigator.userAgent,
      'Detail: ' + String(detail || boot.error || boot.resource || 'No exception was reported.').slice(0, 1000)
    ].join('\n');
  }

  function navigate(changes = {}) {
    const next = new URL(location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (value == null) next.searchParams.delete(key);
      else next.searchParams.set(key, String(value));
    }
    location.replace(next.href);
  }

  function showRecovery(code, detail, allowAutomatic = true) {
    const panel = document.getElementById('startup-recovery');
    if (!panel) return;
    const diagnostics = document.getElementById('startup-recovery-diagnostics');
    const status = document.getElementById('startup-recovery-status');
    if (diagnostics) diagnostics.textContent = diagnosticText(code, detail);
    panel.classList.add('visible');

    const webgl = webglProbe();
    const alreadySafe = localStorage.getItem(QUALITY_KEY) === 'low' || params.get('safe') === '1';
    const attempted = sessionStorage.getItem(ATTEMPT_KEY) === '1';
    if (allowAutomatic && webgl.ok && !alreadySafe && !attempted) {
      sessionStorage.setItem(ATTEMPT_KEY, '1');
      localStorage.setItem(QUALITY_KEY, 'low');
      if (status) status.textContent = 'Normal startup failed. Retrying once automatically with Safe Graphics…';
      setTimeout(() => navigate({ safe: 1, recovery: 'auto', retry: Date.now() }), 1400);
    } else if (status) {
      status.textContent = webgl.ok
        ? 'Use Safe Graphics, retry with a fresh cache key, or reset local save data.'
        : 'This browser did not provide a WebGL context. Enable hardware acceleration or use a WebGL-capable browser.';
    }
  }

  window.__NEON_BAY_STARTUP_RECOVERY__ = { show: showRecovery, version: VERSION };

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target;
      boot.resource = target.src || target.href || target.tagName || 'resource';
      if (isStarting()) setTimeout(() => showRecovery('RESOURCE_LOAD_ERROR', boot.resource), 0);
      return;
    }
    boot.error = messageOf(event.error || event.message);
    if (isStarting()) setTimeout(() => showRecovery('JAVASCRIPT_ERROR', boot.error), 0);
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    boot.error = messageOf(event.reason);
    if (isStarting()) setTimeout(() => showRecovery('PROMISE_REJECTION', boot.error), 0);
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('recovery-safe')?.addEventListener('click', () => {
      sessionStorage.setItem(ATTEMPT_KEY, '1');
      localStorage.setItem(QUALITY_KEY, 'low');
      navigate({ safe: 1, recovery: 'manual', retry: Date.now() });
    });
    document.getElementById('recovery-retry')?.addEventListener('click', () => {
      navigate({ retry: Date.now() });
    });
    document.getElementById('recovery-reset')?.addEventListener('click', () => {
      for (const key of SAVE_KEYS) localStorage.removeItem(key);
      localStorage.setItem(QUALITY_KEY, 'low');
      sessionStorage.removeItem(ATTEMPT_KEY);
      navigate({ safe: 1, reset: 1, retry: Date.now() });
    });

    const webgl = webglProbe();
    if (!webgl.ok) {
      showRecovery('WEBGL_UNAVAILABLE', webgl.mode, false);
      return;
    }

    boot.timer = window.setInterval(() => {
      if (!isStarting()) {
        window.clearInterval(boot.timer);
        sessionStorage.removeItem(ATTEMPT_KEY);
        return;
      }
      const elapsed = Date.now() - boot.started;
      const loadingText = document.querySelector('#loading-screen .loading-card p');
      if (loadingText && elapsed > 4500) loadingText.textContent = 'Loading bundled city engine…';
      if (elapsed > 12000) {
        window.clearInterval(boot.timer);
        showRecovery('STARTUP_TIMEOUT', boot.error || 'The bundled engine did not reach the main menu within 12 seconds.');
      }
    }, 500);
  });
})();
</script>`;

function patchHtml(htmlFile) {
  let html = read(htmlFile);
  html = html
    .replace(/v1\.6(?!\.\d)/g, `v${VERSION}`)
    .replace(/Building the city…/g, 'Starting stable cinematic build…')
    .replace(/href="\/trailer\.html"/g, 'href="./trailer.html"')
    .replace(/<title>Neon Bay<\/title>/g, `<title>Neon Bay v${VERSION}</title>`);

  if (!html.includes('name="neon-bay-build"')) {
    html = html.replace('</head>', `  <meta name="neon-bay-build" content="v${VERSION} ${BUILD}" />\n${recoveryCss}\n</head>`);
  }
  if (!html.includes('id="startup-recovery"')) {
    html = html.replace('</body>', `${recoveryMarkup}\n</body>`);
  }
  if (!html.includes('id="neon-bay-v161-recovery"')) {
    const moduleIndex = html.search(/<script\b[^>]*type=["']module["'][^>]*>/i);
    if (moduleIndex >= 0) html = html.slice(0, moduleIndex) + recoveryScript + '\n' + html.slice(moduleIndex);
    else html = html.replace('</body>', `${recoveryScript}\n</body>`);
  }
  write(htmlFile, html);
}

function removeExternalFonts(cssFile) {
  let css = read(cssFile);
  css = css
    .replace(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\);?\s*/gi, '')
    .replace(/font-family:\s*Inter\s*,\s*system-ui\s*,\s*sans-serif/gi, 'font-family: Arial, Helvetica, system-ui, sans-serif')
    .replace(/font-family:\s*['"]?Barlow Condensed['"]?\s*,\s*sans-serif/gi, 'font-family: "Arial Narrow", "Aptos Narrow", Arial, sans-serif');
  write(cssFile, css);
}

function resolveReference(fromFile, reference) {
  const clean = reference.split('#')[0].split('?')[0];
  if (!clean || clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('mailto:') || clean.startsWith('javascript:')) return null;
  if (/^[a-z]+:/i.test(clean) || clean.startsWith('//')) return null;
  if (clean.startsWith('/')) return path.join(target, clean.slice(1));
  return path.resolve(path.dirname(fromFile), clean);
}

function collectReferences(file, content) {
  const references = new Set();
  const extension = path.extname(file).toLowerCase();
  const patterns = [];
  if (extension === '.html') patterns.push(/\b(?:src|href)=["']([^"']+)["']/gi);
  if (extension === '.css') patterns.push(/url\(\s*["']?([^"')]+)["']?\s*\)/gi);
  if (extension === '.js') patterns.push(/\bfrom\s*["']([^"']+)["']/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g, /new\s+URL\(\s*["']([^"']+)["']/g);
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) references.add(match[1]);
  }
  return [...references];
}

function validateRuntime(rootDir) {
  assert(fs.existsSync(rootDir), `Missing build directory: ${rootDir}`);
  const indexFile = path.join(rootDir, 'index.html');
  assert(fs.existsSync(indexFile), 'Missing index.html');

  const files = walk(rootDir);
  const textFiles = files.filter((file) => textExtensions.has(path.extname(file).toLowerCase()));
  const missing = [];
  const external = [];
  const jsFiles = [];

  for (const file of textFiles) {
    const content = read(file);
    const relative = path.relative(rootDir, file).split(path.sep).join('/');
    if (path.extname(file).toLowerCase() === '.js') jsFiles.push(file);

    const dependencyPatterns = [
      /<(?:script|link|img|iframe)\b[^>]*(?:src|href)=["']https?:\/\//i,
      /@import\b[^;]*https?:\/\//i,
      /url\(\s*["']?https?:\/\//i,
      /\b(?:from|import\()\s*["']https?:\/\//i,
      /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/i,
    ];
    if (dependencyPatterns.some((pattern) => pattern.test(content))) external.push(relative);

    for (const reference of collectReferences(file, content)) {
      const resolved = resolveReference(file, reference);
      if (resolved && !fs.existsSync(resolved)) missing.push(`${relative} -> ${reference}`);
    }
  }

  assert(external.length === 0, `External runtime dependencies found in: ${external.join(', ')}`);
  assert(missing.length === 0, `Missing emitted references:\n${missing.join('\n')}`);
  assert(jsFiles.length > 0, 'No JavaScript bundle was emitted');

  for (const file of jsFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });

  const index = read(indexFile);
  assert(index.includes(`v${VERSION}`), 'Version label was not updated to v1.6.1');
  assert(index.includes('startup-recovery'), 'Recovery console was not injected');
  assert(index.includes('neon-bay-v161-recovery'), 'Recovery bootstrap was not injected');
  assert(index.includes('Reset Save and Retry'), 'Reset Save recovery action is missing');
  assert(index.includes('Start Safe Graphics'), 'Safe Graphics recovery action is missing');

  const engineFiles = files.filter((file) => /neon-bay-v1\.6\.1-engine\.[^/]+\.js$/.test(file.split(path.sep).join('/')));
  const cssFiles = files.filter((file) => /neon-bay-v1\.6\.1-styles\.[^/]+\.css$/.test(file.split(path.sep).join('/')));
  assert(engineFiles.length === 1, `Expected one cache-busted engine bundle, found ${engineFiles.length}`);
  assert(cssFiles.length >= 1, `Expected a cache-busted CSS bundle, found ${cssFiles.length}`);

  return {
    version: VERSION,
    build: BUILD,
    files: files.length,
    javascript: jsFiles.length,
    engine: path.relative(rootDir, engineFiles[0]).split(path.sep).join('/'),
    styles: cssFiles.map((file) => path.relative(rootDir, file).split(path.sep).join('/')),
    indexSha256: sha256(indexFile),
  };
}

if (!verifyOnly) {
  assert(fs.existsSync(target), `Build output does not exist: ${target}`);
  for (const file of walk(target).filter((file) => path.extname(file).toLowerCase() === '.html')) patchHtml(file);
  for (const file of walk(target).filter((file) => path.extname(file).toLowerCase() === '.css')) removeExternalFonts(file);

  const buildInfo = {
    name: 'Neon Bay',
    version: VERSION,
    release: BUILD,
    generatedAt: new Date().toISOString(),
    deployment: 'self-contained static Vite bundle',
    saveSchema: 'v4',
    recovery: ['automatic safe graphics retry', 'manual safe graphics', 'reset save and retry', 'cache-busted retry'],
  };
  write(path.join(target, 'BUILD_INFO.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
}

const report = validateRuntime(target);
console.log(JSON.stringify({ hotfix: 'ok', mode: verifyOnly ? 'verify-only' : 'package', ...report }, null, 2));
