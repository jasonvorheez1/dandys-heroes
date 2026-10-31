# HANDOFF: Dandy's Heroes (read this first)

Static browser game. Run with `Play_Game.bat` or `node server.js` (the Claude preview served it on port 8123). In the preview the game
is inside an `<iframe>`; read its globals with `document.querySelector('iframe').contentWindow.eval('Save.data')`
(top-level `const`/`class` globals are not on `window`).

## Code layout (easy to get wrong)
- `js/game.js` (~4.8 MB, one line) is a **bundle**: `var S=[["core.js","<source>"], ...]`. Do not hand-edit it.
  `tools/bundle.py list | get NAME OUT | put NAME IN` inspects/replaces a script (change its hardcoded `SRC` path first).
- Newer code is separate scripts loaded AFTER the bundle: list is `GAME_SCRIPTS` in `js/item-sheet.js`; CSS is linked in `index.html`.
  Prefer adding/wrapping in a new script (see `js/boskers-globe.js`, `js/roster-refresh.js`).
- Wrapping pattern: `const f = Obj.fn; Obj.fn = function () { ...; return f.apply(this, arguments); }`. Bundle `function` declarations
  (`playerSpec`, `payoutBattle`...) can be reassigned from a later script; classes via `Battle.prototype.x`.
- Run `node --check file.js` after every JS edit. Git is the safety net (commit often).

