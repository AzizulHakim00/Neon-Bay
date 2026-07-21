import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const root = process.cwd();
const expectedHash = '1922cfceca9ae419e3f8534f0c98145508f81ff274deeea258cbbf4f83b70656';
const parts = fs.readdirSync(root)
  .filter((name) => /^release-v1\.3\.part-/.test(name))
  .sort();

if (parts.length !== 11) {
  throw new Error(`Expected 11 Neon Bay v1.3 release parts, found ${parts.length}`);
}

const base64 = parts
  .map((name) => fs.readFileSync(path.join(root, name), 'utf8').trim())
  .join('');
const compressed = Buffer.from(base64, 'base64');
const actualHash = crypto.createHash('sha256').update(compressed).digest('hex');

if (actualHash !== expectedHash) {
  throw new Error(`Neon Bay v1.3 payload checksum mismatch: ${actualHash}`);
}

const payload = JSON.parse(zlib.brotliDecompressSync(compressed).toString('utf8'));
if (payload.version !== '1.3.0' || !payload.files) {
  throw new Error('Invalid Neon Bay v1.3 release payload');
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
