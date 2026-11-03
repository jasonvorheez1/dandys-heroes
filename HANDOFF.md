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

## Aperture Science: Test Subject (js/aperture.js, js/aperture-fight.js, js/chell-kit.js, css/aperture.css, assets/aperture/)
Story event: slow-burn visual novel (Looey, Wheatley, a rebuilt GLaDOS 300 floors down), a real-time 1-on-1 portal fight, an animated finale, credits with "Still Alive". Beating it on any difficulty lets Dyle's shop (Skins shelf) recruit Chell. Chell is **not** in the story or the credits, only the shop reward.
- **No 3D in the game.** `tools/portal/build-assets.js <portal folder>` converts everything: GLaDOS from the MUGEN SFF (`sff-extract.js`), 3D OBJ props rendered flat by a software rasteriser (`render-obj.js`, models are rendered facing right), the Chell sprite sheet sliced (`slice-sheet.js`), all packed into one atlas (assets/aperture/atlas.png + atlas.json) plus wheatley.png, glados.png and chell/Chell.png. Wheatley is derived from the angry personality-sphere model (blue-shifted); there is no Wheatley model in the folder. `build-backgrounds.js` draws the 3 story backgrounds. `build-sfx.js <GLaDOS.snd>` packs the sounds (assets/aperture/sfx/aperture-sfx.bin + index.json).
- **The fight follows the MUGEN character (GLaDOS_States.st / GLaDOS_Helpers.st).** Four cores (Morality, Curiosity, Intelligence, Emotion). Morality comes off on a script (3 s into voice clip 3). A loose core must be bonked into the incinerator, which opens for 10 s after you break the glass (32 hp) over the revolving button and hit it. Then the incinerator becomes the rocket turret: it fires only when you stand still, locks aim at the warning beep, shoots straight, and will not shoot if the shot would hit GLaDOS. Redirected rockets (through a portal) hurt her body; a third of the bar per core. Lingering by the turret charges a laser; two ceiling turrets fire slow, aimed laser bolts (a red sight line first, then one straight shot; never homing; speeds 170/230/290 px/s by difficulty); a 6:00 clock starts after "Good news...". Cores use her eye sprites (eye-{0..3}-{frame}); they stay still and only look up/straight/down at you. The stage is painted once into an offscreen canvas (buildStage IIFE named stage); the HUD is drawn in the canvas (life plate, core sockets, her TV for the clock). The intro monologue (taunt-0) starts the moment the fight starts and the music is ducked to 20% until the fight ends. Test tip: the fight auto-pauses on window blur, so call root._controls.pause(false) before _step. Cores sit in painted cradles with cables (ApertureFight.paintMounts, also used by the menu banner); the cradle stays and sparks when a core is gone. Each phase ramps with the number of cores burnt and the difficulty (bolt rate and speed, two- and three-bolt volleys, a low floor beam you jump, faster rockets and a second rocket on the last phase, a shorter incinerator window, sparks and rumble). After each core she banters (her voice phase clip) for 4.5-8 s and nothing fires. Anti-cheese: no portals on the floor within 170 px or the ceiling within 130 px of her, and both portals close once a rocket has gone through. The event menu (aperture.js drawScene/playIntro/dossier) opens with a 7 s elevator-descent intro (once per session, Skip/Esc, Replay Intro button) and keeps the same scene as its banner. Voice lines are never cut (snd option full: true) and her schedule runs on wall-clock time, so slow-mo and hit-stop never stretch a line; pausing holds her voice (voices.hold) and quitting or losing stops it. Kaizo (4th difficulty, unlocked by any clear) chops her clips at random offsets and pitches and mixes in a second pack, assets/aperture/sfx/mia-sfx.bin, built by tools/portal/build-mia.js from the Mia MUGEN character (Mia.snd really holds only 3 long sounds; they are cut at the beat into 18 pieces). Kaizo extras (all telegraphed): floor patches (3 of 8 segments burn, hop or dash), a static wall that crosses the arena with a one-jump-high gap, floor crawlers that walk at you (hop them), and from the second core on a double beam (low and high together: dash). Faults come every ~3-7 s; Kaizo has 460 hp and a 4:00 clock. Kaizo corruption: as cores burn (corrupt() 0.12 to 1) vortices, static, rainbow bands and dark shapes take over the arena and her body, her cradles fill with a spinning orb, ring waves expand from her optic (telegraphed, dash or jump the edge), glitch bursts and faults come faster, and her voice is increasingly replaced by void sound pieces. Assets come from another MUGEN character as raw pieces only (tools/portal/build-corruption.js -> assets/aperture/corrupt-atlas.*, sfx/void-*; nothing of it appears as itself, and the void sounds have not been auditioned: see sfx/void-names.md). Kaizo has its own goofy opening of about 32 s with six freeze-frame gags (P stuck loading bar, A shopkeeper sells, C versus card, B face slam and rocket, D conga line, E lamp-oil stack collapses; HOLDS in aperture-fight.js; tap skips to the title) on top of the 11 s base timeline. Base timeline: (a fake old-OS boot bar that goes backwards, error boxes piling up, a fatal error, GLaDOS falling in and bouncing, her cores bouncing around like a screensaver before being stuffed back in, Wheatley photobombing, a bouncing rainbow KAIZO title with confetti; tap to skip) and its own music (music/kaizo.mp3, started at the title; gained +5 dB and played at 1.7x the music setting, at least 50%, instead of being ducked). Loudness: tools/portal/normalize-sfx.js evens every pack clip to a -20 dB average and the music to -18 dB (run it again after rebuilding any pack); the Boskers Globe sounds used in Kaizo carry measured gains in MEME_GAIN. The void sound pack plays only the names listed in assets/aperture/sfx/void-approved.json (all 39 current clips are approved; write a new list with tools/portal/audition-void.html). In Kaizo they are a comedy kit (vsay/vscale/vecho/vstutter/vanswer in aperture-fight.js): reactions to getting hit, dashing, redirecting, burning a core, faults and glitches, climbing scales, echoes, call-and-answer, with her optic pulsing a ring on every one; void-2-21 contained a racial slur and was removed (tools/portal/prune-void.js, and banned in build-corruption.js). Chell economy (aperture.js): the first clear of anything unlocks the license (state.license); Dyle's shelf then sells Chell for 25,000 gold, with shards for 3 stars included (shardsToThree(), scaled by the account Mastery curve) plus any banked clear shards. Every clear pays shards (first clear of a difficulty in full, later clears 20%): Easy 0.5, Medium 0.75, Hard 1, Kaizo 2 times that base pack; if she is not owned yet they bank in state.bank. Kaizo is locked until all 9 Bosker's Globe versions are owned (Save.owns("g:<toon>")). The Kaizo intro (about 16 s) has two freeze-frame cameo gags from another MUGEN 1.1 character (tools/portal/sff2-extract.js, build-shop.js -> shop-atlas.*, sfx/shop-*; only five of its clips are kept in the pack (shop-33-33 blip, shop-5000-1 hum, shop-235-235 YOU LOSE, shop-93-93 come back, shop-24-24 YES!), approved by the user; rebuilding with build-shop.js would bring the rest back, so prune again). The cameo is two real stills (assets/aperture/cameo-1.png, cameo-2.png) in plain error windows, twice, and nothing else of him is in the intro (the shop atlas holds only props: an oil bottle, explosions, a rainbow). The intro ends by delivering Looey (fired in, spins, lands), Wheatley (rolls in, bowls into Looey, bounces to his shoulder) and GLaDOS (swings in like a wrecking ball) to exactly where they stand in the fight, so the last frame is the first frame of play. Note: spr() treats a scale of 0 as 1, so fade sprites out with a tiny scale, not 0. The Full Test Save has the whole Globe story read (boskers-globe.js state()), so all 9 Globe versions and Kaizo are unlocked there. Debug hooks: `document.querySelector(".ap-fight")._dbg()` and `._step(seconds)`.
- **Voices.** The clips are played in the order and with the hold times the character uses (state 500 loop 100,0-20; 499 "where are you taking that thing" = 5000,0; 501 clips 21-25; battle phases 25-45, 46-56, 57-76; cores talk while loose: 1000/1010/1020; last line 5050 = cake-0; 5100 short line at clip 66). Names in assets/aperture/sfx/NAMES.md: effects are named from the MUGEN code, voice lines are only numbered (taunt-N = 100,N). There are NO subtitles for her: transcribing the lines would mean typing out the game script, so the recordings are the words. GLaDOS has no scripted intro in the character (state 190 is one empty frame); her first words are clip 100,0.
- Music: Self Esteem Fund (story), Some Assembly Required (fight), The Future Starts With You (finale), Still Alive (credits). Credits end on the song; Skip works.
- Credits thank the sprite and model sources (MUGEN GLaDOS by fhqwhgads7, pedestal ripped by KartMakerBrosU, Valve).

