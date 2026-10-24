/* ff7.js - Final Fantasy VII · Gold Saucer sequencing event.
   A fixed path of story stages and battle stages. Battles have an Easy and a
   Hard mode; story stages unlock the next battle. Only the visiting Toons
   and the FF7 cast may fight here (unowned party members join as loans).
   Monsters drop Materia Shards; battles pay Gil for the event shop. */
'use strict';

const FF7_TOONS = ['Dandy', 'Vee', 'Bassie', 'Bobette', 'Shelly', 'Gigi', 'Waxwell'];
const FF7_PARTY = [...FF7_TOONS, ...FF7_HERO_IDS];
const FF7_NAMES = { Tifa: 'Tifa', Cloud: 'Cloud', CaitSith: 'Cait Sith', Aerith: 'Aerith', Barret: 'Barret', Sephiroth: 'Sephiroth', Dandy: 'Dandy', Vee: 'Vee', Bassie: 'Bassie', Bobette: 'Bobette', Shelly: 'Shelly', Gigi: 'Gigi', Waxwell: 'Waxwell' };

/* w: [[id, count, kind?, name?], ...] per wave */
const FF7_NODES = [
  { type: 'story', scene: 's1' },
  { type: 'battle', id: 'b1', name: 'Station Bandits', bg: 'station', lv: 40, join: ['Cloud', 'Tifa'],
    easy: [[['FF7Bandit', 3]], [['FF7Bandit', 3], ['FF7Cactuar', 1]]],
    hard: [[['FF7Bandit', 4]], [['FF7Bandit', 3], ['FF7Cactuar', 2]], [['FF7Bandit', 1, 'boss', 'Bandit Lookout'], ['FF7Bandit', 3]]] },
  { type: 'story', scene: 's2' },
  { type: 'battle', id: 'b2', name: 'Wonder Square Jokers', bg: 'wonder', lv: 62, join: ['Aerith'], missing: ['Gigi'],
    easy: [[['FF7Joker', 3]], [['FF7Joker', 2], ['FF7Cactuar', 2]]],
    hard: [[['FF7Joker', 4]], [['FF7Joker', 3], ['FF7Cactuar', 2]], [['FF7Joker', 1, 'boss', 'Joker of Spades'], ['FF7Joker', 2], ['FF7Cactuar', 1]]] },
  { type: 'story', scene: 's3' },
  { type: 'battle', id: 'b3', name: 'Wonder Square Ambush', bg: 'wonder', lv: 85, join: ['CaitSith'], only: ['Gigi', 'CaitSith'], tune: { hp: .14, atk: .32 }, tuneHard: { hp: .07, atk: .19 },
    easy: [[['FF7Joker', 2]], [['FF7Joker', 1], ['FF7Cactuar', 1]]],
    hard: [[['FF7Joker', 2], ['FF7Cactuar', 1]], [['FF7Joker', 1, 'boss', 'Joker of Hearts'], ['FF7Cactuar', 2]]] },
  { type: 'story', scene: 's4' },
  { type: 'battle', id: 'b4', name: 'Ghost Hotel Basement', bg: 'ghost', lv: 115,
    easy: [[['FF7Joker', 2], ['FF7Beachplug', 1]], [['FF7DeathClaw', 1, 'elite', 'Basement Death Claw'], ['FF7Joker', 2]]],
    hard: [[['FF7Joker', 3], ['FF7Beachplug', 1]], [['FF7Beachplug', 2], ['FF7Joker', 2]], [['FF7DeathClaw', 1, 'boss', 'Basement Death Claw'], ['FF7Joker', 2], ['FF7Beachplug', 1]]] },
  { type: 'story', scene: 's5' },
  { type: 'battle', id: 'b5', name: 'Speed Square Stampede', bg: 'speed', lv: 150,
    easy: [[['FF7Cactuar', 3]], [['FF7Cactuar', 2], ['FF7Bandit', 2]]],
    hard: [[['FF7Cactuar', 4]], [['FF7Cactuar', 3], ['FF7Bandit', 2]], [['FF7Cactuar', 1, 'boss', 'Cactuar King'], ['FF7Cactuar', 2], ['FF7Bandit', 2]]] },
  { type: 'story', scene: 's6' },
  { type: 'battle', id: 'b6', name: 'Arena Death Claws', bg: 'battle', lv: 190,
    easy: [[['FF7DeathClaw', 2], ['FF7Bandit', 1]], [['FF7DeathClaw', 2], ['FF7Beachplug', 1]]],
    hard: [[['FF7DeathClaw', 2], ['FF7Bandit', 2]], [['FF7DeathClaw', 2], ['FF7Beachplug', 2]], [['FF7DeathClaw', 1, 'boss', 'Arena Champion'], ['FF7DeathClaw', 2], ['FF7Beachplug', 1]]] },
  { type: 'story', scene: 's7' },
  { type: 'battle', id: 'b7', name: 'Desert Raiders', bg: 'outside', lv: 235,
    easy: [[['FF7Bandit', 3], ['FF7Beachplug', 1]], [['FF7Beachplug', 2], ['FF7Bandit', 2]]],
    hard: [[['FF7Bandit', 4], ['FF7Beachplug', 1]], [['FF7Beachplug', 3], ['FF7Bandit', 2]], [['FF7Bandit', 1, 'boss', 'Sand Raider Captain'], ['FF7Beachplug', 2], ['FF7Bandit', 2]]] },
  { type: 'story', scene: 's8' },
  { type: 'battle', id: 'b8', name: 'The Death Claw Nest', bg: 'outside', lv: 285,
    easy: [[['FF7DeathClaw', 2], ['FF7Cactuar', 1]], [['FF7DeathClaw', 3], ['FF7Beachplug', 1]]],
    hard: [[['FF7DeathClaw', 3], ['FF7Cactuar', 1]], [['FF7DeathClaw', 2], ['FF7Cactuar', 2], ['FF7Beachplug', 1]], [['FF7DeathClaw', 1, 'boss', 'Nest Mother'], ['FF7DeathClaw', 2], ['FF7Cactuar', 2]]] },
  { type: 'story', scene: 's9' },
  { type: 'battle', id: 'b9', name: 'Bandit Camp', bg: 'outside', lv: 340, final: true,
    easy: [[['FF7Bandit', 3], ['FF7Joker', 1]], [['FF7DeathClaw', 2], ['FF7Beachplug', 2]], [['FF7Bandit', 1, 'boss', 'Bandit Boss'], ['FF7Joker', 1, 'elite', 'Royal Joker'], ['FF7Bandit', 2]]],
    hard: [[['FF7Bandit', 4], ['FF7Joker', 2]], [['FF7DeathClaw', 2], ['FF7Beachplug', 2], ['FF7Cactuar', 1]], [['FF7Bandit', 1, 'boss', 'Bandit Boss'], ['FF7Joker', 1, 'boss', 'Royal Joker'], ['FF7DeathClaw', 1, 'elite', 'Leashed Death Claw'], ['FF7Bandit', 2]]] },
  { type: 'story', scene: 's10' },
  { type: 'story', scene: 's11', join: ['Waxwell'] },
  { type: 'battle', id: 'b10', name: 'Service Trench', bg: 'outside', lv: 365, join: ['Waxwell'],
    easy: [[['FF7Grangalan', 2]], [['FF7Grangalan', 3], ['FF7Bullmoter', 1]]],
    hard: [[['FF7Grangalan', 3]], [['FF7Grangalan', 2], ['FF7Bullmoter', 2]], [['FF7Grangalan', 1, 'boss', 'Trench Grangalan'], ['FF7Grangalan', 2], ['FF7Bullmoter', 1]]] },
  { type: 'story', scene: 's12', join: ['Barret'] },
  { type: 'battle', id: 'b11', name: 'Rail Line', bg: 'outside', lv: 385, join: ['Barret'],
    easy: [[['FF7Bullmoter', 2]], [['FF7Bullmoter', 2], ['FF7Grangalan', 2]]],
    hard: [[['FF7Bullmoter', 3]], [['FF7Bullmoter', 2], ['FF7Grangalan', 3]], [['FF7Bullmoter', 1, 'boss', 'Rail Bullmoter'], ['FF7Bullmoter', 2], ['FF7Grangalan', 1]]] },
  { type: 'story', scene: 's13' },
  { type: 'battle', id: 'b12', name: 'Sephiroth', bg: 'outside', lv: 410, final: true, rewardHero: 'Sephiroth', tune: { hp: .28, atk: .55 }, tuneHard: { hp: .20, atk: .42 },
    easy: [[['FF7Grangalan', 2], ['FF7Bullmoter', 1]], [['Sephiroth', 1, 'boss', 'Sephiroth']]],
    hard: [[['FF7Grangalan', 2], ['FF7Bullmoter', 2]], [['FF7Bullmoter', 2], ['FF7Grangalan', 2]], [['Sephiroth', 1, 'boss', 'Sephiroth'], ['FF7Bullmoter', 1]]] },
  { type: 'story', scene: 's14' }
];

