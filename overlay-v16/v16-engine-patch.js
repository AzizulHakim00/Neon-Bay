export const V16_ENGINE_PATCHES = [
  {
    "before": "import { RADIO_STATIONS, DISTRICTS, districtAt, BUSINESS_DEFINITIONS, BusinessEmpire, CHAPTER_TWO_MISSIONS } from './modules/vice-coast.js';\nimport { GraphicsOverhaul } from './modules/graphics-overhaul.js';\n\nconst $ = (selector) => document.querySelector(selector);\n",
    "after": "import { RADIO_STATIONS, DISTRICTS, districtAt, BUSINESS_DEFINITIONS, BusinessEmpire, CHAPTER_TWO_MISSIONS } from './modules/vice-coast.js';\nimport { GraphicsOverhaul } from './modules/graphics-overhaul.js';\nimport { CinematicCityOverhaul, CINEMATIC_POST_SHADER } from './modules/cinematic-city-v16.js';\n\nconst $ = (selector) => document.querySelector(selector);\n"
  },
  {
    "before": "\nlet scene, camera, renderer, clock, player, playerVelocity, sun, hemi, rain, objectiveMarker;\nlet composer=null, bloomPass=null, oceanSurface=null, skyDome=null, sunDisc=null, visualOverhaul=null;\nconst actorLibrary = new ActorLibrary();\nlet playerActor, interiorSystem, dialogue, demoDirector, missionContact;\n",
    "after": "\nlet scene, camera, renderer, clock, player, playerVelocity, sun, hemi, rain, objectiveMarker;\nlet composer=null, bloomPass=null, cinematicPass=null, ssaoPass=null, fxaaPass=null, oceanSurface=null, skyDome=null, sunDisc=null, visualOverhaul=null, cinematicCity=null;\nconst actorLibrary = new ActorLibrary();\nlet playerActor, interiorSystem, dialogue, demoDirector, missionContact;\n"
  },
  {
    "before": "  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));\n  mesh.position.set(x, y, z);\n  mesh.castShadow = state.quality === 'high';\n  mesh.receiveShadow = true;\n  return mesh;\n",
    "after": "  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));\n  mesh.position.set(x, y, z);\n  mesh.castShadow = state.quality === 'high' || state.quality === 'ultra';\n  mesh.receiveShadow = true;\n  return mesh;\n"
  },
  {
    "before": "  oceanSurface.receiveShadow = true;\n  scene.add(oceanSurface);\n}\n\n",
    "after": "  oceanSurface.receiveShadow = true;\n  scene.add(oceanSurface);\n  cinematicCity?.registerOcean(oceanSurface);\n}\n\n"
  },
  {
    "before": "  if (globalThis.__NEON_BAY_TEST__ || state.quality === 'low') return;\n  try {\n    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([\n      import('three/addons/postprocessing/EffectComposer.js'),\n      import('three/addons/postprocessing/RenderPass.js'),\n      import('three/addons/postprocessing/UnrealBloomPass.js'),\n      import('three/addons/postprocessing/OutputPass.js'),\n    ]);\n    composer = new EffectComposer(renderer);\n    composer.addPass(new RenderPass(scene, camera));\n    bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'ultra' ? .92 : state.quality === 'high' ? .72 : .4, .68, .7);\n    composer.addPass(bloomPass);\n    composer.addPass(new OutputPass());\n    composer.setSize(innerWidth, innerHeight);\n  } catch (error) {\n    console.warn('Post-processing unavailable; using direct renderer.', error);\n",
    "after": "  if (globalThis.__NEON_BAY_TEST__ || state.quality === 'low') return;\n  try {\n    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { FXAAShader }, { SSAOPass }, { OutputPass }] = await Promise.all([\n      import('three/addons/postprocessing/EffectComposer.js'),\n      import('three/addons/postprocessing/RenderPass.js'),\n      import('three/addons/postprocessing/UnrealBloomPass.js'),\n      import('three/addons/postprocessing/ShaderPass.js'),\n      import('three/addons/shaders/FXAAShader.js'),\n      import('three/addons/postprocessing/SSAOPass.js'),\n      import('three/addons/postprocessing/OutputPass.js'),\n    ]);\n    composer = new EffectComposer(renderer);\n    composer.addPass(new RenderPass(scene, camera));\n    if (state.quality === 'high' || state.quality === 'ultra') {\n      ssaoPass = new SSAOPass(scene, camera, innerWidth, innerHeight);\n      ssaoPass.kernelRadius = state.quality === 'ultra' ? 13 : 9;\n      ssaoPass.minDistance = .002;\n      ssaoPass.maxDistance = .105;\n      composer.addPass(ssaoPass);\n    }\n    bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), state.quality === 'ultra' ? .82 : state.quality === 'high' ? .64 : .34, .62, .78);\n    composer.addPass(bloomPass);\n    cinematicPass = new ShaderPass(CINEMATIC_POST_SHADER);\n    composer.addPass(cinematicPass);\n    fxaaPass = new ShaderPass(FXAAShader);\n    composer.addPass(fxaaPass);\n    composer.addPass(new OutputPass());\n    composer.setSize(innerWidth, innerHeight);\n    cinematicCity?.installPostFX({ postPass: cinematicPass, ssaoPass, fxaaPass });\n  } catch (error) {\n    console.warn('Post-processing unavailable; using direct renderer.', error);\n"
  },
  {
    "before": "  group.traverse(o => { if (o.isMesh) { o.castShadow = state.quality === 'high' || state.quality === 'ultra'; o.receiveShadow = true; o.userData.player = true; } });\n  scene.add(group);\n  playerVelocity = new THREE.Vector3();\n  return group;\n",
    "after": "  group.traverse(o => { if (o.isMesh) { o.castShadow = state.quality === 'high' || state.quality === 'ultra'; o.receiveShadow = true; o.userData.player = true; } });\n  scene.add(group);\n  cinematicCity?.registerActor(group, 'player');\n  playerVelocity = new THREE.Vector3();\n  return group;\n"
  },
  {
    "before": "    attachVehicleDamage(this);\n    visualOverhaul?.registerVehicle(this);\n    scene.add(this.mesh);\n    vehicles.push(this);\n",
    "after": "    attachVehicleDamage(this);\n    visualOverhaul?.registerVehicle(this);\n    cinematicCity?.registerVehicle(this);\n    scene.add(this.mesh);\n    vehicles.push(this);\n"
  },
  {
    "before": "    this.group.position.set(x, 0, z);\n    scene.add(this.group);\n    if (this.passive) pedestrians.push(this); else enemies.push(this);\n  }\n",
    "after": "    this.group.position.set(x, 0, z);\n    scene.add(this.group);\n    cinematicCity?.registerActor(this.group, this.role);\n    if (this.passive) pedestrians.push(this); else enemies.push(this);\n  }\n"
  },
  {
    "before": "\n  visualOverhaul = new GraphicsOverhaul({ scene, camera, renderer, quality: state.quality, random, testMode: !!globalThis.__NEON_BAY_TEST__ }).build();\n\n  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), material(0x314b3b, 1));\n  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);\n\n  const beach = new THREE.Mesh(new THREE.PlaneGeometry(45, 360), material(0xc7a86f, 1));\n  beach.rotation.x = -Math.PI / 2; beach.position.set(157, .015, 0); beach.receiveShadow = true; scene.add(beach);\n  buildSkyDome();\n  buildOceanSurface();\n",
    "after": "\n  visualOverhaul = new GraphicsOverhaul({ scene, camera, renderer, quality: state.quality, random, testMode: !!globalThis.__NEON_BAY_TEST__ }).build();\n  cinematicCity = new CinematicCityOverhaul({ scene, camera, renderer, quality: state.quality, random, testMode: !!globalThis.__NEON_BAY_TEST__ }).build();\n  cinematicCity.configureLights(sun, hemi);\n\n  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), material(0x314b3b, 1));\n  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground); cinematicCity?.registerGround(ground.material, 'ground');\n\n  const beach = new THREE.Mesh(new THREE.PlaneGeometry(45, 360), material(0xc7a86f, 1));\n  beach.rotation.x = -Math.PI / 2; beach.position.set(157, .015, 0); beach.receiveShadow = true; scene.add(beach); cinematicCity?.registerGround(beach.material, 'beach');\n  buildSkyDome();\n  buildOceanSurface();\n"
  },
  {
    "before": "\nfunction buildRoads() {\n  const roadMat = material(0x232733, .96); roadMat.metalness=.08; roadMaterials.push(roadMat); visualOverhaul?.registerRoadMaterial(roadMat);\n  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd76b });\n  for (const c of CONFIG.roadCenters) {\n",
    "after": "\nfunction buildRoads() {\n  const roadMat = material(0x232733, .96); roadMat.metalness=.08; roadMaterials.push(roadMat); visualOverhaul?.registerRoadMaterial(roadMat); cinematicCity?.registerRoadMaterial(roadMat);\n  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd76b });\n  for (const c of CONFIG.roadCenters) {\n"
  },
  {
    "before": "\nfunction addWindows(building, w, h, d, seed) {\n  const countY = Math.max(1, Math.floor(h / 5));\n  const countX = Math.max(2, Math.floor(w / 4));\n",
    "after": "\nfunction addWindows(building, w, h, d, seed) {\n  if (cinematicCity) { cinematicCity.registerBuilding(building, { w, h, d, seed }); return; }\n  const countY = Math.max(1, Math.floor(h / 5));\n  const countX = Math.max(2, Math.floor(w / 4));\n"
  },
  {
    "before": "  player.visible = true;\n  updateMissionObjective(true);\n  saveGame(true);\n}\n",
    "after": "  player.visible = true;\n  updateMissionObjective(true);\n  cinematicCity?.beginMission(state.currentMission, MISSIONS[state.currentMission].title);\n  saveGame(true);\n}\n"
  },
  {
    "before": "  updateBusinessEmpire(dt);\n  visualOverhaul?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted});\n}\n\n",
    "after": "  updateBusinessEmpire(dt);\n  visualOverhaul?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted});\n  cinematicCity?.update(dt,{timeOfDay:state.timeOfDay,weather:state.weather,playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted,mission:state.currentMission,cinematic:state.cinematic,health:state.health});\n}\n\n"
  },
  {
    "before": "  const ratio=value==='ultra'?Math.min(devicePixelRatio,2.25):value==='high'?Math.min(devicePixelRatio,2):value==='medium'?Math.min(devicePixelRatio,1.35):1;\n  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n  renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='ultra'?.92:value==='high'?.72:value==='medium'?.4:0;visualOverhaul?.setQuality(value);\n}\n\nfunction bindEvents() {\n  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);});\n  addEventListener('keydown',e=>{\n    input.keys.add(e.code);\n",
    "after": "  const ratio=value==='ultra'?Math.min(devicePixelRatio,2.25):value==='high'?Math.min(devicePixelRatio,2):value==='medium'?Math.min(devicePixelRatio,1.35):1;\n  renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n  renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);if(bloomPass)bloomPass.strength=value==='ultra'?.82:value==='high'?.64:value==='medium'?.34:0;visualOverhaul?.setQuality(value);cinematicCity?.setQuality(value);cinematicCity?.resize(innerWidth,innerHeight);\n}\n\nfunction bindEvents() {\n  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);composer?.setSize(innerWidth,innerHeight);cinematicCity?.resize(innerWidth,innerHeight);});\n  addEventListener('keydown',e=>{\n    input.keys.add(e.code);\n"
  }
];
