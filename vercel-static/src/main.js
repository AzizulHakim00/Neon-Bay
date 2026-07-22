import { V16_ENGINE_PATCHES } from './v16-engine-patch.js';

const parts = ['main.part-00.jsfrag', 'main.part-01.jsfrag', 'main.part-02.jsfrag', 'main.part-03.jsfrag', 'main.part-04.jsfrag', 'main.part-05.jsfrag', 'main.part-06.jsfrag', 'main.part-07.jsfrag', 'main.part-08.jsfrag', 'main.part-09.jsfrag', 'main.part-10.jsfrag', 'main.part-11.jsfrag', 'main.part-12.jsfrag', 'main.part-13a.jsfrag', 'main.part-13b.jsfrag', 'main.part-14.jsfrag', 'main.part-15.jsfrag', 'main.part-16.jsfrag', 'main.part-17.jsfrag', 'main.part-18.jsfrag', 'main.part-19.jsfrag', 'main.part-20.jsfrag'];
let source = (await Promise.all(parts.map(async name => {
  const response = await fetch(new URL(`./main-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load Neon Bay engine part ${name}: ${response.status}`);
  return response.text();
}))).join('');

// The v1.5 browser release stores root-relative module paths, while the readable
// v1.6 patch is shared with the editable source tree. Normalize temporarily,
// apply every deterministic patch, then make Blob imports origin-qualified.
source = source
  .replace(/from '\/src\/modules\//g, "from './modules/")
  .replace(/from \"\/src\/modules\//g, 'from \"./modules/')
  .replace(/from '\/src\/assets\//g, "from './assets/")
  .replace(/from \"\/src\/assets\//g, 'from \"./assets/');
for (const [index, patch] of V16_ENGINE_PATCHES.entries()) {
  const occurrences = source.split(patch.before).length - 1;
  if (occurrences !== 1) throw new Error(`Neon Bay v1.6 patch ${index + 1} expected one source match, found ${occurrences}`);
  source = source.replace(patch.before, patch.after);
}
const moduleBase = `${location.origin}/src/modules/`;
const assetBase = `${location.origin}/src/assets/`;
const engineSource = source
  .replace(/from '\.\/modules\//g, `from '${moduleBase}`)
  .replace(/from \"\.\/modules\//g, `from \"${moduleBase}`)
  .replace(/from '\.\/assets\//g, `from '${assetBase}`)
  .replace(/from \"\.\/assets\//g, `from \"${assetBase}`);
const blob = new Blob([engineSource, `\n//# sourceURL=neon-bay-v1.6-engine.js\n`], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
try { await import(url); } finally { URL.revokeObjectURL(url); }
