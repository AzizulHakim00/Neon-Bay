const parts = ['citizen.part-00.txt', 'citizen.part-01.txt', 'citizen.part-02.txt', 'citizen.part-03.txt'];
const values = await Promise.all(parts.map(async (name) => {
  const response = await fetch(new URL(`./neon-citizen-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load citizen model part ${name}`);
  return response.text();
}));
export const NEON_CITIZEN_GLB_DATA = values.join('');
