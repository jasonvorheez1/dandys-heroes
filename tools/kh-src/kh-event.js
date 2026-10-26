/* kh-event.js - Kingdom Hearts · Halloween Town.
   A fixed path of story scenes and Heartless battles. Every battle has an
   Easy and a Hard mode; story scenes unlock the next fight. Only the Toons
   and the Kingdom Hearts cast fight here (unowned friends join as loans).
   Battles pay Munny for the event shop. The Heartless are tuned harder than
   the Gold Saucer monsters. */
'use strict';

const KH_TOONS = ['Eclipse', 'Vee', 'Bassie', 'Bobette', 'Shelly'];
const KH_CORE = ['Sora', 'Donald', 'Goofy'];
const KH_PARTY = [...KH_CORE, ...KH_TOONS, 'JackSkellington', 'LockShockBarrel', 'OogieBoogie', 'Dandy'];
const KH_BG = {
  gardenview: 'Stagebackgrounds/maps/library-floor.png', greenhouse: 'Stagebackgrounds/maps/greenhouse.png',
  town: 'assets/kh/bg/ht-scarecrow.jpg', square: 'assets/kh/bg/ht-square.jpg', lair: 'assets/kh/bg/ht-chamber.jpg', hill: 'assets/kh/bg/hill.png', casino: 'assets/kh/bg/lair.png', wood: 'uploads/hundredacrewoodsbg.jpg'
};

