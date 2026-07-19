import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const parts = readdirSync(root)
  .filter((name) => /^release-v1\.1\.part-\d+$/.test(name))
  .sort();

if (parts.length === 0) {
  console.log('Neon Bay v1.1 source is already expanded.');
  process.exit(0);
}

if (parts.length !== 7) {
  throw new Error(`Expected 7 Neon Bay v1.1 release parts, found ${parts.length}.`);
}

const encoded = parts.map((name) => readFileSync(join(root, name), 'utf8').trim()).join('');
const archive = join(tmpdir(), 'neon-bay-v1.1.tar.gz');
writeFileSync(archive, Buffer.from(encoded, 'base64'));

execFileSync('tar', ['-xzf', archive, '-C', root], { stdio: 'inherit' });

if (!existsSync(join(root, 'src', 'modules', 'player-model.js'))) {
  throw new Error('Neon Bay v1.1 extraction failed: modular player source is missing.');
}

console.log('Neon Bay v1.1 source expanded successfully.');
