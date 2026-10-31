/* Moves top-level asset folders under assets/ and rewrites every path to them in js/, css/, index.html and server.js.
   DRY RUN by default: prints how many paths would change per folder, a sample, and the places that mention a folder but would NOT be rewritten.
   usage (from the game folder):
     node tools/move-folders.js                     dry run for every folder
     node tools/move-folders.js OBJECT VFX          dry run for these folders only
     node tools/move-folders.js --apply OBJECT      rewrite paths, move the folder, then verify (stops and reports if anything is missing)
   Commit first. git restores everything if a step goes wrong.
   Left alone on purpose: item/ and icons/ (their names are also logical keys in js/item-sheet.js), SFX/ and ui/ (code lives there too). */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAIRS = { OBJECT: 'assets/objects', VFX: 'assets/vfx', Stagebackgrounds: 'assets/backgrounds', enemies: 'assets/enemies', Characters: 'assets/toon-art', uploads: 'assets/uploads' };
const args = process.argv.slice(2), apply = args.includes('--apply');
const chosen = args.filter(a => PAIRS[a]);
const todo = chosen.length ? chosen : Object.keys(PAIRS);

const textFiles = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name), rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (/^(\.git|vendor|tools|node_modules)(\/|$)/.test(rel) || /^assets\/.*\.(png|webp|gif|ogg|mp3|wav|svg|bin|ttf)$/i.test(rel)) continue;
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/^(js\/.*\.js|css\/.*\.css|index\.html|server\.js)$/.test(rel)) textFiles.push(rel);
  }
})(ROOT);

// A path starts after a quote, backtick, parenthesis, = , whitespace or "./", never in the middle of a longer name.
const regexFor = old => new RegExp('(?<!githubAsset\\()(^|[\'"`(=,:}\\s]|\\./)' + old + '/', 'g');
const looseRegex = old => new RegExp(old + '/', 'g');

const report = {};
todo.forEach(old => {
  report[old] = { changed: 0, files: {}, skipped: [] };
  textFiles.forEach(rel => {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const safe = (text.match(regexFor(old)) || []).length, all = (text.match(looseRegex(old)) || []).length;
    if (safe) { report[old].changed += safe; report[old].files[rel] = safe; }
    if (all > safe) {
      let m; const re = looseRegex(old);
      while ((m = re.exec(text)) && report[old].skipped.length < 6) {
        if (!regexFor(old).test(text.slice(Math.max(0, m.index - 14), m.index + old.length + 1))) report[old].skipped.push(rel + ': ...' + text.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ') + '...');
      }
    }
  });
});

todo.forEach(old => {
  const r = report[old];
  console.log(`${old} -> ${PAIRS[old]}: ${r.changed} paths in ${Object.keys(r.files).length} files` + (r.skipped.length ? `, ${r.skipped.length}+ mentions NOT rewritten (review):` : ''));
  r.skipped.forEach(s => console.log('   ' + s));
});

if (!apply) { console.log('\nDry run only. Nothing changed.'); process.exit(0); }

todo.forEach(old => {
  if (!fs.existsSync(path.join(ROOT, old))) { console.log(old + ' already moved, skipping'); return; }
  textFiles.forEach(rel => {
    const file = path.join(ROOT, rel);
    const text = fs.readFileSync(file, 'utf8'), next = text.replace(regexFor(old), (_, pre) => pre + PAIRS[old] + '/');
    if (next !== text) fs.writeFileSync(file, next);
  });
  fs.mkdirSync(path.join(ROOT, path.dirname(PAIRS[old])), { recursive: true });
  fs.renameSync(path.join(ROOT, old), path.join(ROOT, PAIRS[old]));
  console.log('moved ' + old + ' -> ' + PAIRS[old]);
});

// verify: every moved-folder path written in the code must exist
let missing = 0;
todo.forEach(old => {
  const dest = PAIRS[old], re = new RegExp(dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[A-Za-z0-9_ ()%.,@+\'&-]+(?:/[A-Za-z0-9_ ()%.,@+\'&-]+)*\\.[A-Za-z0-9]{2,5}', 'g');
  textFiles.forEach(rel => {
    const seen = new Set(fs.readFileSync(path.join(ROOT, rel), 'utf8').match(re) || []);
    seen.forEach(p => { let q = p; try { q = decodeURIComponent(p); } catch (_) { /* keep */ } if (!fs.existsSync(path.join(ROOT, q))) { missing++; if (missing <= 25) console.log('MISSING ' + p + '  (in ' + rel + ')'); } });
  });
});
console.log(missing ? `\n${missing} paths point at files that do not exist. Review before committing (some are names built at run time).` : '\nEvery path that is written out in full exists.');
