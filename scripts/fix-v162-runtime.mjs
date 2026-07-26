import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'src');

const stylesPath = path.join(root, 'styles.css');
let css = fs.readFileSync(stylesPath, 'utf8');
css = css
  .replace(/@import\s+url\(\s*(['"])https:\/\/fonts\.googleapis\.com\/[^)]*\1\s*\)\s*;?/gi, '')
  .replace(/@import\s+(['"])https:\/\/fonts\.googleapis\.com\/.*?\1\s*;?/gi, '')
  .replace(/font-family:\s*Inter\s*,\s*system-ui\s*,\s*sans-serif/gi, 'font-family: Arial, Helvetica, system-ui, sans-serif')
  .replace(/font-family:\s*["']?Barlow Condensed["']?\s*,\s*sans-serif/gi, 'font-family: "Arial Narrow", "Aptos Narrow", Arial, sans-serif')
  .replace(/([,\s:])Inter(?=[,;\s}])/g, '$1Arial')
  .replace(/["']?Barlow Condensed["']?/g, '"Arial Narrow"');
fs.writeFileSync(stylesPath, css, 'utf8');

const cinematicPath = path.join(root, 'modules', 'cinematic-city-v16.js');
let cinematic = fs.readFileSync(cinematicPath, 'utf8');
const multiplyMaterial = 'return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.MultiplyBlending });';
const fixedMultiplyMaterial = 'return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true });';
if (cinematic.includes(multiplyMaterial)) {
  cinematic = cinematic.replace(multiplyMaterial, fixedMultiplyMaterial);
} else if (!cinematic.includes('blending: THREE.MultiplyBlending, premultipliedAlpha: true')) {
  throw new Error('Could not locate the cinematic MultiplyBlending material.');
}
fs.writeFileSync(cinematicPath, cinematic, 'utf8');

console.log('Applied Neon Bay v1.6.2 runtime stability fixes.');