/* w: [[id, count, kind?, name?], ...] per wave */
const KH_NODES = [
  { type: 'story', scene: 'k1' },
  { type: 'battle', id: 'b1', name: 'Gardenview Halls', bg: 'gardenview', lv: 45, music: 'khGardenBattle',
    easy: [[['KHShadow', 3]], [['KHShadow', 2], ['KHSoldier', 2]]],
    hard: [[['KHShadow', 4]], [['KHShadow', 3], ['KHSoldier', 2]], [['KHSoldier', 1, 'boss', 'Drill Sergeant'], ['KHShadow', 3]]] },
  { type: 'story', scene: 'k2' },
  { type: 'battle', id: 'b2', name: 'Halloween Square', bg: 'square', lv: 75,
    easy: [[['KHShadow', 3], ['KHSoldier', 1]], [['KHSoldier', 3], ['KHGigasShadow', 1]]],
    hard: [[['KHShadow', 4], ['KHSoldier', 2]], [['KHSoldier', 3], ['KHGigasShadow', 1]], [['KHGigasShadow', 1, 'boss', 'Gigas Alpha'], ['KHSoldier', 2], ['KHShadow', 2]]] },
  { type: 'story', scene: 'k3', join: KH_TOONS },
  { type: 'battle', id: 'b3', name: 'The Pumpkin Patch', bg: 'town', lv: 105,
    easy: [[['KHSoldier', 2], ['KHStealthSoldier', 1]], [['KHShadow', 3], ['KHStealthSoldier', 2]]],
    hard: [[['KHSoldier', 3], ['KHStealthSoldier', 2]], [['KHShadow', 3], ['KHStealthSoldier', 2], ['KHGigasShadow', 1]], [['KHStealthSoldier', 1, 'boss', 'Phantom Soldier'], ['KHSoldier', 2], ['KHShadow', 3]]] },
  { type: 'story', scene: 'k4', join: ['JackSkellington'] },
  { type: 'battle', id: 'b4', name: 'Spiral Hill', bg: 'hill', lv: 140, join: ['JackSkellington'],
    easy: [[['KHRedNocturne', 2], ['KHShadow', 2]], [['KHRedNocturne', 1], ['KHStealthSoldier', 2], ['KHGigasShadow', 1]]],
    hard: [[['KHRedNocturne', 2], ['KHShadow', 3]], [['KHRedNocturne', 2], ['KHStealthSoldier', 2], ['KHGigasShadow', 1]], [['KHRedNocturne', 1, 'boss', 'Crimson Nocturne'], ['KHRedNocturne', 1], ['KHSoldier', 3]]] },
  { type: 'story', scene: 'k5', join: ['LockShockBarrel'] },
  { type: 'battle', id: 'b5', name: 'Oogie’s Gate', bg: 'lair', lv: 190, join: ['LockShockBarrel'],
    easy: [[['KHLargeBody', 1], ['KHSoldier', 2]], [['KHLargeBody', 1], ['KHRedNocturne', 1], ['KHStealthSoldier', 1]]],
    hard: [[['KHLargeBody', 1], ['KHSoldier', 3]], [['KHLargeBody', 2], ['KHRedNocturne', 1]], [['KHLargeBody', 1, 'boss', 'Gatekeeper Body'], ['KHStealthSoldier', 2], ['KHRedNocturne', 1]]] },
  { type: 'story', scene: 'k6' },
  { type: 'battle', id: 'b6', name: 'Oogie Boogie', bg: 'casino', lv: 245, rewardHero: 'OogieBoogie', tune: { hp: .22, atk: .45 }, tuneHard: { hp: .15, atk: .34 }, music: 'khBoss',
    easy: [[['KHShadow', 3], ['KHSoldier', 2]], [['OogieBoogie', 1, 'boss', 'Oogie Boogie'], ['KHShadow', 2]]],
    hard: [[['KHSoldier', 3], ['KHStealthSoldier', 1]], [['KHLargeBody', 1], ['KHRedNocturne', 1], ['KHShadow', 2]], [['OogieBoogie', 1, 'boss', 'Oogie Boogie'], ['KHStealthSoldier', 1], ['KHShadow', 2]]] },
  { type: 'story', scene: 'k7', join: ['OogieBoogie'] },
  { type: 'battle', id: 'b7', name: 'The Heartless Horde', bg: 'hill', lv: 300, join: ['OogieBoogie'], final: true, music: 'khBoss',
    easy: [[['KHShadow', 3], ['KHSoldier', 2]], [['KHRedNocturne', 2], ['KHStealthSoldier', 2], ['KHGigasShadow', 1]], [['KHLargeBody', 1, 'boss', 'Colossal Body'], ['KHLargeBody', 1, 'elite', 'Lazy Body'], ['KHSoldier', 2]]],
    hard: [[['KHShadow', 4], ['KHSoldier', 3]], [['KHRedNocturne', 2], ['KHStealthSoldier', 3], ['KHGigasShadow', 1]], [['KHLargeBody', 1, 'boss', 'Colossal Body'], ['KHLargeBody', 1, 'elite', 'Lazy Body'], ['KHRedNocturne', 1], ['KHStealthSoldier', 2]]] },
  { type: 'story', scene: 'k8' },
  { type: 'battle', id: 'b8', name: 'Gardenview, After Dark', bg: 'gardenview', lv: 345, final: true, music: 'khBoss', tune: { hp: .2, atk: .4 }, tuneHard: { hp: .12, atk: .3 },
    easy: [[['KHShadow', 3], ['KHSoldier', 2]], [['TwistedDandy', 1, 'boss', 'Twisted Dandy'], ['KHShadow', 2]]],
    hard: [[['KHSoldier', 3], ['KHStealthSoldier', 2]], [['KHRedNocturne', 1], ['KHLargeBody', 1], ['KHShadow', 2]], [['TwistedDandy', 1, 'boss', 'Twisted Dandy'], ['KHStealthSoldier', 1], ['KHShadow', 2]]] },
  { type: 'story', scene: 'k9', join: ['Dandy'] }
];

const KH_EVENT = {
  id: 'kh-halloween-town', title: 'Kingdom Hearts · Halloween Town', label: 'KINGDOM HEARTS', kind: 'kh', isKH: true,
  bossIds: [], featuredIds: ['Sora', 'JackSkellington', 'OogieBoogie', 'LockShockBarrel'], tag: 'KH COLLAB · HALLOWEEN TOWN', minMastery: 1, rewardMult: 1.5,
  stageLevels: KH_NODES.map((n, i) => n.lv || (KH_NODES[i + 1] && KH_NODES[i + 1].lv) || 345),
  blurb: 'A few Toons snuck through the gate. Follow Sora, Donald and Goofy into Halloween Town, where the Heartless are running wild and the Pumpkin King needs a hand.'
};

