/* gacha.js - Ichor Crates. No banners, no paid currency, no pity walls.
   Crates are earned constantly and mostly pay out resources; heroes arrive
   as shards so a duplicate is never a dead pull. */
'use strict';

const Gacha = {

  /* Crate level rises with total pulls and improves the resource floor,
     which is why opening bulk crates late still feels worth doing. */
  crateLevel() {
    const c = Save.data.crates;
    return clamp(1 + Math.floor(((Number(c.goldPulls) || 0) + (Number(c.diamondPulls) || 0) + (Number(c.mainPulls) || 0) * 2) / 40), 1, 20);
  },
  nextLevelAt() {
    const c = Save.data.crates;
    const total = (Number(c.goldPulls) || 0) + (Number(c.diamondPulls) || 0) + (Number(c.mainPulls) || 0) * 2;
    return 40 - (total % 40);
  },

  pullKey(kind) { return kind === 'main' ? 'mainPulls' : kind === 'diamond' ? 'diamondPulls' : 'goldPulls'; },
  icon(kind) { return kind === 'main' ? '🌟' : kind === 'diamond' ? '💎' : '📦'; },
  mastery() { return clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800); },
  masteryMultiplier() {
    const mastery = this.mastery();
    // Crates have their own endgame kick on top of the shared account curve.
    return masteryRewardMultiplier(mastery) * (1 + Math.sqrt(Math.max(0, mastery - 1) / 799) * .55);
  },
  qualityMultiplier(kind) { return kind === 'main' ? 2.7 : kind === 'diamond' ? 1.8 : 1; },
  rewardValue(base, kind, level) {
    return Math.max(1, Math.round(Number(base || 0) * this.qualityMultiplier(kind) * (1 + level * .12) * this.masteryMultiplier()));
  },
  /** Every crate contains a dependable supply cache in addition to its reveal. */
  supplyCache(kind, level) {
    const cache = {
      ichor: this.rewardValue(3500 + level * 420, kind, level),
      exp: this.rewardValue(2500 + level * 340, kind, level),
      tape: this.rewardValue(18 + level * 2, kind, level),
      notes: this.rewardValue(14 + level * 2, kind, level),
      star: this.rewardValue(55 + level * 6, kind, level),
      manual: this.rewardValue(3 + Math.floor(level / 4), kind, level)
    };
    if (kind === 'diamond') cache.core = this.rewardValue(1, kind, level);
    if (kind === 'main') Object.assign(cache, {
      core: this.rewardValue(2, kind, level), tape: this.rewardValue(1, kind, level), raidTicket: this.rewardValue(1, kind, level)
    });
    return cache;
  },

  /* Odds. Main Character Crates spend their value on focused research instead
     of generic resources: the hero/shard buckets together are the main draw. */
  odds(kind) {
    const lv = this.crateLevel();
    if (kind === 'main') return { hero: .42, shards: .36, core: .06, star: .05, tape: .04, manual: .03, notes: .025, ichor: .015, bonus: lv };
    return kind === 'diamond'
      ? { hero: .24, shards: .34, core: .13, star: .11, tape: .08, manual: .06, notes: .03, ichor: .01, bonus: lv }
      : { hero: .14, shards: .30, core: .08, star: .16, tape: .15, manual: .08, notes: .07, ichor: .02, bonus: lv };
  },

  roll(kind) {
    const pool = cratePool(kind);
    const o = this.odds(kind);
    const r = Math.random();
    const lv = this.crateLevel();
    const cache = this.supplyCache(kind, lv);
    const finish = result => {
      Save.give(cache, true);
      return Object.assign(result, { bonus: cache });
    };

    let acc = 0;
    const pickBucket = () => {
      acc = 0;
      for (const k of ['hero', 'shards', 'core', 'star', 'tape', 'manual', 'notes', 'ichor']) {
        acc += o[k];
        if (r < acc) return k;
      }
      return 'ichor';
    };
    const bucket = pickBucket();

    if (bucket === 'hero') {
      // rarity-weighted, with a gentle nudge toward Heroes not yet recruited
      let id = rollCrateHero(kind);
      if (!id) id = pick(pool);
      const [lo, hi] = obtainOf(id).shardRange;
      const bonus = kind === 'main' ? 5.5 : kind === 'diamond' ? 3.6 : 2.3;
      const n = this.rewardValue(rndi(lo, hi) * bonus, kind, lv);
      const got = Save.giveShards(id, n);
      return finish({ type: 'hero', id, n, isNew: got === 'new', banked: got === 'bank' });
    }
    if (bucket === 'shards') {
      const id = rollCrateShard(kind);
      if (id) {
        const [lo, hi] = obtainOf(id).shardRange;
        const n = this.rewardValue(rndi(lo, hi) * (kind === 'main' ? 4.2 : kind === 'diamond' ? 2.8 : 1.7), kind, lv);
        const got = Save.giveShards(id, n);
        return finish({ type: 'shards', id, n, isNew: got === 'new', banked: got === 'bank' });
      }
    }
    if (bucket === 'core') { const n = this.rewardValue(rndi(3, 8) + Math.floor(lv / 4), kind, lv); Save.give({ core: n }, true); return finish({ type: 'res', k: 'core', n }); }
    if (bucket === 'star') { const n = this.rewardValue(rndi(160, 460), kind, lv); Save.give({ star: n }, true); return finish({ type: 'res', k: 'star', n }); }
    if (bucket === 'tape') { const n = this.rewardValue(rndi(55, 150), kind, lv); Save.give({ tape: n }, true); return finish({ type: 'res', k: 'tape', n }); }
    if (bucket === 'manual') { const n = this.rewardValue(rndi(18, 48), kind, lv); Save.give({ manual: n }, true); return finish({ type: 'res', k: 'manual', n }); }
    if (bucket === 'notes') { const n = this.rewardValue(rndi(48, 135), kind, lv); Save.give({ notes: n }, true); return finish({ type: 'res', k: 'notes', n }); }
    const n = this.rewardValue(rndi(9000, 28000), kind, lv);
    Save.give({ ichor: n }, true);
    return finish({ type: 'res', k: 'ichor', n });
  },

  /** Open n crates of a kind; returns the result list for the reveal screen. */
  open(kind, n) {
    const have = Save.res(kind);
    n = Math.min(n, have);
    if (n <= 0) { UI.toast('No ' + RES[kind].name + 's'); Sound.play('ui_err'); return null; }
    Save.spend({ [kind]: n });
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(this.roll(kind));
      Save.data.crates[this.pullKey(kind)]++;
    }
    Save.write();
    return out;
  },

  /* Buying crates with Ichor is the sink that makes Ichor matter late. */
  buyCost(kind, n) { return { ichor: (kind === 'main' ? 18000 : kind === 'diamond' ? 7500 : 2700) * n }; }
};

