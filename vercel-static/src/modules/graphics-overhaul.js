const parts = ['graphics.part-00.jsfrag', 'graphics.part-01.jsfrag', 'graphics.part-02.jsfrag'];
const source = await Promise.all(parts.map(async (name) => {
  const response = await fetch(new URL(`./graphics-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load graphics module part ${name}`);
  return response.text();
}));
const url = URL.createObjectURL(new Blob([source.join('')], { type: 'text/javascript' }));
let loaded;
try { loaded = await import(url); } finally { URL.revokeObjectURL(url); }
export const GRAPHICS_QUALITY = loaded.GRAPHICS_QUALITY;
export const graphicsProfile = loaded.graphicsProfile;
export const atmosphericExposure = loaded.atmosphericExposure;
export const atmosphericFog = loaded.atmosphericFog;
export const GraphicsOverhaul = loaded.GraphicsOverhaul;
