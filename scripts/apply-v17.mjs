import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const payloadPath = path.join(root, 'overlay-v17', 'apply-v17.br.b64');
const generatedPath = path.join(root, 'scripts', '.apply-v17.generated.mjs');

if (!fs.existsSync(payloadPath)) throw new Error(`Missing v1.7 engine patch payload: ${payloadPath}`);
const compressed = Buffer.from(fs.readFileSync(payloadPath, 'utf8').trim(), 'base64');
const source = zlib.brotliDecompressSync(compressed).toString('utf8');
if (!source.includes("Applied Neon Bay v1.7 Living City gameplay overlay.")) {
  throw new Error('Invalid Neon Bay v1.7 engine patch payload.');
}

fs.writeFileSync(generatedPath, source, 'utf8');
try {
  await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`);
} finally {
  fs.rmSync(generatedPath, { force: true });
}

const trailerPath = path.join(root, 'public', 'trailer.html');
let trailer = fs.readFileSync(trailerPath, 'utf8');
trailer = trailer
  .replace(/Neon Bay v[\d.]+/g, 'Neon Bay v1.7')
  .replace(/IN-ENGINE v[\d.]+ · [A-Z ]+/g, 'IN-ENGINE v1.7 · LIVING CITY')
  .replace(/GRAPHICS OVERHAUL|CINEMATIC CITY|VICE COAST/g, 'LIVING CITY');
fs.writeFileSync(trailerPath, trailer, 'utf8');
