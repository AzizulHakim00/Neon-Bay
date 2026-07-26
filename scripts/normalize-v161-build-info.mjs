import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const file = path.join(root, 'BUILD_INFO.json');

if (!fs.existsSync(file)) {
  throw new Error(`Missing build metadata: ${file}`);
}

const info = JSON.parse(fs.readFileSync(file, 'utf8'));
info.generatedAt = process.env.NEON_BAY_RELEASE_TIMESTAMP || '2026-07-26T00:00:00.000Z';
info.reproducibleBuild = true;
fs.writeFileSync(file, `${JSON.stringify(info, null, 2)}\n`, 'utf8');

console.log(`Normalized reproducible build metadata in ${path.relative(process.cwd(), file)}.`);
