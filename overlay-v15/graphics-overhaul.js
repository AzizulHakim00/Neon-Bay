import * as THREE from 'three';

export const GRAPHICS_QUALITY = Object.freeze({
  low: Object.freeze({ particles: 0, puddles: 0, props: 18, lightPools: 0, headlights: false, effects: 18, pixelRatio: 1 }),
  medium: Object.freeze({ particles: 180, puddles: 14, props: 34, lightPools: 18, headlights: true, effects: 28, pixelRatio: 1.35 }),
  high: Object.freeze({ particles: 420, puddles: 28, props: 56, lightPools: 32, headlights: true, effects: 44, pixelRatio: 2 }),
  ultra: Object.freeze({ particles: 720, puddles: 42, props: 82, lightPools: 48, headlights: true, effects: 64, pixelRatio: 2.25 }),
});

export function graphicsProfile(value) {
  return GRAPHICS_QUALITY[value] || GRAPHICS_QUALITY.high;
}

export function atmosphericExposure(hour, weather = 'CLEAR') {
  const daylight = THREE.MathUtils.clamp(Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) * .8 + .28, .08, 1);
  const sunset = hour > 17 && hour < 20 ? .16 : 0;
  const weatherPenalty = weather === 'RAIN' ? .13 : weather === 'OVERCAST' ? .08 : 0;
  return THREE.MathUtils.clamp(.92 + daylight * .24 + sunset - weatherPenalty, .78, 1.28);
}

export function atmosphericFog(hour, weather = 'CLEAR') {
  const night = hour < 6 || hour > 20;
  const weatherBoost = weather === 'RAIN' ? .0018 : weather === 'OVERCAST' ? .0009 : 0;
  return (night ? .00425 : .00335) + weatherBoost;
}

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

function emissiveMaterial(color, intensity = 1, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  material.userData.baseOpacity = opacity;
  material.userData.intensity = intensity;
  return material;
}

