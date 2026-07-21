import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import tar from 'tar-stream';
import xzPackage from 'xz-decompress';
const { XzReadableStream } = xzPackage;

const root = process.cwd();
const marker = path.join(root, '.neon-v12-expanded');
if (fs.existsSync(marker)) process.exit(0);

const safeTarget = (entryPath) => {
  const normalized = path.posix.normalize(entryPath).replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Unsafe archive path: ${entryPath}`);
  }
  const target = path.resolve(root, normalized);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Archive path escapes project: ${entryPath}`);
  }
  return target;
};

const partNames = (await fsp.readdir(root))
  .filter((name) => /^release-v1\.2-lite\.part-\d+$/.test(name))
  .sort();
if (!partNames.length) throw new Error('Neon Bay v1.2 source parts are missing.');

const encoded = (await Promise.all(partNames.map((name) => fsp.readFile(path.join(root, name), 'utf8')))).join('');
const compressed = Buffer.from(encoded, 'base64');
const decompressed = Buffer.from(await new Response(
  new XzReadableStream(new Blob([compressed]).stream())
).arrayBuffer());

const extract = tar.extract();
const extractionComplete = new Promise((resolve, reject) => {
  extract.on('finish', resolve);
  extract.on('error', reject);
});

extract.on('entry', (header, stream, next) => {
  let target;
  try {
    target = safeTarget(header.name);
  } catch (error) {
    stream.resume();
    extract.destroy(error);
    return;
  }

  if (header.type === 'directory') {
    fsp.mkdir(target, { recursive: true })
      .then(() => { stream.resume(); next(); })
      .catch((error) => extract.destroy(error));
    return;
  }

  if (header.type !== 'file') {
    stream.resume();
    next();
    return;
  }

  fsp.mkdir(path.dirname(target), { recursive: true })
    .then(() => pipeline(stream, fs.createWriteStream(target, { mode: header.mode || 0o644 })))
    .then(next)
    .catch((error) => extract.destroy(error));
});

Readable.from(decompressed).pipe(extract);
await extractionComplete;

const assetDir = path.join(root, 'release-v1.2-assets');
const modelParts = (await fsp.readdir(assetDir))
  .filter((name) => /^neon-citizen\.glb\.part-\d+$/.test(name))
  .sort();
if (!modelParts.length) throw new Error('Animated Neon Citizen GLB parts are missing.');
const modelEncoded = (await Promise.all(modelParts.map((name) => fsp.readFile(path.join(assetDir, name), 'utf8')))).join('');
await fsp.mkdir(path.join(root, 'public', 'models'), { recursive: true });
await fsp.writeFile(path.join(root, 'public', 'models', 'neon-citizen.glb'), Buffer.from(modelEncoded, 'base64'));

const dialogueModule = `export class DialogueSystem {
  constructor({ root, speaker, text, skipButton, voiceEnabled = () => true } = {}) {
    this.root = root; this.speaker = speaker; this.text = text; this.skipButton = skipButton;
    this.voiceEnabled = voiceEnabled; this.sequence = []; this.index = -1; this.timer = 0;
    this.active = false; this.onComplete = null;
    skipButton?.addEventListener('click', () => this.finish());
  }
  play(lines, onComplete) {
    this.stopVoice(); this.sequence = lines; this.index = -1; this.onComplete = onComplete;
    this.active = true; this.root?.classList.remove('hidden'); this.advance();
  }
  advance() {
    this.index += 1; if (this.index >= this.sequence.length) return this.finish();
    const line = this.sequence[this.index];
    if (this.speaker) this.speaker.textContent = line.speaker || '';
    if (this.text) this.text.textContent = line.text || '';
    this.timer = line.duration || Math.max(2.5, (line.text?.length || 20) / 17);
    this.stopVoice(); this.speak(line);
  }
  speak(line) {
    if (!this.voiceEnabled() || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(line.text || '');
    utterance.rate = line.speaker === 'PLAYER' ? 1.02 : 0.94;
    utterance.pitch = line.speaker === 'PLAYER' ? 0.88 : 1.08; utterance.volume = 0.72;
    const voices = speechSynthesis.getVoices?.() || [];
    const preferred = voices.find((voice) => /^en/i.test(voice.lang) && (line.speaker === 'PLAYER' ? /male|david|mark|daniel/i.test(voice.name) : /female|zira|samantha|victoria/i.test(voice.name)));
    if (preferred) utterance.voice = preferred; speechSynthesis.speak(utterance);
  }
  update(dt) { if (this.active && (this.timer -= dt) <= 0) this.advance(); }
  finish() {
    if (!this.active) return; this.active = false; this.stopVoice(); this.root?.classList.add('hidden');
    const callback = this.onComplete; this.onComplete = null; callback?.();
  }
  stopVoice() { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }
}
export const FIRST_RIDE_DIALOGUE = [
  { speaker: 'MARA VELEZ', text: 'Coastline is changing. The old crews are nervous, and nervous people pay well.', duration: 5.4 },
  { speaker: 'PLAYER', text: 'You called me across the city for a nervous driver?', duration: 4.2 },
  { speaker: 'MARA VELEZ', text: 'For the pink Sunset GT behind you. Deliver it clean and the Bay starts opening doors.', duration: 5.6 },
  { speaker: 'MARA VELEZ', text: 'One warning: the police already know that car.', duration: 4.2 }
];
`;
await fsp.writeFile(path.join(root, 'src', 'modules', 'dialogue-system.js'), dialogueModule);
await fsp.writeFile(marker, 'Neon Bay v1.2 source expanded by Node bootstrap.\n');
console.log('Neon Bay v1.2 source and animated GLB assembled.');