## Working with the user
- Use only supplied art; no fabricated sprites. Toons without Globe art get no skin. Keep Dandy's World personalities; avoid AI-slop dialogue.
- Rejected: stat cards on skins, top-bar menu/chat buttons, studs/Builderman, Cosmo skin, oversized sprites.
- Stay inside `dandys heroes`; never delete outside it. Zip tools skip hidden folders (.git), so never "zip then delete".
- Say plainly what was and was not tested. Audio was never verified by ear; the test browser throttles timers so battles do not finish.
- Windows tips: write patch scripts with the Write tool, then `node patch.js` (bash heredocs mangle quotes). Edit needs a fresh Read.

## Flower Kingdom (Deltarune Chapter 5 crossover; js/flowery-*.js, css/flowery.css, assets/flowery/flowery.bin)
Story event set the night after Main Story Chapter 3: Scraps, Ginger and Yatta go through a door in the vents into Deltarune's
Flower Kingdom, meet Flowery (who was expecting Kris), the seven flowers, Asgore and Ralsei (freed from Flowery's cupboard), and
fight Flowery on the roof. Ten segments (FL_STORY), Deltarune-style overworld, cutscenes, three battles. Card on the Events tab.
- **One pack.** `tools/flowery/build-pack.py <drspritearchive> --music <Ch5 OST folder> --voice <Flowery clips rip> --sfx <common sfx rip>`
  writes assets/flowery/flowery.bin (~14 MB): only the sprites listed in MANIFEST (atlas sheets; tilesets kept untrimmed),
  13 OST tracks (MUSIC_WANTED), 53 Flowery voice clips (VOICE_WANTED, English only) and 67 common Deltarune sounds (SFX_WANTED),
  all re-encoded to Ogg. The five hand-supplied Flowery poses live in tools/flowery/extra (already 1x). The bin loads only when
  the event menu opens (progress shown). Missing music falls back to the game's tracks (FALLBACK in flowery-world.js).
- **Files.** flowery-pack.js (reads the bin, FlPack.draw/blit/url, Web Audio sounds), flowery-world.js (FW: rooms painted from
  tileset rectangles TX + props PROP, walking party with followers, textbox/portraits/text blips, script runner; the command list
  is the comment above `parse`), flowery-cuts.js (FW.CUTS: door, fall, castle, ichorRise, lendPower, asgoreCharge, omegaChase,
  thatDay, doorHome, credits), flowery-arena.js (FlArena: the vine-tower stage from Chapter 5's Flowery fight and the side-on
  bullet box: arrows move the flower soul, Z dashes with i-frames, grazing gives TP; PAT holds each attacker's pattern),
  flowery-battle.js (the turn-based boss; also preview stand-ins), flowery-realbattle.js (in the game: the event's fights run on
  the real BattleScreen auto battler; trio hits on Darkners land as 1 while meta.flWeak is set), flowery-story.js + flowery-story2.js
  (the script), flowery-event.js (menu, card, play loop, save in Raid.state().flowery: seg, done, cur, losses, beaten).
- **Script rules.** `@end` ends the current block (an NPC talk); `@finish` ends the whole segment (use it in the block that
  leaves the segment from a walk-around `@roam`). `@call` follows `@goto`s. " | " is a line break in one textbox.
- **Toons are not pixel art on purpose**: their normal cutouts are drawn small; the story comments on it. No fabricated sprites.
- **Inked enemies** (Inked Floradinn/Kawkaw/Mantis/Bloxer/Conductor + Ichor Drop/Ball art) exist only inside this event and are
  never called Weaklings in game text.
- **Boss.** Opens as a real auto battle; Flowery takes the AUTO button off the real HUD, then the fight runs on the Main Story's
  turn-based battle (js/flowery-storyboss.js on story-battle.js / story-engine.js, Chapter 3 rules). No Deltarune battle mechanics.
  Easy (segment 9): one bar, friends summoned at 66%/33%. Hard (REMATCH on the event menu after a clear): three "tutorial" bars,
  friends summoned per bar, and cheats as enemy moves (Skip the Line, Five-Finger Bouquet steals an item, Number Edit cuts your
  damage to 20% until he is Broken, Trade You swaps HP, Intermission silences, Pause), each with a fourth-wall animation over the
  real battle HUD. Ralsei heals from the side. Tuning lives in FlStoryBoss.TUNE; check it with `node tools/flowery/boss_sim.js`
  (autoplay: Easy about 90%, Hard about 7%). flowery-arena.js now only draws the vine-tower background (its old bullet-box code and
  flowery-battle.js's old menu boss are unused in the game).
- **Testing.** Serve the repo (`python3 -m http.server`) and open tools/flowery/preview.html (`?room=cliffs`, `?cut=omegaChase`,
  `?battle=flowery`) or tools/flowery/smoke.html (runs all ten segments in FW.test mode: instant text, every NPC and trigger,
  warns about unknown frames/voices; `?choice=1` takes the other branches). A new save has Events locked: use Settings → Full
  test save. Audio was not verified by ear; the boss was played by a bot (all phases, a loss, the win), not by a person.
- **Endgame (js/flowery-endgame.js).** Unlocks on the event menu after all ten segments ("??? · THE DOOR WITH NO LOCK"). Cutscene in
  the Gardenview lobby: Ralsei came back to close Scraps' drawn door; Spamton walks out of it looking for a deal (the building
  "prints" Toons), Jevil ("joker" in the game files) follows from his cell, Ralsei recognizes him from Chapter 1, Spamton plugs into
  the machine downstairs and becomes Spamton NEO. Then any four from the Main Story roster plus Ralsei (playable here), all at level
  99, on the Main Story turn-based battle. No soul or bullet box: big moves have quick-time events instead (timing ring, mash, arrow
  dial, pick the safe suit, and Jevil's purple "KIDDING!!" ring that you must NOT press). Team attacks (NEO CHAOS, DEVIL'S DEAL) with
  anime cut-ins; Metamorphosis, CHAOS finale, Final Forme; when one falls the other enrages. Fairness rules: team attacks and lethal
  moves start on cooldown, and anyone above half HP survives any single non-lethal move at 1 HP. Balance: `node
  tools/flowery/endgame_sim.js` (autoplay; QTE skill 0 / .5 / .85 → about 0% / 6-16% / 60-70%).
