import fs from 'node:fs';
import path from 'node:path';
import { EmpireExpansionV18, V18_PROPERTIES, V18_CONTRACTS, V18_OPERATIONS } from '../overlay-v18/modules/empire-expansion-v18.js';

const root = process.cwd();
const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const required = [
  "EmpireExpansionV18",
  "neon-bay-save-v6-slot-",
  "version:6",
  "updateV18Systems(dt)",
  "nb:v18-action",
  "v18Empire?.serialize()",
  "v18Empire?.hydrate(d.v18||{})",
  "v18Empire.buildWorld(scene)",
];
for (const marker of required) if (!main.includes(marker)) throw new Error(`Missing v1.8 source marker: ${marker}`);
if (!styles.includes('.v18-empire-card')) throw new Error('Missing v1.8 Empire UI styles.');
if (V18_PROPERTIES.length !== 5) throw new Error(`Expected 5 properties, found ${V18_PROPERTIES.length}`);
if (V18_CONTRACTS.length !== 8) throw new Error(`Expected 8 contracts, found ${V18_CONTRACTS.length}`);
if (V18_OPERATIONS.length !== 5) throw new Error(`Expected 5 Chapter Three operations, found ${V18_OPERATIONS.length}`);

const empire = new EmpireExpansionV18();
const purchase = empire.purchaseProperty('safehouse', 5000);
if (!purchase.ok || purchase.cost !== 4300 || empire.incomeRate() !== 145) throw new Error('Property purchase/income model failed.');
const contract = empire.startContract('street-cleanup');
if (!contract.ok || empire.activeContract?.target !== 4) throw new Error('Contract start failed.');
for (let i = 0; i < 4; i++) empire.recordKill();
empire.update(0.016, { playerPosition: { clone(){ return this; }, distanceTo(){ return 0; }, x:0, z:0 }, wanted:0 });
if (empire.activeContract) throw new Error('Kill contract did not complete.');
const fleet = empire.upgradeFleet('sunset', 'engine', 5000);
if (!fleet.ok || empire.vehicleEffect('sunset','engine') <= 1) throw new Error('Fleet upgrade failed.');
const restored = new EmpireExpansionV18(empire.serialize());
if (!restored.properties.safehouse || restored.fleet.sunset.engine !== 1) throw new Error('v1.8 serialization failed.');

console.log(JSON.stringify({ release:'v1.8.0', properties:V18_PROPERTIES.length, contracts:V18_CONTRACTS.length, operations:V18_OPERATIONS.length, saveSchema:'v6', status:'ok' }, null, 2));