/* Monster stat multipliers. Harder than Gold Saucer on purpose. */
const KH_TUNE = {
  easy: { foe: { hp: 12, atk: 4.2, def: 1.5 }, elite: { hp: 19, atk: 4.5, def: 1.6 }, boss: { hp: 25, atk: 4.8, def: 1.7 }, wave: .14 },
  hard: { foe: { hp: 18, atk: 5.2, def: 1.7 }, elite: { hp: 25, atk: 5.5, def: 1.8 }, boss: { hp: 33, atk: 5.9, def: 1.9 }, wave: .18 }
};
const KH_SCALE = { easy: { hp: 4.5, atk: 2 }, hard: { hp: 5.5, atk: 2.3 } };
function khMult(kind, hard, w, node) {
  const mode = hard ? 'hard' : 'easy', t = KH_TUNE[mode], m = t[kind], g = 1 + w * t.wave;
  const k = KH_SCALE[mode], nt = (node && (hard && node.tuneHard || node.tune)) || { hp: 1, atk: 1 };
  const hp = m.hp * g * k.hp * nt.hp, atk = m.atk * g * k.atk * nt.atk;
  return { hp, atk, mag: atk, def: m.def, mdef: m.def };
}

const KH_SHOP = [
  { id: 'JackSkellington', cost: 18, amount: 10 }, { id: 'OogieBoogie', cost: 18, amount: 10 },
  { id: 'LockShockBarrel', cost: 18, amount: 10 }, { id: 'Donald', cost: 12, amount: 10 },
  { id: 'Sora', cost: 14, amount: 10 }, { id: 'Goofy', cost: 10, amount: 10 }
];

