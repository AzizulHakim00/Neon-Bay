import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;

export const V18_PROPERTIES = [
  { id: 'marina', name: 'BAY MARINA', district: 'Ocean Drive', price: 5200, income: 180, position: [126, 0, 82], description: 'Boat slips, smuggling routes and sunset charters.' },
  { id: 'arcade', name: 'NEON ARCADE', district: 'Vice Point', price: 6800, income: 245, position: [74, 0, -112], description: 'A retro arcade that launders cash through tournaments.' },
  { id: 'warehouse', name: 'HARBOR WAREHOUSE', district: 'Harbor', price: 8900, income: 330, position: [-112, 0, 92], description: 'Cargo storage and high-value contract staging.' },
  { id: 'tower', name: 'DOWNTOWN TOWER', district: 'Downtown', price: 12500, income: 460, position: [-24, 0, 118], description: 'Corporate offices and an intelligence network.' },
  { id: 'safehouse', name: 'LITTLE BAY SAFEHOUSE', district: 'Little Bay', price: 4300, income: 145, position: [-128, 0, -96], description: 'A low-profile hideout with local street influence.' },
];

export const V18_CONTRACTS = [
  { id: 'courier', name: 'MIDNIGHT COURIER', type: 'drive', reward: 950, target: 1050, description: 'Drive 1,050 meters before the timer expires.', time: 95 },
  { id: 'heat-run', name: 'HEAT RUN', type: 'wanted', reward: 1350, target: 28, description: 'Survive a wanted pursuit for 28 seconds.', time: 70 },
  { id: 'street-cleanup', name: 'STREET CLEANUP', type: 'kills', reward: 1200, target: 4, description: 'Eliminate four hostile targets.', time: 90 },
  { id: 'shard-hunt', name: 'DATA RECOVERY', type: 'collectibles', reward: 1100, target: 3, description: 'Recover three encrypted data shards.', time: 120 },
  { id: 'district-tour', name: 'FIVE DISTRICTS', type: 'districts', reward: 1500, target: 5, description: 'Visit all five city districts in one run.', time: 150 },
  { id: 'clean-escape', name: 'CLEAN ESCAPE', type: 'escape', reward: 1650, target: 1, description: 'Reach three stars, then lose the police.', time: 130 },
  { id: 'nitro-trial', name: 'NITRO TRIAL', type: 'nitro', reward: 900, target: 22, description: 'Use nitro for 22 total seconds.', time: 100 },
  { id: 'property-defense', name: 'EMPIRE DEFENSE', type: 'survive', reward: 1850, target: 45, description: 'Hold your ground for 45 seconds.', time: 80 },
];

export const V18_OPERATIONS = [
  { id: 'signal-break', chapter: 3, name: 'SIGNAL BREAK', description: 'Steal a city relay key and expose a rival surveillance grid.', reward: 2200, unlock: 0 },
  { id: 'glass-harbor', chapter: 3, name: 'GLASS HARBOR', description: 'Intercept a high-value shipment moving through the docks.', reward: 2800, unlock: 2 },
  { id: 'neon-ledger', chapter: 3, name: 'THE NEON LEDGER', description: 'Recover financial records linking every major rival crew.', reward: 3400, unlock: 4 },
  { id: 'skyline-siege', chapter: 3, name: 'SKYLINE SIEGE', description: 'Defend Downtown Tower during a coordinated assault.', reward: 4300, unlock: 6 },
  { id: 'empire-state', chapter: 3, name: 'EMPIRE STATE', description: 'Complete the final citywide takeover operation.', reward: 6500, unlock: 8 },
];

const SHARD_POSITIONS = [
  [-132, 0.8, -128], [-96, 0.8, -36], [-138, 0.8, 48], [-102, 0.8, 122],
  [-48, 0.8, -118], [-22, 0.8, -48], [-62, 0.8, 34], [-30, 0.8, 128],
  [28, 0.8, -126], [54, 0.8, -42], [22, 0.8, 42], [66, 0.8, 118],
  [118, 0.8, -116], [132, 0.8, -28], [108, 0.8, 42], [138, 0.8, 112],
  [0, 0.8, -4], [86, 0.8, 4],
];

