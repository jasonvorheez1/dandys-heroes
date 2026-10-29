/* Almost Home: a small post-FF7 intermission. Battles are non-canon bonus unlocks. */
'use strict';
(() => {
  const ID = 'modded-almost-home';
  const cast = ['Dango', 'Jessie', 'Cody', 'Nugget'];
  const scene = (title, place, lines) => ({ title, place, lines: lines.trim().split('\n').map(line => { const i = line.indexOf(': '); return i < 0 ? ['', line] : [line.slice(0, i), line.slice(i + 2)]; }) });
  const story = [
    scene('01 · The door marked HOME', 'Gardenview? · station', `After the Gold Saucer, a familiar door feels like the best thing in the world.
Gigi: Same handle. Same squeak. Please let this one have our vending machine.
Vee: Everyone together. We are done taking scenic routes.
The door opens onto Gardenview. Warm lights. Old carpet. A bench where a bench ought to be.
Shelly: Oh, thank goodness. Home.
Dango: O-oh! Okaeri! Welcome back! Um… welcome, if you haven't been here. I practiced both.
Gigi: You work here?
Dango: Dandy assigned us to the Japanese event! Me, Jessie, Cody, and Nugget. I've got the welcome desk. And the apologies, apparently.
Cody: You assigned yourself the apologies.
Dango: Sorry.
Cody: See?
Vee: Our Dandy didn't mention a Japanese event.
Dango: Oh. Our Dandy mentioned you would say that.
Gigi: That's probably fine.
Above the desk, a little red ON AIR light switches on. Nobody has touched it.`),
    scene('02 · Tea, with a side of paperwork', 'The welcome room', `Dango sets out tea, then moves every cup exactly one inch to the left.
Dango: Itadakimasu—oh, that's before eating. There's food coming! Unless you'd rather not. I can un-announce it.
Shelly: Tea sounds lovely. You can sit down too.
Dango: Sit? During welcoming hours?
Cody: She's been welcoming this chair since nine.
Gigi: What's with the tape on the floor?
Dango: My mark! It's where I'm supposed to stand when somebody comes home.
Vee: Does everybody get a mark?
Cody: Mine says “look approachable.”
Gigi: How's that going?
Cody: Poorly.
The wall clock gives a polite chime. Its hands haven't moved since they arrived.
Dango: It's been three fifteen for a while. Dandy says it makes the afternoon last longer.
Shelly: Does that bother you?
Dango: Only when I have a four o'clock appointment.
Nugget: Good news. You're early.`),
    scene('03 · Jessie takes five', 'Center Stage · rehearsal', `A handmade poster reads JESSIE IN CENTER STAGE — PLAYING ON 7/24/1998.
Jessie: Irasshaimase! Welcome to rehearsal! Applause goes here, snacks go there, and whoever ate the prop strawberry owes me a strawberry.
Nugget: Real or prop?
Jessie: At this point, emotionally real.
Gigi: That poster's old.
Jessie: Vintage. Dandy says it gives us history.
Vee: Did you perform that show?
Jessie: I know the opening. I know the bow. The middle keeps getting revised.
Dango: I have the revised revision. Unless this is the old new one.
Jessie: Daijoubu, Dango. We'll take it from the top.
Cody: In English for the visitors?
Jessie: Right! It's okay. From the top. See? International professionalism.
The music starts before Jessie lifts her microphone. She lowers it. The music stops.
Jessie: Well. Somebody finally learned my cues.
Behind the curtain, there is no sound booth. Just another painted wall.`),
    scene('04 · Behind the scenes', 'Backstage · the poster wall', `DANGO'S BEHIND THE SCENES! PLAYING ON 04/05/2000. Dango studies the poster as if it might ask her a question.
Dango: That's my clipboard. That's my worried face. I didn't know it had a premiere.
Cody: Every day. Matinee on weekends.
Dango: Are you teasing me?
Cody: A little. You looked like you needed something normal.
Shelly: We thought this was our Gardenview. But our backstage door opens into storage.
Nugget opens the door. The welcome room waits on the other side. The same tea is still steaming.
Nugget: Storage with refreshments.
Vee: That's the third door back to that room.
Dango: Then… you weren't coming back to us?
Gigi: We didn't know you were here.
Dango: Oh. I made a welcome-home sign.
Shelly: We're glad we met you. The sign still counts.
Dango: Can I keep that answer? I'd like to use it when I start worrying again.
Cody: Put it on the clipboard.
She does.`),
    scene('05 · The last train after rehearsal', 'Station · evening lights', `This Gardenview's Dandy arrives carrying four schedules and one key.
Dandy: My Japanese event toons! How did our guests enjoy their afternoon?
Vee: Which Gardenview is this?
Dandy: The one on your admission slip.
Gigi: We didn't get an admission slip.
Dandy: Ah. Door guests.
Dango: Dandy… if they're going home, can we stop saying they already are?
For once, she doesn't apologize after the question.
Dandy: Certainly. The station door will do. One destination, no detours.
Cody: Put that in writing.
Nugget hands him Dango's clipboard. Dandy writes it down.
Jessie: Then it's a send-off! Otsukaresama—thanks for spending the afternoon with us.
Gigi: Do you four get to leave too?
Jessie: We have rehearsal tomorrow. But come visit when we're actually expecting you.
Dango: I'll make a different sign. “Welcome.” Just welcome.
Shelly: That sounds perfect.
Vee checks the new destination card: THEIR GARDENVIEW. She keeps the signed promise.
This time, when the clock chimes, the minute hand moves.`),
    scene('06 · Actual Gardenview', 'HOME · actual Gardenview', `The station light fades. No stage curtain follows it.
Gigi steps through the door into the Gardenview where she lives. Her familiar things are here, exactly where she left them.
Gigi: My room. My stuff. My emergency snacks.
Vee: Check something nobody else would know.
Gigi reaches behind a loose corner of a shelf and pulls out a crumpled sweet wrapper.
Gigi: From before we left. I was going to throw that away.
Shelly: You can do that now.
Gigi: Big day for closure.
She drops it in the bin. The others come in behind her. Their own Gardenview hums around them.
Gigi: Yeah. We're home.
Elsewhere, Dango pins WELCOME above her desk. Jessie rehearses a bow. Cody adjusts a chain. Nugget rescues the last snack.
Dango: Does the sign look okay?
Cody: Looks like a sign.
Dango: That is… actually very reassuring.
They have never gone Twisted. Not Dango, not Jessie, not Cody, not Nugget.
Not yet.
For now, tomorrow's biggest problem is who ate the prop strawberry.`)
  ];
  const bonus = [
    scene('Dango · A perfectly normal order', 'Bonus scene · tea counter', `This memory stands on its own. The battle that unlocked it is not part of the story.
Gigi: One tea, please.
Dango: Any preference? Temperature? Cup? An apology about the cup?
Gigi: The cup can be innocent this time.
Dango: Right. One tea. No apology.
She serves it. Nobody looks upset. Nobody asks to speak to Dandy.
Dango: I think that went well.
Cody: You can stop whispering. You won.
Dango: I wasn't aware we were competing.
Cody: With the cup.`),
    scene('Jessie · The announcement', 'Bonus scene · Center Stage', `This memory stands on its own. No battle happened here.
Jessie: Honjitsu wa—thank you for joining us today! Please silence your phones.
Nugget: Does that include toy phones?
Jessie: Especially toy phones.
Nugget's pocket produces one tiny plastic ring.
Jessie: You waited for that cue.
Nugget: Professionalism.
Jessie: I hate that I respect it.`),
    scene('Cody · Approachable', 'Bonus scene · lobby bench', `This memory stands on its own. No battle happened here.
Dango: Could you walk a little quieter? Just for the welcome recording?
Cody: The chains are part of the look.
Dango: They could be a quieter part of the look.
Cody takes one careful step. One chain creaks.
Dango: That sounded like a haunted cupboard.
Cody: A stylish haunted cupboard.
She laughs before she can stop herself.
Cody: Keep that take.`),
    scene('Nugget · The prop department', 'Bonus scene · backstage', `This memory stands on its own. No battle happened here.
Jessie: The strawberry is gone again.
Nugget: Before anyone jumps to conclusions, I have prepared a replacement.
He reveals a paper strawberry. It says STRAWBERRY in careful letters.
Dango: It's very clearly labeled.
Jessie: It needs to look real from the back row.
Cody: Bigger letters.
Nugget: I like how this team solves problems.`)
  ];
  const event = { id: ID, title: 'Almost Home! · Gardenview Intermission', label: 'ALMOST HOME!', isCollab: true,
    minMastery: 1, bossIds: [], featuredIds: cast, tag: 'MODDED · VISUAL NOVEL', stageLevels: [15], rewardMult: 1,
    blurb: 'After the Gold Saucer, a familiar door leads to a very unfamiliar afternoon.' };
  function state() { const r = Raid.state(); return r.almostHome || (r.almostHome = { read: {}, bonus: {}, bookmark: null }); }
  function art(id) { return ['Dango', 'Cody', 'Nugget'].includes(id) ? `Characters/${id}/vn.webp` : Art.hero(id); }
  function button(text, fn, cls = '') { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; }
  function home() { Screens._raidDossier = ID; Screens.go('raid'); }
  let tab = 'story';
  function read(index, extra = false, start = 0) {
    const data = (extra ? bonus : story)[index];
    const root = el('div', 'ah-reader');
    root.innerHTML = `<div class="ah-location"></div><div class="ah-cast"></div><div class="ah-dialogue"><strong></strong><p aria-live="polite"></p><div class="ah-reader-controls"></div></div>`;
    let line = Math.min(start, data.lines.length - 1);
    const render = () => {
      const [who, text] = data.lines[line];
      root.querySelector('.ah-location').textContent = data.place + ' · ' + (line + 1) + '/' + data.lines.length;
      root.querySelector('strong').textContent = who || 'Gardenview';
      root.querySelector('p').textContent = text;
      const portraits = root.querySelector('.ah-cast'); portraits.replaceChildren();
      if (who && HEROES[who]) { const img = document.createElement('img'); img.src = art(who); img.alt = who; portraits.append(img); }
      if (!extra) { state().bookmark = { index, line }; Save.write(); }
      const controls = root.querySelector('.ah-reader-controls'); controls.replaceChildren();
      const previous = button('◀ Back', () => { line--; render(); }); previous.disabled = line === 0;
      controls.append(previous, button('Close', () => UI.closeModal()), button(line === data.lines.length - 1 ? 'Finish scene ✓' : 'Next ▶', () => {
        if (line < data.lines.length - 1) { line++; render(); return; }
        if (!extra) { state().read[index] = true; state().bookmark = null; Save.write(); }
        UI.closeModal(); home();
      }));
    };
    render(); UI.modal(data.title, root);
  }
  function fight(i) {
    const level = 15 + i * 10;
    // Loan casts use the same spec factory as FF7 and don't modify owned heroes.
    const team = [...cast, 'Gigi'].map(id => FF7Event.spec(id, level, true));
    BattleScreen.launch({ team, foes: [FF7Event.spec('Cody', level, true), FF7Event.spec('Nugget', level, true)],
      music: 'ff7Battle', meta: { title: 'Bonus Challenge · ' + cast[i], floorLabel: 'Non-canon · scene unlock', roomIdx: 1, roomTotal: 1,
        bg: ASSET + 'uploads/backgroundlobby1.webp', timeLimit: 180, mods: [], mutations: [] }, rewards: () => ({}),
      onDone: result => { if (result.win && !result.quit) { state().bonus[i] = true; Save.write(); UI.toast('Bonus memory unlocked: ' + cast[i]); }
        tab = 'bonus'; home(); if (result.win && !result.quit) read(i, true); }
    });
  }
  function open(s) {
    const saved = state();
    const page = el('section', 'ah-event');
    page.innerHTML = `<div class="ah-top"><span>A GARDENVIEW INTERMISSION · AFTER FFVII</span></div><div class="ah-cover"><div><small>DANDY'S WORLD MODDED</small><h1>Almost<br><em>Home!</em></h1><p>A familiar door. An unfamiliar afternoon.</p><span class="ah-sticker">WELCOME BACK…?</span></div><div class="ah-cover-cast"></div></div><nav class="ah-tabs" aria-label="Intermission sections"></nav><div class="ah-content"></div><footer>Six little chapters · Four bonus memories · One way home</footer>`;
    page.querySelector('.ah-top').append(button('← Events', () => { Screens._raidDossier = null; Screens.render(); }));
    for (const id of ['Dango', 'Nugget']) { const img = document.createElement('img'); img.src = art(id); img.alt = id; page.querySelector('.ah-cover-cast').append(img); }
    const tabs = page.querySelector('.ah-tabs');
    for (const [id, title] of [['story','Storybook'], ['bonus','Bonus memories'], ['posters','Poster wall']]) {
      const b = button(title, () => { tab = id; home(); }, tab === id ? 'active' : ''); b.setAttribute('aria-pressed', String(tab === id)); tabs.append(b);
    }
    const body = page.querySelector('.ah-content');
    if (tab === 'story') {
      body.append(el('p', 'ah-note', 'A quiet afternoon after the Gold Saucer. Story chapters contain no battles.'));
      if (saved.bookmark) body.append(button('Continue reading ▶', () => read(saved.bookmark.index, false, saved.bookmark.line), 'ah-continue'));
      story.forEach((data, i) => { const unlocked = i === 0 || !!saved.read[i - 1]; const b = button('', () => read(i), 'ah-chapter');
        b.innerHTML = `<span>${saved.read[i] ? '✓' : unlocked ? '▷' : '🔒'}</span><div><strong>${data.title}</strong><small>${data.place}</small></div><b>${saved.read[i] ? 'Replay' : unlocked ? 'Read' : 'Locked'}</b>`;
        b.disabled = !unlocked; body.append(b); });
    } else if (tab === 'bonus') {
      body.append(el('p', 'ah-note', 'Each challenge unlocks one independent comedy scene. These fights never happen in the story. Loan toons are provided; losing costs no event progress.'));
      bonus.forEach((data, i) => { const card = el('article', 'ah-bonus'); card.innerHTML = `<img src="${art(cast[i])}" alt="${cast[i]}"><div><h3>${data.title}</h3><p>Non-canon challenge · Level ${15 + i * 10}</p></div>`;
        card.append(button(saved.bonus[i] ? 'Replay memory' : 'Battle → unlock scene', () => saved.bonus[i] ? read(i, true) : fight(i))); body.append(card); });
    } else {
      body.append(el('p', 'ah-note', 'Souvenirs from a Gardenview that almost felt like home. Poster dates belong to the posters.'));
      for (const [i, title, file] of [[2,'Jessie in Center Stage','jessie-poster.png'],[3,"Dango’s Behind the Scenes!",'dango-poster.png']]) {
        const card = el('figure', 'ah-poster');
        if (saved.read[i]) { const img = document.createElement('img'); img.src = 'assets/almost-home/' + file; img.alt = title; card.append(img); }
        card.append(el('figcaption', '', saved.read[i] ? title : '🔒 Read chapter ' + (i + 1) + ' to collect this poster')); body.append(card);
      }
    }
    s.append(page);
  }
  const weekly = weeklyEvents; weeklyEvents = function(week) { return [event, ...weekly(week)]; };
  const dossier = Screens.raidDossier; Screens.raidDossier = function(s, e) { return e.id === ID ? open(s) : dossier.call(this, s, e); };
  // Keep the event's own distinctive cover on the shared Events board.
  const ebCard = Screens.ebCard; Screens.ebCard = function(cfg) {
    if (cfg.title !== event.title) return ebCard.call(this, cfg);
    return ebCard.call(this, Object.assign({}, cfg, { accent: '#ef91b9', art: [art('Dango'), art('Nugget')], kind: 'MODDED · VISUAL NOVEL', sub: 'A small post-FFVII story with Dango, Jessie, Cody & Nugget' }));
  };
  window.AlmostHome = { story, bonus, state, read, fight, event };
})();
