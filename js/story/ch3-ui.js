/* ch3-ui.js - Chapter 3 registrations that need the screen layer: speaker colours and
   voices for the visual novel, plus the new battle status chips. */
'use strict';

Object.assign(ST_COLORS, {
  Pebble: '#d9dde2', Brusha: '#ff9f6b', Squirm: '#b8d98a', Press: '#ff5a6e', Flower: '#ff9bff', Intercom: '#7fe3ff', Voice: '#9aa0b4'
});
ST3_IDS.forEach(id => { if (!ST_COLORS[id] && stChar(id)) ST_COLORS[id] = stChar(id).color; });

Object.assign(ST_VOICE, {
  Pebble: { cue: 'pebble_talk' }, Brusha: { tick: 'kh_blip', rate: 1.25 }, Squirm: { tick: 'kh_blip', rate: 1.1, vol: .35 }, Press: { tick: 'ui_move', rate: .45, vol: .5 },
  Flower: { tick: 'kh_blip', rate: 1.9 }
});

Object.assign(ST_STATUS_ICON, {
  silence: ['🔇', 'debuff', 'Silenced: no skills'], barrier: ['🪧', 'buff', 'Barrier: counts as a Tank']
});
