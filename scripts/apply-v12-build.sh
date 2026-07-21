#!/usr/bin/env bash
set -euo pipefail

if [ -f .neon-v12-expanded ]; then
  exit 0
fi

tmp_archive="$(mktemp)"
cat release-v1.2-lite.part-* | base64 --decode > "$tmp_archive"
tar -xJf "$tmp_archive" -C .
rm -f "$tmp_archive"

mkdir -p public/models
cat release-v1.2-assets/neon-citizen.glb.part-* | base64 --decode > public/models/neon-citizen.glb

cat > src/modules/dialogue-system.js <<'JS'
export class DialogueSystem {
  constructor({ root, speaker, text, skipButton, voiceEnabled = () => true } = {}) {
    this.root = root;
    this.speaker = speaker;
    this.text = text;
    this.skipButton = skipButton;
    this.voiceEnabled = voiceEnabled;
    this.sequence = [];
    this.index = -1;
    this.timer = 0;
    this.active = false;
    this.onComplete = null;
    this.utterance = null;
    skipButton?.addEventListener('click', () => this.finish());
  }

  play(lines, onComplete) {
    this.stopVoice();
    this.sequence = lines;
    this.index = -1;
    this.onComplete = onComplete;
    this.active = true;
    this.root?.classList.remove('hidden');
    this.advance();
  }

  advance() {
    this.index += 1;
    if (this.index >= this.sequence.length) return this.finish();
    const line = this.sequence[this.index];
    if (this.speaker) this.speaker.textContent = line.speaker || '';
    if (this.text) this.text.textContent = line.text || '';
    this.timer = line.duration || Math.max(2.5, (line.text?.length || 20) / 17);
    this.stopVoice();
    this.speak(line);
  }

  speak(line) {
    if (!this.voiceEnabled() || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(line.text || '');
    utterance.rate = line.speaker === 'PLAYER' ? 1.02 : 0.94;
    utterance.pitch = line.speaker === 'PLAYER' ? 0.88 : 1.08;
    utterance.volume = 0.72;
    const voices = speechSynthesis.getVoices?.() || [];
    const preferred = voices.find((voice) => /^en/i.test(voice.lang) && (line.speaker === 'PLAYER' ? /male|david|mark|daniel/i.test(voice.name) : /female|zira|samantha|victoria/i.test(voice.name)));
    if (preferred) utterance.voice = preferred;
    this.utterance = utterance;
    speechSynthesis.speak(utterance);
  }

  update(dt) {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0) this.advance();
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.stopVoice();
    this.root?.classList.add('hidden');
    const callback = this.onComplete;
    this.onComplete = null;
    callback?.();
  }

  stopVoice() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    this.utterance = null;
  }
}

export const FIRST_RIDE_DIALOGUE = [
  { speaker: 'MARA VELEZ', text: 'Coastline is changing. The old crews are nervous, and nervous people pay well.', duration: 5.4 },
  { speaker: 'PLAYER', text: 'You called me across the city for a nervous driver?', duration: 4.2 },
  { speaker: 'MARA VELEZ', text: 'For the pink Sunset GT behind you. Deliver it clean and the Bay starts opening doors.', duration: 5.6 },
  { speaker: 'MARA VELEZ', text: 'One warning: the police already know that car.', duration: 4.2 }
];
JS

touch .neon-v12-expanded
