/* chell-kit.js - Chell (SS Tier Control / Support, Midline, Physical).
   Test Subject from the Aperture Science event. Unlocked from Dyle's shop after beating GLaDOS (see js/aperture.js).
   Core mechanics: Curiosity routes portal drops, Anger directs return fire, Intelligence operates gels, and Morality guards critical escapes.
   Exact numbers, forced movement and the arena override are Dandy's Heroes adaptations. Chell stays silent; her personality cores use the supplied original recordings. */
'use strict';

/* ============================================================ STATUS DEFINITIONS */

STATUS.chell_charge={icon:'⟷',name:'Portal Momentum',kind:'special',maxStacks:3,desc:'Successful cube deliveries and portal escapes build Momentum (up to 3). Spend 1 for a gel relay, 2 for a Fling Shot, or 3 for an Infinite Fall.',mods:()=>{}};

STATUS.chell_disoriented = {
  icon: '🌀', name: 'Disoriented', kind: 'debuff',
  desc: 'Thrown through a portal. Accuracy -25% and Skill Haste -20%.',
  mods: m => { m.accP -= .25; m.cdr -= .20; }
};
STATUS.chell_momentum = {
  icon: '💨', name: 'Long Fall Momentum', kind: 'buff',
  desc: 'Chell keeps the speed of her last portal jump: more Evasion and Movement Speed.',
  mods: m => { m.evaP += .18; m.msP += .22; }
};
STATUS.chell_portal_guard = {
  icon: '🛡', name: 'Through the Portal', kind: 'buff',
  desc: 'Took a portal this moment: 15% Damage Reduction.',
  mods: m => { m.dmgTaken -= .15; }
};
STATUS.chell_cover = {
  icon: '🔵', name: 'Portal Cover', kind: 'buff',
  desc: 'Chell redirected the attack that was aimed at you: 20% Damage Reduction.',
  mods: m => { m.dmgTaken -= .20; }
};
STATUS.chell_propulsion = {
  icon: '🟠', name: 'Propulsion Gel', kind: 'buff',
  desc: 'Orange gel under your feet: +30% Movement Speed and +20% Attack Speed.',
  mods: (m, s) => { m.msP += .30; m.aspdP += .20; if (s && s.haste) m.cdr += .15; }
};
STATUS.chell_repulsion = {
  icon: '🔷', name: 'Repulsion Gel', kind: 'buff',
  desc: 'Blue gel: a short burst of Evasion for anyone who crosses it.',
  mods: m => { m.evaP += .20; }
};
STATUS.chell_bridge = {
  icon: '🌉', name: 'Hard-Light Bridge', kind: 'buff',
  desc: 'A bridge of light: 30% Damage Reduction.',
  mods: m => { m.dmgTaken -= .30; }
};

/* ============================================================ HELPERS */

const chellRed = u => !!u._chellRed;
function chellPortals(u, B) { return ChellVisuals.portals(u, B); }
function chellDisplace(u, B, e, P) {
  if (!u.alive || !e || !e.alive) return;
  B.applyStatus(u, e, 'chell_disoriented', P ? P.disDur : 6);
  u._displaced = (u._displaced || 0) + (P?.traversals ?? 1);
  chellCheckOverride(u, B);
}
function chellCheckOverride(u, B) {
  if (!chellRed(u) || u._overrideUsed) return;
  if ((u._redirected || 0) >= 3 || (u._displaced || 0) >= 5) {
    u._overrideUsed = true;
    chellOverride(u, B);
  }
}
function chellOverride(u, B) {
  const P = u._chellOverrideP;
  const foes = B.enemiesOf(u).filter(e => e.alive);
  if (!foes.length || !P) return;
  const cx = foes.reduce((s, e) => s + e.x, 0) / foes.length;
  B.anim(u, 'cast', 1.3, 'chellFunnel');
  u._chellAllCoresUntil=B.t+2.6;u._chellCombo={name:'CORE OVERRIDE',until:B.t+2.6};
  ChellVisuals.speak(u,B,'anger');
  foes.forEach(e => { B.pull(e,cx,.6,e.depth,u);B.applyStatus(u,e,'stun',2.6); });
  B.after(1.5, () => {
    if (!u.alive || B.over) return;
    const live=B.enemiesOf(u).filter(e=>e.alive);
    live.forEach((e,i)=>ChellVisuals.transit(u,B,e,{x:cx+(i-(live.length-1)/2)*38,depth:e.depth},()=>{
      B.damage(u,e,u.st.atk*P.dropAtk,{type:'physical',area:true,tag:'Core Relay Drop'});
      B.applyStatus(u,e,'stun',1.6);
    }));
  });
  B.after(2.4,()=>{
    if(!u.alive || B.over)return;
    ChellVisuals.bridge(u,B,8);
    B.alliesOf(u).forEach(a=>{if(a.alive)B.applyStatus(u,a,'chell_bridge',8);});
  });
}

