import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'src', 'modules', 'empire-expansion-v18.js');
let source = fs.readFileSync(file, 'utf8');

const before = `    this.render();
    return { ok: true, contract: this.activeContract };
  }

  completeContract(success) {`;
const after = `    this.render();
    this.updateUI();
    return { ok: true, contract: this.activeContract };
  }

  completeContract(success) {`;

if (source.includes(after)) {
  console.log('Neon Bay v1.8.2 contract HUD fix already applied.');
  process.exit(0);
}
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Contract HUD patch expected one match, found ${count}`);
source = source.replace(before, after);
fs.writeFileSync(file, source);
console.log('Applied immediate Empire contract HUD activation fix.');
