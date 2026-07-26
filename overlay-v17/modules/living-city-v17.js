import * as THREE from 'three';

export const GAMEPLAY_VERSION = '1.7.0';

export const WANTED_PROFILES_V17 = {
  0: { officers: 0, cruisers: 0, heat: 0, label: 'CLEAR', response: 'No active search' },
  1: { officers: 2, cruisers: 1, heat: 25, label: 'INVESTIGATION', response: 'Local patrols' },
  2: { officers: 4, cruisers: 2, heat: 42, label: 'PURSUIT', response: 'Active pursuit' },
  3: { officers: 7, cruisers: 3, heat: 62, label: 'LOCKDOWN', response: 'Roadblocks' },
  4: { officers: 10, cruisers: 4, heat: 82, label: 'TACTICAL', response: 'Tactical response' },
  5: { officers: 14, cruisers: 5, heat: 108, label: 'CITY SIEGE', response: 'Maximum force' },
};

const CRIME_POINTS = {
  gunfire: 7,
  witness: 5,
  assault: 18,
  civilian: 28,
  collision: 12,
  officer: 58,
  vehicleTheft: 14,
  explosion: 36,
  roadblock: 24,
};

const WANTED_THRESHOLDS = [0, 8, 25, 55, 95, 145];

export const ENEMY_ARCHETYPES_V17 = {
  rusher: {
    label: 'RUSHER', health: .92, speed: 1.22, accuracy: .52, damage: .92,
    preferredDistance: 8, retreatDistance: 3.5, hearing: 52, cooldown: .82, morale: .78,
  },
  flanker: {
    label: 'FLANKER', health: 1, speed: 1.12, accuracy: .62, damage: 1,
    preferredDistance: 16, retreatDistance: 6, hearing: 60, cooldown: 1.05, morale: .9,
  },
  marksman: {
    label: 'MARKSMAN', health: .9, speed: .9, accuracy: .78, damage: 1.12,
    preferredDistance: 28, retreatDistance: 13, hearing: 70, cooldown: 1.35, morale: .76,
  },
  enforcer: {
    label: 'ENFORCER', health: 1.48, speed: .76, accuracy: .67, damage: 1.28,
    preferredDistance: 13, retreatDistance: 5, hearing: 64, cooldown: 1.22, morale: 1.2,
  },
  patrol: {
    label: 'PATROL', health: 1.08, speed: 1, accuracy: .64, damage: 1,
    preferredDistance: 18, retreatDistance: 6, hearing: 68, cooldown: 1.12, morale: 1.05,
  },
  tactical: {
    label: 'TACTICAL', health: 1.42, speed: 1.04, accuracy: .76, damage: 1.18,
    preferredDistance: 20, retreatDistance: 8, hearing: 80, cooldown: .9, morale: 1.35,
  },
};

const clamp = THREE.MathUtils.clamp;

export function wantedProfileV17(level) {
  return WANTED_PROFILES_V17[clamp(Math.floor(Number(level) || 0), 0, 5)] || WANTED_PROFILES_V17[0];
}

export function wantedLevelFromCrimePoints(points) {
  const value = Math.max(0, Number(points) || 0);
  let level = 0;
  for (let index = 1; index < WANTED_THRESHOLDS.length; index += 1) {
    if (value >= WANTED_THRESHOLDS[index]) level = index;
  }
  return level;
}

export function hitZoneFromIntersection(entity, intersection) {
  const objectName = String(intersection?.object?.name || '').toLowerCase();
  if (objectName.includes('head')) return 'head';
  const baseY = entity?.group?.position?.y || 0;
  const height = (intersection?.point?.y || 0) - baseY;
  if (height > 1.62) return 'head';
  if (height < .78) return 'limb';
  return 'body';
}

