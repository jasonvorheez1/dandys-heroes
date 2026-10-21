/* achievements.js - account-wide Journal milestones with long-run targets. Achievements are
   completed by gameplay events, never by pressing a display button. */
'use strict';

const ACHIEVEMENT_TIERS = {
  bronze: { label: 'Bronze', icon: '●', masteryXp: 8, reward: { tape: 4, notes: 1 } },
  silver: { label: 'Silver', icon: '🥈', masteryXp: 18, reward: { tape: 10, notes: 4 } },
  gold: { label: 'Gold', icon: '🥇', masteryXp: 42, reward: { ichor: 650, star: 10 } },
  platinum: { label: 'Platinum', icon: '💠', masteryXp: 90, reward: { ichor: 2200, core: 1, manual: 1 } },
  iridescent: { label: 'Iridescent', icon: '🌈', masteryXp: 180, reward: { diamond: 1, gold: 3, tape: 1 } }
};

const ACHIEVEMENTS = [];
const ACHIEVEMENT_TIER_OVERRIDES = {
  first_battle: 'bronze', five_battles: 'bronze', ten_battles: 'silver', twenty_five_battles: 'silver',
  fifty_battles: 'gold', hundred_battles: 'gold', two_fifty_battles: 'platinum', five_hundred_battles: 'platinum',
  seven_hundred_fifty_battles: 'iridescent', thousand_battles: 'iridescent',
  first_floor: 'bronze', five_floors: 'silver', ten_floors: 'gold', twenty_five_floors: 'platinum',
  fifty_floors: 'platinum', hundred_floors: 'iridescent', two_fifty_floors: 'iridescent', five_hundred_floors: 'iridescent',
  one_toon: 'bronze', three_toons: 'silver', five_toons: 'gold', ten_toons: 'platinum', twenty_toons: 'platinum', forty_toons: 'iridescent',
  first_level: 'bronze', ten_levels: 'silver', twenty_five_levels: 'gold', fifty_levels: 'platinum', hundred_levels: 'iridescent', two_fifty_levels: 'iridescent',
  first_pass_claim: 'bronze', five_pass_claims: 'silver', ten_pass_claims: 'gold', twenty_five_pass_claims: 'platinum', fifty_pass_claims: 'iridescent',
  first_daily: 'bronze', three_dailies: 'silver', seven_dailies: 'gold', fourteen_dailies: 'platinum', thirty_dailies: 'iridescent',
  streak_one: 'bronze', streak_three: 'silver', streak_seven: 'gold', streak_fourteen: 'iridescent',
  first_trinket_upgrade: 'bronze', three_trinket_upgrades: 'silver', ten_trinket_upgrades: 'gold', twenty_five_trinket_upgrades: 'platinum',
  first_scratch: 'bronze', five_scratches: 'silver', ten_scratches: 'gold', twenty_five_scratches: 'platinum', fifty_scratches: 'iridescent',
  first_jackpot: 'bronze', three_jackpots: 'silver', five_jackpots: 'gold', thirty_thousand_levels: 'iridescent'
};
function achievement(id, title, desc, kind, target, tierOverride, iconReward) {
  const index = ACHIEVEMENTS.length;
  const tier = tierOverride || ACHIEVEMENT_TIER_OVERRIDES[id] || ['bronze', 'silver', 'gold', 'platinum', 'iridescent'][Math.min(4, Math.floor(index / 13))];
  const info = ACHIEVEMENT_TIERS[tier];
  ACHIEVEMENTS.push({
    id, title, desc, kind, target, tier,
    masteryXp: info.masteryXp,
    reward: Object.assign({}, info.reward),
    iconReward: iconReward || ''
  });
}