const KHEvent = {
  event: KH_EVENT,
  nodes: KH_NODES,
  state() {
    const r = Raid.state();
    if (!r.kh) r.kh = { munny: 0, cleared: {}, seen: {}, hearts: 0 };
    const s = r.kh;
    s.munny = Math.max(0, Math.floor(Number(s.munny) || 0)); s.hearts = Math.max(0, Math.floor(Number(s.hearts) || 0));
    if (!s.cleared) s.cleared = {}; if (!s.seen) s.seen = {};
    return s;
  },
  nodeDone(i) {
    const n = KH_NODES[i], c = this.state().cleared[i];
    return !!(n && c && (n.type === 'story' ? c.story : (c.easy || c.hard)));
  },
  unlocked(i) { return i === 0 || (i > 0 && i < KH_NODES.length && this.nodeDone(i - 1)); },
  current() { for (let i = 0; i < KH_NODES.length; i++) if (!this.nodeDone(i)) return i; return KH_NODES.length - 1; },
  markDone(i, mode) {
    const s = this.state();
    s.cleared[i] = Object.assign({}, s.cleared[i], { [mode]: true });
    if (Raid.stageUnlocked(KH_EVENT.id, i)) Raid.recordClear(KH_EVENT.id, i);
    Save.write();
  },
  joined(i) {
    const out = new Set(KH_CORE);
    KH_NODES.slice(0, i + 1).forEach(n => (n.join || []).forEach(id => out.add(id)));
    return out;
  },
  roster(i) {
    const n = KH_NODES[i], joined = this.joined(i);
    return KH_PARTY.filter(id => joined.has(id) && !(n.missing || []).includes(id));
  },
  level(n, mode) { return mode === 'hard' ? Math.round(n.lv * 1.3 + 25) : n.lv; },
  spec(id, level) {
    if (Save.owns(id)) {
      const s = playerSpec(id);
      if (s.level < level * .8) Object.assign(s, { level: Math.round(level * .8), assisted: true });
      return s;
    }
    return { id, level, rarity: 5, rarityPlus: 1, stars: 3, skillLv: Math.max(1, Math.round(level * .8)), temporary: true, trinkets: [], artSrc: Art.hero(id) };
  },
  team(i, ids, mode) {
    const n = KH_NODES[i], lvl = this.level(n, mode);
    return ids.filter(id => this.roster(i).includes(id)).slice(0, 5).map(id => this.spec(id, lvl));
  },
  wave(n, mode, w) {
    const level = this.level(n, mode), hard = mode === 'hard', list = (hard ? n.hard : n.easy)[w];
    const foes = [];
    list.forEach(([id, count, kind, name]) => {
      for (let k = 0; k < count; k++) {
        const boss = kind === 'boss', elite = kind === 'elite', mult = khMult(boss ? 'boss' : elite ? 'elite' : 'foe', hard, w, n);
        if (id === 'TwistedDandy') {
          const sp = makeTwisted('Dandy', level, 'boss');
          sp.name = name || 'Twisted Dandy'; sp.mult = Object.assign({}, sp.mult || {}, { hp: (sp.mult && sp.mult.hp || 1) * .9, atk: (sp.mult && sp.mult.atk || 1) * (hard ? 1.25 : 1), mag: (sp.mult && sp.mult.mag || 1) * (hard ? 1.25 : 1) });
          foes.push(sp); continue;
        }
        foes.push({
          id, level, name, kind: boss ? 'boss' : undefined, elite,
          rarity: hard ? 5 : 4, rarityPlus: hard ? 10 : 4, stars: hard ? 5 : 4, skillLv: level,
          twisted: false, encounterOnly: true, artSrc: Art.hero(id), formationLine: id === 'KHRedNocturne' || id === 'KHStealthSoldier' ? 2 : (foes.length % 2),
          mult
        });
      }
    });
    return Raid.equipWave(foes, KH_EVENT.id + ':' + mode, w + 1, level);
  },
  waves(n, mode) { return (mode === 'hard' ? n.hard : n.easy).length; },
  musicFor(n, foes) { return foes.some(f => f.kind === 'boss') ? (n.music === 'khGardenBattle' ? 'khBoss' : (n.music || 'khBoss')) : (n.music || 'khBattle'); },
  meta(n, mode, w, i) {
    const hard = mode === 'hard', last = w === this.waves(n, mode) - 1;
    return {
      title: `${n.name} · ${hard ? 'Hard' : 'Easy'} · Wave ${w + 1}/${this.waves(n, mode)}`,
      floorLabel: `Kingdom Hearts · ${n.name}`, roomIdx: w + 1, roomTotal: this.waves(n, mode),
      bg: ASSET + KH_BG[n.bg], mods: [hard ? 'kh_hard' : 'kh_easy'],
      timeLimit: last ? 220 : 175, kh: true,
      enemySkillStartEnergy: hard ? 50 + w * 10 : 20, enemySkillTempo: hard ? 1.35 + w * .08 : 1.05, enemySkillCdr: hard ? .14 : .02,
      survivedLabel: `Wave ${w + 1}`, encounteredLabel: last && (n.final || hard) ? `${n.name}!` : null
    };
  },
  munnyReward(n, mode, first) {
    const base = Math.round(70 + n.lv * 1.0);
    return Math.round(base * (mode === 'hard' ? 2.1 : 1) * (first ? 1.6 : 1));
  },
  heartsReleased(battles) {
    let n = 0;
    battles.forEach(b => (b && b.units || []).forEach(u => { if (u.team === TEAM_E && !u.alive && !u.minion && u.def && u.def.khEnemy) n++; }));
    return n;
  },
  storyReward(i) {
    const s = this.state();
    if (s.cleared[i] && s.cleared[i].story) return null;
    const munny = 90 + i * 22; s.munny += munny;
    return { munny };
  },
  firstClearShards(n) {
    const join = [...(n.join || []).filter(id => KH_NEW_HERO_IDS.includes(id)), ...(n.rewardHero ? [n.rewardHero] : [])];
    if (n.id === 'b1') join.push('Donald');
    return [...new Set(join)].map(id => ({ id, amount: 30 }));
  },
  /* ---------- Hundred Acre Wood ---------- */
  woodState() {
    const s = this.state();
    if (!s.wood) s.wood = { hunny: 0, best: {}, plays: 0, seen: false };
    return s.wood;
  },
  woodLevel() {
    let lv = 40;
    KH_NODES.forEach((n, i) => { const c = this.state().cleared[i]; if (n.type === 'battle' && c && (c.easy || c.hard)) lv = Math.max(lv, c.hard ? this.level(n, 'hard') : n.lv); });
    return lv;
  },
  woodRaidNode() {
    return {
      id: 'wood-raid', name: 'Hundred Acre Wood', bg: 'wood', lv: this.woodLevel(), music: 'khBattle', final: true,
      easy: [[['KHShadow', 2], ['KHSoldier', 1]], [['KHShadow', 2], ['KHLargeBody', 1, 'boss', 'Woodland Guardian']]]
    };
  },
  woodRaidRoster() {
    const available = new Set([...KH_CORE, ...KH_TOONS, ...this.joined(this.current())]);
    return KH_PARTY.filter(id => available.has(id));
  },
  /* Pay for one finished page. Beating your best rank pays in full; repeats pay half. */
  woodRecord(game, score, rank) {
    const w = this.woodState(), s = this.state(), prev = w.best[game.id];
    const bestRank = prev ? prev.rank : -1, improved = rank > bestRank;
    const base = Math.round(40 + this.woodLevel() * .45);
    const mult = [.15, 1, 1.9, 3.2][rank], hMul = [0, 1, 2, 3][rank], k = improved ? 1 : .5;
    const munny = Math.max(5, Math.round(base * mult * k)), hunny = rank ? Math.max(1, Math.round(hMul * k)) : 0;
    const before = w.hunny;
    s.munny += munny; w.hunny += hunny; w.plays++;
    const newBest = !prev || score > prev.score;
    if (newBest) w.best[game.id] = { score, rank: Math.max(rank, prev ? prev.rank : 0) };
    const unlocked = WOOD_GAMES.filter(g => g.unlock > before && g.unlock <= w.hunny);
    Save.write();
    return { munny, hunny, newBest, best: w.best[game.id].score, unlocked };
  },
  buy(id) {
    const o = KH_SHOP.find(x => x.id === id), s = this.state();
    if (!o) return { ok: false, reason: 'Sold out.' };
    const h = Save.hero(id); if (h && h.stars >= 5) return { ok: false, reason: 'Already at max stars.' };
    const cost = o.cost * o.amount;
    if (s.munny < cost) return { ok: false, reason: 'Not enough Munny.' };
    s.munny -= cost; const res = Save.giveShards(id, o.amount);
    Save.write();
    return { ok: true, res };
  }
};

