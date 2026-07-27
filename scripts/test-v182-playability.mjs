import fs from 'node:fs';

const main = fs.readFileSync('src/main.js', 'utf8');
const graphics = fs.readFileSync('src/modules/graphics-overhaul.js', 'utf8');
const empire = fs.readFileSync('src/modules/empire-expansion-v18.js', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');

const checks = [
  ['runtime marker', main.includes('NEON_BAY_V182_RUNTIME')],
  ['collision broadphase', main.includes('v182CollisionGrid') && main.includes('v182IndexCollider')],
  ['instanced world polish', main.includes('new THREE.InstancedMesh(markGeo') && main.includes('new THREE.InstancedMesh(trunkGeo')],
  ['fixed AI tick', main.includes("const aiInterval=state.quality==='low'?.05:1/30")],
  ['interaction throttle', main.includes('v182InteractionGate>=.1||input.interactQueued')],
  ['medium-to-low fallback', main.includes("state.quality === 'high' ? 'medium' : 'low'")],
  ['squared distance culling', main.includes('distanceToSquared(p)')],
  ['camera scratch vectors', main.includes('v182CameraProbe.copy(v182CameraFocus)')],
  ['graphics scratch vectors', graphics.includes('this.tmpA = new THREE.Vector3()') && graphics.includes('this.fillLight.position.lerp(this.tmpA.set')],
  ['immediate contract HUD', empire.includes('this.render();\n    this.updateUI();\n    return { ok: true, contract: this.activeContract };')],
  ['runtime version', css.includes('v1.8.2') && !css.includes('v1.8.1')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
