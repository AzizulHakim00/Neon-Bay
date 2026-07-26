import * as THREE from 'three';

export const V17_WANTED_PROFILES = {
  0: { officers: 0, cruisers: 0, heat: 0, label: 'CLEAR', roadblocks: 0, tactical: 0 },
  1: { officers: 2, cruisers: 1, heat: 24, label: 'INVESTIGATION', roadblocks: 0, tactical: 0 },
  2: { officers: 4, cruisers: 2, heat: 38, label: 'ACTIVE PURSUIT', roadblocks: 1, tactical: 0 },
  3: { officers: 6, cruisers: 3, heat: 52, label: 'HIGH-RISK PURSUIT', roadblocks: 2, tactical: 1 },
  4: { officers: 8, cruisers: 4, heat: 68, label: 'TACTICAL RESPONSE', roadblocks: 2, tactical: 3 },
  5: { officers: 11, cruisers: 5, heat: 86, label: 'CITY LOCKDOWN', roadblocks: 3, tactical: 5 },
};

export function v17WantedProfile(level) {
  return V17_WANTED_PROFILES[THREE.MathUtils.clamp(Math.floor(level || 0), 0, 5)] || V17_WANTED_PROFILES[0];
}

export const V17_SKILLS = {
  combat: [
    { id: 'steady-hands', name: 'STEADY HANDS', description: '15% less recoil and spread.', cost: 1 },
    { id: 'critical-focus', name: 'CRITICAL FOCUS', description: 'Headshots deal 35% more damage.', cost: 2 },
    { id: 'field-reload', name: 'FIELD RELOAD', description: 'Reload weapons 20% faster.', cost: 2 },
  ],
  driving: [
    { id: 'nitro-tank', name: 'NITRO TANK', description: '35% more nitro capacity.', cost: 1 },
    { id: 'reinforced-frame', name: 'REINFORCED FRAME', description: 'Vehicle impacts deal 25% less damage.', cost: 2 },
    { id: 'escape-line', name: 'ESCAPE LINE', description: 'Police heat falls 15% faster.', cost: 2 },
  ],
  street: [
    { id: 'street-network', name: 'STREET NETWORK', description: 'Dynamic events pay 20% more.', cost: 1 },
    { id: 'business-instinct', name: 'BUSINESS INSTINCT', description: 'Business payouts are 15% higher.', cost: 2 },
    { id: 'second-wind', name: 'SECOND WIND', description: 'Low health slightly lowers adaptive pressure.', cost: 2 },
  ],
};

const EVENT_DEFINITIONS = [
  { type: 'gang-clash', title: 'GANG CLASH', objective: 'Defeat the armed crew.', reward: 900, reputation: 85, kills: 4, time: 80 },
  { type: 'street-robbery', title: 'STREET ROBBERY', objective: 'Stop the robbers before they escape.', reward: 650, reputation: 65, kills: 2, time: 58 },
  { type: 'supply-recovery', title: 'SUPPLY RECOVERY', objective: 'Reach the marked supply cache.', reward: 520, reputation: 45, kills: 0, time: 70 },
  { type: 'hot-delivery', title: 'HOT DELIVERY', objective: 'Reach the drop point in a vehicle.', reward: 780, reputation: 70, kills: 0, time: 64, vehicle: true },
  { type: 'district-defense', title: 'DISTRICT DEFENSE', objective: 'Clear the attackers from the district.', reward: 1150, reputation: 110, kills: 5, time: 95 },
];

const clamp = THREE.MathUtils.clamp;

function randomTarget(origin, random = Math.random) {
  const angle = random() * Math.PI * 2;
  const distance = 38 + random() * 48;
  return new THREE.Vector3(
    clamp(origin.x + Math.cos(angle) * distance, -145, 145),
    0,
    clamp(origin.z + Math.sin(angle) * distance, -145, 145),
  );
}

