const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const childProcess = require('node:child_process');

const root = process.cwd();
const marker = path.join(root, 'src', 'modules', 'player-model.js');

function removeLegacyReleaseParts() {
  for (const name of fs.readdirSync(root)) {
    if (/^release-v1\.1\.part-\d+$/.test(name)) {
      fs.rmSync(path.join(root, name), { force: true });
    }
  }
}

if (!fs.existsSync(marker)) {
  const parts = fs.readdirSync(root)
    .filter((name) => /^v11bundle\.part-\d+(?:[a-z])?$/.test(name))
    .sort();

  if (parts.length !== 22) {
    throw new Error(`Expected 22 verified Neon Bay v1.1 bundle pieces, found ${parts.length}.`);
  }

  const encoded = parts
    .map((name) => fs.readFileSync(path.join(root, name), 'utf8').trim())
    .join('');

  if (encoded.length !== 77108) {
    throw new Error(`Neon Bay v1.1 bundle length mismatch: ${encoded.length}.`);
  }

  const tarData = zlib.brotliDecompressSync(Buffer.from(encoded, 'base64'));
  const archive = path.join(os.tmpdir(), 'neon-bay-v1.1.tar');
  fs.writeFileSync(archive, tarData);
  childProcess.execFileSync('tar', ['-xf', archive, '-C', root], { stdio: 'inherit' });

  if (!fs.existsSync(marker)) {
    throw new Error('Neon Bay v1.1 extraction failed: modular player source is missing.');
  }

  console.log('Neon Bay v1.1 verified release expanded successfully.');
}

removeLegacyReleaseParts();
