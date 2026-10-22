/* status.js - every status effect in Dandy's Heroes.
   Each def may provide:
     mods(m, st, u)  -> mutate the stat-modifier bag during recompute
     flags           -> control flags merged while active
     tick(u, st, dt, B)
     onApply / onExpire / onDamaged(u,st,ev,B) / onDealDamage(u,st,ev,B)
   `kind`: buff | debuff | special. `cc:true` means Tenacity/CC-Res resist it. */
'use strict';

const STATUS = {

  /* Queens of Mischief: visible tempo, guard and spectral states. */
  qom_amp: { icon: '🎸', name: 'Amplification', kind: 'buff', max: 15,
    desc: 'Eclipse grows faster and tougher as the music gets louder.',
    mods: (m, s) => { const n = s.stacks; if (n >= 2) { m.aspdP += .16; m.msP += .12; }
      if (n >= 6) { m.defP += .22; m.dmgTaken -= .12; }
      if (n >= 10) { m.atkP += .28; m.critDmg += .25; }
      if (n >= 11) m.armorPen += .12;
      if (n >= 13) { m.dmgTaken -= .10; m.shieldPowP += .22; }
      if (n >= 15) { m.atkP += .16; m.critDmg += .20; } } },
  qom_feedback: { icon: '🔊', name: 'Feedback', kind: 'debuff',
    desc: 'Accuracy and Skill Haste reduced; using a Skill triggers guitar damage.',
    mods: m => { m.accP -= .22; m.cdr -= .22; } },
  qom_rattled: { icon: '⚡', name: 'Rattled', kind: 'debuff',
    desc: 'Attack and Armor reduced by Eclipse’s charging riff.',
    mods: m => { m.atkP -= .18; m.defP -= .20; } },
  qom_rattled_full: { icon: '⚡', name: 'Deeply Rattled', kind: 'debuff',
    desc: 'Attack and Armor heavily reduced by a Full Volume riff.',
    mods: m => { m.atkP -= .20; m.defP -= .34; } },
  qom_riff_speed: { icon: '⚡', name: 'Howling Riff', kind: 'buff',
    desc: 'Attack Speed and Evasion increased.', mods: m => { m.aspdP += .25; m.evaP += .22; } },
  qom_backstage_guard: { icon: '🎸', name: 'Backstage Guard', kind: 'buff', max: 5,
    desc: 'Repeated Skill hits build Armor and Magic Defense for Eclipse.',
    mods: (m, s) => { m.defP += .055 * s.stacks; m.mdefP += .055 * s.stacks; } },
  qom_sound_field: { icon: '🎹', name: 'Sound Field', kind: 'buff',
    desc: 'Ribecca’s keytar reduces incoming damage.', mods: m => { m.dmgTaken -= .20; } },
  qom_backstage_protected: { icon: '🎹', name: 'Backstage Protection', kind: 'buff',
    desc: 'Ribecca redirects some incoming damage from this ally.' },
  qom_standing_guard: { icon: '🎹', name: 'Standing Ovation', kind: 'buff',
    desc: 'Ribecca stands firm with heavy damage reduction.', mods: m => { m.dmgTaken -= .40; } },
  qom_keytar_fortify: { icon: '🎹', name: 'Keytar Fortification', kind: 'buff',
    desc: 'Armor and Magic Defense increased.', mods: m => { m.defP += .15; m.mdefP += .15; } },
  qom_energy_lock: { icon: '🎹', name: 'Unshaken Rhythm', kind: 'buff',
    desc: 'Energy cannot be removed.' },
  qom_opening_guard: { icon: '🛡', name: 'Shield Raised', kind: 'buff',
    desc: 'Soulvester takes less damage at the start of a wave.', mods: m => { m.dmgTaken -= .25; } },
  qom_parry_guard: { icon: '🛡', name: 'Perfect Parry', kind: 'buff',
    desc: 'Soulvester braces behind his shield.', mods: m => { m.dmgTaken -= .80; } },
  qom_last_stand: { icon: '⚔️', name: 'Last Stand', kind: 'buff',
    desc: 'Soulvester absorbs damage and resists Knockback.',
    mods: m => { m.dmgTaken -= .50; m.kbRes += 1; } },
  qom_royal_guard: { icon: '🛡', name: 'Royal Guard', kind: 'buff',
    desc: 'The protected ally takes less damage.', mods: m => { m.dmgTaken -= .30; } },
  qom_onbeat: { icon: '🥁', name: 'On Beat', kind: 'buff',
    desc: 'The next Skill deals more damage.',
    onDealDamage: (u, s, ev) => { if (!ev.basic && !ev.dot) ev.amount *= 1.22; } },
  qom_offbeat_skill: { icon: '🥁', name: 'Off Beat Skill', kind: 'debuff',
    desc: 'The next Skill deals less damage.',
    onDealDamage: (u, s, ev) => { if (!ev.basic && !ev.dot) ev.amount *= .78; } },
  qom_sweet_surprise: { icon: '🍬', name: 'Sweet Surprise', kind: 'buff',
    desc: 'Attack and Attack Speed increased.', mods: m => { m.atkP += .22; m.aspdP += .22; } },
  qom_sugar_rush: { icon: '🍬', name: 'Sugar Rush', kind: 'buff',
    desc: 'Skill Haste and Energy generation increased.', mods: m => { m.cdr += .22; m.energyGen += .28; } },
  qom_candy_coating: { icon: '🍬', name: 'Candy Coating', kind: 'buff',
    desc: 'Damage taken reduced.', mods: m => { m.dmgTaken -= .18; } },
  qom_second_helping: { icon: '🍬', name: 'Second Helping', kind: 'buff',
    desc: 'The next Skill becomes ready sooner.' },
  qom_encore: { icon: '🥁', name: 'Encore', kind: 'buff', max: 8,
    desc: 'Gourdy’s measures strengthen his rhythm and Skill Haste.',
    mods: (m, s) => { m.cdr += .035 * s.stacks; } },
  qom_offbeat: { icon: '🎵', name: 'Offbeat', kind: 'debuff',
    desc: 'Attack Speed and Accuracy reduced.', mods: m => { m.aspdP -= .20; m.accP -= .15; } },
  qom_treat: { icon: '🍬', name: 'Treat', kind: 'buff',
    desc: 'A candy boost to Attack and Skill Haste.', mods: m => { m.atkP += .18; m.aspdP += .16; m.cdr += .15; } },
  qom_trick: { icon: '🍭', name: 'Trick', kind: 'debuff',
    desc: 'Accuracy and Energy generation reduced.', mods: m => { m.accP -= .22; m.energyGen -= .30; } },
  qom_resonance: { icon: '🎹', name: 'Resonance', kind: 'buff', max: 5,
    desc: 'Ribecca turns damage absorbed by her barrier into a counter wave.' },
  qom_resilience: { icon: '🦴', name: 'Undead Resilience', kind: 'buff', max: 5,
    desc: 'Resisted debuffs increase Armor and Magic Defense.',
    mods: (m, s) => { m.defP += .05 * s.stacks; m.mdefP += .05 * s.stacks; } },
  qom_challenged: { icon: '⚔️', name: 'Challenged', kind: 'debuff',
    desc: 'Deals less damage to anyone other than Soulvester.',
    onDealDamage: (u, s, ev) => { if (ev.target !== s.src) ev.amount *= .80; } },
  qom_valor: { icon: '🛡', name: 'Valor', kind: 'buff', max: 5,
    desc: 'Soulvester’s Armor and counterattack damage rise.', mods: (m, s) => { m.defP += .05 * s.stacks; } },
  qom_resolve: { icon: '👑', name: 'Knightly Resolve', kind: 'buff', max: 3,
    desc: 'Successful guards improve Soulvester’s Damage Reduction.',
    mods: (m, s) => { m.dmgTaken -= .06 * s.stacks; } },
  qom_notes: { icon: '👻', name: 'Phantom Notes', kind: 'buff', max: 8,
    desc: 'Stored notes increase Connie’s Evasion and empower her Skills.',
    mods: (m, s) => { m.evaP += .03 * s.stacks; if (s.stacks >= 4) { m.atkP += .15; m.cdr += .15; }
      if (s.stacks >= 8) { m.dmgTaken -= .30; m.critDmg += .25; } } },
  qom_headliner: { icon: '🎤', name: 'Spectral Headliner', kind: 'buff',
    desc: 'Connie holds her peak spectral power after Ghostly Ovation.',
    mods: m => { m.dmgTaken -= .30; m.critDmg += .25; m.evaP += .12; } },
  qom_haunted: { icon: '👁', name: 'Haunted', kind: 'debuff',
    desc: 'Accuracy reduced; deals less damage to Connie.', mods: m => { m.accP -= .22; },
    onDealDamage: (u, s, ev) => { if (ev.target === s.src) ev.amount *= .80; } },
  qom_possessed: { icon: '🕯', name: 'Possessed', kind: 'debuff',
    desc: 'Attack Speed and Skill Haste reduced; Skills provoke spectral damage.',
    mods: m => { m.aspdP -= .25; m.cdr -= .25; } },
  qom_untouchable: { icon: '🌫', name: 'Untouchable', kind: 'buff',
    desc: 'Connie’s Evasion and phantom counter healing increase.', mods: m => { m.evaP += .28; } },
  qom_ovation_buff: { icon: '🎤', name: 'Ghostly Ovation', kind: 'buff',
    desc: 'Allies gain Attack, Movement Speed, and Skill Haste.',
    mods: m => { m.atkP += .30; m.msP += .25; m.cdr += .20; } },

  /* ============ POSITIVE ============ */
  shield: { icon: '🛡', name: 'Shield', kind: 'buff', desc: 'Absorbs damage before HP.', stackVal: true },
  statshare: { icon: '🔗', name: 'Shared Stats', kind: 'buff', desc: 'Shares part of the source\'s Attack, Magic Attack, Defense, Magic Defense, and Attack Speed.',
    mods: (m, s, u) => {
      const source = s.src;
      if (!source || source === u || !source.st || !u.baseStats) return;
      const share = clamp(Number(s.val) || .05, .02, .16);
      m.atkP += clamp((source.st.atk / Math.max(1, u.baseStats.atk)) * share, 0, .28);
      m.magP += clamp((source.st.mag / Math.max(1, u.baseStats.mag)) * share, 0, .28);
      m.defP += clamp((source.st.def / Math.max(1, u.baseStats.def)) * share, 0, .24);
      m.mdefP += clamp((source.st.mdef / Math.max(1, u.baseStats.mdef)) * share, 0, .24);
      m.aspdP += clamp((source.st.aspd / Math.max(.15, u.baseStats.aspd)) * share, 0, .20);
    } },
  atkup: { icon: '⚔', name: 'Attack Up', kind: 'buff', max: 3, desc: 'Attack +18% per stack.',
    mods: (m, s) => { m.atkP += .18 * s.stacks; } },
  mdefup: { icon: '🔰', name: 'Magic Defense Up', kind: 'buff', max: 3, desc: 'Magic Defense +18% per stack.',
    mods: (m, s) => { m.mdefP += .18 * s.stacks; } },
  magup: { icon: '✨', name: 'Magic Up', kind: 'buff', max: 3, desc: 'Magic Attack +18% per stack.',
    mods: (m, s) => { m.magP += .18 * s.stacks; } },
  speedup: { icon: '🏃', name: 'Speed Up', kind: 'buff', max: 3, desc: 'Attack Speed +15%, Move +18% per stack.',
    mods: (m, s) => { m.aspdP += .15 * s.stacks; m.msP += .18 * s.stacks; } },
  haste: { icon: '💨', name: 'Haste', kind: 'buff', max: 2, desc: 'Cooldowns recover 25% faster per stack.',
    mods: (m, s) => { m.cdr += .25 * s.stacks; } },
  accup: { icon: '🎯', name: 'Accuracy Up', kind: 'buff', max: 2, desc: 'Accuracy +30%.',
    mods: (m, s) => { m.accP += .30 * s.stacks; } },
  regen: { icon: '💚', name: 'Regeneration', kind: 'buff', desc: 'Heals every second.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1; B.heal(s.src || u, u, s.val || u.max.hp * .03, { silent: true, tag: 'regen' }); } } },
  inspire: { icon: '🌞', name: 'Inspire', kind: 'buff', desc: 'All damage +15%, Energy gain +40%.',
    mods: m => { m.dmgDealt += .15; m.energyGen += .40; } },
  inspired: { icon: '🌞', name: 'Inspired', kind: 'buff', desc: 'Skill damage +15%, cooldowns recover faster, Energy gain +30%, and healing power +25%.',
    mods: m => { m.cdr += .18; m.energyGen += .30; m.healPowP += .25; },
    onDealDamage: (u, s, ev) => { if (!ev.basic) ev.amount *= 1.15; } },
  lucky: { icon: '🍀', name: 'Lucky', kind: 'buff', desc: 'Crit Chance +25%, Evasion +12%.',
    mods: m => { m.crit += .25; m.evaP += .12; } },
  reflect: { icon: '🪞', name: 'Reflect', kind: 'buff', desc: 'Returns 30% of damage taken.',
    onDamaged: (u, s, ev, B) => { if (ev.src && ev.src.team !== u.team && !ev.reflected)
      B.damage(u, ev.src, ev.amount * .30, { type: 'true', reflected: true, tag: 'reflect' }); } },
  fortify: { icon: '🧱', name: 'Fortify', kind: 'buff', max: 5, desc: 'Defense & Magic Defense +12% per stack.',
    mods: (m, s) => { m.defP += .12 * s.stacks; m.mdefP += .12 * s.stacks; } },
  ward: { icon: '🔰', name: 'Ward', kind: 'buff', desc: 'Damage taken reduced 30%.', mods: m => { m.dmgTaken -= .30; } },
  ccimmune: { icon: '⚓', name: 'Unshakable', kind: 'buff', desc: 'Immune to crowd control.',
    flags: { ccImmune: true } },
  untargetable: { icon: '👻', name: 'Ethereal', kind: 'buff', desc: 'Cannot be targeted.',
    flags: { untargetable: true } },
  stealth: { icon: '🫥', name: 'Hidden', kind: 'buff', desc: 'Untargetable until it attacks. Next hit crits.',
    flags: { untargetable: true },
    onDealDamage: (u, s, ev, B) => { ev.forceCrit = true; B.removeStatus(u, 'stealth'); } },
  lifesteal: { icon: '🧛', name: 'Siphon', kind: 'buff', desc: 'Heals for 30% of damage dealt.',
    onDealDamage: (u, s, ev, B) => { B.heal(u, u, ev.amount * .30, { silent: true, tag: 'siphon' }); } },
  thorns: { icon: '🌵', name: 'Thorns', kind: 'buff', desc: 'Melee attackers take damage.',
    onDamaged: (u, s, ev, B) => { if (ev.melee && ev.src) B.damage(u, ev.src, (s.val || u.max.def * 1.2), { type: 'true', tag: 'thorns' }); } },
  overcharge: { icon: '🔋', name: 'Overcharge', kind: 'buff', desc: 'Energy generation doubled.',
    mods: m => { m.energyGen += 1; } },
  focus: { icon: '🔎', name: 'Focus', kind: 'buff', desc: 'Armor & Magic Penetration +25%.',
    mods: m => { m.armorPen += .25; m.magPen += .25; } },
  artfury: { icon: '✂️', name: 'Sharp Inspiration', kind: 'buff', desc: 'Attack +24% and Critical Damage +35%.',
    mods: m => { m.atkP += .24; m.critDmg += .35; } },
  rally: { icon: '📣', name: 'Rally', kind: 'buff', desc: 'Healing given and received +35%.',
    mods: m => { m.healPowP += .35; m.healRecv += .35; } },
  sweetsupport: { icon: '🍪', name: 'Sweet Support', kind: 'buff',
    desc: 'Attack Speed, Skill Haste, and Healing Received are increased.',
    mods: m => { m.aspdP += .18; m.cdr += .22; m.healRecv += .22; } },
  freshlybaked: { icon: '🧁', name: 'Freshly Baked', kind: 'buff',
    desc: 'Ginger’s treat clears up to two negative statuses when received and improves Crowd Control Resistance.',
    mods: m => { m.ccRes += .12; },
    onApply: (u, s, B) => { B.cleanse(u, 2); } },
  tenacity: { icon: '🛡️', name: 'Tenacity', kind: 'buff',
    desc: 'Crowd Control Resistance increased by 20% and periodic/DoT damage taken reduced by 15%.',
    mods: m => { m.ccRes += .20; m.dmgTaken -= .15; } },
  float: { icon: '🎈', name: 'Float', kind: 'buff', desc: 'Immune to Root and ground effects, Evasion +20%.',
    flags: { airborne: true }, mods: m => { m.evaP += .20; } },
  secondwind: { icon: '🕊', name: 'Second Wind', kind: 'buff', desc: 'Survives one lethal blow at 15% HP.' },
  receptive: { icon: '💞', name: 'Receptive', kind: 'buff', desc: 'Healing received is increased.',
    mods: (m, s) => { m.healRecv += s.val || .24; } },
  sparkle: { icon: '✨', name: 'Sparkle', kind: 'buff', max: 5, desc: 'Phantasia’s spell momentum. Skill Haste rises with each stack.',
    mods: (m, s) => { m.cdr += .055 * s.stacks; } },
  computerwish: { icon: '💻', name: 'Computer Spell', kind: 'buff', desc: 'Skill Haste and Energy generation increased.',
    mods: m => { m.cdr += .24; m.energyGen += .32; } },
  speedwish: { icon: '🏃', name: 'Speed Spell', kind: 'buff', desc: 'Attack Speed and Movement Speed increased.',
    mods: m => { m.aspdP += .25; m.msP += .28; } },
  braverywish: { icon: '🛡', name: 'Bravery Spell', kind: 'buff', desc: 'Attack, Defense, and Magic Defense increased.',
    mods: m => { m.atkP += .18; m.magP += .18; m.defP += .20; m.mdefP += .20; } },
  comforted: { icon: '🧸', name: 'Comforted', kind: 'buff', desc: 'Takes slightly less damage and receives stronger healing.',
    mods: (m, s) => { m.dmgTaken -= s.val || .07; m.healRecv += s.overheal || .15; } },
  hugline: { icon: '🤝', name: 'Hug Line', kind: 'special', desc: 'Temporarily connected to Goob by his stretchy arms.' },
  performance: { icon: '🎭', name: 'Performance', kind: 'buff', max: 4,
    desc: 'Razzle & Dazzle are building their act. At maximum stacks, their next skill performs both sides.' },

  /* A soft answer to buff-heavy enemies. Each stack blocks one hostile buff
     application, then is consumed. It is deliberately cleanseable so this is
     counterplay, not a permanent shutdown. */
  buffsealed: { icon: '🚫', name: 'Buff Sealed', kind: 'debuff', max: 3,
    desc: 'The next hostile buff applied to this unit is prevented. Consumes one stack.' },
  stratigraphy: { icon: '🔍', name: 'Stratigraphy', kind: 'debuff', max: 5,
    desc: 'Geological analysis exposes weaknesses: Magic Defense and Crit Resistance reduced.',
    mods: (m, s) => { m.mdefP -= 0.08 * (s.stacks || 1); m.critDmgTaken = (m.critDmgTaken || 0) + 0.06 * (s.stacks || 1); } },
  fullyresearched: { icon: '🦴', name: 'Fully Researched', kind: 'debuff',
    desc: 'Paleontological analysis complete: deals 20% less damage and takes 30% increased skill damage.',
    mods: m => { m.dmgDealt -= 0.20; m.dmgTaken += 0.15; },
    onDamaged: (u, s, ev, B) => { if (!ev.basic && !ev.dot) ev.amount *= 1.30; } },
  amberstasis: { icon: '💎', name: 'Amber Stasis', kind: 'buff',
    desc: 'Preserved inside prehistoric amber: immune to all damage and debuffs.',
    flags: { ccImmune: true, untargetable: true } },
  invulnerable: { icon: '⭐', name: 'Invulnerable', kind: 'buff',
    desc: 'Immune to all incoming damage and crowd control.',
    flags: { ccImmune: true, invulnerable: true },
    onDamaged: (u, s, ev) => { ev.amount = 0; } },
  haunted: { icon: '👻', name: 'Haunted', kind: 'debuff',
    desc: 'Afflicted by poltergeist mischief: Accuracy and Attack Speed reduced by 15%. Takes increased Magic Damage.',
    mods: m => { m.accP -= .15; m.aspdP -= .15; } },
  terrified: { icon: '😱', name: 'Terrified', kind: 'debuff', cc: true,
    desc: 'Terrified by Connie’s jumpscare: Accuracy and Attack Speed reduced by 30%.',
    mods: m => { m.accP -= .30; m.aspdP -= .30; } },

  /* ---- sealed-world office machine mechanics ----
     These live in the shared catalog (rather than being appended by the
     encounter file) so tooltips, tags, cleanse/dispel checks, and the status
     reference all describe them consistently. */
  businessmark: { icon: '📎', name: 'Marked for Business', kind: 'debuff',
    desc: 'Defense is reduced and the marker deals more damage.',
    mods: m => { m.defP -= .16; m.dmgTaken += .10; } },
  evadown: { icon: '🎯', name: 'Evasion Down', kind: 'debuff',
    desc: 'Evasion is reduced.', mods: m => { m.evaP -= .20; } },
  confusedtestimony: { icon: '🗣', name: 'Confused Testimony', kind: 'debuff',
    desc: 'Power gain and Evasion are reduced.',
    mods: m => { m.energyGen -= .28; m.evaP -= .18; } },
  leadmark: { icon: '✏', name: 'Lead Mark', kind: 'debuff',
    desc: 'Takes more damage from the marker and has reduced Evasion.',
    mods: m => { m.dmgTaken += .12; m.evaP -= .16; } },
  convicted: { icon: '⚖', name: 'Convicted', kind: 'debuff',
    desc: 'Defense and Magic Defense are reduced. Taking damage removes Power.',
    mods: m => { m.defP -= .24; m.mdefP -= .24; },
    onDamaged: (u, s, ev, B) => { if (!ev.dot && ev.amount > 0) B.energy(u, -9); } },

  /* ============ NEGATIVE - damage over time ============ */
  burn: { icon: '🔥', name: 'Burn', kind: 'debuff', max: 5, desc: 'Magic damage per second. Reduces healing received.',
    mods: m => { m.healRecv -= .30; },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, (s.val || 1) * s.stacks, { type: 'magic', dot: true, tag: 'burn' }); } } },
  poison: { icon: '☠', name: 'Poison', kind: 'debuff', max: 8, desc: 'Damage per second that ignores Defense. Stacks high.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, (s.val || 1) * s.stacks, { type: 'true', dot: true, tag: 'poison' }); } } },
  bleed: { icon: '🗡️', name: 'Rend', kind: 'debuff', max: 6, desc: 'Damage over time, doubled while the target moves.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= .5) { s.acc -= .5;
      B.damage(s.src, u, (s.val || 1) * s.stacks * (u.moving ? 1 : .5), { type: 'physical', dot: true, tag: 'rend' }); } } },
  corrode: { icon: '🧪', name: 'Corrode', kind: 'debuff', max: 5, desc: 'Defense drops further every second.',
    mods: (m, s) => { m.defP -= .09 * s.stacks; m.mdefP -= .09 * s.stacks; },
    tick: (u, s, dt) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1.5) { s.acc -= 1.5; s.stacks = Math.min(s.stacks + 1, 5); u.dirty = true; } } },
  doom: { icon: '💀', name: 'Doom', kind: 'debuff', cc: true, desc: 'Instantly defeated when the timer runs out.',
    onExpire: (u, s, B) => { if (u.alive) { B.log(u.name + ' succumbs to Doom.'); Sound.play('banish');
      B.damage(s.src, u, u.hp + 1, { type: 'true', tag: 'doom' }); } } },

  /* ============ NEGATIVE - hard control ============ */
  stun: { icon: '😵', name: 'Stun', kind: 'debuff', cc: true, desc: 'Cannot act or move.',
    flags: { noAct: true, noMove: true } },
  freeze: { icon: '🧊', name: 'Freeze', kind: 'debuff', cc: true, desc: 'Cannot act. Takes 40% more physical damage; shatters on a critical hit.',
    flags: { noAct: true, noMove: true },
    onDamaged: (u, s, ev, B) => {
      if (ev.type === 'physical') ev.amount *= 1.4;
      if (ev.crit) { Sound.play('icebreak'); B.removeStatus(u, 'freeze'); ev.amount *= 1.3; B.fxShatter(u); } } },
  sleep: { icon: '💤', name: 'Sleep', kind: 'debuff', cc: true, desc: 'Cannot act. Heavy damage wakes the target, leaving it Groggy.',
    flags: { noAct: true, noMove: true },
    onDamaged: (u, s, ev, B) => { if (ev.amount > u.max.hp * .07 && !ev.dot) {
      B.removeStatus(u, 'sleep'); B.applyStatus(s.src, u, 'groggy', s.groggyDur || 4); } },
    onExpire: (u, s, B) => { if (s.src) B.applyStatus(s.src, u, 'groggy', s.groggyDur || 4); } },
  petrify: { icon: '🪨', name: 'Petrify', kind: 'debuff', cc: true, desc: 'Cannot act, but takes 45% less damage.',
    flags: { noAct: true, noMove: true }, mods: m => { m.dmgTaken -= .45; } },
  root: { icon: '⛓', name: 'Root', kind: 'debuff', cc: true, desc: 'Cannot move. Can still attack.',
    flags: { noMove: true } },
  fear: { icon: '😱', name: 'Fear', kind: 'debuff', cc: true, desc: 'Flees from the enemy and cannot attack.',
    flags: { noAct: true, flee: true } },
  taunt: { icon: '🎭', name: 'Taunt', kind: 'debuff', cc: true, desc: 'Forced to attack the taunting unit.',
    flags: { taunted: true } },
  confusion: { icon: '💫', name: 'Confusion', kind: 'debuff', cc: true, desc: '50% chance to strike its own allies.',
    flags: { confused: true } },
  charm: { icon: '💘', name: 'Charm', kind: 'debuff', cc: true, desc: 'Fights for the other side.',
    flags: { charmed: true } },
  silence: { icon: '🔇', name: 'Silence', kind: 'debuff', cc: true, desc: 'Cannot use any skill.',
    flags: { silenced: true } },
  disarm: { icon: '🚫', name: 'Disarm', kind: 'debuff', cc: true, desc: 'Cannot use basic attacks.',
    flags: { disarmed: true } },
  launch: { icon: '🌪', name: 'Launch', kind: 'debuff', cc: true, desc: 'Thrown into the air, helpless.',
    flags: { noAct: true, noMove: true, airborne: true } },

  /* ============ NEGATIVE - soft control / stat ============ */
  slow: { icon: '🐢', name: 'Slow', kind: 'debuff', max: 3, desc: 'Move & Attack Speed -18% per stack.',
    mods: (m, s, u) => { const r = 1 - (u && u.slowResist || 0);
      m.msP -= .18 * s.stacks * r; m.aspdP -= .18 * s.stacks * r; } },
  blind: { icon: '🌑', name: 'Blind', kind: 'debuff', desc: 'Accuracy -45%. Cannot critically hit.',
    mods: m => { m.accP -= .45; m.crit -= 2; } },
  defdown: { icon: '💔', name: 'Defense Down', kind: 'debuff', max: 3, desc: 'Defense -20% per stack.',
    mods: (m, s) => { m.defP -= .20 * s.stacks; } },
  magdown: { icon: '🪫', name: 'Resist Down', kind: 'debuff', max: 3, desc: 'Magic Defense -20% per stack.',
    mods: (m, s) => { m.mdefP -= .20 * s.stacks; } },
  weaken: { icon: '🥀', name: 'Weaken', kind: 'debuff', max: 3, desc: 'All damage dealt -16% per stack.',
    mods: (m, s) => { m.dmgDealt -= .16 * s.stacks; } },
  attackdown: { icon: '📉', name: 'Attack Down', kind: 'debuff', desc: 'Attack is reduced.',
    mods: (m, s) => { m.atkP -= s.val || .22; } },
  armslow: { icon: '🫳', name: 'Tangled Arms', kind: 'debuff', desc: 'Attack Speed is reduced.',
    mods: m => { m.aspdP -= .20; } },
  exposed: { icon: '🎯', name: 'Exposed', kind: 'debuff', max: 3, desc: 'Takes 14% more damage per stack.',
    mods: (m, s) => { m.dmgTaken += .14 * s.stacks; } },
  grief: { icon: '🥺', name: 'Grief', kind: 'debuff', desc: 'Healing received cut by 60%.',
    mods: m => { m.healRecv -= .60; } },
  drain: { icon: '🕳', name: 'Energy Drain', kind: 'debuff', desc: 'Generates no Energy.',
    mods: m => { m.energyGen -= 5; } },
  groggy: { icon: '😪', name: 'Groggy', kind: 'debuff', desc: 'Damage dealt -35% and Energy gain halved.',
    mods: m => { m.dmgDealt -= .35; m.energyGen -= .5; } },
  shock: { icon: '⚡', name: 'Shock', kind: 'debuff', max: 4, desc: 'Chains damage to nearby units when hit.',
    onDamaged: (u, s, ev, B) => { if (ev.dot || ev.chained) return;
      const near = B.alliesOf(u).filter(a => a !== u && Math.abs(a.x - u.x) < 150 && a.alive);
      if (near.length) { Sound.play('shock', { vol: .5 });
        near.slice(0, s.stacks).forEach(a => B.damage(s.src, a, ev.amount * .22, { type: 'magic', chained: true, tag: 'shock' })); } } },
  curse: { icon: '🌑', name: 'Curse', kind: 'debuff', desc: 'Buffs applied to this unit are destroyed on arrival.',
    flags: { cursed: true } },
  unstable: { icon: '🎲', name: 'Unstable', kind: 'debuff', desc: 'Explodes for heavy damage when it expires or the unit falls.',
    onExpire: (u, s, B) => { Sound.play('explode');
      B.aoe(s.src, u.x, 170, u.team, (s.val || 200), { type: 'magic', tag: 'unstable' }); B.fxBoom(u.x, u.y, 1.2, '#ff7ad6'); } },
  mutation: { icon: '🧬', name: 'Mutation', kind: 'debuff', desc: 'Random stat is crippled each second.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 2) { s.acc -= 2;
      B.applyStatus(s.src, u, pick(['defdown', 'magdown', 'weaken', 'slow']), 5); } } },
  marked: { icon: '📌', name: 'Marked', kind: 'debuff', desc: 'Allies of the marker prioritise this target and crit it more often.' },
  tangled: { icon: '🕸', name: 'Tangled', kind: 'debuff', desc: 'Cannot gain Move Speed; Defense -25%.',
    mods: m => { m.defP -= .25; m.noMsGain = true; } },
  messy: { icon: '🎨', name: 'Messy', kind: 'debuff', desc: 'Takes 25% more damage from everything.',
    mods: m => { m.dmgTaken += .25; } },
  frayed: { icon: '🧵', name: 'Frayed', kind: 'debuff', max: 3,
    desc: 'Scraps has pulled the target apart. Damage taken +8% and Crowd Control Resistance -12% per stack.',
    mods: (m, s) => { m.dmgTaken += .08 * s.stacks; m.ccRes -= .12 * s.stacks; } },
  scraps_craftbeat: { icon: '✂️', name: 'Craft Beat', kind: 'buff',
    desc: 'Inside Scraps’ Craft Circle. Attack Speed is increased.',
    mods: (m, s) => { m.aspdP += s.val || .08; } },
  drowsy: { icon: '🌙', name: 'Drowsy', kind: 'debuff', desc: 'Attack Speed -25%, cooldowns recover 25% slower.',
    mods: m => { m.aspdP -= .25; m.cdr -= .25; } },
  panic: { icon: '❗', name: 'Panic', kind: 'debuff', desc: 'Accuracy -25% and Energy gain -50%.',
    mods: m => { m.accP -= .25; m.energyGen -= .5; } },
  predicted: { icon: '🔮', name: 'Predicted', kind: 'debuff', desc: 'Phantasia has foreseen this enemy’s approach. Accuracy and Movement Speed reduced.',
    mods: m => { m.accP -= .22; m.msP -= .18; } },
  misplaced: { icon: '🧹', name: 'Misplaced', kind: 'debuff',
    desc: 'Tisha has forced this unit out of formation. Accuracy, Evasion, and Skill Haste reduced.',
    mods: m => { m.accP -= .25; m.evaP -= .16; m.cdr -= .20; } },
  offrhythm: { icon: '🎵', name: 'Off Rhythm', kind: 'debuff', max: 3,
    desc: 'Accuracy and Skill Haste are reduced. At maximum stacks, the target becomes Disjointed.',
    mods: (m, s) => { m.accP -= .12 * s.stacks; m.cdr -= .10 * s.stacks; } },
  disjointed: { icon: '🦴', name: 'Disjointed', kind: 'debuff',
    desc: 'The next Skill is delayed and the next attack deals reduced damage.',
    mods: m => { m.dmgDealt -= .18; m.cdr -= .22; } },
  dustcloud: { icon: '🌫', name: 'Dust Cloud', kind: 'debuff',
    desc: 'Takes Physical Damage over time and has heavily reduced Accuracy.',
    mods: m => { m.accP -= .34; },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, s.val || 1, { type: 'physical', dot: true, tag: 'Dust Cloud' }); } } },
  dustjam: { icon: '🪶', name: 'Dust Jam', kind: 'debuff',
    desc: 'The next Basic Attack is interrupted by Tisha’s feather duster.', flags: { disarmed: true } },
  sortedformation: { icon: '📏', name: 'Sorted Formation', kind: 'debuff',
    desc: 'Tisha has assigned this unit to a row. Leaving it causes an immediate sweep.',
    mods: m => { m.msP -= .18; } },
  cleanstep: { icon: '✨', name: 'Clean Step', kind: 'buff',
    desc: 'Crossing Tisha’s Clean Line grants increased Movement Speed.', mods: m => { m.msP += .28; } },
  cleanfocus: { icon: '🎯', name: 'Clear View', kind: 'buff',
    desc: 'Attacks against enemies inside Dust Cloud are more accurate.' },
  ribecca_evasion: { icon: '🌫', name: 'Uneven Step', kind: 'buff',
    desc: 'Ribecca moves unpredictably, increasing her Evasion.', mods: m => { m.evaP += .18; } },
  ribecca_unbothered: { icon: '🦴', name: 'Unbothered', kind: 'buff', max: 12,
    desc: 'Each ignored opening grants Armor, Magic Defense, and Crowd Control Resistance.',
    mods: (m, s) => { m.defP += .035 * s.stacks; m.mdefP += .035 * s.stacks; m.ccRes += .04 * s.stacks; } },

  dazzled: { icon: '✨', name: 'Dazzled', kind: 'debuff',
    desc: 'Accuracy and Skill Haste are reduced while Glisten keeps the spotlight on the target.',
    mods: m => { m.accP -= .22; m.cdr -= .18; } },
  glisten_audience: { icon: '🪞', name: 'Mirror Audience', kind: 'debuff',
    desc: 'Glisten’s priority target. His attacks deal more damage to it.',
    onDamaged: (u, s, ev) => { if (ev.src === s.src) ev.amount *= 1 + (s.val || .1); } },
  glisten_dizzy: { icon: '💫', name: 'Dizzy', kind: 'debuff',
    desc: 'Travel through a mirror briefly lowers Glisten’s Accuracy and Move Speed.',
    mods: m => { m.accP -= .18; m.msP -= .15; } },

  /* ============ DELILAH'S EXPERIMENT ============ */
  delilah_read: { icon: '🔍', name: 'Read Pattern', kind: 'debuff',
    desc: 'Delilah has mapped this target’s movement. Delilah and her samples cannot be Dodged by it.' },
  testsubject: { icon: '🧪', name: 'Test Subject', kind: 'debuff',
    desc: 'Delilah has logged this target. Her control is harder to resist.' },
  contamination: { icon: '☣', name: 'Contamination', kind: 'debuff',
    desc: 'Attack Speed, Move Speed, and Crowd Control Resistance reduced. Cleansing it causes a Stun.',
    mods: m => { m.aspdP -= .24; m.msP -= .24; m.ccRes -= .24; } },
  sterileprotocol: { icon: '🧼', name: 'Sterile Protocol', kind: 'buff',
    desc: 'Delilah’s protocol clears up to two negative statuses when received and improves Crowd Control Resistance.',
    mods: m => { m.ccRes += .14; },
    onApply: (u, s, B) => { B.cleanse(u, 2); } },
  contained: { icon: '⛓', name: 'Contained', kind: 'debuff', cc: true,
    desc: 'Cannot move. Attack and Skill Haste reduced.',
    flags: { noMove: true }, mods: m => { m.dmgDealt -= .28; m.cdr -= .32; } },
  failedvariable: { icon: '⚠', name: 'Failed Variable', kind: 'debuff',
    desc: 'Killed a Twisted sample and will be pursued by Delilah\'s next one.' },
  ichorspill: { icon: '🩸', name: 'Ichor Spill', kind: 'special',
    desc: 'A volatile pool left by a defeated test sample.' },

  /* ============ DANDY'S ATTENTION ============ */
  attention: { icon: '👁', name: 'Attention', kind: 'special', max: 5,
    desc: 'This enemy has been focusing Dandy. He takes less damage from them.' },
  neglect: { icon: '❗', name: 'Neglect', kind: 'special', max: 5,
    desc: 'This enemy has been ignoring Dandy. At maximum stacks, Dandy hunts them.',
    mods: (m, s) => { if (s.stacks >= 5) { m.defP -= .24; m.noMsGain = true; } } },
  composed: { icon: '🛍', name: 'Composed', kind: 'buff',
    desc: 'Dandy is closing the shop: damage taken reduced.', mods: m => { m.dmgTaken -= .18; } },
  distortion: { icon: '🎭', name: 'Distortion', kind: 'buff',
    desc: 'The mascot slips. Attack rises sharply; Damage taken falls; crowd control and knockback fail.',
    flags: { ccImmune: true }, mods: (m, s, u) => { m.atkP += .58; m.dmgTaken -= u && u.twisted ? .28 : .46; } },

  /* ============ PEBBLE'S CHASE ============ */
  excited: { icon: '🐾', name: 'Excited', kind: 'buff', max: 5,
    desc: 'Each stack raises Movement Speed and Armor while Pebble keeps moving.',
    mods: (m, s, u) => { m.msP += (u.pebbleExcitedMove || .055) * s.stacks; m.defP += (u.pebbleExcitedArmor || .065) * s.stacks; } },
  loudandproud: { icon: '📣', name: 'Speak!', kind: 'buff',
    desc: 'Max HP and Evasion raised while every enemy tries to catch Pebble.',
    mods: (m, s, u) => { m.hpP += u.pebbleSpeakHp || .24; m.evaP += u.pebbleSpeakEva || .30;
      if (u.pebbleGoodBoy) m.dmgTaken -= u.pebbleSpeakDR || .20; } },
  rattledaim: { icon: '🐶', name: 'Rattled Aim', kind: 'debuff',
    desc: 'Accuracy reduced after failing to catch Pebble.', mods: m => { m.accP -= .24; } },
  chasingpebble: { icon: '💨', name: 'Chasing Pebble', kind: 'special',
    desc: 'Attack Speed reduced while aiming at a moving Pebble.',
    mods: (m, s, u) => { if (s.src && s.src.alive && s.src.moving && u.target === s.src) m.aspdP -= s.val || .18; } },
  goodboyguard: { icon: '🦴', name: 'Good Boy!', kind: 'debuff',
    desc: 'Deals less damage to anyone except Pebble.',
    onDealDamage: (u, s, ev) => { if (s.src && ev.target && ev.target.team === s.src.team && ev.target !== s.src) ev.amount *= .72; } },

  /* ============ DANDY'S WORLD FLAVOUR ============ */
  ichorburn: { icon: '🩸', name: 'Ichor Burn', kind: 'debuff', max: 6,
    desc: 'Corruption eats away HP and grows if the target is healed.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, (s.val || 1) * s.stacks, { type: 'true', dot: true, tag: 'ichor' }); } },
    onHealed: (u, s, ev, B) => { s.stacks = Math.min((s.stacks || 1) + 1, 6); u.dirty = true; ev.amount *= .6; } },
  skillcheck: { icon: '❕', name: 'Skill Check', kind: 'special',
    desc: 'A perfect check is pending. Landing it grants a large bonus.' },
  headline: { icon: '📺', name: 'Headline', kind: 'debuff',
    desc: 'The broadcast focus. Takes 20% more damage and cannot hide.',
    flags: { noStealth: true }, mods: m => { m.dmgTaken += .20; } },
  stardust: { icon: '⭐', name: 'Stardust', kind: 'buff', max: 5,
    desc: 'Each stack adds 6% Magic Attack; consumed by star skills.',
    mods: (m, s) => { m.magP += .06 * s.stacks; } },
  overtime: { icon: '⏱', name: 'Overtime', kind: 'buff', max: 4,
    desc: 'Attack Speed +10% per stack but 3% Max HP burned each second.',
    mods: (m, s) => { m.aspdP += .10 * s.stacks; },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(u, u, u.max.hp * .03 * s.stacks, { type: 'true', dot: true, selfharm: true, tag: 'overtime' }); } } },
  spotlight: { icon: '💡', name: 'Spotlight', kind: 'buff',
    desc: 'Lit up: +25% damage dealt, but also +12% damage taken.',
    mods: m => { m.dmgDealt += .25; m.dmgTaken += .12; } },
  sticky: { icon: '🍯', name: 'Sticky', kind: 'debuff',
    desc: 'Move Speed cut in half and cannot dash or reposition.',
    mods: m => { m.msP -= .5; }, flags: { noDash: true } },
  crumble: { icon: '🍪', name: 'Crumble', kind: 'debuff', max: 4,
    desc: 'Loses a stack whenever hit; at zero stacks the unit is Stunned.',
    onDamaged: (u, s, ev, B) => { s.stacks--; u.dirty = true; if (s.stacks <= 0) { B.removeStatus(u, 'crumble');
      B.applyStatus(s.src, u, 'stun', 2); Sound.play('icebreak'); } } },
  research: { icon: '📊', name: 'Research', kind: 'debuff', max: 6,
    desc: 'Shelly has logged this enemy. Its weaknesses make incoming skills hit harder; six stacks Fully Research it.' },
  fullyresearched: { icon: '🦴', name: 'Fully Researched', kind: 'debuff',
    desc: 'Skills deal much more damage here, ignore more of its defenses, and grant extra Energy when they connect.' },
  twistedrage: { icon: '👹', name: 'Twisted Rage', kind: 'buff', max: 10,
    desc: 'Corruption feeds it: +7% Attack and +5% Attack Speed per stack.',
    mods: (m, s) => { m.atkP += .07 * s.stacks; m.aspdP += .05 * s.stacks; } },

  /* ---- named mechanics owned by specific Heroes ---- */
  wrapped: { icon: '🎀', name: 'Wrapped', kind: 'debuff',
    desc: 'Attack Speed and cooldowns slowed, and Energy barely builds.',
    mods: m => { m.aspdP -= .25; m.cdr -= .25; m.energyGen -= .40; } },
  bobette_box: { icon: '📦', name: 'Precious Packaging', kind: 'special',
    desc: 'Bobette is safe inside her gift box but cannot move or act.',
    flags: { noAct: true, noMove: true } },
  festivecheer: { icon: '🎄', name: 'Festive Aura', kind: 'buff',
    desc: 'Move Speed +25% and Energy generation increased; lingers after leaving Bobette’s aura.',
    mods: (m, s) => { m.msP += .25; m.energyGen += Math.min(.5, s.val || .25); } },
  festiveguard: { icon: '🔔', name: 'Festive Guard', kind: 'buff', max: 3,
    desc: 'Defense and Magic Defense +8% per stack.',
    mods: (m, s) => { m.defP += .08 * s.stacks; m.mdefP += .08 * s.stacks; } },
  bobette_favor: { icon: '🎁', name: 'Holiday Favor', kind: 'buff',
    desc: 'Max HP and resilience increased. The Perfect Present prevents one defeat.',
    mods: m => { m.hpP += .12; m.dmgTaken -= .12; m.healRecv += .10; } },
  holidayfavor: { icon: '🎁', name: 'Holiday Favor', kind: 'buff',
    desc: 'Max HP, Damage Reduction and Healing Received raised. Survives one lethal blow.',
    mods: m => { m.hpP += .20; m.dmgTaken -= .18; m.healRecv += .25; } },
  etiquette: { icon: '🫖', name: 'Etiquette', kind: 'debuff',
    desc: 'Attack Speed and Power gain reduced by Teagan’s calm correction.', mods: m => { m.aspdP -= .18; m.energyGen -= .24; } },
  sap: { icon: '🪫', name: 'Sapped', kind: 'debuff', desc: 'Power gain is sharply reduced.', mods: m => { m.energyGen -= .50; } },
  fatigue: { icon: '🥱', name: 'Fatigued', kind: 'debuff', desc: 'The next buff fails.', onApply: u => { u._teaganFatigue = true; }, onExpire: u => { u._teaganFatigue = false; } },
  teagandistracted: { icon: '🫳', name: 'Properly Seated', kind: 'debuff',
    desc: 'Must attack Teagan; attacks deal less damage and lose Power.', onDealDamage: (u, s, ev, B) => { if (ev.target === s.src) { ev.amount *= .72; B.energy(u, -7); } } },
  sugarrush: { icon: '🍬', name: 'Sugar Rush', kind: 'buff',
    desc: 'Attack Speed, Move Speed, cooldowns and Energy all accelerated.',
    mods: m => { m.aspdP += .22; m.msP += .22; m.cdr += .22; m.energyGen += .30; } },
  bonbonblessing: { icon: '🍫', name: 'BonBon Blessing', kind: 'buff',
    desc: 'Cocoa’s care clears up to two negative statuses when received and improves Crowd Control Resistance.',
    mods: m => { m.ccRes += .12; },
    onApply: (u, s, B) => { B.cleanse(u, 2); } },
  momentum: { icon: '💨', name: 'Momentum', kind: 'buff', max: 10,
    desc: 'Attack Speed +5% and Crit Chance +3% per stack. Lost when slowed or stunned.',
    mods: (m, s) => { m.aspdP += .05 * s.stacks; m.crit += .03 * s.stacks; } },
  rudiefooting: { icon: '🦌', name: 'Sure-Footed', kind: 'buff',
    desc: 'Movement Speed cannot fall below normal.', mods: m => { m.noMsGain = true; } },
  inflated: { icon: '🎈', name: 'Inflated', kind: 'buff', max: 8,
    desc: 'Move and Attack Speed +6%, Max HP +3%, and Damage Taken -2% per stack. Healing removes stacks.',
    mods: (m, s) => { m.msP += .06 * s.stacks; m.aspdP += .06 * s.stacks; m.hpP += .03 * s.stacks; m.dmgTaken -= .02 * s.stacks; },
    onHealed: (u, s, ev, B) => { if (ev.noInflateLoss) return; s.stacks = Math.max(0, s.stacks - 2); u.dirty = true;
      if (s.stacks <= 0) B.removeStatus(u, 'inflated'); } },
  celebration: { icon: '🎉', name: 'Celebration', kind: 'buff', max: 5,
    desc: 'Attack Speed +7% and Crit Chance +4% per stack.',
    mods: (m, s) => { m.aspdP += .07 * s.stacks; m.crit += .04 * s.stacks; } },
  tempo: { icon: '🎵', name: 'Tempo', kind: 'buff', max: 10,
    desc: 'Attack Speed +4% per stack. Decays if the Hero stops attacking.',
    mods: (m, s) => { m.aspdP += .04 * s.stacks; } },
  unwound: { icon: '🔧', name: 'Unwound', kind: 'debuff',
    desc: 'Attack Speed halved until rhythm is rebuilt.', mods: m => { m.aspdP -= .45; } },
  sturdy: { icon: '🪨', name: 'Sturdy', kind: 'buff', max: 10,
    desc: 'Defense +6% per stack, gained by taking hits.',
    mods: (m, s) => { m.defP += .06 * s.stacks; } },
  weight: { icon: '⚓', name: 'Weight', kind: 'buff', max: 8,
    desc: 'Max HP +4% and Damage Reduction +3% per stack.',
    mods: (m, s) => { m.hpP += .04 * s.stacks; m.dmgTaken -= .03 * s.stacks; } },
  spite: { icon: '🤬', name: 'Spite', kind: 'buff', max: 10,
    desc: 'Attack +4% per stack. At 10 stacks the next hit detonates them.',
    mods: (m, s) => { m.atkP += .04 * s.stacks; } },
  haunted: { icon: '👁', name: 'Haunted', kind: 'debuff',
    desc: 'Takes far more damage from the haunter and recharges skills slowly.',
    mods: m => { m.cdr -= .30; } },
  mimicry: { icon: '🤫', name: 'Mimicry', kind: 'buff', max: 5,
    desc: 'Evasion +5% and damage taken -4% per stack.',
    mods: (m, s) => { m.evaP += .05 * s.stacks; m.dmgTaken -= .04 * s.stacks; } },
  skillpower: { icon: '⚗', name: 'Skill Power', kind: 'buff', max: 10,
    desc: 'Skill damage and healing +5% per stack.',
    mods: (m, s) => { m.healPowP += .05 * s.stacks; },
    onDealDamage: (u, s, ev) => { if (!ev.basic) ev.amount *= 1 + .05 * s.stacks; } },
  excitement: { icon: '📈', name: 'Excitement', kind: 'buff', max: 8,
    desc: 'The whole team gains Skill Power as the stacks climb.' },
  findings: { icon: '🔎', name: 'Latest Findings', kind: 'buff',
    desc: 'Skills deal extra damage and pierce defenses against Fully Researched enemies.',
    onDealDamage: (u, s, ev) => { if (!ev.basic && ev.target && ev.target.hasStatus('fullyresearched')) {
      ev.amount *= 1.18; ev.armorPen += .12;
    } } },
  passionboost: { icon: '💡', name: 'Breakthrough Skill', kind: 'buff',
    desc: 'The next damaging skill deals greatly increased damage, refunds Energy, and costs less Energy.',
    onDealDamage: (u, s, ev, B) => { if (ev.basic || ev.dot) return;
      // Keep multi-hit skills inside the same short cast window empowered,
      // then retire the marker so a later skill cannot steal the breakthrough.
      if (s.used && B.t - s.usedAt > .65) return;
      if (!s.used) { s.used = true; s.usedAt = B.t; B.energy(u, 8); }
      ev.amount *= 1.55;
    } },
  archivefirst: { icon: '📚', name: 'Archive First Edition', kind: 'buff',
    desc: 'The first skill used from the Ancient Archive deals bonus damage.' },
  archivebonus: { icon: '🏛', name: 'Archive Bonus', kind: 'buff',
    desc: 'This skill was preserved by the Ancient Archive and deals bonus damage.',
    onDealDamage: (u, s, ev) => { if (!ev.basic) ev.amount *= 1.42; } },
  disorganized: { icon: '🌀', name: 'Disorganized', kind: 'debuff',
    desc: 'Defense and Accuracy dropped.', mods: m => { m.defP -= .22; m.accP -= .25; } },
  pinned: { icon: '📍', name: 'Pinned', kind: 'debuff',
    desc: 'Attack Speed and Move Speed heavily reduced.',
    mods: m => { m.aspdP -= .30; m.msP -= .45; } },
  dizzy: { icon: '😵‍💫', name: 'Dizzy', kind: 'debuff',
    desc: 'Accuracy sharply reduced.', mods: m => { m.accP -= .35; } },
  vibrant: { icon: '🖍', name: 'Vibrant Pigment', kind: 'buff',
    desc: 'Crit Chance +20%.', mods: m => { m.crit += .20; } },
  inspiration: { icon: '🖼', name: 'Inspiration', kind: 'buff', max: 10,
    desc: 'Magic Attack +4% per stack.', mods: (m, s) => { m.magP += .04 * s.stacks; } },
  concern: { icon: '💭', name: 'Concern', kind: 'buff', max: 6,
    desc: 'Each stack strengthens the next heal by 15%.',
    mods: (m, s) => { m.healPowP += .15 * s.stacks; } },
  determined: { icon: '💪', name: 'Determined', kind: 'buff',
    desc: 'Healing Power, Defense and cooldown recovery all raised.',
    mods: m => { m.healPowP += .30; m.defP += .25; m.cdr += .25; } },
  encouraged: { icon: '🫂', name: 'Encouraged', kind: 'buff',
    desc: 'Defense, Energy Generation and CC Resistance raised.',
    mods: m => { m.defP += .25; m.energyGen += .30; m.ccRes += .20; } },

  /* ---- a Hero who is simply rooted to one spot by design (Blot, Rodger) -
     a buff rather than a debuff/cc so it can't be resisted, cleansed, or
     stolen the way an enemy-inflicted Root could be. */
  planted: { icon: '📌', name: 'Planted', kind: 'buff', desc: 'Cannot move.', flags: { noMove: true } },

  /* ---- named mechanics for Rodger/Eclipse ---- */
  investigated: { icon: '🕵', name: 'Investigated', kind: 'debuff',
    desc: 'Energy Generation -35%, Skill Haste -20%.',
    mods: m => { m.energyGen -= .35; m.cdr -= .20; } },
  blackout: { icon: '🌑', name: 'Blackout', kind: 'buff', desc: "Eclipse's hunting state.", flags: {} },
  eclipsefooting: { icon: '🐺', name: 'Moon-Quick', kind: 'buff',
    desc: 'During Blackout, Movement Speed cannot be reduced.', mods: m => { m.noMsGain = true; } },

  /* ---- named mechanics for Poppy ---- */
  buoyant: { icon: '🫧', name: 'Buoyant', kind: 'buff', max: 8,
    desc: 'Move Speed +5% and Evasion +4% per stack. Healing removes stacks.',
    mods: (m, s) => { m.msP += .05 * s.stacks; m.evaP += .04 * s.stacks; },
    onHealed: (u, s, ev, B) => { s.stacks = Math.max(0, s.stacks - 2); u.dirty = true;
      if (s.stacks <= 0) B.removeStatus(u, 'buoyant'); } },
  offbalance: { icon: '🥴', name: 'Off Balance', kind: 'debuff',
    desc: 'Accuracy and Movement Speed reduced. Skill Haste and Knockback Resistance are also weakened.',
    mods: m => { m.accP -= .25; m.msP -= .18; m.cdr -= .20; m.kbRes -= .16; m.noMsGain = true; } },
  lift: { icon: '🪽', name: 'Lift', kind: 'buff', max: 5,
    desc: 'Evasion, Movement Speed and Skill Haste rise with each stack.',
    mods: (m, s) => { m.evaP += .045 * s.stacks; m.msP += .025 * s.stacks; m.cdr += .045 * s.stacks; } },
  fluttertrail: { icon: '🌬', name: 'Gust Trail', kind: 'debuff',
    desc: 'Movement Speed is reduced and Energy leaks while the enemy crosses Flutter’s lingering air path.',
    mods: m => { m.msP -= .24; m.cdr -= .10; } },
  wingstorm: { icon: '🌪', name: 'Wingstorm', kind: 'debuff',
    desc: 'Flutter’s storm suppresses Accuracy and Movement Speed while forcing the enemy outward.',
    mods: m => { m.accP -= .20; m.msP -= .18; } },
  flutterdistracted: { icon: '💫', name: 'Distracted', kind: 'debuff',
    desc: 'Flutter’s silent pass makes the enemy lose Accuracy and Attack Speed.',
    mods: m => { m.accP -= .22; m.aspdP -= .24; } },
  flutterflyby: { icon: '🪽', name: 'Fly-by Marked', kind: 'debuff',
    desc: 'Flutter’s fly-by leaves the enemy struggling to track her. Accuracy is reduced.',
    mods: m => { m.accP -= .18; } },
  airpressure: { icon: '🫧', name: 'Air Pressure', kind: 'buff', max: 10,
    desc: 'Max HP, Shield Strength and Knockback Resistance rise per stack.',
    mods: (m, s) => { const src=s.src;m.hpP += (src?._poppyStackHp||.02) * s.stacks; m.shieldPowP += (src?._poppyStackShield||.03) * s.stacks; m.kbRes += (src?._poppyStackKb||.03) * s.stacks; } },

  /* ---- named mechanics for Dyle, Eggson, Flyte ---- */
  railmarker: { icon: '🚂', name: 'Rail Marker', kind: 'debuff',
    desc: 'Dyle\'s attacks against this target deal bonus damage.' },
  delayed: { icon: '⏳', name: 'Delayed', kind: 'debuff', max: 2,
    desc: 'Move Speed and cooldown recovery reduced.',
    mods: (m, s) => { m.msP -= .14 * s.stacks; m.cdr -= .14 * s.stacks; } },
  found: { icon: '🥚', name: 'Found', kind: 'debuff',
    desc: 'Eggson has found this target during the hunt. His attacks deal slightly more damage to it.' },
  flightpath: { icon: '🕊', name: 'Flight Path', kind: 'buff',
    desc: 'Move Speed, Attack Speed, cooldown recovery and CC Resistance all raised.',
    mods: m => { m.msP += .20; m.aspdP += .15; m.cdr += .15; m.ccRes += .15; } },
  slipstream: { icon: '💨', name: 'Slipstream', kind: 'buff',
    desc: 'Move Speed +25%, Attack Speed +20%, and Slow Immunity.',
    mods: m => { m.msP += .25; m.aspdP += .20; } },
  galebarrier: { icon: '🛡️', name: 'Gale Barrier', kind: 'buff',
    desc: 'Protective aerodynamic barrier absorbing damage. Reduces incoming damage by 15% and converts 20% into Energy.',
    mods: m => { m.dmgTaken -= .15; } },
  turbulence: { icon: '🌪️', name: 'Turbulence', kind: 'debuff', max: 3,
    desc: 'Violent aerodynamic turbulence reduces Attack Speed by 20% and Damage Dealt by 15% per stack.',
    mods: (m, s) => { m.aspdP -= .20 * s.stacks; m.dmgDone -= .15 * s.stacks; } },
  distracted: { icon: '💫', name: 'Distracted', kind: 'debuff',
    desc: 'Forced to target the distracter; Accuracy and Critical Chance reduced.',
    flags: { taunt: true }, mods: m => { m.accP -= .20; m.crit -= .15; } },
  taunt: { icon: '🎯', name: 'Taunted', kind: 'debuff',
    desc: 'Forced to target the taunter with attacks.' },

  /* ---- Waxwell's remote terrain network ---- */
  tiredii: { icon: '🕯', name: 'Tired II', kind: 'special',
    desc: 'Movement Speed, Attack Speed, and Skill Haste are reduced.',
    mods: m => { m.msP -= .24; m.aspdP -= .22; m.cdr -= .25; } },
  softwax: { icon: '🟡', name: 'Soft Wax', kind: 'debuff',
    desc: 'Movement Speed and Accuracy are reduced; lingering in it causes Root.',
    mods: m => { m.msP -= .28; m.accP -= .22; } },
  litup: { icon: '🕯', name: 'Lit Up', kind: 'debuff',
    desc: 'Evasion bonuses are suppressed and the target takes slightly more damage while Waxwell can see it clearly.',
    mods: m => { m.evaP -= .45; m.dmgTaken += .08; } },
  waxignited: { icon: '🔥', name: 'Ignited', kind: 'buff',
    desc: 'Ability cooldowns recover faster and Energy generation rises after crossing Waxwell’s Flame Trail.',
    mods: m => { m.cdr += .28; m.energyGen += .20; } },
  waxsnuffed: { icon: '🕯', name: 'Snuffed', kind: 'debuff',
    desc: 'The next Skill is delayed and Energy cannot increase.',
    flags: { silenced: true }, mods: m => { m.energyGen -= 5; } },
  waxcooldowns: { icon: '⌛', name: 'Waxed Gears', kind: 'debuff',
    desc: 'Skill cooldowns recover much more slowly.', mods: m => { m.cdr -= .34; } },
  waxfigure: { icon: '♟', name: 'Wax Figure', kind: 'special',
    desc: 'A distant wax copy traces this unit’s movement and punishes its next Skill.' },
  waxtrapped: { icon: '🕸', name: 'Trapped in the Pattern', kind: 'debuff',
    desc: 'Movement, Skill Haste, Accuracy, and bonus Energy gain are heavily reduced. Waxwell’s skills hit harder.',
    mods: m => { m.msP -= .34; m.cdr -= .34; m.accP -= .30; m.energyGen -= 1; },
    onDamaged: (u, s, ev) => { if (ev.src === s.src && !ev.dot && !ev.basic) ev.amount *= 1.12; } },
  waxwaiting: { icon: '◌', name: 'Dormant Wick', kind: 'special',
    desc: 'Twisted Waxwell watches without moving or attacking while another Twisted remains.',
    flags: { noAct: true, noMove: true }, mods: m => { m.dmgTaken -= .42; } },

  /* ---- Finn and Barnaby's messy fishing control ---- */
  finnquarry: { icon: '🎯', name: 'Big Catch', kind: 'debuff',
    desc: 'Finn and Barnaby focus this catch. Their direct damage to it is increased.',
    onDamaged: (u, s, ev) => { if (ev.src === s.src && !ev.dot) ev.amount *= 1.16; } },
  finnreelin: { icon: '🏃', name: 'Reel In', kind: 'buff',
    desc: 'A successful catch boosts Finn’s Movement Speed by 35%.',
    mods: m => { m.msP += .35; } },
  hooked: { icon: '🪝', name: 'Hooked', kind: 'debuff',
    desc: 'Movement is reduced. Moving or repositioning drains Energy.',
    mods: m => { m.msP -= .24; } },
  barnabysplash: { icon: '🐟', name: 'Barnaby Splash', kind: 'debuff',
    desc: 'Attack Speed, Accuracy, and Evasion are reduced by Barnaby’s water.',
    mods: m => { m.msP -= .16; m.aspdP -= .20; m.accP -= .24; m.evaP -= .14; } },
  slipperyfloor: { icon: '💧', name: 'Slippery Floor', kind: 'debuff',
    desc: 'Movement Speed and Skill Haste are reduced; the first movement attempt causes a slip.',
    mods: m => { m.msP -= .24; m.cdr -= .22; } },
  barnabydistracted: { icon: '🐠', name: 'Distracted by Barnaby', kind: 'debuff',
    desc: 'The next Basic Attack is slower and weaker.',
    mods: m => { m.aspdP -= .28; },
    onDealDamage: (u, s, ev, B) => { if (ev.basic) { ev.amount *= .68; B.removeStatus(u, 'barnabydistracted'); } } },
  barnabyexcited: { icon: '🐟', name: 'Barnaby Excited', kind: 'buff', max: 4,
    desc: 'At four stacks, Barnaby’s next splash becomes a Stunning leap.' },
  fishcoordination: { icon: '🎣', name: 'Fishbowl Coordination', kind: 'buff',
    desc: 'Finn’s Skill Haste increases after Barnaby disrupts an enemy.',
    mods: m => { m.cdr += .24; } },

  /* Collaboration combat states. */
  combo: { icon: '🔑', name: 'Combo', kind: 'buff', max: 5,
    desc: 'Sora builds momentum. His next finisher grows stronger with each stack.' },
  comboed: { icon: '✦', name: 'Combo Locked', kind: 'debuff', max: 3,
    desc: 'Sora has opened this target to stronger finishers.',
    mods: (m, s) => { m.dmgTaken += .035 * s.stacks; } },
  resolve: { icon: '🌘', name: 'Resolve', kind: 'buff', max: 6,
    desc: 'Riku gains Armor, Magic Defense, and Crowd Control Resistance as he absorbs pressure.',
    mods: (m, s) => { m.defP += .07 * s.stacks; m.mdefP += .07 * s.stacks; m.ccRes += .035 * s.stacks; } },
  darkmarked: { icon: '🌑', name: 'Marked by Darkness', kind: 'debuff',
    desc: 'Deals less damage to anyone except Riku and takes stronger counterattacks.' },
  gleam: { icon: '✨', name: 'Gleam', kind: 'debuff', max: 3,
    desc: 'Accuracy falls; Kairi deals more damage to the marked target and can consume the light for burst damage.',
    mods: (m, s) => { m.accP -= .10 * s.stacks; },
    onDamaged: (u, s, ev) => { if (ev.src === s.src && !ev.dot) ev.amount *= 1 + .04 * s.stacks; } },
  exposedlight: { icon: '☀', name: 'Exposed to Light', kind: 'debuff',
    desc: 'Attack and Skill Haste are reduced. Evasion bonuses are suppressed.',
    mods: m => { m.atkP -= .22; m.cdr -= .25; m.evaP -= .35; } },
  unbalanced: { icon: '⚖', name: 'Unbalanced', kind: 'debuff',
    desc: 'Attack, Skill Haste, and Armor are reduced.',
    mods: m => { m.atkP -= .20; m.cdr -= .20; m.defP -= .18; } },
  guardstance: { icon: '🛡️', name: 'Guard Stance', kind: 'buff',
    desc: 'Goofy is planted behind his shield, gaining Armor and Magic Defense.',
    mods: m => { m.defP += .22; m.mdefP += .22; } },
  shieldcharge: { icon: '🔷', name: 'Shield Charge', kind: 'buff', max: 5,
    desc: 'Blocking attacks strengthens Goofy’s Shields, Armor, and his next shield throw.',
    mods: (m, s) => { m.shieldPowP += .08 * s.stacks; m.defP += .025 * s.stacks; } }

  /* ============ CARE BEARS COLLAB ============ */,
  cbencouraged: { icon: '🌈', name: 'Encouraged', kind: 'buff', desc: 'Skill Haste rises and debuffs fade faster. Shelly’s morale mark.',
    mods: m => { m.cdr += .18; m.ccRes += .18; m.energyGen += .15; } },
  cbgloom: { icon: '🌑', name: 'Gloom', kind: 'debuff', max: 5, desc: 'Skill Haste and Accuracy fall. At five stacks, the enemy is Disheartened.',
    mods: (m, s) => { m.cdr -= .08 * s.stacks; m.accP -= .07 * s.stacks; } },
  cbbrightened: { icon: '🌟', name: 'Brightened', kind: 'debuff', desc: 'Evasion bonuses are suppressed and Crowd Control Resistance is reduced.',
    mods: m => { m.evaP -= .35; m.ccRes -= .14; } },
  cbhope: { icon: '💛', name: 'Hope', kind: 'buff', desc: 'Energy gain and Skill Haste rise. The next debuff is softened.',
    mods: m => { m.energyGen += .25; m.cdr += .08; } },
  cbcorrected: { icon: '🦴', name: 'Corrected', kind: 'debuff', desc: 'Shelly’s fossil lesson lowers Attack and Movement Speed.',
    mods: m => { m.atkP -= .22; m.msP -= .24; } },
  cbdisheartened: { icon: '💔', name: 'Disheartened', kind: 'debuff', desc: 'Skill Haste, Accuracy, and Attack are reduced.',
    mods: m => { m.cdr -= .30; m.accP -= .25; m.atkP -= .14; } },
  cbrest: { icon: '🌙', name: 'Rest', kind: 'buff', max: 3, desc: 'Skill Haste and Healing received rise while this ally gets a quiet moment.',
    mods: (m, s) => { m.cdr += .10 * s.stacks; m.healRecv += .10 * s.stacks; } },
  cbsleepdebt: { icon: '💤', name: 'Sleep Debt', kind: 'debuff', max: 5, desc: 'Repeated action makes Accuracy and Skill Haste fall. Three stacks become Drowsy; five stacks become Forced Rest, then the debt clears.',
    mods: (m, s) => { m.cdr -= .10 * s.stacks; m.accP -= .07 * s.stacks; } },
  cbdrowsy: { icon: '🌙', name: 'Drowsy', kind: 'debuff', desc: 'Attack Speed and Skill Haste are reduced.',
    mods: m => { m.aspdP -= .25; m.cdr -= .25; } },
  cbforcedrest: { icon: '🛌', name: 'Forced Rest', kind: 'debuff', cc: true, desc: 'Cannot act or move, but takes reduced damage until waking.',
    flags: { noAct: true, noMove: true }, mods: m => { m.dmgTaken -= .45; } },
  cbwatched: { icon: '👁', name: 'Watched', kind: 'buff', desc: 'Damage taken and debuff duration are reduced while Astro keeps watch.',
    mods: m => { m.dmgTaken -= .12; m.ccRes += .16; } },
  cbdream: { icon: '💭', name: 'Dream Shield', kind: 'buff', desc: 'A moonlit shield that turns absorbed damage into Rest.',
    mods: m => { m.cdr += .10; m.ccRes += .12; } },
  cbhopefulsleep: { icon: '😴', name: 'Hopeful Sleep', kind: 'buff', desc: 'The next Skill costs less Energy and recovers faster.',
    mods: m => { m.energyGen += .30; m.cdr += .20; } },
  cbwishmarked: { icon: '🎁', name: 'Wishmarked', kind: 'debuff', desc: 'Gigi’s mark drains Energy and reduces this enemy’s Skill Haste.',
    mods: m => { m.energyGen -= .20; m.cdr -= .15; } },
  cbwishattack: { icon: '🍬', name: 'Wishful Attack', kind: 'buff', max: 8, desc: 'Gigi’s successful Wishes raise her Attack for the wave.',
    mods: (m, s) => { m.atkP += .025 * s.stacks; } },
  cbjackpot: { icon: '🎰', name: 'Jackpot Wish', kind: 'buff', desc: 'Gigi’s next Prize or rescue is upgraded into a rare, team-changing result.',
    mods: m => { m.atkP += .20; m.magP += .20; } }
};