export class LivingCityDirectorV17 {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.crimePoints = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastCrime = null;
    this.lastDamage = 0;
    this.adaptiveIntensity = 1;
    this.shots = 0;
    this.hits = 0;
    this.headshots = 0;
    this.kills = 0;
    this.vehicleExplosions = 0;
    this.characterSequence = 0;
  }

  reset(data = {}) {
    this.crimePoints = Math.max(0, Number(data.crimePoints) || 0);
    this.combo = 0;
    this.comboTimer = 0;
    this.lastCrime = null;
    this.lastDamage = 0;
    this.adaptiveIntensity = clamp(Number(data.adaptiveIntensity) || 1, .72, 1.28);
    this.shots = Math.max(0, Number(data.shots) || 0);
    this.hits = Math.max(0, Number(data.hits) || 0);
    this.headshots = Math.max(0, Number(data.headshots) || 0);
    this.kills = Math.max(0, Number(data.kills) || 0);
    this.vehicleExplosions = Math.max(0, Number(data.vehicleExplosions) || 0);
  }

  configureCharacter(entity, options = {}) {
    if (entity.passive) {
      entity.archetype = 'civilian';
      entity.maxHealth = Math.max(1, entity.health);
      entity.morale = .55;
      entity.suppression = 0;
      return null;
    }
    let archetype = options.archetype;
    if (!archetype) {
      if (entity.police) archetype = options.tactical ? 'tactical' : 'patrol';
      else if (entity.boss) archetype = 'enforcer';
      else {
        const rotation = ['rusher', 'flanker', 'marksman', 'enforcer'];
        archetype = rotation[this.characterSequence++ % rotation.length];
      }
    }
    const profile = ENEMY_ARCHETYPES_V17[archetype] || ENEMY_ARCHETYPES_V17.flanker;
    entity.archetype = archetype;
    entity.combatProfile = profile;
    entity.maxHealth = Math.max(1, entity.health * profile.health);
    entity.health = entity.maxHealth;
    entity.speed *= profile.speed;
    entity.morale = profile.morale;
    entity.suppression = 0;
    entity.flankSign = this.random() > .5 ? 1 : -1;
    entity.decisionTimer = this.random() * .7;
    entity.burstRemaining = 0;
    return profile;
  }

  registerCrime(reason, minimum = 0, position = null, currentLevel = 0) {
    const severity = CRIME_POINTS[reason] ?? 9;
    this.crimePoints = Math.min(220, this.crimePoints + severity);
    const level = clamp(Math.max(minimum, currentLevel, wantedLevelFromCrimePoints(this.crimePoints)), 0, 5);
    const profile = wantedProfileV17(level);
    this.lastCrime = {
      reason,
      severity,
      position: position?.clone?.() || null,
      timestamp: globalThis.performance?.now?.() || Date.now(),
    };
    return {
      level,
      heat: Math.max(profile.heat, severity * 1.7),
      points: this.crimePoints,
      profile,
      severity,
    };
  }

  decayCrime(dt, { observed = false, wanted = 0 } = {}) {
    const rate = observed ? .04 : wanted > 0 ? .22 : .6;
    this.crimePoints = Math.max(0, this.crimePoints - dt * rate);
    return wantedLevelFromCrimePoints(this.crimePoints);
  }

  capCrimeForWanted(level) {
    const bounded = clamp(Math.floor(Number(level) || 0), 0, 5);
    const ceiling = bounded >= 5 ? 220 : WANTED_THRESHOLDS[bounded + 1] - .01;
    this.crimePoints = Math.min(this.crimePoints, ceiling);
    return this.crimePoints;
  }

  registerPlayerShot() {
    this.shots += 1;
  }

  playerSpread({ baseSpread = 0, moving = false, sprinting = false, airborne = false, weapon = 'pistol' } = {}) {
    const movement = sprinting ? .026 : moving ? .012 : 0;
    const air = airborne ? .032 : 0;
    const weaponKick = weapon === 'shotgun' ? .006 : weapon === 'smg' ? .009 : .003;
    return Math.max(0, baseSpread + movement + air + weaponKick);
  }

  registerHit({ zone = 'body', damage = 0, killed = false } = {}) {
    this.hits += 1;
    if (zone === 'head') this.headshots += 1;
    if (killed) this.kills += 1;
    this.combo = Math.min(12, this.combo + (killed ? 2 : zone === 'head' ? 1.5 : 1));
    this.comboTimer = 4.2;
    return {
      multiplier: 1 + Math.min(.75, this.combo * .06),
      combo: this.combo,
      zone,
      damage,
      killed,
    };
  }

  registerDamage(amount) {
    this.lastDamage = Math.max(this.lastDamage, Number(amount) || 0);
    this.combo = Math.max(0, this.combo - 1.5);
  }

  enemyDecision(entity, {
    distance = 999,
    canSee = false,
    heardGunshot = false,
    wanted = 0,
    playerInVehicle = false,
    dt = 0,
  } = {}) {
    const profile = entity.combatProfile || ENEMY_ARCHETYPES_V17.flanker;
    entity.decisionTimer = Math.max(0, (entity.decisionTimer || 0) - dt);
    entity.suppression = Math.max(0, (entity.suppression || 0) - dt * .34);
    const healthRatio = entity.health / Math.max(1, entity.maxHealth || entity.health);

    if (!canSee) return { tactic: heardGunshot ? 'investigate' : 'search', desiredDistance: profile.preferredDistance };
    if (healthRatio < .22 && !entity.boss && entity.morale < 1.15) return { tactic: 'retreat', desiredDistance: profile.preferredDistance + 10 };
    if (distance < profile.retreatDistance) return { tactic: 'retreat', desiredDistance: profile.preferredDistance };
    if (entity.archetype === 'rusher' && distance > profile.preferredDistance) return { tactic: 'rush', desiredDistance: profile.preferredDistance };
    if (entity.archetype === 'flanker' && distance > 8) return { tactic: 'flank', desiredDistance: profile.preferredDistance };
    if (entity.archetype === 'marksman') return { tactic: distance < 16 ? 'retreat' : 'cover', desiredDistance: profile.preferredDistance };
    if (entity.archetype === 'enforcer' || (entity.police && wanted >= 4)) return { tactic: playerInVehicle ? 'suppress' : 'advance', desiredDistance: profile.preferredDistance };
    return { tactic: distance > profile.preferredDistance + 4 ? 'advance' : 'cover', desiredDistance: profile.preferredDistance };
  }

  enemyShot(entity, { distance = 20, playerMoving = false, playerInVehicle = false, wanted = 0 } = {}) {
    const profile = entity.combatProfile || ENEMY_ARCHETYPES_V17.flanker;
    const distancePenalty = clamp((distance - 8) / 70, 0, .38);
    const movementPenalty = playerMoving ? .13 : 0;
    const vehiclePenalty = playerInVehicle ? .08 : 0;
    const tacticalBonus = entity.police ? wanted * .018 : 0;
    const suppressionPenalty = clamp(entity.suppression || 0, 0, .32);
    const hitChance = clamp(
      profile.accuracy * this.adaptiveIntensity - distancePenalty - movementPenalty - vehiclePenalty + tacticalBonus - suppressionPenalty,
      .12,
      .9,
    );
    const damage = (entity.boss ? 12 : 7.2) * profile.damage * clamp(this.adaptiveIntensity, .78, 1.22);
    const cooldown = profile.cooldown / clamp(this.adaptiveIntensity, .82, 1.18);
    return { hitChance, damage, cooldown };
  }

  civilianReaction(civilian, {
    crimePosition = null,
    crimeAge = 999,
    wanted = 0,
    playerDistance = 999,
    policeNearby = false,
  } = {}) {
    if (!crimePosition || crimeAge > 12) {
      if (wanted >= 4 && playerDistance < 28) return { action: 'flee', report: false, speed: 2.15 };
      return { action: 'routine', report: false, speed: 1 };
    }
    const distance = civilian.group.position.distanceTo(crimePosition);
    if (distance > (civilian.role === 'vendor' ? 34 : 48)) return { action: 'routine', report: false, speed: 1 };
    const trapped = civilian.reportTimer > 2.8 && distance < 9;
    const report = !civilian.reportedCrime && civilian.reportTimer > (policeNearby ? 2.2 : 1.25) && this.random() > .28;
    return {
      action: trapped ? 'cower' : 'flee',
      report,
      speed: trapped ? 0 : wanted >= 3 ? 2.55 : 2.2,
    };
  }

  vehicleCondition(vehicle) {
    const average = (vehicle.engineHealth + vehicle.bodyHealth + vehicle.tireHealth) / 3;
    if (vehicle.fireTimer > 4.8 || vehicle.health <= 4) return 'critical';
    if (average < 35) return 'failing';
    if (average < 68) return 'damaged';
    return 'stable';
  }

  updateVehicle(vehicle, dt) {
    const condition = this.vehicleCondition(vehicle);
    vehicle.damageStage = condition;
    const explode = !vehicle.exploded && (vehicle.fireTimer > 5.6 || vehicle.health <= 0);
    if (condition === 'critical') vehicle.speed *= Math.pow(.965, dt * 60);
    return { condition, explode };
  }

  update(dt, { health = 100, wanted = 0, enemies = 0 } = {}) {
    if (this.comboTimer > 0) this.comboTimer -= dt;
    else this.combo = Math.max(0, this.combo - dt * 1.6);
    this.lastDamage = Math.max(0, this.lastDamage - dt * 18);
    const success = this.shots > 5 ? this.hits / this.shots : .45;
    const healthPressure = health < 30 ? -.18 : health > 75 ? .08 : 0;
    const accuracyPressure = clamp((success - .45) * .42, -.12, .18);
    const worldPressure = clamp(wanted * .035 + enemies * .008, 0, .22);
    this.adaptiveIntensity = THREE.MathUtils.lerp(
      this.adaptiveIntensity,
      clamp(1 + healthPressure + accuracyPressure + worldPressure, .72, 1.28),
      1 - Math.pow(.08, dt),
    );
  }

  threatLabel(wanted = 0, enemyCount = 0) {
    const score = wanted * 1.4 + enemyCount * .35 + this.adaptiveIntensity * 2 + this.lastDamage * .035;
    if (score > 10) return 'OVERWHELMING';
    if (score > 7) return 'HOSTILE';
    if (score > 4) return 'ALERT';
    return 'CALM';
  }

  serialize() {
    return {
      version: GAMEPLAY_VERSION,
      crimePoints: Math.round(this.crimePoints * 100) / 100,
      adaptiveIntensity: Math.round(this.adaptiveIntensity * 1000) / 1000,
      shots: this.shots,
      hits: this.hits,
      headshots: this.headshots,
      kills: this.kills,
      vehicleExplosions: this.vehicleExplosions,
    };
  }

  snapshot(context = {}) {
    return {
      version: GAMEPLAY_VERSION,
      wantedMax: 5,
      crimePoints: this.crimePoints,
      combo: this.combo,
      adaptiveIntensity: this.adaptiveIntensity,
      hitRatio: this.shots ? this.hits / this.shots : 0,
      headshots: this.headshots,
      kills: this.kills,
      vehicleExplosions: this.vehicleExplosions,
      threat: this.threatLabel(context.wanted || 0, context.enemyCount || 0),
      ...context,
    };
  }
}
