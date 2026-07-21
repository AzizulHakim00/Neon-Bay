export const RADIO_STATIONS = [
  { id: 'flashwave', name: 'FLASHWAVE 86', tagline: 'Neon synth and midnight drives', frequencies: [55, 82.41, 110, 164.81], waveforms: ['sine', 'triangle', 'sawtooth', 'triangle'] },
  { id: 'sunset', name: 'SUNSET FM', tagline: 'Coastal funk after dark', frequencies: [65.41, 98, 130.81, 196], waveforms: ['triangle', 'sine', 'square', 'triangle'] },
  { id: 'nightdrive', name: 'NIGHTDRIVE', tagline: 'Slow electronic city pulse', frequencies: [46.25, 69.3, 92.5, 138.59], waveforms: ['sine', 'sine', 'triangle', 'sawtooth'] },
];

export const DISTRICTS = [
  { id: 'ocean-drive', name: 'OCEAN DRIVE', color: '#ff4fb7', contains: (x, z) => x > 55 && z < 18 },
  { id: 'vice-point', name: 'VICE POINT', color: '#42e8ff', contains: (x, z) => x > 55 && z >= 18 },
  { id: 'harbor', name: 'HARBOR DISTRICT', color: '#ffb84a', contains: (x, z) => x < -65 && z > 35 },
  { id: 'downtown', name: 'DOWNTOWN', color: '#9a75ff', contains: (x, z) => Math.abs(x) <= 65 && z > 35 },
  { id: 'little-bay', name: 'LITTLE BAY', color: '#62f2a9', contains: () => true },
];

export function districtAt(x, z) {
  return DISTRICTS.find(district => district.contains(x, z)) || DISTRICTS[DISTRICTS.length - 1];
}

export const BUSINESS_DEFINITIONS = {
  nightclub: { name: 'STARFALL NIGHTCLUB', price: 6500, income: 650, interval: 48, reputation: 180 },
  taxi: { name: 'COASTLINE CABS', price: 3500, income: 320, interval: 42, reputation: 90 },
  garage: { name: 'VICE COAST CUSTOMS', price: 5200, income: 460, interval: 52, reputation: 130 },
};

export class BusinessEmpire {
  constructor(data = {}) {
    this.owned = { nightclub: false, taxi: false, garage: false, ...(data.owned || {}) };
    this.timers = { nightclub: 0, taxi: 0, garage: 0, ...(data.timers || {}) };
    this.lifetimeIncome = Math.max(0, Number(data.lifetimeIncome) || 0);
  }

  canBuy(id, cash) {
    const business = BUSINESS_DEFINITIONS[id];
    return !!business && !this.owned[id] && cash >= business.price;
  }

  purchase(id, cash) {
    const business = BUSINESS_DEFINITIONS[id];
    if (!business) return { ok: false, reason: 'Unknown business.' };
    if (this.owned[id]) return { ok: false, reason: `${business.name} is already owned.` };
    if (cash < business.price) return { ok: false, reason: `${business.name} costs $${business.price}.` };
    this.owned[id] = true;
    this.timers[id] = 0;
    return { ok: true, cost: business.price, business };
  }

  update(dt) {
    const payouts = [];
    for (const [id, business] of Object.entries(BUSINESS_DEFINITIONS)) {
      if (!this.owned[id]) continue;
      this.timers[id] += dt;
      while (this.timers[id] >= business.interval) {
        this.timers[id] -= business.interval;
        this.lifetimeIncome += business.income;
        payouts.push({ id, ...business });
      }
    }
    return payouts;
  }

  ownedCount() {
    return Object.values(this.owned).filter(Boolean).length;
  }

  projectedIncome() {
    return Object.entries(BUSINESS_DEFINITIONS).reduce((sum, [id, business]) => sum + (this.owned[id] ? business.income : 0), 0);
  }

  serialize() {
    return { owned: { ...this.owned }, timers: { ...this.timers }, lifetimeIncome: this.lifetimeIncome };
  }
}

export const CHAPTER_TWO_MISSIONS = [
  { title: 'Aftermath', reward: 2600, summary: 'The retaliation broke against the nightclub doors.', start: [-141, 112] },
  { title: 'Inside Job', reward: 3400, summary: 'The evidence disappeared before the night shift noticed.', start: [108, -90] },
  { title: 'Harbor Run', reward: 4200, summary: 'The cargo crossed the city under a wall of sirens.', start: [-132, 104] },
  { title: 'Double Cross', reward: 5200, summary: 'The traitor lost the city—and the crew learned the truth.', start: [90, -54] },
  { title: 'Neon Crown', reward: 10000, summary: 'The Vice Coast has a new power after midnight.', start: [112, 42] },
];