/* Categorised lists used by cleanse / dispel / steal effects. */
const CC_LIST = Object.keys(STATUS).filter(k => STATUS[k].cc);
const DEBUFFS = Object.keys(STATUS).filter(k => STATUS[k].kind === 'debuff');
const BUFFS = Object.keys(STATUS).filter(k => STATUS[k].kind === 'buff');

/* Real VFX/*Effect flipbook art (16 frames each) for the statuses that have
   a matching folder, played once by applyStatus() the moment the status
   actually lands - everything else still gets the plain emoji floater. */
const STATUS_VFX = {
  burn: 'BurnEffect', charm: 'CharmEffect', confusion: 'ConfusionEffect',
  curse: 'CurseEffect', fear: 'FearEffect', freeze: 'FreezeEffect', haste: 'HasteEffect',
  poison: 'PoisonBubble', regen: 'RegenEffect', shield: 'ShieldEffect', shock: 'ShockEffect',
  silence: 'SilenceEffect', sleep: 'SleepEffect', slow: 'SlowEffect', stun: 'StunEffect',
  weaken: 'WeakenEffect', fortify: 'ArmorEffect', stealth: 'InvisibilityEffect',
  untargetable: 'InvisibilityEffect', inspire: 'BlessedEffect', inspired: 'BlessedEffect', atkup: 'RageEffect'
};

