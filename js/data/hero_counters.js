/* hero_counters.js - tank counters for collab and event Heroes. These kits
   load after the main roster pass, so they get their own list here. The
   addCounter helper lives in hero_balance.js. */
'use strict';

const COUNTER_TUNES_EVENT = [
  { id: 'Sora',     key: 'W', rend: .02, note: 'Rends 2% of each target\'s Max HP.' },
  { id: 'Riku',     key: 'G', wound: 5, note: 'Wounds hit enemies for 5s, cutting their healing received by 40%.' },
  { id: 'Goofy',    key: 'G', breakShield: .3, note: 'Bashes 30% off any shield on enemies it hits.' },
  { id: 'QOMConnie', key: 'B', wound: 5, note: 'Wounds the possessed foe for 5s, cutting their healing received by 40%.' }
];
COUNTER_TUNES_EVENT.forEach(t => addCounter(HEROES[t.id], t));