export class LivingCityV17 {
  constructor(data = {}, { random = Math.random } = {}) {
    this.random = random;
    this.skillPoints = Math.max(0, Number(data.skillPoints) || 0);
    this.skills = { ...(data.skills || {}) };
    this.weaponUpgrades = {
      pistol: { damage: 0, accuracy: 0, reload: 0 },
      shotgun: { damage: 0, accuracy: 0, reload: 0 },
      smg: { damage: 0, accuracy: 0, reload: 0 },
      ...(data.weaponUpgrades || {}),
    };
    this.ownedVehicles = { sunset: true, ocean: false, infernus: false, ...(data.ownedVehicles || {}) };
    this.adaptive = {
      pressure: 0.35,
      shots: 0,
      hits: 0,
      headshots: 0,
      kills: 0,
      deaths: 0,
      damageTaken: 0,
      ...(data.adaptive || {}),
    };
    this.eventsCompleted = Math.max(0, Number(data.eventsCompleted) || 0);
    this.eventsFailed = Math.max(0, Number(data.eventsFailed) || 0);
    this.activeEvent = data.activeEvent || null;
    this.eventCooldown = Number.isFinite(data.eventCooldown) ? data.eventCooldown : 28;
    this.pendingEvent = null;
    this.lastTier = this.tier();
    this.ui = {};
  }

  hydrate(data = {}) {
    this.skillPoints = Math.max(0, Number(data.skillPoints) || 0);
    this.skills = { ...(data.skills || {}) };
    this.weaponUpgrades = {
      pistol: { damage: 0, accuracy: 0, reload: 0 },
      shotgun: { damage: 0, accuracy: 0, reload: 0 },
      smg: { damage: 0, accuracy: 0, reload: 0 },
      ...(data.weaponUpgrades || {}),
    };
    this.ownedVehicles = { sunset: true, ocean: false, infernus: false, ...(data.ownedVehicles || {}) };
    this.adaptive = { pressure: .35, shots: 0, hits: 0, headshots: 0, kills: 0, deaths: 0, damageTaken: 0, ...(data.adaptive || {}) };
    this.eventsCompleted = Math.max(0, Number(data.eventsCompleted) || 0);
    this.eventsFailed = Math.max(0, Number(data.eventsFailed) || 0);
    this.activeEvent = null;
    this.pendingEvent = null;
    this.eventCooldown = Number.isFinite(data.eventCooldown) ? data.eventCooldown : 28;
    this.renderSkills();
  }

  tier() {
    const p = this.adaptive.pressure;
    if (p >= 0.78) return { id: 'relentless', name: 'RELENTLESS', multiplier: 1.22 };
    if (p >= 0.57) return { id: 'hard', name: 'HARD', multiplier: 1.1 };
    if (p <= 0.27) return { id: 'assist', name: 'ASSIST', multiplier: 0.88 };
    return { id: 'balanced', name: 'BALANCED', multiplier: 1 };
  }

  recordShot({ hit = false, headshot = false } = {}) {
    this.adaptive.shots += 1;
    if (hit) this.adaptive.hits += 1;
    if (headshot) this.adaptive.headshots += 1;
  }

  recordKill() {
    this.adaptive.kills += 1;
    this.adaptive.pressure = clamp(this.adaptive.pressure + 0.012, 0.12, 0.92);
  }

  recordDamage(amount) {
    this.adaptive.damageTaken += Math.max(0, amount || 0);
    this.adaptive.pressure = clamp(this.adaptive.pressure - Math.min(0.025, amount / 1500), 0.12, 0.92);
  }

  recordDeath() {
    this.adaptive.deaths += 1;
    this.adaptive.pressure = clamp(this.adaptive.pressure - 0.12, 0.12, 0.92);
  }

  accuracy() {
    return this.adaptive.shots ? this.adaptive.hits / this.adaptive.shots : 0;
  }

  update(dt, context = {}) {
    const accuracyPressure = clamp((this.accuracy() - 0.32) * 0.12, -0.025, 0.04);
    const healthPressure = context.health > 72 ? 0.006 : context.health < 30 ? -0.018 : 0;
    const wantedPressure = (context.wanted || 0) * 0.0012;
    const secondWind = this.hasSkill('second-wind') && context.health < 30 ? -0.012 : 0;
    this.adaptive.pressure = clamp(this.adaptive.pressure + (accuracyPressure + healthPressure + wantedPressure + secondWind) * dt, 0.12, 0.92);

    if (!this.activeEvent && !context.cinematic && context.running && !context.paused && (context.wanted || 0) === 0) {
      this.eventCooldown -= dt;
      if (this.eventCooldown <= 0) {
        const definition = EVENT_DEFINITIONS[Math.floor(this.random() * EVENT_DEFINITIONS.length)];
        this.pendingEvent = {
          ...definition,
          id: `${definition.type}-${Date.now()}`,
          target: randomTarget(context.playerPosition || new THREE.Vector3(), this.random).toArray(),
          remaining: definition.time,
          progress: 0,
        };
        this.activeEvent = this.pendingEvent;
        this.eventCooldown = 70 + this.random() * 45;
      }
    }

    this.updateUI(context);
  }