const FF7_EVENT = {
  id: 'ff7-gold-saucer', title: 'Final Fantasy VII · Gold Saucer', label: 'FINAL FANTASY VII', kind: 'ff7', isFF7: true,
  bossIds: [], featuredIds: FF7_HERO_IDS, tag: 'FFVII COLLAB · SEQUENCE', minMastery: 20, rewardMult: 1.4,
  stageLevels: FF7_NODES.map((n, i) => n.lv || (FF7_NODES[i + 1] && FF7_NODES[i + 1].lv) || 340),
  blurb: 'Follow Barret’s trail through Corel Prison. Waxwell has been using the gold door, and Sephiroth has found it too.'
};

/* Monster stat multipliers. Hard is meant to beat an unprepared team. */
const FF7_TUNE = {
  easy: { foe: { hp: 9, atk: 3.2, def: 1.4 }, elite: { hp: 15, atk: 3.5, def: 1.5 }, boss: { hp: 18, atk: 3.7, def: 1.55 }, wave: .12 },
  hard: { foe: { hp: 14, atk: 4.0, def: 1.6 }, elite: { hp: 20, atk: 4.3, def: 1.7 }, boss: { hp: 26, atk: 4.6, def: 1.75 }, wave: .16 }
};
const FF7_SCALE = { easy: { hp: 4.5, atk: 2 }, hard: { hp: 5.5, atk: 2.3 } };
function ff7Mult(kind, hard, w, node) {
  const mode = hard ? 'hard' : 'easy', t = FF7_TUNE[mode], m = t[kind], g = 1 + w * t.wave;
  const k = FF7_SCALE[mode], nt = (node && (hard && node.tuneHard || node.tune)) || { hp: 1, atk: 1 };
  const hp = m.hp * g * k.hp * nt.hp, atk = m.atk * g * k.atk * nt.atk;
  return { hp, atk, mag: atk, def: m.def, mdef: m.def };
}

