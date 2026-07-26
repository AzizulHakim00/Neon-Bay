import { readFile, writeFile, mainPath, replaceOnce, replaceSection } from './v17-patch-utils.mjs';
let source = await readFile(mainPath, 'utf8');

const shootFunction = `function shoot() {
  if(!state.running||state.paused||state.activeVehicle||state.reloading||state.cinematic)return;
  const weapon=WEAPONS[state.weapon]; const now=performance.now(); if(now-lastShotAt<weapon.cooldown)return; lastShotAt=now;
  if(state.ammo<=0){audio.tone(120,.05,'square',.06);notify('Weapon empty. Press R to reload.',1.5);return;}
  state.ammo--; progression.record('shotsFired'); livingCityV17.registerPlayerShot(); audio.shot();
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera); visualOverhaul?.emitShot(camera.position.clone(),raycaster.ray.direction.clone(),state.weapon);
  const moving=Math.abs(inputAxis('forward'))>.12||Math.abs(inputAxis('turn'))>.12;
  const spread=livingCityV17.playerSpread({baseSpread:weapon.spread,moving,sprinting:input.keys.has('ShiftLeft')||input.keys.has('ShiftRight'),airborne:player.position.y>.12,weapon:state.weapon});
  cameraPitch=clamp(cameraPitch+(state.weapon==='shotgun'?.042:state.weapon==='smg'?.008:.015),-.75,.32);
  if(state.weapon==='shotgun')audio.noise(.16,.3); playerActor?.playOneShot('Shoot',state.weapon==='shotgun'?.42:.28);
  const targets=[]; [...enemies,...pedestrians].filter(entity=>entity.alive).forEach(entity=>entity.group.traverse(object=>{if(object.isMesh)targets.push(object);}));
  const damaged=new Map();
  for(let pellet=0;pellet<weapon.pellets;pellet++){
    const aim=new THREE.Vector2((random()-.5)*spread,(random()-.5)*spread); raycaster.setFromCamera(aim,camera);
    const hit=raycaster.intersectObjects(targets,false)[0];
    if(hit&&hit.distance<(state.weapon==='shotgun'?48:95)){
      const entity=hit.object.userData.entity; if(!entity)continue;
      const zone=hitZoneFromIntersection(entity,hit); const zoneMultiplier=zone==='head'?1.85:zone==='limb'?.72:1;
      const record=damaged.get(entity)||{damage:0,zone:'limb'}; record.damage+=weapon.damage*zoneMultiplier;
      if(zone==='head'||(zone==='body'&&record.zone==='limb'))record.zone=zone; damaged.set(entity,record);
    }
  }
  damaged.forEach((record,entity)=>{
    progression.record('hits'); const result=entity.takeDamage(entity.boss?record.damage*.72:record.damage,false,{zone:record.zone,preScaled:true});
    const feedback=livingCityV17.registerHit({zone:record.zone,damage:result.damage,killed:result.killed});
    showV17CombatFeedback({...feedback,damage:result.damage});
  });
  state.weaponData[state.weapon].ammo=state.ammo; lastGunshotPosition=getPlayerPosition().clone(); lastGunshotAt=worldTime; raiseWanted('gunfire',state.wanted||1);
}

`;
source = replaceSection(source, 'function shoot() {', 'function shoot() {', 'function reload() {', shootFunction, 'combat ballistics');

const damagePlayerFunction = `function damagePlayer(amount, sourcePosition = null) {
  if(!state.running||state.gameOver)return;
  let remaining=amount;
  if(state.armor>0){const absorbed=Math.min(state.armor,remaining*.7);state.armor-=absorbed;remaining-=absorbed;}
  state.health=Math.max(0,state.health-remaining); livingCityV17.registerDamage(amount);
  if(dom.v17DamageFlash){dom.v17DamageFlash.classList.remove('active');void dom.v17DamageFlash.offsetWidth;dom.v17DamageFlash.classList.add('active');v17DamageTimer=.45;}
  if(sourcePosition){const direction=tmpV.copy(sourcePosition).sub(getPlayerPosition());const relative=Math.atan2(direction.x,direction.z)-cameraYaw;dom.v17DamageFlash?.style.setProperty('--damage-angle',String(relative)+'rad');}
  if(state.health<=0)failMission('You were taken down.');
}

`;
source = replaceSection(source, 'function damagePlayer(', 'function damagePlayer(amount) {', 'function updateHUD() {', damagePlayerFunction, 'damage feedback');

