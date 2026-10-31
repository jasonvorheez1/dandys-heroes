/* Removes named clips from the void sound pack for good (rewrites assets/aperture/sfx/void-sfx.bin, void-index.json and void-names.md).
   usage: node tools/portal/prune-void.js void-2-36 void-4-9 ...      (names as shown by tools/portal/audition-void.html) */
'use strict';
const fs = require('fs');
const path = require('path');

const names = process.argv.slice(2);
if (!names.length) { console.log('usage: node prune-void.js <clip name> ...'); process.exit(1); }
const dir = path.resolve(__dirname, '..', '..', 'assets', 'aperture', 'sfx');
const bin = fs.readFileSync(path.join(dir, 'void-sfx.bin')), index = JSON.parse(fs.readFileSync(path.join(dir, 'void-index.json'), 'utf8'));
const out = {}, chunks = [];
let offset = 0, removed = 0;
for (const [name, [at, len, secs]] of Object.entries(index)) {
  if (names.includes(name)) { removed++; continue; }
  chunks.push(bin.subarray(at, at + len)); out[name] = [offset, len, secs]; offset += len;
}
fs.writeFileSync(path.join(dir, 'void-sfx.bin'), Buffer.concat(chunks));
fs.writeFileSync(path.join(dir, 'void-index.json'), JSON.stringify(out));
fs.writeFileSync(path.join(dir, 'void-names.md'), '# Void sound pieces (not all auditioned)\n\n' + Object.entries(out).map(([n, v]) => n + '\t' + v[2] + 's').join('\n') + '\n');
console.log('removed ' + removed + ' of ' + names.length + ' named, ' + Object.keys(out).length + ' left');