const DISTRICTS = [
  { id: 'little-bay', name: 'LITTLE BAY', x: -90, z: -90 },
  { id: 'harbor', name: 'HARBOR', x: -92, z: 82 },
  { id: 'downtown', name: 'DOWNTOWN', x: 0, z: 70 },
  { id: 'vice-point', name: 'VICE POINT', x: 82, z: -80 },
  { id: 'ocean-drive', name: 'OCEAN DRIVE', x: 112, z: 72 },
];

function formatMoney(value) {
  return `$${Math.max(0, Math.round(value || 0)).toLocaleString('en-US')}`;
}

function districtAt(position) {
  if (!position) return DISTRICTS[0];
  return DISTRICTS.reduce((best, district) => {
    const distance = Math.hypot(position.x - district.x, position.z - district.z);
    return !best || distance < best.distance ? { ...district, distance } : best;
  }, null);
}

export class EmpireExpansionV18 {
  constructor(data = {}) {
    this.properties = { ...(data.properties || {}) };
    this.propertyBank = Math.max(0, Number(data.propertyBank) || 0);
    this.propertyClock = Math.max(0, Number(data.propertyClock) || 0);
    this.completedContracts = Math.max(0, Number(data.completedContracts) || 0);
    this.completedOperations = { ...(data.completedOperations || {}) };
    this.activeContract = data.activeContract || null;
    this.collectedShards = new Set(data.collectedShards || []);
    this.fleet = {
      sunset: { owned: true, engine: 0, armor: 0, nitro: 0 },
      ocean: { owned: false, engine: 0, armor: 0, nitro: 0 },
      infernus: { owned: false, engine: 0, armor: 0, nitro: 0 },
      ...(data.fleet || {}),
    };
    this.stats = {
      contractStreak: 0,
      totalEmpireIncome: 0,
      operationsCompleted: 0,
      ...(data.stats || {}),
    };
    this.lastPosition = null;
    this.lastWanted = 0;
    this.nitroHeld = false;
    this.shardMeshes = [];
    this.propertyMeshes = [];
    this.marker = null;
    this.ui = {};
    this.lastDistrict = '';
  }

  hydrate(data = {}) {
    const fresh = new EmpireExpansionV18(data);
    const sceneObjects = { shardMeshes: this.shardMeshes, propertyMeshes: this.propertyMeshes, marker: this.marker, ui: this.ui };
    Object.assign(this, fresh, sceneObjects);
    this.syncWorldVisibility();
    this.render();
  }

  buildWorld(scene) {
    if (!scene || this.shardMeshes.length) return;
    const shardGeometry = new THREE.OctahedronGeometry(0.55, 0);
    const shardMaterial = new THREE.MeshStandardMaterial({ color: 0x67f5ff, emissive: 0x0ac4d8, emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.18 });
    SHARD_POSITIONS.forEach((coords, index) => {
      const mesh = new THREE.Mesh(shardGeometry, shardMaterial.clone());
      mesh.position.set(...coords);
      mesh.userData.v18Shard = index;
      mesh.castShadow = true;
      scene.add(mesh);
      this.shardMeshes.push(mesh);
    });

    const propertyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.18, 24);
    V18_PROPERTIES.forEach(property => {
      const material = new THREE.MeshStandardMaterial({ color: 0xffb24f, emissive: 0x7a3100, emissiveIntensity: 0.9, transparent: true, opacity: 0.88 });
      const mesh = new THREE.Mesh(propertyGeometry, material);
      mesh.position.set(property.position[0], 0.12, property.position[2]);
      mesh.userData.v18Property = property.id;
      scene.add(mesh);
      this.propertyMeshes.push(mesh);
    });

