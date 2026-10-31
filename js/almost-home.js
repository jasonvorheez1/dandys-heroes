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
      const bg = kind === 'door-loop' ? 'assets/backgrounds/maps/diner.png' : kind === 'door-out' ? 'uploads/backgroundlobby2.png' : 'uploads/backgroundlobby1.webp';
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
> The lobby door thumps shut. Bassie straightens the ribbon on her basket. Vee's screen flickers with leftover static from the trip back.
Vee: Finally, a floor that stays put. One more shake from that tower elevator and my picture would have fallen off the back of my head.
Bassie: It's nice to be home. Where's Shelly?
@enter Shelly center
Shelly: Right here! Did you know the mortar by the drain pipe has seven distinct layers? Seven!
Vee: Riveting. Now, the maintenance log, and then --
@fx flash
> Vee stops. The East Wing is draped in magenta velvet. Gold cable runs along the baseboards, and a lit marquee over the archway reads THE ROYAL BROADCAST.
Vee [glare]: Who approved cable across a walkway? That's a trip hazard, a fire hazard, and a taste hazard.
@exit Shelly
@enter Dango center
Dango [sweat]: Welcome! Okaeri! Oh, you're not on the call sheet...
Vee [dots]: The what? I'm Vee. This is my building. Who are you?
Dango: Dango! Dandy put us in the East Wing for a Japanese showcase. If the banners are in your way I can raise them four inches --
Vee: Dandy has never mentioned you. Forty-one Toons live here, and not one of them is you. Pack up.
@enter Cody left
Cody: Step back, monitor-head.
@cut fan
Vee [glare]: Monitor-head?
Cody: You're about to trip the wire by the mat.
Bassie [!]: The what?! HAhaha... ha... you're kidding.
Cody: Bear-trap. Sixty-pound spring. It keeps the floor wax safe.
Dango [sweat]: Cody, no traps in the front hall! We talked about this!
Cody: The chains are fashion. If I wanted you restrained, I'd use better chains.
@enter Nugget right
Nugget [!] (jump): Hey, hey, nobody trip! I made hot dogs! Yellow mustard, steamed buns, every wrapper labeled! Hot dogs fix everything!
Bassie: Oh, that smells lovely...
Vee: Bassie. We don't eat snacks from trespassers.
@sfx dandy_entrance
> Heels click down the inner corridor. Slow. Deliberate. Closer.
@fx shake
@enter Jessie center
Jessie [smug]: WHO is making that dreadful noise in My Space? Nugget! I said silence during my warm-ups!
Vee: "My Space"?
Jessie [glare]: And what is THAT? Filthy peasants, loitering in my foyer without VIP passes!
Vee [glare]: I host this building's quiz show. You're a microphone stand with opinions.
Jessie [note] (bow): Dango, why is a television in my foyer? And look, she's in standard definition. Dreadful.
Vee: You have five minutes to leave, or I pull your plug myself.
Jessie [smug]: Darling, you couldn't unplug a lamp. Cody, fetch the grating.
Cody: Already oiling the traps.
Vee: Fine. By tonight, you're gone.`),

    scene('02 · Chipped China & Broken Clocks', 'Welcome Room', `
@bg assets/backgrounds/maps/diner.png
@ah tea
@music ahCandy
@cut tea
@enter Dango left
@enter Shelly right
> Dango sets out cups and a plate of mochi at top speed.
Dango [sweat]: Please, tea! Matcha lowers heart rates and solves ninety-eight percent of disputes.
Shelly: It smells wonderful. Though your friend Jessie seems... intense.
Dango: She's just very committed to her craft!
@enter Cody center
> Cody looks at the cup in Shelly's hand, takes it, and swaps it for another without a word.
Shelly [?]: Oh?
Cody: Chipped rim. You'd cut your lip.
Shelly: That's very kind. You remind me of an oviraptor guarding a nest. Tough outside, gentle with the eggs.
Cody [dots]: Not an oviraptor. Drink.
@enter Vee right
Vee [glare]: Shelly. Stop analyzing the intruders. And look at that clock! Frozen at 3:15! What did you people do to my wiring?
@enter Nugget center
Nugget [sweat]: Um, that was me. Miss Vee. I borrowed the clock battery for my mustard frother.
Vee [dots]: Your mustard frother.
Nugget [note]: It makes thirty percent more bubbles! It's science!
Vee: You killed a clock for condiments.
Cody: The mustard was good. Leave Nugget alone.
Vee: I'm surrounded by amateurs from another dimension.
@fx shake
@sfx ui_err
Dango [!] (jump): THE DOOR! It clicked!
> Cody tries the handle. Nothing.
Cody: Deadbolt's down. Looks like we're all stuck together.
Jessie~: I heard that! I am NOT "together" with commoners!`),

    scene('03 · Prima Donna Soundcheck', 'Center Stage', `
@bg assets/backgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@cut stage
@enter Jessie center
@enter Nugget left
> The deadbolt popped open by itself an hour ago. Nobody mentions it. Jessie owns the stage now, mic stand in hand, while Nugget lines up velvet chairs.
Jessie [note]: More light! If my cheekbones can't blind the back row, fire the electrician!
Nugget: Aisle seats are done! Every chair has sunflower seeds. Should I save Cody a seat by the sound booth?
Jessie: Only if he stops rattling his chains during my high notes.
Nugget: Could I bribe you with a hot dog for him?
Jessie: One dog. Extra Dijon. Then we negotiate.
@enter Vee right
@enter Bassie left
Vee [glare]: Step away from the mic, Jessie, or I trip the breaker.
Jessie: The rabble returns, with a basket.
Bassie: It's a nice basket. It has clover in it. HAhaha... ha...
Vee: You're squatting on an unmapped stage with stolen power.
Jessie: Your quiz show is buzzers and blinking lights, darling. I do HIGH ART.
@sfx ui_open
> A funky retro backing track blasts out of the speakers. Nobody touched the console.
@enter Dango right
Dango [sweat]: I didn't press play! I swear!
Jessie [?]: That's my intro, and it's four bars early!
@enter Shelly left
@ah close
> Shelly peels back a velvet drape. A dusty poster is hiding behind it.
Shelly: Vee. Look at this.
@image ahJessie
Shelly: "JESSIE IN CENTER STAGE. Show date: 7/24/1998."
Vee [!]: 1998?
Bassie: But we've never had an auditorium. We weren't even open!
Shelly: This paper wasn't made here, Vee. This poster is from somewhere else.
@fx dark
Jessie [dots]: ...Nineteen ninety-eight. That was my opening week. I remember the roses. I don't remember crossing over.
@imgoff
@fx light
@ah wide
Jessie [glare] (jump): ENOUGH! You don't get to inspect my archives without paying admission! Cody, the grating! Nugget, throw a pretzel at her!
Nugget: Pretzel inbound! Catch, Miss Vee!
Vee: DON'T THROW BAKED GOODS AT MY LENS!`),

    scene('04 · Euclidean Geometry Is Optional', 'Backstage Storage', `
@bg assets/backgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@cut door-loop
@enter Dango left
@enter Shelly right
> Dango leads the group down a corridor of stacked set flats, clutching her clipboard.
Dango [sweat]: We opened a door after our show, and we thought we were almost home. But none of these hallways match our blueprints.
@enter Cody center
Cody: They loop.
> He shoves the door marked STAFF ONLY. Beyond it is the Welcome Room, and Cody's canteen is still sitting on its saucer.
@enter Nugget right
Nugget: Our tea is still warm!
@enter Vee left
Vee [glare]: We walked two hundred paces in a straight line. Why are we in the diner?
Dango [!] (jump): I folded the hallway into a knot! I broke the floor plan! I'm so sorry, and I don't even know where our luggage went!
Nugget: Dango, look! I labeled you a hot dog. Your name's on the wrapper!
Dango [dots]: You remembered I skipped lunch?
Nugget: You always forget to feed yourself while you're checking on everybody else!
Cody: It's not your fault, Dango. The doors slip between worlds. Nobody's throwing anyone out while I'm standing here.
@ah close
> Behind an old wardrobe, Shelly finds another dusty frame.
@image ahDango
Shelly: Dango? Look.
Shelly: "DANGO'S BEHIND THE SCENES! Premiering April 5, 2000."
Dango [dots]: That's me. That's this clipboard.
@imgoff
Dango: Arthur and Delilah gave me this ribbon after our first test broadcast. Which means we aren't lost in your Gardenview. We came from a different one entirely.
Bassie: Then you're not squatters. You're castaways.
Jessie~: At last, the basket peasant has a thought! We are FOUNDING ROYALTY of our Gardenview!
Vee: Still a headache. But if the halls shift between worlds, one Toon holds the master keys. Station platform. Now.`),

    scene('05 · The Flower’s Explanation', 'Gardenview Station', `
@bg uploads/gardenviewtrainstation.webp
@ah station
@music ahCandy
@cut door-out
@enter Dandy right
@enter Vee left
> On the station platform, Dandy hums on a wooden bench and polishes a golden cassette.
Vee [glare]: Dandy. Put down the tape and talk.
Dandy [note]: Vee! Bassie! Shelly! How was the theme park?
Vee: Don't play innocent. You opened the East Wing to four strangers from another world.
@enter Jessie center
Jessie [glare]: And they trespassed in My Space! Banish these extras at once!
Dandy [note] (bow): Now, Miss Platter. Let's not shoo away our most dedicated audience.
@enter Cody center
@enter Nugget left
Cody: Did you double-book the wing, flower? I don't like moving my traps twice.
Nugget: And my mustard is going flat! We need dimensional stability, Mr. Dandy!
@enter Dango center
Dango [sweat]: Dandy-san. Is there a way home? We thought we were almost there.
Dandy [dots]: ...
> The grin softens. Dandy turns a brass key between his fingers.
Dandy: The rift took you somewhere you didn't plan on, Dango. You were looking for your own halls and you walked into ours. I didn't want you stranded in a dark corridor, so I gave you the East Wing and a broadcast.
Jessie [smug]: Naturally. This building needed real glamour.
Dandy: Think of the spectacle. Think of the Golden Tapes!
Vee [dots]: You turned a dimensional emergency into a seasonal event?
Dandy: Would you rather they set traps on the lawn? This pass links both sets of halls. No lockouts, no squatting. The Royal Broadcast stays until the way home opens.
Vee: Fine. But if she says "peasant" once more, I test her range with an oscilloscope.
Jessie [note]: My high notes would blow your tubes before you found the switch.
Nugget [!] (jump): Nobody gets kicked out! Hot dogs for the whole building!
@move Dango left
@move Bassie right
> Dango offers Bassie a paper parcel of matcha biscuits.
Dango [note]: Thank you for being kind to us, Bassie.
Bassie: Thank you for the tea. And Nugget, that mustard really is something.
Nugget: I KNEW IT! AERATION NEVER FAILS!
Jessie [note] (bow): Be in your seats for tomorrow's broadcast, peasants. And bring roses!`),

    scene('06 · The Souvenir on the Shelf', 'The Real Gardenview & Royal Studio', `
@bg assets/backgrounds/maps/rainbow-rooms.png
@music ahCandy
@cut token
@enter Gigi center
> In her room, Gigi lies flat on the floor and fishes under the bookshelf with a ruler.
Gigi [dots]: Almost... almost...
@sfx ui_ok
> A brass arcade token clinks out into the light.
Gigi [note]: GOT it! Mwehehe!
@enter Bassie right
@enter Shelly left
Bassie: You found your lucky token!
Gigi: Where were you guys? You were gone forever.
Shelly: We met performers from an alternate world! Living fossils from a parallel timeline.
Gigi: Did Vee throw them out?
Bassie: Dandy let them stay. They sent this for you.
> Gigi pulls a golden biscuit from the bag and bites into it.
Gigi [!] (jump): WHOA. Who made this?
Shelly: A small, very polite Toon named Dango.
Gigi: And who was yelling from three hallways away?
Bassie: Jessie. She called Vee a peasant seven times. HAhaha... ha...
Gigi [note]: Seven? To her face? Mwehehe, they can stay forever. I'm going to go see what shiny stuff they brought.
@exitall
@fx dark
@card That night, in the East Wing.
@bg assets/backgrounds/maps/vee-storage.webp
@ah backstage
@enter Dango left
@enter Cody right
> Cody hammers a steel wedge under the backstage door.
Dango: Will it hold this time?
Cody: Three spikes. The door isn't going anywhere tonight.
@enter Nugget center
Nugget [note]: Dinner! Twenty jumbo dogs, grilled onions, and aerated mustard!
@enter Jessie right
Jessie [smug]: At last. The star requires protein.
> She inspects a hot dog like a jeweler, then takes a careful bite. Her eyes widen.
Jessie: ...Acceptable. Near exquisite, even. Well done, little brother.
Nugget: BEST REVIEW EVER!
Dango [note]: We really get to stay, don't we? Even here?
Cody: As long as we're together, we're home, Dango.
@fx petals
Jessie [note] (bow): Home? Darling, we own the stage. Now chew faster! Tomorrow we broadcast across dimensions. ENCORE!`)
  ];

  /* ============================================================
     OVERHAULED BONUS MEMORIES (4 Character Comedies)
     ============================================================ */

  const bonus = [
    scene('Dango · The Tea Ceremony Panic', 'Tea Counter', `
@bg assets/backgrounds/maps/diner.png
@ah tea
@music ahCandy
@enter Dango left
@enter Bassie right
> Dango kneels at the counter and measures matcha with a bamboo spoon, hands shaking.
Dango [sweat]: Ninety-two point five degrees. Three whisks clockwise, then two figure-eights...
Bassie: It's just tea, Dango. HAhaha... ha... you don't need to plot a trajectory.
Dango [!]: It is NOT just tea! It's hospitality! If the foam bubbles are over one millimeter, I've failed!
> She whisks until the foam is a perfect jade dome, then presents the bowl with both paws and bows until her forehead hits the wood.
Dango: Please accept this humble, utterly inadequate offering.
Bassie: Oh, thank you!
@sfx ui_ok
> Bassie drinks the whole bowl in three gulps.
Bassie [note]: Ahh! That hit the spot. Any more?
Dango [dots]: You... drank it in three seconds.
Bassie: It was delicious! Was that too fast?
Dango [sweat] (jump): She liked it! THE FOAM WAS ACCEPTABLE!
> Dango flops sideways onto her cushion, sobbing with relief.`),

    scene('Jessie · Acoustic Decibel Wars', 'Center Stage', `
@bg assets/backgrounds/maps/vee-showroom.webp
@ah stage
@music ahCandy
@enter Jessie right
@enter Nugget left
Jessie [glare]: Nugget! Why are you in the orchestra pit? I said the very last row of the balcony!
Nugget: The stairs are steep and I dropped my napkin!
Jessie: March. Now. I must calibrate my projection so both worlds can hear me.
> Nugget trots up the aisle, panting, and flops into the top row.
Nugget~ [!]: I'M AT THE TOP! CAN YOU HEAR ME?!
Jessie [smug]: Perfectly, you barking sausage. Testing high C!
@ah spotlight
@fx shake
Jessie [note]: AAAAAAAAAAAHHHHH--!
> The chandelier rattles. Two bulbs pop.
Nugget~ [note]: IT SOUNDS LIKE A JET ENGINE! DO IT AGAIN!
Jessie: It is the crystalline resonance of royalty! Did it reach the corners?
Nugget~: IT REACHED MY BONES! MY MUSTARD IS VIBRATING!
@ah wide
Jessie [smug] (bow): Perfection. If nobody's ears are ringing by intermission, I haven't done my job.`),

    scene('Cody · Perimeter Traps & Fashion Statements', 'Gardenview Lobby', `
@bg uploads/backgroundlobby1.webp
@ah lobby
@music ahCandy
@enter Dango left
@enter Cody right
> Dango sweeps powdered sugar near the front counter. Cody appears behind her without a sound.
Cody: Dustpan's crooked.
@fx shake
Dango [!] (jump): GYAAAH!
> She launches her broom like a spear. Cody catches it by the handle, one-handed, without blinking.
Dango [sweat]: You CAN'T keep doing that! You walk like a shadow in iron!
Cody: You'd have missed. Your throwing form is bad.
Dango: Wear a bell! Rattle your chains! Give me five seconds' warning before entering my personal breathing radius!
Cody: The chains are fashion. A bell would ruin the look. And I'd lose the element of surprise on whoever tracks mud in.
Dango: Nobody tracks mud in!
@enter Nugget center
Nugget [note]: CODY! I made you a ketchup packet shaped like a heart for your tool belt!
> He holds up a red foil pouch folded into a lumpy little heart.
@ah close
Cody [dots]: ...
Dango [smug]: Is the terrifying trap master blushing for his boyfriend?
Cody [glare]: The heater's too high.
Nugget: Put it by your wrench! It'll keep you company in the forge!
Cody [dots]: ...Yeah. Thanks, puppy. Into the pocket it goes.
@ah wide
Dango [note]: So soft inside! Like red bean paste!
Cody: Say "bean paste" once more and your broom goes in the trap.`),

    scene('Nugget · The Silk Scarf Incident', 'Backstage Dressing Room', `
@bg assets/backgrounds/maps/vee-storage.webp
@ah backstage
@music ahCandy
@enter Jessie right
Jessie [!]: EMERGENCY! CODE CRIMSON! My imported emerald silk scarf has vanished!
Jessie: Treason! Dango, call the tribunal! Cody, seal the exits!
@enter Nugget left
Nugget [note]: Morning, Jessie! Sleep well?
Jessie [glare]: Nugget. Did you touch my scarf? It was on my vanity!
Nugget: The green shiny one? Yeah! I put it away for you!
Jessie: Away where?
Nugget: In the fridge!
Jessie [dots]: ...
Jessie [!]: The REFRIGERATOR?
Nugget: You said keep it cool! And my big bowl of sauerkraut needed a blanket!
Jessie: You wrapped my silk scarf around a bowl of FERMENTED CABBAGE?
Nugget [note]: It kept the temperature super even! It smells a little sour, but look, no wrinkles!
> He holds up the scarf. A faint cloud of dill and vinegar drifts across the room.
@ah close
Jessie [glare]: I will turn you into breakfast links. I will slice you into cocktail wieners.
Nugget [sweat]: Did I do a bad dog thing...?
> His ears droop. He gives her the biggest, shiniest puppy eyes in the dimension.
Jessie: ...
Jessie [dots]: Stop that. Stop looking at me like that.
@ah wide
Jessie: FINE. The cold fabric will help my throat. BUT YOU WASH IT TONIGHT.
Nugget [note] (jump): Gentle lavender soap! You're the best sister ever, Jessie!
Jessie [note]: Yes, yes, I'm a benevolent monarch. Now fetch me tea before I faint from the fumes.`)
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