/* ============================================================ SCRATCH tapeS */
/* An always-open prize board. tapes are earned through play, then spent
   whenever the player wants - no calendar lockout and no dead seventh day. */
/* Scratch cards are a high-excitement reward source. Their Mastery curve sits
   on top of the shared reward curve: the card locks its Mastery when opened,
   so its revealed panels can never change after a refresh. */
function scratchRewardMultiplier(mastery) {
  const level = clamp(Math.floor(Number(mastery) || 1), 1, 800);
  return 1 + Math.sqrt(Math.max(0, level - 1) / 799) * .50;
}
function scratchRewardValue(value, mastery) {
  return Math.max(1, Math.round(masteryRewardValue(value, mastery) * scratchRewardMultiplier(mastery)));
}
const Scratch = {
  CELLS: 6,

  state() {
    const s = Save.data.scratch;
    const w = currentWeek();
    // card replaces the old day key. Keep old saves' in-progress card intact
    // the first time they update, then let every completed card refresh on demand.
    if (!Number.isInteger(s.card) || s.card < 0) s.card = 0;
    if (!Array.isArray(s.revealed)) s.revealed = [];
    if (!Number.isFinite(Number(s.rewardMastery)) || Number(s.rewardMastery) < 1) s.rewardMastery = clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800);
    if (!s.won || typeof s.won !== 'object') s.won = {};
    if (s.week !== w) { s.week = w; s.card = 0; s.revealed = []; s.jackpot = false; s.won = {}; s.rewardMastery = clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800); }
    return s;
  },

  /**
   * A card's jackpot target is part of that card, not the weekly feature.
   * Shuffle the eligible roster into a new deterministic lineup each cycle:
   * refreshing cannot reroll a prize, while completing cards cannot leave one
   * Hero (notably the first weekly scratch pick) on every tape.
   */
  heroes() {
    const s = this.state();
    const pool = PLAYABLE_IDS.filter(id => HEROES[id] && heroAvailable(id));
    if (!pool.length) return [];
    const cycle = Math.floor(s.card / pool.length);
    const slot = s.card % pool.length;
    return [seeded('scratch-lineup-' + s.week + '-' + cycle).shuffle(pool)[slot]];
  },
  active() { return true; },
  cardNumber() { return this.state().card + 1; },
  rewardMultiplier() {
    const s = this.state();
    return masteryRewardMultiplier(s.rewardMastery) * scratchRewardMultiplier(s.rewardMastery);
  },

  /** Fixed board per player and card, so refreshing cannot reroll it. */
  board() {
    const s = this.state();
    const rng = seeded(SAVE_KEY + '-scratch-' + s.week + '-' + s.card);
    const heroes = this.heroes();
    const cells = [];
    const reward = value => scratchRewardValue(value, s.rewardMastery);
    // One huge Hero jackpot, plus supply panels that feel like a real pull.
    // Each amount is intentionally well above an ordinary battle payout: a
    // tape is a prize-board commitment, not a minor consumable drip.
    const jackIdx = rng.i(0, this.CELLS - 1);
    for (let i = 0; i < this.CELLS; i++) {
      if (i === jackIdx && heroes.length) {
        const hid = heroes.length === 2 ? (rng.chance(.5) ? heroes[0] : heroes[1]) : heroes[0];
        cells.push({ jackpot: true, hero: hid, n: reward(rng.i(70, 130)) });
      } else {
        cells.push(rng.pick([
          { res: 'ichor', n: reward(rng.i(14000, 42000)) },
          { res: 'tape', n: reward(rng.i(160, 460)) },
          { res: 'notes', n: reward(rng.i(130, 380)) },
          { res: 'star', n: reward(rng.i(550, 1500)) },
          { res: 'gold', n: reward(rng.i(2, 4)) },
          { res: 'diamond', n: reward(rng.i(2, 3)) },
          { res: 'main', n: reward(1) },
          { res: 'core', n: reward(rng.i(3, 7)) },
          { res: 'manual', n: reward(rng.i(45, 115)) },
          { res: 'exp', n: reward(rng.i(18000, 52000)) },
          { res: 'tape', n: reward(rng.i(3, 7)) },
          { res: 'raidTicket', n: reward(rng.i(1, 3)) }
        ]));
      }
    }
    return cells;
  },

  scratchCell(i) {
    const s = this.state();
    if (s.jackpot || s.revealed.includes(i)) return null;
    if (Save.res('ticket') < 1) { UI.toast('No Scratch Tickets'); Sound.play('ui_err'); return null; }
    Save.spend({ ticket: 1 });
    s.revealed.push(i);
    const cell = this.board()[i];
    if (cell.jackpot) {
      s.jackpot = true;
      Save.giveShards(cell.hero, cell.n);
      s.won[cell.hero] = (s.won[cell.hero] || 0) + cell.n;
      Sound.play('get_rare');
    } else {
      Save.give({ [cell.res]: cell.n }, true);
      Sound.play(cell.res === 'ichor' ? 'ichor_gain' : 'coin');
    }
    Achievements.record('scratch', 1);
    if (cell.jackpot) Achievements.record('scratchJackpot', 1);
    Save.write();
    return cell;
  },

  newCard() {
    const s = this.state();
    if (!s.jackpot) return false;
    s.card++;
    s.revealed = [];
    s.jackpot = false;
    s.rewardMastery = clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800);
    Save.write();
    return true;
  }
};

