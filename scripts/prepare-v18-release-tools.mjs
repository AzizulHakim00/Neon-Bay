import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageV17 = path.join(root, 'scripts', 'package-v17-release.mjs');
const packageV18 = path.join(root, 'scripts', 'package-v18-release.mjs');
if (!fs.existsSync(packageV17)) throw new Error('Run prepare-v17-release-tools before preparing v1.8 release tools.');

let source = fs.readFileSync(packageV17, 'utf8');
source = source
  .replace("const VERSION = '1.7.0';", "const VERSION = '1.8.0';")
  .replace("const BUILD = 'Living City';", "const BUILD = 'Empire Expansion';")
  .replace(/const saveKeys = \[[^\n]+\];/, "const saveKeys = ['neon-bay-save-v6-index','neon-bay-save-v6-slot-1','neon-bay-save-v6-slot-2','neon-bay-save-v6-slot-3','neon-bay-save-v6-backup-1','neon-bay-save-v6-backup-2','neon-bay-save-v6-backup-3','neon-bay-save-v5-index','neon-bay-save-v5-slot-1','neon-bay-save-v5-slot-2','neon-bay-save-v5-slot-3','neon-bay-save-v5-backup-1','neon-bay-save-v5-backup-2','neon-bay-save-v5-backup-3','neon-bay-save-v4','neon-bay-save-v3','neon-bay-save-v2','neon-bay-save-v1'];")
  .replaceAll('neon-bay-v17-recovery-style', 'neon-bay-v18-recovery-style')
  .replaceAll('neon-bay-v17-recovery', 'neon-bay-v18-recovery')
  .replaceAll('neon-bay-v17-auto-safe-attempt', 'neon-bay-v18-auto-safe-attempt')
  .replace('save-v1 through save-v5 slot and backup data', 'save-v1 through save-v6 slot and backup data')
  .replaceAll("'ORIGINAL WEB GAME · v1.7'", "'ORIGINAL WEB GAME · v1.8'")
  .replaceAll("'LIVING CITY · v1.7'", "'EMPIRE EXPANSION · v1.8'")
  .replaceAll("'Neon Bay v1.7'", "'Neon Bay v1.8'")
  .replaceAll("'IN-ENGINE v1.7 · LIVING CITY'", "'IN-ENGINE v1.8 · EMPIRE EXPANSION'")
  .replaceAll("'Starting Living City…'", "'Starting Empire Expansion…'")
  .replaceAll('v1.7.0', 'v1.8.0')
  .replaceAll('v1\\.7\\.0', 'v1\\.8\\.0')
  .replaceAll('v1.7', 'v1.8')
  .replaceAll('v1\\.7', 'v1\\.8')
  .replaceAll('Living City', 'Empire Expansion')
  .replaceAll('LIVING CITY', 'EMPIRE EXPANSION')
  .replace("saveSchema: 'v5-multislot'", "saveSchema: 'v6-multislot-empire'");

fs.writeFileSync(packageV18, source, 'utf8');
console.log('Prepared Neon Bay v1.8 packaging tools.');
