import { copyFile, mkdir, readFile, writeFile, resolve, mainPath, overlayRoot, srcRoot, replaceOnce } from './v17-patch-utils.mjs';
let source = await readFile(mainPath, 'utf8');

source = replaceOnce(
  source,
  "import { CinematicCityOverhaul, CINEMATIC_POST_SHADER } from './modules/cinematic-city-v16.js';\n",
  "import { CinematicCityOverhaul, CINEMATIC_POST_SHADER } from './modules/cinematic-city-v16.js';\nimport { GAMEPLAY_VERSION, LivingCityDirectorV17, hitZoneFromIntersection, wantedProfileV17 } from './modules/living-city-v17.js';\n",
  'imports',
);

source = replaceOnce(
  source,
  "  phoneReputation: $('#phone-reputation'), phoneTier: $('#phone-tier'), phoneStory: $('#phone-story')\n};",
  "  phoneReputation: $('#phone-reputation'), phoneTier: $('#phone-tier'), phoneStory: $('#phone-story'),\n  v17Hitmarker: $('#v17-hitmarker'), v17CombatFeed: $('#v17-combat-feed'), v17DamageFlash: $('#v17-damage-flash'),\n  v17Threat: $('#v17-threat'), v17ThreatBar: $('#v17-threat-bar'), v17ThreatLabel: $('#v17-threat-label')\n};",
  'DOM bindings',
);

source = replaceOnce(
  source,
  "let lastGunshotPosition = null;\nlet lastGunshotAt = -999;",
  "let lastGunshotPosition = null;\nlet lastGunshotAt = -999;\nlet v17HitTimer = 0;\nlet v17FeedTimer = 0;\nlet v17DamageTimer = 0;\nlet explosionEffects = [];",
  'runtime state',
);

source = replaceOnce(
  source,
  "let progression = new ProgressionSystem();\nlet businessEmpire = new BusinessEmpire();",
  "let progression = new ProgressionSystem();\nlet businessEmpire = new BusinessEmpire();\nlet livingCityV17 = null;",
  'director declaration',
);

source = replaceOnce(
  source,
  "const random = seededRandom(96421);\nconst rand = (min, max) => min + (max - min) * random();",
  "const random = seededRandom(96421);\nconst rand = (min, max) => min + (max - min) * random();\nlivingCityV17 = new LivingCityDirectorV17({ random });",
  'director initialization',
);

