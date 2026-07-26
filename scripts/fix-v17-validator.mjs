import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'scripts', 'package-v17-release.mjs');
if (!fs.existsSync(target)) throw new Error(`Missing generated v1.7 release validator: ${target}`);

let source = fs.readFileSync(target, 'utf8');
const marker = 'Ignore bare JavaScript strings that resemble emitted references.';

if (!source.includes(marker)) {
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
  fs.writeFileSync(target, source, 'utf8');
}

console.log('Applied Neon Bay v1.7 emitted-reference validator fix.');
