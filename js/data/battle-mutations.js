/* Battle mutations shared by combat events and late Endless rooms. */
'use strict';

const BattleMutations = (() => {
  const families = [
    { id: 'heal', names: ['Limited Healing', 'Weakened Remedy', 'Fading Recovery', 'Healing Suppression'], values: [12, 20, 28, 36], text: n => `Your healing is reduced by ${n}%.` },
    { id: 'shield', names: ['Thin Shields', 'Worn Guard', 'Fractured Guard', 'Broken Guard'], values: [12, 20, 28, 36], text: n => `Your shields are ${n}% smaller.` },
    { id: 'energy', names: ['Slow Charge', 'Energy Drain', 'Disrupted Focus', 'Energy Suppression'], values: [10, 16, 22, 28], text: n => `Your Energy gains are reduced by ${n}%.` },
    { id: 'outgoing', names: ['Dulled Strikes', 'Faltering Blows', 'Weakened Assault', 'Severe Fatigue'], values: [8, 13, 18, 24], text: n => `Your damage is reduced by ${n}%.` },
    { id: 'incoming', names: ['Enemy Pressure', 'Coordinated Strikes', 'Relentless Assault', 'Crushing Force'], values: [10, 16, 23, 30], text: n => `Enemy damage is increased by ${n}%.` },
    { id: 'resist', names: ['Reinforced Foes', 'Hardened Defense', 'Fortified Armor', 'Iron Resolve'], values: [8, 13, 18, 24], text: n => `Enemies take ${n}% less damage.` },
    { id: 'enemyEnergy', names: ['Quickened Pace', 'Rapid Charge', 'Accelerated Recovery', 'Relentless Charge'], values: [12, 20, 28, 38], text: n => `Enemies gain ${n}% more Energy.` },
    { id: 'enemyHeal', names: ['Restorative Aid', 'Mending Surge', 'Deep Recovery', 'Sustained Renewal'], values: [15, 25, 35, 45], text: n => `Enemy healing is increased by ${n}%.` },
    { id: 'basic', names: ['Heavy Swings', 'Focused Strikes', 'Punishing Blows', 'Brutal Assault'], values: [12, 20, 28, 38], text: n => `Enemy basic attacks deal ${n}% more damage.` },
    { id: 'crit', names: ['Sharper Blows', 'Precise Strikes', 'Deadly Aim', 'Lethal Precision'], values: [15, 25, 35, 50], text: n => `Enemy critical hits deal ${n}% more damage.` },
    { id: 'wildStatus', names: ['Unstable Field', 'Shifting Conditions', 'Volatile Field', 'Total Disorder'], values: [16, 13, 10, 8], unit: 's', text: (n, tier) => `Every ${n}s, 1–3 living fighters gain a random status for ${tier + 4}s. Heroes get a debuff; enemies get a buff.` }
  ];
  const catalog = families.flatMap(f => f.names.map((name, tier) => ({
    id: `${f.id}-${tier + 1}`, family: f.id, name,
    tier: tier + 1, amount: f.values[tier], short: `${f.values[tier]}${f.unit || '%'}`, desc: f.text(f.values[tier], tier)
  })));
  const byId = Object.fromEntries(catalog.map(m => [m.id, m]));
  const resolve = ids => (ids || []).map(id => typeof id === 'string' ? byId[id] : id).filter(Boolean);
  const forEvent = (event, stage, wave = 1) => {
    if (!event || event.isDrawParents) return [];
    const count = Array.isArray(event.stageLevels) && event.stageLevels.length ? event.stageLevels.length : 8;
    const tier = Math.min(3, Math.floor(stage * 4 / count));
    const number = Math.min(5, 2 + Math.floor(stage * 4 / count));
    const eventOffset = event.isQOM ? 2 : event.isCookieRun ? 0
      : [...String(event.id || event.kind || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % (families.length - 1);
    const offset = (stage * 3 + (wave - 1) * 4 + eventOffset) % (families.length - 1);
    return [byId[`wildStatus-${tier + 1}`], ...Array.from({ length: number - 1 }, (_, i) => catalog[((offset + i * 3) % (families.length - 1)) * 4 + tier])];
  };
  const forRun = (floor, node, type) => {
    // Mutations begin after Floor 50. Elite and boss rooms always qualify;
    // ordinary patrols qualify only on every fifth floor.
    if (floor <= 50 || !['battle', 'elite', 'boss'].includes(type) || (type === 'battle' && floor % 5 !== 0)) return [];
    const tier = Math.min(3, Math.floor((floor - 51) / 15));
    const number = type === 'boss' ? 3 : type === 'elite' ? 2 : 1;
    const offset = (floor + node * 3 + (type === 'boss' ? 4 : 0)) % (families.length - 1);
    return [byId[`wildStatus-${tier + 1}`], ...Array.from({ length: number - 1 }, (_, i) => catalog[((offset + i * 3) % (families.length - 1)) * 4 + tier])];
  };
  const cards = (mutations, compact = false) => resolve(mutations).map(m =>
    `<div class="mutation-card${compact ? ' compact' : ''}"><small>TIER ${m.tier}</small><b>${m.name}</b><p>${m.desc}</p></div>`).join('');
  return { catalog, resolve, forEvent, forRun, cards };
})();