    const markerGeometry = new THREE.TorusGeometry(1.55, 0.18, 10, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4fb7, transparent: true, opacity: 0.9 });
    this.marker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.marker.rotation.x = Math.PI / 2;
    this.marker.position.y = 0.24;
    this.marker.visible = false;
    scene.add(this.marker);
    this.syncWorldVisibility();
  }

  mountUI(root = document) {
    if (root.getElementById('v18-empire-panel')) return;

    const hud = root.createElement('div');
    hud.id = 'v18-contract-hud';
    hud.className = 'v18-contract-hud hidden';
    hud.innerHTML = '<span>EMPIRE CONTRACT</span><h3 id="v18-contract-title">CONTRACT</h3><p id="v18-contract-objective"></p><div><b id="v18-contract-progress">0 / 0</b><strong id="v18-contract-time">0s</strong></div>';
    root.getElementById('hud')?.append(hud);

    const chip = root.createElement('button');
    chip.id = 'v18-empire-chip';
    chip.className = 'v18-empire-chip';
    chip.type = 'button';
    chip.innerHTML = '<span>EMPIRE</span><b id="v18-empire-value">$0</b>';
    root.getElementById('hud')?.append(chip);

    const modal = root.createElement('div');
    modal.id = 'v18-empire-panel';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-card v18-empire-card">
        <button class="close-modal" aria-label="Close">×</button>
        <div class="eyebrow">NEON BAY v1.8 · EMPIRE EXPANSION</div>
        <h2>Empire Command</h2>
        <div class="v18-summary" id="v18-summary"></div>
        <nav class="v18-tabs">
          <button data-v18-tab="properties" class="active">Properties</button>
          <button data-v18-tab="contracts">Contracts</button>
          <button data-v18-tab="operations">Chapter Three</button>
          <button data-v18-tab="fleet">Fleet</button>
          <button data-v18-tab="collectibles">Collectibles</button>
        </nav>
        <div id="v18-content" class="v18-content"></div>
      </div>`;
    root.getElementById('game-root')?.append(modal);

    const open = () => { this.render(); modal.classList.remove('hidden'); };
    modal.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');
    chip.onclick = open;

    const pauseCard = root.querySelector('#pause-menu .pause-card');
    if (pauseCard && !root.getElementById('empire-btn')) {
      const button = root.createElement('button');
      button.id = 'empire-btn';
      button.textContent = 'Empire Command';
      button.onclick = open;
      pauseCard.insertBefore(button, root.getElementById('quit-btn'));
    }

    const phone = root.getElementById('phone-panel');
    if (phone && !root.getElementById('phone-empire-btn')) {
      const button = root.createElement('button');
      button.id = 'phone-empire-btn';
      button.className = 'v17-phone-button v18-phone-button';
      button.textContent = 'EMPIRE COMMAND';
      button.onclick = open;
      phone.querySelector('.phone-body, .phone-screen, .phone-card')?.append(button) || phone.append(button);
    }

    root.addEventListener('keydown', event => {
      if (event.code === 'KeyO' && !event.repeat) open();
    });

    modal.querySelectorAll('[data-v18-tab]').forEach(button => {
      button.onclick = () => {
        modal.querySelectorAll('[data-v18-tab]').forEach(item => item.classList.toggle('active', item === button));
        this.render(button.dataset.v18Tab);
      };
    });

    modal.addEventListener('click', event => {
      const action = event.target.closest('[data-v18-action]');
      if (!action) return;
      document.dispatchEvent(new CustomEvent('nb:v18-action', { detail: { action: action.dataset.v18Action, id: action.dataset.id, track: action.dataset.track, vehicle: action.dataset.vehicle } }));
    });

    this.ui = {
      modal,
      summary: root.getElementById('v18-summary'),
      content: root.getElementById('v18-content'),
      hud,
      title: root.getElementById('v18-contract-title'),
      objective: root.getElementById('v18-contract-objective'),
      progress: root.getElementById('v18-contract-progress'),
      time: root.getElementById('v18-contract-time'),
      empireValue: root.getElementById('v18-empire-value'),
    };
    this.render();
  }

  propertyValue() {
    return V18_PROPERTIES.reduce((total, property) => total + (this.properties[property.id] ? property.price : 0), 0);
  }

  incomeRate() {
    return V18_PROPERTIES.reduce((total, property) => total + (this.properties[property.id] ? property.income : 0), 0);
  }

  purchaseProperty(id, cash) {
    const property = V18_PROPERTIES.find(item => item.id === id);
    if (!property) return { ok: false, reason: 'Unknown property.' };
    if (this.properties[id]) return { ok: false, reason: `${property.name} is already owned.` };
    if (cash < property.price) return { ok: false, reason: `${property.name} costs ${formatMoney(property.price)}.` };
    this.properties[id] = true;
    this.syncWorldVisibility();
    this.render();
    return { ok: true, cost: property.price, property };
  }

  collectIncome() {
    const amount = Math.floor(this.propertyBank);
    this.propertyBank = 0;
    this.stats.totalEmpireIncome += amount;
    this.render();
    return amount;
  }

  startContract(id) {
    const definition = V18_CONTRACTS.find(item => item.id === id);
    if (!definition) return { ok: false, reason: 'Unknown contract.' };
    if (this.activeContract) return { ok: false, reason: 'Finish the active contract first.' };
    this.activeContract = {
      ...definition,
      remaining: definition.time,
      progress: 0,
      startedWanted: this.lastWanted,
      reachedWanted: false,
      districts: [],
      startingShards: this.collectedShards.size,
    };
    this.render();
    return { ok: true, contract: this.activeContract };
  }

  completeContract(success) {
    if (!this.activeContract) return null;
    const contract = this.activeContract;
    this.activeContract = null;
    if (success) {
      this.completedContracts += 1;
      this.stats.contractStreak += 1;
    } else {
      this.stats.contractStreak = 0;
    }
    this.render();
    return { ...contract, success };
  }

  completeOperation(id) {
    const operation = V18_OPERATIONS.find(item => item.id === id);
    if (!operation) return { ok: false, reason: 'Unknown operation.' };
    if (this.completedOperations[id]) return { ok: false, reason: `${operation.name} is already complete.` };
    if (this.completedContracts < operation.unlock) return { ok: false, reason: `Complete ${operation.unlock} contracts first.` };
    this.completedOperations[id] = true;
    this.stats.operationsCompleted = Object.keys(this.completedOperations).length;
    this.render();
    return { ok: true, operation };
  }

  upgradeFleet(vehicle, track, cash) {
    const state = this.fleet[vehicle];
    if (!state || !['engine', 'armor', 'nitro'].includes(track)) return { ok: false, reason: 'Unknown fleet upgrade.' };
    if (!state.owned) {
      const price = vehicle === 'ocean' ? 4200 : 7600;
      if (cash < price) return { ok: false, reason: `${vehicle.toUpperCase()} costs ${formatMoney(price)}.` };
      state.owned = true;
      this.render();
      return { ok: true, cost: price, vehicle, purchased: true };
    }
    const level = Number(state[track]) || 0;
    if (level >= 3) return { ok: false, reason: 'Fleet upgrade is already maxed.' };
    const cost = 700 + level * 650;
    if (cash < cost) return { ok: false, reason: `Upgrade costs ${formatMoney(cost)}.` };
    state[track] = level + 1;
    this.render();
    return { ok: true, cost, vehicle, track, level: level + 1 };
  }

  vehicleEffect(vehicle, track) {
    const level = Number(this.fleet[vehicle]?.[track]) || 0;
    if (track === 'engine') return 1 + level * 0.07;
    if (track === 'armor') return 1 - level * 0.08;
    if (track === 'nitro') return 1 + level * 0.12;
    return 1;
  }

  recordKill() {
    if (this.activeContract?.type === 'kills') this.activeContract.progress += 1;
  }

  update(dt, context = {}) {
    const position = context.playerPosition;
    if (position) {
      for (const mesh of this.shardMeshes) {
        if (!mesh.visible) continue;
        if (mesh.position.distanceTo(position) < 2.2) {
          const index = mesh.userData.v18Shard;
          this.collectedShards.add(index);
          mesh.visible = false;
          document.dispatchEvent(new CustomEvent('nb:v18-reward', { detail: { amount: 120, message: `Data shard ${this.collectedShards.size}/${SHARD_POSITIONS.length} recovered.` } }));
        }
        mesh.rotation.y += dt * 1.8;
        mesh.position.y = 0.8 + Math.sin(performance.now() * 0.002 + mesh.userData.v18Shard) * 0.16;
      }
      for (const mesh of this.propertyMeshes) mesh.rotation.y += dt * 0.35;
    }

    this.propertyClock += dt;
    if (this.propertyClock >= 60) {
      const cycles = Math.floor(this.propertyClock / 60);
      this.propertyClock -= cycles * 60;
      this.propertyBank += this.incomeRate() * cycles;
    }

    const contract = this.activeContract;
    if (contract) {
      contract.remaining -= dt;
      const district = districtAt(position);
      if (district && !contract.districts.includes(district.id)) contract.districts.push(district.id);
      if (position && this.lastPosition) {
        const distance = position.distanceTo(this.lastPosition);
        if (contract.type === 'drive' && context.activeVehicle) contract.progress += distance;
      }
      if (contract.type === 'wanted' && (context.wanted || 0) > 0) contract.progress += dt;
      if (contract.type === 'collectibles') contract.progress = this.collectedShards.size - contract.startingShards;
      if (contract.type === 'districts') contract.progress = contract.districts.length;
      if (contract.type === 'nitro' && context.nitroActive) contract.progress += dt;
      if (contract.type === 'survive') contract.progress += dt;
      if (contract.type === 'escape') {
        if ((context.wanted || 0) >= 3) contract.reachedWanted = true;
        contract.progress = contract.reachedWanted && (context.wanted || 0) === 0 ? 1 : 0;
      }
      if (contract.progress >= contract.target) {
        const result = this.completeContract(true);
        document.dispatchEvent(new CustomEvent('nb:v18-contract-complete', { detail: result }));
      } else if (contract.remaining <= 0) {
        const result = this.completeContract(false);
        document.dispatchEvent(new CustomEvent('nb:v18-contract-complete', { detail: result }));
      }
    }

    if (position) this.lastPosition = position.clone();
    this.lastWanted = context.wanted || 0;
    this.updateUI(context);
  }

  syncWorldVisibility() {
    this.shardMeshes.forEach(mesh => { mesh.visible = !this.collectedShards.has(mesh.userData.v18Shard); });
    this.propertyMeshes.forEach(mesh => {
      const owned = !!this.properties[mesh.userData.v18Property];
      mesh.material.color.setHex(owned ? 0x48ffb0 : 0xffb24f);
      mesh.material.emissive.setHex(owned ? 0x087a45 : 0x7a3100);
    });
  }

  render(tab = null) {
    if (!this.ui.content) return;
    const activeTab = tab || this.ui.modal?.querySelector('[data-v18-tab].active')?.dataset.v18Tab || 'properties';
    this.ui.summary.innerHTML = `
      <div><span>PROPERTY VALUE</span><b>${formatMoney(this.propertyValue())}</b></div>
      <div><span>PASSIVE INCOME</span><b>${formatMoney(this.incomeRate())}/MIN</b></div>
      <div><span>BANKED</span><b>${formatMoney(this.propertyBank)}</b></div>
      <div><span>CONTRACTS</span><b>${this.completedContracts}</b></div>
      <button data-v18-action="collect-income" ${this.propertyBank < 1 ? 'disabled' : ''}>Collect Income</button>`;

    if (activeTab === 'properties') {
      this.ui.content.innerHTML = `<div class="v18-grid">${V18_PROPERTIES.map(property => `
        <article class="v18-card ${this.properties[property.id] ? 'owned' : ''}">
          <span>${property.district}</span><h3>${property.name}</h3><p>${property.description}</p>
          <footer><b>${this.properties[property.id] ? `${formatMoney(property.income)}/MIN` : formatMoney(property.price)}</b>
          <button data-v18-action="buy-property" data-id="${property.id}" ${this.properties[property.id] ? 'disabled' : ''}>${this.properties[property.id] ? 'OWNED' : 'PURCHASE'}</button></footer>
        </article>`).join('')}</div>`;
    } else if (activeTab === 'contracts') {
      this.ui.content.innerHTML = `<div class="v18-grid">${V18_CONTRACTS.map(contract => `
        <article class="v18-card"><span>REPLAYABLE CONTRACT</span><h3>${contract.name}</h3><p>${contract.description}</p><footer><b>${formatMoney(contract.reward)}</b><button data-v18-action="start-contract" data-id="${contract.id}" ${this.activeContract ? 'disabled' : ''}>START</button></footer></article>`).join('')}</div>`;
    } else if (activeTab === 'operations') {
      this.ui.content.innerHTML = `<div class="v18-grid">${V18_OPERATIONS.map(operation => {
        const complete = !!this.completedOperations[operation.id];
        const locked = this.completedContracts < operation.unlock;
        return `<article class="v18-card ${complete ? 'owned' : ''}"><span>CHAPTER THREE · OPERATION</span><h3>${operation.name}</h3><p>${operation.description}</p><footer><b>${complete ? 'COMPLETE' : locked ? `${operation.unlock} CONTRACTS` : formatMoney(operation.reward)}</b><button data-v18-action="complete-operation" data-id="${operation.id}" ${complete || locked ? 'disabled' : ''}>${complete ? 'DONE' : locked ? 'LOCKED' : 'LAUNCH'}</button></footer></article>`;
      }).join('')}</div>`;
    } else if (activeTab === 'fleet') {
      this.ui.content.innerHTML = `<div class="v18-grid">${Object.entries(this.fleet).map(([vehicle, data]) => `
        <article class="v18-card ${data.owned ? 'owned' : ''}"><span>PERSONAL FLEET</span><h3>${vehicle.toUpperCase()}</h3><p>${data.owned ? 'Tune your persistent personal vehicle.' : 'Purchase and add this vehicle to your fleet.'}</p>
          <div class="v18-upgrades">${['engine','armor','nitro'].map(track => `<button data-v18-action="fleet-upgrade" data-vehicle="${vehicle}" data-track="${track}" ${!data.owned && track !== 'engine' ? 'disabled' : ''}>${data.owned ? `${track.toUpperCase()} · LV ${data[track]}` : track === 'engine' ? `BUY ${vehicle === 'ocean' ? '$4,200' : '$7,600'}` : 'LOCKED'}</button>`).join('')}</div>
        </article>`).join('')}</div>`;
    } else {
      this.ui.content.innerHTML = `<div class="v18-collectibles"><div class="v18-shard-progress"><b>${this.collectedShards.size}</b><span>/ ${SHARD_POSITIONS.length} DATA SHARDS</span></div><p>Explore rooftops, alleys, beaches and industrial zones. Every shard awards cash; complete sets unlock empire prestige.</p><div class="v18-shard-list">${SHARD_POSITIONS.map((_, index) => `<i class="${this.collectedShards.has(index) ? 'found' : ''}">${index + 1}</i>`).join('')}</div></div>`;
    }
    if (this.ui.empireValue) this.ui.empireValue.textContent = formatMoney(this.propertyValue() + this.propertyBank);
    this.ui.modal?.querySelectorAll('[data-v18-tab]').forEach(button => button.classList.toggle('active', button.dataset.v18Tab === activeTab));
  }

  updateUI() {
    const contract = this.activeContract;
    this.ui.hud?.classList.toggle('hidden', !contract);
    if (contract) {
      this.ui.title.textContent = contract.name;
      this.ui.objective.textContent = contract.description;
      const progress = contract.type === 'drive' ? `${Math.floor(contract.progress)} / ${contract.target}m` : `${Math.floor(contract.progress)} / ${contract.target}`;
      this.ui.progress.textContent = progress;
      this.ui.time.textContent = `${Math.max(0, Math.ceil(contract.remaining))}s`;
    }
    if (this.ui.empireValue) this.ui.empireValue.textContent = formatMoney(this.propertyValue() + this.propertyBank);
  }

  serialize() {
    return {
      properties: { ...this.properties },
      propertyBank: this.propertyBank,
      propertyClock: this.propertyClock,
      completedContracts: this.completedContracts,
      completedOperations: { ...this.completedOperations },
      activeContract: null,
      collectedShards: [...this.collectedShards],
      fleet: JSON.parse(JSON.stringify(this.fleet)),
      stats: { ...this.stats },
    };
  }
}
