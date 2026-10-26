/* ch2-ui.js - Chapter 2 registrations that need the screen layer: Toon portraits,
   speaker colours and voices for the visual novel, and the extra battle status chips. */
'use strict';

Object.assign(ST_VN_ART, {
  Tisha: 'uploads/tishavnportrait.webp', Rodger: 'uploads/rodgervnportrait.webp', Dyle: 'uploads/dylevnportrait.webp',
  Scraps: 'uploads/scraps-vn.png', Rudie: 'uploads/rudievnportrait.webp', Coal: 'uploads/coalvnportrait.webp',
  Glisten: 'uploads/Glisten.png', Flutter: 'uploads/Fltuter.png', Ribecca: 'uploads/Ribecca.png'
});

ST_TOON_IDS.forEach(id => { if (!ST_COLORS[id]) ST_COLORS[id] = ST_TOONS[id].color; });
Object.assign(ST_COLORS, { Gigi: '#ffd1f0', Boxten: '#e0b57a', Poppy: '#ffb3e6', Toodles: '#ffcf6b', Shrimpo: '#ff9d7a', Finn: '#7fd0ff', Glisten: '#e6f2ff',
  Teagan: '#b9e6c2', Flutter: '#b6f0ee', Pebble: '#d9dde2', Bassie: '#ffc9e6', Eggson: '#f4e9c9', Bobette: '#ffb0b0', Gourdy: '#ffb347', Eclipse: '#c9c2ff',
  Soulvester: '#b6c2d4', Ribecca: '#e9e4d0', Ginger: '#e6a86b', Cocoa: '#c98a5a', Flyte: '#8fe0d8', Razzle: '#ff7fb0', Dazzle: '#7fe0ff', Looey: '#ffd36b',
  Yatta: '#a0ffa0', Blot: '#b8a6ff' });

Object.assign(ST_VOICE, {
  Tisha: { tick: 'kh_blip', rate: 1.2 }, Rodger: { tick: 'kh_blip', rate: .85 }, Dyle: { tick: 'kh_blip', rate: .7 }, Scraps: { tick: 'kh_blip', rate: 1.55 },
  Goob: { tick: 'kh_blip', rate: 1.05 }, Connie: { tick: 'kh_blip', rate: 1.65 }, Brightney: { tick: 'kh_blip', rate: 1.35 }, Cosmo: { tick: 'kh_blip', rate: 1.1 },
  Rudie: { tick: 'kh_blip', rate: 1.45 }, Coal: { tick: 'kh_blip', rate: .6 }, Gigi: { tick: 'kh_blip', rate: 1.6 }, Toodles: { tick: 'kh_blip', rate: 1.4 },
  Poppy: { tick: 'kh_blip', rate: 1.75 }, Teagan: { tick: 'kh_blip', rate: 1.15 }, Glisten: { tick: 'kh_blip', rate: 1.25 }, Finn: { tick: 'kh_blip', rate: 1.2 },
  Soulvester: { tick: 'kh_blip', rate: .6 }, Ribecca: { tick: 'kh_blip', rate: .9 }, Eclipse: { tick: 'kh_blip', rate: 1.0 }, Ginger: { tick: 'kh_blip', rate: 1.3 },
  Cocoa: { tick: 'kh_blip', rate: 1.5 }, Flyte: { tick: 'kh_blip', rate: 1.35 }, Gourdy: { tick: 'kh_blip', rate: 1.5 }, Bassie: { tick: 'kh_blip', rate: 1.4 },
  Eggson: { tick: 'kh_blip', rate: .7 }, Bobette: { tick: 'kh_blip', rate: 1.45 }, Razzle: { tick: 'kh_blip', rate: 1.3 }, Dazzle: { tick: 'kh_blip', rate: 1.5 },
  Looey: { tick: 'kh_blip', rate: .8 }, Yatta: { tick: 'kh_blip', rate: 1.35 }, Blot: { tick: 'kh_blip', rate: 1.6 }, Shrimpo: { tick: 'kh_blip', rate: 1.05 },
  Boxten: { tick: 'kh_blip', rate: 1.2 }
});
Object.assign(ST_STATUS_ICON, {
  rail: ['🚂', 'debuff', 'Rail Marker: Dyle hits it 30% harder'], fray: ['✂', 'debuff', 'Frayed: Defense down'], haunt: ['👻', 'debuff', 'Haunted: Connie hits it harder'],
  veil: ['◌', 'buff', 'Can’t be singled out'], dodge: ['≈', 'buff', 'Dodge up'], ward: ['▤', 'buff', 'Takes less damage'],
  research: ['🔎', 'debuff', 'Being researched'], exposed: ['❗', 'debuff', 'Exposed: next charge is interrupted']
});

/* Christmas floor tracks: Silent Night for the hideout and the epilogue, Carol of the Bells for the workshop fight. */
Object.assign(MUSIC_TRACKS, { stSilentNight: githubAsset('audio/silent-night.mp3'), stCarol: githubAsset('audio/carol-of-the-bells.mp3') });
Object.assign(ST_MUSIC, { silentnight: 'stSilentNight', carol: 'stCarol' });