source = source.replaceAll('wantedProfile(', 'wantedProfileV17(');
source = replaceOnce(
  source,
  "  dom.wanted.textContent=Array.from({length:3},(_,i)=>i<state.wanted?'★':'☆').join(' ');\n  if(dom.wantedStatus)dom.wantedStatus.textContent=wantedProfileV17(state.wanted).label;",
  "  dom.wanted.textContent=Array.from({length:5},(_,i)=>i<state.wanted?'★':'☆').join(' ');\n  dom.wanted.closest('.wanted-card')?.setAttribute('data-level',String(state.wanted));\n  if(dom.wantedStatus)dom.wantedStatus.textContent=wantedProfileV17(state.wanted).label;",
  'five-star HUD',
);

source = replaceOnce(
  source,
  "  if(dom.vehicleDiagnostics){const v=state.activeVehicle;dom.vehicleDiagnostics.classList.toggle('hidden',!v);if(v){dom.engineText.textContent=Math.ceil(v.engineHealth);dom.bodyText.textContent=Math.ceil(v.bodyHealth);dom.tiresText.textContent=Math.ceil(v.tireHealth);}}",
  "  if(dom.vehicleDiagnostics){const v=state.activeVehicle;dom.vehicleDiagnostics.classList.toggle('hidden',!v);if(v){dom.engineText.textContent=Math.ceil(v.engineHealth);dom.bodyText.textContent=Math.ceil(v.bodyHealth);dom.tiresText.textContent=Math.ceil(v.tireHealth);dom.vehicleDiagnostics.dataset.condition=livingCityV17.vehicleCondition(v);}}",
  'vehicle HUD condition',
);

source = replaceOnce(
  source,
  "      wantedSpawnTimer=clamp(13-state.wanted*2.1,4.5,10);",
  "      wantedSpawnTimer=clamp(12-state.wanted*1.55,3.2,9.5);",
  'wanted response cadence',
);
source = replaceOnce(
  source,
  "    state.wantedHeat-=dt;wantedSpawnTimer-=dt;state.wantedLastKnown.copy(getPlayerPosition());",
  "    state.wantedHeat-=dt;wantedSpawnTimer-=dt;",
  'last-known police search',
);
source = replaceOnce(
  source,
  "      if(activePolice<profile.officers){const a=rand(0,Math.PI*2),r=rand(24,42);new CharacterAI(pos.x+Math.cos(a)*r,pos.z+Math.sin(a)*r,{police:true,health:82,role:'police'});}",
  "      if(activePolice<profile.officers){const a=rand(0,Math.PI*2),r=rand(24,42);new CharacterAI(pos.x+Math.cos(a)*r,pos.z+Math.sin(a)*r,{police:true,health:state.wanted>=4?110:82,role:'police',tactical:state.wanted>=4,archetype:state.wanted>=4?'tactical':'patrol'});}",
  'tactical police',
);
source = replaceOnce(source, '  if(roadblocks.length>=2)return;', '  if(roadblocks.length>=Math.min(4,Math.ceil(state.wanted/1.5)))return;', 'roadblock scaling');
source = replaceOnce(
  source,
  "    const police=enemies.filter(e=>e.police&&e.alive);\n    const nearestPolice=Math.min(999,...police.map(e=>e.group.position.distanceTo(getPlayerPosition())));",
  "    const police=enemies.filter(e=>e.police&&e.alive);\n    const nearestPolice=Math.min(999,...police.map(e=>e.group.position.distanceTo(getPlayerPosition())));\n    livingCityV17.decayCrime(dt,{observed:nearestPolice<46,wanted:state.wanted});",
  'crime decay',
);
source = replaceOnce(
  source,
  "      state.wanted--;state.wantedHeat=state.wanted>0?wantedProfileV17(state.wanted).heat*.45:0;",
  "      state.wanted--;livingCityV17.capCrimeForWanted(state.wanted);state.wantedHeat=state.wanted>0?wantedProfileV17(state.wanted).heat*.45:0;",
  'wanted de-escalation',
);

