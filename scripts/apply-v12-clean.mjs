import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const root = process.cwd();
const expectedHash = '57e25b10c1690a84dde9b1d65903402624aab1259cc14b175dc3e7392857445c';
const parts = fs.readdirSync(root)
  .filter((name) => /^release-v1\.2-clean\.part-\d+$/.test(name))
  .sort();

if (parts.length !== 6) {
  throw new Error(`Expected 6 Neon Bay v1.2 release parts, found ${parts.length}`);
}

const base64 = parts
  .map((name) => fs.readFileSync(path.join(root, name), 'utf8').trim())
  .join('');
const compressed = Buffer.from(base64, 'base64');
const actualHash = crypto.createHash('sha256').update(compressed).digest('hex');
if (actualHash !== expectedHash) {
  throw new Error(`Neon Bay v1.2 payload checksum mismatch: ${actualHash}`);
}

const payload = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
if (payload.version !== '1.2.0' || !payload.files) {
  throw new Error('Invalid Neon Bay v1.2 release payload');
}

for (const [relativePath, content] of Object.entries(payload.files)) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Unsafe release path: ${relativePath}`);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

console.log(`Applied Neon Bay ${payload.version}: ${Object.keys(payload.files).length} files`);