// 60 readable milestones with escalating targets. None require a specific
// character, so the difficulty comes from commitment and collection rather
// than forcing a particular roster.
[
  ['first_battle', 'First Steps', 'Win 5 battles.', 'battleWin', 5],
  ['five_battles', 'Getting Started', 'Win 25 battles.', 'battleWin', 25],
  ['ten_battles', 'Battle Ready', 'Win 100 battles.', 'battleWin', 100],
  ['twenty_five_battles', 'Seasoned', 'Win 300 battles.', 'battleWin', 300],
  ['fifty_battles', 'Veteran', 'Win 1,000 battles.', 'battleWin', 1000],
  ['hundred_battles', 'Battle Machine', 'Win 2,500 battles.', 'battleWin', 2500],
  ['two_fifty_battles', 'Deep Fighter', 'Win 7,500 battles.', 'battleWin', 7500],
  ['five_hundred_battles', 'Battle Legend', 'Win 20,000 battles.', 'battleWin', 20000],
  ['seven_hundred_fifty_battles', 'Battle Icon', 'Win 50,000 battles.', 'battleWin', 50000],
  ['thousand_battles', 'Battle Myth', 'Win 150,000 battles.', 'battleWin', 150000],

  ['first_floor', 'First Floor', 'Secure 5 floors.', 'floorClear', 5],
  ['five_floors', 'Keep Moving', 'Secure 25 floors.', 'floorClear', 25],
  ['ten_floors', 'Downward Bound', 'Secure 100 floors.', 'floorClear', 100],
  ['twenty_five_floors', 'Deep Delver', 'Secure 300 floors.', 'floorClear', 300],
  ['fifty_floors', 'Lower Halls', 'Secure 1,000 floors.', 'floorClear', 1000],
  ['hundred_floors', 'Endless Habit', 'Secure 3,000 floors.', 'floorClear', 3000],
  ['two_fifty_floors', 'Depth Walker', 'Secure 7,500 floors.', 'floorClear', 7500],
  ['five_hundred_floors', 'The Long Descent', 'Secure 20,000 floors.', 'floorClear', 20000],

  ['one_toon', 'Open Roster', 'Unlock 3 Toons.', 'heroUnlock', 3],
  ['three_toons', 'Small Squad', 'Unlock 8 Toons.', 'heroUnlock', 8],
  ['five_toons', 'Full Formation', 'Unlock 15 Toons.', 'heroUnlock', 15],
  ['ten_toons', 'Growing Collection', 'Unlock 24 Toons.', 'heroUnlock', 24],
  ['twenty_toons', 'Crowded Locker', `Unlock ${Math.ceil(PLAYABLE_IDS.length * .8)} Toons.`, 'heroUnlock', Math.ceil(PLAYABLE_IDS.length * .8)],
  ['forty_toons', 'Big Roster', `Unlock ${PLAYABLE_IDS.length} Toons.`, 'heroUnlock', PLAYABLE_IDS.length],

  ['first_level', 'Growing Up', 'Gain 10 Toon levels.', 'heroLevel', 10],
  ['ten_levels', 'Training Time', 'Gain 100 Toon levels.', 'heroLevel', 100],
  ['twenty_five_levels', 'Steady Progress', 'Gain 400 Toon levels.', 'heroLevel', 400],
  ['fifty_levels', 'Well Practiced', 'Gain 1,000 Toon levels.', 'heroLevel', 1000],
  ['hundred_levels', 'Power Curve', 'Gain 3,000 Toon levels.', 'heroLevel', 3000],
  ['two_fifty_levels', 'Master Trainer', 'Gain 10,000 Toon levels.', 'heroLevel', 10000],

  ['first_pass_claim', 'Stamped', 'Claim 5 Battle Pass rewards.', 'passClaim', 5],
  ['five_pass_claims', 'Pass Collector', 'Claim 30 Battle Pass rewards.', 'passClaim', 30],
  ['ten_pass_claims', 'Moving Up', 'Claim 100 Battle Pass rewards.', 'passClaim', 100],
  ['twenty_five_pass_claims', 'Track Record', 'Claim 300 Battle Pass rewards.', 'passClaim', 300],
  ['fifty_pass_claims', 'Pass Complete', 'Claim 1,000 Battle Pass rewards.', 'passClaim', 1000],

  ['first_daily', 'Daily Delivery', 'Claim 7 daily rewards or orders.', 'dailyClaim', 7],
  ['three_dailies', 'Regular Customer', 'Claim 30 daily rewards or orders.', 'dailyClaim', 30],
  ['seven_dailies', 'Weekly Routine', 'Claim 100 daily rewards or orders.', 'dailyClaim', 100],
  ['fourteen_dailies', 'Reliable', 'Claim 365 daily rewards or orders.', 'dailyClaim', 365],
  ['thirty_dailies', 'Always Open', 'Claim 1,000 daily rewards or orders.', 'dailyClaim', 1000],

  ['streak_one', 'Day One', 'Reach a 7-day delivery streak.', 'dailyStreak', 7],
  ['streak_three', 'Three in a Row', 'Reach a 30-day delivery streak.', 'dailyStreak', 30],
  ['streak_seven', 'Perfect Week', 'Reach a 90-day delivery streak.', 'dailyStreak', 90],
  ['streak_fourteen', 'Fortnight', 'Reach a 365-day delivery streak.', 'dailyStreak', 365],

  ['journal_guide', 'Read the Rules', 'Discover the Journal guide.', 'glossaryDiscovery', 1, 'bronze'],
  ['journal_training', 'Study Up', 'Discover the Journal training section.', 'glossaryDiscovery', 2, 'silver'],
  ['journal_trinkets', 'Know Your Gear', 'Discover the Journal Trinket section.', 'glossaryDiscovery', 3, 'gold'],

  ['first_trinket_upgrade', 'First Forge', 'Upgrade 3 Trinkets.', 'trinketUpgrade', 3],
  ['three_trinket_upgrades', 'Better Bits', 'Upgrade 15 Trinkets.', 'trinketUpgrade', 15],
  ['ten_trinket_upgrades', 'Workshop Regular', 'Upgrade 50 Trinkets.', 'trinketUpgrade', 50],
  ['twenty_five_trinket_upgrades', 'Master Smith', 'Upgrade 200 Trinkets.', 'trinketUpgrade', 200],

  ['first_scratch', 'Lucky Scratch', 'Scratch 5 tapes.', 'scratch', 5],
  ['five_scratches', 'Prize Parade', 'Scratch 25 tapes.', 'scratch', 25],
  ['ten_scratches', 'Keep Scratching', 'Scratch 100 tapes.', 'scratch', 100],
  ['twenty_five_scratches', 'Ticket Taker', 'Scratch 300 tickets.', 'scratch', 300],
  ['fifty_scratches', 'Prize Expert', 'Scratch 1,000 tapes.', 'scratch', 1000],

  ['first_jackpot', 'Big Reveal', 'Hit 1 Scratch jackpot.', 'scratchJackpot', 1],
  ['three_jackpots', 'Jackpot Habit', 'Hit 5 Scratch jackpots.', 'scratchJackpot', 5],
  ['five_jackpots', 'Prize Parade Star', 'Hit 20 Scratch jackpots.', 'scratchJackpot', 20],
  ['thirty_thousand_levels', 'Level Voyager', 'Gain 25,000 Toon levels.', 'heroLevel', 25000]
].forEach(row => achievement(...row));

