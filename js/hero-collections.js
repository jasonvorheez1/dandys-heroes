/* Hero Collections: curated membership, participation, claims and PvE bonuses. */
'use strict';

const HeroCollections = {
  catalogue: [
    { id: 'support', name: 'Support Crew', theme: 'Support role', icon: '+', color: '#f49bc4', members: () => PLAYABLE_IDS.filter(id => heroRole(HEROES[id].role) === 'Support'), stat: 'hp' },
    { id: 'control', name: 'Control Crew', theme: 'Control role', icon: '◎', color: '#8fd2f5', members: () => PLAYABLE_IDS.filter(id => heroRole(HEROES[id].role) === 'Control'), stat: 'mag' },
    { id: 'tanks', name: 'Front Line', theme: 'Tank role', icon: '🛡', color: '#8dd7a3', members: () => PLAYABLE_IDS.filter(id => heroRole(HEROES[id].role) === 'Tank'), stat: 'hp' },
    { id: 'close', name: 'Close Quarters', theme: 'Attack range under 220', icon: '◈', color: '#efaa8d', members: () => PLAYABLE_IDS.filter(id => HEROES[id].hidden.range < 220), stat: 'hp' },
    { id: 'midline', name: 'Middle Line', theme: 'Attack range from 220 to 299', icon: '◇', color: '#f4d17d', members: () => PLAYABLE_IDS.filter(id => HEROES[id].hidden.range >= 220 && HEROES[id].hidden.range < 300), stat: 'atk' },
    { id: 'backline', name: 'Back Line', theme: 'Attack range of 300 or more', icon: '➶', color: '#86dbea', members: () => PLAYABLE_IDS.filter(id => HEROES[id].hidden.range >= 300), stat: 'mag' },
    { id: 'magic', name: 'Magic Focus', theme: 'Magic Attack is at least 1.5× Attack', icon: '✦', color: '#c49af8', members: () => PLAYABLE_IDS.filter(id => HEROES[id].base.mag >= HEROES[id].base.atk * 1.5), stat: 'mag' },
    { id: 'physical', name: 'Attack Focus', theme: 'Attack is at least 1.5× Magic Attack', icon: '⚔', color: '#f6b879', members: () => PLAYABLE_IDS.filter(id => HEROES[id].base.atk >= HEROES[id].base.mag * 1.5), stat: 'atk' },
    { id: 'balanced', name: 'Balanced Focus', theme: 'Neither Attack nor Magic Attack leads by 1.5×', icon: '⚖', color: '#a7c4f2', members: () => PLAYABLE_IDS.filter(id => HEROES[id].base.atk < HEROES[id].base.mag * 1.5 && HEROES[id].base.mag < HEROES[id].base.atk * 1.5), stat: 'hp' },
    { id: 'swift', name: 'Swift Striders', theme: 'Base Speed of 120 or more', icon: '⚡', color: '#f5dc78', members: () => PLAYABLE_IDS.filter(id => HEROES[id].base.spd >= 120), stat: 'atk' },
    { id: 'sturdy', name: 'Sturdy Crew', theme: 'Sturdy resilience tag', icon: '▣', color: '#a9dfb3', members: () => PLAYABLE_IDS.filter(id => statTags().sturdy.has(id)), stat: 'hp' },
    { id: 'performers', name: 'Stage Stars', theme: 'Performer motif', icon: '♫', color: '#f3a4d8', members: () => PLAYABLE_IDS.filter(id => HERO_MOTIF_TAGS.Performer.ids.has(id)), stat: 'mag' },
    { id: 'food', name: 'Food Friends', theme: 'Food motif', icon: '✿', color: '#f3b88b', members: () => PLAYABLE_IDS.filter(id => HERO_MOTIF_TAGS.Food.ids.has(id)), stat: 'hp' },
    { id: 'kh', name: 'Kingdom Hearts', theme: 'Kingdom Hearts roster', icon: '♛', color: '#e6d589', members: () => KH_CAST_IDS.filter(id => PLAYABLE_IDS.includes(id)), stat: 'hp' },
    { id: 'ff7', name: 'Final Fantasy VII', theme: 'Final Fantasy VII roster', icon: '✧', color: '#9ac4f2', members: () => FF7_HERO_IDS.filter(id => PLAYABLE_IDS.includes(id)), stat: 'atk' },
    { id: 'modded', name: "Dandy's World Modded", theme: 'Event roster', icon: '◆', color: '#e9a1fa', members: () => [...DW_MODDED_HERO_IDS].filter(id => PLAYABLE_IDS.includes(id)), stat: 'mag' }
  ],
  tiers: [
    { wins: 3, wide: 2, small: 1, reward: { ichor: 8000, exp: 6000, tape: 30 } },
    { wins: 10, wide: 3, small: 2, reward: { ichor: 45000, exp: 35000, star: 120, core: 5 } },
    { wins: 25, wide: 4, small: 3, reward: { ichor: 170000, exp: 130000, notes: 350, manual: 35 } },
    { wins: 60, wide: 5, small: 3, reward: { ichor: 600000, exp: 480000, tape: 900, core: 45, diamond: 2 } }
  ],
  state() {
    const d = Save.data;
    if (!d.heroCollections || typeof d.heroCollections !== 'object' || Array.isArray(d.heroCollections)) d.heroCollections = {};
    const s = d.heroCollections;
    if (!s.wins || typeof s.wins !== 'object' || Array.isArray(s.wins)) s.wins = {};
    if (!s.claimed || typeof s.claimed !== 'object' || Array.isArray(s.claimed)) s.claimed = {};
    if (!Array.isArray(s.seen)) s.seen = [];
    if (!s.receipts || typeof s.receipts !== 'object' || Array.isArray(s.receipts)) s.receipts = {};
    return s;
  },
  members(c) { return c.members(); },
  needed(c, tier) {
    const count = this.members(c).length;
    return Math.min(Math.max(0, count - 1), count <= 4 ? tier.small : tier.wide);
  },
  progress(c, tier) {
    const wins = this.state().wins;
    const members = this.members(c);
    const needed = this.needed(c, tier);
    const counts = members.map(id => Math.max(0, Number(wins[id]) || 0)).sort((a, b) => b - a);
    const ready = counts.filter(n => n >= tier.wins).length;
    const filled = counts.slice(0, needed).reduce((sum, n) => sum + Math.min(tier.wins, n), 0);
    const total = needed * tier.wins;
    return { ready, needed, filled, total, complete: needed > 0 && ready >= needed };
  },
  earned(c) { return Math.min(4, Math.max(0, Math.floor(Number(this.state().claimed[c.id]) || 0))); },
  claimable(c) {
    const n = this.earned(c);
    return n < 4 && this.progress(c, this.tiers[n]).complete;
  },
  reward(tier) { return masteryRewardBundle(tier.reward); },
  claim(id) {
    const c = this.catalogue.find(item => item.id === id);
    if (!c || !this.claimable(c)) return false;
    const s = this.state(), next = this.earned(c) + 1;
    const reward = this.reward(this.tiers[next - 1]);
    // Entitlement and resources are mutated together before the only write.
    s.claimed[id] = next;
    (s.receipts[id] || (s.receipts[id] = []))[next - 1] = reward;
    if (next === 4) {
      const icons = Save.data.profile.iconUnlocks || (Save.data.profile.iconUnlocks = []);
      const iconId = 'collection-' + id;
      if (!icons.includes(iconId)) icons.push(iconId);
    }
    Object.entries(reward).forEach(([key, amount]) => { Save.data.res[key] = (Save.data.res[key] || 0) + amount; });
    Save.write(); UI.refreshBar(true);
    Sound.play('get_rare');
    UI.toast(`${c.name} · Tier ${next} claimed!`);
    return true;
  },
  bonusFor(id) {
    const total = { hp: 0, atk: 0, mag: 0 };
    if (!Save.data || !Save.owns(id)) return total;
    const claimed = this.state().claimed;
    this.catalogue.forEach(c => {
      const tier = Math.min(4, Math.max(0, Math.floor(Number(claimed[c.id]) || 0)));
      // Every earned collection helps the owned roster. Members receive an
      // additional bonus for the group they helped develop.
      if (tier >= 2) total.hp += .0025;
      if (tier >= 4) total[c.stat] += .0025;
      if (this.members(c).includes(id)) {
        if (tier >= 2) total.hp += .005;
        if (tier >= 4) total[c.stat] += .005;
      }
    });
    Object.keys(total).forEach(key => { total[key] = Math.min(.03, total[key]); });
    return total;
  },
  recordVictory(battle) {
    if (!battle || battle.offscreen || !battle.result || !battle.result.win || battle._collectionsRecorded) return false;
    const ids = [...new Set(battle.units.filter(u => u.team === TEAM_P && !u.minion && u.collectionOwned && Save.owns(u.id)).map(u => u.id))];
    if (!ids.length) return false;
    const s = this.state();
    const key = battle._collectionBattleKey;
    if (!key || s.seen.includes(key)) return false;
    battle._collectionsRecorded = true;
    s.seen.push(key);
    if (s.seen.length > 64) s.seen.splice(0, s.seen.length - 64);
    ids.forEach(id => { s.wins[id] = Math.min(1000000, Math.max(0, Math.floor(Number(s.wins[id]) || 0)) + 1); });
    Save.write();
    return true;
  }
};
