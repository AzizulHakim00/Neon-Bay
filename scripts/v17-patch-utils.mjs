import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const srcRoot = resolve(root, 'src');
export const overlayRoot = resolve(root, 'overlay-v17');
export const mainPath = resolve(srcRoot, 'main.js');
export const indexPath = resolve(root, 'index.html');
export const stylesPath = resolve(srcRoot, 'styles.css');
export { copyFile, mkdir, readFile, writeFile, resolve };

export function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`v1.7 patch ${label} expected exactly one match, found ${count}`);
  return source.replace(before, after);
}

export function replaceSection(source, classMarker, startMarker, endMarker, replacement, label) {
  const classIndex = source.indexOf(classMarker);
  if (classIndex < 0) throw new Error(`v1.7 patch ${label} could not find class marker`);
  const start = source.indexOf(startMarker, classIndex);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`v1.7 patch ${label} could not locate section boundaries`);
  return source.slice(0, start) + replacement + source.slice(end);
}