source = replaceOnce(
  source,
  "  const data={version:4,currentMission:state.currentMission,missionStep:state.missionStep,cash:state.cash,health:state.health,armor:state.armor,weapon:state.weapon,weaponData:state.weaponData,ownedWeapons:{...state.ownedWeapons},timeOfDay:state.timeOfDay,position:{x:p.x,z:p.z},chapterComplete:state.chapterComplete,storyComplete:state.storyComplete,firstRideCinematicSeen:state.firstRideCinematicSeen,progression:progression.serialize(),businessEmpire:businessEmpire.serialize(),vehicleUpgrades:{...state.vehicleUpgrades},territoryControl:{...state.territoryControl},radioStation:state.radioStation,outfitIndex:state.outfitIndex};",
  "  const data={version:4,currentMission:state.currentMission,missionStep:state.missionStep,cash:state.cash,health:state.health,armor:state.armor,weapon:state.weapon,weaponData:state.weaponData,ownedWeapons:{...state.ownedWeapons},timeOfDay:state.timeOfDay,position:{x:p.x,z:p.z},chapterComplete:state.chapterComplete,storyComplete:state.storyComplete,firstRideCinematicSeen:state.firstRideCinematicSeen,progression:progression.serialize(),businessEmpire:businessEmpire.serialize(),livingCityV17:livingCityV17.serialize(),vehicleUpgrades:{...state.vehicleUpgrades},territoryControl:{...state.territoryControl},radioStation:state.radioStation,outfitIndex:state.outfitIndex};",
  'v1.7 save data',
);
source = replaceOnce(
  source,
  "    progression=new ProgressionSystem(d.progression||{});businessEmpire=new BusinessEmpire(d.businessEmpire||{});state.vehicleUpgrades=",
  "    progression=new ProgressionSystem(d.progression||{});businessEmpire=new BusinessEmpire(d.businessEmpire||{});livingCityV17.reset(d.livingCityV17||{});state.vehicleUpgrades=",
  'v1.7 save load',
);
source = replaceOnce(
  source,
  "  progression=new ProgressionSystem();businessEmpire=new BusinessEmpire();audio.setRadio(0,false);",
  "  progression=new ProgressionSystem();businessEmpire=new BusinessEmpire();livingCityV17.reset();audio.setRadio(0,false);",
  'v1.7 new game reset',
);

source = replaceOnce(
  source,
  "function getPlayerPosition(){return state.activeVehicle?state.activeVehicle.mesh.position:player.position;}\n",
  `function getPlayerPosition(){return state.activeVehicle?state.activeVehicle.mesh.position:player.position;}

globalThis.__NEON_BAY_V17__={
  version:GAMEPLAY_VERSION,
  snapshot:()=>livingCityV17.snapshot({wanted:state.wanted,wantedLabel:wantedProfileV17(state.wanted).label,enemyCount:enemies.filter(entity=>entity.alive).length,civilianCount:pedestrians.filter(entity=>entity.alive).length,archetypes:[...new Set(enemies.filter(entity=>entity.alive).map(entity=>entity.archetype).filter(Boolean))],vehicleConditions:vehicles.filter(vehicle=>!vehicle.destroyed).slice(0,6).map(vehicle=>livingCityV17.vehicleCondition(vehicle))}),
  forceCrime:(reason='gunfire',times=1)=>{for(let index=0;index<Math.max(1,times);index+=1)raiseWanted(reason,0);return state.wanted;},
  spawnEncounter:(count=4)=>{spawnEnemiesAround(getPlayerPosition().clone().add(new THREE.Vector3(12,0,12)),count,false);return enemies.filter(entity=>entity.alive).slice(-count).map(entity=>entity.archetype);},
  damageVehicle:(amount=80)=>{const vehicle=state.activeVehicle||nearestVehicle();if(!vehicle)return null;applyVehicleImpact(vehicle,amount,'front');return{health:vehicle.health,condition:livingCityV17.vehicleCondition(vehicle)};},
};
`,
  'test hooks',
);

source = replaceOnce(
  source,
  "    dialogue?.update(dt);updatePlayer(dt);updateAI(dt);updateCamera(dt);updateMission(dt);updateSideActivity(dt);updateWanted(dt);updateWorld(dt);updateInteractions();updateNotification(dt);updateHUD();drawMinimap();",
  "    dialogue?.update(dt);updatePlayer(dt);updateAI(dt);updateCamera(dt);updateMission(dt);updateSideActivity(dt);updateWanted(dt);updateWorld(dt);updateV17Systems(dt);updateInteractions();updateNotification(dt);updateHUD();drawMinimap();",
  'runtime v1.7 update',
);
source = replaceOnce(
  source,
  "  } else if(scene){dialogue?.update(dt);updateCamera(dt);updateWorld(dt*.18);updateNotification(dt);drawMinimap();}",
  "  } else if(scene){dialogue?.update(dt);updateCamera(dt);updateWorld(dt*.18);updateV17Systems(dt*.18);updateNotification(dt);drawMinimap();}",
  'idle v1.7 update',
);

await writeFile(mainPath, source, 'utf8');
console.log('Applied Neon Bay v1.7 combat, save and runtime hooks.');
