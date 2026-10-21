/* heroes13.js - Teagan, a manners-first control tank. */
'use strict';

function teaganTape(u, B, n) {
  const current = Math.max(0, Math.min(10, Number(u.teaganTapes) || 0));
  const gained = Math.min(10 - current, Math.max(1, Number(n) || 1));
  if (!gained) return;
  u.teaganTapes = current + gained;
  // Energy-loss callbacks can fire several times in a short burst. Keep the
  // resource exact, but avoid creating a burst of DOM effects for each one.
  if (B.t - (u._teaganTapeFxAt ?? -Infinity) >= .45) {
    u._teaganTapeFxAt = B.t;
    B.fxTeaganSkill('tape', u, { count: gained });
  }
}

defHero({
  id:'Teagan', name:'Teagan', folder:'Teagan', file:'Teagan', icon:'Teagan', role:'Control', roleLabel:'Control / Hidden Tank', tier:'S', position:'Midline', element:'Tea',
  blurb:'A composed hostess who slows every fight down until her opponents forget whose turn it was.',
  base:{ hp:6200, atk:165, def:328, mag:315, mdef:342, spd:112, acc:188, eva:142 },
  hidden:{ range:255, aspd:.78, ms:66, aggro:1.15, crit:.06, critDmg:1.45, healPow:1.18, shieldPow:1.38, cdr:.08, ccRes:.24, kbRes:.52, armorPen:0, magPen:.10 },
  growth:{ hp:.108, atk:.050, def:.096, mag:.096, mdef:.102 },
  move:{ gait:'swagger', bob:4, freq:1.25, lean:4, squash:.04, idle:'settle', step:'step_soft', particles:'sparkle', pcol:'#c9955d', trail:{on:false}, brake:.55 },
  basic:{ name:'Teacup Tap', type:'magic', ratio:.72, range:255, proj:'orb', pcol:'#c9955d', sfx:'whoosh', hit:'hit_magic', wind:.2, note:'A very precise correction.' },
  skills:{
    W:{ name:'Tea Time', type:'Magic / Shield', energy:100, v:{ heal:.14, shield:.18 }, p:{ dur:6, power:18, tape:3 },
      desc:(S,P)=>`<span class="sk-pas">Teagan collects 📼 Tapes when enemies lose Power, are Silenced, are Distracted, or have a debuff blocked. Below half HP she spends ${P.tape} Tapes to heal and shield herself.</span> Active: serves tea to the battlefield, cleansing up to three debuffs from each ally, healing them for <em>${pcn(S.heal*100)}</em> Max HP, reducing enemy Power, and applying 🫖 Etiquette for ${P.dur}s.`,
      passive:(u,B,S,P)=>{ u.teaganTapes=0; B.on(u,'statusApplied',ev=>{ if(ev.src===u && ev.unit && ev.unit.team!==u.team && ['silence','teagandistracted','etiquette'].includes(ev.id)) teaganTape(u,B); }); B.on(u,'enemyEnergyLost',()=>teaganTape(u,B)); B.on(u,'debuffBlocked',ev=>{ if(ev.unit && ev.unit.team!==u.team) teaganTape(u,B); }); B.every(u,.35,()=>{ if(u.hpPct<.5 && u.teaganTapes>=P.tape){ u.teaganTapes-=P.tape; B.heal(u,u,u.max.hp*S.heal,{tag:'Tea Time'}); B.shield(u,u,u.max.hp*S.shield,5); B.fxTeaganSkill('shield',u,{target:u}); } }); },
      cast:(u,B,S,P)=>{ const allies=B.alliesOf(u), foes=B.enemiesOf(u); B.anim(u,'cast',.78,'teaganTea'); Sound.play('teagan_tea_service',{vol:.72,priority:true}); B.fxTeaganSkill('tea',u,{allies,targets:foes}); allies.forEach(a=>{ B.cleanse(a,3); B.heal(u,a,a.max.hp*S.heal,{tag:'Tea Time'}); }); foes.forEach(e=>{ B.energy(e,-P.power); B.applyStatus(u,e,'etiquette',P.dur); }); }
    },
    G:{ name:'Mind Your Manners', type:'Magic Control', cd:10, v:{ ratio:.92, power:20 }, p:{ silence:2.8, sap:5, seal:4 },
      desc:(S,P)=>`Corrects the highest-Power enemy for <em>${pcn(S.ratio*100)}</em> Magic, removing up to three positive effects and Silencing them for ${P.silence}s. They are 🛑 Buff Sealed for ${P.seal}s, reducing Skill Power and stopping their next hostile buff. Enemies already under Etiquette are also 🪫 Sapped for ${P.sap}s.`,
      ai:{prio:59,cond:(u,B)=>B.enemiesOf(u).length>0}, cast:(u,B,S,P)=>{ const t=B.highestEnergy(B.enemiesOf(u)); if(!t)return; B.anim(u,'cast',.64,'teaganCorrect'); Sound.play('teagan_manners_correction',{vol:.68,priority:true}); B.fxTeaganSkill('correction',u,{target:t}); B.damage(u,t,u.st.mag*S.ratio,{type:'magic',tag:'Mind Your Manners'}); B.energy(t,-S.power); B.dispel(t,3); B.applyStatus(u,t,'buffsealed',P.seal,{stacks:1}); B.applyStatus(u,t,'silence',P.silence); B.applyStatus(u,t,'weaken',P.silence); if(t.hasStatus('etiquette')) B.applyStatus(u,t,'sap',P.sap); }
    },
    B:{ name:'Proper Seating', type:'Control / Shield', cd:12, v:{ shield:.13 }, p:{ dur:6 },
      desc:(S,P)=>`Seats the highest-Attack enemy opposite Teagan for ${P.dur}s. They become Distracted by her, deal reduced damage, and lose Power whenever they hit her. If they attempt a skill, Teagan gains a <em>${pcn(S.shield*100)}</em> Max HP Shield.`,
      ai:{prio:55,cond:(u,B)=>B.enemiesOf(u).length>0}, cast:(u,B,S,P)=>{ const t=B.highestStat(B.enemiesOf(u),'atk'); if(!t)return; B.anim(u,'cast',.64,'teaganSeat'); Sound.play('teagan_proper_seating',{vol:.7,priority:true}); B.fxTeaganSkill('seating',u,{target:t}); t._teaganDistractor=u; t._teaganDistractUntil=B.t+P.dur; B.applyStatus(u,t,'teagandistracted',P.dur); const off=B.on(u,'enemyCast',e=>{ if(e===t&&t.hasStatus('teagandistracted')){ B.shield(u,u,u.max.hp*S.shield,5); B.fxTeaganSkill('shield',u,{target:u}); } }); B.after(P.dur,off); }
    },
    P:{ name:'Elegant Host', type:'Passive', v:{ heal:.055 }, p:{}, desc:(S)=>`Controlled enemies lose Tenacity and Evasion. Whenever control prevents an enemy’s skill or buff, Teagan restores <em>${pcn(S.heal*100)}</em> Max HP.`,
      passive:(u,B,S)=>{ B.on(u,'debuffBlocked',()=>B.heal(u,u,u.max.hp*S.heal,{tag:'Elegant Host'})); B.on(u,'buffBlocked',ev=>{ if(ev.unit && ev.unit.team!==u.team) B.heal(u,u,u.max.hp*S.heal,{tag:'Elegant Host'}); }); B.every(u,.4,()=>B.enemiesOf(u).forEach(e=>{ const controlled=e.hasStatus('etiquette')||e.hasStatus('teagandistracted'); const eva=controlled?-.18:0, ccRes=controlled?-.18:0; if(e.flat.evaPTeagan!==eva||e.flat.ccResPTeagan!==ccRes){ e.flat.evaPTeagan=eva; e.flat.ccResPTeagan=ccRes; e.dirty=true; } })); }
    },
    R:{ name:'No Ichor on the Boa', type:'Debuff Immunity', v:{}, p:{ icd:7, immune:2.5, fatigue:5 }, desc:(S,P)=>`The first debuff applied to Teagan every ${P.icd}s starts ${P.immune}s of immunity to all applied debuffs. The source becomes 🥱 Fatigued for ${P.fatigue}s, causing their next buff to fail.`,
      passive:(u,B,S,P)=>{ u.guards=u.guards||[]; u.guards.push((id,d)=>{ if(d.kind!=='debuff')return false; if(B.t<(u._teaganImmuneUntil||0))return true; if(B.t<(u._teaganGuardAt||0))return false; u._teaganGuardAt=B.t+P.icd;u._teaganImmuneUntil=B.t+P.immune;B.applyStatus(u,u,'ccimmune',P.immune);return true;}); B.on(u,'debuffBlocked',ev=>{ if(ev.unit===u){ B.fxTeaganSkill('guard',u); if(ev.src&&ev.src.alive) B.applyStatus(u,ev.src,'fatigue',P.fatigue); } }); }
    }
  }
});

// Teagan previously existed only as an enemy-side quick-cast definition.
// This playable kit loads after that placeholder and is explicitly enrolled
// in the roster snapshot it created.
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Teagan')) HERO_IDS.push('Teagan');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Teagan')) PLAYABLE_IDS.push('Teagan');