/* ============================================================ HERO DEFINITION: CHELL */

defHero({
  id: 'Chell',
  name: 'Chell',
  folder: 'Chell',
  file: 'Chell',
  icon: 'Chell',
  role: 'Control',
  roleLabel: 'Control / Support',
  tier: 'SS',
  position: 'Midline',
  element: 'Aperture',
  eventOnly: true,
  noVoice: true,
  blurb: 'Chell brings a portal gun and four very different assistants. Curiosity picks the route, Intelligence handles the calculations, Anger supplies the enthusiasm, and Morality keeps her alive.',
  base: { hp: 5100, atk: 330, def: 290, mag: 140, mdef: 270, spd: 124, acc: 235, eva: 180 },
  hidden: { range: 235, aspd: 1.0, ms: 82, aggro: .9, crit: .12, critDmg: 1.6, healPow: 1.0, shieldPow: 1.1, cdr: .12, ccRes: .2, kbRes: .4, armorPen: .05, magPen: .03 },
  growth: { hp: .09, atk: .098, def: .084, mag: .05, mdef: .088 },
  move: { gait: 'strut', bob: 5, freq: 1.5, lean: 4, squash: .03, idle: 'sway', step: 'step_soft',
    particles: 'sparkle', pcol: '#4aa8ff', trail: { on: true, col: '#ff9a2e', rate: .12 }, brake: .3 },
  basic: {
    name: 'Special Delivery',
    type: 'physical',
    style: 'chellBasic',
    ratio: .85,
    range: 235,
    proj: 'chellPortalCube',
    pcol: '#4aa8ff',
    sfx: 'chell_portal_fire',
    hit: 'hit_blunt',
    wind: .2,
    note: 'Launches a Weighted Storage Cube through linked portals. Successful deliveries build Portal Momentum (max 3). After a portal dodge, the next delivery gains bonus damage and a short interrupt.',
    onHit: (u, t, B) => {
      if (!u.alive || !t) return;
      ChellVisuals.delivery(u,B,t);
      if(!t.alive||!u._cubeDrop)return;
      u._cubeDrop = false;
      B.damage(u, t, u.st.atk * (u._cubeAtk || .9), { type: 'physical', tag: 'Cube Drop' });
      B.applyStatus(u, t, 'stun', .6);
    }
  },
  skills: {
    /* ---------------- WHITE: Thinking With Portals ---------------- */
    W: {
      name: 'Thinking With Portals',
      type: 'Physical Damage / Control',
      energy: 100,
      v: { dropAtk: 1.25, ramAtk: .55, bigAtk: .6 },
      p: { disDur: 6, stun: 1.6, count: 3, momentum: 8, energyDrain: 20 },
      desc: (S, P) => `<b>Curiosity Core:</b> Chell opens a blue portal beneath the ${P.count} closest enemies and an orange exit above their formation. Movable targets fall through, regroup near the exit, take Physical Damage, and are Stunned for ${P.stun}s on landing. The strongest enemy lands harder and knocks nearby foes back. Portal travel causes Disorientation; already-Disoriented targets lose ${P.energyDrain} Energy. Chell gains Long Fall Momentum (Evasion and Movement Speed) for ${P.momentum}s. <b>3 Momentum — Infinite Fall:</b> the strongest target takes three real portal trips before landing for 60% more damage. Displacement-immune enemies take the hit without being moved.`,
      passive: (u,B,S,P)=>{
        ChellVisuals.activate(u,B,'curiosity');
        B.after(.6,()=>{if(u.alive)chellPortals(u,B);});
      },
      cast: (u,B,S,P)=>{
        const foes=B.enemiesOf(u).filter(e=>e.alive).sort((a,b)=>B.distance(u,a)-B.distance(u,b)).slice(0,P.count+(chellRed(u)?1:0));
        if(!foes.length)return;
        B.anim(u,'cast',1.0,'chellPortal');
        if(!B.offscreen)Sound.play('chell_portal_fire',{vol:.4});
        ChellVisuals.speak(u,B,'curiosity');
        if(!u._portal)chellPortals(u,B);
        const loop=ChellVisuals.spend(u,B,3,'INFINITE FALL');
        const cx=foes.reduce((s,e)=>s+e.x,0)/foes.length;
        const top=foes.slice().sort((a,b)=>b.st.atk-a.st.atk)[0];
        foes.forEach((e,i)=>{
          const wasDis=e.hasStatus?.('chell_disoriented');
          const travel=Math.abs(e.x-u.x);
          const loops=loop&&e===top&&!e.immovable&&!e.noDisplace?3:1;
          B.applyStatus(u,e,'stun',loops===3?1.8:.9);
          let trips=0;
          const drop=lap=>ChellVisuals.transit(u,B,e,{x:cx+(i-(foes.length-1)/2)*46+(lap===1?-30:0),depth:e.depth},moved=>{
            if(moved)trips++;
            if(lap<loops-1){drop(lap+1);return;}
            const crash=u.st.atk*S.dropAtk*(e===top?1+S.bigAtk:1)*(1+S.ramAtk*Math.min(1,travel/400));
            B.damage(u,e,crash*(loop&&e===top?1.6:1),{type:'physical',tag:loop&&e===top?'Infinite Fall':e===top?'Heavy Landing':'Portal Drop'});
            B.applyStatus(u,e,'stun',P.stun);
            if(e===top)B.enemiesOf(u).forEach(n=>{if(n!==e&&n.alive&&B.distance(e,n)<180)B.knockback(u,n,90);});
            if(wasDis)B.energy(e,-P.energyDrain);
            chellDisplace(u,B,e,{disDur:P.disDur+(chellRed(u)?2:0),traversals:trips});
          },loops===3?.6:.9);
          drop(0);
        });
        B.applyStatus(u,u,'chell_momentum',P.momentum);
      }
    },

    /* ---------------- GREEN: Speedy Thing Goes In ---------------- */
    G: {
      name: 'Anger Management',
      type: 'Physical Damage / Control / Support',
      cd: 9,
      first: 3.5,
      v: { redirect: .9, cubeAtk: 1.1, capAtk: 3.2 },
      p: { stun: .9, cover: 6, drain: 15 },
      desc: (S,P)=>`<b>Anger Core:</b> redirects the most recent ranged hit against the team through blue and orange portals, returning ${fmt(S.redirect*100)}% of its damage (capped by Chell's Attack) at the strongest enemy. The original attacker becomes Disoriented and loses ${P.drain} Energy; the attacked ally gains Portal Cover for ${P.cover}s. If there is no recent ranged hit, Anger deploys a turret through the entry portal and sends a rocket out the exit, dealing Physical Damage and Stunning for ${P.stun}s. <b>2 Momentum — Fling Shot:</b> the rocket arcs out of a floor portal and chains into a second enemy for half damage.`,
      passive: (u,B)=>{
        ChellVisuals.activate(u,B,'anger');u._lastRanged=null;
        B.on(u,'allyDamageTaken',ev=>{
          if(!u.alive||!ev?.src||!ev.unit||ev.src.team===u.team||ev.dot||ev.redirected||!(ev.amount>0))return;
          if(B.distance(ev.src,ev.unit)<170&&ev.type!=='magic')return;
          u._lastRanged={src:ev.src,victim:ev.unit,amount:ev.amount,at:B.t};
        });
      },
      cast: (u,B,S,P)=>{
        const foes=B.enemiesOf(u).filter(e=>e.alive);if(!foes.length)return;
        const rec=u._lastRanged,fresh=rec&&B.t-rec.at<5&&rec.src.alive;
        const fling=ChellVisuals.spend(u,B,2,'FLING SHOT');
        const chain=(first,amount)=>{if(!fling)return;const next=B.nearest(first,B.enemiesOf(u).filter(e=>e.alive&&e!==first));if(next)ChellVisuals.route(u,B,next,{origin:first,rocket:true,fling:true,sprite:'rocket',duration:.48},()=>B.damage(u,next,amount*.5,{type:'physical',tag:'Fling Chain'}));};
        B.anim(u,'cast',.9,'chellRedirect');ChellVisuals.speak(u,B,'anger');
        if(fresh){
          const top=foes.slice().sort((a,b)=>b.st.atk-a.st.atk)[0];
          const amount=Math.min(rec.amount*S.redirect,u.st.atk*S.capAtk);
          u._lastRanged=null;
          if(rec.victim?.alive)B.applyStatus(u,rec.victim,'chell_cover',P.cover);
          ChellVisuals.route(u,B,top,{origin:rec.src,victim:rec.victim,rocket:true,fling,sprite:'rocket',duration:.72},()=>{
            B.damage(u,top,amount,{type:'physical',redirected:true,tag:'Core-guided Redirect'});
            if(rec.src.alive){B.energy(rec.src,-P.drain);chellDisplace(u,B,rec.src,{disDur:6,traversals:0});}
            chain(top,amount);u._redirected=(u._redirected||0)+1;chellCheckOverride(u,B);
          });
        }else{
          const t=B.nearest(u,foes);
          ChellVisuals.route(u,B,t,{rocket:true,turret:true,fling,sprite:'rocket',duration:.72},()=>{
            B.damage(u,t,u.st.atk*S.cubeAtk,{type:'physical',tag:'Anger-guided Rocket'});
            B.applyStatus(u,t,'stun',P.stun);chain(t,u.st.atk*S.cubeAtk);
          });
        }
      }
    },

    /* ---------------- BLUE: Mobility Gels ---------------- */
    B: {
      name: 'Gel Dispenser',
      type: 'Physical Damage / Control / Support',
      cd: 13,
      first: 5,
      v: { bounceAtk: .7 },
      p: { dur: 8, spread: 190 },
      desc: (S,P)=>`<b>Intelligence Core operates the dispenser.</b> Chell sends Repulsion Gel or Propulsion Gel through a ceiling portal. Against clustered enemies, blue Repulsion Gel bounces them, deals Physical Damage, Slows for 3s, and gives allies Evasion for 4s. Against spread-out enemies, orange Propulsion Gel gives allies +30% Movement Speed and +20% Attack Speed for ${P.dur}s; enemies at the edges take collision damage and become Disoriented. <b>1 Momentum — Gel Relay:</b> blue gel makes cube deliveries bounce to a nearby second enemy for 35% Attack damage; orange gel makes each successful delivery generate 2 Momentum. One gel field can remain active at a time.`,
      passive:(u,B)=>ChellVisuals.activate(u,B,'intelligence'),
      cast:(u,B,S,P)=>{
        const foes=B.enemiesOf(u).filter(e=>e.alive);if(!foes.length)return;
        const cx=foes.reduce((s,e)=>s+e.x,0)/foes.length;
        const clustered=Math.max(...foes.map(e=>Math.abs(e.x-cx)))<P.spread/2;
        const charged=ChellVisuals.spend(u,B,1,'GEL RELAY');u._chellGel=null;
        B.anim(u,'cast',.9,'chellGel');ChellVisuals.speak(u,B,'intelligence');
        ChellVisuals.gels(u,B,foes,clustered,clustered?4:P.dur,()=>{
          u._chellGel={blue:clustered,charged,until:B.t+(clustered?4:P.dur)};
          if(clustered){
            foes.forEach(e=>{if(!e.alive)return;B.damage(u,e,u.st.atk*S.bounceAtk,{type:'physical',tag:'Repulsion Landing'});B.applyStatus(u,e,'slow',3);if(chellRed(u))B.energy(e,-12);});
            B.alliesOf(u).forEach(a=>{if(a.alive)B.applyStatus(u,a,'chell_repulsion',4);});
          }else{
            B.alliesOf(u).forEach(a=>{if(a.alive)B.applyStatus(u,a,'chell_propulsion',P.dur,{haste:chellRed(u)});});
            foes.forEach(e=>{if(e.alive&&Math.abs(e.x-cx)>P.spread/2){B.applyStatus(u,e,'chell_disoriented',4);B.damage(u,e,u.st.atk*S.bounceAtk*.6,{type:'physical',tag:'Gel Collision'});}});
          }
        });
      }
    },

    /* ---------------- PURPLE: Long Fall Boots ---------------- */
    P: {
      name: 'Long Fall Boots',
      type: 'Evasion / Control / Survival',
      v: { cubeAtk: .9 },
      p: { evaPct: 25, guardDur: 5, escapeCd: 10 },
      desc:(S,P)=>`<b>Long Fall Boots / Morality Core:</b> +${P.evaPct}% Evasion. On a melee dodge, Chell visibly steps through linked portals behind her attacker; her next cube delivery gains bonus damage and a short interrupt. Portal escapes generate 1 Momentum (at most once per second on dodges). Every escape grants 15% Damage Reduction for ${P.guardDur}s. Morality intercepts one Critical Hit against Chell before it lands while her portals are open (once every ${P.escapeCd}s).`,
      passive:(u,B,S,P)=>{
        ChellVisuals.activate(u,B,'morality');
        u.flat.evaP_purple=P.evaPct/100;u.dirty=true;u._cubeAtk=S.cubeAtk;
        B.on(u,'dodged',ev=>{
          if(!u.alive)return;
          const a=ev?.src;
          if(a?.alive&&a.team!==u.team&&B.distance(u,a)<200){
            ChellVisuals.escape(u,B,a.x-(a.face||1)*40,a.depth);
            if(B.t>=(u._chellDodgeChargeAt||0)){ChellVisuals.charge(u,B,1);u._chellDodgeChargeAt=B.t+1;}
          }
          u._cubeDrop=true;
          B.applyStatus(u,u,'chell_portal_guard',P.guardDur);
          if(chellRed(u))B.energy(u,10);
        });
        B.on(u,'allyDamaged',ev=>{
          if(!u.alive||!ev||ev.unit!==u||!ev.crit||ev.dot||!u._portal||!(ev.amount>0))return;
          if(u._escapeAt!=null&&B.t-u._escapeAt<P.escapeCd)return;
          u._escapeAt=B.t;ev.amount=0;ChellVisuals.charge(u,B,1);
          ChellVisuals.speak(u,B,'morality');
          ChellVisuals.escape(u,B,u.x-u.face*65,u.depth);
          B.applyStatus(u,u,'chell_portal_guard',P.guardDur);
        });
      }
    },

    /* ---------------- RED: Aperture Science Testing Initiative ---------------- */
    R: {
      name: 'Unsupervised Test Chamber',
      type: 'Physical Damage / Control / Support',
      v: { dropAtk: 3.2 },
      p: { hpPct: 12, evaPct: 6, hastePct: 10 },
      desc:(S,P)=>`The cores coordinate a <b>Chamber Override</b> once per wave after three redirects or five portal displacements. Enemies are pulled together, routed through a shared portal drop, take heavy Physical Damage, and are Stunned for 1.6s. A Hard-Light Bridge gives allies 30% Damage Reduction for 8s. White targets one extra enemy and Disorients longer; Intelligence's gels gain Skill Haste or Energy drain; portal dodges grant Energy. +${P.hpPct}% Max HP, +${P.evaPct}% Evasion, +${P.hastePct}% Skill Haste.`,
      passive: (u, B, S, P) => {
        u._chellRed = true;
        u._chellOverrideP = { dropAtk: S.dropAtk };
        u.flat.hpP_red = P.hpPct / 100;
        u.flat.evaP_red = P.evaPct / 100;
        u.flat.cdr_red = P.hastePct / 100;
        u.dirty = true;
      }
    }
  }
});

/* ============================================================ ROSTER & DATA REGISTRATION */

if (typeof SPECIAL_HERO_ART !== 'undefined') SPECIAL_HERO_ART.Chell = 'assets/aperture/chell/Chell.png';
if (typeof SPECIAL_HERO_ICONS !== 'undefined') SPECIAL_HERO_ICONS.Chell = 'assets/aperture/chell/icon.png';
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Chell')) HERO_IDS.push('Chell');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Chell')) PLAYABLE_IDS.push('Chell');
if (typeof COLLAB_HERO_IDS !== 'undefined') COLLAB_HERO_IDS.add('Chell');
{
  // Chell is recruited through Dyle's shop, not shards. She shows as an event Hero.
  const obtain = obtainOf;
  obtainOf = function (id) {
    if (id === 'Chell') return Object.assign({}, OBTAIN.Event, { icon: '🌀', color: '#ff9a2e' });
    return obtain.apply(this, arguments);
  };
}
