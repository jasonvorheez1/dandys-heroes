/* Cuts the file count. DRY RUN by default: prints what it would delete and changes nothing.
   usage (from the game folder):
     node tools/shrink-files.js            list only
     node tools/shrink-files.js --apply    delete the .wav files that have a smaller .ogg twin (js/audio-redirect.js serves the .ogg)
     node tools/shrink-files.js --apply --uploads   also delete uploads/ files whose name appears nowhere in js/ (66 at last count)
   Everything it deletes is tracked by git, so `git checkout -- <path>` brings it back.
   Run tools/convert-audio.js first when new .wav files are added. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const apply = process.argv.includes('--apply'), uploads = process.argv.includes('--uploads');
const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
const victims = [];
const ROOT_SCAN = ROOT;

const redirect = fs.readFileSync(path.join(ROOT, 'js', 'audio-redirect.js'), 'utf8');
JSON.parse(redirect.match(/new Set\((\[.*?\])\)/s)[1]).forEach(w => {
  if (fs.existsSync(path.join(ROOT, w)) && fs.existsSync(path.join(ROOT, w.replace(/\.wav$/i, '.ogg')))) victims.push(w);
});
const wavCount = victims.length;

if (uploads) {
  // every script, including js/story, js/rigs and js/shop, plus css, html and server.js
  let code = '';
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (/^(\.git|vendor|node_modules|tools|assets|uploads|SFX)$/.test(name) && dir === ROOT) continue;
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(js|css|html)$/.test(name)) code += fs.readFileSync(full, 'utf8') + '\n';
    }
  })(ROOT_SCAN);
  fs.readdirSync(path.join(ROOT, 'uploads')).forEach(name => {
    const full = path.join(ROOT, 'uploads', name);
    if (fs.statSync(full).isFile() && !code.includes(name)) victims.push(rel(full));
  });
}

let bytes = 0;
victims.forEach(v => { bytes += fs.statSync(path.join(ROOT, v)).size; if (apply) fs.unlinkSync(path.join(ROOT, v)); });
console.log((apply ? 'deleted ' : 'would delete ') + victims.length + ' files (' + wavCount + ' wav, ' + (victims.length - wavCount) + ' unused uploads), ' + (bytes / 1048576).toFixed(1) + ' MB');
if (!apply) console.log(victims.slice(0, 15).join('\n') + (victims.length > 15 ? '\n...' : ''));
