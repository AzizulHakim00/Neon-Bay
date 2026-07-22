import * as THREE from 'three';

export const REPUTATION_TIERS = [
  { name: 'UNKNOWN', min: 0 },
  { name: 'STREET RUNNER', min: 150 },
  { name: 'TRUSTED DRIVER', min: 400 },
  { name: 'BAY OPERATOR', min: 800 },
  { name: 'DISTRICT POWER', min: 1400 },
  { name: 'NEON LEGEND', min: 2200 },
];

export const WANTED_PROFILES = {
  0: { officers: 0, cruisers: 0, heat: 0, label: 'CLEAR' },
  1: { officers: 2, cruisers: 1, heat: 24, label: 'INVESTIGATION' },
  2: { officers: 4, cruisers: 2, heat: 38, label: 'PURSUIT' },
  3: { officers: 7, cruisers: 3, heat: 55, label: 'LOCKDOWN' },
};

export function wantedProfile(level) {
  return WANTED_PROFILES[Math.max(0, Math.min(3, Math.floor(level)))] || WANTED_PROFILES[0];
}

export function trafficLightState(time, intersectionIndex = 0) {
  const phase = (time + intersectionIndex * 2.4) % 14;
  if (phase < 5.5) return { axis: 'vertical', caution: phase > 4.5 };
  if (phase < 7) return { axis: 'all', caution: true };
  if (phase < 12.5) return { axis: 'horizontal', caution: phase > 11.5 };
  return { axis: 'all', caution: true };
}

export function buildRoadRoutes(roadCenters, extent = 150, laneOffset = 3.2) {
  const routes = [];
  const centers = [...roadCenters];
  const inner = centers.filter(value => Math.abs(value) <= 120);
  for (let index = 0; index < inner.length - 1; index += 1) {
    const a = inner[index];
    const b = inner[index + 1];
    routes.push([
      new THREE.Vector3(a + laneOffset, 0, -extent),
      new THREE.Vector3(a + laneOffset, 0, extent),
      new THREE.Vector3(b - laneOffset, 0, extent),
      new THREE.Vector3(b - laneOffset, 0, -extent),
    ]);
    routes.push([
      new THREE.Vector3(-extent, 0, a - laneOffset),
      new THREE.Vector3(extent, 0, a - laneOffset),
      new THREE.Vector3(extent, 0, b + laneOffset),
      new THREE.Vector3(-extent, 0, b + laneOffset),
    ]);
  }
  return routes;
}

export function makeSidewalkRoutine(x, z, span = 22) {
  const horizontal = Math.abs(x % 60) > Math.abs(z % 60);
  if (horizontal) {
    return [
      new THREE.Vector3(x - span, 0, z),
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x + span, 0, z),
      new THREE.Vector3(x, 0, z),
    ];
  }
  return [
    new THREE.Vector3(x, 0, z - span),
    new THREE.Vector3(x, 0, z),
    new THREE.Vector3(x, 0, z + span),
    new THREE.Vector3(x, 0, z),
  ];
}

export class ProgressionSystem {
  constructor(data = {}) {
    this.reputation = Math.max(0, Number(data.reputation) || 0);
    this.stats = {
      missionsCompleted: 0,
      policeEscapes: 0,
      taxiFares: 0,
      racesWon: 0,
      vehiclesRepaired: 0,
      distanceDriven: 0,
      moneyEarned: 0,
      shotsFired: 0,
      hits: 0,
      ...data.stats,
    };
  }

  addReputation(amount) {
    const before = this.tier().name;
    this.reputation = Math.max(0, this.reputation + Math.round(amount));
    const after = this.tier().name;
    return { amount: Math.round(amount), tierChanged: before !== after, before, after };
  }

  record(name, amount = 1) {
    if (!(name in this.stats)) this.stats[name] = 0;
    this.stats[name] += amount;
    return this.stats[name];
  }

  tier() {
    let current = REPUTATION_TIERS[0];
    for (const tier of REPUTATION_TIERS) if (this.reputation >= tier.min) current = tier;
    return current;
  }

  nextTier() {
    return REPUTATION_TIERS.find(tier => tier.min > this.reputation) || null;
  }

  progress() {
    const current = this.tier();
    const next = this.nextTier();
    if (!next) return 1;
    return THREE.MathUtils.clamp((this.reputation - current.min) / (next.min - current.min), 0, 1);
  }

  serialize() {
    return { reputation: this.reputation, stats: { ...this.stats } };
  }
}

export const SIDE_ACTIVITY_DEFINITIONS = {
  taxi: {
    name: 'COASTLINE TAXI',
    reward: 420,
    reputation: 55,
    pickup: new THREE.Vector3(-72, 0, -8),
    dropoff: new THREE.Vector3(118, 0, 72),
    time: 95,
  },
  race: {
    name: 'OCEAN DRIVE SPRINT',
    reward: 850,
    reputation: 110,
    time: 72,
    checkpoints: [
      new THREE.Vector3(105, 0, -92),
      new THREE.Vector3(118, 0, -4),
      new THREE.Vector3(62, 0, 118),
      new THREE.Vector3(-60, 0, 118),
      new THREE.Vector3(-118, 0, 2),
      new THREE.Vector3(-55, 0, -118),
      new THREE.Vector3(105, 0, -92),
    ],
  },
};
