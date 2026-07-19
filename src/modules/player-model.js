import * as THREE from 'three';

function mat(color, roughness = .72, metalness = .04) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function box(w, h, d, color, y = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.y = y;
  return mesh;
}
function limb(w, h, d, color) {
  const pivot = new THREE.Group();
  const mesh = box(w, h, d, color, -h / 2);
  pivot.add(mesh);
  return pivot;
}

export function createPlayerModel({ quality = 'high' } = {}) {
  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 1.02;
  root.add(hips);

  const torso = box(.92, 1.05, .48, 0xe42f91, .48);
  const jacket = box(.98, .38, .52, 0x15203a, .7);
  hips.add(torso, jacket);

  const neck = box(.2, .18, .2, 0xbd7c62, 1.08);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.33, 18, 13), mat(0xc98768));
  head.position.y = 1.38;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.345, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x11131c));
  hair.position.y = 1.53;
  hips.add(neck, head, hair);

  const leftLeg = limb(.3, .96, .34, 0x17213a);
  const rightLeg = limb(.3, .96, .34, 0x17213a);
  leftLeg.position.set(-.25, .02, 0); rightLeg.position.set(.25, .02, 0);
  root.add(leftLeg, rightLeg);

  const leftArm = limb(.24, .92, .25, 0xc98768);
  const rightArm = limb(.24, .92, .25, 0xc98768);
  leftArm.position.set(-.58, 1.78, 0); rightArm.position.set(.58, 1.78, 0);
  root.add(leftArm, rightArm);

  const pistol = new THREE.Group();
  pistol.add(box(.13, .13, .58, 0x222936, -.05), box(.11, .28, .15, 0x151a24, -.2));
  pistol.position.set(0, -.78, -.26);
  rightArm.add(pistol);

  const shotgun = new THREE.Group();
  shotgun.add(box(.15, .15, 1.35, 0x242b37, -.02), box(.22, .2, .6, 0x7b4e2e, -.03));
  shotgun.position.set(0, -.68, -.62);
  shotgun.visible = false;
  rightArm.add(shotgun);

  const shoeL = box(.34, .2, .58, 0x11131a, -.95); shoeL.position.z = -.09; leftLeg.add(shoeL);
  const shoeR = shoeL.clone(); rightLeg.add(shoeR);

  root.userData.rig = { hips, torso, head, leftLeg, rightLeg, leftArm, rightArm, pistol, shotgun, recoil: 0 };
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = quality === 'high';
      o.receiveShadow = true;
      o.userData.player = true;
    }
  });
  return root;
}

export function setPlayerWeapon(root, weaponId) {
  const rig = root?.userData?.rig;
  if (!rig) return;
  rig.pistol.visible = weaponId === 'pistol';
  rig.shotgun.visible = weaponId === 'shotgun';
}

export function triggerPlayerRecoil(root, amount = 1) {
  const rig = root?.userData?.rig;
  if (rig) rig.recoil = Math.max(rig.recoil, amount);
}

export function updatePlayerAnimation(root, { dt, time, moving, sprinting, aiming, airborne, weapon = 'pistol' }) {
  const rig = root?.userData?.rig;
  if (!rig) return;
  const speed = sprinting ? 14 : 9;
  const stride = moving ? Math.sin(time * speed) : 0;
  const bob = moving ? Math.abs(Math.sin(time * speed)) * (sprinting ? .075 : .04) : 0;
  rig.hips.position.y = 1.02 + bob;
  rig.hips.rotation.z = THREE.MathUtils.lerp(rig.hips.rotation.z, moving ? Math.sin(time * speed * .5) * .025 : 0, dt * 9);

  const legSwing = airborne ? -.18 : stride * (sprinting ? .78 : .52);
  rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, legSwing, dt * 13);
  rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, airborne ? -.18 : -legSwing, dt * 13);

  rig.recoil = Math.max(0, rig.recoil - dt * 6.5);
  const recoil = rig.recoil;
  const aimPitch = aiming ? -1.18 : (moving ? -stride * .34 : .05);
  const offPitch = aiming ? -1.02 : (moving ? stride * .34 : -.05);
  rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, aimPitch + recoil * .32, dt * 15);
  rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, offPitch + recoil * .2, dt * 15);
  rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, aiming ? -.18 : 0, dt * 12);
  rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, aiming ? .38 : 0, dt * 12);
  rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, aiming ? -.08 : 0, dt * 8);
  setPlayerWeapon(root, weapon);
}
