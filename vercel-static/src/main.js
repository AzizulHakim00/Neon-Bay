const parts = ['main.part-00.jsfrag', 'main.part-01.jsfrag', 'main.part-02.jsfrag', 'main.part-03.jsfrag', 'main.part-04.jsfrag', 'main.part-05.jsfrag', 'main.part-06.jsfrag', 'main.part-07.jsfrag', 'main.part-08.jsfrag', 'main.part-09.jsfrag', 'main.part-10.jsfrag', 'main.part-11.jsfrag', 'main.part-12.jsfrag', 'main.part-13a.jsfrag', 'main.part-13b.jsfrag', 'main.part-14.jsfrag', 'main.part-15.jsfrag', 'main.part-16.jsfrag', 'main.part-17.jsfrag', 'main.part-18.jsfrag', 'main.part-19.jsfrag', 'main.part-20.jsfrag'];
const source = await Promise.all(parts.map(async (name) => {
  const response = await fetch(new URL(`./main-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load Neon Bay engine part ${name}: ${response.status}`);
  return response.text();
}));
const engineSource = source.join('').replace(/(['"])\/src\//g, (_, quote) => `${quote}${location.origin}/src/`);
const blob = new Blob([engineSource, `
//# sourceURL=neon-bay-v1.5-engine.js
`], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
try { await import(url); } finally { URL.revokeObjectURL(url); }