function seededValue(index, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export class GraphicsOverhaul {
  constructor({ scene, camera, renderer, quality = 'high', random = Math.random, testMode = false } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.random = random;
    this.testMode = testMode;
    this.quality = testMode ? 'low' : quality;
    this.profile = graphicsProfile(this.quality);
    this.root = new THREE.Group();
    this.root.name = 'Neon Bay v1.5 Graphics Overhaul';
    this.scene.add(this.root);
    this.puddles = [];
    this.lightPools = [];
    this.effects = [];
    this.vehicles = new Set();
    this.roadMaterials = new Set();
    this.dust = null;
    this.dustOrigin = new THREE.Vector3();
    this.foamStrips = [];
    this.shake = 0;
    this.time = 0;
    this.fillLight = new THREE.PointLight(0x5d9dff, 0, 34, 2);
    this.fillLight.position.set(0, 6, 0);
    this.root.add(this.fillLight);
    this.rimLight = new THREE.PointLight(0xff4fb7, 0, 18, 2);
    this.rimLight.position.set(0, 3, 0);
    this.root.add(this.rimLight);
    this.headlight = new THREE.SpotLight(0xd9f4ff, 0, 58, Math.PI / 7, .48, 1.5);
    this.headlight.position.set(0, 1.2, -1.6);
    this.headlight.target.position.set(0, .4, -18);
    this.root.add(this.headlight, this.headlight.target);
  }

  build() {
    this.buildPuddles();
    this.buildAtmosphere();
    this.buildBeachFoam();
    this.buildStreetProps();
    this.buildLightPools();
    return this;
  }

  setQuality(value) {
    this.quality = value in GRAPHICS_QUALITY ? value : 'high';
    this.profile = graphicsProfile(this.quality);
    const enabled = this.quality !== 'low';
    if (this.dust) this.dust.visible = enabled;
    this.puddles.forEach((puddle, index) => { puddle.visible = index < this.profile.puddles; });
    this.lightPools.forEach((pool, index) => { pool.visible = index < this.profile.lightPools; });
  }

  registerRoadMaterial(material) {
    if (!material) return;
    this.roadMaterials.add(material);
    material.envMapIntensity = 1.2;
  }

  registerVehicle(vehicle) {
    if (!vehicle || this.vehicles.has(vehicle)) return;
    this.vehicles.add(vehicle);
    const paint = vehicle.body?.material;
    if (paint) {
      const upgraded = new THREE.MeshPhysicalMaterial({
        color: paint.color?.clone?.() || new THREE.Color(0xffffff),
        roughness: .24,
        metalness: .48,
        clearcoat: .9,
        clearcoatRoughness: .14,
        envMapIntensity: 1.45,
      });
      vehicle.body.material = upgraded;
    }
    const cabin = vehicle.mesh?.children?.find(child => child.name === 'Cabin');
    if (cabin?.material) {
      cabin.material = new THREE.MeshPhysicalMaterial({
        color: cabin.material.color?.clone?.() || new THREE.Color(0x101522),
        roughness: .12,
        metalness: .28,
        clearcoat: .65,
        clearcoatRoughness: .1,
        transparent: true,
        opacity: .92,
      });
    }
    vehicle.headlights?.forEach(light => {
      if (!light.material) return;
      light.material = light.material.clone();
      light.material.emissiveIntensity = 2.1;
    });
  }

  buildPuddles() {
    const max = GRAPHICS_QUALITY.ultra.puddles;
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x34506f,
      roughness: .08,
      metalness: .68,
      clearcoat: 1,
      clearcoatRoughness: .04,
      transparent: true,
      opacity: .07,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < max; i++) {
      const horizontal = i % 2 === 0;
      const road = [-120, -60, 0, 60, 120][i % 5];
      const offset = -156 + seededValue(i, 1) * 312;
      const width = 1.8 + seededValue(i, 2) * 4.8;
      const depth = .65 + seededValue(i, 3) * 1.9;
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 24), material.clone());
      puddle.scale.set(width, depth, 1);
      puddle.rotation.x = -Math.PI / 2;
      puddle.rotation.z = seededValue(i, 4) * Math.PI;
      puddle.position.set(horizontal ? offset : road + (seededValue(i, 5) - .5) * 8, .046, horizontal ? road + (seededValue(i, 6) - .5) * 8 : offset);
      puddle.visible = i < this.profile.puddles;
      this.root.add(puddle);
      this.puddles.push(puddle);
    }
  }

  buildAtmosphere() {
    const count = GRAPHICS_QUALITY.ultra.particles;
    if (!count) return;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededValue(i, 10) - .5) * 95;
      positions[i * 3 + 1] = 1 + seededValue(i, 11) * 27;
      positions[i * 3 + 2] = (seededValue(i, 12) - .5) * 95;
      phases[i] = seededValue(i, 13) * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    const material = new THREE.PointsMaterial({ color: 0xffd7a8, size: .08, transparent: true, opacity: .28, depthWrite: false, blending: THREE.AdditiveBlending });
    this.dust = new THREE.Points(geometry, material);
    this.dust.frustumCulled = false;
    this.dust.visible = this.profile.particles > 0;
    this.root.add(this.dust);
  }

  buildBeachFoam() {
    const material = new THREE.MeshBasicMaterial({ color: 0xbff7ff, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 7; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.4 + i * .18, 330, 1, 32), material.clone());
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(174 + i * 3.2, .055, 0);
      strip.material.opacity = .19 - i * .016;
      this.root.add(strip);
      this.foamStrips.push(strip);
    }
  }

  buildStreetProps() {
    const count = GRAPHICS_QUALITY.ultra.props;
    const roads = [-120, -60, 0, 60, 120];
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const road = roads[i % roads.length];
      const horizontal = i % 2 === 0;
      const along = -158 + seededValue(i, 20) * 316;
      const side = seededValue(i, 21) > .5 ? 1 : -1;
      group.position.set(horizontal ? along : road + side * 10.1, 0, horizontal ? road + side * 10.1 : along);
      group.rotation.y = horizontal ? 0 : Math.PI / 2;
      const type = i % 5;
      if (type === 0) {
        const bin = new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, 1.05, 10), new THREE.MeshStandardMaterial({ color: 0x253b36, roughness: .8, metalness: .25 }));
        bin.position.y = .53; group.add(bin);
      } else if (type === 1) {
        const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(.2, .27, .72, 10), new THREE.MeshStandardMaterial({ color: 0xd84d49, roughness: .46, metalness: .35 }));
        hydrant.position.y = .36; group.add(hydrant);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 6), hydrant.material); cap.position.y = .77; group.add(cap);
      } else if (type === 2) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(.28, .78, 12), new THREE.MeshStandardMaterial({ color: 0xff7d2c, roughness: .62 }));
        cone.position.y = .39; group.add(cone);
        const band = new THREE.Mesh(new THREE.TorusGeometry(.19, .035, 6, 16), emissiveMaterial(0xffffff, 1, .75)); band.rotation.x = Math.PI / 2; band.position.y = .42; group.add(band);
      } else if (type === 3) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(.7, .72, .45), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2e7ab8 : 0xc34465, roughness: .52, metalness: .3 }));
        box.position.y = .36; group.add(box);
      } else {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.7, 8), new THREE.MeshStandardMaterial({ color: 0x343a49, metalness: .5, roughness: .45 }));
        post.position.y = .85; group.add(post);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(.78, .48, .08), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x28a6c7 : 0xd95099, emissive: i % 2 ? 0x073b48 : 0x4d0d31, emissiveIntensity: 1.15, roughness: .25 }));
        sign.position.y = 1.55; group.add(sign);
      }
      group.visible = i < this.profile.props;
      this.root.add(group);
    }
  }

  buildLightPools() {
    const max = GRAPHICS_QUALITY.ultra.lightPools;
    const roads = [-120, -60, 0, 60, 120];
    for (let i = 0; i < max; i++) {
      const horizontal = i % 2 === 0;
      const road = roads[i % roads.length];
      const along = -150 + (i % 13) * 25;
      const pool = new THREE.Mesh(new THREE.CircleGeometry(4.8, 24), emissiveMaterial(i % 3 === 0 ? 0xff4fb7 : 0x58cfff, 1, .075));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(horizontal ? along : road + 8.4, .05, horizontal ? road + 8.4 : along);
      pool.visible = i < this.profile.lightPools;
      this.root.add(pool);
      this.lightPools.push(pool);
    }
  }

  emitShot(origin, direction, weapon = 'pistol') {
    if (!origin || !direction || this.profile.effects <= 0) return;
    const range = weapon === 'shotgun' ? 28 : weapon === 'smg' ? 45 : 55;
    const end = origin.clone().add(direction.clone().normalize().multiplyScalar(range));
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: weapon === 'shotgun' ? 0xffc28e : 0xfff4c7, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.root.add(line);
    this.effects.push({ object: line, life: weapon === 'smg' ? .055 : .09, maxLife: weapon === 'smg' ? .055 : .09, kind: 'fade' });
    const flash = new THREE.PointLight(0xffb36b, weapon === 'shotgun' ? 7 : 4, 11, 2);
    flash.position.copy(origin);
    this.root.add(flash);
    this.effects.push({ object: flash, life: .055, maxLife: .055, kind: 'light' });
    this.shake = Math.max(this.shake, weapon === 'shotgun' ? .22 : weapon === 'smg' ? .07 : .11);
    this.trimEffects();
  }

  emitImpact(position, intensity = 10) {
    if (!position || this.profile.effects <= 0) return;
    const count = clamp(Math.round(intensity * .45), 4, 18);
    for (let i = 0; i < count; i++) {
      const start = position.clone().add(new THREE.Vector3((this.random() - .5) * .8, .4 + this.random() * .7, (this.random() - .5) * .8));
      const end = start.clone().add(new THREE.Vector3((this.random() - .5) * 3, this.random() * 2.4, (this.random() - .5) * 3));
      const spark = new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), new THREE.LineBasicMaterial({ color: 0xffb33d, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.root.add(spark);
      this.effects.push({ object: spark, life: .14 + this.random() * .12, maxLife: .28, kind: 'fade' });
    }
    this.shake = Math.max(this.shake, clamp(intensity * .012, .08, .38));
    this.trimEffects();
  }

  trimEffects() {
    while (this.effects.length > this.profile.effects) {
      const effect = this.effects.shift();
      this.root.remove(effect.object);
      effect.object.geometry?.dispose?.();
      effect.object.material?.dispose?.();
    }
  }

  update(dt, { timeOfDay = 18, weather = 'CLEAR', playerPosition, activeVehicle, wanted = 0 } = {}) {
    this.time += dt;
    const target = activeVehicle?.mesh?.position || playerPosition;
    if (target) {
      this.fillLight.position.lerp(new THREE.Vector3(target.x - 3, target.y + 7, target.z + 3), clamp(dt * 5, 0, 1));
      this.rimLight.position.lerp(new THREE.Vector3(target.x + 2, target.y + 3, target.z - 2), clamp(dt * 7, 0, 1));
      this.dustOrigin.lerp(target, clamp(dt * 2, 0, 1));
      if (this.dust) this.dust.position.copy(this.dustOrigin);
    }
    const night = timeOfDay < 6.5 || timeOfDay > 18.2;
    const rain = weather === 'RAIN';
    this.fillLight.intensity = night ? .9 + wanted * .13 : .22;
    this.rimLight.intensity = night ? 1.2 + wanted * .18 : .18;
    this.rimLight.color.set(wanted > 1 && Math.sin(this.time * 8) > 0 ? 0x4d8cff : 0xff4fb7);

    const headlightEnabled = this.profile.headlights && night && !!activeVehicle && !activeVehicle.destroyed;
    this.headlight.intensity = headlightEnabled ? 6.5 : 0;
    if (headlightEnabled) {
      const vehicle = activeVehicle;
      const forward = new THREE.Vector3(-Math.sin(vehicle.rotation), 0, -Math.cos(vehicle.rotation));
      const right = new THREE.Vector3(Math.cos(vehicle.rotation), 0, -Math.sin(vehicle.rotation));
      this.headlight.position.copy(vehicle.mesh.position).addScaledVector(forward, 1.7).add(new THREE.Vector3(0, 1, 0));
      this.headlight.target.position.copy(vehicle.mesh.position).addScaledVector(forward, 24).addScaledVector(right, vehicle.steerAngle * 4).add(new THREE.Vector3(0, .25, 0));
    }

    this.puddles.forEach((puddle, index) => {
      const targetOpacity = rain ? .34 : weather === 'OVERCAST' ? .13 : .055;
      puddle.material.opacity = lerp(puddle.material.opacity, targetOpacity, clamp(dt * 2.5, 0, 1));
      puddle.material.color.setHSL(.57 + Math.sin(this.time * .2 + index) * .012, .28, night ? .25 : .38);
    });
    this.lightPools.forEach((pool, index) => {
      pool.material.opacity = lerp(pool.material.opacity, night ? .1 + Math.sin(this.time * 1.6 + index) * .012 : .012, clamp(dt * 3, 0, 1));
    });
    this.foamStrips.forEach((strip, index) => {
      strip.position.x = 174 + index * 3.2 + Math.sin(this.time * .45 + index * .7) * 1.25;
      strip.material.opacity = (.16 - index * .014) * (rain ? 1.55 : 1);
    });
    if (this.dust) {
      this.dust.material.opacity = rain ? .04 : night ? .18 : .28;
      const positions = this.dust.geometry.attributes.position.array;
      const activeCount = this.profile.particles;
      for (let i = 0; i < activeCount; i++) {
        const base = i * 3;
        positions[base] += Math.sin(this.time * .25 + i) * dt * .025;
        positions[base + 1] += dt * (.035 + (i % 7) * .002);
        if (positions[base + 1] > 28) positions[base + 1] = 1;
      }
      this.dust.geometry.setDrawRange(0, activeCount);
      this.dust.geometry.attributes.position.needsUpdate = true;
    }
    this.roadMaterials.forEach(material => {
      material.envMapIntensity = rain ? 1.8 : night ? 1.25 : .85;
    });

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.life -= dt;
      if (effect.object.material?.opacity !== undefined) effect.object.material.opacity = clamp(effect.life / effect.maxLife, 0, 1);
      if (effect.object.isLight) effect.object.intensity *= Math.pow(.02, dt);
      if (effect.life <= 0) {
        this.root.remove(effect.object);
        effect.object.geometry?.dispose?.();
        effect.object.material?.dispose?.();
        this.effects.splice(i, 1);
      }
    }

    if (this.camera && this.shake > .001) {
      this.camera.position.x += (this.random() - .5) * this.shake;
      this.camera.position.y += (this.random() - .5) * this.shake * .55;
      this.camera.position.z += (this.random() - .5) * this.shake;
      this.shake *= Math.pow(.025, dt);
    }
    if (this.renderer) this.renderer.toneMappingExposure = atmosphericExposure(timeOfDay, weather);
    if (this.scene?.fog?.isFogExp2) this.scene.fog.density = atmosphericFog(timeOfDay, weather);
  }
}