function stIcon(id) { return STATUS[id] ? STATUS[id].icon : '?'; }
function stName(id) { return STATUS[id] ? STATUS[id].name : id; }

/* Wraps named effects in skill descriptions with tappable pills so players
   can read the status, buff, or debuff without leaving the hero page. */
function tagifyStatuses(html) {
  if (!html || typeof document === 'undefined' || !document.createElement || typeof NodeFilter === 'undefined') return html;
  const entries = Object.entries(STATUS).filter(([, status]) => status.icon && status.name);
  if (!entries.length) return html;

  // Use text nodes rather than raw string replacement. This lets authors
  // write either “Freeze” or “🧊 Freeze”, preserves their <em>/<span> markup,
  // and prevents tags from ever being nested inside another tag.
  const byName = new Map();
  entries.forEach(([key, status]) => {
    const name = status.name.toLocaleLowerCase();
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push([key, status]);
  });
  const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map(escapePattern).join('|');
  const matcher = new RegExp(`(^|[^\\p{L}\\p{N}])(${names})(?=$|[^\\p{L}\\p{N}])`, 'giu');
  const template = document.createElement('template');
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    if (node.parentElement && node.parentElement.closest('.stTag, script, style')) return;
    const text = node.nodeValue;
    matcher.lastIndex = 0;
    const matches = [...text.matchAll(matcher)];
    if (!matches.length) return;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    matches.forEach(match => {
      const name = match[2];
      const entriesForName = byName.get(name.toLocaleLowerCase());
      if (!entriesForName) return;
      let start = match.index + match[1].length;
      // If the author already supplied the icon, replace it with one clean,
      // consistently styled pill instead of rendering the icon twice.
      let [key, status] = entriesForName[0];
      entriesForName.some(([candidateKey, candidateStatus]) => {
        const iconPrefix = candidateStatus.icon + ' ';
        const nbspPrefix = candidateStatus.icon + ' ';
        if (!text.slice(0, start).endsWith(iconPrefix) && !text.slice(0, start).endsWith(nbspPrefix)) return false;
        [key, status] = [candidateKey, candidateStatus];
        start -= text.slice(0, start).endsWith(iconPrefix) ? iconPrefix.length : nbspPrefix.length;
        return true;
      });
      if (start < cursor) return;
      fragment.append(text.slice(cursor, start));
      const kind = status.kind === 'buff' ? 'buff' : status.kind === 'debuff' ? 'debuff' : 'special';
      const pill = document.createElement('button');
      pill.type = 'button'; pill.className = `stTag stTag-${kind}`;
      pill.dataset.status = key;
      pill.setAttribute('aria-label', `Read ${status.name}: ${kind}`);
      pill.title = `${status.name} · ${kind}`;
      // tagifyStatuses returns HTML, so keep the click handler in the markup
      // rather than only as an element property that serialization would drop.
      pill.setAttribute('onclick', `showStatusInfo('${key}')`);
      pill.textContent = `${status.icon} ${status.name}`;
      fragment.appendChild(pill);
      cursor = match.index + match[0].length;
    });
    if (!fragment.childNodes.length) return;
    fragment.append(text.slice(cursor));
    node.replaceWith(fragment);
  });
  return template.innerHTML;
}