  consumePendingEvent() {
    const event = this.pendingEvent;
    this.pendingEvent = null;
    return event;
  }

  completeEvent(success) {
    if (!this.activeEvent) return null;
    const event = this.activeEvent;
    this.activeEvent = null;
    if (success) this.eventsCompleted += 1;
    else this.eventsFailed += 1;
    if (success && this.eventsCompleted % 2 === 0) this.skillPoints += 1;
    return event;
  }

  enemyProfile({ police = false, boss = false, role = 'gang' } = {}) {
    const tier = this.tier();
    const tactical = role === 'tactical';
    const heavy = boss || role === 'heavy';
    const sniper = role === 'sniper';
    return {
      archetype: tactical ? 'TACTICAL' : heavy ? 'HEAVY' : sniper ? 'SNIPER' : police ? 'OFFICER' : 'GANG',
      vision: sniper ? 95 : tactical ? 82 : police ? 76 : 66,
      hearing: tactical ? 88 : police ? 82 : 72,
      fireRange: sniper ? 62 : heavy ? 35 : tactical ? 42 : 31,
      fireInterval: (sniper ? 1.8 : heavy ? 0.8 : tactical ? 0.68 : 1.15) / tier.multiplier,
      damage: (sniper ? 18 : heavy ? 12 : tactical ? 10 : police ? 8 : 7) * tier.multiplier,
      accuracy: clamp((sniper ? 0.78 : tactical ? 0.66 : police ? 0.58 : 0.48) * tier.multiplier, 0.28, 0.88),
      aggression: clamp((heavy ? 0.78 : tactical ? 0.72 : 0.56) * tier.multiplier, 0.35, 0.92),
      flankChance: tactical ? 0.48 : heavy ? 0.18 : 0.32,
      retreatHealth: heavy ? 0.12 : police ? 0.2 : 0.28,
      reaction: clamp((tactical ? 0.18 : police ? 0.28 : 0.36) / tier.multiplier, 0.12, 0.5),
    };
  }

  hasSkill(id) { return !!this.skills[id]; }

  skillEffect(name) {
    const effects = {
      spread: this.hasSkill('steady-hands') ? 0.85 : 1,
      recoil: this.hasSkill('steady-hands') ? 0.85 : 1,
      headshot: this.hasSkill('critical-focus') ? 1.35 : 1,
      reload: this.hasSkill('field-reload') ? 0.8 : 1,
      nitroCapacity: this.hasSkill('nitro-tank') ? 1.35 : 1,
      vehicleDamage: this.hasSkill('reinforced-frame') ? 0.75 : 1,
      heatDecay: this.hasSkill('escape-line') ? 1.15 : 1,
      eventReward: this.hasSkill('street-network') ? 1.2 : 1,
      businessIncome: this.hasSkill('business-instinct') ? 1.15 : 1,
    };
    return effects[name] ?? 1;
  }

  purchaseSkill(id) {
    const skill = Object.values(V17_SKILLS).flat().find(item => item.id === id);
    if (!skill) return { ok: false, reason: 'Unknown skill.' };
    if (this.skills[id]) return { ok: false, reason: `${skill.name} is already unlocked.` };
    if (this.skillPoints < skill.cost) return { ok: false, reason: `${skill.name} needs ${skill.cost} skill point${skill.cost === 1 ? '' : 's'}.` };
    this.skillPoints -= skill.cost;
    this.skills[id] = true;
    this.renderSkills();
    return { ok: true, skill };
  }

