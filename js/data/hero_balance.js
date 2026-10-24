/* hero_balance.js - a light-touch roster pass applied after every authored
   Hero kit is loaded. It keeps the individual skill identities intact while
   smoothing cooldowns, strengthening the stat that each role is supposed to
   care about, and giving a carefully selected group a real multi-target hit. */
'use strict';

const ROSTER_AREA_TUNES = {
  Bassie: 'B', Boxten: 'G', Brightney: 'B', Brusha: 'B', Cocoa: 'B', Connie: 'B',
  Dyle: 'B', Eclipse: 'G', Ginger: 'B',
  Gourdy: 'B', Looey: 'B', Pebble: 'B', Poppy: 'B', Ribecca: 'B', Rodger: 'B', Shelly: 'B', Shrimpo: 'G',
  Toodles: 'B', Yatta: 'B'
};

/* This is the authored strength tier on HEROES[id].tier. It is intentionally
   separate from obtainment labels: getting a Hero from a different pool does
   not change combat power, while the actual kit tier does. */
/* Tiers stay mostly invisible in the UI, but they should still be felt when
   two similarly built Heroes are compared. The curve is intentionally gentle:
   kit, level, rarity, and player decisions still matter more than the label. */
const HERO_TIER_SKILL_MULT = { SS: 1.16, S: 1.08, A: 1.03, B: 1, C: .94, D: .88 };

function kitHasArea(skill) {
  const src = skill && skill.cast ? skill.cast.toString() : '';
  return /B\.aoe\s*\(|enemiesOf\(u\)\.forEach|enemiesOf\(u\)\.filter\([^\n]+\)\.forEach/.test(src);
}

function tuneSkill(skill, role, tier) {
  if (!skill || skill._rosterPass) return;
  skill._rosterPass = true;
  if (skill.cd) skill.cd = Math.max(5, Math.round(skill.cd * .94 * 10) / 10);
  if (!skill.v) return;
  const tierMult = HERO_TIER_SKILL_MULT[tier] || 1;
  const damage = /damage|attack/i.test(skill.type || '');
  if (damage && skill.v.ratio) skill.v.ratio = Math.round(skill.v.ratio * tierMult * (role === 'Damage' ? 1.055 : 1.035) * 1000) / 1000;
  if (role === 'Support') {
    ['heal', 'shield'].forEach(k => { if (skill.v[k]) skill.v[k] = Math.round(skill.v[k] * tierMult * 1.06 * 1000) / 1000; });
  }
  if (role === 'Control' && skill.v.ratio) skill.v.ratio = Math.round(skill.v.ratio * tierMult * 1.045 * 1000) / 1000;
}

function addAreaEcho(hero, key) {
  const skill = hero.skills && hero.skills[key];
  if (!skill || !skill.cast || !skill.v || skill._areaEcho || kitHasArea(skill)) return false;
  const original = skill.cast;
  const role = hero.role;
  skill._areaEcho = true;
  skill.cast = (u, B, S, P) => {
    original(u, B, S, P);
    B.after(.32, () => {
      const foes = B.enemiesOf(u).filter(e => e.alive);
      if (foes.length < 2) return;
      const anchor = foes.slice().sort((a, b) => B.distance(a, u) - B.distance(b, u))[0];
      const power = (S.ratio || .55) * (role === 'Damage' ? .34 : .27);
      const stat = /magic/i.test(skill.type || '') ? u.st.mag : u.st.atk;
      foes.filter(e => e !== anchor && B.distance(e, anchor) <= 285).forEach(e => {
        B.damage(u, e, stat * power, { type: /magic/i.test(skill.type || '') ? 'magic' : 'physical', area: true, tag: skill.name + ' splash' });
        if (role === 'Control') B.applyStatus(u, e, 'slow', 3);
        else if (role === 'Support') B.applyStatus(u, e, 'weaken', 3);
        else B.applyStatus(u, e, 'exposed', 3);
      });
    });
  };
  const note = ' Nearby enemies are also caught by the aftershock for a percentage of the hit.';
  if (typeof skill.desc === 'string') skill.desc += note;
  else if (typeof skill.desc === 'function') {
    const desc = skill.desc;
    skill.desc = (S, P) => desc(S, P) + note;
  }
  return true;
}

/* Every authored Hero gets the same small maintenance pass. The named area
   list is intentionally limited: existing wide attacks remain untouched and
   the new splash hits fill the single-target holes without turning every move
   into a screen clear. */
Object.values(HEROES).forEach(hero => {
  Object.values(hero.skills || {}).forEach(skill => tuneSkill(skill, hero.role, hero.tier));
  const key = ROSTER_AREA_TUNES[hero.id];
  if (key) addAreaEcho(hero, key);
});


/* Tank counters. A handful of Heroes get a rider on one skill that fits its
   moveset: Wound (-40% healing), Rend (a slice of the target's max HP, halved
   against bosses) or Shield Break (strips part of a shield). Each applies once
   per target per cast, so no single Hero can unravel a tank alone. */
const COUNTER_TUNES = [
  { id: 'Scraps',  key: 'G', rend: .025, note: 'Rends 2.5% of each target\'s Max HP.' },
  { id: 'Rudie',   key: 'G', wound: 5,   note: 'Wounds hit enemies for 5s, cutting their healing received by 40%.' },
  { id: 'Looey',   key: 'G', wound: 5,   note: 'Wounds hit enemies for 5s, cutting their healing received by 40%.' },
  { id: 'Boxten',  key: 'G', wound: 5,   note: 'Wounds hit enemies for 5s, cutting their healing received by 40%.' },
  { id: 'Shrimpo', key: 'W', rend: .03,  note: 'Rends 3% of each target\'s Max HP.' },
  { id: 'Toodles', key: 'G', wound: 4, rend: .015, note: 'Wounds hit enemies for 4s and Rends 1.5% of their Max HP.' },
  { id: 'Yatta',   key: 'W', breakShield: .4, note: 'Smashes 40% off any shield on enemies it hits.' },
  { id: 'Brusha',  key: 'W', breakShield: .35, wound: 4, note: 'Paints over enemy shields, removing 35% of them, and Wounds for 4s.' }
];

function addCounter(hero, tune) {
  const skill = hero && hero.skills && hero.skills[tune.key];
  if (!skill || !skill.cast || skill._counter) return;
  const original = skill.cast;
  skill._counter = true;
  skill.cast = (u, B, S, P) => {
    u._ctr = { until: B.t + 1.8, seen: new Set() };
    if (!u._ctrHooked) {
      u._ctrHooked = true;
      B.on(u, 'dealDamage', ev => {
        const w = u._ctr, t = ev && ev.target;
        if (!w || B.t > w.until || !t || !t.alive || t.team === u.team || ev.dot || ev.tag === 'Rend' || w.seen.has(t.uid)) return;
        w.seen.add(t.uid);
        if (tune.wound) B.applyStatus(u, t, 'wound', tune.wound);
        if (tune.breakShield && t.shields && t.shields.length) {
          t.shields.forEach(sh => { sh.amt *= 1 - tune.breakShield; });
        }
        if (tune.rend) B.damage(u, t, t.max.hp * tune.rend * (t.isBoss ? .5 : 1), { type: 'true', tag: 'Rend' });
      });
    }
    original(u, B, S, P);
  };
  const note = ' ' + tune.note;
  if (typeof skill.desc === 'string') skill.desc += note;
  else if (typeof skill.desc === 'function') {
    const desc = skill.desc;
    skill.desc = (S, P) => desc(S, P) + note;
  }
}

COUNTER_TUNES.forEach(t => addCounter(HEROES[t.id], t));
