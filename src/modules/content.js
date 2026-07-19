export const WEAPONS = {
  pistol: {
    id: 'pistol', name: '9MM PISTOL', capacity: 12, cadence: 220, reloadMs: 1050,
    pellets: 1, spread: 0.002, damage: 42, bossDamage: 32, range: 90,
    shopAmmo: 36, shopCost: 180
  },
  shotgun: {
    id: 'shotgun', name: 'PUMP SHOTGUN', capacity: 6, cadence: 780, reloadMs: 1450,
    pellets: 7, spread: 0.035, damage: 17, bossDamage: 13, range: 48,
    shopAmmo: 18, shopCost: 260
  }
};

export const VEHICLE_SPECS = {
  sunset: { name: 'Sunset GT', maxSpeed: 39, reverseSpeed: 13, acceleration: 20, brake: 34, drag: 2.1, steering: 2.15, grip: 8.2, mass: 1.0 },
  ocean: { name: 'Oceanic Coupe', maxSpeed: 35, reverseSpeed: 12, acceleration: 17.5, brake: 31, drag: 2.35, steering: 1.92, grip: 9.4, mass: 1.08 },
  van: { name: 'Harbor Van', maxSpeed: 27, reverseSpeed: 10, acceleration: 12.8, brake: 25, drag: 2.8, steering: 1.38, grip: 11.2, mass: 1.55 },
  police: { name: 'Interceptor', maxSpeed: 34, reverseSpeed: 12, acceleration: 18, brake: 32, drag: 2.25, steering: 1.82, grip: 10.2, mass: 1.22 },
  traffic: { name: 'City Coupe', maxSpeed: 31, reverseSpeed: 11, acceleration: 15, brake: 27, drag: 2.5, steering: 1.65, grip: 10, mass: 1.12 }
};

export const FIRST_RIDE_INTRO = [
  { speaker: 'MARA VELEZ', text: 'Neon Bay rewards people who move before the sirens start.', duration: 2.8 },
  { speaker: 'MARA VELEZ', text: 'There is a Sunset GT in the courtyard. Deliver it clean and the city opens up.', duration: 3.1 },
  { speaker: 'OBJECTIVE', text: 'Meet Mara in the apartment courtyard.', duration: 2.3 }
];

export const FIRST_RIDE_CONTACT = [
  { speaker: 'MARA VELEZ', text: 'Pink car. Coastline garage. No dents, no questions.', duration: 2.6 },
  { speaker: 'PLAYER', text: 'And if somebody asks?', duration: 1.8 },
  { speaker: 'MARA VELEZ', text: 'Drive faster.', duration: 1.7 }
];
