/* ============================================================================
   BOSKER'S GLOBE · THE CLIMB
   A Roblox-era event. The door opens in the middle of a run, the crew meets the
   Globe's versions of themselves (every one the opposite of the original), and
   the Climb is a floor-by-floor roguelite: pick a card, fix two machines, hit the
   addicteds at the elevator. DVD buys skins that re-voice the Toons wearing them.
   Only toons with real Globe art get a skin.
   ============================================================================ */
'use strict';

(() => {
  const ID = 'boskers-globe-event';
  const BASE = 'assets/boskers-globe/';
  const SFX = BASE + 'sfx/';
  const COSTUME = 'boskers-globe';
  const FACE_FLOOR = 5;
  const FACE_COST = 120;
  const img = p => ASSET + BASE + p;

  if (typeof MUSIC_TRACKS !== 'undefined') {
    MUSIC_TRACKS.bgAmbient = ASSET + SFX + 'ambientmusicboskersglobe.mp3';
    MUSIC_TRACKS.bgRecycle = ASSET + SFX + 'ambientmusicboskersglobe.mp3';
  }

  /* ---------------------------------------------------------------- audio */
  const sfxCache = {};
  const SFX_MAX = { 'couldbeusedfordancereleatedstuff.ogg': 1800, 'pebble-bark.mp3': 1400, 'recycle.mp3': 2500 };
  let lastSfx = 0;
  function sfx(file, o = {}) {
    if (typeof Sound !== 'undefined' && Sound.on === false) return;
    const now = Date.now();
    if (!o.force && now - lastSfx < 120) return;
    lastSfx = now;
    try {
      const a = (sfxCache[file] || (sfxCache[file] = new Audio(encodeURI(ASSET + SFX + file)))).cloneNode();
      a.volume = clamp(o.vol == null ? .5 : o.vol, 0, 1);
      a.playbackRate = o.rate || 1;
      a.play().catch(() => {});
      setTimeout(() => { try { a.pause(); } catch (_) { /* already gone */ } }, o.max || SFX_MAX[file] || 4000);
    } catch (_) { /* audio is decoration */ }
  }
  const playMusic = key => { try { Music.play(key); } catch (_) { /* optional */ } };

  /* ---------------------------------------------------------------- the Globe's toons */
  // One skin per toon the Globe has real art for, each the opposite of the toon it mirrors. Every skin has its
  // own sound, motion and particle, plus the two blurbs the Globe's toon menu shows.
  const SKINS = {
    Astro:   { name: 'Atoe', pack: { attack: ['HalloweenGhost.wav', .3, 1.5, 500], hit: ['collide.wav', .4, .6, 500], skill: ['HalloweenGhost.wav', .55, .5, 1500] },    face: -1, art: 'art/Atoe.png',    cost: 70,  sound: ['HalloweenGhost.wav', .45, .7], fx: 'zzz',    glyph: 'z',
      blurb: 'purple cape and a christmas hat. one eye is a plus sign',
      voice: "Zzz! Atoe talks like soooo fast in fights k? (ghost noise but slow)", also: "Atoe never sleeps. u will be tired. this skins job is being awake sometimes" },
    Bassie:  { name: 'Bass', pack: { attack: ['bass.wav', .6, 1.3, 500], hit: ['collide.wav', .6, .8, 500], skill: ['bass.wav', .85, .5, 1200] },    face: -1, art: 'art/bass.png',    cost: 70,  sound: ['bass.wav', .7, 1],             fx: 'hop',    glyph: '✿',
      blurb: 'basket on its head with clover coming out',
      voice: "BASS! shouts WAY loud in fights (bass sound)", also: "dont ask whats in the basket k? basket is mine" },
    Shelly:  { name: 'Shells', pack: { attack: ['pageturn.wav', .5, 1.2, 600], hit: ['snap.wav', .4, .7, 400], skill: ['swoosh.wav', .6, .8, 1000] },  face: -1, art: 'art/Shells.png',  cost: 70,  sound: ['pageturn.wav', .6, 1],         fx: 'tilt',   glyph: '·',
      blurb: 'head is an open tube',
      voice: "Shells says stuff but doesnt care (page flip)", also: "snacks go in the head. thats all we know" },
    Vee:     { name: 'Tee', pack: { attack: ['SWITCH3.wav', .5, 1.2, 400], hit: ['button.wav', .5, .9, 400], skill: ['switch.wav', .6, .6, 900] },     face: -1, art: 'art/tee.png',     cost: 90,  sound: ['SWITCH3.wav', .7, .9],         fx: 'crt',    glyph: '▒',
      blurb: 'tv for a head, microphone for a tail',
      voice: "Tee is not sure about it! maybe?? (click)", also: "Tee says it scans stuff!! it doesnt scan. hes live tho" },
    Cocoa:   { name: 'Choca', pack: { attack: ['snap.wav', .5, 1.4, 400], hit: ['vine.ogg', .4, 1.3, 500], skill: ['Cheering.ogg', .35, 1.4, 1200] },   face: 1,  art: 'art/choca.png',   cost: 80,  sound: ['snap.wav', .7, 1.1],           fx: 'hop',    glyph: '♥',
      blurb: 'floppy ears and a headband',
      voice: "Brownies! Choca brings brownies up a lot (snap)", also: "the brownies are rocks. she will tell u that herself k?" },
    Looey:   { name: 'Lowert', pack: { attack: ['Rubber band.wav', .5, 1.5, 500], hit: ['Rubber band.wav', .5, .7, 600], skill: ['Rubber band.wav', .8, .5, 1200] },  face: -1, art: 'art/lowert.png',  cost: 80,  sound: ['Rubber band.wav', .7, 1],      fx: 'squash', glyph: '~',
      blurb: 'yellow, green and purple',
      voice: "boing! Lowert is like rubber band and sorry (rubber band)", also: "bounces then says sorry. bounces again" },
    Pebble:  { name: 'Rock', pack: { attack: ['pebble-bark.mp3', .45, 1.3, 450], hit: ['pebble-bark.mp3', .4, .7, 450], skill: ['pebble-bark.mp3', .75, 1, 1300] },    face: -1, art: 'art/rock.png',    cost: 85,  sound: ['pebble-bark.mp3', .7, 1],      fx: 'chomp',  glyph: '★',
      blurb: 'grey shark with a star on its cheek',
      voice: "CHOMP! Rock is a shark!! (bark?? idk it barks)", also: "Rock is NOT a rock. u keep asking it. stop" },
    Bobette: { name: 'Balbeat', pack: { attack: ['Rocket shot.wav', .3, 1.7, 500], hit: ['collide.wav', .4, 1.4, 400], skill: ['Rocket shot.wav', .6, .9, 1500] }, face: -1, art: 'art/balbeat.png', cost: 85,  sound: ['Rocket shot.wav', .4, 1.2],    fx: 'swing',  glyph: '❄',
      blurb: 'red ornament in a sweater',
      voice: "Balbeat says i am a ball! (rocket noise, nobody knows why)", also: "Balbeat thinks its christmas. its always christmas" },
    Gourdy:  { name: 'Gorrby', pack: { attack: ['button.wav', .6, .6, 400], hit: ['vine.ogg', .5, .8, 500], skill: ['HalloweenGhost.wav', .5, 1.3, 1200] },  face: -1, art: 'art/gorrby.png', icon: 'art/gorrby-icon.png',  cost: 75,  sound: ['button.wav', .8, .8],          fx: 'jitter', glyph: '☼',
      blurb: 'pumpkin head and a green hoodie',
      voice: "Boo! Gorrby will like gamble like minieggs", also: "Ahh! 20% speed boost! this skins SCARY aura makes u go faster sometimes k?" },
    Sprout:  { name: 'Spriut', pack: { attack: ['bfsl-minifigfoots1.mp3', .5, 1.4, 500], hit: ['sadtrombone.ogg', .25, 1.6, 500], skill: ['bfsl-minifigfoots1.mp3', .6, .8, 1100] },  face: -1, art: 'art/spriut.png',  cost: 100, sound: ['bfsl-minifigfoots1.mp3', .6, 1.2], fx: 'shiver', glyph: '♦',
      blurb: 'strawberry head with a scarf',
      voice: "Sorry! Spriut says sorry in fights a lot (footsteps)", also: "Spriut does not check where Cosmo is. its fine. its fine" },
    Yatta:   { name: 'Yeita', pack: { attack: ['couldbeusedfordancereleatedstuff.ogg', .35, 1.2, 500], hit: ['swoosh.wav', .4, .6, 600], skill: ['couldbeusedfordancereleatedstuff.ogg', .5, .8, 1000] },   face: -1, art: 'art/yeita.png',   cost: 100, sound: ['couldbeusedfordancereleatedstuff.ogg', .45, .8], fx: 'sink', glyph: '♪',
      blurb: 'yellow, four ropes for a tail, smiling at the ceiling',
      voice: "Hi.. woah.. Yeita forgets what she was saying (slow dance noise)", also: "Yeita sees colors. colors are LOUD she says" }
  };
  // Addicted art. Never a skin: it is what the Twisteds look like inside the Climb.
  const ADDICTED = {
    Cosmo:  { name: 'Cosmosis', art: 'art/addictedcosmosis.png', face: -1 },
    Finn:   { name: 'Fiin',     art: 'art/addictedfiin.png',     face: -1 },
    Sprout: { name: 'Spriut',   art: 'art/addictedspriut.png',   face: -1 },
    Squirm: { name: 'Sqerm',    art: 'art/addictedsqerm.png',    face: -1 },
    Yatta:  { name: 'Yeita',    art: 'art/addictedyeitie.png',   face: -1 },
    Gourdy: { name: 'Gorrby',   art: 'art/addictedgorrby.png',   face: -1 },
    Tisha:  { name: 'Teesha',   art: 'art/addictedtisha.png',    face: -1 },
    Poppy:  { name: 'Bubbles',  art: 'art/addictedpoppy.png',    face: -1 },
    Flutter: { name: 'Fatter',  art: 'art/addictedflutter.png',  face: -1 }
  };
  // Everyone who speaks in the story but is not a Toon the player owns.
  const NAME_ART = {
    Tee: SKINS.Vee.art, Atoe: SKINS.Astro.art, Shells: SKINS.Shelly.art, Bass: SKINS.Bassie.art,
    Rock: SKINS.Pebble.art, Gorrby: SKINS.Gourdy.art, Yeita: SKINS.Yatta.art, Bosker: 'art/bosker.png', Spriut: SKINS.Sprout.art
  };
  // Globe versions that have been met in the story can join the squad. They play exactly like the original
  // (it is the same toon with the Globe's art), so it is like having two of them.
  const GLOBE_JOIN = { Astro: 2, Vee: 2, Shelly: 2, Bassie: 4, Gourdy: 4, Yatta: 5, Sprout: 6, Bobette: 6, Pebble: 6 };
  const isCopy = k => String(k).startsWith('g:');
  const skinned = id => Save.data.heroes?.[id]?.costume === COSTUME;
  const copiesUnlocked = () => Object.keys(GLOBE_JOIN).filter(id => SKINS[id] && Save.owns(id) && state().read.includes(GLOBE_JOIN[id]));
  const copyBlocked = k => isCopy(k) && skinned(baseId(k));
  const baseId = k => isCopy(k) ? String(k).slice(2) : k;
  const copyKeys = () => copiesUnlocked().filter(id => !skinned(id)).map(id => 'g:' + id);
  const artFor = k => isCopy(k) ? ASSET + BASE + SKINS[baseId(k)].art : Art.defaultHero(k);
  const nameFor = k => isCopy(k) ? SKINS[baseId(k)].name : HEROES[k].name;
  const faceOf = id => (SKINS[id] && SKINS[id].face) || (HEROES[id] && HEROES[id].nativeFace) || 1;
  // Collab and event toons may join any squad. They are only kept out of the enemy pool, where they have no addicted form.
  const TOONS_UNIVERSE = ['Discard', 'Selena', 'Copper', 'Phantasia'];
  const isCollab = id => COLLAB_HERO_IDS.has(id) || !!eventOf(id) || TOONS_UNIVERSE.includes(id) || (typeof QOM_HERO_IDS !== 'undefined' && QOM_HERO_IDS.has(id)) || (typeof DW_MODDED_HERO_IDS !== 'undefined' && DW_MODDED_HERO_IDS.has(id));

  // Battle callouts. Sentence case, no apostrophes, an ellipsis where a thought runs out.
  const LINES = {
    Astro:   ['I have not slept in 3 floors!! its fine!!', 'Sleep is a rumor', 'The lights go bzzzzt in B flat', 'Gum? I have forty', 'Wait I blinked. Did you see that. I saw it'],
    Bassie:  ['MINE', 'BASKET COMING THROUGH', 'Rule one: never share', 'I named my weeds. There are 41', 'Move or get weeded'],
    Shelly:  ['Okay found a fossil. cool', 'Yeah ok', 'I dont care what its called', 'I put a sandwich in my head once', 'Fine, here'],
    Vee:     ['Scanner thingy? Idk', 'Is this on. Is it live', 'Maybe ask me later', 'It scans for the evil ones. probably', 'Am I live'],
    Cocoa:   ['I made a brownie. its a rock', 'Sorry I ate the last one', 'Ears go sproing', 'This food is cold on purpose', 'Hop hop'],
    Looey:   ['Boing. sorry', 'I am very bouncy please dont look', 'Rubber band noises. respectfully', 'Where did my tail go', 'boing..'],
    Pebble:  ['Chomp', 'Bark. I mean chomp', 'I am a shark. I am NOT a rock', 'Woof is just chomp with extra steps', 'Did you see my star. Look at my star'],
    Bobette: ['Merry Christmas in October', 'I am a ball', 'Dont drop me', 'Dont unwrap me either', 'Ball'],
    Gourdy:  ['Trick or treat!! which one', 'BOO. did it work', 'I bet it all. nothing happened', 'Is this the pumpkin store. I got lost', 'Im not shaking its the aura'],
    Sprout:  ['Eat it if you want. sorry', 'Did I do it wrong', 'I dont check where Cosmo is. Its fine. Its fine', 'The scarf was expensive. sorry', 'Please dont look at my eyes'],
    Yatta:   ['Hi.. woah.. hi', 'The colors are so loud', 'I forgot what I was doing. it was purple', 'Everything is soft', 'Hehe whats a fight']
  };

  /* ---------------------------------------------------------------- state */
  function state() {
    const r = Raid.state();
    const s = r.boskers || (r.boskers = {});
    if (!Array.isArray(s.read)) s.read = [];
    if (!s.owned || typeof s.owned !== 'object') s.owned = {};
    if (!s.offered || typeof s.offered !== 'object') s.offered = {};
    if (!Array.isArray(s.notes)) s.notes = [];
    if (!s.bests || typeof s.bests !== 'object') s.bests = {};
    s.dvd = s.dvd || 0; s.best = s.best || 0; s.runs = s.runs || 0;
    return s;
  }
  const storyDone = () => Array.from({ length: STORE_CHAPTERS }, (_, i) => i).every(i => state().read.includes(i));
  const complete = () => storyDone();
  const hasSkin = id => !!(SKINS[id] && state().owned[id]);
  // Inside the Climb the crew always wears their default look, so nobody is confusing to read.
  let climbMode = false, foeMode = false;
  let copyInFight = new Set();
  let cutCheck = 0, cutVal = false;
  const inCutscene = () => { const now = Date.now(); if (now - cutCheck > 200) { cutCheck = now; cutVal = !!document.querySelector('[class*="-vn"]'); } return cutVal; };
  const wearing = id => !climbMode && hasSkin(id) && Save.data.heroes?.[id]?.costume === COSTUME;
  const skinObj = id => ({ id: COSTUME, name: SKINS[id].name, art: BASE + SKINS[id].art, icon: BASE + (SKINS[id].icon || SKINS[id].art), available: true, description: SKINS[id].blurb, nativeFace: faceOf(id) });

  {
    const original = Art.skin;
    Art.skin = function (id, costume) {
      if (isCopy(id)) return SKINS[baseId(id)] ? skinObj(baseId(id)) : null;
      if (SKINS[id] && HeroPage.globe === id && !(arguments.length > 1 && costume === COSTUME)) return skinObj(id);
      const selected = arguments.length > 1 ? costume : Save.data?.heroes?.[id]?.costume;
      if (selected === COSTUME) {
        if (arguments.length > 1 && SKINS[id] && (climbMode || state().owned[id] || complete() || copiesUnlocked().includes(id))) return skinObj(id); // a Globe version on a squad
        return !climbMode && !inCutscene() && SKINS[id] && state().owned[id] ? skinObj(id) : null;
      }
      return original.apply(this, arguments);
    };
  }
  // Foes with addicted art wear it, facing the way that art faces.
  {
    const twisted = Art.twisted;
    Art.twisted = function (id) {
      if (foeMode && ADDICTED[id]) return ASSET + BASE + ADDICTED[id].art;
      return twisted.apply(this, arguments);
    };
  }
  function setFoeFaces(foes) {
    const saved = [];
    new Set(foes.map(f => f.id)).forEach(id => {
      if (!ADDICTED[id] || !HEROES[id]) return;
      saved.push([id, HEROES[id].twistedNativeFace]);
      HEROES[id].twistedNativeFace = ADDICTED[id].face;
    });
    return () => saved.forEach(([id, v]) => { if (v === undefined) delete HEROES[id].twistedNativeFace; else HEROES[id].twistedNativeFace = v; });
  }
  // Wearing a skin swaps the White-skill callout pool, and plays that skin's sound.
  Object.keys(LINES).forEach(id => {
    const prior = Object.getOwnPropertyDescriptor(HERO_WHITE_DIALOGUE, id);
    let stored = prior ? prior.value : undefined;
    Object.defineProperty(HERO_WHITE_DIALOGUE, id, {
      configurable: true, enumerable: true,
      get() {
        if (typeof Save !== 'undefined' && Save.data && wearing(id)) {
          const [file, vol, rate] = SKINS[id].sound;
          sfx(file, { vol, rate: rate * (.92 + Math.random() * .16) });
          return LINES[id];
        }
        if (climbMode && id === 'Pebble' && copyInFight.has(id)) sfx('pebble-bark.mp3', { vol: .6, rate: .92 + Math.random() * .16 });
        return stored;
      },
      set(v) { stored = v; }
    });
  });
  {
    const roll = Banter.rollFor;
    Banter.rollFor = function () {
      const scene = roll.apply(this, arguments);
      if (!scene || !scene.lines.some(l => wearing(l.who))) return scene;
      return Object.assign({}, scene, { lines: scene.lines.map(l => wearing(l.who) ? Object.assign({}, l, { text: pick(LINES[l.who]) }) : l) });
    };
  }

  /* ---------------------------------------------------------------- story */
  // Real toons speak normally. Globe toons write like the Globe's chat bubbles.
  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'OCTOBER', date: 'THE GLOBE' });
        const STORY = [
    scene('01 · do not open lol', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@enter Vee left
@enter Gourdy right
> A door has appeared behind the Gardenview elevator. There's a sticky note on it that says do not open lol.
Vee [glare]: I locked up at six. That was not there at six.
Gourdy: I wrote the note.
Vee: You wrote "do not open" on a door you found.
Gourdy: Nobody reads a sign unless it's a bad idea.
@enter Yatta center
Yatta [!]: Who's opening the door?!
Vee: Nobody. Yatta, put your hand dow--
@sfx ui_open
@fx flash
> It opens by itself. The lobby lights go out.
@exitall
@fx dark
@bg assets/boskers-globe/bg/floor.webp
@music bgRecycle
@card FLOOR 1 · 0/2
> Concrete. One flickering lamp. A pipe in the middle of the room with a red wheel on it and a green light, humming like a fridge.
@enter Vee left
@enter Gourdy right
@enter Yatta center
Vee [!]: This isn't the lobby.
Yatta: There's a clock on the ceiling and it says eleven! It says ten!
@enter Astro farleft
@enter Bassie farright
Astro: Everyone came. I think I was asleep for the door part.
Bassie: It's so loud in here. HAhaha... ha... I have crackers, if anyone wants crackers.
> A cheerful voice comes out of the ceiling. "Quickly! Get to the elevator! Ten seconds remaining."
Vee: What elevator?
Gourdy: Behind you. Also something's coming from the other end of the hall.
@sfx ui_err
> Something steps around the corner. A spiral where its face should be, one red eye, legs that look like it read about walking once.
Astro [?]: Cosmo?
Yatta: Cosmo doesn't walk like that!
@enter Shelly center
Shelly [!]: It's a machine! Ours don't have a label. This one says SkillCheck. Somebody put effort into that.
Vee: Shelly, we're being chased.
Shelly: I know, I'm just saying it's a good label.
Bassie: Somebody do it! Somebody good at timing!
@sfx switch
> The needle swings. Gourdy lets it pass twice, then taps. The light on the pipe stays green.
Gourdy: One.
Vee [dots]: There are two machines.
Yatta: I'm fast! I'll get the other one!
@fx shake
@sfx ui_open
> The elevator opens. Somebody's already inside, bouncing on their toes. Purple cape, christmas hat, one eye with a plus sign over it. Taped next to the call button is a tiny drawn smile. Nobody mentions it.
@enter Atoe left
Atoe: Hi hi hi new people get in the doors close in four seconds I counted I count everything I havent slept in three floors
Astro: ...Three floors?
Atoe: Its fine!! Im fine!! Do you want gum?? I have like forty
> The doors slam on the swirl thing. It knocks twice, thinks about it, and stops.
Vee: I'd like to know who that was, and why he has Astro's hat.
@exitall`),

    scene('02 · who is bosker', 'The Store', `
@bg assets/boskers-globe/bg/storefront.png
@music bgAmbient
@card FLOOR 2 CLEARED
@enter Vee left
@enter Astro right
> The elevator opens on a table with a plant, a boombox and a pile of candy. A guy with rainbow hair waves with both hands, stops, then waves again in case the first one didn't count.
@enter Bosker center
Bosker: Hi welcome to Bosker's Store its leaving in like 28 seconds so look fast
Vee: Leaving where?
Bosker: Idk. The shelf goes first and I follow it
Vee: Who are you?
Bosker: Bosker. Its my globe. Its on the sign
@enter Shelly farleft
@enter Gourdy farright
Shelly: I don't have a Bosker in my notes.
Vee: I know everyone in this building.
Bosker: Yeah nobody knows me. I was in one episode. I was behind the plant
Gourdy: Which episode?
Bosker: The one with the plant
Vee [dots]: What are you selling?
Bosker: Candy, cables, a jawbreaker. You pay in DVD
Astro: Where do we get DVD?
Bosker: The machines give it to you. I dont know who puts it in there
Vee: Your sign also says skins.
Bosker: Oh those are in the back room. I lost the key. I think its at the top
Gourdy: Of course it is.
Bosker: Also the bad guys are slower in a panic. Someone told me that. I forgot who
Vee: Panic makes them faster.
Bosker: Here it does the opposite. Everything does
Astro: ...Everything?
Bosker: Its kind of the rule
> Someone has drawn a smiley face on the boombox. It's not doing anything. It's just there.
Vee [dots]: Is that on purpose?
Bosker: Oh thats the face. It does that. It was on my mug yesterday
@exitall`),

    scene('03 · I wonder how Atoe does it', 'Teal Hall', `
@bg assets/boskers-globe/bg/hall.png
@music bgAmbient
@card FLOOR 3 CLEARED
> The elevator opens on a teal hall with three pumpkins stacked in the corner. Two people by the wall are whispering about the one who got out with the new arrivals.
@enter Tee left
@enter Shells right
Tee: I wonder how Atoe does it
Shells: Like, Ive never seen him sleep
Tee: Maybe he does it when we blink
Shells: I blink a lot and I never see it
@enter Atoe center
Atoe: I can hear you!! I can hear EVERYTHING!! The lights go bzzzzt in B flat!!
@exit Tee
@exit Shells
@exit Atoe
@enter Astro left
@enter Atoe right
Astro: You really don't sleep?
Atoe: Never! Not even a little! I get eleven extra hours a day and I spend them counting
Astro: ...What do you count?
Atoe: The floors. The pumpkins. Your breathing, its kind of fast, are you ok
Astro: I'm fine. I'm tired.
Atoe: THATS SO COOL
Astro: It really isn't.
@exit Astro
@exit Atoe
@enter Vee left
@enter Tee right
Tee: Oh hi. Are you the ones the door picked? I dont know the schedule
Vee [!]: That's my face on your head.
Tee: Its a tv. I scan for the evil ones for like 5s and then it has a 40s cooldown so I mostly stand here
Vee: I host a live quiz show every day. I know the schedule.
Tee: Cool. Whats the schedule
Vee: ...It's whatever I say it is.
Tee: Oh ok. Is that allowed
Vee [glare]: Say "I'm live" like you mean it.
Tee: Im live? ...Am I live
@exit Vee
@exit Tee
@enter Shelly left
@enter Shells right
Shelly [!]: Is that a tube? Open at one end? Is it a fossil collar? Can I look inside, please?
Shells: Yeah ok
Shelly: Don't you want to know what's in there?
Shells: Snacks
Shelly: That's all?
Shells: I put a sandwich in once. It was a good sandwich
Shelly [sweat]: ...I need a bigger notebook.
@image bgFace
@imgoff
Shells: Oh the face is in there again
@exitall`),

    scene('04 · its an obby', 'Nowhere', `
@bg assets/boskers-globe/bg/mansion.png
@music bgRecycle
@card FLOOR 4 CLEARED
> The elevator opens on nothing. A long way down in the dark there's a line of bright floating squares: red, blue, yellow, spaced like somebody was guessing how far people can jump.
@enter Vee left
@enter Atoe right
Vee [dots]: That's not a floor.
Atoe: Its an obby!! You jump!! Its the only rule!!
Vee: Why are they floating?
Atoe: Because the person who made it wanted them to
@enter Shelly center
Shelly [!]: Is the red one lava?
Atoe: The red one is always lava
Shelly: Always?
Atoe: Since like 2008
@enter Tee farleft
Tee: I think there was a checkpoint somewhere? I stood on one once
Vee: Who builds a course out of things that kill you?
Atoe: A guy named Kevin I think
> A sign hangs over the dark: PLEASE DO NOT FALL. Underneath, in a different pen: you will fall.
@exit Shelly
@exit Tee
@enter Yatta center
Yatta: I'll go first!
> She crosses the first six squares without being asked. On the seventh she looks down.
Yatta [sweat]: ...Hi.
@sfx ui_err
> She falls. A small voice somewhere says "checkpoint reached" and she's back at the start, a little embarrassed.
@enter Gourdy farleft
Gourdy: That seems like a good system.
Tee: Its the only one we have
@exitall`),

    scene('05 · ive named all the weeds', 'The Lobby', `
@bg assets/boskers-globe/bg/lobby.webp
@music bgAmbient
@card FLOOR 5 CLEARED
> The floor-five boss finally goes down. The elevator opens on a lobby with gravestones in the grass and two arcade cabinets glowing against a purple wall. Someone is yelling.
@enter Bass left
Bass: BASKET COMING THROUGH!! MINE!! ALL MINE!!
@enter Bassie right
Bassie: Oh! Sorry! I didn't mean to be in the way. HAhaha... ha... do you want a cracker? I have extra.
Bass: No. Rule one is never share
Bassie: That sounds lonely.
Bass: Rule two is I dont get lonely
Bassie: What's in your basket?
Bass: Weeds. They are MY weeds. I counted. There are 41 and I named them
Bassie [sweat]: I'll leave a cracker on the floor, just in case.
Bass: ...leave two
@exit Bass
@exit Bassie
@enter Gourdy left
@enter Gorrby right
Gorrby: Trick or treat!! Wait, which one am I doing
Gourdy: Both. That's how it works.
Gorrby: Dang. BOO. ...did it work. say it worked
Gourdy: No.
Gorrby: Ok ok ok ok Ill do it again. BOO
Gourdy: You're shaking.
Gorrby: Thats the aura. Its SCARY. Ive heard it makes you go faster sometimes
Gourdy: I'm usually the calm one here.
Gorrby: Cool Ill take the other one
> An arcade cabinet pays out. Gorrby runs over, puts every coin back in, and loses it all in four seconds.
Gorrby: That was a good bet probably
Gourdy: He has my face and I have never been this tired.
Gorrby: THANK YOU
@exitall`),

    scene('06 · the floor is warm', 'Floor 6', `
@bg assets/boskers-globe/bg/floor.webp
@music bgRecycle
@card FLOOR 6 CLEARED
> A concrete room with a pipe, a red wheel and a green light. Somebody is lying on the floor with four tentacles, watching the ceiling lamp like it's the ocean.
@enter Yatta left
@enter Yeita right
Yatta [!]: Hi hi hi! I'm Yatta! Are you me? Are you the piñata one? Do you have candy?!
Yeita: Oh.. hi.. woah.. your voice is so fast. Like a hummingbird. Is it a hummingbird
Yatta: It's me! Yatta! Y-A-T-T-A!
Yeita: Yeita. Yeeeita. Its like a song if you hold the end
Yatta: Do you want to race to the elevator?
Yeita: Race.. ok.. wait. The floor is warm. Do you feel it. Its breathing
Yatta [sweat]: The floor isn't breathing.
Yeita: Not yet hehe
Yatta: You're yellow with blue on. You look like a guy from an old video I found.
Yeita: Oh the noob. Hes my cousin. Very nice guy. He fell off a lot
Yatta: What's with your tail?
Yeita: Four ropes. They go different ways. Sometimes the same way and its like.. wow
Yatta: Ok! Ok! I think you need a snack!
Yeita: I was going to say something. It was purple. It was about.. Fiin?
Yatta: Finn? He puns all day!
Yeita: Fiin never puns. He did once at a party. It didnt hit. The party was blue. I think the party was blue
@image bgFace
@imgoff
Yeita: Oh hi face
Yatta: Who are you talking to?
Yeita: Nobody. Its a face. Its fine
@exitall`),

    scene('07 · wrong strawberry', 'The Library', `
@bg assets/boskers-globe/bg/library.png
@music bgAmbient
@card FLOOR 8 CLEARED
> Bookshelves, ladders and a long red carpet. At the far end a strawberry head is standing very still next to a red ornament in a sweater.
@enter Sprout left
@enter Spriut right
Sprout: Who are you.
Spriut: Oh.. hi. Im Spriut. Sorry. Please dont be mad
Sprout: I'm not mad. I'm asking.
Spriut: Ok good I think
Sprout: Why are you holding the scarf like that?
Spriut: Its expensive. Do you want it
Sprout: No. Eat something. You look thin.
Spriut: I dont bake. I just ask the oven if its ok
Sprout: ...Where's Cosmo?
Spriut: Who
Sprout [!]: WHO?
Spriut: Is that bad? I didnt check. I dont check. Its fine
Sprout [glare]: It is not fine. We are going to find him. Now.
@exit Sprout
@exit Spriut
@enter Bobette left
@enter Balbeat right
Bobette: Merry Christmas! I brought presents for everyone! Mind the ribbon!
Balbeat: Merry Christmas in October. I am a ball
Bobette: You're a lovely ball.
Balbeat: Dont drop me. Dont unwrap me either
Bobette: I would never. I wrap things so they're safe.
Balbeat: Thats the problem
> The pipe in the corner groans. Behind a shelf, Pebble barks at the ceiling.
@enter Pebble center
Pebble: Bark! Bark!
@enter Rock right
@bark go
Rock: Chomp.
Pebble: Bark?
Rock: I am a shark. I am not a rock. Please stop sniffing me
@exit Bobette
@exit Balbeat
@exit Pebble
@exit Rock
@enter Vee left
@enter Spriut right
Vee: Spriut. The red thing that chased us on floor one. What was it?
Spriut: An addicted. They used to live here. Like me
Vee: What happened to them?
Spriut: They climbed one floor too many and then they couldnt stop. Their eyes go red. Mine started this morning
Vee [dots]: Your eyes look fine.
Spriut: Thats what everyone says
@exitall`),

    scene('08 · work at a pizza place', 'Bosker\'s Other Job', `
@bg assets/boskers-globe/bg/storefront.png
@music bgAmbient
@card FLOOR 9 CLEARED
> The elevator opens on a pizza place. Checkered floor, a ticket printer, a sign that says NOW HIRING. The only person in the room is Bosker, in a paper hat.
@enter Vee left
@enter Bosker right
Bosker: Hi welcome to Bosker's Pizza Place Im the cashier and the cook and the guy who mops
Vee: This isn't your store.
Bosker: Its my other job. It just shows up on floor nine. I dont know why
@enter Gourdy farleft
Gourdy: He has two jobs and nobody knows who he is.
Bosker: I know it sounds bad
Vee: What do you sell?
Bosker: Pizza. Also pizza. Sometimes its pizza and a bucket
@enter Bassie center
Bassie: Can I order something? I have money. HAhaha... ha... not real money
Bosker: Whats real money
> The ticket printer starts up. Nobody ordered anything. Slip one says: 1x pizza. Slip two says: 1x the same pizza. Slip three just says: Vee.
Vee: I'm on the order list.
Bosker: Oh sorry thats a different job
Vee [!]: What job?
Bosker: Idk I just work here
@enter Shelly farright
Shelly: Is this pizza a fossil? It's very old.
Bosker: It was made yesterday. Its been yesterday for a while
@exitall`),

    scene('09 · floor ten is the lobby', 'The Top Floor', `
@bg assets/boskers-globe/bg/lobby.webp
@music bgRecycle
@card FLOOR 10 CLEARED
> The elevator stops. The panel doesn't show a floor number anymore. The doors open on the lobby with the gravestones and the arcade cabinets and the purple wall. It's the same lobby.
@enter Vee left
@enter Astro right
Vee [!]: This is the lobby from floor five.
Astro: I think there's only one lobby.
@enter Bosker center
Bosker: Oh you made it. Hi. Sorry its late
Vee: Where's the top floor?
Bosker: This is it. Its the same room. It always was
Vee: We climbed ten floors to get back to the lobby.
Bosker: Everybody does. Thats why they cant stop
@enter Gourdy farleft
@enter Shelly farright
Shelly: So the addicteds keep climbing because there isn't a top.
Bosker: They think the next one will be different
Gourdy: Will it?
Bosker: No. But it feels like it might
@enter Atoe left
@enter Tee right
Atoe: I counted the floors!! There are none!! I counted them ALL!!
Tee: I thought it was a loop? Idk
Vee: Bosker. The key to the back room.
Bosker: Right. Its in my pocket. I had it the whole time. I think I wanted somebody to ask
> He hands Vee a brass key. Somebody has stamped a smiley face on it.
Vee: And the door home?
Bosker: In the lobby. Right there. Its always been in the lobby. You can go whenever
@enter Yatta center
Yatta: Wait, we could've LEFT?! The whole time?!
Bosker: Yeah but you wanted to climb
Yatta: ...I did, didn't I.
Bassie: What's the smiley face?
Bosker: Idk it just shows up. Last week it was in my soup
Vee: In your soup.
Bosker: It was good soup
Vee [dots]: I'm not asking a follow-up.
Bosker: The skins are in the back room. Everybody gets one. Dont wear them too long, you start talking like us
Vee: That's the most threatening thing you've said.
Bosker: Sorry!
@card BOSKER'S GLOBE · THE BACK ROOM IS OPEN
@exitall`),

    scene('10 · 99%', 'Loading', `
@bg assets/boskers-globe/bg/mansion.png
@music bgRecycle
@card FLOOR 12 CLEARED
> The elevator doors open halfway, then stop. Everybody stops. A grey bar is filling along the bottom of the world. It says 99%.
@enter Vee left
@enter Tee right
Vee: Why can't I move my arms?
Tee: I think its a loading screen. Idk
> The bar doesn't move.
@enter Atoe center
Atoe: I think weve been at 99% for a bit
Vee: How long is a bit?
Atoe: SIX FLOORS!! I COUNTED!!
@exit Atoe
@exit Tee
@enter Astro right
Astro: These usually have tips on them.
> A line of small text fades in at the bottom: TIP: do not stand in the lava.
Vee [glare]: That's it? That's the tip?
Astro: It's always the lava.
@enter Gorrby center
Gorrby: Where is the lava
Vee: Nowhere. It's a loading screen.
Gorrby: Cool so we can stand in it
Bosker: Hi sorry that one is me. I lost the last one percent
Vee: Where?
Bosker: In the couch
> The bar jumps to 100%. The doors finish opening. Somebody has left half a pizza on the floor.
@exitall`),

    scene('11 · free models', 'The Lobby', `
@bg assets/boskers-globe/bg/lobby.webp
@music bgAmbient
@card FLOOR 15 CLEARED
> The lobby again. Someone has put a fence around the grass. The fence is also in the grass.
@enter Shelly left
@enter Vee right
Shelly: Who builds a fence into the floor
Vee: Who built the lobby at all?
@enter Astro center
@enter Bosker farright
Bosker: Me. Out of free models
Astro: Free models?
Bosker: You search couch and it gives you a couch. Sometimes two couches and a script
Shelly: What does the script do
Bosker: Idk. The arcade runs on it
@enter Gourdy farleft
Gourdy: Is that safe
Bosker: The fence is not safe. The arcade is mostly safe
Shelly: Mostly
Bosker: I have not looked at the script. Please dont look at the script
@exitall`),

    scene('12 · floor twenty is also the lobby', 'The Top Floor', `
@bg assets/boskers-globe/bg/lobby.webp
@music bgAmbient
@card FLOOR 20 CLEARED
> Ten more floors and the lobby is still the lobby. Someone has hung a poster over the arcade cabinets. It's a crayon drawing of a rainbow flower and a tv standing next to each other. It says my fun day!
@enter Vee left
@enter Bosker right
Vee: You could have just told us it doesn't go anywhere.
Bosker: I did
Vee: When?
Bosker: At floor ten. You said "I'm not asking a follow-up"
Vee [dots]: That's not what I meant.
Bosker: Oh. Sorry
Vee: Why does the elevator still work?
Bosker: It works when somebody wants it to
Vee: That is not how elevators work.
Bosker: Its not really an elevator. Its a wardrobe, I think
@image bgFace
@imgoff
Bosker: The face is back
Vee: Where?
Bosker: On your clipboard
> Vee looks down. There's a smiley face on the clipboard. She sighs and keeps writing.
Vee: Next time we take the stairs.
Bosker: There arent any
@exitall`)
  ];
  const STORY_REQ = [0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20];
  const STORE_CHAPTERS = 9;
  const STORY_COUNT = STORY.length;

  const unlocked = i => i === 0 || state().best >= STORY_REQ[i];
  function nextStory(cleared) {
    const st = state();
    return STORY.findIndex((_, k) => !st.read.includes(k) && !st.offered[k] && STORY_REQ[k] <= cleared);
  }
  // The story engine assumes portraits face right and flips the right-hand ones to face the middle. The Globe's art
  // faces left, so for those portraits the flip has to be the other way round.
  function faceFix(v) {
    v.querySelectorAll('.ms-bust').forEach(b => {
      const im = b.querySelector('img'); if (!im || im.src.indexOf('boskers-globe/art') < 0) return;
      const flip = parseFloat(b.style.left) < 45;
      if (flip) { if (im.style.scale !== '-1 1' || im.style.getPropertyPriority('scale') !== 'important') im.style.setProperty('scale', '-1 1', 'important'); }
      else if (im.style.scale) im.style.removeProperty('scale');
    });
  }
  function watchFacing() {
    const poll = setInterval(() => {
      const v = document.querySelector('.bg-vn'); if (!v) return;
      clearInterval(poll);
      new MutationObserver(() => faceFix(v)).observe(v, { subtree: true, attributes: true, attributeFilter: ['style'], childList: true });
      faceFix(v);
    }, 60);
    setTimeout(() => clearInterval(poll), 8000);
  }
  function readStory(i) {
    const data = STORY[i];
    if (!data) return;
    watchFacing();
    StoryUI.playScene(0, false, {
      scene: data,
      className: 'bg-vn',
      onCommand: command => { if (command === 'bark') sfx('pebble-bark.mp3', { vol: .7, force: true }); },
      portrait: who => NAME_ART[who] ? ASSET + BASE + NAME_ART[who] : stPortrait(who),
      onFinish: skipped => {
        const st = state(), was = complete();
        if (!skipped) {
          if (!st.read.includes(i)) st.read.push(i);
          Save.write();
          UI.toast(`Chapter ${i + 1} read.`);
          const joined = Object.keys(GLOBE_JOIN).filter(id => GLOBE_JOIN[id] === i && Save.owns(id)).map(id => SKINS[id].name);
          if (joined.length) setTimeout(() => UI.toast(`${joined.join(', ')} can join your squad now.`), 500);
          if (!was && complete()) setTimeout(() => UI.toast("Bosker's back room is open: skins are for sale."), 1200);
        }
        Screens._raidDossier = ID; Screens._bgTab = st.run ? 'climb' : 'story'; Screens.render();
        playMusic(st.run ? 'bgRecycle' : 'bgAmbient');
      }
    });
  }

  /* ---------------------------------------------------------------- cards and items */
  const CARDS = {
    healp:    { name: 'Healp',            icon: 'ui/icon-heart.png',       text: 'oh look i got a band', tip: 'heals everyone 30%', now: run => healAll(run, .3) },
    money:    { name: 'Money!',           icon: 'ui/icon-dvd.png',         text: 'gives anyone like 50 DVD', tip: '+50 DVD', now: run => { run.dvd += 50; } },
    lighterer:{ name: 'lighterer',        icon: 'ui/icon-lighterer.png',   text: 'makes ur light biger in blackouts drool', tip: '+8% accuracy, +4% crit', max: 3, flat: { accP: .08, crit: .04 } },
    hallo:    { name: 'Halloween...',     icon: 'ui/icon-stopwatch.png',   text: 'increases the panic timer by 5s!', tip: '+5s panic, +5s fight', max: 4 },
    gamble:   { name: 'Gambling',         icon: 'ui/icon-gambling.png',    text: 'gives everyone a random item! [if they have a slot open]', tip: 'one random item', now: run => addItem(run, pick(Object.keys(ITEMS))) },
    slower:   { name: 'Slower evils',     icon: 'ui/icon-tar.png',         text: 'the addicteds are slower in panic now', tip: 'enemies -8% attack speed', max: 3, foe: { aspdP: -.08 } },
    hoard:    { name: 'Candy Hoard',      icon: 'ui/item-candle.png',      text: 'u ate a lot of candy. hits harder', tip: '+10% attack and magic', max: 3, flat: { atkP: .1, magP: .1 } },
    cables:   { name: 'Cables',           icon: 'ui/item-cables.png',      text: 'u cant get tied up as easy now', tip: '+12% control resist', max: 3, flat: { ccRes: .12 } },
    electro:  { name: 'CALL A ELECATROIAUON', icon: 'ui/icon-electro.png', text: 'makes blackouts rarer? i thinks', tip: '-4% damage taken', max: 3, flat: { dmgTaken: -.04 } },
    stamina:  { name: 'Stamina',          icon: 'ui/hud-heart.png',        text: 'u have more of it now', tip: '+12% hp, +6% defense', max: 3, flat: { hpP: .12, defP: .06 } },
    shoes:    { name: 'SpeedCandy',       icon: 'ui/item-speedcandy.png',  text: 'makes you go faster... somehow and it tastes like lemon', tip: '+8% attack speed, +12% move', max: 3, flat: { aspdP: .08, msP: .12 } },
    copy:     { name: 'Copywritresd',     icon: 'ui/item-wedge.png',       text: '[wait is that copywritresd?]', tip: 'random item, heals 10%', now: run => { addItem(run, pick(Object.keys(ITEMS))); healAll(run, .1); } }
  };
  const ITEMS = {
    speed: { icon: 'ui/item-speedcandy.png', name: 'SpeedCandy',      cost: 45, color: '#ffe84d', text: 'makes you go faster... somehow. one fight', flat: { aspdP: .16, msP: .2 } },
    skill: { icon: 'ui/item-candle.png',     name: 'SkillcheckCandy', cost: 45, color: '#ffb04d', text: 'if u mess up a machine this fixes it. automatic', auto: true },
    jaw:   { icon: 'ui/item-jaw.png',        name: 'Jawbreaker',      cost: 60, color: '#ff6f6f', text: 'our top scientists combined all the candles into a jawbreaker. random effct', random: true },
    cable: { icon: 'ui/item-cables.png',     name: 'Cables',          cost: 35, color: '#9aa3ad', text: 'ties the addicteds feet together. one fight', foe: { aspdP: -.18 } },
    band:  { icon: 'ui/hud-heart.png',       name: 'Band-Aid',        cost: 30, color: '#ff9fc4', text: 'heals everybody 35% right now', heal: .35 },
    stam:  { icon: 'ui/item-wedge.png',      name: 'Staminacandy',    cost: 50, color: '#8dd06a', text: 'more hp for one fight', flat: { hpP: .2 } }
  };
  const healAll = (run, pct) => Object.keys(run.hp).forEach(id => { if (run.hp[id] > 0) run.hp[id] = clamp(run.hp[id] + pct, 0, 1); });
  function addItem(run, key) { run.items[key] = (run.items[key] || 0) + 1; }
  const cardStack = (run, id) => run.cards[id] || 0;
  function offerCards(run) {
    const rng = seeded(`bg-cards:${run.seed}:${run.floor}`);
    return rng.shuffle(Object.keys(CARDS).filter(k => !CARDS[k].max || cardStack(run, k) < CARDS[k].max)).slice(0, 3);
  }
  function applyFlat(units, flat, mult = 1) {
    units.forEach(u => {
      Object.keys(flat).forEach(k => { u.flat[k + '91'] = (u.flat[k + '91'] || 0) + flat[k] * mult; });
      u.dirty = true;
    });
  }
  function applyRunBuild(B, run, armed) {
    const allies = B.units.filter(u => u.team === TEAM_P && !u.minion);
    const foes = B.units.filter(u => u.team === TEAM_E);
    Object.keys(run.cards).forEach(id => {
      const c = CARDS[id], n = run.cards[id];
      if (c.flat) applyFlat(allies, c.flat, n);
      if (c.foe) applyFlat(foes, c.foe, n);
    });
    armed.forEach(key => {
      const it = ITEMS[key];
      if (it.flat) applyFlat(allies, it.flat);
      if (it.foe) applyFlat(foes, it.foe);
      if (it.random) {
        const roll = pick(['speed', 'stam', 'cable', 'hoard']);
        if (roll === 'speed') applyFlat(allies, ITEMS.speed.flat);
        else if (roll === 'stam') applyFlat(allies, ITEMS.stam.flat);
        else if (roll === 'cable') applyFlat(foes, ITEMS.cable.foe);
        else applyFlat(allies, CARDS.hoard.flat, 2);
        UI.toast('Jawbreaker: ' + ({ speed: 'went faster', stam: 'got more stamina', cable: 'tied them up', hoard: 'hit harder' })[roll]);
      }
    });
  }

  /* ---------------------------------------------------------------- run logic */
  const CAST = ['Astro', 'Shelly', 'Vee', 'Bassie', 'Bobette', 'Gourdy', 'Sprout', 'Pebble', 'Yatta'];
  const castOwned = () => CAST.filter(id => HEROES[id] && Save.owns(id) && !isCollab(id));
  const FLOOR_BGS = ['floor.webp', 'lobby.webp', 'hall.png', 'library.png'];
  const bgFile = floor => FLOOR_BGS[(floor - 1) % FLOOR_BGS.length];
  const DIFFS = {
    easy:   { name: 'Easy',   reward: .6,  text: 'Fine at any Mastery.', M: f => 40 + f * 30 },
    medium: { name: 'Medium', reward: 1,   text: 'Tuned for Mastery 600+ from floor 10, and 800+ from floor 20.', M: f => f < 10 ? 100 + f * 50 : 600 + (f - 10) * 20 },
    hard:   { name: 'Hard',   reward: 1.6, text: 'Tuned for Mastery 800+ the whole way.', M: f => 450 + f * 40 }
  };
  const rewardMult = run => (DIFFS[run.diff] || DIFFS.medium).reward * (run.anyone ? .35 : 1);
  const recMastery = run => run.diff === 'hard' ? 800 : run.diff === 'easy' ? 0 : run.floor >= 20 ? 800 : run.floor >= 10 ? 600 : 0;
  const startPanic = run => 45 + 5 * cardStack(run, 'hallo');
  let timer = null;
  const clearTimer = () => { clearInterval(timer); timer = null; };
  const orphaned = hud => {
    if (hud.isConnected) return false;
    clearTimer();
    if (roamKeys) { document.removeEventListener('keydown', roamKeys.kd); document.removeEventListener('keyup', roamKeys.ku); }
    return true;
  };
  const mangle = name => String(name).toLowerCase().replace(/([aeiou])([a-z])/, (m, a, b) => b + a);

  function newRun(team, diff, anyone) {
    const run = { seed: String(Date.now()), floor: 1, phase: 'cards', team, diff: diff || 'medium', anyone: !!anyone, hp: {}, cards: {}, dvd: 0, items: {}, armed: [], mach: 0, panic: 0, panicked: false, offer: [], shopStock: [], cleared: 0 };
    team.forEach(id => { run.hp[id] = 1; });
    run.offer = offerCards(run);
    state().run = run; state().runs++;
    Save.write();
    return run;
  }
  function endRun(run, reason) {
    const st = state(), floors = Math.max(0, run.cleared), dvd = run.dvd, ichor = Math.round(floors * 400 * rewardMult(run) + dvd * 30);
    st.dvd += dvd;
    st.best = Math.max(st.best, floors);
    st.bests[run.diff || 'medium'] = Math.max(st.bests[run.diff || 'medium'] || 0, floors);
    if (st.best >= FACE_FLOOR && !st.faceGiven && Save.addTrinketCopy('the_face', 1)) { st.faceGiven = true; setTimeout(() => UI.toast('You got The Face.'), 500); }
    st.last = { floors, dvd, ichor, reason };
    st.run = null;
    if (ichor) Save.give({ ichor }, true);
    const was = st.opened;
    st.opened = complete();
    Save.write();
    if (st.opened && !was) setTimeout(() => UI.toast("Bosker's Store is open: skins are for sale."), 300);
  }
  const alive = run => run.team.filter(k => run.hp[k] > 0 && !copyBlocked(k));
  const teamLevel = run => { const ids = alive(run); return ids.length ? ids.reduce((a, k) => a + Save.hero(baseId(k)).level, 0) / ids.length : 1; };

  function foesFor(run) {
    const rng = seeded(`bg-foes:${run.seed}:${run.floor}`), floor = run.floor, boss = floor % 5 === 0;
    const diff = DIFFS[run.diff] || DIFFS.medium;
    let lv = Math.round(diff.M(floor) * .9);
    if (run.diff === 'easy' || (run.diff !== 'hard' && floor < 10)) lv = Math.min(lv, Math.round(teamLevel(run) * 1.15 + 5));
    lv = clamp(lv, 3, 800);
    const pool = endlessTwistedPool(Math.max(1, floor * 6)).filter(id => !EVENT_ONLY_TWISTED.has(id) && !isCollab(id));
    const n = clamp(2 + Math.floor(floor / 3), 3, 5) + (run.panicked ? 1 : 0);
    const list = [];
    if (boss) list.push(Depths.harden(makeTwisted(rng.pick(pool), Math.round(lv * 1.15), 'boss'), floor * 6, rng));
    rng.shuffle(pool.slice()).slice(0, boss ? Math.min(3, n - 1) : n).forEach(id => list.push(Depths.harden(makeTwisted(id, lv, floor % 4 === 0 ? 'elite' : 'normal'), floor * 6, rng)));
    if (floor < 4 && typeof makeWeakling === 'function') list.push(Depths.harden(makeWeakling(rng.pick(WEAKLING_IDS), Math.max(1, lv - 2)), floor, rng));
    list.forEach(spec => { spec.name = 'Addicted ' + mangle(spec.name || HEROES[spec.id]?.name || spec.id); });
    return list;
  }

  // The Globe's art is drawn taller than the game's sprites. In a fight, fit it to roughly the same height as its neighbours.
  function fitGlobeUnits() {
    document.querySelectorAll('#unitLayer .unit .body img').forEach(im => {
      if (im.src.indexOf('boskers-globe/art') < 0 || im.dataset.bgFit || !im.naturalWidth) return;
      const body = im.closest('.body'), bw = body && body.getBoundingClientRect().width;
      if (!bw) return;
      const aspect = im.naturalHeight / im.naturalWidth;
      // tall art is fitted by height; wide art (Rock) by width, so it is not stretched across the field
      const h = Math.min(bw * 1.35, bw * 0.95 * aspect);
      im.style.height = h + 'px'; im.style.width = (h / aspect) + 'px'; im.style.display = 'block'; im.style.margin = '0 auto'; im.dataset.bgFit = '1';
    });
  }
  function fightFloor(enc) {
    const run = state().run; if (!run) return;
    const ids = alive(run);
    if (!ids.length) { endRun(run, 'wiped'); return backToHub(); }
    climbMode = true; foeMode = true;
    copyInFight = new Set(ids.filter(isCopy).map(baseId));
    const armed = enc ? [] : run.armed.filter(k => run.items[k] > 0);
    armed.forEach(k => { run.items[k]--; });
    if (!enc) run.armed = [];
    const team = ids.map(k => { const s = playerSpec(baseId(k)); if (isCopy(k)) { s.costume = COSTUME; s.trinkets = ((state().copyTrinkets || {})[baseId(k)] || []).filter(u => u && Save.data.trinketInv[u]); } s.carryHp = run.hp[k]; return s; });
    const foes = enc ? enc.foes : foesFor(run);
    const restoreFaces = setFoeFaces(foes);
    const fitTimer = setInterval(fitGlobeUnits, 250);
    const b = BattleScreen.launch({
      team, foes, music: 'bgRecycle',
      meta: {
        title: enc ? 'Caught!' : `Floor ${run.floor} · the addicteds`, floorLabel: enc ? `Floor ${run.floor} · caught` : `Floor ${run.floor}${run.floor % 5 === 0 ? ' · the big one' : ''}`,
        roomIdx: 1, roomTotal: 1, survivedLabel: `Floor ${run.floor}!`,
        bg: ASSET + BASE + 'bg/' + bgFile(run.floor), timeLimit: 150 + 5 * cardStack(run, 'hallo'), mods: [], mutations: []
      },
      rewards: () => ({}),
      skipResults: true,
      onReady: battle => {
        applyRunBuild(battle, run, armed);
        battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach((u, i) => { const pct = run.hp[ids[i]]; if (pct != null && pct < 1) u.hp = Math.max(1, u.max.hp * pct); });
      },
      onDone: res => {
        climbMode = false; foeMode = false; copyInFight = new Set(); restoreFaces(); clearInterval(fitTimer);
        b.units.filter(u => u.team === TEAM_P && !u.minion).forEach((u, i) => { if (ids[i] != null) run.hp[ids[i]] = u.alive ? clamp(u.hpPct, .15, 1) : 0; });
        if (enc) {
          if (res.win && !res.quit) { run.dvd += Math.round((12 + run.floor * 2) * rewardMult(run)); enc.onWin(); Save.write(); }
          else endRun(run, res.quit ? 'left' : 'wiped');
          backToHub(); return;
        }
        if (res.win && !res.quit) {
          run.cleared = run.floor; run.dvd += Math.round((25 + run.floor * 6) * rewardMult(run));
          run.floor++; run.mach = 0; run.panicked = false;
          run.phase = (run.floor - 1) % 2 === 0 ? 'shop' : 'cards';
          if (run.phase === 'shop') run.shopStock = seeded(`bg-shop:${run.seed}:${run.floor}`).shuffle(Object.keys(ITEMS)).slice(0, 3); else run.offer = offerCards(run);
          const story = nextStory(run.cleared);
          if (story >= 0) { state().offered[story] = true; run.pendingStory = story; }
          else if (Math.random() < .35) { const ev = pickEvent(run); if (ev) { run.event = ev.id; run.afterEvent = run.phase; run.phase = 'event'; } }
          Save.write();
        } else endRun(run, res.quit ? 'left' : 'wiped');
        backToHub();
      }
    });
  }
  function backToHub() { Screens._raidDossier = ID; Screens._bgTab = 'climb'; Screens.render(); }

  /* ---------------------------------------------------------------- the hub: the Globe's own menus */
  const TABS = [['lobby', 'Lobby'], ['story', 'Story'], ['climb', 'Climb'], ['store', 'Store']];

  function dossier(s) {
    clearTimer();
    const st = state();
    const tabsNow = TABS.concat(copiesUnlocked().length ? [['squad', 'Globe']] : []);
    if (!tabsNow.some(t => t[0] === Screens._bgTab)) Screens._bgTab = 'lobby';
    const tab = Screens._bgTab, inRun = tab === 'climb' && !!st.run;
    const root = el('div', 'bg-wrap bg-tab-' + tab + (inRun ? ' bg-inrun' : ''));
    root.style.backgroundImage = `url(${ASSET + BASE}bg/lobby.webp)`;
    root.innerHTML = `
      <header class="bg-bar">
        <button class="bg-rbx" type="button" aria-label="Leave the Globe"><i></i></button>
        <span class="bg-bar-title">${inRun ? '' : tabsNow.find(t => t[0] === tab)[1]}</span>
        <span class="bg-money" title="DVD"><img src="${img('ui/icon-dvd.png')}" alt="DVD"><b>${fmt(st.dvd)}</b></span>
      </header>
      <main class="bg-main"></main>
      <nav class="bg-nav" aria-label="Globe menu">${tabsNow.map(([k, label]) => `<button type="button" data-bgtab="${k}" class="${k === tab ? 'on' : ''}">${label}</button>`).join('')}</nav>`;
    s.appendChild(root);
    $('.bg-rbx', root).onclick = () => { clearTimer(); sfx('button.wav', { vol: .4, force: true }); Screens._raidDossier = null; Screens.go('raid'); try { Music.screen(Screens.cur); } catch (_) { /* optional */ } };
    $$('[data-bgtab]', root).forEach(b => b.onclick = () => { sfx('switch.wav', { vol: .35, force: true }); Screens._bgTab = b.dataset.bgtab; Screens.render(); });
    ({ lobby: tabLobby, story: tabStory, climb: tabClimb, store: tabStore, squad: tabSquad })[tab]($('.bg-main', root));
  }

  function tabLobby(main) {
    const st = state();
    const row = (ok, text) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✔' : '✖'}</i>${text}</li>`;
    main.innerHTML = `<div class="bg-lobbyscreen">
      <section class="bg-panel"><h2>Lobby</h2>
        <p>Pick a difficulty and a squad, then climb: pick a card, fix 2 machines, take the elevator, fight. The story plays as you go.</p>
        <ul class="bg-check">
        ${row(storyDone(), `chapters read: ${st.read.filter(i => i < STORE_CHAPTERS).length}/${STORE_CHAPTERS}`)}</ul>
        <p class="bg-small">${complete() ? "Bosker's back room is open." : (() => { const n = STORY.findIndex((_, i) => !st.read.includes(i)); return !STORY_REQ[n] ? 'Next chapter: start a run.' : `Next chapter: clear floor ${STORY_REQ[n]} (best: ${st.best}).`; })()}</p></section>
      <div class="bg-row-btns"><button class="bg-big" data-go="story" type="button">Story</button><button class="bg-big" data-go="climb" type="button">Climb</button></div></div>`;
    $$('[data-go]', main).forEach(b => b.onclick = () => { sfx('switch.wav', { vol: .4, force: true }); Screens._bgTab = b.dataset.go; Screens.render(); });
  }

  function tabStory(main) {
    const st = state();
    main.innerHTML = `<div class="bg-panel bg-storylist"><h2>Story</h2><p class="bg-small">Chapters unlock as you clear floors in the Climb, on any difficulty. Best floor: ${st.best}.</p><div class="bg-chapters"></div></div>
      <div class="bg-panel"><h2>Notes</h2><p class="bg-small">Found in free roam floors: ${st.notes.length}/${NOTES.length}.</p><ul class="bg-notes">${st.notes.map(k => `<li>${NOTES[k]}</li>`).join('')}</ul></div>`;
    const list = $('.bg-chapters', main);
    STORY.forEach((sc, i) => {
      const open = unlocked(i), done = st.read.includes(i);
      const b = el('button', 'bg-chapter' + (open ? '' : ' locked') + (done ? ' done' : ''));
      b.type = 'button';
      b.innerHTML = open ? `<b>${sc.title}</b><small>${sc.place}</small><em>${done ? 'read' : 'play'}</em>` : `<b>${i + 1} · ???</b><small>clear floor ${STORY_REQ[i]}</small><em>locked</em>`;
      b.onclick = () => { if (!open) { sfx('error.mp3', { vol: .35, force: true }); return; } sfx('pageturn.wav', { vol: .5, force: true }); readStory(i); };
      list.appendChild(b);
    });
  }

  /* ---- toon-menu tiles, the layout the Globe's own toon menu uses ---- */
  const tileHtml = (src, label, extra = '') => `<img src="${src}" alt=""><span class="bg-tile-name">${label}</span>${extra}`;

  const anyOwned = () => Save.ownedIds().filter(id => HEROES[id] && !HEROES[id].weakling)
    .sort((a, b) => Save.hero(b).level - Save.hero(a).level);

  function tabClimb(main) {
    const st = state();
    if (st.run) return runHud(main, st.run);
    const diff = Screens._bgDiff || 'medium', any = !!Screens._bgAny, D = DIFFS[diff];
    const pool = (any ? anyOwned() : castOwned()).concat(copyKeys());
    const tiles = any ? pool : CAST.filter(id => HEROES[id]).concat(copyKeys());
    const saved = (Screens._bgPick || []).filter(id => pool.includes(id));
    const picked = new Set((saved.length ? saved : pool).slice(0, 5));
    Screens._bgPick = [...picked];
    const bests = st.bests || {};
    main.innerHTML = `<div class="bg-panel bg-selectpanel"><h2>The Climb</h2>
      <div class="bg-seg">${Object.keys(DIFFS).map(k => `<button type="button" data-diff="${k}" class="${k === diff ? 'on' : ''}">${DIFFS[k].name}</button>`).join('')}</div>
      <p class="bg-small">${D.text} Your Mastery: ${Save.data.mastery}. Rewards x${D.reward}.</p>
      <div class="bg-seg"><button type="button" data-squad="cast" class="${any ? '' : 'on'}">The cast</button><button type="button" data-squad="any" class="${any ? 'on' : ''}">Anyone</button></div>
      <p class="bg-small">${any ? 'Any toon you own, collabs and events included. Rewards x0.35. The story and the skin store unlock either way. Globe versions can join here too, unless that toon is wearing its skin.' : 'The main toons and Yatta. Full rewards. Globe versions you have met can join too, and play exactly like the original. A toon wearing its skin cannot bring its Globe version.'}</p>
      <div class="bg-tiles"></div>
      <button class="bg-big bg-start" type="button">START</button>
      <p class="bg-small">Best floor: easy ${bests.easy || 0} · medium ${bests.medium || 0} · hard ${bests.hard || 0}. Every third floor is free roam.</p>
      ${st.last ? `<p class="bg-small">Last run: floor ${st.last.floors}, ${st.last.dvd} DVD, ${st.last.reason === 'wiped' ? 'everyone went down' : 'you left'}.</p>` : ''}</div>`;
    $$('[data-diff]', main).forEach(b => b.onclick = () => { Screens._bgDiff = b.dataset.diff; sfx('button.wav', { vol: .35, force: true }); Screens.render(); });
    $$('[data-squad]', main).forEach(b => b.onclick = () => { Screens._bgAny = b.dataset.squad === 'any'; Screens._bgPick = []; sfx('button.wav', { vol: .35, force: true }); Screens.render(); });
    const grid = $('.bg-tiles', main);
    tiles.forEach(id => {
      const owned = pool.includes(id);
      const b = el('button', 'bg-tile' + (picked.has(id) ? ' sel' : '') + (owned ? '' : ' missing'));
      b.type = 'button'; b.disabled = !owned;
      b.innerHTML = tileHtml(artFor(id), nameFor(id), owned ? (isCopy(id) ? '<i class="bg-own">Globe</i>' : '') : '<i class="bg-lock">not recruited</i>');
      b.onclick = () => {
        if (picked.has(id)) picked.delete(id); else if (picked.size < 5) picked.add(id); else { sfx('error.mp3', { vol: .3, force: true }); return; }
        Screens._bgPick = [...picked]; b.classList.toggle('sel', picked.has(id)); sfx('button.wav', { vol: .35, force: true });
      };
      grid.appendChild(b);
    });
    $('.bg-start', main).onclick = () => {
      if (!picked.size) { UI.toast('Pick someone first.'); return; }
      sfx('switch.wav', { vol: .5, force: true });
      const run = newRun([...picked], diff, any);
      if (!st.read.includes(0) && !st.offered[0]) { st.offered[0] = true; run.pendingStory = 0; Save.write(); }
      playMusic('bgRecycle'); Screens.render();
    };
  }

  /* ---- the in-run HUD, after the Globe's own screens ---- */
  const hudTop = (run, line) => `<div class="bg-floor">Floor ${run.floor}</div><div class="bg-count">${run.mach}/2</div><div class="bg-line">${line}</div>${recMastery(run) ? `<div class="bg-warn">Tuned for Mastery ${recMastery(run)}+ · yours ${Save.data.mastery}</div>` : ''}`;
  const avgHp = run => { const a = run.team.filter(id => run.hp[id] > 0); return a.length ? Math.round(a.reduce((t, id) => t + run.hp[id], 0) / run.team.length * 100) : 0; };
  const hudBottom = run => `<div class="bg-stats">
      <div class="bg-stat"><img src="${img('ui/hud-money.png')}" alt="DVD"><b>${run.dvd}</b></div>
      <div class="bg-stat"><img src="${img('ui/hud-heart.png')}" alt="HP"><b>${avgHp(run)}%</b></div>
      <div class="bg-stat bg-bar-stat"><i style="width:${run.phase === 'floor' ? clamp(run.panic / startPanic(run), 0, 1) * 100 : 100}%"></i><b>Panic ${run.phase === 'floor' ? run.panic : startPanic(run)} / ${startPanic(run)}</b></div></div>
    <div class="bg-chatbtn" aria-hidden="true"></div>
    <div class="bg-hotbar">${Object.keys(run.items).filter(k => run.items[k] > 0).slice(0, 5).map((k, i) => `<button type="button" class="bg-slot${run.armed.includes(k) ? ' armed' : ''}" data-item="${k}" title="${ITEMS[k].text}"><em>${i + 1}</em><b>${run.items[k]}</b><img src="${img(ITEMS[k].icon)}" alt=""><span style="color:${ITEMS[k].color}">${ITEMS[k].name}</span></button>`).join('')}</div>`;
  const teamStrip = run => `<div class="bg-team">${run.team.map(id => `<div class="bg-mate${run.hp[id] <= 0 || copyBlocked(id) ? ' down' : ''}"><img src="${artFor(id)}" alt=""><i style="width:${Math.round(clamp(run.hp[id], 0, 1) * 100)}%"></i></div>`).join('')}</div>`;
  function wireItems(hud, run) {
    $$('[data-item]', hud).forEach(b => b.onclick = () => {
      const k = b.dataset.item, it = ITEMS[k];
      if (it.auto) { UI.toast(it.name + ' works on its own.'); return; }
      sfx('button.wav', { vol: .4, force: true });
      if (it.heal) { run.items[k]--; healAll(run, it.heal); Save.write(); Screens.render(); return; }
      run.armed = run.armed.includes(k) ? run.armed.filter(x => x !== k) : run.armed.concat(k);
      Save.write(); Screens.render();
    });
  }

  /* ---------------------------------------------------------------- things that happen in the elevator */
  // Now and then the elevator stops somewhere that makes no sense. Each one is a small choice with a small result.
  const hurtAll = (run, pct) => Object.keys(run.hp).forEach(id => { if (run.hp[id] > 0) run.hp[id] = Math.max(.1, run.hp[id] - pct); });
  const randItem = () => pick(Object.keys(ITEMS));
  const EVENTS = [
    { id: 'admin', title: 'FREE ADMIN', text: 'A folding table with a bell and a sign that says FREE ADMIN. Nobody is at the table. The bell has already been rung.',
      choices: [
        { label: 'Take it', go: run => { if (Math.random() < .5) { run.dvd += 60; return 'You type :dvd me and it works. +60 DVD.'; } hurtAll(run, .15); return 'The admin was a ban hammer. Everybody loses 15% HP.'; } },
        { label: 'Leave it', go: () => 'You leave. The bell rings by itself.' }] },
    { id: 'obby', title: 'AN OBBY', text: 'The elevator will not open. In front of it is a course of floating squares and one of them is red. A sign says it is not lava. The sign is also red.',
      choices: [
        { label: 'Jump it', go: run => { if (Math.random() < .55) { addItem(run, randItem()); return 'You make it across and find a candy on the last square.'; } hurtAll(run, .08); return 'You fall. A tiny voice says checkpoint reached. Everybody loses 8% HP.'; } },
        { label: 'Walk around', go: () => 'There is no around. You stand there for a while and then the elevator opens anyway.' }] },
    { id: 'guest', title: 'A GUEST', text: 'A guy with a yellow head and a blue shirt is standing in the elevator. He says he has been in here since 2007. He asks if you have seen his friend, also named Guest.',
      choices: [
        { label: 'Let him ride', go: run => { addItem(run, randItem()); return 'He gives you a candy from his pocket and gets off two floors later. There was no floor there.'; } },
        { label: 'Say no', go: () => 'He nods like he has heard that before.' }] },
    { id: 'tix', title: 'THE TIX MACHINE', text: 'A machine from before the machines. It only takes Tix. You only have DVD. It is thinking about it.',
      choices: [
        { label: 'Insert 20 DVD', go: run => {
          if (run.dvd < 20) return 'You do not have 20 DVD. The machine looks disappointed in a way machines should not.';
          run.dvd -= 20; sfx('recycle.mp3', { vol: .5, force: true }); const r = Math.random();
          if (r < .4) { run.dvd += 70; return 'It spits out 70 DVD. Math is not its strong suit.'; }
          if (r < .8) { addItem(run, randItem()); return 'A candy drops out of the slot.'; }
          return 'Nothing. A receipt says: thanks for your Tix.'; } },
        { label: 'Walk away', go: () => 'The machine says "come back" very quietly.' }] },
    { id: 'freemodel', title: 'A FREE MODEL', text: 'There is a couch in the hallway. You did not see anyone bring it. It has a very small sign that says free. Sitting on it feels like a decision.',
      choices: [
        { label: 'Sit down', go: run => { healAll(run, .2); return 'It is a good couch. Everybody feels better. +20% HP.'; } },
        { label: 'Check under it', go: run => { run.dvd += 15; return 'Under the couch there is a second, smaller couch, and 15 DVD. +15 DVD.'; } }] },
    { id: 'loading', title: 'LOADING', text: 'Everything stops. A bar fills along the bottom of the world and sits at 99%. A tip fades in: do not stand in the lava.',
      choices: [
        { label: 'Wait', go: run => { healAll(run, .1); run.dvd += 10; return 'It gets to 100% eventually. Somebody left a slice of pizza. +10% HP and +10 DVD.'; } },
        { label: 'Press everything', go: run => { addItem(run, randItem()); return 'The bar goes backwards, then forwards, then gives you a candy as an apology.'; } }] },
    { id: 'delivery', title: 'A DELIVERY', text: 'A pizza box arrives by elevator. It is addressed to Vee, at floor nine. You are not on floor nine.',
      choices: [
        { label: 'Share it', go: run => { healAll(run, .15); return 'Everybody gets a slice. It tastes like yesterday. +15% HP.'; } },
        { label: 'Send it back', go: run => { run.dvd += 30; return 'The delivery guy tips you for the effort. +30 DVD.'; } }] },
    { id: 'filter', title: 'THE SIGN', text: 'A sign on the wall reads: #### #### #### ####. Underneath it says this message has been filtered.',
      choices: [
        { label: 'Read it anyway', go: run => { run.dvd += 12; return 'You cannot. It is all hashtags. But you feel like somebody said something rude about you. +12 DVD, somehow.'; } },
        { label: 'Add to it', go: () => 'You add four more #. The sign accepts them.' }] }
  ];
  function pickEvent(run) {
    run.seenEvents = run.seenEvents || [];
    const left = EVENTS.filter(e => !run.seenEvents.includes(e.id));
    return left.length ? pick(left) : null;
  }
  function hudEvent(hud, run) {
    const ev = EVENTS.find(e => e.id === run.event) || EVENTS[0];
    hud.innerHTML = `${hudTop(run, 'The elevator stopped.')}
      <div class="bg-event"><h3>${ev.title}</h3><p>${ev.text}</p><div class="bg-event-choices">${ev.choices.map((c, i) => `<button class="bg-red" type="button" data-c="${i}">${c.label}</button>`).join('')}</div></div>
      ${teamStrip(run)}${hudBottom(run)}`;
    wireItems(hud, run);
    $$('[data-c]', hud).forEach(b => b.onclick = () => {
      const out = ev.choices[+b.dataset.c].go(run);
      (run.seenEvents = run.seenEvents || []).push(ev.id); Save.write(); sfx('snap.wav', { vol: .5, force: true });
      const box = $('.bg-event', hud);
      box.innerHTML = `<h3>${ev.title}</h3><p>${out}</p><div class="bg-event-choices"><button class="bg-red bg-event-go" type="button">Continue</button></div>`;
      $('.bg-event-go', box).onclick = () => {
        run.phase = run.afterEvent || 'cards'; run.event = null;
        if (run.phase === 'cards') run.offer = offerCards(run);
        Save.write(); Screens.render();
      };
    });
  }

  // The face pops in for a couple of seconds now and then. Tap it for a hello.
  function faceCameo(hud) {
    const e = el('img', 'bg-face-cameo'); e.src = img('ui/the-face.svg'); e.alt = 'the face';
    e.style[pick(['left', 'right'])] = (4 + Math.random() * 20) + '%'; e.style.top = (24 + Math.random() * 36) + '%';
    e.onclick = () => { sfx('snap.wav', { vol: .4, force: true }); UI.toast('The face says hi.'); e.remove(); };
    hud.appendChild(e); setTimeout(() => e.remove(), 2600);
  }
  function runHud(main, run) {
    main.innerHTML = '';
    const hud = el('div', 'bg-game');
    hud.style.backgroundImage = `url(${ASSET + BASE}bg/${bgFile(run.floor)})`;
    main.appendChild(hud);
    if (run.phase === 'cards') hudCards(hud, run); else if (run.phase === 'shop') hudShop(hud, run); else if (run.phase === 'event') hudEvent(hud, run); else hudFloor(hud, run);
    if (run.pendingStory == null && Math.random() < .12) faceCameo(hud);
    if (run.pendingStory != null) { const i = run.pendingStory; run.pendingStory = null; Save.write(); clearTimer(); setTimeout(() => readStory(i), 80); }
  }

  function hudCards(hud, run) {
    let left = 25;
    hud.innerHTML = `${hudTop(run, `Pick a card <span class="bg-t">${left}</span> seconds left.`)}
      <div class="bg-cards">${run.offer.map(k => `<button type="button" class="bg-card" data-card="${k}"><img src="${img(CARDS[k].icon)}" alt=""><b>${CARDS[k].name}</b><span>${CARDS[k].text}</span><em class="bg-tip">${CARDS[k].tip}</em>${CARDS[k].max ? `<small>${cardStack(run, k)}/${CARDS[k].max}</small>` : ''}</button>`).join('')}</div>
      <button class="bg-red bg-leave" type="button">Take the elevator out</button>${teamStrip(run)}${hudBottom(run)}`;
    wireItems(hud, run);
    const choose = k => {
      clearTimer();
      const c = CARDS[k];
      if (c.now) c.now(run);
      if (c.flat || c.foe || c.max) run.cards[k] = (run.cards[k] || 0) + 1;
      run.phase = 'floor'; run.mach = 0; run.panic = startPanic(run); run.panicked = false;
      sfx('snap.wav', { vol: .6, force: true }); Save.write(); Screens.render();
    };
    $$('[data-card]', hud).forEach(b => b.onclick = () => choose(b.dataset.card));
    $('.bg-leave', hud).onclick = () => { clearTimer(); sfx('sadtrombone.ogg', { vol: .4, force: true }); endRun(run, 'left'); backToHub(); };
    timer = setInterval(() => { if (orphaned(hud)) return; left--; const t = $('.bg-t', hud); if (t) t.textContent = left; if (left <= 0) choose(pick(run.offer)); }, 1000);
  }

  function hudShop(hud, run) {
    let left = 28;
    hud.innerHTML = `${hudTop(run, `Bosker's Store is leaving in <span class="bg-t">${left}</span> seconds.`)}
      <div class="bg-shopkeep"><span class="bg-bubble">${pick(['I know its not the best sorry..', 'Uhh.. Are these any better?', 'Every little bit helps!', 'Its all lemon.. sorry', 'DVD only please. No robux, I checked'])}</span><div><img class="bg-bosker" src="${img('art/bosker.png')}" alt=""><img class="bg-prop" src="${img('ui/prop-boombox.png')}" alt=""></div></div>
      <div class="bg-cards">${run.shopStock.map(k => `<button type="button" class="bg-card" data-buy="${k}" ${run.dvd < ITEMS[k].cost ? 'disabled' : ''}><img src="${img(ITEMS[k].icon)}" alt=""><b style="color:${ITEMS[k].color}">${ITEMS[k].name}</b><span>${ITEMS[k].text}</span><small>Buy for ${ITEMS[k].cost} DVD</small></button>`).join('')}</div>
      <button class="bg-red bg-leave" type="button">Leave the store ></button>${teamStrip(run)}${hudBottom(run)}`;
    wireItems(hud, run);
    const leave = () => { clearTimer(); run.phase = 'cards'; run.offer = offerCards(run); Save.write(); Screens.render(); };
    $$('[data-buy]', hud).forEach(b => b.onclick = () => {
      const k = b.dataset.buy, it = ITEMS[k]; if (run.dvd < it.cost) return;
      run.dvd -= it.cost; addItem(run, k); run.shopStock = run.shopStock.filter(x => x !== k);
      sfx('recycle.mp3', { vol: .5, force: true }); Save.write(); Screens.render();
    });
    $('.bg-leave', hud).onclick = leave;
    timer = setInterval(() => { if (orphaned(hud)) return; left--; const t = $('.bg-t', hud); if (t) t.textContent = left; if (left <= 0) leave(); }, 1000);
  }

  // Two machine types: SkillCheck (a needle) and the fish tank (a flappy-fish game).
  const machineType = (run, i) => ((run.floor + i) % 2 === 0 ? 'fish' : 'skill');
  function hudFloor(hud, run) {
    if (isRoam(run.floor)) return hudRoam(hud, run);
    const done = run.mach >= 2;
    const line = () => done ? 'The elevator is ready.' : run.panic > 0 ? `Panic in <span class="bg-t">${run.panic}</span> seconds.` : 'Panic! The addicteds noticed you.';
    hud.innerHTML = `${hudTop(run, line())}
      <div class="bg-machines">${[0, 1].map(i => `<button type="button" class="bg-machine${run.mach > i ? ' done' : ''}" data-machine="${i}" ${run.mach > i ? 'disabled' : ''}><img src="${img('ui/machine.png')}" alt=""><span class="bg-skillbtn">${run.mach > i ? 'fixed' : machineType(run, i) === 'fish' ? 'Fish tank' : 'SkillCheck'}</span></button>`).join('')}</div>
      ${teamStrip(run)}${hudBottom(run)}<button class="bg-next${done ? ' ready' : ''}" type="button" aria-label="Elevator">&gt;</button><div class="bg-pop" hidden></div>`;
    wireItems(hud, run);
    const refresh = () => {
      const l = $('.bg-line', hud); if (l) l.innerHTML = line();
      const c = $('.bg-count', hud); if (c) c.textContent = run.mach + '/2';
      const bar = $('.bg-bar-stat', hud); if (bar) { $('i', bar).style.width = clamp(run.panic / startPanic(run), 0, 1) * 100 + '%'; $('b', bar).textContent = `Panic ${run.panic} / ${startPanic(run)}`; }
    };
    $$('[data-machine]', hud).forEach(b => b.onclick = () => {
      const i = +b.dataset.machine, type = machineType(run, i);
      (type === 'fish' ? fishGame : skillCheck)(hud, run, ok => {
        if (ok) { run.mach++; run.dvd += Math.round((10 + run.floor * 1.5) * rewardMult(run)); sfx('switch.wav', { vol: .6, force: true }); }
        else if (run.items.skill > 0) { run.items.skill--; UI.toast('SkillcheckCandy saved you.'); }
        else { Object.keys(run.hp).forEach(id => { if (run.hp[id] > 0) run.hp[id] = Math.max(.1, run.hp[id] - .07); }); sfx('error.mp3', { vol: .6, force: true }); }
        Save.write(); Screens.render();
      });
    });
    $('.bg-next', hud).onclick = () => {
      if (!done) { UI.toast('Two machines first.'); sfx('error.mp3', { vol: .35, force: true }); return; }
      clearTimer(); sfx('swoosh.wav', { vol: .6, force: true }); fightFloor();
    };
    timer = setInterval(() => {
      if (orphaned(hud)) return;
      if (done) return;
      if (run.panic > 0) { run.panic--; if (run.panic === 0) { run.panicked = true; sfx('HalloweenGhost.wav', { vol: .5, force: true }); } }
      refresh();
    }, 1000);
  }

  /* ---------------------------------------------------------------- free roam floors */
  // Every third floor (never a boss floor) is a room you walk around in, and it plays like a chase game. The addicteds
  // patrol with a field of view. If one spots you it stops for a beat ("?"), then runs you down ("!"). You can walk
  // away from one that hasn't seen you, outrun a chase by sprinting (stamina is the limit), break line of sight, or
  // hide in a locker. A heartbeat tells you one is near. If one catches you, you fight it. Beat it and it is gone.
  const NOTES = [
    'LOST: one key. If found return to Bosker. Reward: he has not decided',
    'The elevator holds 6 people. It has held 7. One of them was a pumpkin',
    'Please do not count the floors. Atoe already did and he is #### upset about it',
    'Menu: all candy is lemon. nothing else is lemon. ask at the desk',
    'A crayon drawing of a rainbow flower and a tv. It says my fun day!',
    'Taped to a pipe: SkillCheck is not a skill. Its a mood',
    'Scribbled on the wall: Fiin has not told a pun in 9 years. Day 3285',
    'Sign: please touch the grass. the grass is fake. touch it anyway',
    'Ticket stub: DVD. Admit one. Expires never. Nobody has been admitted',
    'Post-it: the face was here again. I cleaned it off. It came back. fine',
    'Taped inside the elevator: all furniture here is a free model. do not read the scripts',
    'NOW HIRING. Apply within. Within what is not clear'
  ];
  const isRoam = f => f % 3 === 0 && f % 5 !== 0;
  const roamCache = {};
  let roamKeys = null;
  const GROUND = { top: 56, bottom: 95 };
  const scaleAt = y => .6 + (y - GROUND.top) / (GROUND.bottom - GROUND.top) * .6;
  const wdist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.7);
  const ELEV = { x: 93, y: 74 };
  const WALK = 2.7, SPRINT = 4.3, CHASE = 2.9, PATROL = .9;

  function makeRoam(run) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spot = (x0 = 12, x1 = 82) => ({ x: rnd(x0, x1), y: rnd(GROUND.top + 5, GROUND.bottom - 3) });
    const st = state(), unseen = NOTES.map((_, i) => i).filter(i => !st.notes.includes(i));
    const picks = [{ kind: 'dvd' }, { kind: 'dvd' }, { kind: 'dvd' }, { kind: 'candy' }, { kind: unseen.length ? 'note' : 'dvd' }].map(p => Object.assign(p, spot(), { taken: false }));
    const ids = Object.keys(ADDICTED), n = run.floor >= 12 ? 3 : 2;
    const mobs = Array.from({ length: n }, () => { const m = Object.assign({ id: pick(ids), mode: 'patrol', face: -1, timer: 0, cool: 0, chaseT: 0, dead: false }, spot(55, 90)); m.wp = spot(); return m; });
    return { p: { x: 7, y: 76 }, face: 1, target: null, stamina: 100, tired: false, hidden: -1, grace: 20, fixed: [false, false], m: [spot(14, 40), spot(52, 78)], lockers: [spot(10, 30), spot(55, 85)], picks, mobs, warned: false };
  }

  // A twisted that catches you is a real fight; the one that caught you is gone if you win.
  function encounterFoes(run, mob) {
    const rng = seeded(`bg-enc:${run.seed}:${run.floor}:${mob.id}:${Math.floor(Math.random() * 1000)}`);
    const diff = DIFFS[run.diff] || DIFFS.medium;
    let lv = Math.round(diff.M(run.floor) * .9);
    if (run.diff === 'easy' || (run.diff !== 'hard' && run.floor < 10)) lv = Math.min(lv, Math.round(teamLevel(run) * 1.15 + 5));
    lv = clamp(Math.round(lv * .9), 3, 800);
    const pool = endlessTwistedPool(Math.max(1, run.floor * 6)).filter(id => !EVENT_ONLY_TWISTED.has(id) && !isCollab(id));
    const list = [];
    try { list.push(Depths.harden(makeTwisted(mob.id, lv, 'normal'), run.floor * 6, rng)); } catch (_) { list.push(Depths.harden(makeTwisted(rng.pick(pool), lv, 'normal'), run.floor * 6, rng)); }
    if (run.floor >= 6 && pool.length) list.push(Depths.harden(makeTwisted(rng.pick(pool.filter(id => id !== mob.id)), lv, 'normal'), run.floor * 6, rng));
    list.forEach(spec => { spec.name = 'Addicted ' + mangle(spec.name || HEROES[spec.id]?.name || spec.id); });
    return list;
  }

  function hudRoam(hud, run) {
    const key = run.seed + ':' + run.floor;
    const R = roamCache[key] || (roamCache[key] = makeRoam(run));
    const lead = run.team.find(id => run.hp[id] > 0) || run.team[0];
    const line = () => run.mach >= 2 ? 'The elevator is ready.' : run.panic > 0 ? `Panic in <span class="bg-t">${run.panic}</span> seconds.` : 'Panic! The addicteds noticed you.';
    hud.innerHTML = `${hudTop(run, line())}
      <div class="bg-roam" style="background-image:url(${ASSET + BASE}bg/${bgFile(run.floor)})" aria-label="Free roam">
        <div class="bg-ent bg-roam-door"><i>&gt;</i></div>
        ${R.lockers.map((l, i) => `<div class="bg-ent bg-roam-locker" data-l="${i}"><i></i></div>`).join('')}
        ${[0, 1].map(i => `<div class="bg-ent bg-roam-machine${R.fixed[i] ? ' done' : ''}" data-m="${i}"><img src="${img('ui/machine.png')}" alt=""><span>${R.fixed[i] ? 'fixed' : machineType(run, i) === 'fish' ? 'Fish tank' : 'SkillCheck'}</span></div>`).join('')}
        ${R.picks.map((p, i) => p.taken ? '' : `<div class="bg-ent bg-roam-pick" data-p="${i}">${p.kind === 'dvd' ? `<img src="${img('ui/icon-dvd.png')}" alt="">` : p.kind === 'candy' ? `<img src="${img('ui/item-speedcandy.png')}" alt="">` : '<i>?</i>'}</div>`).join('')}
        ${R.mobs.map((m, i) => m.dead ? '' : `<div class="bg-ent bg-roam-mob" data-mob="${i}"><img src="${img(ADDICTED[m.id].art)}" alt=""><b></b></div>`).join('')}
        <div class="bg-ent bg-roam-me"><img src="${artFor(lead)}" alt=""></div>
        <div class="bg-stick" aria-label="Move"><i></i></div>
        <button class="bg-run" type="button">Run</button>
        <button class="bg-prompt" type="button" hidden></button>
      </div>
      <div class="bg-stamina"><i></i><b>Stamina 100 / 100</b></div>
      <div class="bg-roam-hint">hold Run to sprint · hide in a locker · a heartbeat means one is near</div>
      ${hudBottom(run)}<div class="bg-pop" hidden></div><div class="bg-note" hidden></div>`;
    wireItems(hud, run);
    const box = $('.bg-roam', hud), prompt = $('.bg-prompt', hud), runBtn = $('.bg-run', hud), stick = $('.bg-stick', hud), knob = $('i', stick), stam = $('.bg-stamina', hud);
    const doorEl = $('.bg-roam-door', hud), meEl = $('.bg-roam-me', hud);
    const mEls = $$('.bg-roam-machine', hud), pEls = $$('.bg-roam-pick', hud), lEls = $$('.bg-roam-locker', hud);
    const mobEls = $$('.bg-roam-mob', hud), mobOf = e => R.mobs[+e.dataset.mob];
    const place = (e, o, h) => {
      if (!e) return;
      e.style.left = o.x + '%'; e.style.top = o.y + '%'; e.style.zIndex = Math.round(o.y * 10);
      const im = e.querySelector('img');
      if (im && h) { im.style.height = Math.round(h * scaleAt(o.y)) + 'px'; im.style.maxWidth = Math.round(h * scaleAt(o.y) * .9) + 'px'; im.style.objectFit = 'contain'; }
      const t = e.querySelector('i'); if (t && h && e.classList.contains('bg-roam-pick')) t.style.fontSize = Math.round(h * scaleAt(o.y) * .8) + 'px';
    };
    const layout = () => {
      const H = box.clientHeight || 320, base = H * .27;
      place(doorEl, ELEV); doorEl.style.height = Math.round(H * .4 * scaleAt(ELEV.y)) + 'px'; doorEl.style.width = Math.round(H * .2 * scaleAt(ELEV.y)) + 'px';
      lEls.forEach((e, i) => { place(e, R.lockers[i]); e.style.height = Math.round(H * .3 * scaleAt(R.lockers[i].y)) + 'px'; e.style.width = Math.round(H * .15 * scaleAt(R.lockers[i].y)) + 'px'; e.classList.toggle('in', R.hidden === i); });
      mEls.forEach((e, i) => place(e, R.m[i], H * .26));
      pEls.forEach(e => place(e, R.picks[+e.dataset.p], H * .09));
      mobEls.forEach(e => {
        const m = mobOf(e); place(e, m, base * .95);
        e.dataset.mode = m.mode; e.querySelector('b').textContent = m.mode === 'chase' ? '!' : m.mode === 'alert' ? '?' : '';
        const im = e.querySelector('img'); if (im) im.style.transform = `scaleX(${m.face > 0 ? -1 : 1})`;
      });
      place(meEl, R.p, base); meEl.classList.toggle('hiding', R.hidden >= 0);
      const mi = meEl.querySelector('img'); if (mi) mi.style.transform = `scaleX(${R.face})`;
    };

    /* controls */
    const keys = {}; let sv = { x: 0, y: 0 }, runHeld = false;
    if (roamKeys) { document.removeEventListener('keydown', roamKeys.kd); document.removeEventListener('keyup', roamKeys.ku); }
    const MOVE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
    roamKeys = {
      kd: e => {
        if (MOVE.includes(e.key)) { keys[e.key] = true; R.target = null; e.preventDefault(); }
        else if (e.key === 'Shift') keys.Shift = true;
        else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && R.act && R.act.fn) { e.preventDefault(); R.act.fn(); }
      },
      ku: e => { delete keys[e.key]; }
    };
    document.addEventListener('keydown', roamKeys.kd); document.addEventListener('keyup', roamKeys.ku);
    const stickMove = e => {
      const r = stick.getBoundingClientRect();
      let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      sv = { x: dx, y: dy }; knob.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`; R.target = null;
    };
    const stickEnd = () => { sv = { x: 0, y: 0 }; knob.style.transform = ''; };
    stick.onpointerdown = e => { try { stick.setPointerCapture(e.pointerId); } catch (_) { /* optional */ } stickMove(e); };
    stick.onpointermove = e => { if (e.buttons) stickMove(e); };
    stick.onpointerup = stick.onpointercancel = stickEnd;
    runBtn.onpointerdown = () => { runHeld = true; runBtn.classList.add('on'); };
    runBtn.onpointerup = runBtn.onpointerleave = runBtn.onpointercancel = () => { runHeld = false; runBtn.classList.remove('on'); };
    box.onclick = e => {
      if (e.target.closest('.bg-stick, .bg-run, .bg-prompt') || R.hidden >= 0) return;
      const r = box.getBoundingClientRect();
      R.target = { x: clamp((e.clientX - r.left) / r.width * 100, 3, 97), y: clamp((e.clientY - r.top) / r.height * 100, GROUND.top, GROUND.bottom) };
    };
    prompt.onclick = () => { if (R.act && R.act.fn) R.act.fn(); };

    /* actions */
    const syncBars = () => {
      $$('.bg-mate i', hud).forEach((b, i) => { b.style.width = Math.round(clamp(run.hp[run.team[i]], 0, 1) * 100) + '%'; });
      const heart = $$('.bg-stat b', hud)[1]; if (heart) heart.textContent = avgHp(run) + '%';
      const bar = $('.bg-bar-stat', hud); if (bar) { $('i', bar).style.width = clamp(run.panic / startPanic(run), 0, 1) * 100 + '%'; $('b', bar).textContent = `Panic ${run.panic} / ${startPanic(run)}`; }
      const l = $('.bg-line', hud); if (l) l.innerHTML = line();
      const c = $('.bg-count', hud); if (c) c.textContent = run.mach + '/2';
    };
    const stopRoam = () => { clearTimer(); document.removeEventListener('keydown', roamKeys.kd); document.removeEventListener('keyup', roamKeys.ku); };
    const finishMachine = (i, ok) => {
      if (ok) { R.fixed[i] = true; run.mach++; run.dvd += Math.round((10 + run.floor * 1.5) * rewardMult(run)); sfx('switch.wav', { vol: .6, force: true }); }
      else if (run.items.skill > 0) { run.items.skill--; UI.toast('SkillcheckCandy saved you.'); }
      else { Object.keys(run.hp).forEach(id => { if (run.hp[id] > 0) run.hp[id] = Math.max(.1, run.hp[id] - .07); }); sfx('error.mp3', { vol: .6, force: true }); }
      Save.write(); Screens.render();
    };
    const openMachine = i => { clearTimer(); (machineType(run, i) === 'fish' ? fishGame : skillCheck)(hud, run, ok => finishMachine(i, ok), () => Screens.render()); };
    const goElevator = () => { stopRoam(); sfx('swoosh.wav', { vol: .6, force: true }); fightFloor(); };
    const caught = m => {
      stopRoam(); sfx('error.mp3', { vol: .6, force: true }); UI.toast('Caught!');
      fightFloor({ foes: encounterFoes(run, m), onWin: () => { m.dead = true; R.grace = 30; R.hidden = -1; } });
    };
    const showNote = text => {
      clearTimer();
      const n = $('.bg-note', hud); n.hidden = false;
      n.innerHTML = `<b>A note</b><p>${text}</p><button class="bg-red" type="button">OK</button>`;
      $('button', n).onclick = () => { Screens.render(); };
    };

    layout();
    let tick = 0;
    timer = setInterval(() => {
      if (orphaned(hud)) return;
      tick++;
      if (run.mach < 2 && tick % 10 === 0) {
        if (run.panic > 0) { run.panic--; if (run.panic === 0) { run.panicked = true; sfx('HalloweenGhost.wav', { vol: .5, force: true }); } }
        syncBars();
      }
      if (R.grace > 0) R.grace--;

      /* the player */
      const hiding = R.hidden >= 0;
      let ix = hiding ? 0 : sv.x, iy = hiding ? 0 : sv.y;
      if (!hiding) {
        if (keys.ArrowLeft || keys.a) ix -= 1; if (keys.ArrowRight || keys.d) ix += 1; if (keys.ArrowUp || keys.w) iy -= 1; if (keys.ArrowDown || keys.s) iy += 1;
        if (!ix && !iy && R.target) {
          const dx = R.target.x - R.p.x, dy = R.target.y - R.p.y, d = Math.hypot(dx, dy * 1.7);
          if (d < 2.5) R.target = null; else { ix = dx / d; iy = dy / d * 1.7; }
        }
      }
      const mag = Math.hypot(ix, iy), moving = mag > .12;
      const sprint = (keys.Shift || runHeld) && moving && !R.tired && R.stamina > 0;
      if (moving) {
        const sp = sprint ? SPRINT : WALK, k = Math.min(1, mag) / (mag || 1);
        R.p.x += ix * k * sp; R.p.y += iy * k * sp * .6;
        if (Math.abs(ix) > .15) R.face = ix > 0 ? 1 : -1;
      }
      R.p.x = clamp(R.p.x, 3, 96); R.p.y = clamp(R.p.y, GROUND.top, GROUND.bottom);
      if (sprint) { R.stamina = Math.max(0, R.stamina - 2.4); if (R.stamina <= 0) R.tired = true; }
      else R.stamina = Math.min(100, R.stamina + (hiding ? 1.6 : moving ? .4 : 1.3));
      if (R.tired && R.stamina >= 30) R.tired = false;
      meEl.classList.toggle('walk', moving); meEl.classList.toggle('sprint', sprint);
      $('i', stam).style.width = R.stamina + '%'; $('b', stam).textContent = `Stamina ${Math.round(R.stamina)} / 100${R.tired ? ' · tired' : ''}`;

      /* the addicteds: patrol, spot you, chase, give up */
      const mul = (run.panic <= 0 ? .55 : 1) * (1 - .08 * cardStack(run, 'slower'));
      let near = 999, spotted = false;
      for (const m of R.mobs) {
        if (m.dead) continue;
        const d = wdist(R.p, m); near = Math.min(near, d);
        if (m.cool > 0) m.cool--;
        const front = (R.p.x - m.x) * m.face > -3;
        const sees = !hiding && R.grace <= 0 && m.cool <= 0 && (d < 8 || (front && d < 24) || (sprint && d < 15));
        const step = (to, sp) => { const dx = to.x - m.x, dy = to.y - m.y, dd = Math.hypot(dx, dy * 1.7) || 1; m.x += dx / dd * sp; m.y += dy / dd * 1.7 * .6 * sp; if (Math.abs(dx) > .4) m.face = dx > 0 ? 1 : -1; return dd; };
        if (m.mode === 'patrol') {
          if (step(m.wp, PATROL * mul) < 3) m.wp = { x: 8 + Math.random() * 82, y: GROUND.top + 4 + Math.random() * (GROUND.bottom - GROUND.top - 6) };
          if (sees) { m.mode = 'alert'; m.timer = 6; sfx('HalloweenGhost.wav', { vol: .35, rate: 1.6, force: true }); }
        } else if (m.mode === 'alert') {
          m.face = R.p.x > m.x ? 1 : -1; m.timer--;
          if (m.timer <= 0) { if (!hiding && d < 30) { m.mode = 'chase'; m.chaseT = 0; } else { m.mode = 'lost'; m.timer = 25; } }
        } else if (m.mode === 'chase') {
          m.chaseT++;
          if (hiding) { if (d > 9) { m.mode = 'lost'; m.timer = 30; m.cool = 50; } else step(R.p, PATROL * mul); }
          else step(R.p, CHASE * mul);
          if (d > 38 || m.chaseT > 90) { m.mode = 'lost'; m.timer = 25; m.cool = 50; }
          else spotted = true;
        } else { // lost: wander off for a moment before patrolling again
          if (step(m.wp, PATROL * .8 * mul) < 3) m.wp = { x: 8 + Math.random() * 82, y: GROUND.top + 4 + Math.random() * (GROUND.bottom - GROUND.top - 6) };
          if (--m.timer <= 0) m.mode = 'patrol';
        }
        m.x = clamp(m.x, 4, 92); m.y = clamp(m.y, GROUND.top + 2, GROUND.bottom);
        if (R.grace <= 0 && (d < (hiding ? 5 : 5.5))) { caught(m); return; }
      }
      box.classList.toggle('terror', near < 40); box.classList.toggle('terror2', near < 22); box.classList.toggle('seen', spotted);
      if (near < 34 && tick % Math.max(9, Math.round(near / 1.5)) === 0) sfx('bass.wav', { vol: .22, rate: .8, force: true });

      /* things lying around */
      for (let i = 0; i < R.picks.length && !hiding; i++) {
        const p = R.picks[i];
        if (p.taken || wdist(R.p, p) > 6) continue;
        p.taken = true; pEls[i]?.remove();
        if (p.kind === 'dvd') { run.dvd += Math.round((14 + run.floor) * rewardMult(run)); sfx('button.wav', { vol: .5, force: true }); Save.write(); const d = $('.bg-stat b', hud); if (d) d.textContent = run.dvd; }
        else if (p.kind === 'candy') { addItem(run, pick(Object.keys(ITEMS))); sfx('snap.wav', { vol: .5, force: true }); Save.write(); UI.toast('Found some candy.'); }
        else { const st = state(), left = NOTES.map((_, k) => k).filter(k => !st.notes.includes(k)); if (left.length) { const k = pick(left); st.notes.push(k); Save.write(); sfx('pageturn.wav', { vol: .6, force: true }); showNote(NOTES[k]); return; } }
      }

      /* what you can do from where you stand */
      const cands = [];
      if (hiding) cands.push({ d: 0, label: 'Leave the locker', fn: () => { R.hidden = -1; } });
      else {
        for (let i = 0; i < 2; i++) if (!R.fixed[i]) { const d = wdist(R.p, R.m[i]); if (d < 12) cands.push({ d, label: machineType(run, i) === 'fish' ? 'Fish tank' : 'SkillCheck', fn: () => openMachine(i) }); }
        R.lockers.forEach((l, i) => { const d = wdist(R.p, l); if (d < 9) cands.push({ d, label: 'Hide', fn: () => { if (R.mobs.some(m => !m.dead && m.mode === 'chase' && wdist(R.p, m) < 18)) { UI.toast('Too close, it will see you.'); return; } R.hidden = i; R.p.x = l.x; R.p.y = l.y; R.target = null; sfx('switch.wav', { vol: .4, force: true }); } }); });
        const de = wdist(R.p, ELEV);
        if (de < 13) cands.push({ d: de, label: run.mach >= 2 ? 'Elevator >' : `Fix the machines (${run.mach}/2)`, fn: run.mach >= 2 ? goElevator : null });
      }
      cands.sort((a, b) => a.d - b.d);
      const act = cands[0] || null; R.act = act;
      prompt.hidden = !act; if (act) { prompt.textContent = act.label; prompt.disabled = !act.fn; }
      doorEl.classList.toggle('ready', run.mach >= 2);
      layout();
    }, 100);
  }

  /* ---------------------------------------------------------------- Globe versions: their own trinkets, everything else follows the original */
  const copyTrinkets = () => { const st = state(); if (!st.copyTrinkets || typeof st.copyTrinkets !== 'object') st.copyTrinkets = {}; return st.copyTrinkets; };
  function copyCard(id, onChange) {
    const k = 'g:' + id, h = Save.hero(id), slots = copyTrinkets()[id] || (copyTrinkets()[id] = [null, null]);
    const card = el('article', 'bg-copy');
    if (skinned(id)) {
      card.classList.add('blocked');
      card.innerHTML = `<img src="${artFor(k)}" alt=""><div><b>${nameFor(k)}</b><small>${HEROES[id].name} is wearing the skin, so this version is away. Take the skin off to bring it back.</small></div>`;
      return card;
    }
    const taken = Save.equippedTrinketUids();
    const optionsFor = slot => {
      const other = slots[1 - slot];
      const free = Object.keys(Save.data.trinketInv).filter(u => TRINKETS[Save.data.trinketInv[u].id] && u !== other && (!taken.has(u) || slots[slot] === u));
      return `<option value="">empty</option>` + free.map(u => { const c = Save.data.trinketInv[u]; return `<option value="${u}"${slots[slot] === u ? ' selected' : ''}>${TRINKETS[c.id].name} · rank ${c.rank}</option>`; }).join('');
    };
    card.innerHTML = `<img src="${artFor(k)}" alt=""><div><b>${nameFor(k)}</b><small>mirrors ${HEROES[id].name} · level ${h.level} · ${h.stars} stars${Save.equippedBadges(id).length ? ' · same badge' : ''}</small>
      <label>Trinket 1 <select data-slot="0">${optionsFor(0)}</select></label><label>Trinket 2 <select data-slot="1">${optionsFor(1)}</select></label></div>`;
    $$('select', card).forEach(sel => sel.onchange = () => { slots[+sel.dataset.slot] = sel.value || null; Save.write(); sfx('button.wav', { vol: .4, force: true }); onChange(); });
    return card;
  }
  function tabSquad(main) {
    const ids = copiesUnlocked();
    main.innerHTML = `<div class="bg-panel"><h2>Globe versions</h2><p class="bg-small">They level up, rank up and wear the same badge as the toon they mirror. The trinkets are their own. A toon can wear its Globe skin or bring its Globe version, not both. They also show up under Heroes, in the team editor and in PvP.</p><div class="bg-copies"></div></div>`;
    const list = $('.bg-copies', main), ct = copyTrinkets();
    ids.forEach(id => list.appendChild(copyCard(id, () => Screens.render())));
    if (!ids.length) list.innerHTML = '<p class="bg-small">None yet. They join as the story introduces them.</p>';
  }
  // Trinkets a Globe version wears are not free for the original to wear as well.
  Save.equippedTrinketUids = function () {
    const set = new Set();
    Object.keys(this.data.heroes).forEach(hid => {
      const h = this.data.heroes[hid];
      if (this.owns(hid) && h && Array.isArray(h.trinkets)) h.trinkets.forEach(u => { if (u) set.add(u); });
    });
    const ct = (Raid.state().boskers || {}).copyTrinkets || {};
    Object.keys(ct).forEach(id => (ct[id] || []).forEach(u => { if (u) set.add(u); }));
    return set;
  };

  // SkillCheck: stop the needle in the green. It moves ten times a second.
  function skillCheck(hud, run, finish, cancel) {
    const box = $('.bg-pop', hud);
    const zone = Math.max(12, 28 - run.floor * 1.2), start = 20 + Math.random() * (60 - zone);
    box.hidden = false;
    box.innerHTML = `<div class="bg-skill-bar"><i class="bg-zone" style="left:${start}%;width:${zone}%"></i><i class="bg-needle"></i></div><div class="bg-pop-row"><button class="bg-red bg-hit" type="button">SkillCheck</button><button class="bg-red bg-exit" type="button">Exit</button></div>`;
    let pos = 0, dir = 1;
    const needle = $('.bg-needle', box), step = 3 + Math.min(5, run.floor * .4);
    const ticker = setInterval(() => { if (!box.isConnected) { clearInterval(ticker); return; } pos += dir * step; if (pos >= 100) { pos = 100; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; } needle.style.left = pos + '%'; }, 100);
    $('.bg-hit', box).onclick = () => { clearInterval(ticker); box.hidden = true; finish(pos >= start && pos <= start + zone); };
    $('.bg-exit', box).onclick = () => { clearInterval(ticker); box.hidden = true; if (cancel) cancel(); };
  }

  // The fish tank: tap Jump to keep the fish off the grass and out of the weeds.
  function fishGame(hud, run, finish, cancel) {
    const box = $('.bg-pop', hud), need = 3 + (run.floor > 6 ? 1 : 0);
    box.hidden = false;
    box.innerHTML = `<div class="bg-tank"><img class="bg-fish" src="${img('ui/fish.png')}" alt=""><div class="bg-weeds"></div><div class="bg-grass"></div><span class="bg-tank-msg">tap Jump to start · ${need} weeds to pass</span></div><div class="bg-pop-row"><button class="bg-red bg-jump" type="button">Jump</button><button class="bg-red bg-exit" type="button">Exit</button></div>`;
    const tank = $('.bg-tank', box), fish = $('.bg-fish', box), weedsEl = $('.bg-weeds', box), msg = $('.bg-tank-msg', box);
    let y = 38, vy = 0, started = false, passed = 0, ticks = 0; const weeds = [];
    const FX = 16, FW = 9, WW = 13;
    const place = () => { fish.style.top = y + '%'; };
    place();
    const stop = ok => { clearInterval(loop); document.removeEventListener('keydown', key); box.hidden = true; finish(ok); };
    const jump = () => { if (!started) { started = true; msg.textContent = ''; } vy = -6.2; sfx('snap.wav', { vol: .3, rate: 1.4 }); };
    const key = e => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    document.addEventListener('keydown', key);
    $('.bg-jump', box).onclick = jump; tank.onclick = jump;
    $('.bg-exit', box).onclick = () => { clearInterval(loop); document.removeEventListener('keydown', key); box.hidden = true; if (cancel) cancel(); };
    const loop = setInterval(() => {
      if (!box.isConnected) { clearInterval(loop); document.removeEventListener('keydown', key); return; }
      if (!started) return;
      ticks++; vy += 1; y += vy;
      if (y < 0) { y = 0; vy = 0; }
      if (ticks % 22 === 1) { const len = 30 + Math.random() * 30, e = el('img', 'bg-weed'); e.src = img('ui/weed.png'); e.style.height = len + '%'; e.style.width = WW + '%'; weedsEl.appendChild(e); weeds.push({ x: 104, len, e, passed: false }); }
      let crash = y > 86;
      weeds.forEach(w => {
        w.x -= 3.4; w.e.style.left = w.x + '%';
        if (w.x < FX + FW && w.x + WW > FX && y < w.len - 2) crash = true;
        if (!w.passed && w.x + WW < FX) { w.passed = true; passed++; msg.textContent = `${need - passed} to go`; }
      });
      place();
      if (crash) { sfx('error.mp3', { vol: .5, force: true }); stop(false); }
      else if (passed >= need) stop(true);
    }, 90);
  }

  /* ---------------------------------------------------------------- store: the Globe's toon menu */
  const faceItem = () => ({ id: 'face', name: 'The Face', art: 'ui/the-face.svg', cost: FACE_COST,
    voice: 'every 10s it heals whoever is hurt the most a little and gives them a short shield', also: 'it was in my soup', blurb: 'a trinket' });

  function tabStore(main) {
    const st = state();
    if (!complete()) {
      main.innerHTML = `<div class="bg-panel"><h2>Store</h2><div class="bg-closed"><img src="${img('art/bosker.png')}" alt=""><p>The skins are in the back room and I lost the key.. Its at the top floor I think. Sorry</p></div>
        <ul class="bg-check"><li class="${storyDone() ? 'ok' : ''}"><i>${storyDone() ? '✔' : '✖'}</i>chapters read: ${st.read.filter(i => i < STORE_CHAPTERS).length}/${STORE_CHAPTERS} (last one: clear floor ${STORY_REQ[STORE_CHAPTERS - 1]})</li></ul></div>`;
      return;
    }
    const ids = Object.keys(SKINS).filter(id => HEROES[id]).concat('face');
    if (!ids.includes(Screens._bgSel)) Screens._bgSel = ids[0];
    main.innerHTML = `<div class="bg-menu"><div class="bg-menu-grid"></div><aside class="bg-menu-detail"></aside></div>`;
    const grid = $('.bg-menu-grid', main), detail = $('.bg-menu-detail', main);
    ids.forEach(id => {
      const k = id === 'face' ? faceItem() : SKINS[id];
      const own = id === 'face' ? false : hasSkin(id), on = id === 'face' ? false : wearing(id);
      const t = el('button', 'bg-tile' + (id === Screens._bgSel ? ' sel' : ''));
      t.type = 'button';
      t.innerHTML = tileHtml(img(k.art), k.name, own ? `<i class="bg-own">${on ? '★' : '✔'}</i>` : '');
      t.onclick = () => { Screens._bgSel = id; sfx('button.wav', { vol: .35, force: true }); Screens.render(); };
      grid.appendChild(t);
    });
    renderDetail(detail, Screens._bgSel);
  }
  function renderDetail(box, id) {
    const face = id === 'face', k = face ? faceItem() : SKINS[id];
    const own = face ? false : hasSkin(id), on = face ? false : wearing(id), has = face ? true : Save.owns(id), dvd = state().dvd;
    box.innerHTML = `<div class="bg-prev bg-fx-${face ? 'hop' : k.fx}"><img src="${img(k.art)}" alt=""><i class="bg-fx-spark"></i></div>
      <div class="bg-detail-name">${k.name}</div>
      <div class="bg-detail-sub">${face ? 'Trinket' : `${HEROES[id].name} skin${own ? ' (owned)' : ''}`}</div>
      <div class="bg-desc"><b>${face ? 'Effect' : 'Active'}</b><p>${k.voice}</p></div>
      <div class="bg-desc"><b>${face ? 'Also' : 'Passive'}</b><p>${k.also}</p></div>
      <button class="bg-big bg-detail-act" type="button"></button>`;
    const btn = $('.bg-detail-act', box);
    if (!has) { btn.textContent = `Recruit ${HEROES[id].name} first`; btn.disabled = true; }
    else if (own) btn.textContent = on ? 'USE DEFAULT' : (GLOBE_JOIN[id] != null && state().read.includes(GLOBE_JOIN[id]) ? 'EQUIP · replaces the Globe version' : 'EQUIP');
    else { btn.textContent = `BUY · ${k.cost} DVD`; btn.disabled = dvd < k.cost; }
    btn.onclick = () => {
      const st = state();
      if (face) {
        if (st.dvd < FACE_COST || !Save.addTrinketCopy('the_face', 1)) return;
        st.dvd -= FACE_COST; Save.write(); sfx('snap.wav', { vol: .6, force: true }); UI.toast('The Face bought.'); Screens.render(); return;
      }
      if (!own) {
        if (st.dvd < k.cost) return;
        st.dvd -= k.cost; st.owned[id] = true; Save.write(); UI.toast(`${k.name} bought.`);
      } else { Save.hero(id).costume = on ? null : COSTUME; if (!on) dropCopy(id); Save.write(); }
      sfx(k.sound[0], { vol: k.sound[1], rate: k.sound[2], force: true });
      burst($('.bg-prev', box), k.glyph);
      setTimeout(() => Screens.render(), 420);
    };
    $('.bg-prev', box).onclick = () => { if (!face) sfx(k.sound[0], { vol: k.sound[1], rate: k.sound[2], force: true }); burst($('.bg-prev', box), face ? '☺' : k.glyph); };
  }
  function burst(host, glyph) {
    if (!host) return;
    for (let i = 0; i < 7; i++) {
      const p = el('span', 'bg-burst', glyph);
      p.style.setProperty('--x', (Math.random() * 120 - 60) + 'px'); p.style.setProperty('--y', (-30 - Math.random() * 80) + 'px'); p.style.left = 30 + Math.random() * 40 + '%';
      host.appendChild(p); setTimeout(() => p.remove(), 900);
    }
  }

  // Compact skin card: Dyle's shelf and the hero page.
  function skinCard(id, onChange) {
    const k = SKINS[id], own = hasSkin(id), on = wearing(id), has = Save.owns(id), open = complete();
    const card = el('article', 'bg-skin' + (own ? ' owned' : '') + (on ? ' on' : ''));
    card.innerHTML = `<div class="bg-prev bg-fx-${k.fx}"><img src="${img(k.art)}" alt="${k.name}"><i class="bg-fx-spark"></i></div>
      <div class="bg-skin-copy"><small>${HEROES[id].name} · skin</small><b>${k.name}</b><p>${k.blurb}</p><em>"${LINES[id][0]}"</em><button class="bg-big bg-skin-act" type="button"></button></div>`;
    const btn = $('.bg-skin-act', card);
    if (!has) { btn.textContent = 'Recruit ' + HEROES[id].name; btn.disabled = true; }
    else if (own) btn.textContent = on ? 'USE DEFAULT' : (GLOBE_JOIN[id] != null && state().read.includes(GLOBE_JOIN[id]) ? 'EQUIP · replaces the Globe version' : 'EQUIP');
    else if (!open) { btn.textContent = 'Store closed'; btn.disabled = true; }
    else { btn.textContent = `BUY · ${k.cost} DVD`; btn.disabled = state().dvd < k.cost; }
    btn.onclick = () => {
      const st = state();
      if (!own) { if (!open || st.dvd < k.cost) return; st.dvd -= k.cost; st.owned[id] = true; Save.write(); UI.toast(`${k.name} bought.`); }
      else { Save.hero(id).costume = on ? null : COSTUME; if (!on) dropCopy(id); Save.write(); }
      sfx(k.sound[0], { vol: k.sound[1], rate: k.sound[2], force: true });
      burst($('.bg-prev', card), k.glyph);
      setTimeout(onChange, 380);
    };
    $('.bg-prev', card).onclick = () => { sfx(k.sound[0], { vol: k.sound[1], rate: k.sound[2], force: true }); burst($('.bg-prev', card), k.glyph); };
    return card;
  }

  /* ---------------------------------------------------------------- the face */
  if (typeof defTrinket === 'function' && !TRINKETS.the_face) {
    defTrinket({ id: 'the_face', name: 'The Face', owner: 'Yatta', file: 'COSMO_Sweetcharm.png', eventOnly: true,
      desc: 'shows up every so often. nobody knows why. its fine.',
      stat: r => `+${(r * 2).toFixed(1)}% Max HP and +${(r * 1.2).toFixed(1)}% Crit`,
      effect: 'Every 10s the face smiles at the weakest ally, healing them a little and putting a short barrier on them.',
      apply(u, B, r) {
        u.flat.hpP = (u.flat.hpP || 0) + r * .02; u.flat.crit = (u.flat.crit || 0) + r * .012; u.dirty = true;
        B.every(u, 10, () => {
          const a = B.lowestHp(B.alliesOf(u)); if (!a) return;
          B.heal(u, a, u.st.mag * .12 * r, { silent: true });
          B.applyStatus(u, a, 'shield', 2.5, u.st.mag * (.25 + r * .03));
          B.fxFloatIcon(a.x, a.y - 80, '☺', '#ffffff');
        });
      } });
    TRINKET_IDS.push('the_face');
    const icon = trinketIcon;
    trinketIcon = function (id) { return id === 'the_face' ? ASSET + BASE + 'ui/the-face.svg' : icon.apply(this, arguments); };
  }
  if (typeof ST3_IMAGES !== 'undefined') ST3_IMAGES.bgFace = { src: BASE + 'ui/the-face.svg', cap: 'the face' };

  /* ---------------------------------------------------------------- hooks into the rest of the game */
  {
    const weekly = weeklyEvents;
    weeklyEvents = function (week) {
      return [{
        id: ID, label: "Bosker's Globe", kind: 'boskers', isBoskers: true, bossIds: [], featuredIds: Object.keys(SKINS).slice(0, 3),
        tag: 'ROBLOX · ROGUELITE', minMastery: 1, stageLevels: [1], rewardMult: 1,
        title: "Bosker's Globe: The Climb", blurb: 'Open the door, climb the floors, buy the skins.'
      }, ...weekly.call(this, week)];
    };
  }
  {
    const raid = Screens.raid;
    Screens.raid = function (s) {
      const result = raid.apply(this, arguments);
      const old = [...s.querySelectorAll('.eb')].find(b => b.querySelector('.eb-title')?.textContent === "Bosker's Globe: The Climb");
      if (old) {
        const st = state();
        const card = this.ebCard({
          kind: 'Roguelite · Skins', accent: '#4aa24f', title: "Bosker's Globe: The Climb", sub: "Climb floors, buy skins",
          art: ['Astro', 'Vee', 'Bassie'].map(id => ASSET + BASE + SKINS[id].art),
          status: st.run ? `Floor ${st.run.floor}` : complete() ? 'Store open' : `Chapter ${st.read.length} of ${STORY_COUNT}`, tone: complete() ? 'done' : 'ready',
          progress: Math.min(1, st.read.length / STORY_COUNT), cls: 'bg-event-card'
        });
        card.onclick = () => { sfx('switch.wav', { vol: .4, force: true }); Screens._raidDossier = ID; Screens._bgTab = Screens._bgTab || 'lobby'; Screens.render(); playMusic('bgAmbient'); };
        old.replaceWith(card);
      }
      return result;
    };
    const dossierFn = Screens.raidDossier;
    Screens.raidDossier = function (s, ev) { if (ev.isBoskers) { dossier(s); return; } return dossierFn.apply(this, arguments); };
  }
  {
    const renderSkins = DyleShop.renderSkins;
    DyleShop.renderSkins = function (contents, root, api) {
      renderSkins.apply(this, arguments);
      const wrap = el('section', 'bg-wrap bg-shelf');
      wrap.innerHTML = `<div class="bg-panel"><h2>Bosker's Globe skins</h2><p class="bg-small">${complete() ? 'Bought skins show up here. A worn skin changes that toon\'s battle lines.' : 'Locked until the store opens. It\'s under Events.'}</p><div class="bg-skin-grid"></div></div>`;
      const grid = $('.bg-skin-grid', wrap);
      Object.keys(SKINS).filter(id => HEROES[id]).forEach(id => grid.appendChild(skinCard(id, () => Screens.render())));
      contents.appendChild(wrap);
    };
  }
  {
    const extras = HeroPage.extrasTab;
    HeroPage.extrasTab = function (id) {
      const wrap = extras.apply(this, arguments);
      if (!SKINS[id]) return wrap;
      const holder = el('div', 'bg-wrap bg-hero-skin');
      holder.appendChild(skinCard(id, () => HeroPage.draw?.()));
      wrap.prepend(holder);
      return wrap;
    };
  }

  /* ---------------------------------------------------------------- Globe versions as heroes
     In lists a Globe version is a virtual hero "g:Astro". It follows the original (level, stars, rarity, badge, mods)
     and keeps only its own trinkets. In a fight it is the original's spec plus the Globe costume, which is what PvP
     defense snapshots already carry. */
  const copyOwned = id => copiesUnlocked().includes(id) && !skinned(id);
  const copyList = id => (((state().copyTrinkets || {})[id]) || []).filter(u => u && Save.data.trinketInv && Save.data.trinketInv[u]);
  const dropCopy = id => { if (Array.isArray(Save.data.team)) Save.data.team = Save.data.team.filter(k => k !== 'g:' + id); };
  Object.keys(SKINS).forEach(id => {
    if (!HEROES[id] || HEROES['g:' + id]) return;
    Object.defineProperty(HEROES, 'g:' + id, { configurable: true, enumerable: false, writable: true,
      value: Object.create(HEROES[id], { name: { value: SKINS[id].name, enumerable: true, writable: true, configurable: true } }) });
  });
  {
    const hero = Save.hero, owns = Save.owns, ownedIds = Save.ownedIds, write = Save.write;
    const trinketStore = id => { const ct = copyTrinkets(); if (!Array.isArray(ct[id])) ct[id] = [null, null]; while (ct[id].length < 2) ct[id].push(null); return ct[id]; };
    const withStore = (base, id) => Object.create(base, { trinkets: { value: trinketStore(id), writable: true, enumerable: true } });
    Save.hero = function (id) {
      if (isCopy(id)) {
        const base = hero.call(this, baseId(id));
        return base && copyOwned(baseId(id)) ? withStore(base, baseId(id)) : null;
      }
      const base = hero.apply(this, arguments);
      return base && typeof id === 'string' && HeroPage.globe === id ? withStore(base, id) : base;
    };
    Save.owns = function (id) { return isCopy(id) ? copyOwned(baseId(id)) : owns.apply(this, arguments); };
    let listing = 0;
    // Pickers and the Heroes list count Globe versions as heroes; everything that counts the collection does not.
    Save.ownedIds = function () {
      const ids = ownedIds.apply(this, arguments);
      return listing || document.querySelector('.tp.team-builder') ? ids.concat(copiesUnlocked().filter(id => !skinned(id)).map(id => 'g:' + id)) : ids;
    };
    const picker = UI.teamPicker;
    UI.teamPicker = function () { listing++; try { return picker.apply(this, arguments); } finally { listing--; } };
    const rosterFn = Screens.roster;
    Screens.roster = function (screen) {
      restoreTeam();
      listing++;
      try { rosterFn.apply(this, arguments); } finally { listing--; }
      const total = screen && screen.querySelector && screen.querySelector('.hero-roster-total strong');
      if (total) total.textContent = String(ownedIds.call(Save).length);
    };
    // The team is a list of ids, and the game strips ids it does not know when it loads. Remember the Globe versions.
    let teamRestored = false;
    function restoreTeam() {
      if (teamRestored || !Save.data || !Array.isArray(Save.data.team)) return;
      teamRestored = true;
      const want = state().teamKeys, cur = Save.data.team;
      if (!Array.isArray(want) || !want.some(isCopy) || cur.some(isCopy)) return;
      const base = want.filter(k => !isCopy(k));
      if (base.length !== cur.length || base.some((k, i) => cur[i] !== k)) return;
      Save.data.team = want.filter(k => Save.owns(k)).slice(0, 5);
    }
    Save.write = function () {
      if (teamRestored && Save.data && Array.isArray(Save.data.team)) {
        const st = state();
        if (Save.data.team.some(isCopy) || (st.teamKeys && st.teamKeys.some(isCopy))) st.teamKeys = Save.data.team.slice();
      }
      return write.apply(this, arguments);
    };
    ['go', 'render'].forEach(name => {
      const fn = Screens[name];
      if (typeof fn === 'function') Screens[name] = function () { restoreTeam(); return fn.apply(this, arguments); };
    });
    restoreTeam();
  }
  {
    const toBase = (obj, name) => {
      const fn = obj && obj[name];
      if (typeof fn !== 'function') return;
      obj[name] = function (id) { return isCopy(id) ? fn.apply(this, [baseId(id)].concat([].slice.call(arguments, 1))) : fn.apply(this, arguments); };
    };
    toBase(Progress, 'powerBreakdown'); toBase(Save, 'equippedBadges'); toBase(Mods, 'specFor');
    const ready = rosterUpgradeState;
    rosterUpgradeState = function (id) { return isCopy(id) ? [] : ready.apply(this, arguments); };
    const spec = playerSpec;
    playerSpec = function (id) {
      if (!isCopy(id)) return spec.apply(this, arguments);
      const s = spec.call(this, baseId(id));
      s.costume = COSTUME; s.globeCopy = true; s.trinkets = copyList(baseId(id));
      return s;
    };
    const specs = playerTeamSpecs;
    playerTeamSpecs = function (ids) { return specs.call(this, (ids || []).filter(k => !isCopy(k) || copyOwned(baseId(k)))); };
    // Experience, shards and achievements go to the original, once.
    const payout = payoutBattle;
    payoutBattle = function (teamIds) {
      const args = [].slice.call(arguments);
      if (Array.isArray(teamIds)) args[0] = [...new Set(teamIds.filter(Boolean).map(baseId))];
      return payout.apply(this, args);
    };
    const check = Arena.exhibitionCheck;
    Arena.exhibitionCheck = function (id, ids) { return check.call(this, id, [...new Set((ids || []).filter(Boolean).map(baseId))]); };
    const resolve = Arena.resolve;
    Arena.resolve = function () {
      const args = [].slice.call(arguments);
      if (Array.isArray(args[7])) args[7] = [...new Set(args[7].filter(Boolean).map(baseId))];
      return resolve.apply(this, args);
    };
    // Once the story is done, some of the Colosseum's rivals turn up as their Globe versions.
    const hash = text => { let h = 7; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0; return h; };
    const rivalSpecs = Arena.specs;
    Arena.specs = function (opp) {
      const out = rivalSpecs.apply(this, arguments);
      if (!opp || opp.saved || !complete() || !Array.isArray(out)) return out;
      out.forEach(sp => {
        if (sp && !sp.costume && SKINS[sp.id] && hash(String(opp.name) + '|' + String(opp.rank) + '|' + sp.id) % 100 < 30) { sp.costume = COSTUME; sp.artSrc = null; }
      });
      if (!Object.prototype.hasOwnProperty.call(opp, 'costumes')) Object.defineProperty(opp, 'costumes', { value: out.map(sp => (sp && sp.costume) || null), writable: true, configurable: true, enumerable: false });
      return out;
    };
  }
  // A Globe version's hero page is the original's page with the Globe's name and art. Nothing on it can be changed except the trinkets.
  HeroPage.globe = null;
  {
    const open = HeroPage.open, draw = HeroPage.draw, closePage = HeroPage.close;
    let watch = null;
    HeroPage.open = function (id, keepTab) {
      if (isCopy(id) && !copyOwned(baseId(id))) { HeroPage.globe = null; return; }
      HeroPage.globe = isCopy(id) ? baseId(id) : null;
      return open.call(this, isCopy(id) ? baseId(id) : id, keepTab);
    };
    HeroPage.close = function () { HeroPage.globe = null; return closePage.apply(this, arguments); };
    {
      const closeModal = UI.closeModal;
      UI.closeModal = function () {
        const result = closeModal.apply(this, arguments);
        // the trinket picker closes and redraws in one go; a real close leaves no hero page behind
        if (HeroPage.globe) setTimeout(() => { if (!document.querySelector('.hero-profile')) HeroPage.globe = null; }, 80);
        return result;
      };
    }
    const BLOCKED = ['levelUp', 'levelMax', 'starUp', 'rarityUp', 'skillUp', 'skillMaxAll', 'autoUpgrade', 'upgradeClass', 'upgradeClassMax',
      'upgradeSubclass', 'upgradeSubclassMax', 'setClass', 'setSubclass', 'prismTrainMax', 'spinPrism', 'prismKeep', 'prismDiscard', 'equipBadge', 'unequipBadge'];
    BLOCKED.forEach(name => {
      const fn = Progress[name];
      if (typeof fn !== 'function') return;
      Progress[name] = function (id) {
        if (HeroPage.globe && id === HeroPage.globe) { UI.toast(SKINS[id].name + ' follows ' + HEROES[id].name + '. Only trinkets can be changed here.'); return false; }
        return fn.apply(this, arguments);
      };
    });
    const swapName = (root, from, to) => {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.split(from).join(to);
    };
    const lock = (content, tab, why) => {
      const holder = content.querySelector('.bg-hero-skin'); if (holder) holder.remove();
      content.querySelectorAll('button').forEach(b => {
        if (b.dataset.bgLock) return;
        let locked = false;
        if (tab === 'growth') locked = true;
        else if (tab === 'skills') locked = /^(UPGRADE|[+][0-9]+|MAX)/.test(b.textContent.trim());
        else if (tab === 'extras' && !b.classList.contains('gear-panel-toggle')) {
          const panel = b.closest('.gear-panel'), title = panel && panel.querySelector(':scope > .gear-panel-toggle b');
          locked = !(title && title.textContent === 'Trinkets');
        }
        if (locked) { b.disabled = true; b.dataset.bgLock = '1'; b.title = why; }
      });
      content.querySelectorAll('.gear-panel').forEach(panel => {
        const title = panel.querySelector(':scope > .gear-panel-toggle b');
        if (!title || title.textContent !== 'Trinkets') panel.classList.add('bg-lockpanel');
      });
    };
    const dress = () => {
      if (watch) { watch.disconnect(); watch = null; }
      const base = HeroPage.globe, page = document.querySelector('.hero-profile'), content = document.querySelector('.hero-profile-content');
      if (!base || !page || !content) return;
      const from = HEROES[base].name, to = SKINS[base].name, key = 'g:' + base;
      const why = to + ' follows ' + from + '. Only trinkets can be changed here.';
      page.classList.add('bg-copy-page');
      swapName(page.querySelector('.hero-top-name'), from, to);
      swapName(page.querySelector('.hero-identity-copy'), from, to);
      const stage = page.querySelector('.hero-art-stage img');
      if (stage) { stage.src = artFor(key); stage.alt = to; }
      const copy = page.querySelector('.hero-identity-copy');
      if (copy && !copy.querySelector('.bg-copy-note')) copy.appendChild(el('p', 'bg-copy-note', 'GLOBE VERSION · mirrors ' + from + '. Only trinkets can be changed.'));
      swapName(page.querySelector('.hero-power-breakdown'), from, to);
      const toggle = page.querySelector('.hero-team-toggle');
      if (toggle) {
        toggle.textContent = (Save.data.team || []).includes(key) ? '✓ ON TEAM' : '+ ADD TO TEAM';
        toggle.onclick = () => {
          const team = (Save.data.team || []).filter(Boolean);
          if (team.includes(key)) team.splice(team.indexOf(key), 1);
          else if (team.length >= 5) { UI.toast('Team is full'); Sound.play('ui_err'); return; }
          else team.push(key);
          Save.data.team = team; Save.write(); Sound.play('hero_file_team', { vol: .46, throttle: 0 }); HeroPage.draw();
        };
      }
      const run = () => { lock(content, HeroPage.tab, why); swapName(content, from, to); };
      run();
      watch = new MutationObserver(() => { watch.disconnect(); run(); watch.observe(content, { childList: true, subtree: true }); });
      watch.observe(content, { childList: true, subtree: true });
    };
    HeroPage.draw = function () {
      if (HeroPage.globe && this._gearOpenPanel == null) this._gearOpenPanel = 'trinkets';
      const result = draw.apply(this, arguments);
      if (HeroPage.globe) dress();
      return result;
    };
  }
  // The Globe's art is drawn taller than the game's, in any fight.
  setInterval(() => { if (document.getElementById('unitLayer')) fitGlobeUnits(); }, 300);

  /* ---------------------------------------------------------------- skins change what a fight sounds like */
  {
    const COMBAT = /^(hit_|swing_|whoosh|impact|skill_hit|crit|beam|spell|magic|cast|dash|slash|punch|thud|boom|light_magic|heal|shield_cast|block|guard|miss|ult|steam|sparkle|buff|cleanse|explode|icebreak|shatter|curse|spectral|earth|wind_|toodles|qom_|ff7_)/;
    let quiet = 0, quietUntil = 0;
    const play = Sound.play;
    Sound.play = function (cue) {
      if ((quiet > 0 || Date.now() < quietUntil) && typeof cue === 'string' && COMBAT.test(cue)) return false;
      return play.apply(this, arguments);
    };
    const worn = u => u && u.costume === COSTUME && SKINS[u.id] && SKINS[u.id].pack;
    const lastAt = new WeakMap();
    const voice = (u, role) => {
      const now = Date.now();
      if (now - (lastAt.get(u) || 0) < 80) return;
      lastAt.set(u, now);
      const [file, vol, rate, max] = SKINS[u.id].pack[role];
      sfx(file, { vol, rate: rate * (.95 + Math.random() * .1), max, force: true });
    };
    const damage = Battle.prototype.damage;
    Battle.prototype.damage = function (src, tgt) {
      if (!worn(src)) return damage.apply(this, arguments);
      quiet++;
      try { return damage.apply(this, arguments); } finally { quiet--; voice(src, arguments[3] && arguments[3].basic ? 'attack' : 'hit'); }
    };
    const anim = Battle.prototype.anim;
    Battle.prototype.anim = function (u, kind) {
      if (worn(u) && (kind === 'cast' || kind === 'attack' || kind === 'wind')) {
        quietUntil = Date.now() + 300;
        voice(u, kind === 'cast' ? 'skill' : 'attack');
      }
      return anim.apply(this, arguments);
    };
  }

  window.Boskers = { ID, SKINS, LINES, state, complete, hasSkin, wearing, readStory, _roam: roamCache };
})();