source = replaceOnce(
  source,
  "function createPlayer() {",
  `function hasLineOfSightV17(from, to) {
  const delta = tmpV.copy(to).sub(from); delta.y = 0;
  const distance = delta.length();
  if (distance < 1) return true;
  delta.normalize();
  const step = 1.65;
  for (let travelled = step * 1.4; travelled < distance - step; travelled += step) {
    const x = from.x + delta.x * travelled;
    const z = from.z + delta.z * travelled;
    if (collidesAt(x, z, .14)) return false;
  }
  return true;
}

function showV17CombatFeedback({ zone = 'body', killed = false, damage = 0, combo = 0 } = {}) {
  if (dom.v17Hitmarker) {
    dom.v17Hitmarker.classList.remove('show', 'headshot', 'kill');
    void dom.v17Hitmarker.offsetWidth;
    dom.v17Hitmarker.classList.toggle('headshot', zone === 'head');
    dom.v17Hitmarker.classList.toggle('kill', killed);
    dom.v17Hitmarker.classList.add('show');
    v17HitTimer = .32;
  }
  if (dom.v17CombatFeed) {
    const label = killed ? (zone === 'head' ? 'HEADSHOT · TARGET DOWN' : 'TARGET DOWN') : zone === 'head' ? 'HEADSHOT' : zone === 'limb' ? 'LIMB HIT' : 'HIT CONFIRMED';
    dom.v17CombatFeed.textContent = \`${'${label}'} · ${'${Math.round(damage)}'} DMG${'${combo > 1 ? ` · x${combo.toFixed(1)}` : \'\'}'}\`;
    dom.v17CombatFeed.classList.remove('show'); void dom.v17CombatFeed.offsetWidth; dom.v17CombatFeed.classList.add('show');
    v17FeedTimer = 1.1;
  }
}

function createVehicleExplosion(position, vehicle) {
  const group = new THREE.Group(); group.position.copy(position);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff8b35, transparent: true, opacity: .88, depthWrite: false, blending: THREE.AdditiveBlending }));
  const shock = new THREE.Mesh(new THREE.RingGeometry(.8, 1.15, 24), new THREE.MeshBasicMaterial({ color: 0xffd45b, transparent: true, opacity: .78, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  shock.rotation.x = -Math.PI / 2; group.add(core, shock); scene.add(group);
  explosionEffects.push({ group, core, shock, life: 1 });
  visualOverhaul?.emitImpact(position.clone(), 34);
  livingCityV17.vehicleExplosions += 1;
  raiseWanted('explosion', Math.max(2, state.wanted));
  [...enemies, ...pedestrians].filter(entity => entity.alive).forEach(entity => {
    const distance = entity.group.position.distanceTo(position);
    if (distance < 9) entity.takeDamage((9 - distance) * 14, true, { zone: 'body', preScaled: true });
  });
  const playerDistance = getPlayerPosition().distanceTo(position);
  if (playerDistance < 10 && state.activeVehicle !== vehicle) damagePlayer((10 - playerDistance) * 8, position);
}

function updateV17Systems(dt) {
  livingCityV17.update(dt, { health: state.health, wanted: state.wanted, enemies: enemies.filter(entity => entity.alive).length });
  if(state.wanted===0)livingCityV17.decayCrime(dt,{observed:false,wanted:0});
  if (v17HitTimer > 0 && (v17HitTimer -= dt) <= 0) dom.v17Hitmarker?.classList.remove('show');
  if (v17FeedTimer > 0 && (v17FeedTimer -= dt) <= 0) dom.v17CombatFeed?.classList.remove('show');
  if (v17DamageTimer > 0 && (v17DamageTimer -= dt) <= 0) dom.v17DamageFlash?.classList.remove('active');
  explosionEffects.forEach(effect => {
    effect.life -= dt * 1.8;
    const progress = 1 - Math.max(0, effect.life);
    effect.core.scale.setScalar(1 + progress * 7);
    effect.shock.scale.setScalar(1 + progress * 9);
    effect.core.material.opacity = Math.max(0, effect.life) * .88;
    effect.shock.material.opacity = Math.max(0, effect.life) * .72;
  });
  explosionEffects.filter(effect => effect.life <= 0).forEach(effect => scene.remove(effect.group));
  explosionEffects = explosionEffects.filter(effect => effect.life > 0);
  if (dom.v17Threat && dom.v17ThreatBar && dom.v17ThreatLabel) {
    const aliveEnemies = enemies.filter(entity => entity.alive).length;
    const threat = livingCityV17.threatLabel(state.wanted, aliveEnemies);
    const amount = clamp((state.wanted * 16 + aliveEnemies * 4 + livingCityV17.adaptiveIntensity * 12), 8, 100);
    dom.v17ThreatLabel.textContent = threat;
    dom.v17ThreatBar.style.width = \`${'${amount}'}%\`;
    dom.v17Threat.classList.toggle('hidden', !state.running || state.paused);
  }
}

function createPlayer() {`,
  'v1.7 helpers',
);

await mkdir(resolve(srcRoot, 'modules'), { recursive: true });
await copyFile(resolve(overlayRoot, 'modules/living-city-v17.js'), resolve(srcRoot, 'modules/living-city-v17.js'));
await writeFile(mainPath, source, 'utf8');
console.log('Applied Neon Bay v1.7 core systems.');
