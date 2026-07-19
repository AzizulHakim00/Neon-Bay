export class CinematicDirector {
  constructor({ root, speaker, text, skip }) {
    this.root = root;
    this.speaker = speaker;
    this.text = text;
    this.skip = skip;
    this.lines = [];
    this.index = 0;
    this.lineTime = 0;
    this.elapsed = 0;
    this.active = false;
    this.mode = 'dialogue';
    this.onComplete = null;
  }
  play(lines, { mode = 'dialogue', onComplete = null } = {}) {
    if (!lines?.length) return;
    this.lines = lines;
    this.index = 0;
    this.lineTime = 0;
    this.elapsed = 0;
    this.active = true;
    this.mode = mode;
    this.onComplete = onComplete;
    this.root.classList.remove('hidden');
    this.root.classList.toggle('cutscene', mode === 'cutscene');
    this.skip.textContent = mode === 'cutscene' ? 'SPACE TO SKIP' : '';
    this.renderLine();
  }
  renderLine() {
    const line = this.lines[this.index];
    if (!line) return this.finish();
    this.speaker.textContent = line.speaker;
    this.text.textContent = line.text;
    this.lineTime = line.duration ?? 2.4;
  }
  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    this.lineTime -= dt;
    if (this.lineTime <= 0) {
      this.index += 1;
      this.renderLine();
    }
  }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.root.classList.add('hidden');
    const callback = this.onComplete;
    this.onComplete = null;
    callback?.();
  }
}