const FF7_SHOP = [
  { id: 'Tifa', cost: 18, amount: 10 }, { id: 'Cloud', cost: 16, amount: 10 },
  { id: 'CaitSith', cost: 20, amount: 10 }, { id: 'Aerith', cost: 9, amount: 10 },
  { id: 'Barret', cost: 9, amount: 10 }, { id: 'Sephiroth', cost: 16, amount: 10 }
];
const FF7_EXTRA_MATERIA_DROPS = { FF7Grangalan: 'ff7_gravity', FF7Bullmoter: 'ff7_bigguard' };

const FF7Event = {
  event: FF7_EVENT,
  nodes: FF7_NODES,
  state() {
    const r = Raid.state();
    if (!r.ff7) r.ff7 = { gil: 0, shards: {}, cleared: {}, seen: {}, materiaMade: 0 };
    const s = r.ff7;
    s.gil = Math.max(0, Math.floor(Number(s.gil) || 0));
    if (!s.shards) s.shards = {}; if (!s.cleared) s.cleared = {}; if (!s.seen) s.seen = {};
    return s;
  },
  nodeDone(i) {
    const n = FF7_NODES[i], c = this.state().cleared[i];
    return !!(n && c && (n.type === 'story' ? c.story : (c.easy || c.hard)));
  },
  unlocked(i) { return i === 0 || (i > 0 && i < FF7_NODES.length && this.nodeDone(i - 1)); },
  current() { for (let i = 0; i < FF7_NODES.length; i++) if (!this.nodeDone(i)) return i; return FF7_NODES.length - 1; },
  markDone(i, mode) {
    const s = this.state();
    s.cleared[i] = Object.assign({}, s.cleared[i], { [mode]: true });
    if (Raid.stageUnlocked(FF7_EVENT.id, i)) Raid.recordClear(FF7_EVENT.id, i);
    Save.write();
  },
  /* Who has joined the party by the time this node is played. */
  joined(i) {
    const out = new Set();
    FF7_NODES.slice(0, i + 1).forEach(n => (n.join || []).forEach(id => out.add(id)));
    return out;
  },
  roster(i) {
    const n = FF7_NODES[i];
    if (n.only) return n.only.slice();
    const joined = this.joined(i);
    return FF7_PARTY.filter(id => ((FF7_TOONS.includes(id) && id !== 'Waxwell') || joined.has(id)) && !(n.missing || []).includes(id));
  },
  level(n, mode) { return mode === 'hard' ? Math.round(n.lv * 1.3 + 25) : n.lv; },
  spec(id, level, loanOnly) {
    if (Save.owns(id) && !loanOnly) {
      const s = playerSpec(id);
      // Owned heroes keep their build but never fall far behind the story.
      if (s.level < level * .8) Object.assign(s, { level: Math.round(level * .8), assisted: true });
      return s;
    }
    return { id, level, rarity: 5, rarityPlus: 1, stars: 3, skillLv: Math.max(1, Math.round(level * .8)), temporary: true, trinkets: [], artSrc: Art.hero(id) };
  },
  team(i, ids, mode) {
    const n = FF7_NODES[i], lvl = this.level(n, mode);
    return ids.filter(id => this.roster(i).includes(id)).slice(0, 5).map(id => this.spec(id, lvl));
  },
  wave(n, mode, w) {
    const level = this.level(n, mode), hard = mode === 'hard', list = (hard ? n.hard : n.easy)[w];
    const foes = [];
    list.forEach(([id, count, kind, name]) => {
      for (let k = 0; k < count; k++) {
        const boss = kind === 'boss', elite = kind === 'elite';
        foes.push({
          id, level, name, kind: boss ? 'boss' : undefined, elite,
          rarity: hard ? 5 : 4, rarityPlus: hard ? 10 : 4, stars: hard ? 5 : 4, skillLv: level,
          twisted: false, encounterOnly: true, artSrc: Art.hero(id), formationLine: (foes.length % 2),
          mult: ff7Mult(boss ? 'boss' : elite ? 'elite' : 'foe', hard, w, n)
        });
      }
    });
    return Raid.equipWave(foes, FF7_EVENT.id + ':' + mode, w + 1, level);
  },
  waves(n, mode) { return (mode === 'hard' ? n.hard : n.easy).length; },
  meta(n, mode, w, i) {
    const hard = mode === 'hard', last = w === this.waves(n, mode) - 1;
    return {
      title: `${n.name} · ${hard ? 'Hard' : 'Easy'} · Wave ${w + 1}/${this.waves(n, mode)}`,
      floorLabel: `FFVII · ${n.name}`, roomIdx: w + 1, roomTotal: this.waves(n, mode),
      bg: ASSET + 'assets/ff7/bg/' + n.bg + '.png', mods: [hard ? 'ff7_hard' : 'ff7_easy'],
      timeLimit: last ? 210 : 170, ff7: true,
      enemySkillStartEnergy: hard ? 45 + w * 10 : 15, enemySkillTempo: hard ? 1.3 + w * .08 : 1.0, enemySkillCdr: hard ? .12 : 0,
      survivedLabel: `Wave ${w + 1}`, encounteredLabel: last && (n.final || hard) ? `${n.name}!` : null
    };
  },
  gilReward(n, mode, first) {
    const base = Math.round(60 + n.lv * .9);
    return Math.round(base * (mode === 'hard' ? 2.1 : 1) * (first ? 1.6 : 1));
  },
  /* Materia Shards from every defeated enemy, more on Hard and from bosses. */
  shardDrops(battles, mode) {
    const out = {};
    battles.forEach(b => (b && b.units || []).forEach(u => {
      if (u.team === TEAM_P || u.alive || u.minion || (!FF7_ENEMY_IDS.includes(u.id) && u.id !== 'Sephiroth')) return;
      const m = FF7_MATERIA.find(x => x.from === u.id || x.id === FF7_EXTRA_MATERIA_DROPS[u.id]);
      const n = (mode === 'hard' ? 2 : 1) + (u.isBoss ? 3 : u.isElite ? 1 : 0) + (chance(.25) ? 1 : 0);
      if (m) out[m.id] = (out[m.id] || 0) + n;
      if (u.isBoss || u.isElite) out.ff7_phoenix = (out.ff7_phoenix || 0) + (u.isBoss ? (mode === 'hard' ? 4 : 2) : 1);
    }));
    return out;
  },
  grant(drops) { const s = this.state(); Object.entries(drops).forEach(([k, v]) => { s.shards[k] = (s.shards[k] || 0) + v; }); },
  craft(id) {
    const s = this.state();
    if ((s.shards[id] || 0) < FF7_SHARD_COST) return { ok: false, reason: 'Not enough shards.' };
    s.shards[id] -= FF7_SHARD_COST; s.materiaMade++;
    const result = Save.addTrinketCopy(id, 1);
    Save.write();
    return { ok: true, result };
  },
  buy(id) {
    const o = FF7_SHOP.find(x => x.id === id), s = this.state();
    if (!o) return { ok: false, reason: 'Sold out.' };
    const h = Save.hero(id); if (h && h.stars >= 5) return { ok: false, reason: 'Already at max stars.' };
    const cost = o.cost * o.amount;
    if (s.gil < cost) return { ok: false, reason: 'Not enough Gil.' };
    s.gil -= cost; const res = Save.giveShards(id, o.amount);
    Save.write();
    return { ok: true, res };
  },
  storyReward(i) {
    const s = this.state();
    if (s.cleared[i] && s.cleared[i].story) return null;
    const gil = 80 + i * 20;
    s.gil += gil;
    return { gil };
  },
  firstClearShards(n) {
    // Each new ally's battle pays a starter bundle of that hero's shards.
    const join = [...(n.join || []).filter(id => FF7_HERO_IDS.includes(id)), ...(n.rewardHero ? [n.rewardHero] : [])];
    return join.map(id => ({ id, amount: id === 'Aerith' ? 40 : 30 }));
  }
};

