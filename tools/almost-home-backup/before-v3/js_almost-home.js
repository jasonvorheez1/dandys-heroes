/* Almost Home: a small post-FF7 intermission. Battles are non-canon bonus unlocks. */
'use strict';
(() => {
  const ID = 'modded-almost-home';
  const cast = ['Dango', 'Jessie', 'Cody', 'Nugget'];
  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'AFTERNOON', date: 'AFTER THE GOLD SAUCER' });
  const story = [
    scene('01 · Back already?', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@music stNeutral
@enter Gigi left
@enter Vee right
> Gigi pushes the door open with her shoulder. The others follow her out of the Gold Saucer.
Gigi: Oh, finally.
Vee: Hold the door. Shelly's still behind us.
@enter Shelly center
Shelly: I'm here. You can let go.
Gigi: See? Gardenview. I told you I knew which one it was.
@exit Shelly
@enter Dango center
Dango [note]: Okaeri! Did you have a nice—oh. There are more of you.
Vee: Were you expecting someone?
Dango: Dandy said to wait here. I thought he meant Jessie.
Gigi: Do we know you?
Dango: I'm Dango. I work here. Um, for the Japanese event. With Jessie, Cody and Nugget.
Vee: Since when?
Dango: Since Dandy assigned us. Is… is there a problem?
Gigi: No, we just weren't gone that long.
@exit Gigi
@enter Cody left
Cody: You letting 'em in or interviewing 'em?
Dango: I was saying hello!
Cody: Well, now they're standing in the doorway.
> Dango steps aside. Above the desk hangs a photograph of the lobby. None of them are in it.`),
    scene('02 · Take a seat', 'Welcome Room', `
@bg Stagebackgrounds/maps/diner.png
@music stBossa
@enter Dango left
@enter Shelly right
> Dango carries over a tray. Shelly moves a stack of forms so she can put it down.
Dango: Ah, thank you. Those can go on the chair.
Shelly: Won't you need the chair?
Dango: I'm fine standing.
Shelly: You've been standing since we got here.
Dango: It's only been…
> She looks up at the clock. Three fifteen.
Dango: Huh. I thought it was later.
@enter Gigi center
Gigi: Is anyone eating these?
Dango: They're for you. Please, take one.
Gigi: Thanks.
> Gigi takes two and slides the plate toward Shelly.
@exit Gigi
@enter Cody center
Cody: You gave her the chipped one.
Dango: What?
Cody: The cup. Handle's chipped.
Dango [sweat]: Oh, I'm sorry! Here, let me get another. You didn't cut yourself, did you?
Shelly: No, I haven't picked it up yet.
Dango: Right. Yes. I'll just swap it.
> Cody takes the cup from the tray and keeps it.
Cody: There. Sorted.
@exit Shelly
@enter Vee right
Vee: Dango, is there another clock in here?
Dango: There's one in Jessie's room. Why?
Vee: This one's stopped.
Dango: Again? Nugget changed the battery this morning.
Cody: Did he change it, or did he say he'd change it?
Dango: He gave me the old one.
> Cody looks at the clock, then puts his tea down.`),
    scene('03 · Rehearsal', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@music stNeutral
@enter Jessie right
@enter Nugget left
Jessie: Nugget. That chair needs to go back.
Nugget: There aren't any seats out there.
Jessie: Because we're not open yet.
Nugget: Well, they're here.
@enter Gigi center
Gigi: We can stand.
Jessie: No, stay. I could use someone who hasn't heard this six times.
@exit Nugget
@enter Dango left
Dango: Do you want the music from the beginning?
Jessie: Second verse. Onegaishimasu.
Dango: Okay. Second verse…
> The backing track starts. Dango hasn't touched the controls.
Jessie: Oh. You found it.
Dango [?]: I didn't press anything.
Jessie: Was it still running?
Dango: No. I stopped it when you went for lunch.
> Jessie lowers the microphone. They wait. The track stops halfway through a word.
@exit Gigi
@enter Vee center
Vee: Who's in the booth?
Jessie: We don't have anybody in today.
Vee: Then let's leave it off.
> Beside the stage is a poster: JESSIE IN CENTER STAGE. Playing on 7/24/1998.
@image ahJessie
Jessie: Don't look at that one. I asked him to use the other drawing.
Vee: Is that when the show opened?
Jessie: I guess. Dandy had it printed.
Vee: You don't remember?
Jessie: I remember doing the show. I don't remember that date.
@imgoff
> Dango turns the sound off at the wall.`),
    scene('04 · Staff only', 'Backstage', `
@bg Stagebackgrounds/maps/vee-storage.webp
@music stInteresting
@enter Dango left
@enter Shelly right
> Dango checks her clipboard while Shelly holds the backstage door.
Dango: It says the staff room's through here.
Shelly: Are you sure? We just came from there.
Dango: I know. Let me check.
@enter Nugget center
Nugget: Try it now.
Dango: What did you do?
Nugget: Closed it all the way.
> Dango opens the door. The welcome room is on the other side. Cody's chipped cup is still on the table.
Nugget [dots]: …Okay. Don't know, then.
@exit Nugget
@enter Gigi center
Gigi: That's not where that room goes.
Shelly: No. It isn't.
> Shelly lets the door close. There's another poster on the back: DANGO'S BEHIND THE SCENES! Playing on 04/05/2000.
@image ahDango
Dango: I haven't seen this one before.
Gigi: You're on it.
Dango: I can see that.
@imgoff
@exit Gigi
@enter Cody center
Cody: You all right?
Dango [sweat]: I don't know. They keep asking me where things are, and I keep getting it wrong.
Cody: The room moved. That's not you getting it wrong.
Dango: I work here. I should know how to get to the staff room.
Shelly: We thought we lived here. We were wrong too.
> Dango looks from Shelly to the closed door.
Dango: Oh. You mean this isn't yours.
Shelly: It looks like ours. That's why we came in.
Dango: …I'll find Dandy.`),
    scene('05 · Ask Dandy', 'Gardenview Station', `
@bg uploads/gardenviewtrainstation.webp
@music stNeutral
@enter Dandy right
@enter Vee left
Dandy: There you are! Dango said you'd gotten turned around.
Vee: We came through a door from the Gold Saucer. We thought we were home.
Dandy: Ah. No, you'd want the station exit.
Vee: That would've been useful an hour ago.
Dandy: Nobody asked me.
@enter Dango center
Dango: I told them they were home.
Dandy: Well, you weren't to know.
Dango [dots]: You gave me the sign.
> Dandy glances at her, then takes a key off his ring.
Dandy: Station exit. End of the hall, on your left. This will open it.
@exit Dango
@enter Cody center
Cody: It opens the right door, yeah? We've had enough of that staff room.
Dandy: Yes, Cody.
Cody: Just checking.
@exit Cody
@enter Jessie center
Jessie [?]: Wait. They're leaving now?
Vee: Once we've got everyone.
Jessie: I was going to finish the song.
Vee: Next visit. After you've had that sound system looked at.
Jessie: Fair enough.
@exit Dandy
@enter Gigi right
Gigi: Are you coming?
Jessie: Me? No, we're staying here.
Gigi: Even with the doors doing that?
Jessie: I'm making Dandy walk me back. If we get stuck, he's missing dinner too.
@exit Jessie
@enter Dango center
Dango: Gigi? You left this on the desk.
> She hands Gigi a little paper bag.
Gigi: Oh, the biscuits. Thanks.
Dango: Have a safe trip. And… sorry about earlier.
Gigi: You did give us tea. That helped.
> Dango nods. She stays by the door until everyone has gone through.`),
    scene('06 · Home', 'Gardenview · Gigi’s Room', `
@bg uploads/backgroundlobby2.png
@music stEmotional
@enter Gigi center
> Gigi steps into her own Gardenview. A familiar rattle comes from the lobby vending machine.
Gigi: Still broken.
@enter Vee left
Vee: Don't kick it. Let's get everyone inside first.
@enter Shelly right
Shelly: Same notice on the wall. The one about the lift.
Gigi: Come on. I want to check something.
@exitall
@bg Stagebackgrounds/maps/rainbow-rooms.png
@enter Gigi center
> Upstairs, Gigi opens her room. Her things are where she left them before the Gold Saucer trip.
> She kneels beside a shelf and reaches underneath it.
Gigi: Still here.
@enter Shelly right
Shelly: What's that?
Gigi: A token. Rolled under there before we left. Couldn't reach it.
Shelly: How'd you get it this time?
> Gigi holds up a ruler.
Gigi: Had some time to think about it.
> She puts the token on her shelf, beside the bag Dango gave her.
Gigi: I'm staying in tomorrow.
Shelly: I'll tell the others.
@exitall
@bg Stagebackgrounds/maps/vee-storage.webp
@enter Dango left
@enter Cody right
> Back at the other Gardenview, Cody wedges the staff-room door open. Nugget carries the tea tray through it.
Dango: Is that going to hold?
Cody: Been holding for five minutes.
Dango: Don't lean on it.
Cody: I'm not leaning on it.
@enter Jessie center
Jessie: Is anyone coming? I found the proper staff room.
Dango [!] (jump): Oh! Where?
Jessie: Other side of the stage. Somebody put a cabinet in front of it.
@exitall
> The four of them go to dinner. Dango brings her clipboard; Jessie makes her leave it outside.`)
  ];
  const bonus = [
    scene('Dango · Just tea', 'Tea Counter', `
@bg Stagebackgrounds/maps/diner.png
@music stBossa
@enter Dango left
@enter Gigi right
Gigi: Can I have another one?
Dango: Was there something wrong with it?
Gigi: No. I drank it.
Dango [sweat]: Oh! Right. Of course.
> Dango takes the empty cup. Gigi watches her fill it.
Dango: Same amount of sugar?
Gigi: Yeah, please.
> She sets the cup down. This time, she leaves the sugar bowl within Gigi's reach.
Gigi: You're having one too, right?
Dango: I should get back to the desk.
Gigi: You can see it from here.
> Dango looks over her shoulder. The desk is empty.
Dango: …I suppose I can sit here for a minute.`),
    scene('Jessie · Sound check', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@music stNeutral
@enter Jessie right
@enter Nugget left
Jessie: Can you hear me at the back?
Nugget: Yeah.
Jessie: You're in the front row.
> Nugget gets up and walks to the back of the room.
Nugget~: Try it now.
Jessie: One, two—
Nugget~: Yeah!
Jessie: Don't shout. I can't tell how loud I am.
Nugget~: …Yes.
Jessie: Thank you. Stay there for this next bit.
> Jessie adjusts the microphone stand. Nugget pulls up a chair.`),
    scene('Cody · Keep walking', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@music stBossa
@enter Dango left
@enter Cody right
Dango: Cody? Could you come around the front next time?
Cody: Why?
Dango: I hear the chains before I see you. It makes me jump.
Cody: You can see me now.
Dango: Yes, but I couldn't a minute ago.
Cody: Want me to announce myself?
Dango [!] : No! Just… don't stand behind me without saying anything.
Cody: All right.
> He walks toward the hall, then stops.
Cody: Hey, Dango.
Dango: Yes?
Cody: I'm leaving.
Dango: I can see that.
> Cody grins and keeps walking.`),
    scene('Nugget · Lunch break', 'Backstage', `
@bg Stagebackgrounds/maps/vee-storage.webp
@music stBossa
@enter Nugget left
@enter Jessie right
Jessie: Have you seen my lunch?
Nugget: Which bag?
Jessie: White one. On that chair.
Nugget: In the fridge.
Jessie: Why?
Nugget: You said to clear the chairs.
> Jessie goes to the fridge. Nugget goes back to stacking programs.
Jessie~: You put my scarf in here too.
Nugget: Was that not your bag?
Jessie~: It was wrapped around the bag.
> She comes back carrying both. The scarf is cold.
Jessie: Next time, just ask me.
Nugget: Okay. Do you want the bag now?
Jessie: I've got it, Nugget.`)
  ];

  Object.assign(ST3_IMAGES, { ahJessie: { src: 'assets/almost-home/jessie-poster.png', cap: 'Jessie in Center Stage · 7/24/1998' }, ahDango: { src: 'assets/almost-home/dango-poster.png', cap: 'Dango’s Behind the Scenes! · 04/05/2000' } });
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
    if (!data) return;
    if (extra ? !state().bonus[index] : index > 0 && !state().read[index - 1]) return;
    StoryUI.playScene(0, false, {
      scene: data,
      startLine: start,
      portrait: id => cast.includes(id) ? ASSET + `Characters/${id}/vn.webp` : stPortrait(id),
      onProgress: line => {
        if (!extra) { state().bookmark = { index, line }; Save.write(); }
      },
      onFinish: skipped => {
        if (!extra && !skipped) { state().read[index] = true; state().bookmark = null; Save.write(); }
        home();
        Music.play('stNeutral');
      }
    });
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
