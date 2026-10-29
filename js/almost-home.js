/* ============================================================================
   ALMOST HOME! · THE ROYAL BROADCAST (DANDY'S WORLD: MODDED)
   Full storybook overhaul, cinematic cutscenes, bonus memories, and event hub.
   Canon & continuity: The DW Modded quartet crossed over from another world!
   ============================================================================ */
'use strict';

(() => {
  const ID = 'dw-modded-event';
  const ALT_ID = 'modded-almost-home';
  const cast = ['Dango', 'Jessie', 'Cody', 'Nugget'];

  // Register custom music tracks
  if (typeof MUSIC_TRACKS !== 'undefined') {
    Object.assign(MUSIC_TRACKS, {
      ahCandy: ASSET + 'assets/almost-home/aquacandyman.mp3',
      ahSega: ASSET + 'assets/almost-home/its-my-life-sega.mp3'
    });
  }

  // Register vintage archive images
  if (typeof ST3_IMAGES !== 'undefined') {
    Object.assign(ST3_IMAGES, {
      ahJessie: { src: 'assets/almost-home/jessie-poster.png', cap: 'Jessie in Center Stage · 7/24/1998' },
      ahDango: { src: 'assets/almost-home/dango-poster.png', cap: 'Dango’s Behind the Scenes! · 04/05/2000' }
    });
  }

  const activeCuts = new WeakMap();
  function stopCut(vn) { const finish = activeCuts.get(vn); if (finish) finish(); }

  function playCut(kind, vn, context) {
    if (context && context.resuming) return;
    stopCut(vn);
    const door = kind.startsWith('door-');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 180 : door ? 3100 : 2500;
    const cut = el('div', 'ah-cut ah-cut-' + kind);
    cut.setAttribute('aria-label', ({
      'door-in': 'The heavy door opens into the East Wing corridor',
      'door-loop': 'The backstage door opens onto the Welcome Room again',
      'door-out': 'The station platform doors open',
      'tea': 'Dango whisks matcha tea',
      'fan': 'Cody steadies the desk fan',
      'stage': 'The curtains part for Jessie Platter',
      'token': 'Gigi retrieves her token'
    })[kind] || 'Scene animation');
    cut.style.setProperty('--ah-cut-time', duration + 'ms');
    const sprite = (id, cls) => `<img class="ah-cut-toon ${cls || ''}" src="${art(id)}" alt="${id}">`;
    if (door) {
      const bg = kind === 'door-loop' ? 'Stagebackgrounds/maps/diner.png' : kind === 'door-out' ? 'uploads/backgroundlobby2.png' : 'uploads/backgroundlobby1.webp';
      cut.innerHTML = `<div class="ah-door-wall"></div><div class="ah-door-space"><div class="ah-door-view" style="background-image:url('${ASSET + bg}')"></div><div class="ah-door-leaf"><div class="ah-door-panel"></div><span class="ah-door-sign">${kind === 'door-loop' ? 'STAFF ONLY' : kind === 'door-out' ? 'STATION' : 'EAST WING'}</span><i class="ah-door-handle"></i></div><div class="ah-door-trim"></div></div><div class="ah-door-light"></div>`;
    } else if (kind === 'tea') {
      cut.innerHTML = `<div class="ah-cut-table"></div>${sprite('Dango','ah-cut-left')}<svg class="ah-pour" viewBox="0 0 500 300"><g class="ah-pot"><path d="M65 80q-20 100 70 100t65-100Z" fill="#bde3d3" stroke="#665166" stroke-width="6"/><path d="M196 108l51-35-24 69-26 8" fill="#bde3d3" stroke="#665166" stroke-width="6"/><path d="M71 110q-72-36-39 39l43 11" fill="none" stroke="#665166" stroke-width="10"/><ellipse cx="133" cy="79" rx="66" ry="13" fill="#f3c9d8" stroke="#665166" stroke-width="6"/><circle cx="133" cy="60" r="12" fill="#f3c9d8" stroke="#665166" stroke-width="5"/></g><path class="ah-tea-stream" d="M265 132Q320 145 334 217" fill="none" stroke="#c59355" stroke-width="8" stroke-linecap="round"/><ellipse cx="340" cy="276" rx="62" ry="10" fill="#fceedd"/><path d="M298 216h85v29q0 32-42 32t-43-32Z" fill="#f3c9d8" stroke="#665166" stroke-width="5"/><ellipse cx="340" cy="216" rx="42" ry="7" fill="#ac7b50"/><path d="M384 225q39-12 25 19l-25 6" fill="none" stroke="#665166" stroke-width="7"/></svg>`;
    } else if (kind === 'fan') {
      cut.innerHTML = `${sprite('Dango','ah-cut-left')}${sprite('Cody','ah-cut-right')}<svg class="ah-fan" viewBox="0 0 180 240"><path d="M90 151v70M43 225h94" stroke="#665266" stroke-width="13" stroke-linecap="round"/><circle cx="90" r="70" cy="88" fill="#bde6d9" stroke="#665266" stroke-width="6"/><g class="ah-fan-blades" fill="#74a6a2"><path d="M90 88Q15 10 74 23t16 65M90 88q110-20 77 31T90 88M90 88q-35 103-63 49T90 88"/></g><circle cx="90" cy="88" r="67" fill="none" stroke="#fff5" stroke-width="4"/><circle cx="90" cy="88" r="12" fill="#f3c8d4"/></svg><i class="ah-flying-paper p1"></i><i class="ah-flying-paper p2"></i><i class="ah-flying-paper p3"></i>`;
    } else if (kind === 'stage') {
      cut.innerHTML = `<div class="ah-cut-stage-light"></div>${sprite('Jessie','ah-cut-performer')}<div class="ah-cut-curtain left"></div><div class="ah-cut-curtain right"></div>`;
    } else if (kind === 'token') {
      cut.innerHTML = `${sprite('Gigi','ah-cut-left')}<div class="ah-cut-shelf"></div><div class="ah-cut-ruler"></div><div class="ah-cut-token">★</div>`;
    }
    const skip = el('button','ah-cut-skip','Skip animation ›'); skip.type = 'button';
    cut.appendChild(skip); vn.appendChild(cut); vn.classList.add('ah-cinematic');
    return new Promise(resolve => {
      let finished = false, timer;
      const done = () => {
        if (finished) return; finished = true; clearTimeout(timer);
        cut.remove(); vn.classList.remove('ah-cinematic'); activeCuts.delete(vn); resolve();
      };
      activeCuts.set(vn, done);
      skip.onclick = e => { e.stopPropagation(); done(); };
      timer = setTimeout(done, duration);
      Sound.play(door ? 'ui_open' : 'cloth', { vol: .25 });
    });
  }

  function dressScene(command, setting, vn, context) {
    if (command === 'cut') return playCut(setting, vn, context);
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

  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'AFTERNOON', date: 'AFTER THE STRANGE DETOUR' });

  /* ============================================================
     OVERHAULED MAIN STORY CHAPTERS (1 to 6)
     Continuity: The DW Modded quartet crossed over from another world!
     Vee, Bassie, and Shelly return to Gardenview Center to find
     four other-world castaways occupying the East Wing stage.
     ============================================================ */
  const story = [
    scene('01 · Unlawful Entry', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@ah lobby
@music ahCandy
@cut door-in
@enter Vee right
@enter Bassie left
> The heavy entrance door swings shut with a muted thud. Bassie adjusts the pastel ribbon on her basket, while Vee rubs her screen casing, emitting a thin wisp of static.
Vee: --ZZzst- Finally. A stable floor. If that neon amusement tower elevator shuddered one more time, my vertical sync was going to desynchronize completely.
Bassie: It's good to be back in the Center. The seasonal wing felt so far away. Did Shelly make it across the courtyard?
@enter Shelly center
Shelly: I'm right behind you! I was just admiring the sediment layers near the drainage pipe. It's fascinating how the mortar erodes!
Vee: Fascinating. Truly. Let us check the evening maintenance log and—
> Vee halts. Her broadcast antenna tilts forward as her screen blinks in sharp disbelief.
> The normally orderly East Wing corridor of Gardenview Center has been transformed. Heavy magenta velvet covers the display vitrines, golden wiring runs along the baseboards, and a gilded art-deco marquee glows above the archway: THE ROYAL BROADCAST.
Vee [glare]: Tch. BZT-- What is this? Who authorized cord routing across an active thoroughfare? This is a blatant safety violation.
@exit Shelly
@enter Dango center
Dango [sweat]: O-Okaeri nasai! Welcome to... wait! You aren't on our world's call sheet!
Vee [dots]: World's call sheet? I am Vee. This is our Gardenview Center. Who are you, and which wing did you sneak out of?
Bassie [?]: Um... excuse me... HAhaha... ha... not to pry, but why is there a bamboo steamer on our reception counter?
Dango [note]: I am Dango! Dandy assigned us here for our Japanese event showcase! If the banners obstruct your line of sight, I can calibrate their elevation four inches higher—
Vee: Dandy assigned you? There are forty-one Toons in Gardenview, and none of you exist in our handler logs. You don't even belong in this building! Pack your props and leave.
@enter Cody left
Cody: Nobody's leaving anything. Watch your step, monitor-head.
@cut fan
Vee [glare]: --ZZzst- Monitor-head?!
Cody: You're stomping on the floorboards and vibrating the desk fan. Take three steps back before you trip the tension wire near that floor mat.
Bassie [!]: T-Tension wire?! HAhaha... ha... you're joking, right?!
Cody: Forged bear-trap. Iron jaws, sixty-pound counter-weight spring. Keeps wandering feet from ruining the floor wax.
Dango [sweat]: Cody! Please do not set perimeter traps in the front hallway! And your chains creaked so loud my whiskers vibrated!
Cody: The chains are fashion, Dango. I told you that yesterday. If I wanted to restrain someone, I wouldn't use decorative brass links.
@enter Nugget right
Nugget [!] (jump): Hey! Don't argue! Nobody trip over iron traps!
Nugget: Look! Freshly grilled hot dogs! Steamed potato buns and extra artisan yellow mustard! I labeled each wrapper with wax pencil so nobody gets confused! Hot dogs resolve every misunderstanding!
Bassie: Oh... well... the melted butter aroma is quite lovely...
Vee: Bassie. Do not accept unverified concession food from an unregistered alternate-world intruder.
> A sharp clatter rings out from the inner corridor, followed by the deliberate, rhythmic click of vintage high-heeled shoes.
@enter Jessie center
Jessie [smug]: WHAT is all this dreadful peasant squawking in My Space?! Nugget, did I or did I not mandate complete vocal silence during my diaphragmatic warmup?!
Vee: "My Space"?
Jessie [glare]: And what in heaven's name is THIS eyesore? Filthy peasants! Loitering unwashed in my foyer without VIP credentials!
Vee [glare]: Filthy peasants? I am the primary broadcast host of Gardenview Center. You are a noisy radio head with a microphone stand who doesn't even belong in this dimension!
Jessie [note] (bow): Dango, why hasn't this television rabble been escorted to the service exit? Look at her—she is broadcasting in standard definition! How thoroughly humiliating for my aesthetic!
Vee: --ZZzst- Pack your hot dogs, pack your bear-traps, and pack your oversized ribbons. You have five minutes to clear this wing, or I will disconnect your main feed myself.
Jessie [smug]: Oh, darling, please. You couldn't disconnect a lamp. This is My Space! Scurry back to whatever crude broadcast booth you crawled out of before I have Cody drag your pedestal into the courtyard!
Cody: I'm calibrating the trap triggers right now. Don't test me.
Vee: Tch. We will see about that. You four are vacating this wing today.`),

    scene('02 · Chipped China & Broken Clocks', 'Welcome Room', `
@bg Stagebackgrounds/maps/diner.png
@ah tea
@music ahCandy
@cut tea
@enter Dango left
@enter Shelly right
> Dango scurries around the counter, setting down ceramic cups and plates of fresh mochi with delicate, practiced motions.
Dango [sweat]: Please! Please drink some hot green tea! In my experience, properly brewed matcha lowers pulse rates and resolves ninety-eight percent of all spatial disputes!
Shelly: It smells wonderful, dear. Though your stage partner seems rather intense for a fellow Toon from another world.
Dango: Jessie-sama is just... exceptionally dedicated to her performance! And Cody is very defensive about his appearance!
@enter Cody center
> Cody steps over, eyes the teacup in Shelly's hand, and takes it from her grip without a word.
Shelly [?]: Oh?
Cody: Rim's chipped. You'd slice your lip open on the second sip.
> Cody pours the tea into a dented metal canteen and sets down a flawless porcelain cup in its place.
Cody: There. Don't look at me like that. I'm keeping blood off the woodwork. Don't make a story out of it.
Shelly: Why, thank you, Cody! You know, that reminds me of an oviraptor protecting an unhatched clutch! Tough exterior, but remarkably careful with fragile specimens!
Cody [dots]: I'm not an oviraptor. Drink your tea and sit still.
@enter Vee right
Vee [glare]: Shelly. Stop psychoanalyzing the other-world castaways.
Vee: And look at that wall clock! The brass gears are frozen at three fifteen! Did your makeshift stage lights overload the secondary junction box?!
@enter Nugget center
Nugget [sweat]: U-Um... that wasn't the stage lights, Miss Vee...
Vee: Then what was it?
Nugget: I... may have borrowed the clock's AA battery to power my electric mustard-frother so Cody's lunch would have optimal savory aeration...
Vee [dots]: ...An electric mustard-frother.
Nugget [note]: It creates thirty percent more micro-bubbles! It holds the emulsion together! It is culinary science!
Vee: You dismantled an operational Gardenview timepiece... for hot dog condiments.
Cody: The mustard was good. Leave my boyfriend alone, monitor-head.
Vee: --ZZzst- I am surrounded by unhinged amateurs from another dimension.
Dango [!] (jump): EEEEEK! THE HALLWAY DOOR! IT JUST CLICKED SHUT!
> Cody strides to the brass handle and pulls hard. The lock does not yield.
Cody: Deadbolt's engaged. Mechanism isn't responding. Looks like the peasants are stuck in here with us.
Jessie~: I heard that, Cody! And do not lump my royal presence in with commoners!`),

    scene('03 · Prima Donna Soundcheck', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@cut stage
@enter Jessie center
@enter Nugget left
> Under brilliant magenta spotlights, Jessie Platter grips her golden microphone stand, striking a commanding theatrical pose while Nugget adjusts rows of velvet chairs.
Jessie [note]: Yes! More illumination! If my cheekbones are not blinding the back rows from fifty paces, the lighting crew should be banished to the prop basement!
Nugget: Center aisle chairs are aligned, Jessie! Every seat has a complimentary packet of roasted sunflower seeds! Did you want Cody's chair reserved by the sound booth?
Jessie: Only if he promises not to rattle his belt chains during my high notes. My little brother seems to believe prime auditorium seating can be bought with grilled sausage.
Nugget: Can it?
Jessie: One artisan dog. Extra Dijon. Then we will discuss VIP positioning.
@enter Vee right
@enter Bassie left
Vee [glare]: Jessie. Step away from the microphone before I trip the breaker.
Jessie: Ugh! The television rabble returns! And they brought their little wicker basket!
Bassie: It's a very nice basket, actually... HAhaha... ha... it holds freshly gathered clover...
Jessie [smug]: It holds peasant greenery! Darlings, quiet your shrill buzzing! You stand in the presence of the reigning queen of broadcasting!
Vee: You are occupying an unmapped stage in our facility. My quiz show operates on rigorous scheduling. Your vanity project operates on stolen power.
Jessie: Your little quiz show is a parade of blinking lights and cheap buzzers, darling! I deliver HIGH ART! I deliver majesty! I deliver drama!
> Suddenly, a funky, digitized retro backing track begins booming through the overhead speakers on its own.
@enter Dango right
Dango [sweat]: A-Ano... Jessie-sama? I didn't push play! The sound console is operating entirely by itself!
Jessie [?]: What? But my opening measure is not for another four bars!
> Shelly walks up to the stage proscenium, shining a pocket magnifier on a framed, dusty poster half-hidden behind the velvet drapes.
@enter Shelly left
Shelly: Vee... look at this.
@image ahJessie
Shelly: "JESSIE IN CENTER STAGE. Show date: 7/24/1998."
Vee [!]: July 24, 1998?!
Bassie: But... that date isn't in our Gardenview records at all! We didn't have an auditorium in 1998!
Shelly: Because it isn't from our Gardenview! Look at the paper composition—this poster was printed in another world entirely!
Jessie [dots]: What...?
> Jessie's haughty sneer falters for a brief second. She stares at her own painted likeness on the aged paper from her home dimension.
Jessie: Nineteen... ninety-eight? But... my opening week show date... Dandy had that printed for our prime broadcast run in our world's center. I remember the roses... I don't remember how we ended up on this side of the glass...
Vee: You really did cross over through the rift from another world?
@imgoff
Jessie [glare] (jump): SILENCE! How dare you inspect my inter-dimensional archives without paying admission!
Jessie: Out! OUT! Cody, lower the iron grating! Or Nugget, throw a pretzel at her!
Nugget: Jumbo salted pretzel inbound! Catch, Miss Vee!
Vee: --ZZzst- DO NOT THROW BAKED GOODS AT MY LENS!`),

    scene('04 · Euclidean Geometry is Optional', 'Backstage Storage', `
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@cut door-loop
@enter Dango left
@enter Shelly right
> Dango clutches her clipboard against her apron, leading the group through a labyrinthine corridor of stacked set flats and unfamiliar stage props.
Dango [sweat]: When the strange doorway appeared after our show, we thought we were almost home! But the corridors here don't line up with our world's blueprints!
@enter Cody center
Cody: Told you. The corridor is looping.
> Cody pushes the heavy wooden door marked 'STAFF ONLY'.
> Through the open doorframe sits... the Welcome Room tea table. Cody's metal canteen is still resting on the ceramic saucer.
@enter Nugget right
Nugget: Hey! Our tea's still warm!
Vee [glare]: Tch. BZT-- We walked two hundred paces down a straight corridor. Why are we back in the dining room?
Dango [!] (jump): AWAWAWA! I broke the dimensional floor plan! I folded the inter-world corridor into an impossible geometric knot!
Dango: I'm sorry! I'm so sorry! We're stranded in an alternate universe and I don't even know where our luggage went!
Nugget: No cardboard boxes, Dango! Look! I labeled an extra hot dog for you! See? It says 'Dango' right on the wax wrapper!
Dango: Oh... you remembered I didn't eat lunch?
Nugget: You always forget to feed yourself while checking everyone else's schedules! Eat up!
Cody: Stop panicking, Dango. The doors are slipping between worlds. That's on the management, not you. And nobody's throwing anyone out while I'm standing here.
> Shelly kneels behind an old costume wardrobe and pulls out another framed poster covered in fine dust.
@image ahDango
Shelly: Dango... look at this.
Shelly: "DANGO’S BEHIND THE SCENES! Premiering April 5, 2000."
Dango [dots]: Th-That's... me. Holding this exact clipboard.
@imgoff
Dango: Arthur and Delilah in our world gave me that ribbon after our first test broadcast. But... how did our whole studio cross over into this Gardenview...?
Bassie: Cody's right. You four aren't intruders... you're castaways from an alternate world who got pulled through the rift.
Jessie~: Finally! The basket peasant exhibits basic cognition! We are the FOUNDING ROYALTY of our world's Gardenview!
Vee: You are still an insufferable headache. Come on. If the hallways are shifting between dimensions, there is only one Toon in Gardenview holding the master keys. Station platform. Now.`),

    scene('05 · The Flower’s Explanation', 'Gardenview Station', `
@bg uploads/gardenviewtrainstation.webp
@ah station
@music ahCandy
@cut door-out
@enter Dandy right
@enter Vee left
> Down at the vintage iron train platform inside Gardenview Park, Dandy sits casually on a wooden bench, humming a melody while polishing a golden tape cassette.
Vee [glare]: Dandy. Put down the tape and explain yourself.
Dandy [note]: Ah! Vee! Bassie! Shelly! Did you enjoy your little sightseeing detour through that faraway amusement park?
Vee: Do not play innocent with me. You unbolted the East Wing and let four Toons from another world take over our stage!
@enter Jessie center
Jessie [glare]: And they barged into My Space, Dandy! Banish these television extras immediately! They insulted my lighting and refused my autographed playbills!
Dandy [note] (bow): Now, now, Miss Platter! Let's not discard our most dedicated audience just yet!
@enter Cody center
@enter Nugget left
Cody: Did you double-book this wing, flower? Because my bear-traps are set, and I don't like moving them twice.
Nugget: And my mustard is losing its aeration! We need dimensional stability, Mr. Dandy!
@enter Dango center
Dango [sweat]: Dandy-san... are we... are we really in another world? When we stepped through that door, we thought we were almost home...
Dandy [dots]: ...
> Dandy's cheerful grin softens into something slightly more reflective. He twirls a polished brass skeleton key around his fingertip.
Dandy: Rifts work in mysterious ways, Dango. When the strange dimensional transit from that other realm shook the barrier between worlds, you four tumbled through looking for your own halls. You thought you were 'almost home'—and you ended up in ours!
Jessie [smug]: Naturally! Your universe desperately required an infusion of true royal glamour!
Dandy: So I thought... why leave our other-world friends stranded in a dark hallway? I assigned you four as our premier Japanese event stars! Think of the spectacle! Think of the Golden Tapes!
Vee [dots]: You turned an inter-dimensional displacement crisis into a seasonal event showcase?!
Dandy: Would you prefer they set up bear-traps on the front lawn? This master pass links both worlds' corridors safely. No lockouts. No squatter disputes. From today on, the Royal Broadcast has an official residency in the East Wing until the way home opens.
Vee: ...Fine. But if she refers to me as a filthy peasant one more time, I am testing her vocal range with an oscilloscope.
Jessie [note]: Oh, darling, my high notes would shatter your vacuum tubes before you could even flip the switch.
Nugget [!] (jump): Group celebration! Nobody gets kicked out! Alternate-world hot dogs for the whole facility!
@move Dango left
@move Bassie right
> Dango steps forward, presenting Bassie with a carefully folded paper parcel of freshly baked matcha biscuits.
Dango [note]: Arigato gozaimashita, Bassie-san... Thank you for understanding.
Bassie: Thank you for the tea, Dango. And Nugget... that mustard really is quite remarkable.
Nugget: HAHA! I KNEW IT! ARTISAN AERATION NEVER FAILS!
Jessie [note] (bow): Otsukaresama, peasants! Be in your seats for my grand broadcast tomorrow—and bring fresh roses!`),

    scene('06 · The Souvenir on the Shelf', 'The Real Gardenview & Royal Studio', `
@bg Stagebackgrounds/maps/rainbow-rooms.png
@music ahCandy
@cut token
@enter Gigi center
> Back in her room in Gardenview's residential quarters, Gigi lies flat on the floor with a wooden ruler, probing beneath her heavy bookshelf.
Gigi [dots]: Come on... just a little further...
> With a crisp clink, a shiny brass arcade token slides out from the shadows into her paw.
Gigi [note]: AHA! Victory! Mwehehe...
@enter Bassie right
@enter Shelly left
Bassie: Did you recover your lucky token, Gigi?
Gigi: Found it! Where were you guys? You took forever to get back from the station.
Shelly: We had a rather lively encounter with performers from an alternate world in the East Wing! It was just like discovering living fossils from a parallel timeline!
Gigi: Oh yeah? Did Vee throw them out?
Bassie: Quite the opposite. Dandy granted them official event residency until their dimensional path realigns. Here, they sent these for you.
> Bassie hands Gigi a warm pastry bag. Gigi pulls out a golden biscuit dusted with fine green-tea sugar and takes a massive bite.
Gigi [!] (jump): WHOA! This is incredible! Who baked this?!
Shelly: A sweet little Toon named Dango. She's remarkably attentive!
Gigi: And who's that loud person I heard shouting from three corridors away?
Bassie: That would be Jessie Platter. HAhaha... ha... she called Vee a filthy peasant seven times.
Gigi [note]: Seven times?! Straight to Vee's screen?!
Gigi: Mwehehe... I don't care what world they came from, those guys can stay forever. I'm going to see what kind of shiny other-world trinkets they brought with them!
@exitall
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@enter Dango left
@enter Cody right
> Back in the East Wing, Cody drives a heavy steel wedge beneath the swinging backstage door, securing the frame firmly against the wall.
Dango: Is it going to hold this time, Cody?
Cody: It's anchored with three steel spikes. The dimensional portal won't swallow us while we sleep.
@enter Nugget center
Nugget [note]: Dinner is served! Twenty jumbo dogs, grilled onions, and extra aerated mustard!
@enter Jessie right
Jessie [smug]: At last! The star requires proper protein!
> Jessie takes a hot dog, inspecting it with theatrical scrutiny before taking a delicate, enthusiastic bite.
Jessie: ...Acceptable. In fact, bordering on exquisite. You have done well, my culinary brother.
Nugget: YAY! Best review ever!
Dango [note]: Cody... Jessie... Nugget... we really get to stay, don't we? Even in another world?
Cody: Yeah. As long as we're together, we're home, Dango.
Jessie [note] (bow): Home? Darlings, we aren't just home—we own the stage! Now finish chewing, everyone! Tomorrow we broadcast across dimensions! ENCORE!`)
  ];

  /* ============================================================
     OVERHAULED BONUS MEMORIES (4 Character Comedies)
     ============================================================ */
  const bonus = [
    scene('Dango · The Tea Ceremony Panic', 'Tea Counter', `
@bg Stagebackgrounds/maps/diner.png
@ah tea
@music ahCandy
@enter Dango left
@enter Bassie right
> Dango kneels at the low wooden counter, hands trembling as she measures bright green matcha powder with a bamboo spoon.
Dango [sweat]: Okay... ninety-two point five degrees Celsius... exactly three whisks clockwise, then two figure-eights...
Bassie: Dango, dear, it's just tea. HAhaha... ha... you don't have to calculate the trajectory.
Dango [!]: It is NOT just tea, Bassie-san! It is the sacred spirit of hospitality! If the foam bubbles are larger than one millimeter, my preparation is flawed!
> Dango whisks frantically until a delicate, jade-green foam tops the ceramic bowl. She presents it with both paws, bowing until her forehead touches the wood.
Dango: Please accept this humble, completely inadequate offering!
Bassie: Oh, thank you!
> Bassie lifts the bowl and chugs the entire steaming serving in three giant gulps.
Bassie [note]: Mmmm! That hits the spot! Can I get a refill?
Dango [dots]: Y-You... drank it in three seconds...
Bassie: It was delicious! Best tea I've ever had! HAhaha... ha... did I drink it too fast?
Dango [sweat] (jump): AHHH! SHE LIKED IT! THE FOAM WAS ACCEPTABLE!
> Dango collapses sideways onto her cushion in tearful, overwhelmed relief.`),

    scene('Jessie · Acoustic Decibel Wars', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@enter Jessie right
@enter Nugget left
Jessie [glare]: Nugget! Why are you standing in the orchestra pit? I told you to go to the very last row of the upper mezzanine!
Nugget: But the stairs are really steep and I dropped my napkin!
Jessie: I do not care about your napkin! I need to calibrate my acoustic vocal projection so both dimensions can hear me! Now march your buns up there immediately!
> Nugget scurries up the aisle, panting, and reaches the top tier.
Nugget~ [!]: I'M AT THE TOP, JESSIE! CAN YOU HEAR ME?!
Jessie [smug]: Of course I can hear you, you barking sausage! Now listen closely! Testing high C!
Jessie [note]: AAAAAAAAHHHHHHHHHHHHHHHHHHHH—!
> The chandelier overhead rattles violently. Two lightbulbs flicker.
Nugget~ [note]: WOW! SOUNDS LIKE A JET ENGINE TAKING OFF! DO IT AGAIN!
Jessie: It is NOT a jet engine, it is the crystalline resonance of royalty! Did it reach the corners?!
Nugget~: IT REACHED MY BONES! MY MUSTARD IS VIBRATING!
Jessie [smug] (bow): Perfection. If the peasants' ears aren't ringing across both worlds by intermission, I haven't done my job!`),

    scene('Cody · Perimeter Traps & Fashion Statements', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@ah lobby
@music ahCandy
@enter Dango left
@enter Cody right
> Dango is sweeping powdered sugar near the front counter when Cody suddenly materializes right behind her without making a sound.
Cody: Dustpan's crooked.
Dango [!] (jump): GYAAAAAAAH!
> Dango leaps three feet into the air, tossing her broom like a spear. Cody catches it by the handle with one hand without flinching.
Dango [sweat]: CODY! You CANNOT keep doing that! You walk like a shadow wrapped in iron! I almost hit your chin with the bristles!
Cody: You'd miss. Your broom-throwing technique is terrible.
Dango: Put a bell on your collar! Or rattle your chains! Give me a five-second warning before entering my personal breathing radius!
Cody: I told you, the chains are fashion. If I wear a bell, how am I supposed to catch wandering Toons tracking mud across our threshold?
Dango: We don't HAVE wandering Toons tracking mud!
@enter Nugget center
Nugget [note]: CODY! Look! I made you an artisanal heart-shaped ketchup packet for your tool belt!
> Nugget proudly presents a red foil pouch folded into a lumpy little heart.
Cody [dots]: ...
Dango [smug]: Oh? What's this? The terrifying, stone-cold trap master is blushing?
Cody [glare]: I'm not blushing. The lobby heater is set too high.
Nugget: Put it next to your wrench, Cody! It'll keep you company while you forge bear-traps!
Cody [dots]: ...Yeah. All right. Thanks, puppy. Into the pocket it goes.
Dango [note]: Hehehe! So soft on the inside! Like sweet red bean paste!
Cody: Say another word about bean paste, Dango, and your broom goes into the bear-trap.`),

    scene('Nugget · The Silk Scarf Incident', 'Backstage Dressing Room', `
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@enter Jessie right
Jessie [!]: EMERGENCY! CODE CRIMSON! My five-hundred-dollar imported emerald silk vocal-preservation scarf has vanished!
Jessie: Someone has committed high treason! Dango, convene the royal tribunal! Cody, seal the exits!
@enter Nugget left
Nugget [note]: Good morning, Jessie! Did you have a nice rest?
Jessie [glare]: Nugget! Did you touch my scarf?! It was sitting right on my dressing vanity!
Nugget: The green shiny cloth? Oh yeah! I put it away for you!
Jessie: Away? Away WHERE?!
Nugget: In the refrigerator!
Jessie [dots]: ...
Jessie [!]: In... the REFRIGERATOR?!
Nugget: Yeah! You said keep it cool and prevent wrinkles! And I had a big bowl of organic pickled sauerkraut in there that needed a blanket so it wouldn't get cold!
Jessie: You wrapped my imported silk scarf... around a bowl of FERMENTED CABBAGE?!
Nugget [note]: It kept the temperature super even! Smells a little sour, but look—zero wrinkles!
> Nugget proudly holds up the chilled emerald scarf. A faint aroma of dill and vinegar wafts across the room.
Jessie [glare]: I am going to turn you into breakfast links. I am going to slice you into cocktail wieners.
Nugget [sweat]: D-Did I do a bad dog thing...?
> Nugget lowers his floppy ears, whimpering with giant, glistening puppy-dog eyes.
Jessie: ...
Jessie [dots]: ...Ugh. Stop looking at me with those pathetic saucer eyes!
Jessie: Fine! I suppose... the chilled fabric will reduce inflammation on my throat. BUT YOU ARE WASHING IT TONIGHT, DO YOU HEAR ME?!
Nugget [note] (jump): YAY! Hand-washed with gentle lavender soap! You're the best sister ever, Jessie!
Jessie [note]: Yes, yes, I am a benevolent monarch. Now go get me some tea before I faint from the vinegar fumes!`)
  ];

  function state() {
    const r = Raid.state();
    return r.almostHome || (r.almostHome = { read: {}, bonus: {}, bookmark: null });
  }

  function art(id) {
    return ['Dango', 'Cody', 'Nugget'].includes(id) ? `Characters/${id}/vn.webp` : Art.hero(id);
  }

  function button(text, fn, cls = '') {
    const b = el('button', cls, text);
    b.type = 'button';
    b.onclick = fn;
    return b;
  }

  function home() {
    Screens._raidDossier = ID;
    Screens.render();
  }

  function read(index, extra = false, start = 0) {
    const data = (extra ? bonus : story)[index];
    if (!data) return;
    if (extra ? !state().bonus[index] : index > 0 && !state().read[index - 1]) return;
    StoryUI.playScene(0, false, {
      scene: data,
      className: 'ah-vn',
      onCommand: dressScene,
      onDispose: stopCut,
      startLine: start,
      portrait: id => cast.includes(id) ? ASSET + `Characters/${id}/vn.webp` : stPortrait(id),
      onProgress: line => {
        if (!extra) { state().bookmark = { index, line }; Save.write(); }
      },
      onFinish: skipped => {
        const first = !extra && !state().read[index];
        if (!extra && !skipped) {
          state().read[index] = true;
          state().bookmark = null;
          // Reward Golden Tapes on first clear!
          if (first) {
            const r = Raid.state();
            r.dwModdedTapes = (r.dwModdedTapes || 0) + 50;
            UI.toast('Chapter completed! +50 📼 Golden Tapes earned!');
            Sound.play('levelup');
          }
          Save.write();
        }
        home();
        if (typeof Music !== 'undefined') Music.play('ahCandy');
      }
    });
  }

  function fight(i) {
    const level = 25 + i * 15;
    const team = [...cast, 'Bassie'].map(id => FF7Event ? FF7Event.spec(id, level, true) : { id, level, hp: 500 });
    BattleScreen.launch({
      team,
      foes: [
        FF7Event ? FF7Event.spec('Cody', level, true) : { id: 'Cody', level },
        FF7Event ? FF7Event.spec('Nugget', level, true) : { id: 'Nugget', level }
      ],
      music: 'ahSega',
      meta: {
        title: 'Bonus Challenge · ' + cast[i],
        floorLabel: 'Non-canon · Scene unlock',
        roomIdx: 1, roomTotal: 1,
        bg: ASSET + 'uploads/backgroundlobby1.webp',
        timeLimit: 180, mods: [], mutations: []
      },
      rewards: () => ({}),
      onDone: result => {
        if (result.win && !result.quit) {
          state().bonus[i] = true;
          const r = Raid.state();
          r.dwModdedTapes = (r.dwModdedTapes || 0) + 30;
          Save.write();
          UI.toast('Bonus memory unlocked: ' + cast[i] + ' (+30 📼 Golden Tapes)!');
        }
        home();
        if (result.win && !result.quit) read(i, true);
      }
    });
  }

  // Export AlmostHome
  window.AlmostHome = {
    ID,
    ALT_ID,
    story,
    bonus,
    state,
    read,
    fight,
    dressScene,
    stopCut,
    playCut
  };
})();
