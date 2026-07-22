const parts = ['main.part-00.jsfrag', 'main.part-01.jsfrag', 'main.part-02.jsfrag', 'main.part-03.jsfrag', 'main.part-04.jsfrag', 'main.part-05.jsfrag', 'main.part-06.jsfrag'];
const source = await Promise.all(parts.map(async (name) => {
  const response = await fetch(new URL(`./main-parts/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load Neon Bay engine part ${name}: ${response.status}`);
  return response.text();
}));
const blob = new Blob([source.join(''), `
//# sourceURL=neon-bay-v1.5-engine.js
`], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
try {
  await import(url);
} finally {
  URL.revokeObjectURL(url);
}
