import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NEON_CITIZEN_GLB_DATA } from '../assets/neon-citizen-data.js';

const DEFAULT_MODEL = globalThis.__NB_MODEL_DATA__ || NEON_CITIZEN_GLB_DATA;

function cloneMaterials(root) {
  root.traverse(object => {
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(material => material.clone())
      : object.material.clone();
    object.castShadow = true;
    object.receiveShadow = true;
  });
}

function tintActor(root, palette = {}) {
  root.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const name = object.material.name;
    if (name === 'Shirt' && palette.shirt != null) object.material.color.setHex(palette.shirt);
    if (name === 'Pants' && palette.pants != null) object.material.color.setHex(palette.pants);
    if (name === 'Skin' && palette.skin != null) object.material.color.setHex(palette.skin);
    if (name === 'Accent' && palette.accent != null) {
      object.material.color.setHex(palette.accent);
      object.material.emissive?.setHex(palette.accent);
    }
  });
}

function fallbackActor(THREERef = THREE) {
  const root = new THREERef.Group();
  const material = color => new THREERef.MeshStandardMaterial({ color, roughness: .72 });
  const box = (name, size, color, position) => {
    const mesh = new THREERef.Mesh(new THREERef.BoxGeometry(...size), material(color));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  };
  box('FallbackLegs', [.6,.85,.4], 0x14213a, [0,.43,0]);
  box('FallbackTorso', [.9,1,.48], 0xf13e9b, [0,1.25,0]);
  box('FallbackHead', [.55,.6,.52], 0xa9684f, [0,2.05,0]);
  return root;
}

export class ActorLibrary {
  constructor({ url = DEFAULT_MODEL } = {}) {
    this.url = url;
    this.template = null;
    this.clips = [];
    this.loadError = null;
  }

  async preload() {
    if (this.template || this.loadError) return;
    try {
      const gltf = await new GLTFLoader().loadAsync(this.url);
      this.template = gltf.scene;
      this.clips = gltf.animations;
    } catch (error) {
      this.loadError = error;
      console.warn('Animated GLB unavailable; using lightweight fallback actor.', error?.message || error);
    }
  }

  create({ palette = {}, scale = 1, entity = null } = {}) {
    const root = this.template ? this.template.clone(true) : fallbackActor();
    cloneMaterials(root);
    tintActor(root, palette);
    root.scale.setScalar(scale);
    root.traverse(object => {
      if (object.isMesh) {
        object.userData.entity = entity;
        object.userData.actorMesh = true;
      }
    });

    const mixer = this.template ? new THREE.AnimationMixer(root) : null;
    const actions = new Map();
    if (mixer) {
      for (const clip of this.clips) {
        const action = mixer.clipAction(clip);
        action.enabled = true;
        action.clampWhenFinished = clip.name === 'Shoot';
        actions.set(clip.name, action);
      }
    }
    const controller = new ActorController(root, mixer, actions);
    controller.setAction('Idle', .01);
    return controller;
  }
}

export class ActorController {
  constructor(root, mixer, actions) {
    this.root = root;
    this.mixer = mixer;
    this.actions = actions;
    this.current = null;
    this.oneShotTimer = 0;
    this.weaponNode = root.getObjectByName('Weapon');
  }

  setEntity(entity) {
    this.root.traverse(object => { if (object.isMesh) object.userData.entity = entity; });
  }

  setAction(name, fade = .16) {
    if (!this.mixer || this.current === name || this.oneShotTimer > 0) return;
    const next = this.actions.get(name) || this.actions.get('Idle');
    if (!next) return;
    const current = this.current ? this.actions.get(this.current) : null;
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(fade).play();
    current?.fadeOut(fade);
    this.current = next.getClip().name;
  }

  playOneShot(name, duration = .3) {
    if (!this.mixer) return;
    const action = this.actions.get(name);
    if (!action) return;
    const current = this.current ? this.actions.get(this.current) : null;
    current?.fadeOut(.05);
    action.reset().setLoop(THREE.LoopOnce, 1).fadeIn(.03).play();
    this.current = name;
    this.oneShotTimer = duration;
  }

  setWeapon(type) {
    if (!this.weaponNode) return;
    if (type === 'shotgun') {
      this.weaponNode.scale.set(.12,.1,.72);
      this.weaponNode.position.z = -.43;
    } else if (type === 'smg') {
      this.weaponNode.scale.set(.1,.1,.52);
      this.weaponNode.position.z = -.31;
    } else {
      this.weaponNode.scale.set(.08,.08,.42);
      this.weaponNode.position.z = -.27;
    }
  }

  update(dt, desired = 'Idle') {
    if (this.mixer) this.mixer.update(dt);
    if (this.oneShotTimer > 0) {
      this.oneShotTimer -= dt;
      if (this.oneShotTimer <= 0) {
        this.current = null;
        this.setAction(desired, .08);
      }
    } else this.setAction(desired);
  }
}

export const ACTOR_PALETTES = {
  player: { shirt: 0xf13e9b, pants: 0x10182d, skin: 0xa86b50, accent: 0x2de5ff },
  police: { shirt: 0x235fc7, pants: 0x10182d, skin: 0x8c5b44, accent: 0x62a9ff },
  enemy: { shirt: 0x7d2449, pants: 0x202238, skin: 0x996047, accent: 0xff365f },
  boss: { shirt: 0xc99d26, pants: 0x141522, skin: 0x8d563e, accent: 0xffd85a },
  civilians: [
    { shirt: 0xea9141, pants: 0x252842, skin: 0xa96d52, accent: 0x65f2be },
    { shirt: 0x35bc8d, pants: 0x26243d, skin: 0x87513d, accent: 0xff80d0 },
    { shirt: 0x8558d8, pants: 0x16243b, skin: 0xb97c60, accent: 0x54e5ff },
    { shirt: 0xd05c66, pants: 0x1a2130, skin: 0x704434, accent: 0xffcf58 },
  ]
};
