import fs from 'node:fs';
import path from 'node:path';

const packager = path.resolve('scripts/package-v161-hotfix.mjs');
let source = fs.readFileSync(packager, 'utf8');
let changed = false;

const validatorAnchor = "  if (/^[a-z]+:/i.test(clean) || clean.startsWith('//')) return null;\n  if (clean.startsWith('/')) return path.join(target, clean.slice(1));";
const validatorReplacement = "  if (/^[a-z]+:/i.test(clean) || clean.startsWith('//')) return null;\n  // Bundled libraries contain many plain string literals that resemble import\n  // specifiers (for example Three.js color-space names). A browser JavaScript\n  // module can only reference another emitted file here through ./, ../ or /.\n  if (path.extname(fromFile).toLowerCase() === '.js' && !clean.startsWith('.') && !clean.startsWith('/')) return null;\n  if (clean.startsWith('/')) return path.join(target, clean.slice(1));";

if (!source.includes(validatorReplacement)) {
  if (!source.includes(validatorAnchor)) throw new Error('v1.6.1 validator patch anchor is missing');
  source = source.replace(validatorAnchor, validatorReplacement);
  changed = true;
}

const newlineAnchor = "    ].join('\\n');";
const newlineReplacement = "    ].join('\\\\n');";
if (!source.includes(newlineReplacement)) {
  if (!source.includes(newlineAnchor)) throw new Error('v1.6.1 recovery newline anchor is missing');
  source = source.replace(newlineAnchor, newlineReplacement);
  changed = true;
}

if (changed) fs.writeFileSync(packager, source, 'utf8');
console.log('Prepared v1.6.1 validator and recovery bootstrap emission.');
