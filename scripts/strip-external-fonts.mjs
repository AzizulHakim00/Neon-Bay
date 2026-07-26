import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (absolute.endsWith('.css')) files.push(absolute);
  }
};
walk(root);

for (const file of files) {
  let css = fs.readFileSync(file, 'utf8');
  css = css
    // Match the complete url(...) statement. Google Fonts URLs contain semicolons,
    // so stopping at the first semicolon corrupts the generated stylesheet.
    .replace(/@import\s+url\(\s*(['"])https:\/\/fonts\.googleapis\.com\/[^)]*\1\s*\)\s*;?/gi, '')
    .replace(/@import\s+(['"])https:\/\/fonts\.googleapis\.com\/.*?\1\s*;?/gi, '')
    .replace(/font-family:\s*Inter\s*,\s*system-ui\s*,\s*sans-serif/gi, 'font-family:Arial,Helvetica,system-ui,sans-serif')
    .replace(/font-family:\s*["']?Barlow Condensed["']?\s*,\s*sans-serif/gi, 'font-family:"Arial Narrow","Aptos Narrow",Arial,sans-serif')
    .replace(/([,\s:])Inter(?=[,;\s}])/g, '$1Arial')
    .replace(/["']?Barlow Condensed["']?/g, '"Arial Narrow"');
  fs.writeFileSync(file, css, 'utf8');
}

console.log(`Removed external font dependencies from ${files.length} CSS bundle(s).`);