/* Tapped from a stTag pill. Opens a compact status reference card. */
function showStatusInfo(key) {
  const s = STATUS[key]; if (!s) return;
  const kindColor = s.kind === 'buff' ? '#5fe07a' : s.kind === 'debuff' ? '#ff6060' : 'var(--gold)';
  const kindLabel = s.kind === 'buff' ? '▲ Buff' : s.kind === 'debuff' ? '▼ Debuff' : '◆ Special';
  const body = el('div');
  body.innerHTML = `
    <div class="row" style="align-items:center;gap:12px;margin-bottom:12px">
      <span style="font-size:34px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">${s.icon}</span>
      <div>
        <div class="b" style="font-size:17px">${s.name}</div>
        <div class="mini b" style="color:${kindColor};margin-top:2px">${kindLabel}</div>
      </div>
    </div>
    <div style="font-size:13px;line-height:1.55">${s.desc}</div>
    ${s.cc ? `<div class="mini muted" style="margin-top:8px">⚓ Can be resisted by CC Resistance. CC-immune units ignore it entirely.</div>` : ''}
    ${s.max ? `<div class="mini muted" style="margin-top:4px">Stacks up to <b>${s.max}×</b>.</div>` : ''}`;
  UI.modal(s.icon + ' ' + s.name, body);
}
