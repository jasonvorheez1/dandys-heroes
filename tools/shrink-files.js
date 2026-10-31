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

const redirect = fs.readFileSync(path.join(ROOT, 'js', 'audio-redirect.js'), 'utf8');
JSON.parse(redirect.match(/new Set\((\[.*?\])\)/s)[1]).forEach(w => {
  if (fs.existsSync(path.join(ROOT, w)) && fs.existsSync(path.join(ROOT, w.replace(/\.wav$/i, '.ogg')))) victims.push(w);
});
const wavCount = victims.length;

if (uploads) {
  const code = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'))
    .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n') + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    + fs.readdirSync(path.join(ROOT, 'css')).map(f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')).join(" ");
  fs.readdirSync(path.join(ROOT, 'uploads')).forEach(name => {
    const full = path.join(ROOT, 'uploads', name);
    if (fs.statSync(full).isFile() && !code.includes(name)) victims.push(rel(full));
  });
}

let bytes = 0;
victims.forEach(v => { bytes += fs.statSync(path.join(ROOT, v)).size; if (apply) fs.unlinkSync(path.join(ROOT, v)); });
console.log((apply ? 'deleted ' : 'would delete ') + victims.length + ' files (' + wavCount + ' wav, ' + (victims.length - wavCount) + ' unused uploads), ' + (bytes / 1048576).toFixed(1) + ' MB');
if (!apply) console.log(victims.slice(0, 15).join('\n') + (victims.length > 15 ? '\n...' : ''));