// Character-focused records are deliberately long-form. They reward building
// and replaying a team around a Toon instead of handing out an icon for one
// button press or one lucky encounter.
[
  ['craft_siblings', 'Craft Siblings', 'Win 25 battles with Goob and Scraps together.', 'craftSiblings', 25, 'gold'],
  ['that_pose_again', 'That Pose Again', 'Win 50 battles with Sprout on the team.', 'sproutWin', 50, 'platinum', 'achievement-sprout-pose'],
  ['griefer', 'Griefer', 'Let 25 full parties get wiped out.', 'partyWipe', 25, 'platinum'],
  ['baldifer_baldicus', 'Baldifer Baldicus', 'Defeat Twisted Dandy 10 times.', 'dandyDefeat', 10, 'iridescent', 'achievement-baldifer'],
  ['its_just_a_phase_mom', "It's Just a Phase, Mom.", 'Win 30 battles with Yatta and Blot together.', 'phaseTogether', 30, 'iridescent', 'achievement-yatta-blot']
].forEach(row => achievement(...row));

const Achievements = {
  list: ACHIEVEMENTS,
  tiers: ACHIEVEMENT_TIERS,

  state() {
    const root = Save.data.achievements || (Save.data.achievements = {});
    root.unlocked = root.unlocked && typeof root.unlocked === 'object' ? root.unlocked : {};
    root.stats = root.stats && typeof root.stats === 'object' ? root.stats : {};
    return root;
  },

  value(kind) { return Number(this.state().stats[kind]) || 0; },
  isUnlocked(id) { return !!this.state().unlocked[id]; },
  completed() { return this.list.filter(a => this.isUnlocked(a.id)); },
  progress(a) { return Math.min(a.target, this.value(a.kind)); },

  record(kind, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!kind || !amount) return 0;
    const st = this.state();
    st.stats[kind] = this.value(kind) + amount;
    const unlocked = this.evaluate();
    Save.write();
    return unlocked;
  },

  recordMax(kind, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!kind || !amount) return 0;
    const st = this.state();
    if (amount <= this.value(kind)) return 0;
    st.stats[kind] = amount;
    const unlocked = this.evaluate();
    Save.write();
    return unlocked;
  },

  recordBattleTeam(teamIds) {
    const team = new Set((teamIds || []).filter(Boolean));
    if (team.has('Goob') && team.has('Scraps')) this.record('craftSiblings', 1);
    if (team.has('Sprout')) this.record('sproutWin', 1);
    if (team.has('Yatta') && team.has('Blot')) this.record('phaseTogether', 1);
  },

  evaluate() {
    const st = this.state();
    let unlocked = 0;
    this.list.forEach(a => {
      if (st.unlocked[a.id] || this.value(a.kind) < a.target) return;
      st.unlocked[a.id] = Date.now();
      Save.give(masteryRewardBundle(a.reward), true);
      if (a.iconReward) {
        Save.data.profile = Save.data.profile || { iconUnlocks: [] };
        Save.data.profile.iconUnlocks = Array.isArray(Save.data.profile.iconUnlocks) ? Save.data.profile.iconUnlocks : [];
        if (!Save.data.profile.iconUnlocks.includes(a.iconReward)) Save.data.profile.iconUnlocks.push(a.iconReward);
      }
      Save.addMasteryXp(a.masteryXp);
      UI.toast(`${a.tier === 'iridescent' ? '🌈' : '🏆'} ${a.tier[0].toUpperCase() + a.tier.slice(1)} achievement: ${a.title}${a.iconReward ? ' · Profile icon unlocked' : ''}`);
      Sound.play(a.tier === 'iridescent' ? 'cheer_big' : 'get_rare');
      unlocked++;
    });
    return unlocked;
  },

  rewardText(a) {
    const parts = [`${fmt(a.masteryXp)} Mastery XP`];
    const reward = masteryRewardBundle(a.reward);
    Object.keys(reward).forEach(k => { if (RES[k]) parts.push(`${fmt(reward[k])} ${RES[k].name}`); });
    if (a.iconReward) parts.push('Profile icon');
    return parts.join(' · ');
  },

  tierCount(tier) { return this.list.filter(a => a.tier === tier && this.isUnlocked(a.id)).length; }
};
