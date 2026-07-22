const parts = ['interior.part-00.jsfrag', 'interior.part-01.jsfrag'];
const source = await Promise.all(parts.map(async (name) => {
  const response = await fetch(new URL(`./interior-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load interior module part ${name}`);
  return response.text();
}));
const url = URL.createObjectURL(new Blob([source.join('')], { type: 'text/javascript' }));
let loaded;
try { loaded = await import(url); } finally { URL.revokeObjectURL(url); }
export const InteriorSystem = loaded.InteriorSystem;
