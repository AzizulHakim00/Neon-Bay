const parts = ["main.part-00.jsfrag", "main.part-01.jsfrag", "main.part-02.jsfrag", "main.part-03.jsfrag", "main.part-04.jsfrag", "main.part-05.jsfrag", "main.part-06.jsfrag", "main.part-07.jsfrag", "main.part-08.jsfrag", "main.part-09.jsfrag", "main.part-10.jsfrag", "main.part-11.jsfrag", "main.part-12.jsfrag", "main.part-13.jsfrag"];
let source = (await Promise.all(parts.map(async name => {
  const response = await fetch(new URL(`./main-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load Neon Bay v1.6 engine part ${name}: ${response.status}`);
  return response.text();
}))).join('');
const moduleBase = new URL('./modules/', import.meta.url).href;
const assetBase = new URL('./assets/', import.meta.url).href;
source = source.replaceAll("from './modules/", `from '${moduleBase}`);
source = source.replaceAll('from "./modules/', `from "${moduleBase}`);
source = source.replaceAll("from './assets/", `from '${assetBase}`);
source = source.replaceAll('from "./assets/', `from "${assetBase}`);
const blob = new Blob([source, `\n//# sourceURL=neon-bay-v1.6-engine.js\n`], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
try { await import(url); } finally { URL.revokeObjectURL(url); }