/* ============================================================ BATTLE PASS */
const Pass = {
  state() {
    let p = Save.data.pass, dirty = false;
    if (!p || typeof p !== 'object') { p = Save.data.pass = { week: -1, xp: 0, claimed: [] }; dirty = true; }
    const w = currentWeek();
    if (p.week !== w) { p.week = w; p.xp = 0; p.claimed = []; dirty = true; }
    const safeXp = Math.max(0, Math.floor(Number(p.xp) || 0));
    if (p.xp !== safeXp) { p.xp = safeXp; dirty = true; }
    const max = this.track().length;
    const safeClaims = Array.isArray(p.claimed)
      ? [...new Set(p.claimed.filter(i => Number.isInteger(i) && i >= 0 && i < max))]
      : [];
    if (!Array.isArray(p.claimed) || safeClaims.length !== p.claimed.length || safeClaims.some((v, i) => v !== p.claimed[i])) {
      p.claimed = safeClaims; dirty = true;
    }
    if (dirty) Save.write();
    return p;
  },
  rewardMastery() { return clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800); },
  rewardMultiplier() { return masteryRewardMultiplier(this.rewardMastery()) * battlePassMasteryMultiplier(this.rewardMastery()); },
  track() { return passTrack(currentWeek(), this.rewardMastery()); },
  resources(reward) {
    return Object.fromEntries(Object.entries(reward || {}).filter(([key, value]) => RES[key] && Number(value) > 0));
  },
  level() {
    const p = this.state(), t = this.track();
    let lv = 0, xp = p.xp;
    for (const e of t) { if (xp >= e.xp) { xp -= e.xp; lv++; } else break; }
    const complete = lv >= t.length;
    const need = complete ? 0 : t[lv].xp;
    return { lv, into: complete ? 0 : xp, need, progress: complete ? 1 : xp / need,
      complete, max: t.length, total: p.xp };
  },
  addXp(n) {
    const p = this.state();
    const before = this.level().lv;
    p.xp += n; Save.write();
    const after = this.level().lv;
    if (after > before) { UI.toast('📜 Battle Pass Level ' + after); Sound.play('get_rare'); }
  },
  claim(i) {
    const p = this.state(), t = this.track();
    if (!Number.isInteger(i) || !t[i]) return false;
    if (p.claimed.includes(i)) return false;
    if (this.level().lv < t[i].lv) { UI.toast('Not unlocked yet'); Sound.play('ui_err'); return false; }
    p.claimed.push(i);
    const r = t[i].reward;
    const resources = this.resources(r);
    if (Object.keys(resources).length) Save.give(resources, true);
    if (r.hero) Save.giveShards(r.hero, r.shards);
    const k = Object.keys(resources)[0];
    if (r.hero) UI.toast('🎭 ' + HEROES[r.hero].name + ' +' + r.shards + ' shards' + (k ? ' · bonus supplies' : ''));
    else if (k) UI.toast(RES[k].icon + ' ' + RES[k].name + ' +' + fmt(resources[k]));
    Save.addMasteryXp(24 + t[i].lv * 5);
    Achievements.record('passClaim', 1);
    Sound.play('currency'); Save.write(); return true;
  },
  claimable() {
    const p = this.state(), lv = this.level().lv;
    return this.track().map((e, i) => ({ e, i })).filter(x => x.e.lv <= lv && !p.claimed.includes(x.i));
  },
  claimAll() {
    const ready = this.claimable();
    if (!ready.length) { UI.toast('Nothing to claim'); return []; }

    // Commit the tier list once, then combine like resources. This avoids one
    // toast, sound and localStorage write per card when a player returns late.
    const p = this.state(), resources = {}, heroShards = {};
    ready.forEach(({ e, i }) => {
      p.claimed.push(i);
      const r = e.reward;
      if (r.hero) heroShards[r.hero] = (heroShards[r.hero] || 0) + r.shards;
      Object.keys(r).forEach(k => { if (RES[k]) resources[k] = (resources[k] || 0) + r[k]; });
    });
    if (Object.keys(resources).length) Save.give(resources, true);
    Object.keys(heroShards).forEach(id => Save.giveShards(id, heroShards[id]));
    Save.addMasteryXp(ready.reduce((total, x) => total + 24 + x.e.lv * 5, 0));
    Achievements.record('passClaim', ready.length);
    Save.write(); UI.refreshBar(true); Sound.play('get_rare');
    UI.toast('Claimed ' + ready.length + ' Battle Pass reward' + (ready.length === 1 ? '' : 's'));
    return ready.map(x => x.i);
  }
};

