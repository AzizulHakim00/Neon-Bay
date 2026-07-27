import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'overlay-v18', 'modules', 'empire-expansion-v18.js');
let source = fs.readFileSync(target, 'utf8');
const before = "document.dispatchEvent(new CustomEvent('nb:v18-contract-complete', { detail: result }));";
const after = "if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') document.dispatchEvent(new CustomEvent('nb:v18-contract-complete', { detail: result }));";
const matches = source.split(before).length - 1;
if (matches !== 2 && !source.includes(after)) throw new Error(`Expected two v1.8 contract event dispatches, found ${matches}.`);
source = source.split(before).join(after);
fs.writeFileSync(target, source, 'utf8');
console.log('Patched v1.8 contract events for browser and Node environments.');