  upgradeWeapon(type, track, cash) {
    const weapon = this.weaponUpgrades[type];
    if (!weapon || !['damage', 'accuracy', 'reload'].includes(track)) return { ok: false, reason: 'Unknown weapon upgrade.' };
    const level = Number(weapon[track]) || 0;
    if (level >= 3) return { ok: false, reason: 'Upgrade already maxed.' };
    const price = 600 + level * 550;
    if (cash < price) return { ok: false, reason: `Upgrade costs $${price}.` };
    weapon[track] = level + 1;
    return { ok: true, price, level: level + 1 };
  }

  weaponEffect(type, track) {
    const level = Number(this.weaponUpgrades[type]?.[track]) || 0;
    if (track === 'damage') return 1 + level * 0.1;
    if (track === 'accuracy') return 1 - level * 0.09;
    if (track === 'reload') return 1 - level * 0.08;
    return 1;
  }

  mountUI(root = document) {
    if (root.getElementById('v17-event-card')) return;
    const eventCard = root.createElement('div');
    eventCard.id = 'v17-event-card';
    eventCard.className = 'v17-event-card hidden';
    eventCard.innerHTML = '<span>DYNAMIC EVENT</span><h3 id="v17-event-title">CITY EVENT</h3><p id="v17-event-objective"></p><div><b id="v17-event-progress">0 / 0</b><strong id="v17-event-time">0s</strong></div>';
    root.getElementById('hud')?.append(eventCard);

    const director = root.createElement('div');
    director.id = 'v17-director-chip';
    director.className = 'v17-director-chip';
    director.innerHTML = '<span>AI DIRECTOR</span><b id="v17-director-tier">BALANCED</b>';
    root.getElementById('hud')?.append(director);

    const hit = root.createElement('div');
    hit.id = 'v17-hit-marker';
    hit.className = 'v17-hit-marker';
    hit.innerHTML = '<i></i><i></i><i></i><i></i>';
    root.getElementById('hud')?.append(hit);

    const nitro = root.createElement('div');
    nitro.id = 'v17-nitro';
    nitro.className = 'v17-nitro hidden';
    nitro.innerHTML = '<span>NITRO</span><div><i id="v17-nitro-bar"></i></div>';
    root.getElementById('hud')?.append(nitro);

    const modal = root.createElement('div');
    modal.id = 'skills-panel';
    modal.className = 'modal hidden';
    modal.innerHTML = '<div class="modal-card v17-skills-card"><button class="close-modal" aria-label="Close">×</button><div class="eyebrow">LIVING CITY v1.7</div><h2>Skills & Upgrades</h2><p class="v17-points">Available skill points: <b id="v17-skill-points">0</b></p><div id="v17-skills-grid" class="v17-skills-grid"></div></div>';
    root.getElementById('game-root')?.append(modal);
    modal.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');

    const menuActions = root.querySelector('#main-menu .menu-actions');
    if (menuActions && !root.getElementById('v17-save-slot')) {
      const slotWrap = root.createElement('label');
      slotWrap.className = 'v17-save-slot';
      slotWrap.innerHTML = '<span>SAVE SLOT</span><select id="v17-save-slot"><option value="1">Slot 1</option><option value="2">Slot 2</option><option value="3">Slot 3</option></select>';
      slotWrap.querySelector('select').value = localStorage.getItem('neon-bay-save-v5-index') || '1';
      slotWrap.querySelector('select').onchange = event => document.dispatchEvent(new CustomEvent('nb:v17-slot', { detail: { slot: Number(event.target.value) } }));
      menuActions.insertBefore(slotWrap, menuActions.firstChild);
    }

    const pauseCard = root.querySelector('#pause-menu .pause-card');
    if (pauseCard && !root.getElementById('skills-btn')) {
      const button = root.createElement('button');
      button.id = 'skills-btn';
      button.textContent = 'Skills & Upgrades';
      button.onclick = () => { this.renderSkills(); modal.classList.remove('hidden'); };
      pauseCard.insertBefore(button, root.getElementById('quit-btn'));
    }

    const phone = root.getElementById('phone-panel');
    if (phone && !root.getElementById('phone-skills-btn')) {
      const button = root.createElement('button');
      button.id = 'phone-skills-btn';
      button.className = 'v17-phone-button';
      button.textContent = 'SKILLS / UPGRADES';
      button.onclick = () => { this.renderSkills(); modal.classList.remove('hidden'); };
      phone.querySelector('.phone-body, .phone-screen, .phone-card')?.append(button) || phone.append(button);
    }

    this.ui = {
      eventCard,
      eventTitle: root.getElementById('v17-event-title'),
      eventObjective: root.getElementById('v17-event-objective'),
      eventProgress: root.getElementById('v17-event-progress'),
      eventTime: root.getElementById('v17-event-time'),
      directorTier: root.getElementById('v17-director-tier'),
      hit,
      nitro,
      nitroBar: root.getElementById('v17-nitro-bar'),
      skillPoints: root.getElementById('v17-skill-points'),
      skillsGrid: root.getElementById('v17-skills-grid'),
    };
    this.renderSkills();
  }

