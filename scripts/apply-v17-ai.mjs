import { readFile, writeFile, mainPath, replaceOnce, replaceSection } from './v17-patch-utils.mjs';
let source = await readFile(mainPath, 'utf8');

source = replaceOnce(
  source,
  "    this.fleeTimer = 0;\n    const civilianPalette",
  "    this.fleeTimer = 0;\n    livingCityV17?.configureCharacter(this, options);\n    const civilianPalette",
  'character archetypes',
);

const characterUpdate = `  update(dt) {
    if (!this.alive) return;
    if (this.passive) return this.updateWander(dt);
    const target = getPlayerPosition();
    const distance = this.group.position.distanceTo(target);
    const sightRange = this.police ? (state.wanted >= 4 ? 92 : 78) : this.archetype === 'marksman' ? 78 : 64;
    const canSee = !state.currentInterior && distance < sightRange && hasLineOfSightV17(this.group.position, target);
    const heardGunshot = !!lastGunshotPosition && worldTime - lastGunshotAt < 8 && this.group.position.distanceTo(lastGunshotPosition) < (this.combatProfile?.hearing || 58);
    if (this.police && canSee) state.wantedLastKnown.copy(target);
    if (canSee) {
      this.aiState = 'engage'; this.searchTimer = this.boss ? 10 : 7; this.lastSeen.copy(target);
    } else if (heardGunshot) {
      this.aiState = 'investigate'; this.searchTimer = 7; this.lastSeen.copy(lastGunshotPosition);
    } else if (this.aiState !== 'patrol') {
      this.searchTimer -= dt; this.aiState = this.searchTimer > 0 ? 'search' : 'patrol';
    }
    if (this.aiState === 'patrol') { this.actor.update(dt, 'Idle'); return; }

    const decision = livingCityV17.enemyDecision(this, {
      distance, canSee, heardGunshot, wanted: state.wanted, playerInVehicle: !!state.activeVehicle, dt,
    });
    const destination = this.aiState === 'search' || this.aiState === 'investigate' ? this.lastSeen : target;
    let moveTarget = destination;
    if (decision.tactic === 'retreat') {
      const away = tmpV.copy(this.group.position).sub(target).setY(0).normalize();
      moveTarget = this.group.position.clone().addScaledVector(away, 13);
    } else if (decision.tactic === 'flank') {
      const toward = tmpV.copy(target).sub(this.group.position).setY(0).normalize();
      const side = new THREE.Vector3(-toward.z, 0, toward.x).multiplyScalar(this.flankSign * decision.desiredDistance * .72);
      moveTarget = target.clone().add(side);
    } else if (decision.tactic === 'cover') {
      if (!this.coverPoint || this.group.position.distanceTo(this.coverPoint) < 1 || this.coverPoint.distanceTo(target) < 5) this.coverPoint = this.chooseCover(target);
      if (this.coverPoint) moveTarget = this.coverPoint;
    }

    const moveDistance = this.group.position.distanceTo(moveTarget);
    const holdDistance = decision.tactic === 'rush' ? 1.8 : decision.tactic === 'advance' ? decision.desiredDistance : 1.25;
    if (!canSee || (decision.tactic !== 'suppress' && moveDistance > holdDistance)) {
      const speedFactor = decision.tactic === 'retreat' ? 1.22 : decision.tactic === 'flank' ? 1.12 : 1;
      this.moveToward(moveTarget, dt, this.speed * speedFactor); this.actor.update(dt, decision.tactic === 'investigate' ? 'Walk' : 'Run');
    } else {
      const offset = tmpV.copy(target).sub(this.group.position); this.group.rotation.y = Math.atan2(offset.x, offset.z); this.actor.update(dt, canSee ? 'Aim' : 'Idle');
    }

    this.shootCooldown -= dt;
    if (canSee && distance < (this.boss ? 48 : this.archetype === 'marksman' ? 54 : 36) && this.shootCooldown <= 0) {
      const playerMoving = Math.abs(inputAxis('forward')) > .18 || Math.abs(inputAxis('turn')) > .18 || (state.activeVehicle && Math.abs(state.activeVehicle.speed) > 4);
      const shot = livingCityV17.enemyShot(this, { distance, playerMoving, playerInVehicle: !!state.activeVehicle, wanted: state.wanted });
      if (random() <= shot.hitChance) damagePlayer(shot.damage, this.group.position);
      else if (distance < 24) livingCityV17.registerDamage(1.5);
      audio.tone(this.police ? 320 : this.archetype === 'marksman' ? 210 : 260, .07, 'square', .06, -100);
      this.actor.playOneShot('Shoot', .26); this.shootCooldown = shot.cooldown * rand(.88, 1.18);
    }
  }

`;
source = replaceSection(source, 'class CharacterAI {', '  update(dt) {', '  moveToward(target, dt, speed) {', characterUpdate, 'character AI state machine');

