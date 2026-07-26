import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const payloadPath = path.join(root, 'overlay-v17', 'release-tools.br.b64');
if (!fs.existsSync(payloadPath)) throw new Error(`Missing v1.7 release-tools payload: ${payloadPath}`);
const compressed = Buffer.from(fs.readFileSync(payloadPath, 'utf8').trim(), 'base64');
const payload = JSON.parse(zlib.brotliDecompressSync(compressed).toString('utf8'));
if (payload.version !== '1.7.0' || !payload.files) throw new Error('Invalid Neon Bay v1.7 release-tools payload.');
for (const [relativePath, content] of Object.entries(payload.files)) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`Unsafe release-tools path: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}
console.log(`Prepared Neon Bay v1.7 release tools (${Object.keys(payload.files).length} files).`);