/* Easy keeps the tutorial feel; Hard turns the monsters loose. */
EVENT_MODIFIERS.push(
  { id: 'ff7_easy', kind: 'buff', icon: '🟢', name: 'Easy Mode', desc: 'Heroes gain 10% Energy generation.',
    apply: B => B.playerTeam().forEach(u => { u.flat.energyGen79 = .10; u.dirty = true; }) },
  { id: 'ff7_hard', kind: 'debuff', icon: '🔴', name: 'Hard Mode', desc: 'Monsters use their full move lists, resist control, and hit harder. Heroes receive 15% less healing.',
    apply: B => {
      B.foeTeam().forEach(u => { u._ff7Hard = true; u.flat.ccRes79 = .18; u.flat.cdr79 = .10; u.dirty = true; });
      B.playerTeam().forEach(u => { u.flat.healRecv79 = -.15; u.dirty = true; });
    } }
);

/* Join the weekly event board and the collab tables. */
{
  const baseWeekly = weeklyEvents;
  // eslint-disable-next-line no-global-assign
  weeklyEvents = function (week) { return [FF7_EVENT, ...baseWeekly(week)]; };
  FF7_HERO_IDS.forEach(id => { HERO_OBTAIN[id] = 'Collab'; COLLAB_HERO_IDS.add(id); });
  const baseEventOf = eventOf;
  // eslint-disable-next-line no-global-assign
  eventOf = function (id) { return FF7_HERO_IDS.includes(id) ? { name: 'Final Fantasy VII', icon: '💎', color: '#7fb6ff', collab: true } : baseEventOf(id); };
  MUSIC_TRACKS.ff7Menu = ASSET + 'assets/ff7/audio/goldsaucer.ogg';
  MUSIC_TRACKS.ff7Cait = ASSET + 'assets/ff7/audio/caitsith.ogg';
  MUSIC_TRACKS.ff7Battle = ASSET + 'assets/ff7/audio/battle.mp3';
  MUSIC_TRACKS.ff7Boss = ASSET + 'assets/ff7/audio/boss.mp3';
  MUSIC_TRACK_TRIMS.ff7Boss = .75;
  MUSIC_TRACKS.ff7Victory = ASSET + 'assets/ff7/audio/victory.mp3';
  MUSIC_TRACK_TRIMS.ff7Victory = .8;
  MUSIC_TRACKS.ff7Drama = MUSIC_TRACKS.navigationLockedAway;
  MUSIC_TRACK_TRIMS.ff7Menu = .8; MUSIC_TRACK_TRIMS.ff7Cait = .8; MUSIC_TRACK_TRIMS.ff7Battle = .75;
}
