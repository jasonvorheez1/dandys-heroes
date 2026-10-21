/* tutorial.js - Dandy's Buds coaching. Dandy points to the next useful
   action, then calls out the first battle moments a new player can act on. */
'use strict';

const DandyCoach = {
  dialogueWasSeen(key) {
    const buds = Save.data && Save.data.buds;
    return !!(buds && buds.dialogueSeen && buds.dialogueSeen[key]);
  },

  rememberDialogue(key) {
    if (!key) return;
    const buds = Save.data && Save.data.buds;
    if (!buds) return;
    if (!buds.dialogueSeen || typeof buds.dialogueSeen !== 'object') buds.dialogueSeen = {};
    buds.dialogueSeen[key] = true;
    Save.write();
  },

  stageInfo(stage, chosen) {
    return {
      1: {
        label: 'LEARN THE LOOP',
        title: 'Start with the simple routine',
        speech: 'Poppy and Boxten already know enough to get you through this floor. I will point out the room, the team, and the recovery button as they become useful.',
        focus: 'Learn the room button, watch carried health, and let the automatic battle finish.',
        why: 'Damage and decisions carry from room to room, so a calm check before every door saves a run.'
      },
      2: {
        label: 'KEEP THE TEAM ALIVE',
        title: `${chosen || 'Your new buddy'} joins the lesson`,
        speech: `${chosen || 'Your new buddy'} is ready, but Boxten is still the Toon I want you watching. I will show you when to recover and why a safe room is worth taking.`,
        focus: 'Keep the starter pair together, watch the backline, and use recovery before the next dangerous room.',
        why: 'A healthy smaller team is more useful than a full team that arrives at the next battle already hurt.'
      },
      3: {
        label: 'MAKE YOUR OWN CALLS',
        title: 'One final guided floor',
        speech: 'You know the rhythm now. I will still call out the important moments, but this floor is yours: check the squad, read the room, and choose the reward that helps your next run.',
        focus: 'Use your three-Toon formation, make one confident room decision, then choose your graduation gift.',
        why: 'The regular Depths will stop explaining every button, so this last floor is your safe practice lap.'
      }
    }[stage] || {
      label: 'DANDY\'S BUDS', title: 'Follow the next useful step',
      speech: 'I have a small suggestion for the room in front of you.',
      focus: 'Use the highlighted action, then check the next room.',
      why: 'The lesson is built one decision at a time.'
    };
  },

  roomAdvice(stage, node, type, firstRoom) {
    if (type === 'rest') return {
      title: 'USE THE SAFE ROOM',
      speech: 'This is your breathing space. Open it before another fight and let the room recover the team’s carried health.',
      doText: 'Open the room, then read the recovery result before continuing.',
      why: 'Recovery is strongest before a battle, not after a Toon is already down.',
      action: 'OPEN SAFE ROOM', target: '#endlessEnter', pointer: 'OPEN THE SAFE ROOM', actionType: 'enter'
    };
    if (type === 'treasure') return {
      title: 'TAKE THE FREE SUPPLIES',
      speech: 'No enemies here. Open the cache first; then choose the route card so the elevator knows what kind of help you want.',
      doText: 'Claim the cache, then choose one run card.',
      why: 'Permanent supplies and run cards are separate rewards. Do not leave the room before checking both.',
      action: 'OPEN CACHE', target: '#endlessEnter', pointer: 'OPEN THE CACHE', actionType: 'enter'
    };
    if (type === 'event') return {
      title: 'READ BEFORE YOU CHOOSE',
      speech: 'This room is a decision, not a reflex test. Read the cost and the reward on both choices; a safe reward is often better than a flashy one.',
      doText: 'Open the event and compare every cost, reward, and warning.',
      why: 'An event can change the whole run, including the health you carry into the next battle.',
      action: 'READ EVENT', target: '#endlessEnter', pointer: 'READ THE EVENT', actionType: 'enter'
    };
    if (type === 'machine') return {
      title: 'CHECK THE OPERATOR',
      speech: 'Pick one Toon for the extraction check. Higher stars mean a better chance at the full payout, and you can inspect the checks before committing.',
      doText: 'Open the machine, choose the strongest fit, and watch the check bars.',
      why: 'The machine is optional risk. A failed check still teaches you something, but it should never surprise you.',
      action: 'OPEN MACHINE', target: '#endlessEnter', pointer: 'OPEN THE MACHINE', actionType: 'enter'
    };
    if (firstRoom) return {
      title: stage === 1 ? 'CHECK THE STARTER TEAM' : stage === 2 ? 'PROTECT THE BACKLINE' : 'CHECK YOUR FORMATION',
      speech: stage === 1
        ? 'Before the first door, review the team once. Poppy and Boxten are locked for this lesson, so you can focus on the battle instead of building a perfect formation.'
        : stage === 2
          ? 'Review the team, then keep an eye on Boxten’s health. Your new buddy helps, but a fragile backliner still needs a safe room when the route offers one.'
          : 'Review the team before entering. Your three Buds are enough; the useful habit is checking who is healthy and what the next room asks for.',
      doText: 'Open Review Team & Enter, confirm the squad, then start the room.',
      why: 'The formation screen is where you make your important decision. Battle itself runs automatically.',
      action: 'REVIEW TEAM & ENTER', target: '#endlessEnter', pointer: 'REVIEW THE TEAM', actionType: 'enter'
    };
    return {
      title: type === 'boss' ? 'READ THE BOSS ROOM' : type === 'elite' ? 'RESPECT THE ELITE' : 'CHECK BEFORE THE DOOR',
      speech: type === 'boss'
        ? 'This is the hardest room on the floor. Make sure the team is healthy, then tap an enemy to inspect its gear before you commit.'
        : type === 'elite'
          ? 'Elite rooms hit harder and do not bring weak targets to soften the fight. A healthy team and a quick enemy inspection are worth the extra second.'
          : 'The fight is automatic, but the preparation is yours. Look at the threat card, check carried health, and enter when the team is ready.',
      doText: 'Tap an enemy for details, review the squad, then enter the battle.',
      why: 'Knowing what is behind the door lets you choose recovery, formation, or courage on purpose.',
      action: 'REVIEW SQUAD', target: '#endlessTeam', pointer: 'REVIEW THE SQUAD', actionType: 'team'
    };
  },

  menuCard(stage, node, type, rooms) {
    const firstRoom = node === 0;
    const stageInfo = this.stageInfo(stage, Save.data.buds && Save.data.buds.chosen);
    const advice = this.roomAdvice(stage, node, type, firstRoom);
    return `<section class="buds-menu-coach" aria-live="polite" data-dandy-target="${advice.target}" data-dandy-pointer="${advice.pointer}">
      <img src="uploads/dandyhimself.png" alt="Dandy"><div class="buds-coach-copy">
        <small>DANDY'S BUDS · FLOOR ${stage}/3 · ROOM ${String(node + 1).padStart(2, '0')} / ${String(rooms).padStart(2, '0')}</small>
        <b>${stageInfo.label} · ${advice.title}</b>
        <span class="buds-coach-speech"><strong>DANDY SAYS</strong> ${advice.speech}</span>
        <div class="buds-coach-guide"><span><b>DO THIS</b>${advice.doText}</span><span><b>WHY</b>${advice.why}</span></div>
        <span class="buds-coach-focus"><strong>LESSON FOCUS</strong> ${stageInfo.focus}</span>
      </div><button type="button" data-dandy-action="${advice.actionType}">${advice.action} <strong>›</strong></button></section>`;
  },

  teamCard(stage, chosen) {
    const info = this.stageInfo(stage, chosen);
    const card = el('section', 'dandy-team-coach');
    card.innerHTML = `<img src="uploads/dandyhimself.png" alt="Dandy"><div><small>DANDY'S SQUAD CHECK · FLOOR ${stage}/3</small><b>${info.title}</b><span>${info.speech}</span><em>${info.why}</em></div>`;
    return card;
  },

  clear() {
    if (this._pausedBattle && !this._pausedBattle.over) {
      this._pausedBattle.paused = false;
      this._pausedBattle.last = performance.now();
    }
    this._pausedBattle = null;
    $$('.dandy-battle-coach').forEach(n => n.remove());
    this.clearPointers();
  },

  clearPointers() {
    $$('.dandy-pointer-target').forEach(n => {
      n.classList.remove('dandy-pointer-target');
      n.removeAttribute('data-dandy-pointer');
    });
  },

  point(target, label) {
    this.clearPointers();
    if (!target) return;
    target.classList.add('dandy-pointer-target');
    if (label) target.setAttribute('data-dandy-pointer', label);
  },

  battle(B, opt) {
    if (!B || !opt) return;
    this.clear();
    const host = $('#battle');
    if (!host) return;
    const coach = el('aside', 'dandy-battle-coach');
    coach.setAttribute('aria-live', 'assertive');
    host.appendChild(coach);
    B._dandyCoach = coach;

    let current = 0, castSeen = false, lowSeen = false, downSeen = false;
    const spotlight = selector => {
      const target = $(selector);
      if (!target) return;
      target.classList.remove('dandy-coach-focus');
      void target.offsetWidth;
      target.classList.add('dandy-coach-focus');
      setTimeout(() => target.classList.remove('dandy-coach-focus'), 1800);
    };
    const say = (title, text, target, label = 'CONTINUE', seenKey = '') => {
      if (!coach.isConnected || (seenKey && this.dialogueWasSeen(seenKey))) return false;
      if (seenKey) this.rememberDialogue(seenKey);
      current++;
      coach.classList.remove('show');
      coach.innerHTML = `<img src="uploads/dandyhimself.png" alt="Dandy"><div><small>DANDY'S COMBAT CHECK · ${current} · GAME PAUSED</small><b>${title}</b><p>${text}</p></div><button type="button">${label}</button>`;
      requestAnimationFrame(() => coach.classList.add('show'));
      if (target) spotlight(target);
      B.paused = true;
      this._pausedBattle = B;
      const dismiss = () => {
        coach.classList.remove('show');
        if (this._pausedBattle === B) {
          B.paused = false;
          B.last = performance.now();
          this._pausedBattle = null;
        }
      };
      $('button', coach).onclick = dismiss;
      return true;
    };

    const newBuddy = HEROES[opt.heroName];
    const intro = opt.stage === 1
      ? ['YOU’RE THE COACH', 'The Toons fight on their own. Your job is preparation: check the formation before the room, watch health during the fight, and use the speed or Auto controls when you want to follow the action.', '#hudBtns']
      : opt.stage === 2
        ? ['WATCH THE FORMATION', `${newBuddy ? `${newBuddy.name} is your trained ${newBuddy.role.toLowerCase()} buddy.` : 'Your new buddy is trained and in the lineup.'} Press Enter Battle when you are ready. Keep an eye on Boxten’s health, and use the next Safe Room before the team becomes fragile.`, '#allyDock']
        : ['THE WHOLE ROUTINE', 'Your squad is set. Press Enter Battle when you are ready, watch the health bars, then use the route to choose recovery or rewards before the next fight.', '#allyDock'];

    B.after(.35, () => say(intro[0], intro[1], intro[2], 'CONTINUE', `intro-stage-${opt.stage}`));
    B.after(3.1, () => {
      if (!castSeen) say('BATTLE IS AUTOMATIC', opt.stage === 1
        ? 'Do not hunt for a skill button. White skills fire when Energy is full. Your useful choices are the team before the fight, the speed controls, and the next room.'
        : 'You can watch without tapping every Toon. Let Energy fill, notice who is being pressured, and save your attention for the next room decision.', '#hudBtns', 'CONTINUE', 'automatic-battle');
    });
    B.after(6.3, () => {
      if (!castSeen) say('ENERGY IS BUILDING', 'The bar under each Toon fills from fighting and taking hits. At full Energy, their White skill fires automatically.', '#allyDock', 'CONTINUE', 'energy-and-white-skill');
    });

    const allies = B.units.filter(u => u.team === TEAM_P && !u.minion);
    allies.forEach(u => {
      B.on(u, 'cast', ev => {
        if (castSeen || !ev || ev.key !== 'W') return;
        castSeen = true;
        say('WHITE SKILL FIRED!', `${u.name} used ${u.def.skills.W.name}. You never need to tap a skill in battle; full Energy triggers the big move.`, '#allyDock', 'CONTINUE', 'white-skill-fired');
      });
      B.on(u, 'allyLow', ally => {
        if (lowSeen || !ally || ally.team !== TEAM_P) return;
        lowSeen = true;
        say('HEALTH CARRIES OVER', `${ally.name} is below 40%. Finish this room if you can, then use the next Safe Room to recover the squad.`, '#allyDock', 'CONTINUE', 'carried-health');
      });
      // The death event belongs to the unit that just became inactive, so its
      // listener is intentionally skipped by the battle event bus. A live
      // teammate receives allyDown instead, which gives the first-loss lesson
      // a reliable trigger even when the whole party is wiped in one tick.
      B.on(u, 'allyDown', fallen => {
        if (downSeen || !fallen || fallen.team !== TEAM_P) return;
        const buds = Save.data && Save.data.buds;
        if (!buds || buds.state !== 'active' || buds.levelTutorialShown) return;
        downSeen = true;
        buds.levelTutorialShown = true;
        buds.levelTutorialPending = true;
        Save.write();
        say('A BUD WENT DOWN', 'This is your cue to grow the team. Finish the room if you can; Dandy has a level-up kit waiting for you afterwards.', '#allyDock', 'CONTINUE', 'bud-went-down');
      });
    });
  }
};
