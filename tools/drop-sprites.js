/* Deletes the loose item/sprites and icons/sprites files that js/item-sheet.js now cuts out of the sheets in the browser.
   Keeps the ones listed in LOOSE there. DRY RUN by default.
   usage (from the game folder): node tools/drop-sprites.js [--apply]   (git restores anything deleted) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'item-sheet.js'), 'utf8');
const MAP = JSON.parse(src.match(/const MAP = (\{.*?\});/s)[1]);
const LOOSE = new Set((src.match(/const LOOSE = new Set\(\[([^\]]*)\]/)[1].match(/'[^']+'/g) || []).map(x => x.slice(1, -1)));
const apply = process.argv.includes('--apply');
let n = 0;
Object.keys(MAP).filter(k => !LOOSE.has(k)).forEach(k => {
  const file = path.join(ROOT, k.replace('/', '/sprites/') + '.png');
  if (!fs.existsSync(file)) return;
  n++;
  if (apply) fs.unlinkSync(file);
});
console.log((apply ? 'deleted ' : 'would delete ') + n + ' loose sprite files');
