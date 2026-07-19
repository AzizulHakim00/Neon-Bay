import * as THREE from 'three';
import { JSDOM } from 'jsdom';
import { WEAPONS, VEHICLE_SPECS } from '../src/modules/content.js';
import { createPlayerModel, updatePlayerAnimation, setPlayerWeapon, triggerPlayerRecoil } from '../src/modules/player-model.js';
import { createVehicleModel, updateVehicleVisual } from '../src/modules/vehicle-model.js';
import { buildCoverPoints, chooseCoverPoint } from '../src/modules/combat-ai.js';
import { CinematicDirector } from '../src/modules/cinematic.js';

if (WEAPONS.shotgun.pellets < 5 || WEAPONS.pistol.capacity !== 12) throw new Error('Weapon definitions invalid');
if (VEHICLE_SPECS.sunset.maxSpeed <= VEHICLE_SPECS.van.maxSpeed) throw new Error('Vehicle handling profiles are not distinct');

const player = createPlayerModel({ quality: 'low' });
if (!player.userData.rig?.leftLeg || !player.userData.rig?.shotgun) throw new Error('Articulated player rig missing');
setPlayerWeapon(player, 'shotgun');
if (!player.userData.rig.shotgun.visible || player.userData.rig.pistol.visible) throw new Error('Weapon visibility switching failed');
triggerPlayerRecoil(player, 1.2);
updatePlayerAnimation(player, { dt: .016, time: 1, moving: true, sprinting: true, aiming: true, airborne: false, weapon: 'shotgun' });
if (player.userData.rig.leftLeg.rotation.x === 0) throw new Error('Player animation did not update');

for (const entry of [
  { id: 'sunset', type: 'sport', color: 0xff3eb5 },
  { id: 'ocean', type: 'sport', color: 0x35d7ea },
  { id: 'van', type: 'van', color: 0xf0b64b }
]) {
  const model = createVehicleModel({ ...entry, quality: 'low' });
  if (model.wheels.length !== 4 || model.headlights.length !== 2) throw new Error(`Vehicle model incomplete: ${entry.id}`);
  updateVehicleVisual(model, { speed: 20, steer: .5, braking: true, handbrake: false, dt: .016, time: 1 });
}

const boxes = [{ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }];
const cover = buildCoverPoints(boxes);
const chosen = chooseCoverPoint(new THREE.Vector3(8,0,0), new THREE.Vector3(20,0,0), cover, () => false, 20);
if (!chosen) throw new Error('Cover selection failed');

const dom = new JSDOM('<div id="r" class="hidden"></div><span id="s"></span><p id="t"></p><small id="k"></small>');
const director = new CinematicDirector({ root: dom.window.document.querySelector('#r'), speaker: dom.window.document.querySelector('#s'), text: dom.window.document.querySelector('#t'), skip: dom.window.document.querySelector('#k') });
director.play([{ speaker: 'TEST', text: 'Dialogue', duration: .01 }], { mode: 'cutscene' });
director.update(.02);
if (director.active) throw new Error('Cinematic did not complete');

console.log(JSON.stringify({ playerRig: 'ok', vehicles: 3, weapons: Object.keys(WEAPONS), coverAI: 'ok', cinematic: 'ok' }, null, 2));
