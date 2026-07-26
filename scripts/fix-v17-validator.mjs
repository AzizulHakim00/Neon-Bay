import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'scripts', 'package-v17-release.mjs');
if (!fs.existsSync(target)) throw new Error(`Missing generated v1.7 release validator: ${target}`);

let source = fs.readFileSync(target, 'utf8');
let changed = false;

const referenceMarker = 'Ignore bare JavaScript strings that resemble emitted references.';
if (!source.includes(referenceMarker)) {
  const before = "    while ((match = pattern.exec(content))) references.add(match[1]);";
  const after = `    while ((match = pattern.exec(content))) {
      const reference = match[1];
      // Ignore bare JavaScript strings that resemble emitted references.
      // Vite chunk-to-chunk references are relative or root paths; labels such
      // as Three.js \"srgb-linear\" are runtime values, not files.
      if (extension === '.js' && !/^(?:\\.{1,2}\\/|\\/)/.test(reference)) continue;
      references.add(reference);
    }`;
  const matches = source.split(before).length - 1;
  if (matches !== 1) throw new Error(`v1.7 validator patch expected one match, found ${matches}`);
  source = source.replace(before, after);
  changed = true;
}

// The recovery bootstrap is itself emitted from a template literal. Preserve
// the newline escape inside the generated browser script instead of inserting
// a literal line break inside its quoted string.
const recoveryBefore = "    ].join('\\n');";
const recoveryAfter = "    ].join('\\\\n');";
if (!source.includes(recoveryAfter)) {
  const matches = source.split(recoveryBefore).length - 1;
  if (matches !== 1) throw new Error(`v1.7 recovery escape patch expected one match, found ${matches}`);
  source = source.replace(recoveryBefore, recoveryAfter);
  changed = true;
}

if (changed) fs.writeFileSync(target, source, 'utf8');
console.log('Applied Neon Bay v1.7 validator and recovery generator fixes.');
