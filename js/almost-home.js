/* Almost Home: a small post-FF7 intermission. Battles are non-canon bonus unlocks. */
'use strict';
(() => {
  const ID = 'modded-almost-home';
  const cast = ['Dango', 'Jessie', 'Cody', 'Nugget'];
  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'AFTERNOON', date: 'AFTER THE GOLD SAUCER' });
  Object.assign(MUSIC_TRACKS, { ahCandy: ASSET + 'assets/almost-home/aquacandyman.mp3', ahSega: ASSET + 'assets/almost-home/its-my-life-sega.mp3' });
  // Lightweight foreground props sit behind the existing main-story cast layer.
  function dressScene(command, setting, vn) {
    if (command !== 'ah') return;
    if (['close', 'wide', 'spotlight'].includes(setting)) {
      vn.classList.toggle('ah-close', setting === 'close');
      vn.classList.toggle('ah-spotlight', setting === 'spotlight');
      return;
    }
    let decor = vn.querySelector('.ah-scenery');
    if (!decor) { decor = el('div', 'ah-scenery'); decor.setAttribute('aria-hidden', 'true'); vn.appendChild(decor); }
    decor.className = 'ah-scenery ah-set-' + setting;
    const lights = '<svg class="ah-lights" viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M0 0 Q500 130 1000 0" fill="none" stroke="#63533f" stroke-width="3"/>' + [90,220,350,500,650,780,910].map((x,i)=>`<g transform="translate(${x} ${12+Math.sin(x/1000*Math.PI)*46})"><path d="M0 0v12" stroke="#63533f" stroke-width="2"/><ellipse cy="18" rx="7" ry="11" fill="${['#ffd88b','#ffa6bd','#b3ecd5'][i%3]}"/></g>`).join('') + '</svg>';
    const tea = '<svg class="ah-tea" viewBox="0 0 280 180"><ellipse cx="140" cy="154" rx="129" ry="18" fill="#48352a66"/><path d="M12 126h256l-16 22H28Z" fill="#b8754f" stroke="#53362d" stroke-width="4"/><ellipse cx="86" cy="124" rx="47" ry="10" fill="#fbecdc" stroke="#bc9990" stroke-width="3"/><path d="M51 72h68v25q-2 27-34 27T51 97Z" fill="#f2cad9" stroke="#72554f" stroke-width="4"/><path d="M121 80q32-6 27 16t-27 9" fill="none" stroke="#72554f" stroke-width="5"/><ellipse cx="85" cy="72" rx="34" ry="7" fill="#866040"/><g class="ah-steam" fill="none" stroke="#fff6e7" stroke-width="4" stroke-linecap="round"><path d="M70 57q-12-12 0-24t0-24M96 55q-12-12 0-24t0-24"/></g><ellipse cx="205" cy="125" rx="39" ry="10" fill="#fff4db" stroke="#bba28e" stroke-width="3"/><ellipse cx="205" cy="113" rx="24" ry="10" fill="#d99b62" stroke="#815638" stroke-width="3"/><path d="M189 110l14 7 17-8" fill="none" stroke="#fff6d7" stroke-width="4"/></svg>';
    const mic = '<svg class="ah-mic" viewBox="0 0 130 280"><ellipse cx="65" cy="266" rx="45" ry="9" fill="#23232c"/><path d="M65 262V82" stroke="#c2bdc4" stroke-width="8"/><path d="M65 263V82" stroke="#4d4756" stroke-width="3"/><g transform="rotate(-18 64 55)"><rect x="45" y="30" width="36" height="68" rx="14" fill="#30343e" stroke="#c3b3c4" stroke-width="3"/><ellipse cx="63" cy="29" rx="25" ry="29" fill="#96939e" stroke="#33313a" stroke-width="4"/><path d="M44 12l37 30M39 27l34 28M53 3l32 25" stroke="#53535e" stroke-width="2"/></g><path d="M57 101q-35 125 21 151" stroke="#20202c" stroke-width="3" fill="none"/></svg>';
    const bags = '<svg class="ah-bags" viewBox="0 0 220 180"><path d="M25 56h73l11 107H13Z" fill="#c49c6c" stroke="#604b3c" stroke-width="4"/><path d="M43 63V39q17-28 35 0v24" fill="none" stroke="#604b3c" stroke-width="5"/><path d="M105 77h92l12 86H96Z" fill="#f0c8d2" stroke="#795665" stroke-width="4"/><path d="M128 87V62q23-29 46 0v25" fill="none" stroke="#795665" stroke-width="5"/><path d="M126 117h56M137 130h34" stroke="#b37f91" stroke-width="4"/></svg>';
    const curtains = '<div class="ah-curtain ah-curtain-left"></div><div class="ah-curtain ah-curtain-right"></div>';
    decor.innerHTML = (setting === 'stage' ? curtains + lights + mic : setting === 'tea' ? lights + tea : setting === 'station' ? bags : setting === 'lobby' ? lights : setting === 'backstage' ? curtains : '');
    vn.classList.remove('ah-close', 'ah-spotlight');
  }

  const story = [
    scene('01 · Back already?', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@ah lobby
@music ahCandy
@enter Bassie left
@enter Vee right
> The door catches on a folded welcome mat. Bassie gives it a second push, and the Gold Saucer noise falls away behind them.
> Paper flowers hang from the ceiling. An electric fan turns beside the reception desk, fluttering a row of handwritten event notices.
Bassie: Oh! Gardenview. I thought we were going to miss it again.
Vee: Hold the door. Shelly's still behind us.
@enter Shelly center
Shelly: I'm here. You can let go.
Bassie: Gigi must be back by now, right?
Shelly: She got sent straight home. We took the long way.
@exit Shelly
@enter Dango center
Dango [note]: Okaeri! Did you have a nice—oh. There are more of you.
Vee: Were you expecting someone?
Dango: Dandy said to wait here. I thought he meant Jessie.
Bassie: Do we know you?
Dango: I'm Dango. I work here. Um, for the Japanese event. With Jessie, Cody and Nugget.
Vee: Did we miss an announcement?
Dango: Since Dandy assigned us. Is… is there a problem?
Bassie: No, we just weren't gone that long.
@exit Bassie
@enter Cody left
Cody: You letting 'em in or interviewing 'em?
Dango: I was saying hello!
Cody: Well, now they're standing in the doorway.
> Dango steps aside and catches the fan cord on her shoe. Cody gets a hand under the fan before it tips.
Dango [sweat]: Sorry! I keep forgetting that's there.
Cody: Move the fan, then.
> He puts it on the other side of the desk. Its breeze blows the welcome cards straight into his face.
Cody [dots]: …Other other side.`),
    scene('02 · Take a seat', 'Welcome Room', `
@bg Stagebackgrounds/maps/diner.png
@ah tea
@music ahCandy
@enter Dango left
@enter Shelly right
> The welcome room smells of toasted rice and warm tea. Someone has draped a pink cloth over two mismatched tables.
> Dango comes through sideways with a tray. Shelly lifts a stack of forms just before the cups reach them.
Dango: Ah, thank you. Those can go on the chair.
Shelly: Won't you need the chair?
Dango: I'm fine standing.
Shelly: You've been standing since we got here.
Dango: It's only been…
> She looks up at the clock. Three fifteen.
Dango: Huh. I thought it was later.
@enter Bassie center
Bassie: Are these for guests? They look too nice to touch.
Dango: They're for you. Please, take one.
Bassie: Thank you.
> She chooses the biscuit with the neatest icing. Half the icing stays on the plate.
Bassie [dots]: Oh.
Shelly: Here, use the little spoon.
@exit Bassie
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
> Cody stretches up and nudges the clock. It ticks forward, then slips back to three fifteen.
Cody: Yeah, that's broken.
Dango: Should I write it down?
Cody: Under the doors.
> Dango turns a page. The list already has two doors, a wobbly stool, and “buy more sugar” on it.`),
    scene('03 · Rehearsal', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@music ahSega
@ah stage
@enter Jessie right
@enter Nugget left
> A red curtain is tied up with spare costume ribbon. Jessie taps the microphone twice; Nugget drags a chair into the only patch of light.
Jessie: Nugget. That chair needs to go back.
Nugget: There aren't any seats out there.
Jessie: Because we're not open yet.
Nugget: Well, they're here.
@enter Bassie center
Bassie: We can stand.
Jessie: No, stay. I could use someone who hasn't heard this six times.
@exit Nugget
@enter Dango left
Dango: Do you want the music from the beginning?
Jessie: Second verse. Onegaishimasu.
Dango: Okay. Second verse…
> A bright chiptune backing track bursts from the speakers. Jessie grabs the microphone with both hands, a beat late.
@ah spotlight
Jessie [!] (jump): Ah—wait, wait!
> She catches up at the next bar. Nugget taps his shoes against the chair legs. Dango is still looking at the controls.
Jessie: Oh. You found it.
Dango [?]: I didn't press anything.
Jessie: Was it still running?
Dango: No. I stopped it when you went for lunch.
> Jessie lowers the microphone. The track stops halfway through a word.
Jessie: Every time I put it down! Watch.
> She lifts the microphone. The music comes back. Down: silence. Up: music.
@music ahSega
@ah wide
Nugget [note] (jump): Do it faster.
Jessie: I'm trying to sing!
@exit Bassie
@enter Vee center
Vee: Who's in the booth?
Jessie: We don't have anybody in today.
Vee: Someone has wired that very badly.
Jessie: Can you fix it?
Vee: I said badly, not mysteriously. Let me see.
> While Vee examines the cable, Shelly brushes a loose strip of tape off the poster beside the curtain. JESSIE IN CENTER STAGE. Playing on 7/24/1998.
@image ahJessie
Jessie: Don't look at that one. I asked him to use the other drawing.
Vee: Is that when the show opened?
Jessie: I guess. Dandy had it printed.
Vee: You didn't give him the date?
Jessie: I gave him three things to fix. He printed fifty copies first.
Dango: There are another fifty in the cupboard.
Jessie [dots]: Of course there are.
@imgoff
> Vee unplugs an adapter. Jessie lifts the microphone, lowers it, then grins. The music keeps playing.
Jessie [heart] (jump): Yes! From the second verse, please.
Dango: You're already in the second verse.
Jessie: Then I'm doing great.`),
    scene('04 · Staff only', 'Backstage', `
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@enter Dango left
@enter Shelly right
> Behind the curtain, a rack of costumes leaves just enough room to shuffle past. Shelly ducks under a paper lantern. Dango catches it before it hits the next one.
Dango: Sorry. The string keeps coming loose.
> She tucks the lantern back up and checks her clipboard while Shelly holds the backstage door.
Dango: It says the staff room's through here.
Shelly: Are you sure? We just came from there.
Dango: I know. Let me check.
@enter Nugget center
Nugget: Try it now.
Dango: What did you do?
Nugget: Closed it all the way.
> Dango opens the door. The welcome room is on the other side. Cody's chipped cup is still on the table, now with a biscuit balanced on top.
Nugget [dots]: …Okay. Don't know, then.
@exit Nugget
@enter Bassie center
Bassie: That's not where that room goes.
Shelly: No. It isn't.
> Shelly props the door with a paint tin. On its back, a curled poster keeps lifting in the draft. She holds the corner down: DANGO'S BEHIND THE SCENES! Playing on 04/05/2000.
@image ahDango
Dango: I haven't seen this one before.
Bassie: You're on it.
Dango [blush]: I didn't know they'd use that drawing. My bow's crooked.
Shelly: Your bow's crooked now.
> Dango looks down and hurriedly straightens it.
@imgoff
@exit Bassie
@enter Cody center
Cody: You all right?
Dango [sweat]: I don't know. They keep asking me where things are, and I keep getting it wrong.
Cody: The room moved. That's not you getting it wrong.
Dango: I work here. I should know how to get to the staff room.
Shelly: We thought we lived here. We were wrong too.
> Dango looks from Shelly to the paint tin holding the door.
Dango: Oh. You mean this isn't yours.
Shelly: It looks like ours. That's why we came in.
Dango: I'll find Dandy. He knows where the station is.
Cody: Tell him the staff room's in the tea room again.
Dango: That's going at the top of the list.`),
    scene('05 · Ask Dandy', 'Gardenview Station', `
@bg uploads/gardenviewtrainstation.webp
@ah station
@music ahCandy
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
> Dandy searches his pockets. A roll of tickets, two wrapped sweets, and a little screwdriver land on the counter before the key.
Dandy: There we are.
Vee: You carry a screwdriver?
Dandy: Clocks don't fix themselves.
Vee: Yours certainly doesn't.
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
@enter Bassie right
Bassie: Are you coming?
Jessie: Me? No, we're staying here.
Bassie: Even with the doors doing that?
Jessie: I'm making Dandy walk me back. If we get stuck, he's missing dinner too.
@exit Jessie
@enter Dango center
Dango: Bassie? You left this on the desk.
> Dango presses the folds of a little paper bag flat and hands it to Bassie. The bottom is warm.
Bassie: Oh, the biscuits. Thanks.
Dango: Have a safe trip. And… sorry about earlier.
Bassie: You did give us tea. That helped.
> Dango waves with both hands. Jessie tries to wave around her microphone, and Cody takes it off her before she hits the doorframe.
Jessie: Otsukaresama! Come for the whole song next time!
> Nugget holds up the welcome sign upside down. Shelly turns back to tell him, but the door has already swung shut.`),
    scene('06 · A little later', 'The Real Gardenview', `
@bg Stagebackgrounds/maps/rainbow-rooms.png
@music ahCandy
@ah home
@enter Gigi center
> Back in the real Gardenview, Gigi is sitting cross-legged on her bedroom floor. She's been home since before the others found the event door.
> A half-finished snack and a pile of souvenirs sit beside her. She shakes a little paper bag upside down. One last token drops out and rolls under the shelf.
Gigi [dots]: Oh, come on.
> She lies flat on her stomach and reaches. Her fingers just brush it.
Gigi: You're staying there, then.
> She gets up, finds a ruler, and immediately comes back.
@ah close
> The token slides out. Gigi puts it on the shelf with the others, then opens another packet of snacks.
Gigi: There. Done for the day.
@exitall
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@ah backstage
@enter Dango left
@enter Cody right
> At the other Gardenview, Cody holds the staff-room door while Dango pulls down the welcome-home banner.
Dango: I could just cover up the last word.
Cody: Or get a smaller sign.
Dango: I already paid for this one.
@enter Jessie center
Jessie: Leave it. Nugget's coming back from the shops.
Dango: He's only been gone ten minutes.
Jessie: He'll still like it.
> Dango puts the tape back on. Cody reaches up and straightens his end of the banner.
@ah wide
> Through the open door, Nugget can be heard asking which way the kitchen went.
Jessie [note]: In here! And wipe your feet this time.
@exitall
> The banner stays up.`)
  ];
  const bonus = [
    scene('Dango · Just tea', 'Tea Counter', `
@bg Stagebackgrounds/maps/diner.png
@ah tea
@music ahCandy
@enter Dango left
@enter Bassie right
Bassie: Can I have another one?
Dango: Was there something wrong with it?
Bassie: No. I drank it.
Dango [sweat]: Oh! Right. Of course.
> Dango takes the empty cup. Bassie watches her fill it.
Dango: Same amount of sugar?
Bassie: Yeah, please.
> She sets the cup down. This time, she leaves the sugar bowl within Bassie's reach.
Bassie: You're having one too, right?
Dango: I should get back to the desk.
Bassie: You can see it from here.
> Dango looks over her shoulder. The desk is empty.
Dango: …I suppose I can sit here for a minute.`),
    scene('Jessie · Sound check', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
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
@ah lobby
@music ahCandy
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
@ah backstage
@music ahCandy
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
      className: 'ah-vn',
      onCommand: dressScene,
      startLine: start,
      portrait: id => cast.includes(id) ? ASSET + `Characters/${id}/vn.webp` : stPortrait(id),
      onProgress: line => {
        if (!extra) { state().bookmark = { index, line }; Save.write(); }
      },
      onFinish: skipped => {
        if (!extra && !skipped) { state().read[index] = true; state().bookmark = null; Save.write(); }
        home();
        Music.play('ahCandy');
      }
    });
  }
  function fight(i) {
    const level = 15 + i * 10;
    // Loan casts use the same spec factory as FF7 and don't modify owned heroes.
    const team = [...cast, 'Bassie'].map(id => FF7Event.spec(id, level, true));
    BattleScreen.launch({ team, foes: [FF7Event.spec('Cody', level, true), FF7Event.spec('Nugget', level, true)],
      music: 'ahSega', meta: { title: 'Bonus Challenge · ' + cast[i], floorLabel: 'Non-canon · scene unlock', roomIdx: 1, roomTotal: 1,
        bg: ASSET + 'uploads/backgroundlobby1.webp', timeLimit: 180, mods: [], mutations: [] }, rewards: () => ({}),
      onDone: result => { if (result.win && !result.quit) { state().bonus[i] = true; Save.write(); UI.toast('Bonus memory unlocked: ' + cast[i]); }
        tab = 'bonus'; home(); if (result.win && !result.quit) read(i, true); }
    });
  }
  function open(s) {
    const saved = state();
    const page = el('section', 'ah-event');
    page.innerHTML = `<div class="ah-top"><span>A GARDENVIEW INTERMISSION · AFTER FFVII</span></div><div class="ah-cover"><div><small>DANDY'S WORLD MODDED</small><h1>Almost<br><em>Home!</em></h1><p>A familiar door. An unfamiliar afternoon.</p><span class="ah-sticker">WELCOME BACK…?</span></div><div class="ah-cover-cast"></div></div><nav class="ah-tabs" aria-label="Intermission sections"></nav><div class="ah-content"></div><footer>An afternoon at Gardenview · Six chapters and four side scenes</footer>`;
    page.querySelector('.ah-top').append(button('← Events', () => { Screens._raidDossier = null; Screens.render(); }));
    for (const id of ['Dango', 'Nugget']) { const img = document.createElement('img'); img.src = art(id); img.alt = id; page.querySelector('.ah-cover-cast').append(img); }
    const tabs = page.querySelector('.ah-tabs');
    for (const [id, title] of [['story','Storybook'], ['bonus','Bonus memories']]) {
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
    }
    s.append(page);
    if (!StoryUI.overlay && !BattleScreen.active) Music.play('ahCandy');
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