  renderSkills() {
    if (!this.ui.skillsGrid) return;
    this.ui.skillPoints.textContent = this.skillPoints;
    const skillSections = Object.entries(V17_SKILLS).map(([track, skills]) => `
      <section><h3>${track.toUpperCase()}</h3>${skills.map(skill => `<button data-skill="${skill.id}" ${this.skills[skill.id] ? 'disabled' : ''}><b>${skill.name}</b><span>${skill.description}</span><em>${this.skills[skill.id] ? 'UNLOCKED' : `${skill.cost} SP`}</em></button>`).join('')}</section>
    `).join('');
    const weaponSections = Object.entries(this.weaponUpgrades).map(([weapon, tracks]) => `
      <section class="v17-weapon-section"><h3>${weapon.toUpperCase()} UPGRADES</h3>${Object.entries(tracks).map(([track, level]) => `<button data-weapon="${weapon}" data-track="${track}" ${level >= 3 ? 'disabled' : ''}><b>${track.toUpperCase()} · LV ${level}</b><span>Improve ${track} performance.</span><em>${level >= 3 ? 'MAX' : `$${600 + level * 550}`}</em></button>`).join('')}</section>
    `).join('');
    this.ui.skillsGrid.innerHTML = skillSections + weaponSections;
    this.ui.skillsGrid.querySelectorAll('[data-skill]').forEach(button => {
      button.onclick = () => document.dispatchEvent(new CustomEvent('nb:v17-skill', { detail: { id: button.dataset.skill } }));
    });
    this.ui.skillsGrid.querySelectorAll('[data-weapon]').forEach(button => {
      button.onclick = () => document.dispatchEvent(new CustomEvent('nb:v17-weapon', { detail: { type: button.dataset.weapon, track: button.dataset.track } }));
    });
  }

  showHit(headshot = false) {
    if (!this.ui.hit) return;
    this.ui.hit.classList.remove('active', 'headshot');
    void this.ui.hit.offsetWidth;
    this.ui.hit.classList.add('active');
    if (headshot) this.ui.hit.classList.add('headshot');
  }

  updateUI(context = {}) {
    if (!this.ui.directorTier) return;
    const tier = this.tier();
    this.ui.directorTier.textContent = tier.name;
    this.ui.directorTier.dataset.tier = tier.id;
    const event = this.activeEvent;
    this.ui.eventCard?.classList.toggle('hidden', !event);
    if (event) {
      this.ui.eventTitle.textContent = event.title;
      this.ui.eventObjective.textContent = event.objective;
      this.ui.eventProgress.textContent = event.kills ? `${context.eventProgress || 0} / ${event.kills}` : 'REACH TARGET';
      this.ui.eventTime.textContent = `${Math.max(0, Math.ceil(context.eventTime ?? event.remaining ?? event.time))}s`;
    }
    const maxNitro = 100 * this.skillEffect('nitroCapacity');
    this.ui.nitro?.classList.toggle('hidden', !context.activeVehicle);
    if (this.ui.nitroBar) this.ui.nitroBar.style.width = `${clamp((context.nitro || 0) / maxNitro, 0, 1) * 100}%`;
  }

  serialize() {
    return {
      skillPoints: this.skillPoints,
      skills: { ...this.skills },
      weaponUpgrades: JSON.parse(JSON.stringify(this.weaponUpgrades)),
      ownedVehicles: { ...this.ownedVehicles },
      adaptive: { ...this.adaptive },
      eventsCompleted: this.eventsCompleted,
      eventsFailed: this.eventsFailed,
      activeEvent: null,
      eventCooldown: this.eventCooldown,
    };
  }
}
