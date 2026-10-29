/* ============================================================================
   ALMOST HOME! · THE ROYAL BROADCAST (DANDY'S WORLD: MODDED)
   Full storybook overhaul, cinematic cutscenes, bonus memories, and event hub.
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
      'door-in': 'The door swings open into the event lobby',
      'door-loop': 'The staff door opens onto the tea room again',
      'door-out': 'The station door opens for the visitors',
      'tea': 'Dango pours tea',
      'fan': 'Cody catches the tipping fan',
      'stage': 'The curtains part for Jessie',
      'token': 'Gigi retrieves her token'
    })[kind] || 'Scene animation');
    cut.style.setProperty('--ah-cut-time', duration + 'ms');
    const sprite = (id, cls) => `<img class="ah-cut-toon ${cls || ''}" src="${art(id)}" alt="${id}">`;
    if (door) {
      const bg = kind === 'door-loop' ? 'Stagebackgrounds/maps/diner.png' : kind === 'door-out' ? 'uploads/backgroundlobby2.png' : 'uploads/backgroundlobby1.webp';
      cut.innerHTML = `<div class="ah-door-wall"></div><div class="ah-door-space"><div class="ah-door-view" style="background-image:url('${ASSET + bg}')"></div><div class="ah-door-leaf"><div class="ah-door-panel"></div><span class="ah-door-sign">${kind === 'door-loop' ? 'STAFF ONLY' : kind === 'door-out' ? 'EXIT' : 'ROYAL BROADCAST'}</span><i class="ah-door-handle"></i></div><div class="ah-door-trim"></div></div><div class="ah-door-light"></div>`;
    } else if (kind === 'tea') {
      cut.innerHTML = `<div class="ah-cut-table"></div>${sprite('Dango','ah-cut-left')}<svg class="ah-pour" viewBox="0 0 500 300"><g class="ah-pot"><path d="M65 80q-20 100 70 100t65-100Z" fill="#bde3d3" stroke="#665166" stroke-width="6"/><path d="M196 108l51-35-24 69-26 8" fill="#bde3d3" stroke="#665166" stroke-width="6"/><path d="M71 110q-72-36-39 39l43 11" fill="none" stroke="#665166" stroke-width="10"/><ellipse cx="133" cy="79" rx="66" ry="13" fill="#f3c9d8" stroke="#665166" stroke-width="6"/><circle cx="133" cy="60" r="12" fill="#f3c9d8" stroke="#665166" stroke-width="5"/></g><path class="ah-tea-stream" d="M265 132Q320 145 334 217" fill="none" stroke="#c59355" stroke-width="8" stroke-linecap="round"/><ellipse cx="340" cy="276" rx="62" ry="10" fill="#fceedd"/><path d="M298 216h85v29q0 32-42 32t-43-32Z" fill="#f3c9d8" stroke="#665166" stroke-width="5"/><ellipse cx="340" cy="216" rx="42" ry="7" fill="#ac7b50"/><path d="M384 225q39-12 25 19l-25 6" fill="none" stroke="#665166" stroke-width="7"/></svg>`;
    } else if (kind === 'fan') {
      cut.innerHTML = `${sprite('Dango','ah-cut-left')}${sprite('Cody','ah-cut-right')}<svg class="ah-fan" viewBox="0 0 180 240"><path d="M90 151v70M43 225h94" stroke="#665266" stroke-width="13" stroke-linecap="round"/><circle cx="90" cy="88" r="70" fill="#bde6d9" stroke="#665266" stroke-width="6"/><g class="ah-fan-blades" fill="#74a6a2"><path d="M90 88Q15 10 74 23t16 65M90 88q110-20 77 31T90 88M90 88q-35 103-63 49T90 88"/></g><circle cx="90" cy="88" r="67" fill="none" stroke="#fff5" stroke-width="4"/><circle cx="90" cy="88" r="12" fill="#f3c8d4"/></svg><i class="ah-flying-paper p1"></i><i class="ah-flying-paper p2"></i><i class="ah-flying-paper p3"></i>`;
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

  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'AFTERNOON', date: 'AFTER THE GOLD SAUCER' });

  /* ============================================================
     OVERHAULED MAIN STORY CHAPTERS (1 to 6)
     High-energy comedic confrontation: The actual Gardenview toons
     try to evict the squatters, while Jessie ruthlessly insults them!
     ============================================================ */
  const story = [
    scene('01 · Unlawful Entry', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@ah lobby
@music ahCandy
@cut door-in
@enter Vee right
@enter Bassie left
> The heavy brass door flies open with a shudder. Bassie stumbles inside, clutching her wicker basket, while Vee marches in behind her with smoking circuits.
Vee: Oh, finally! Sweet air-conditioned sanity! If I spent another five minutes in that Gold Saucer elevator, I was going to short-circuit!
Bassie: I'm just glad we made it back before dinner. Did Shelly make it through?
@enter Shelly center
Shelly: I'm here. Barely. The hallway was narrower than I remembered.
Vee: Good. Now let's grab our keys and—wait a second.
> Vee stops dead in her tracks. The familiar quiet lobby has been completely overhauled.
> Golden streamers hang from the ceiling, neon pink velvet drapes cover the notice boards, and a massive illuminated sign blares: ROYAL BROADCAST HEADQUARTERS.
Vee [!]: WHAT IN THE NAME OF HIGH DEFINITION IS THIS?! Who authorized this hideous tacky pink wallpaper?!
@exit Shelly
@enter Dango center
Dango [sweat]: O-Okaeri nasai! Welcome to... w-wait! You're not on the VIP guest list!
Vee [glare]: Guest list?! GUEST LIST?! We LIVE here!
Bassie [?]: Um... excuse me, little sweet treat, but who are you and why is our front desk covered in powdered sugar?
Dango [note]: I am Dango! Dandy assigned us this sector for the broadcast! I am terribly sorry if my banners are in your eyeline, I can move the ribbons four inches to the left—
Vee: You can move them into the incinerator! You are SQUATTING in our lobby! Shelly, get security! We are kicking these intruders out onto the pavement right now!
@enter Cody left
Cody: Nobody's kicking anyone anywhere. Keep your voice down, antenna-head.
@cut fan
Vee [!]: Did you just call me ANTENNA-HEAD?!
Cody: You're blocking the doorway and shaking the fan. Take three steps back before you trigger the pressure plate under that rug.
Bassie [!]: PRESSURE PLATE?!
Cody: Forged bear-trap. Iron jaws, sixty-pound spring. Keeps loiterers from scuffing the floorboards.
Dango [sweat]: Cody! Please don't threaten guests with bear-traps! And your chains clanked so loud they startled me!
Cody: It's fashion, Dango. If I wanted to choke someone, I wouldn't do it with a belt loop.
@enter Nugget right
Nugget [!] (jump): Wait! Don't fight! Nobody get snapped by bear-traps!
Nugget: Look! Freshly grilled hot dogs! Extra artisan yellow mustard! I labeled the wrappers so nobody fights! Hot dogs are the universal peace treaty!
Bassie: Oh... well, it does smell rather buttery...
Vee: BASSIE! Do NOT accept squatter food!
> A loud, theatrical clatter echoes from the stage corridor. High-heeled footsteps click sharply against the tile.
@enter Jessie center
Jessie [smug]: WHAT is all this dreadful peasant squawking in My Space?! Nugget, did I or did I not mandate complete vocal silence during my warmup?!
Vee: YOUR SPACE?!
Jessie [glare]: And what in heaven's name is THIS eyesore? Filthy peasants! Loitering unwashed in my foyer without VIP credentials!
Vee [!]: FILTHY PEASANTS?! EXCUSE ME?!
Jessie [note] (bow): Dango, why hasn't this rabble been swept into the gutter with the rest of the dust bunnies? Look at her—she’s broadcasting in standard definition! How humiliating for my aesthetic!
Vee: That does it! Pack your hot dogs and your bear-traps! You four have five minutes to evacuate, or I am throwing you out of this building myself!
Jessie [smug]: Oh, darling, please. You couldn't evict a moth from a lightbulb. This is My Space! Now scurry back to the barn before I have Cody toss you into the street!
Cody: Working on the bear-traps now.
Vee: Oh, it's on. You four are getting evicted today if it's the last thing I do!`),

    scene('02 · Chipped China & Broken Clocks', 'Welcome Room', `
@bg Stagebackgrounds/maps/diner.png
@ah tea
@music ahCandy
@cut tea
@enter Dango left
@enter Shelly right
> Dango scurries around the low counter, hands trembling as she sets down steaming porcelain cups and fresh mochi plates.
Dango [sweat]: Please! Please drink some hot green tea! In my experience, green tea lowers elevated blood pressure and resolves ninety-eight percent of all territorial disputes!
Shelly: It smells lovely, dear. Though your friends seem rather belligerent for hotel staff.
Dango: Jessie-sama isn't belligerent! She's just... exceptionally proud of her broadcast space! And Cody is very protective of his style!
@enter Cody center
> Cody marches over, eyes Shelly's teacup, and snatches it right out from under her claws.
Shelly [?]: Oh?
Cody: Handle's cracked. Don't touch it. You'd slice your lip open.
> Cody pours the tea into his own dented metal canteen and sets a fresh porcelain cup in its place.
Cody: There. Don't look at me like that. I'm keeping porcelain off the newly waxed floor. Don't make a story out of it.
Shelly: Why, thank you, young man. You're surprisingly considerate for an armed trespasser.
Cody [dots]: I'm protecting the floor, not you. Don't get sentimental.
@enter Vee right
Vee [glare]: Shelly! Stop fraternizing with the squatters!
Vee: Look at that clock! It's frozen at three fifteen! Did you amateurs blow out our master circuits with your illegal spotlight rig?!
@enter Nugget center
Nugget [sweat]: U-Um... that wasn't the stage lights, Miss Vee...
Vee: Then what was it, hot dog boy?!
Nugget: I... may have borrowed the clock's AA battery to power my electric mustard-frother so Cody's lunch would be extra savory...
Vee [!]: An electric... MUSTARD-FROTHER?!
Nugget [note]: It creates thirty percent more savory micro-bubbles! It’s food science!
Cody: The mustard was good. Leave my boyfriend alone, antenna-head.
Vee: YOU BROKE THE TIME-SPACE CONTINUITY OF GARDENVIEW FOR HOT DOG CONDIMENTS?!
Dango [!] (jump): EEEEEK! THE OUTSIDE DOOR! IT JUST CLICKED SHUT BY ITSELF!
> Cody tugs at the brass handle. It doesn't budge.
Cody: Deadbolt's sealed. Looks like the filthy peasants are stuck in here with us.
Jessie~: I heard that, Cody! And do not associate my royal presence with commoners!`),

    scene('03 · Prima Donna Soundcheck', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@cut stage
@enter Jessie center
@enter Nugget left
> Under blazing magenta spotlights, Jessie Platter grips her golden microphone stand, striking an exaggerated dramatic pose while Nugget adjusts folding chairs.
Jessie [note]: Yes! More illumination! If my cheekbones aren't blinding the cheap seats from fifty paces, the lighting technician should be exiled to the dungeon!
Nugget: Front row chairs are set, Jessie! Each one has a complimentary bag of peanuts! Did you want Cody's seat reserved by the aisle?
Jessie: Only if he promises not to rattle his belt chains during my high notes. My little brother thinks he can buy prime concert seating with lunch.
Nugget: Can I?
Jessie: One hot dog. Extra mustard. Then we will discuss VIP seating.
@enter Vee right
@enter Bassie left
Vee [glare]: HEY! Drama queen! Drop the microphone and put your hands where my camera can see them!
Jessie: Ugh! The rabble returns! And they brought their little wicker basket!
Bassie: It's a lovely basket, actually. It holds fresh berries.
Jessie [smug]: It holds peasant food! Darlings, darlings, quiet your screeching! You are in the presence of the reigning empress of Gardenview broadcasting!
Vee: You are an unlicensed squatter in my studio! I produce the shows here!
Jessie: You produce technical glitches, darling! I produce HIGH ART! I deliver majesty! I deliver drama!
> Suddenly, a funky, digitized retro backing track begins booming through the overhead monitors on its own.
@enter Dango right
Dango [sweat]: A-Ano... Jessie-sama? I didn't push play! The sound console is operating entirely by itself!
Jessie [?]: What? But my cue isn't for another four measures!
> Shelly walks up to the stage proscenium, shining a pocket magnifier on a framed, dusty poster half-hidden behind the velvet drapes.
@enter Shelly left
Shelly: Vee... look at this.
@image ahJessie
Shelly: "JESSIE IN CENTER STAGE. Show date: 7/24/1998."
Vee [!]: July 24, 1998?!
Bassie: But... none of us were animated in 1998! That was decades ago!
Jessie [dots]: What...?
> Jessie's haughty sneer cracks for a brief moment. She stares at her own painted portrait on the aged paper.
Jessie: Nineteen... ninety-eight? But... my show date... Dandy had that printed for my opening week. I remember the performance. I don't remember the year...
Vee: Wait. Dandy printed that for you?
@imgoff
Jessie [glare] (jump): SILENCE! How dare you inspect my historical archives without paying admission!
Jessie: Out! OUT! Cody, release the attack dogs! Or Nugget, throw a pretzel at her!
Nugget: Jumbo salted pretzel inbound! Catch, Miss Vee!
Vee: DON'T THROW BAKED GOODS AT MY LENS!`),

    scene('04 · Euclidean Geometry is Optional', 'Backstage Storage', `
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@cut door-loop
@enter Dango left
@enter Shelly right
> Dango clutches her color-coded clipboard against her chest, leading the eviction committee through a dim, labyrinthine corridor of backstage props.
Dango [sweat]: The staff room exit connects to the real Gardenview hallway! Just follow me through this door—
@enter Cody center
Cody: Told you. The hallway's looping.
> Cody pushes the heavy wooden door marked 'STAFF ONLY'.
> Through the open doorframe sits... the Welcome Room tea table. Cody's metal canteen is still sitting on the saucer.
@enter Nugget right
Nugget: Hey! Our tea's still warm!
Vee [!]: ARE YOU KIDDING ME?! We just walked half a mile down a hallway! Why are we back in the dining room?!
Dango [!] (jump): WAAAAAH! I broke the hotel! I folded the floor plan into an impossible origami knot!
Dango: I'm sorry! I'm so sorry! You're going to evict us and I don't even know where our luggage went!
Nugget: No cardboard boxes! Here, I labeled an extra hot dog for you, Dango! Look, it says 'Dango' right on the wrapper!
Dango: Oh... you remembered I didn't eat lunch?
Nugget: You always forget to feed yourself while worrying about everyone else! Eat up!
Cody: Stop panicking, Dango. The room moved. That's on the landlord, not you. And nobody's evicting anyone while I'm standing here.
> Shelly kneels down behind a wardrobe and pulls out another framed poster covered in cobwebs.
@image ahDango
Shelly: Dango... look here.
Shelly: "DANGO’S BEHIND THE SCENES! Premiering April 5, 2000."
Dango [dots]: Th-That's... me. Holding the same clipboard.
@imgoff
Dango: Dandy gave me that ribbon after our first broadcast. But how could that be twenty-six years ago...?
Bassie: Cody's right. You four aren't squatters. You've been here longer than we have.
Jessie~: Finally! The basket peasant exhibits basic cognition! We are the FOUNDING ROYALTY of Gardenview!
Vee: You are still an insufferable pain in my circuits. Come on. If the hallways are bending, there's only one toon behind it. Station platform. Now!`),

    scene('05 · The Landlord’s Explanation', 'Gardenview Station', `
@bg uploads/gardenviewtrainstation.webp
@ah station
@music ahCandy
@cut door-out
@enter Dandy right
@enter Vee left
> Down at the vintage train platform, Dandy sits casually on an iron bench, humming a lighthearted tune while cleaning his nails with a pocket screwdriver.
Vee [glare]: DANDY! Put down the screwdriver and start talking!
Dandy [note]: Ah! Vee! Bassie! Shelly! Did you enjoy your scenic detour through the Gold Saucer?
Vee: Do not play dumb with me! You rented our hotel lobby to four temporal castaways who keep calling us FILTHY PEASANTS!
@enter Jessie center
Jessie [glare]: Because you ARE filthy peasants! Dandy, darling! Arrest these intruders immediately! They barged into My Space, insulted my lighting, and refused my autographed napkins!
Dandy [note] (bow): Now, now, Miss Platter! Let's not banish our most dedicated subscribers just yet!
@enter Cody center
@enter Nugget left
Cody: Did you double-book this wing, flower? Because my bear-traps are getting restless.
Nugget: And my mustard is losing its emulsion! We need stability, Mr. Dandy!
@enter Dango center
Dango [sweat]: Dandy-san... are we... are we supposed to be here? The posters on the walls... they have dates from before the current hotel was built...
Dandy [dots]: ...
> Dandy's perpetual grin softens slightly. He pulls a gleaming brass skeleton key from his waistcoat pocket.
Dandy: A good hotel never truly forgets its original stars, Dango. When you four went into storage after the old broadcast ended, Gardenview felt... a little quieter. A little less colorful.
Jessie [smug]: Naturally! Without me, this place was an aesthetic wasteland!
Dandy: So when the doors from the Gold Saucer shook the old foundation, I thought... why not unlock the Royal Wing? Why shouldn't our newest Toons meet the legends who laid the floorboards?
Vee [?]: Legends? You mean... they really were the original broadcast cast?
Jessie: OF COURSE WE WERE, YOU TELEVISION COMMONER!
Bassie [note]: Well... that explains why they know where all the secret tea pantries are.
Dandy: This key opens the passage between both wings. No evictions. No squatter disputes. From today on, the Royal Broadcast has permanent VIP residency.
Vee: ...Fine. But if she calls me a filthy peasant one more time, I'm jamming her microphone down her throat.
Jessie [note]: Oh, darling, my high notes would shatter your audio drivers before you even got close.
Nugget [!] (jump): Group hug! Nobody gets evicted! Hot dogs for everyone!
@move Dango left
@move Bassie right
> Dango hands Bassie a warm, carefully folded paper bag of freshly baked matcha biscuits.
Dango [note]: Arigato gozaimashita, Bassie-san... Thank you for understanding.
Bassie: Thank you for the tea, Dango. And Nugget... that mustard really is exceptional.
Nugget: HAHA! I KNEW IT! ARTISAN QUALITY ALWAYS PREVAILS!
Jessie [note] (bow): Otsukaresama, peasants! Return for my grand broadcast tomorrow—and bring flowers next time!`),

    scene('06 · The Souvenir on the Shelf', 'The Real Gardenview & Royal Studio', `
@bg Stagebackgrounds/maps/rainbow-rooms.png
@music ahCandy
@cut token
@enter Gigi center
> Back in her cozy bedroom in the modern Gardenview wing, Gigi lies flat on her belly with a wooden ruler, poking beneath her heavy oak bookshelf.
Gigi [dots]: Come on... just a little further...
> With a metallic scrape, the shiny brass token slides out from the shadows into her paw.
Gigi: AHA! Victory!
@enter Bassie right
@enter Shelly left
Bassie: Did you find your lucky token, Gigi?
Gigi: Found it! Where were you guys? You took forever to get back from the train station.
Shelly: We had a rather lively dispute with the original tenants of the studio wing.
Gigi: Oh yeah? Did Vee kick them out?
Bassie: Quite the opposite. We gave them permanent residency. Here, they sent these for you.
> Bassie hands Gigi a warm pastry bag. Gigi pulls out a golden-brown biscuit dusted in fine green-tea sugar and takes a massive bite.
Gigi [!] (jump): WHOA! This is incredible! Who baked this?!
Shelly: A sweet little mochi girl named Dango.
Gigi: And who's that loud person I heard screaming from the hallway?
Bassie: That would be Jessie Platter. She called Vee a filthy peasant seven times.
Gigi [note]: Seven times?! To her face?!
Gigi: I don't care what Dandy says, those modded guys are my new favorite people in this entire building.
@exitall
@bg Stagebackgrounds/maps/vee-storage.webp
@ah backstage
@enter Dango left
@enter Cody right
> Back in the Royal Wing, Cody hammers a heavy steel wedge beneath the looping backstage door, securing the frame firmly against the wall.
Dango: Is it going to hold this time, Cody?
Cody: It's anchored with three railroad spikes. It's not moving an inch.
@enter Nugget center
Nugget [note]: Dinner is served! Twenty jumbo dogs, grilled onions, and extra honey-mustard!
@enter Jessie right
Jessie [smug]: At last! The star requires protein!
> Jessie takes a hot dog, pretending to inspect it with dramatic scrutiny before taking a delicate, enthusiastic bite.
Jessie: ...Acceptable. In fact, bordering on exquisite. You have done well, my culinary brother.
Nugget: YAY! Best review ever!
Dango [note]: Cody... Jessie... Nugget... we really get to stay, don't we?
Cody: Yeah. We're home, Dango.
Jessie [note] (bow): Home? Darlings, we aren't just home—we own the stage! Now finish chewing, everyone! Tomorrow we broadcast to the entire world! ENCORE!`)
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
Bassie: Dango, dear, it's just tea. You don't have to calculate the trajectory.
Dango [!]: It's NOT just tea, Bassie-san! It is the sacred spirit of hospitality! If the foam bubbles are larger than one millimeter, my ancestors will weep!
> Dango whisks frantically until a delicate, jade-green foam tops the ceramic bowl. She presents it with both paws, bowing until her forehead touches the wood.
Dango: Please accept this humble, completely inadequate offering!
Bassie: Oh, thank you!
> Bassie lifts the bowl and chugs the entire steaming serving in three giant gulps.
Bassie [note]: Mmmm! That hits the spot! Can I get a refill?
Dango [dots]: Y-You... drank it in three seconds...
Bassie: It was delicious! Best tea I've ever had!
Dango [sweat] (jump): AHHH! SHE LIKED IT! I DIDN’T OFFEND THE ANCESTORS!
> Dango collapses sideways onto her cushion in tearful, overwhelmed relief.`),

    scene('Jessie · Acoustic Decibel Wars', 'Center Stage', `
@bg Stagebackgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@enter Jessie right
@enter Nugget left
Jessie [glare]: Nugget! Why are you standing in the orchestra pit? I told you to go to the very last row of the upper mezzanine!
Nugget: But the stairs are really steep and I dropped my napkin!
Jessie: I do not care about your napkin! I need to calibrate my acoustic vocal projection! Now march your buns up there immediately!
> Nugget scurries up the aisle, panting, and reaches the top tier.
Nugget~ [!]: I'M AT THE TOP, JESSIE! CAN YOU HEAR ME?!
Jessie [smug]: Of course I can hear you, you barking sausage! Now listen closely! Testing high C!
Jessie [note]: AAAAAAAAHHHHHHHHHHHHHHHHHHHH—!
> The chandelier overhead rattles violently. Two lightbulbs flicker.
Nugget~ [note]: WOW! SOUNDS LIKE A JET ENGINE TAKING OFF! DO IT AGAIN!
Jessie: It is NOT a jet engine, it is the crystalline resonance of royalty! Did it reach the corners?!
Nugget~: IT REACHED MY BONES! MY MUSTARD IS VIBRATING!
Jessie [smug] (bow): Perfection. If the peasants' ears aren't ringing by intermission, I haven't done my job!`),

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
Dango [sweat]: CODY! You CANNOT keep doing that! You walk like a ghost wrapped in iron! I almost threw my broom into your eye!
Cody: You'd miss. Your broom-throwing technique is terrible.
Dango: Put a bell on your collar! Or rattle your chains! Give me a five-second warning before entering my personal breathing radius!
Cody: I told you, the chains are fashion. If I wear a bell, how am I supposed to catch intruders sneaking through the service ducts?
Dango: We don't HAVE intruders in the service ducts!
@enter Nugget center
Nugget [note]: CODY! Look! I made you an artisanal heart-shaped ketchup packet for your tool belt!
> Nugget proudly presents a red foil pouch folded into a lumpy little heart.
Cody [dots]: ...
Dango [smug]: Oh? What's this? The terrifying, stone-cold trap master is blushing?
Cody [glare]: I'm not blushing. The lobby heater is too high.
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
Jessie: Someone has committed high treason! Dango, fetch the police! Cody, seal the exits!
@enter Nugget left
Nugget [note]: Good morning, Jessie! Did you have a nice nap?
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
