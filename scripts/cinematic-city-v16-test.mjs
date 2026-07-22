import * as THREE from 'three';
import { CITY_QUALITY, cityProfile, CINEMATIC_POST_SHADER, CinematicCityOverhaul } from '../src/modules/cinematic-city-v16.js';

if (cityProfile('ultra').windows <= cityProfile('high').windows) throw new Error('Ultra must increase living windows');
if (cityProfile('unknown') !== CITY_QUALITY.high) throw new Error('Unknown quality must fall back to high');
if (!CINEMATIC_POST_SHADER.uniforms.vignette || !CINEMATIC_POST_SHADER.uniforms.chroma) throw new Error('Cinematic shader uniforms missing');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const system = new CinematicCityOverhaul({ scene, camera, quality: 'medium', testMode: true }).build();
if (!scene.children.includes(system.root)) throw new Error('Cinematic city root missing');
if (system.decals.length < 100) throw new Error('Road detail pool was not created');
if (system.clouds.length !== CITY_QUALITY.ultra.clouds) throw new Error('Cloud pool does not match Ultra profile');

const sun = new THREE.DirectionalLight();
const hemi = new THREE.HemisphereLight();
system.configureLights(sun, hemi);
system.setQuality('ultra');
if (sun.shadow.mapSize.width !== CITY_QUALITY.ultra.shadow) throw new Error('Ultra shadow profile was not applied');

const building = new THREE.Mesh(new THREE.BoxGeometry(14, 20, 12), new THREE.MeshStandardMaterial());
system.registerBuilding(building, { w: 14, h: 20, d: 12, seed: 9 });
if (!system.windowEntries.length) throw new Error('Living windows were not created');

const vehicle = { mesh: new THREE.Group(), speed: 0, steerAngle: 0, rotation: 0, braking: false, engineHealth: 100 };
system.registerVehicle(vehicle);
if (!system.vehicleKits.has(vehicle)) throw new Error('Vehicle visual kit missing');

system.update(.016, { timeOfDay: 22, weather: 'RAIN', playerPosition: new THREE.Vector3(), activeVehicle: vehicle, wanted: 2, mission: 7, health: 55 });
if (system.wetness <= 0) throw new Error('Weather wetness did not begin transitioning');

console.log(JSON.stringify({ cinematicCity: 'ok', profiles: Object.keys(CITY_QUALITY), decals: system.decals.length, clouds: system.clouds.length, windows: system.windowEntries.length }, null, 2));