source = replaceOnce(
  source,
  "    const danger=lastGunshotPosition&&worldTime-lastGunshotAt<9&&this.group.position.distanceTo(lastGunshotPosition)<42;\n    if(danger){\n      this.fleeTimer=4.5;\n      this.reportTimer+=dt;\n      const away=tmpV.copy(this.group.position).sub(lastGunshotPosition).normalize();\n      const destination=this.group.position.clone().addScaledVector(away,14);\n      this.moveToward(destination,dt,this.speed*2.25);\n      this.actor.update(dt,'Run');\n      if(this.reportTimer>1.35&&!this.reportedCrime){this.reportedCrime=true;raiseWanted('witness',1);notify('A civilian reported the gunfire.',1.8);}\n      return;\n    }",
  "    const crimePosition=lastGunshotPosition||livingCityV17.lastCrime?.position;\n    const crimeAge=lastGunshotPosition?worldTime-lastGunshotAt:999;\n    if(crimeAge>18)this.reportedCrime=false;\n    const policeNearby=enemies.some(entity=>entity.police&&entity.alive&&entity.group.position.distanceTo(this.group.position)<22);\n    const reaction=livingCityV17.civilianReaction(this,{crimePosition,crimeAge,wanted:state.wanted,playerDistance:this.group.position.distanceTo(getPlayerPosition()),policeNearby});\n    if(reaction.action==='flee'||reaction.action==='cower'){\n      this.fleeTimer=4.5;this.reportTimer+=dt;\n      if(reaction.action==='flee'&&crimePosition){const away=tmpV.copy(this.group.position).sub(crimePosition).setY(0).normalize();const destination=this.group.position.clone().addScaledVector(away,14);this.moveToward(destination,dt,this.speed*reaction.speed);this.actor.update(dt,'Run');}\n      else this.actor.update(dt,'Cower');\n      if(reaction.report){this.reportedCrime=true;raiseWanted('witness',1);notify('Witness report received by police dispatch.',1.8);}\n      return;\n    }",
  'civilian witness network',
);

const takeDamage = `  takeDamage(amount, vehicleHit = false, hitInfo = {}) {
    if (!this.alive) return { killed: false, zone: hitInfo.zone || 'body', damage: 0 };
    const zone = hitInfo.zone || 'body';
    const multiplier = hitInfo.preScaled ? 1 : zone === 'head' ? 1.85 : zone === 'limb' ? .72 : 1;
    const applied = Math.max(0, amount * multiplier);
    this.health -= applied; this.suppression = Math.min(.55, (this.suppression || 0) + applied / 130);
    audio.hit(); flashMesh(this.group, zone === 'head' ? 0xffd45b : 0xffffff);
    if (!this.passive && !this.police) raiseWanted('assault',1);
    if (this.passive) { raiseWanted('civilian',2); this.passive = false; }
    if (this.health > 0) this.actor.playOneShot('Cower', .16);
    const killed = this.health <= 0;
    if (killed) this.die(vehicleHit);
    return { killed, zone, damage: applied };
  }
`;
source = replaceSection(source, 'class CharacterAI {', '  takeDamage(amount, vehicleHit = false) {', '  die() {', takeDamage, 'hit zones and reactions');

