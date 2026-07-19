import * as THREE from 'three';

function material(color, roughness = .48, metalness = .24, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 1.4 : 0 });
}
function box(w, h, d, color, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options.roughness, options.metalness, options.emissive));
  mesh.position.set(x, y, z);
  if (options.rx) mesh.rotation.x = options.rx;
  if (options.ry) mesh.rotation.y = options.ry;
  if (options.rz) mesh.rotation.z = options.rz;
  return mesh;
}

export function createVehicleModel({ id, type, color, quality = 'high' }) {
  const group = new THREE.Group();
  const visual = new THREE.Group();
  group.add(visual);
  const isVan = type === 'van';
  const isPolice = type === 'police';
  const isSunset = id === 'sunset';
  const isOcean = id === 'ocean';
  const length = isVan ? 4.55 : 4.25;
  const width = isVan ? 2.18 : 2.08;

  const lower = box(width, isVan ? .82 : .58, length, color, 0, isVan ? .72 : .55, 0, { roughness: .4, metalness: .32 });
  visual.add(lower);

  if (isVan) {
    visual.add(box(2.02, 1.55, 3.12, color, 0, 1.48, .25, { roughness: .45, metalness: .2 }));
    visual.add(box(1.75, .76, .12, 0x18283a, 0, 1.72, -1.34, { roughness: .15, metalness: .08 }));
    visual.add(box(1.6, .12, 2.5, 0xf0c45e, 0, 2.29, .3, { roughness: .6, metalness: .08 }));
  } else {
    const cabinColor = isPolice ? 0xe6edf6 : 0x132238;
    const cabin = box(isSunset ? 1.56 : 1.72, isSunset ? .63 : .72, isSunset ? 1.7 : 1.95, cabinColor, 0, 1.15, isSunset ? .18 : -.08, { roughness: .18, metalness: .12 });
    cabin.rotation.x = isSunset ? -.08 : 0;
    visual.add(cabin);
    if (isSunset) {
      const nose = box(1.96, .28, 1.25, color, 0, .76, -1.55, { roughness: .35, metalness: .35 }); nose.rotation.x = -.08; visual.add(nose);
      visual.add(box(1.8, .12, .38, 0x191d2a, 0, 1.05, 1.94));
      visual.add(box(.12, .52, .18, 0x191d2a, -.78, .84, 1.82), box(.12, .52, .18, 0x191d2a, .78, .84, 1.82));
    }
    if (isOcean) {
      visual.add(box(1.9, .22, 1.1, color, 0, .77, -1.58, { roughness: .36, metalness: .32 }));
      visual.add(box(1.74, .14, 1.2, 0x0e3045, 0, 1.48, .08, { roughness: .16, metalness: .1 }));
    }
  }

  const bumperColor = 0x111722;
  visual.add(box(width + .08, .17, .22, bumperColor, 0, .38, -length / 2), box(width + .08, .17, .22, bumperColor, 0, .38, length / 2));

  const headlights = [
    box(.42, .16, .06, 0xeaf8ff, -.65, .66, -length / 2 - .12, { emissive: 0xaee8ff, roughness: .15, metalness: .05 }),
    box(.42, .16, .06, 0xeaf8ff, .65, .66, -length / 2 - .12, { emissive: 0xaee8ff, roughness: .15, metalness: .05 })
  ];
  const brakeLights = [
    box(.38, .17, .06, 0xff2448, -.64, .66, length / 2 + .12, { emissive: 0xff143a, roughness: .2, metalness: .05 }),
    box(.38, .17, .06, 0xff2448, .64, .66, length / 2 + .12, { emissive: 0xff143a, roughness: .2, metalness: .05 })
  ];
  visual.add(...headlights, ...brakeLights);

  const wheels = [];
  const frontWheels = [];
  const wheelGeo = new THREE.CylinderGeometry(isVan ? .42 : .38, isVan ? .42 : .38, .29, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) for (const sz of [-1.5, 1.5]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * (width / 2), .38, sz);
    const wheel = new THREE.Mesh(wheelGeo, material(0x090b11, .88, .04));
    pivot.add(wheel); visual.add(pivot); wheels.push(wheel);
    if (sz < 0) frontWheels.push(pivot);
  }

  if (isPolice) {
    visual.add(box(1.22, .12, .24, 0xdce8f5, 0, 1.79, 0));
    visual.add(box(.48, .16, .26, 0xff2445, -.29, 1.88, 0, { emissive: 0xff1239 }));
    visual.add(box(.48, .16, .26, 0x268dff, .29, 1.88, 0, { emissive: 0x147cff }));
    visual.add(box(width + .03, .38, 1.4, 0xf1f4f8, 0, .86, .55, { roughness: .45, metalness: .18 }));
  }

  group.traverse(o => {
    if (o.isMesh) {
      o.castShadow = quality === 'high';
      o.receiveShadow = true;
    }
  });
  return { group, visual, wheels, frontWheels, headlights, brakeLights };
}

export function updateVehicleVisual(model, { speed, steer, braking, handbrake, dt, time }) {
  if (!model) return;
  const speedRatio = Math.min(1, Math.abs(speed) / 35);
  model.visual.rotation.z = THREE.MathUtils.lerp(model.visual.rotation.z, -steer * speedRatio * (handbrake ? .11 : .055), dt * 7);
  model.visual.rotation.x = THREE.MathUtils.lerp(model.visual.rotation.x, braking ? -.035 : Math.max(0, speed) * .0012, dt * 8);
  model.visual.position.y = Math.sin(time * 12) * speedRatio * .012;
  model.frontWheels.forEach(p => { p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, -steer * .48, dt * 11); });
  model.brakeLights.forEach(light => { light.material.emissiveIntensity = braking ? 4 : 1.2; });
}