EVENT_MODIFIERS.push(
  { id: 'kh_easy', kind: 'buff', icon: '🟢', name: 'Easy Mode', desc: 'Heroes gain 10% Energy generation.',
    apply: B => B.playerTeam().forEach(u => { u.flat.energyGen79 = .10; u.dirty = true; }) },
  { id: 'kh_hard', kind: 'debuff', icon: '🔴', name: 'Hard Mode', desc: 'The Heartless swarm tighter, resist control, and hit harder. Heroes receive 15% less healing.',
    apply: B => {
      B.foeTeam().forEach(u => { u._khHard = true; u.flat.ccRes79 = .18; u.flat.cdr79 = .10; u.dirty = true; });
      B.playerTeam().forEach(u => { u.flat.healRecv79 = -.15; u.dirty = true; });
    } }
);

/* Join the weekly board and the collab tables. */
{
  const baseWeekly = weeklyEvents;
  // eslint-disable-next-line no-global-assign
  weeklyEvents = function (week) {
    return [KH_EVENT, ...baseWeekly(week).map(e => e.id === 'collab-door-opens'
      ? Object.assign({}, e, { isKHClassic: true, tag: 'CLASSIC · THE DOOR OPENS' }) : e)];
  };
  KH_NEW_HERO_IDS.forEach(id => { HERO_OBTAIN[id] = 'Collab'; COLLAB_HERO_IDS.add(id); });
  const baseEventOf = eventOf;
  // eslint-disable-next-line no-global-assign
  eventOf = function (id) {
    return KH_NEW_HERO_IDS.includes(id) ? { name: 'Halloween Town', icon: '🎃', color: '#ff9a3c', collab: true } : baseEventOf(id);
  };
}