source = replaceOnce(
  source,
  "function raiseWanted(reason='crime',minimum=1){\n  const previous=state.wanted;\n  state.wanted=clamp(Math.max(state.wanted,minimum),0,3);\n  const profile=wantedProfile(state.wanted);\n  state.wantedHeat=Math.max(state.wantedHeat,profile.heat);\n  state.wantedLastKnown.copy(getPlayerPosition());\n  if(state.wanted>previous)notify(`${profile.label}: police response upgraded.`,2.2);\n  if(reason==='gunfire')state.wantedHeat=Math.max(state.wantedHeat,18);\n}",
  "function raiseWanted(reason='crime',minimum=1){\n  const previous=state.wanted;\n  const result=livingCityV17.registerCrime(reason,minimum,getPlayerPosition(),state.wanted);\n  state.wanted=result.level;state.wantedHeat=Math.max(state.wantedHeat,result.heat);state.wantedLastKnown.copy(getPlayerPosition());\n  if(state.wanted>previous)notify(`${result.profile.label}: ${result.profile.response}.`,2.2);\n}",
  'five-star wanted escalation',
);

source = replaceOnce(
  source,
  "  state.arrestProgress=0;state.wanted=0;state.wantedHeat=0;clearRoadblocks();",
  "  state.arrestProgress=0;state.wanted=0;state.wantedHeat=0;livingCityV17.capCrimeForWanted(0);clearRoadblocks();",
  'arrest clears crime heat',
);

source = replaceOnce(
  source,
  "    updateVehicleDamage(this, dt, worldTime);",
  "    updateVehicleDamage(this, dt, worldTime);\n    const v17Vehicle=livingCityV17.updateVehicle(this,dt);\n    if(v17Vehicle.explode)destroyVehicle(this,true);",
  'vehicle critical state',
);

source = replaceOnce(
  source,
  "      const target = getPlayerPosition();\n      const toTarget = tmpV.copy(target).sub(this.mesh.position);",
  "      const playerTarget = getPlayerPosition();\n      if(this.mesh.position.distanceTo(playerTarget)<68)state.wantedLastKnown.copy(playerTarget);\n      const target = this.mesh.position.distanceTo(playerTarget)<68?playerTarget:state.wantedLastKnown;\n      const toTarget = tmpV.copy(target).sub(this.mesh.position);",
  'police search target',
);

source = replaceOnce(
  source,
  "    const hitEntities = [...enemies, ...pedestrians].filter(e => e.alive && e.group.position.distanceTo(this.mesh.position) < 1.7);",
  "    const otherVehicle=vehicles.find(other=>other!==this&&!other.destroyed&&other.mesh.position.distanceTo(this.mesh.position)<2.35);\n    if(otherVehicle&&Math.abs(this.speed)>5){const impact=Math.abs(this.speed)*this.profile.mass;applyVehicleImpact(this,impact*.72,'front');applyVehicleImpact(otherVehicle,impact*.58,'body');visualOverhaul?.emitImpact(this.mesh.position.clone(),impact);this.speed*=-.28;otherVehicle.speed+=Math.sign(this.speed||1)*impact*.08;if(otherVehicle.type==='police')raiseWanted('roadblock',3);}\n    const hitEntities = [...enemies, ...pedestrians].filter(e => e.alive && e.group.position.distanceTo(this.mesh.position) < 1.7);",
  'vehicle-to-vehicle impacts',
);

source = replaceOnce(source, 'function destroyVehicle(v) {', 'function destroyVehicle(v, explosive=true) {', 'explosive vehicle signature');
source = replaceOnce(
  source,
  "  if(v.destroyed)return;v.destroyed=true;v.speed=0;\n  v.mesh.traverse(o=>{if(o.isMesh&&o.material?.color)o.material.color.multiplyScalar(.18);});",
  "  if(v.destroyed)return;v.destroyed=true;v.speed=0;\n  if(explosive&&!v.exploded){v.exploded=true;createVehicleExplosion(v.mesh.position.clone(),v);}\n  v.mesh.traverse(o=>{if(o.isMesh&&o.material?.color)o.material.color.multiplyScalar(.18);});",
  'vehicle explosion',
);

await writeFile(mainPath, source, 'utf8');
console.log('Applied Neon Bay v1.7 AI, wanted and vehicle systems.');