/* ============================================================ DAILY DELIVERIES */
const Daily = {
  state() { return Save.data.daily; },
  today() { return dayIndex(); },
  hour() { return Math.floor(Date.now() / 3600000); },
  passiveState() {
    const d = this.state();
    if (!d.freeClaims || typeof d.freeClaims !== 'object' || Array.isArray(d.freeClaims)) {
      d.freeClaims = { hour: -1, day: -1, week: -1 };
    }
    ['hour', 'day', 'week'].forEach(key => {
      if (!Number.isFinite(Number(d.freeClaims[key]))) d.freeClaims[key] = -1;
    });
    return d.freeClaims;
  },
  passiveIndex(kind) { return kind === 'hour' ? this.hour() : kind === 'week' ? currentWeek() : this.today(); },
  passiveAvailable(kind) { return this.passiveState()[kind] !== this.passiveIndex(kind); },
  passiveHourReset() { return 3600000 - (Date.now() % 3600000); },
  passiveHero() {
    const pool = PLAYABLE_IDS.filter(id => HEROES[id] && id !== 'Delilah' && id !== 'BigWig' && (typeof heroAvailable !== 'function' || heroAvailable(id)));
    return (pool.length ? seeded('passive-daily-shard-' + this.today() + '-' + (Save.activeSlot || 'slot-1')).pick(pool) : Save.ownedIds()[0]) || null;
  },
  passiveReward(kind) {
    const base = kind === 'hour'
      ? { ichor: 6500, exp: 2200, tape: 18, notes: 14, star: 24, manual: 3, core: 1, counterToken: 1 }
      : kind === 'week'
        ? { ichor: 180000, exp: 120000, tape: 900, notes: 700, star: 2400, manual: 180, core: 18, ticket: 15, raidTicket: 10, gold: 8, diamond: 4, main: 1, arenaCoin: 120, counterToken: 15 }
        : { ichor: 24000, exp: 18000, tape: 160, notes: 120, star: 360, manual: 32, core: 3, ticket: 3, raidTicket: 2, gold: 2, diamond: 1, arenaCoin: 20 };
    const reward = masteryRewardBundle(base);
    if (kind === 'day') {
      reward.hero = this.passiveHero();
      reward.shards = masteryRewardValue(20);
    }
    return reward;
  },
  claimPassive(kind) {
    if (!['hour', 'day', 'week'].includes(kind)) return null;
    const claims = this.passiveState(), index = this.passiveIndex(kind);
    if (claims[kind] === index) { UI.toast('That passive reward is still recharging'); return null; }
    const reward = this.passiveReward(kind);
    claims[kind] = index;
    const shards = reward.shards || 0, hero = reward.hero;
    delete reward.shards; delete reward.hero;
    Save.give(reward, true);
    if (hero && shards) Save.giveShards(hero, shards);
    Save.addMasteryXp(kind === 'week' ? 180 : kind === 'day' ? 55 : 12, true);
    if (kind === 'day') Achievements.record('dailyClaim', 1);
    Save.write(); UI.refreshBar(true); Sound.play(kind === 'week' ? 'get_rare' : 'get_item');
    const label = kind === 'week' ? 'Weekly cache' : kind === 'day' ? 'Daily cache' : 'Hourly cache';
    const summary = Object.keys(reward).filter(key => RES[key] && reward[key] > 0).slice(0, 4).map(key => RES[key].icon + fmt(reward[key])).join(' ');
    UI.toast(label + ' claimed · ' + summary + (hero ? ` · ◈${fmt(shards)} ${HEROES[hero].name}` : ''));
    return { kind, reward, hero, shards };
  },
  available() { return this.state().lastDay !== this.today(); },
  /* Small, guaranteed progress goals make a play session feel purposeful
     without requiring a specific mode or a lucky drop. They reset separately
     from the login streak, so claiming a delivery never wipes battle progress.
     The base ladder stays readable while orders() raises both the workload and
     the payout as the account grows. */
  ORDERS: [
    { need: 1, label: 'Win 1 battle', reward: { ichor: 1800, tape: 18, notes: 8, exp: 1200 } },
    { need: 3, label: 'Win 3 battles', reward: { ichor: 2800, star: 75, tape: 30, gold: 1, manual: 8 } },
    { need: 6, label: 'Win 6 battles', reward: { ichor: 5200, exp: 2800, notes: 18, tape: 1, manual: 15 } },
    { need: 10, label: 'Win 10 battles', reward: { ichor: 7600, star: 150, tape: 48, gold: 1, core: 1, manual: 22 } },
    { need: 15, label: 'Win 15 battles', reward: { ichor: 12000, exp: 6500, star: 250, diamond: 1, tape: 2, manual: 32 } }
  ],
  mastery() {
    const d = this.state();
    if (!Number.isFinite(Number(d.orderMastery)) || Number(d.orderMastery) < 1) d.orderMastery = this.currentMastery();
    return clamp(Math.floor(Number(d.orderMastery) || 1), 1, 800);
  },
  currentMastery() { return clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800); },
  /* Requirements rise gently enough to preserve a first-order win, then
     become a real daily objective for developed accounts. */
  needMultiplier() { return 1 + Math.min(2.2, Math.sqrt(Math.max(0, this.mastery() - 1)) * .08); },
  /* Payouts are deliberately more generous than the workload curve. A
     Mastery 800 account earns up to 4x the base order supplies. */
  rewardMultiplier() { return 1 + Math.min(3, Math.max(0, this.mastery() - 1) * .004); },
  orders() {
    const needMult = this.needMultiplier(), rewardMult = this.rewardMultiplier();
    return this.ORDERS.map((base, i) => ({
      label: base.label,
      need: Math.max(i === 0 ? 1 : base.need, Math.round(base.need * needMult)),
      reward: Object.fromEntries(Object.entries(base.reward).map(([key, value]) => [key, Math.max(1, Math.round(value * rewardMult))]))
    }));
  },
  orderState() {
    const d = this.state();
    if (d.orderDay !== this.today()) {
      d.orderDay = this.today(); d.orderMastery = this.currentMastery(); d.wins = 0; d.orderClaimed = [];
      Save.write();
    }
    // Older saves may have been opened before orderMastery existed. Snapshot
    // the current level once instead of letting requirements change mid-day.
    if (!Number.isFinite(Number(d.orderMastery)) || Number(d.orderMastery) < 1) {
      d.orderMastery = this.currentMastery(); Save.write();
    }
    return d;
  },
  recordWin() {
    const d = this.orderState();
    d.wins++;
    const ready = this.orders().filter((o, i) => d.wins >= o.need && !d.orderClaimed.includes(i)).length;
    Save.write();
    if (ready) UI.toast('Daily Order ready to claim');
  },
  claimOrder(i) {
    const d = this.orderState(), o = this.orders()[i];
    if (!o || d.orderClaimed.includes(i) || d.wins < o.need) return false;
    d.orderClaimed.push(i);
    Save.give(o.reward);
    Pass.addXp(35 + i * 15);
    Save.addMasteryXp(55 + o.need * 18 + i * 15);
    Achievements.record('dailyClaim', 1);
    Sound.play('get_item'); Save.write();
    return true;
  },
  orderSummary() {
    const d = this.orderState();
    const orders = this.orders();
    const complete = orders.filter((o, i) => d.wins >= o.need && d.orderClaimed.includes(i)).length;
    return { wins: d.wins, complete, total: orders.length };
  },
  claim() {
    const d = this.state();
    if (!this.available()) { UI.toast('Already collected today'); return null; }
    const missed = d.lastDay >= 0 && this.today() - d.lastDay > 1;
    d.streak = missed ? 1 : Math.min(7, d.streak + 1);
    d.lastDay = this.today();
    const r = this.deliveryReward(d.streak - 1);
    Save.give(r);
    Pass.addXp(40);
    Save.addMasteryXp(45 + d.streak * 10);
    Achievements.record('dailyClaim', 1);
    Achievements.recordMax('dailyStreak', d.streak);
    Sound.play('get_rare');
    Save.write();
    return { reward: r, streak: d.streak };
  },
  deliveryReward(index) { return masteryRewardBundle(DAILY_REWARDS[index] || {}); }
};
