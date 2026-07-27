import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'overlay-v18/modules/empire-expansion-v18.js',
  'overlay-v18/v18.css',
  'scripts/apply-v18.mjs',
  'scripts/apply-v18-performance-hotfix.mjs',
  'scripts/apply-v181.mjs',
  'scripts/apply-v182.mjs',
  'scripts/prepare-v18-release-tools.mjs',
  'scripts/test-v18.mjs',
  'scripts/test-v18-performance-hotfix.mjs',
  'scripts/test-v182-playability.mjs',
  'scripts/test-v18-recovery.mjs',
  'scripts/runtime-v18-smoke.mjs',
  'scripts/verify-static-deployment.mjs',
  'RELEASE_NOTES_v1.8.md',
  'RELEASE_NOTES_v1.8.2.md',
];
for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`Missing v1.8 release file: ${relative}`);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '1.8.2') throw new Error(`Expected package version 1.8.2, found ${pkg.version}`);
if (!pkg.scripts?.['test:v18'] || !pkg.scripts?.['verify:v18']) throw new Error('v1.8 test/verify scripts are not wired.');
if (!pkg.scripts['prepare:source'].includes('apply-v18-performance-hotfix.mjs')) throw new Error('Performance hotfix is not wired into source preparation.');
if (!pkg.scripts['prepare:source'].includes('apply-v182.mjs')) throw new Error('v1.8.2 playability patch is not wired into source preparation.');
if (!pkg.scripts['test:v18'].includes('test-v18-performance-hotfix.mjs')) throw new Error('Performance regression test is not wired.');
if (!pkg.scripts['test:v18'].includes('test-v182-playability.mjs')) throw new Error('v1.8.2 regression test is not wired.');
const vite = fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf8');
if (!vite.includes('neon-bay-v1.8.0-engine')) throw new Error('v1.8 cache-busted assets are not configured.');
console.log(JSON.stringify({ release:'Neon Bay v1.8.2 Playability & Performance', files:requiredFiles.length, packageVersion:pkg.version, performanceHotfix:true, playabilityPatch:true, status:'ready' }, null, 2));