## Folder layout (reorganised 2026-10-31)
Root holds only index.html, server.js, Play_Game.bat, HANDOFF.md, js/, css/, tools/, vendor/, plus SFX/, ui/, meta/, item/, icons/ (left in place on purpose).
Assets moved under assets/: toon-art (was Characters), enemies, objects (was OBJECT), vfx (was VFX), backgrounds (was Stagebackgrounds), uploads.
`tools/move-folders.js` did the move (dry run by default) and rewrote paths in js/, css/, index.html, server.js. It leaves remote paths alone (githubAsset(...), the jsDelivr uploads URL) and assets/ff7/enemies. Paths built at run time cannot be checked by script; test in the browser.
**Lesson:** tools/shrink-files.js once scanned only js/*.js and deleted 25 uploads used by js/story/*; it now scans every script. Never judge a file unused from a top-level search only.
Fixed 2026-10-31: SPECIAL_HERO_ICONS.Discard now points at icon.webp. Some code writes sfx/ in lowercase for the SFX/ folder; js/audio-redirect.js matches paths case-insensitively (Windows hides this, Linux hosting does not).

## Assets (do not rename or delete casually)
- Files are referenced by path string inside the bundle. Some audio/music loads from CDN/GitHub (`uploadUrl`, `UPLOADS_CDN`, `GITHUB_ASSETS` in core.js).
- Audio: `tools/convert-audio.js` makes `.ogg` beside each local `.wav` (SFX/, assets/) and regenerates `js/audio-redirect.js`
  (loaded first in index.html), which swaps `.wav` URLs for `.ogg` at runtime. Re-run it after adding any `.wav`.
  Where an `.ogg` exists the `.wav` was deleted by `tools/shrink-files.js`, so very old Safari/iOS without Ogg will lack those sounds.
- Sound pack: `tools/pack-audio.js` packs the 413 short .ogg effects into `SFX/sfx-pack.bin` + `js/audio-pack.js` (index and loader). `js/item-sheet.js` holds the game on the loading screen until the pack arrives; `audio-redirect.js` then serves each sound as a blob URL. `node tools/pack-audio.js --apply` deletes the loose packed .ogg files (git restores them). After adding a sound: run convert-audio.js, then delete the pack and the loose files are needed again (git checkout the oggs) and re-run pack-audio.js.
- File count was cut from ~2,360 to ~1,887 with `tools/shrink-files.js` (dry run by default; `--apply`, `--uploads`).
  It searches js/, css/ and index.html for names; check anything it flags before applying.
- Spritesheets / sound bins were NOT done: the game loads every image and sound by its own filename, so packing means rewriting loaders.

### Reusing a sound that already exists
- Every effect is a named **cue**, not a filename. List them in the preview console (inside the iframe, see top): `CUE_SOURCES.flatMap(([table, dir]) => Object.entries(table).map(([cue, files]) => cue + " -> " + dir + files))` and aliases with `CUE_ALIAS`.
- Play one with `Sound.play("hit_heavy", { vol: .6, rate: 1 })` (`rate` changes pitch; `throttle: 0` allows rapid repeats). Prefer an existing cue over adding a file.
- Short effects ship inside `SFX/sfx-pack.bin` (see Sound pack); you never load those files by path. Music keys are in `MUSIC_TRACKS`.
- Looking for a sound by what it is: search cue names in the bundle's audio.js (`node -e` on `tools/bundle.py get audio.js out.js` output) or grep the list above. No separate sound catalog file exists yet.

### Adding a new sound
1. Put the file under `SFX/` or `assets/<feature>/sfx/`; short, normalized. Run `node tools/convert-audio.js`.
2. Register a cue: `CUE_SOURCES.push([{ my_cue: ['file.wav'] }, ASSET + 'SFX/']);` (verified: the cue resolves and plays),
   then `Sound.play('my_cue', { vol: .6 })`. Per-cue mixing is `soundMix(cue)` and `SFX_FILE_GAIN` in the bundle's audio.js.
3. Self-contained features can use a local `new Audio(...)` helper like `sfx()` at the top of `js/boskers-globe.js`.
4. Music: `MUSIC_TRACKS` (key -> URL), `Music.play(key)`. Autoplay is blocked until a click.

## Settings and save safety (js/settings-hub.js, css/settings-hub.css)
Replaces Screens.openSettings with a two-pane hub (Overview, Sound, Display, Saves, Backups, Account, Advanced); adds a Settings button in the top bar (alert dot) and a Home card. `window.SaveGuard` keeps rolling snapshots in IndexedDB (`dh-save-vault`: auto every 10 min after play, manual, before-risky-change, deleted slots), a one-step undo copy (`<slotKey>-undo` in localStorage) and tracks the last backup file (`dh-last-file-backup`). It wraps Save.flushWrite/import/reset/deleteSlot and Screens.downloadSave. Full Test Save is never snapshotted. Slot logic (Save.createSlot etc.) still lives in the bundle's meta/save.js. Save.import caps text at 300000 chars; the hub shows a clear error above that.

## Bosker's Globe (js/boskers-globe.js, css/boskers-globe.css, assets/boskers-globe/)
Roblox-2011-styled roguelite Climb + visual-novel story + skins + Globe versions. State: `Raid.state().boskers`.
- Skins (`SKINS`) only for toons with real Globe art: Astro, Bassie, Shelly, Vee, Cocoa, Looey, Pebble (Rock), Bobette, Gourdy, Sprout, Yatta.
  Each has a sound `pack` (attack/hit/skill) that replaces the game's combat cues while worn.
- Globe versions are virtual heroes `g:<BaseId>`: follow the original's upgrades, own two trinkets (`copyTrinkets`); they appear in the Heroes tab,
  team editor and PvP; hero page is the original's with only trinkets editable (`HeroPage.globe`). A toon cannot wear its skin and bring its Globe version.
- `ADDICTED` art replaces Twisted sprites only inside the event. The Globe is its own world: no Builderman, no studs. The Face is a harmless gag.
- Writing: lowercase, deadpan, surreal Roblox-chat humor (r/gocommitdie), skin text in the game's "u/k?" voice. UI: flat grey, black buttons red text, stepped animation.

## Working with the user
- Use only supplied art; no fabricated sprites. Toons without Globe art get no skin. Keep Dandy's World personalities; avoid AI-slop dialogue.
- Rejected: stat cards on skins, top-bar menu/chat buttons, studs/Builderman, Cosmo skin, oversized sprites.
- Stay inside `dandys heroes`; never delete outside it. Zip tools skip hidden folders (.git), so never "zip then delete".
- Say plainly what was and was not tested. Audio was never verified by ear; the test browser throttles timers so battles do not finish.
- Windows tips: write patch scripts with the Write tool, then `node patch.js` (bash heredocs mangle quotes). Edit needs a fresh Read.
