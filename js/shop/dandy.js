/* Dandy's Store - a dialogue-led, gameplay-currency-only shop. */
'use strict';

(function () {
  const baseGo = Screens.go;
  Screens.go = function (name, opt) {
    const result = baseGo.call(this, name, opt);
    if (this.cur !== 'shop') { this._shopInStore = false; clearInterval(this._shopClock); this._shopRig?.destroy(); this._shopRig = null; }
    return result;
  };

  const ShopUpgrade = {
    MAX: 100,
    level() { return Math.min(this.MAX, Math.max(0, Math.floor((Save.data.shop && Save.data.shop.level) || 0))); },
    mastery() { return Math.max(1, Math.floor((Save.data && Save.data.mastery) || 1)); },
    tapeCost(level) { return Math.ceil(8 * Math.pow(1.055, level) + level * .8); },
    discount(level) { return Math.min(.30, level * .003 + Math.min(.12, Math.max(0, this.mastery() - 1) * .00015)); },
    stockBonus(level) { return Math.floor(level / 20); },
    masterySupplyBonus() { return Math.min(.80, Math.sqrt(Math.max(0, this.mastery() - 1)) / 35); },
    resourceMult(level) { return 1 + level * .012 + this.masterySupplyBonus(); },
    masteryResearchBonus() { return Math.min(14, Math.floor(Math.sqrt(Math.max(0, this.mastery() - 1)) / 2)); },
    licenseBonus(level) { return Math.floor(level / 8) + this.masteryResearchBonus(); },
    trinketRank(level) { return Math.min(TRINKET_MAX_RANK, 1 + Math.floor(level / 25) + Math.floor(Math.max(0, this.mastery() - 1) / 200)); },
    stockSlots(level) { return 4 + Math.floor(level / 25); },
    nextUnlock(level) {
      const unlocks = [
        ...RESOURCE_STOCK.map(item => ({ level:item.unlock, label:item.name })),
        { level:60, label:'Trinket Counter' }, { level:70, label:'Hero Licenses' },
        { level:85, label:'Lethal Shards' }
      ].filter(item => item.level > level).sort((a, b) => a.level - b.level);
      return unlocks[0] || null;
    },
    price(cost) {
      const mult = 1 - this.discount(this.level());
      const out = {};
      Object.keys(cost || {}).forEach(k => {
        if (cost[k] > 0) out[k] = Math.max(1, Math.ceil(cost[k] * mult));
      });
      return out;
    },
    stock(item) {
      const level = this.level();
      const out = Object.assign({}, item, { limit: (item.limit || 1) + this.stockBonus(level) });
      if (item.gain) {
        out.gain = {};
        Object.keys(item.gain).forEach(k => out.gain[k] = Math.ceil(item.gain[k] * this.resourceMult(level)));
        out.desc += ` Counter bonus: ${Math.round(this.resourceMult(level) * 100)}% supplies.`;
      }
      // The counter can turn one ticket into several. Price the whole stack
      // above its expected Ichor and convertible Star Dust return.
      if (item.id === 'ticket') {
        const base = (item.cost && item.cost.ichor && item.cost.ichor !== 5000) ? item.cost.ichor : (Gacha.ticketLiquidValue() * 1.35);
        const unit = Math.ceil(base / (1 - this.discount(level)));
        out.cost = { ichor: unit * out.gain.ticket };
      }
      if (item.id === 'star') {
        const value = out.gain.star * Gacha.starCashRate() * 1.25;
        out.cost = { ichor: Math.ceil(value / (1 - this.discount(level))) };
      }
      // Star Dust crates return Star Dust in their guaranteed cache. Price
      // every crate in the counter bundle against that growing return.
      if (['gold', 'diamond', 'main', 'collab'].includes(item.id)) {
        const cache = Gacha.supplyCache(item.id, Gacha.projectedCrateLevel());
        const unit = Math.ceil(cache.star * (item.id === 'collab' ? 10 : 4) / (1 - this.discount(level)));
        out.cost = { star: unit * out.gain[item.id] };
      }
      if (item.hero) {
        out.amount = item.amount + this.licenseBonus(level);
        if (!item.isPack) {
          out.desc = item.collabTier
            ? `${out.amount} Collab Tier shards toward recruiting or promoting ${HEROES[item.hero].name}.`
            : `${out.amount} research toward recruiting or promoting ${HEROES[item.hero].name}.`;
        }
      }
      if (item.shardHero) {
        out.amount = item.amount + this.masteryResearchBonus();
        out.desc = `${out.amount} research toward recruiting or promoting ${HEROES[item.shardHero].name}.`;
      }
      if (item.visitorHero) out.limit = 1;
      if (item.trinket) {
        out.trinketRank = this.trinketRank(level);
        const trinket = TRINKETS[item.trinket];
        const stat = trinket ? trinketStatText(trinket, out.trinketRank) : item.desc;
        out.desc = `Rank ${out.trinketRank} · ${trinketRankLabel(out.trinketRank)} · ${stat} · ${trinket ? trinket.effect : item.desc}`;
        if (trinket) out.say = `The ${trinket.name}, tuned to ${trinketRankLabel(out.trinketRank)}! It grants ${stat}... all from that tiny thing!`;
      }
      if (item.profileIcon) out.limit = 1;
      return out;
    },
    summary(level) {
      const next = this.nextUnlock(level);
      const masteryBonus = Math.round(this.masterySupplyBonus() * 100);
      return `${Math.round(this.discount(level) * 100)}% off · ${Math.round(this.resourceMult(level) * 100)}% supplies · Mastery +${masteryBonus}%${next ? ` · Lv ${next.level}: ${next.label}` : ' · Full counter stocked!'}`;
    },
    upgrade() {
      const level = this.level();
      if (level >= this.MAX) return false;
      const cost = this.tapeCost(level);
      if (!Save.spend({ tape: cost })) return false;
      Save.data.shop.level = level + 1;
      Save.write();
      return true;
    }
  };

  const TAB_LINES = {
    resources: [
      "Supplies! I watched every crate arrive. Closely.",
      "Running low? Point it out. I'll find a fair price.",
      "Fresh stock! Well... don't smell the tape."
    ],
    licenses: [
      "Toon files! Bring the research; I'll handle the paperwork.",
      "Looking for a teammate? The roster rotates.",
      "Research, forms, signatures. I do love a license."
    ],
    packs: [
      "Packs! Big bundles. Big prices. You saw the sign.",
      "Four packs today. Tomorrow? You'll have to look.",
      "Bring proof you beat the event boss. Then I open that shelf."
    ],
    trinkets: [
      "Trinkets! Small, shiny, surprisingly demanding.",
      "I polished these myself. Don't check for fingerprints.",
      "One little Trinket can change a fight. I wish flowers could."
    ],
    icons: [
      "Icons! Pick the face you want people to remember.",
      "A good icon says you have taste. Usually.",
      "Hero and Trinket portraits unlock on their own. These need my stamp."
    ],
    gossip: [
      "Gossip? Pick a Toon. Keep your voice down.",
      "Door's shut. Files are sorted by interest—er, alphabetically.",
      "If anyone asks, you heard it elsewhere. Hehe."
    ]
  };

  const RESOURCE_STOCK = [
    { id:'tape', unlock:0, name:'Field Tape', desc:'A tidy bundle for upgrading Hero skills and Dandy’s counter.', img:'./OBJECT/Tape.png', cost:{ichor:450}, gain:{tape:10}, limit:2, say:"Field Tape! It fixes skills, machines, shelves... hmm. Let's stop the list there." },
    { id:'exp', unlock:0, name:'EXP Bottle', desc:'A concentrated bottle of experience for Hero levels.', img:'uploads/exp-bottle-icon.png', cost:{ichor:500}, gain:{exp:1600}, limit:2, say:"An EXP Bottle! Carefully concentrated, delightfully sparkly, and much easier to pour than a whole training session!" },
    { id:'star', unlock:8, name:'Star Dust', desc:'Promotion dust with a suspicious sparkle.', img:ItemSheet.url('Star'), emoji:'⭐', cost:{ichor:700}, gain:{star:35}, limit:2, say:"Star Dust! Pretty, powerful, and impossible to sweep up. Please open it somewhere else!" },
    { id:'gold', unlock:16, name:'Gold Crate', desc:'A crate of Hero research and useful materials.', emoji:'📦', cost:{star:55}, gain:{gold:1}, limit:1, say:"A Gold Crate! It rattles a little, but that's normal... I think. Crates are supposed to rattle, right?" },
    { id:'manual', unlock:22, name:'Training Manuals', desc:'Field notes used to rank up Classes and Subclasses.', emoji:'📘', cost:{ichor:850}, gain:{manual:7}, limit:2, say:"Training Manuals! Read every page carefully. If a diagram looks upside down, try turning the book first." },
    { id:'trinket-shards', unlock:28, name:'Trinket Shards', desc:'A pouch of parts used to craft Trinkets.', emoji:'🔩', cost:{ichor:1000}, gain:{scrap:50}, limit:2, say:"Trinket Shards! Lots of tiny possibilities in one tiny bag. Watch out for the pointy ones!" },
    { id:'ticket', unlock:40, name:'Scratch Ticket', desc:'Open one Prize Wall tile. Grand Prize progress carries forward.', emoji:'🎟', cost:{ichor:5000}, gain:{ticket:1}, unlimited:true, say:"A Scratch Ticket. One ticket, one tile on the Prize Wall!" },
    { id:'raid-ticket', unlock:48, name:'Raid Ticket', desc:'One instant battle round or Wood game attempt. Battles use the real sim; Wood games auto-play at Bronze or replay your best score.', emoji:'⚡', cost:RaidEconomy.SHOP_COST, gain:{raidTicket:1}, limit:1, say:"A Raid Ticket. Genuinely rare stock these days, so the price is... also genuinely rare. Make it count." },
    { id:'diamond', unlock:55, name:'Diamond Crate', desc:'Premium Hero research and upgrade materials.', emoji:'💎', cost:{star:135}, gain:{diamond:1}, limit:1, say:"Ooh, the Diamond Crate! Very shiny, very valuable, and very much not something to drop on my counter!" },
    { id:'collab', unlock:120, name:'Collab Crate', desc:'Rare research for Collab and Event Toons.', emoji:'🎭', cost:{star:900}, gain:{collab:1}, limit:1, say:"A Collab Crate! Visitors from other worlds packed this one. I only stock a few, and they go fast." },
    { id:'main', unlock:85, name:'Main Character Crate', desc:'Focused research with a high chance of a Main Character or Dandy.', emoji:'🌟', cost:{star:360}, gain:{main:1}, limit:1, say:"A Main Character Crate! I would hold onto that one. It has an unusually strong pull toward the important files... and my file, naturally!" }
  ];

  const PROFILE_ICON_STOCK = [
    { id:'profile-icon-dandy', name:"Dandy's Signature", desc:'A shopkeeper portrait for your Dandy’s Heroes profile.', img:'./uploads/dandyhimself.webp', cost:{ichor:1800}, profileIcon:'dandy', limit:1, say:"My own portrait? Oh! Well, if you insist... I suppose I do photograph rather well!" },
    { id:'profile-icon-buds', name:"Dandy's Buds", desc:'The Buds mark for players who appreciate a guided beginning.', img:'./uploads/dandysbudicon.png', cost:{tape:24}, profileIcon:'buds', limit:1, say:"Dandy's Buds! A tidy little reminder that I did ask you to click it eventually!" },
    { id:'profile-icon-journal', name:'Journal Seal', desc:'A bright seal for players who keep their discoveries together.', emoji:'📖', cost:{notes:30}, profileIcon:'journal', limit:1, say:"A Journal Seal! Very official. Try not to lose it between all those achievement pages!" },
    { id:'profile-icon-ichor', name:'Ichor Crest', desc:'A Black Ichor crest for a profile with a little extra danger.', img:'./uploads/ichor.png', cost:{star:80}, profileIcon:'ichor', limit:1, say:"The Ichor Crest! Dramatic, isn't it? It makes even a perfectly sensible profile look dangerous!" }
  ];

  const TOON_NAMES = { RnD:'Razzle & Dazzle', Delilah:'Delilah Keen' };
  const EXTRA_TOONS = ['Flutter','Glisten','Tisha','Waxwell','Teagan','Pebble','Finn','Goob','RnD'];
  const DANDY_LICENSE_LINES = {
    Astro:"Astro! A very calm choice... maybe too calm. Don't let the whole team nap before the fight starts!",
    Scraps:"Scraps is clever with crafts and even cleverer at slipping out of trouble! Just don't hover while she draws, alright?",
    Vee:"Vee... Oh! Yes, Vee is certainly good at what she does. Very confident about it, too.",
    Cosmo:"Cosmo! Sweet, helpful, and actually made of dessert. Hehe... don't tell him I said the last part like that.",
    Cocoa:"Cocoa always finds something cheerful to say! It can get a little exhausting... but in a nice way!",
    Bobette:"Bobette! She can package almost anything beautifully. I wonder if she'd redo my supply boxes...",
    Boxten:"Boxten is a lovely choice! Give him a familiar face nearby and you'll hear much more of that music box.",
    Brightney:"Brightney can light up an entire floor! Very useful... especially when the lights start doing that flickering thing.",
    Coal:"Coal! Once she picks someone to guard, she takes it very seriously. Try to be the one she picks!",
    Connie:"Connie, huh? Wonderful! Just remember she can walk through walls... actually, maybe don't remember that. I try not to.",
    Ginger:"Ginger! She'll remember everybody's favorite snack except her own. Keep an extra one for her, would you?",
    Bassie:"Bassie carries enough supplies for three emergencies and half a picnic! Don't ask about the ribbon, though.",
    Blot:"Blot! He doesn't say much... not out loud, anyway. Somehow you still know exactly what he means!",
    Brusha:"Brusha is an incredible artist! As for her manners... well, no Toon can be incredible at everything. Hehe!",
    Looey:"Looey! He's funny, stretchy, and very good at making a mess look intentional! That's a talent, you know.",
    Rudie:"Rudie goes everywhere at full speed! If you recruit him, move your fragile things first. Trust me.",
    Shelly:"Shelly? Oh! Sure, sure... She knows an awful lot about fossils. Probably more than anyone needs to know.",
    Shrimpo:"Shrimpo? Really? Well... you made the choice, not me! Keep the receipt. Hehe... I'm kidding. Mostly.",
    Toodles:"Toodles is always studying the other Toons! Give her a little time and she'll surprise everybody.",
    Yatta:"Yatta! Tons of energy, tons of candy... not nearly enough candy offered to the shopkeeper, if you ask me.",
    Poppy:"Poppy is quick to help whenever somebody needs her! You'll probably hear her coming. Bubbles aren't subtle.",
    Sprout:"Sprout! Very dependable, very protective, and very interested in taking charge... even when nobody asked.",
    Dyle:"Dyle keeps everything running on time! Mention trains and you may be there a while, though. A long while.",
    Gigi:"Gigi! You never know what she'll pull out next. She doesn't know either, which is what makes it exciting!",
    Squirm:"Squirm can finish a machine before you know it! Keep your books somewhere safe, though... especially the tasty-looking ones.",
    Eggson:"Eggson is sensible, steady, and usually right before everybody else notices! Not very flashy, but I can forgive that.",
    Flyte:"Flyte! Fast, focused, and already halfway down the hall before you finish saying hello!",
    Rodger:"Rodger notices every little detail. Every. Little. Detail. Maybe don't mention I said that.",
    Soulvester:"Soulvester doesn't hurry for anyone. Somehow everyone ends up waiting for him anyway... impressive, really.",
    Gourdy:"Gourdy is still a kid, alright? Keep him safe and don't go poking around in the family files.",
    Eclipse:"Eclipse knows how to make an entrance! I appreciate that. Maybe not more than my entrances, but still.",
    Delilah:"Delilah Keen... That's a rather important file. Read the requirements twice before you touch anything.",
    Dandy:"My license? Huh... why would you need that when I'm standing right here? Put that file back.",
    Flutter:"Flutter is quiet, quick, and very good at hearing things people didn't mean to share! Useful little skill, isn't it?",
    Glisten:"Glisten! Shiny, stylish, and always checking the nearest reflection. I understand the instinct.",
    Tisha:"Tisha works harder than almost anyone around Gardenview! The place would be a disaster without her... a bigger disaster.",
    Waxwell:"Waxwell is full of bright ideas! Some are pranks, some are fires, and sometimes they're both. Keep water nearby.",
    Teagan:"Teagan! She remembers every cup. She even asked how I take mine. I had to think about it.",
    Pebble:"Pebble has a license now? My little rock is moving up in the world! Take very, very good care of him.",
    Finn:"Finn! You'll hear a lot about fish. A lot. His little friend Barnaby seems to enjoy the jokes, at least.",
    Goob:"Goob is impossible not to like! Just give him a little warning if you aren't ready for a hug.",
    RnD:"Razzle and Dazzle! One wants the spotlight, one wants a break, and somehow you recruit both. What a deal!",
    Sora:"Sora? The Keyblade kid? I have no clue where he came from, but he showed up when the Gardenview Center needed saving. That makes him a hero, I suppose! A visiting hero. Very visiting.",
    Riku:"Riku looks like he has already survived three dramatic speeches before breakfast. He is dependable, though. Put him in front and let the enemies regret it.",
    Kairi:"Kairi brings a surprising amount of light into these halls! She is helpful, capable, and much better at cleaning up danger than certain employees I could name.",
    Goofy:"Goofy may not look complicated, but put that shield between trouble and your team and suddenly everybody gets to breathe again. Dependable is worth a lot around here!",
    Ribecca:"Ribecca! Very prim, very proper, and very determined to fix your collar if it's crooked! A lovely addition to the team.",
    MrsHolloway:"Mrs. Holloway! Keep your hands in your pockets and don't lean on the glass. She has very strong opinions on decorum!",
    MrHolloway:"Mr. Holloway! He moves quietly, observes everything, and rarely needs to raise his voice. Quite intimidating, actually."
  };
  const TOON_GOSSIP = {
    Astro:"You know, I had the nicest dream recently! Astro was nearby, so... well, I suppose he gets some credit. Some! Don't tell him I got all sentimental.",
    Scraps:"Oh, I caught Scraps chasing the little red glow from an exit sign once! Back and forth, back and forth... just like a cat. I promised not to tell, so keep that between us!",
    Vee:"Vee used to be awfully sure her quiz show would outgrow mine. Hehe... can you imagine? She still gets that look whenever Scraps clears out the prize shelf.",
    Cosmo:"I remember Cosmo's first baking experiments! The alarms certainly remember them. He's much better now... and the ceiling only has a tiny scorch mark left.",
    Cocoa:"Cocoa keeps helping after you say you're fine. Just let her. It's quicker.",
    Bobette:"Bobette wraps everything. Presents, supplies, secrets. Don't open a box if it breathes.",
    Teagan:"Teagan remembers everybody's tea order. Somehow she also knows who needs a quieter table, a straw, or just a glass of water.",
    Boxten:"I'll admit something... Boxten's melody is actually very relaxing. I don't hear it around the halls as much now, though. Hmm... I hope he's doing alright.",
    Brightney:"I spotted Brightney at the far end of a very long hallway one night. Glowing like a beacon! If she was trying to sneak somewhere, it was not going well.",
    Coal:"Coal picks one person and guards them all day. If it isn't you, move.",
    Connie:"Connie wasn't always around the halls, you know! She used to arrive under another name. Then everyone liked her too much to keep her away. Good for her!",
    Ginger:"Ginger remembers your favorite snack and forgets her own. I hide extras for her. Don't tell her.",
    Bassie:"Medicine, rope, snacks, buttons, and something she won't show me. I've asked.",
    Blot:"Blot never spoke on the old show. Off camera he has plenty to say, if you can make sense of it backwards.",
    Brusha:"Have you seen Brusha and Tisha stuck in the same room? Yeesh! The show kept insisting they belonged together, and Brusha only got sharper about it. Unlike me, of course. I'm very calm!",
    Looey:"Here's something Looey never likes admitting! He used to lead the Circus Troupe during the show. Now he avoids taking charge... I wonder what changed.",
    Rudie:"Move the glassware. Rudie's coming.",
    Shelly:"Shelly and I don't talk as much as we used to... No big story there! Toons drift apart, that's all. I do hope she's found people who appreciate all those fossils.",
    Shrimpo:"I heard the wildest rumor! Shrimpo may actually have a friend. I saw him walking with Finn once, and there was no yelling for at least half the hallway!",
    Toodles:"Toodles watches Pebble when I get busy! She loves helping, Pebble loves the attention, and I get a quiet counter for five minutes. Everybody wins!",
    Yatta:"Yatta eats an astonishing amount of candy and never seems to get sick. How does she do it? Maybe some things really are fine in unlimited amounts... like applause!",
    Poppy:"There are old vending machines with Poppy's face on them! Poppy Pop, they called it. Cute idea... although a flower flavor might have sold even better. Hehe!",
    Sprout:"I've tried talking with Sprout. Really! We just... clash. He has a habit of taking over situations that were already perfectly handled by me.",
    Dyle:"Dyle used to oversee Gardenview's trains and still helps me with important little jobs. Then he starts explaining the machinery... and somehow I forget every word immediately.",
    Gigi:"Gigi once accused me of coloring my petals! Can you believe that? These colors are completely natural... and very difficult to maintain. I mean, appreciate!",
    Squirm:"Squirm apologized to the old tree for bumping into it, then came back with water. The tree looks better. Squirm looked a little less worried too.",
    Eggson:"Eggson does the sensible thing and waits for everyone else to catch up.",
    Flyte:"Say the important part first. Flyte will be gone by the second sentence.",
    Rodger:"Rodger keeps showing up near my room with more questions. Sometimes a flower wants a late-night snack without turning it into an investigation! That's normal, by the way.",
    Soulvester:"He waits for the world to come to him. It usually does. I don't like that.",
    Gourdy:"He's a kid. Be gentle about his parents. That's all I'm saying.",
    Eclipse:"Quiet corners, loud entrances. She understands presentation.",
    Delilah:"She made us. Gardenview closed. Somehow that became my fault. Funny, isn't it?",
    Dandy:"Me? Oh... that's a strange choice! I'm standing right here, you know. Why dig through a dusty file when you could simply tell me how good the shop looks?",
    Flutter:"I once saw Flutter in an enormous glittery hat! There was so much sparkle she kept sneezing little clouds of it all day. Don't tell her I saw!",
    Glisten:"Sometimes I wish Glisten would explain that reflection trick... not because I need it! It just seems useful if a conversation gets, hmm... inconvenient.",
    Tisha:"Tisha does more for Gardenview than most Toons notice. Cleaning, repairs, keeping everybody organized... I notice! I just don't always say it out loud.",
    Waxwell:"Stolen plushes, strange cookie ingredients, little fires. Then everyone enjoys the prank and he gets mad. Wonderful.",
    Teagan:"Teagan asked what I take in my tea. I told her to surprise me. She came back with plain hot water and a look that said I should answer the question next time.",
    Pebble:"Pebble tried to flip himself over yesterday and landed flat on his back! Poor little rock kept wiggling until I rescued him. Adorable, wasn't it?",
    Finn:"I keep watching the fish in Finn's bowl... Barnaby blinks, moves, and Finn whispers to him when nobody is looking. That's not an ordinary toy. I know what I saw!",
    Goob:"Goob used to hug everyone constantly! These days he doesn't hug me much at all... Hmm. I'm sure he's just busy. Yes, that's probably it!",
    RnD:"Razzle and Dazzle used to put on little plays with half the cast helping out! I loved those shows... even the ones where somebody forgot the ending.",
    Sora:"Sora? Yes, I have seen him! No, I do not know what a Keyblade is, where he came from, or why doors keep glowing around him. But the Gardenview Center was in trouble and he ran straight toward it. That sounds like a savior to me!",
    Riku:"Riku keeps watching the dark corners like they might recognize him. He says darkness is a tool. I would prefer tools that do not stare back, personally.",
    Kairi:"Kairi leaves little sparks of light in places everyone else avoids. They fade eventually, but people keep standing a little straighter after she passes.",
    Goofy:"Goofy plants his feet when everyone else wants to run. Every hit on that shield means somebody behind him did not have to take it.",
    Ribecca:"Ribecca insisted on inspecting my ribbon display last Tuesday. Said two of the bows were 'lacking discipline.' Can you imagine? Discipline for a ribbon!",
    MrsHolloway:"I offered Mrs. Holloway a cup of tea once. She looked at the cup, looked at me, and asked if the saucer was from the 1952 set. I told her it was confidential.",
    MrHolloway:"Mr. Holloway doesn't say much around the counter. He just stands near the exit, checking his pocket watch. Makes me feel like I'm running behind schedule!"
  };

  const TOON_LORE = {
    Astro:"Three nights awake because everyone else had nightmares. He blamed the moon. Sure, Astro. The moon.",
    Scraps:"Watching Scraps draw makes her freeze up. Look at the other wall. Pretend it's fascinating.",
    Vee:"Veronica Hurley handles Vee. M-005 is her designation. Main Character, probably. She'd agree.",
    Cosmo:"Cosmo understands Sprout's hovering. I don't think he understands how scared Sprout gets when he disappears.",
    Cocoa:"She writes down one good thing about every bad day. Then she leaves the notes where sad Toons will find them.",
    Bobette:"Bobette labels every package, even the ones she could identify by touch. She wants the right person to get the right thing.",
    Boxten:"He used to stop playing when anyone entered. Trusted friends get the last verse now.",
    Brightney:"She is scared of total darkness. The spare bulbs are 'for everyone.' She counts them twice.",
    Coal:"Coal checks every doorway before her person enters. She does not need a command to stand guard.",
    Connie:"Some rooms are gone. Connie still knocks where their doors used to be.",
    Ginger:"Ginger keeps an emergency cookbook with measurements in the margins and friends' snack requests tucked between the pages.",
    Bassie:"The mystery item is an old ribbon. Useless in a fight. She checks it before every trip anyway.",
    Blot:"He chooses not to speak. Someone understood the whole act once, no explanation needed. Blot never forgot.",
    Brusha:"The show ordered Brusha and Tisha to be best friends. They disliked each other even more after that.",
    Looey:"The louder Looey jokes, the more worried he is. He'd rather make you laugh than admit he's scared.",
    Rudie:"Rudie knows which corners are too sharp to take at full speed. He still has to remind himself before each turn.",
    Shelly:"Future and Past. Shelly was the past, Vee was the future. Production made very sure you knew it.",
    Shrimpo:"His anger gets loud when someone else is in danger. Calling it worry would make him furious, so don't.",
    Toodles:"She used to copy others because she thought she wasn't enough. Now every copied trick gets one change that's hers.",
    Yatta:"That bright costume is all patches from one show she wasn't supposed to finish. She finished.",
    Poppy:"Poppy puts the first bubble around whoever looks least ready for the next hit. She notices before they ask.",
    Sprout:"He counts, checks, and watches Cosmo. Distance feels dangerous to him, even when it isn't.",
    Dyle:"One blank minute in his schedule every night. 'Contingency time.' That's what he calls it.",
    Gigi:"One capsule never gets opened. No label. She says it's the only surprise she gets to keep.",
    Squirm:"That stress ball came from the first friend who trusted him during a panic. He squeezes it before brave things.",
    Eggson:"He keeps old instructions to remember every mistake behind the new ones. Very Eggson.",
    Flyte:"Flyte scouts ahead, doubles back, and reports the route in as few words as possible. Make sure you catch the first sentence.",
    Rodger:"Rodger writes down details other Toons miss. He is less quick to admit when the detail is that someone needs company.",
    Soulvester:"Soulvester checks the rear of every formation. Even when the fight is over, he waits until everyone else has crossed the room.",
    Gourdy:"Delilah's records say she never made Gourdy's parents. That's not a missing file. It's just... nothing.",
    Eclipse:"Eclipse plans an entrance like a performance, then forgets the plan the moment she spots something to chase.",
    Delilah:"Arthur Walton and Delilah Keen founded Gardenview. Show, park, museum, merchandise. Her name is on all of it.",
    Dandy:"We're not opening that file. Pick somebody else.",
    Flutter:"The wings buzz faster when she is startled. If you hear a high hum, give her ten seconds of quiet.",
    Glisten:"A mirror doesn't lie, but Glisten knows exactly which angles tell half the truth. He never looks straight on unless he means it.",
    Tisha:"She wipes the same spot twice when she's stressed. Her chore charts aren't rules; they're how she keeps her hands from shaking.",
    Waxwell:"He stole Toodles's Dog Plush and messed with Sprout and Cosmo's cookies. The pranks backfire. Then the flame goes up.",
    Teagan:"She tracks every recipe Arthur ever approved. Half of them call for peppermint, and she still refuses to brew those.",
    Pebble:"Not a single word in his file. Just a little paw-print on the corner and a note from Arthur saying 'keep him.'",
    Finn:"Finn handles the line. Barnaby handles the splash. Barnaby is a companion, not equipment, and he makes that very clear.",
    Goob:"He hugs tight because he thinks people let go when you loosen your grip. Remind him nobody is leaving.",
    RnD:"Razzle remembers every line from the pilot script. Dazzle remembers the lines they cut out. Together they know too much.",
    Ribecca:"Ribbons tied too neatly to be practical. She spends an extra twenty minutes checking the knots before every rehearsal.",
    MrsHolloway:"The museum ledger is balanced to the penny. The pages torn out of the back are where the real exhibits went.",
    MrHolloway:"He stares at the brass fittings on the doors until someone interrupts him. He remembers who held the original keys.",
    Sora:"No Gardenview creation record. No Toon Handler. He simply arrived through a door that was not there the day before.",
    Riku:"He knows what darkness can do because he once let it get too close. Every guard stance is a choice not to repeat that mistake.",
    Kairi:"Her light marks are not decoration. Each one is a promise that someone has a safe place to stand.",
    Goofy:"Block, protect, clear the lane, reset. Goofy keeps it simple because simple still works when everything gets loud."
  };

  function dandyLine(lines) { return Array.isArray(lines) ? pick(lines) : lines; }
  function toonName(id) { return TOON_NAMES[id] || (HEROES[id] && HEROES[id].name) || id; }
  function toonPortrait(id) {
    if (id === 'Dandy') return './uploads/image-removebg-preview.png';
    if (HEROES[id]) return Art.icon(id);
    return ItemSheet.icon(id);
  }
  function gossipCast() {
    return PLAYABLE_IDS.filter(id => TOON_GOSSIP[id] && TOON_LORE[id])
      .sort((a,b) => toonName(a).localeCompare(toonName(b)));
  }

  function gossipReadIds() {
    if (!Save.data.seen) Save.data.seen = {};
    if (!Array.isArray(Save.data.seen.gossipCases)) Save.data.seen.gossipCases = [];
    return Save.data.seen.gossipCases;
  }
  function gossipCaseUnlocked(file) {
    if (file.public) return true;
    return (file.unlock || file.cast || []).some(id => Save.owns(id));
  }
  function gossipCaseVisual(file, compact) {
    const visual = el('div', 'gossip-case-visual' + (compact ? ' compact' : ''));
    if (file.cast && file.cast.length) {
      file.cast.slice(0, 3).forEach((id, i) => {
        const img = el('img'); img.src = toonPortrait(id); img.alt = toonName(id);
        img.style.setProperty('--portrait-index', i); visual.appendChild(img);
      });
    } else visual.appendChild(el('i', null, file.icon || '📁'));
    return visual;
  }
  function openGossipCase(file, root) {
    if (!gossipCaseUnlocked(file)) {
      const names = (file.unlock || []).map(toonName).join(' or ');
      Sound.play('ui_err'); say(`That thread needs a familiar face. Recruit ${names || 'one of the connected Toons'} first.`); return;
    }
    Screens.shopGossipCase = file.id;
    const read = gossipReadIds();
    if (!read.includes(file.id)) { read.push(file.id); Save.write(); }
    Sound.play('ui_ok'); renderGossipThreads(root); say(file.dandy); revealShopDialogue(root);
  }
  function renderGossipThreads(root) {
    const area = $('#gossipThreadArea', root); if (!area) return; clear(area);
    const category = Screens.shopGossipCategory || 'all';
    const read = gossipReadIds();
    const publicCount = GOSSIP_CASES.filter(gossipCaseUnlocked).length;

    const status = el('div', 'gossip-thread-status');
    status.innerHTML = `<div><small>CONNECTED CASE BOARD</small><b>${read.length} / ${GOSSIP_CASES.length} read</b></div>
      <span>${publicCount} available</span>`;
    area.appendChild(status);

    const filters = el('div', 'gossip-filters');
    Object.keys(GOSSIP_CATEGORIES).forEach(key => {
      const def = GOSSIP_CATEGORIES[key];
      const b = el('button', 'gossip-filter' + (key === category ? ' selected' : ''), `${def.icon} ${def.label}`);
      b.onclick = () => { Screens.shopGossipCategory = key; Screens.shopGossipCase = null; Sound.play('ui_move'); renderGossipThreads(root); };
      filters.appendChild(b);
    });
    area.appendChild(filters);

    const active = GOSSIP_CASES.find(file => file.id === Screens.shopGossipCase && gossipCaseUnlocked(file));
    if (active) {
      const detail = el('article', 'gossip-case-detail');
      const top = el('div', 'gossip-case-detail-top');
      top.appendChild(gossipCaseVisual(active));
      const copy = el('div');
      copy.innerHTML = `<small>${active.eyebrow}</small><h3>${active.title}</h3><p>${active.summary}</p>`;
      top.appendChild(copy);
      const close = el('button', 'gossip-case-close', '×');
      close.setAttribute('aria-label', 'Close gossip file');
      close.onclick = () => { Screens.shopGossipCase = null; Sound.play('ui_back'); renderGossipThreads(root); };
      top.appendChild(close); detail.appendChild(top);

      if (active.cast && active.cast.length) {
        const cast = el('div', 'gossip-case-cast');
        active.cast.forEach(id => cast.appendChild(el('span', null, `${Save.owns(id) ? '●' : '○'} ${toonName(id)}`)));
        detail.appendChild(cast);
      }
      const facts = el('div', 'gossip-facts');
      active.facts.forEach((fact, i) => {
        const row = el('div', 'gossip-fact');
        row.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><p>${fact}</p>`;
        facts.appendChild(row);
      });
      detail.appendChild(facts);
      const quote = el('button', 'gossip-dandy-take');
      quote.innerHTML = '<span>💬</span><div><small>DANDY’S TAKE</small><b>Hear the shopkeeper’s version</b></div><i>▶</i>';
      quote.onclick = () => { Sound.play('ui_ok'); say(active.dandy); revealShopDialogue(root); };
      detail.appendChild(quote); area.appendChild(detail);
    }

    const files = GOSSIP_CASES.filter(file => category === 'all' || file.category === category)
      .sort((a,b) => Number(gossipCaseUnlocked(b)) - Number(gossipCaseUnlocked(a)) || Number(read.includes(a.id)) - Number(read.includes(b.id)));
    const grid = el('div', 'gossip-case-grid');
    files.forEach(file => {
      const unlocked = gossipCaseUnlocked(file), seen = read.includes(file.id);
      const card = el('button', 'gossip-case-card' + (unlocked ? '' : ' locked') + (seen ? ' read' : ' new'));
      card.appendChild(gossipCaseVisual(file, true));
      const copy = el('div', 'gossip-case-card-copy');
      const categoryDef = GOSSIP_CATEGORIES[file.category];
      copy.innerHTML = `<small>${categoryDef.icon} ${file.eyebrow}</small><b>${file.title}</b><span>${unlocked ? file.summary : 'Recruit ' + (file.unlock || file.cast || []).map(toonName).join(' or ') + '.'}</span>`;
      card.appendChild(copy);
      card.appendChild(el('em', null, unlocked ? (seen ? 'READ' : 'NEW') : '🔒'));
      card.onclick = () => openGossipCase(file, root);
      card.dataset.search = (file.title + ' ' + file.summary + ' ' + (file.cast || []).map(toonName).join(' ')).toLowerCase();
      grid.appendChild(card);
    });
    area.appendChild(grid);
    applyShopSearch(root);
  }

  function renderGossipToonFiles(root) {
    const area = $('#gossipThreadArea', root); if (!area) return; clear(area);
    const intro = el('div', 'gossip-toon-index-head');
    intro.innerHTML = `<div><small>INDIVIDUAL NOTES</small><b>Choose a recruited Toon</b></div><span>2★ unlocks deeper lore</span>`;
    area.appendChild(intro);
    const feature = el('div', 'gossip-feature'); feature.id = 'gossipFeature';
    feature.innerHTML = '<div class="gossip-question">?</div><div class="gossip-feature-copy"><small>DANDY’S NOTES</small><b>Choose an owned Toon</b><span>Locked portraits stay confidential.</span></div>';
    area.appendChild(feature);
    const roster = el('div', 'gossip-roster');
    gossipCast().sort((a,b) => Number(Save.owns(b)) - Number(Save.owns(a))).forEach(id => {
      const owned = Save.owns(id), stars = owned ? Save.hero(id).stars : 0;
      const b = el('button', 'gossip-toon' + (owned ? '' : ' locked') + (owned && Screens.shopGossipToon === id ? ' selected' : ''));
      b.dataset.toon = id;
      const heard = (Save.data.seen && Save.data.seen.gossipToons) || [];
      b.dataset.unread = String(owned && (!heard.includes(id + ':rumor') || stars >= 2 && !heard.includes(id + ':lore')));
      b.innerHTML = `<span><img src="${toonPortrait(id)}" alt="">${owned ? '' : '<i>???</i>'}</span><small>${toonName(id)}</small>${owned ? `<em>${stars >= 2 ? '★ LORE' : stars + '★'}</em>` : '<em>NOT OWNED</em>'}`;
      b.disabled = !owned;
      if (owned) b.onclick = () => showToonGossip(id, root, false);
      roster.appendChild(b);
    });
    area.appendChild(roster);
    if (Screens.shopGossipToon && Save.owns(Screens.shopGossipToon)) renderGossipFeature(Screens.shopGossipToon, root);
    else Screens.shopGossipToon = null;
    applyShopSearch(root);
  }

  function resLabel(cost) {
    const icons = {ichor:RES.ichor.icon,tape:'📼',notes:'✦',star:'⭐',ticket:'🎟',counterToken:'🔄',scrap:'🔩'};
    return Object.keys(cost || {}).map(k => `<span class="shop-cost-icon">${icons[k] || '◆'}</span> ${fmt(cost[k])}`).join(' + ');
  }

  function costText(cost) {
    const names = { ichor:'Black Ichor', tape:'Field Tape', notes:'Skill Notes', star:'Star Dust', ticket:'Scratch Tickets', counterToken:'Counter Tokens', scrap:'Scrap' };
    return Object.keys(cost || {}).map(k => `${fmt(cost[k])} ${names[k] || k}`).join(' and ');
  }

  function shopState() {
    if (!Save.data.shop) Save.data.shop = { bought:{}, refreshes:{}, level:0 };
    const state = Save.data.shop;
    if (!state.bought) state.bought = {};
    if (!state.refreshes) state.refreshes = {};
    if (state.level === undefined) state.level = 0;
    if (!state.packs || typeof state.packs !== 'object' || Array.isArray(state.packs)) state.packs = {};
    if (!state.packs.claimed || typeof state.packs.claimed !== 'object' || Array.isArray(state.packs.claimed)) state.packs.claimed = {};
    return state;
  }

  function packClaimed(item) {
    return !!(item.claimKey && shopState().packs.claimed[item.claimKey]);
  }

  function stockDay() { return dayIndex(); }
  function stockKey() {
    const day = stockDay(), refreshes = Math.max(0, Math.floor(Number(shopState().refreshes[day]) || 0));
    return day + ':' + refreshes;
  }
  function boughtToday(item) {
    if (item.claimKey) return packClaimed(item) ? 1 : 0;
    const state = shopState(), key = stockKey(), current = state.bought[key];
    // Preserve purchase limits from saves created before Counter Tokens.
    const currentCount = (current || {})[item.id] || 0;
    if (!(state.refreshes[stockDay()] || 0)) return Math.max(currentCount, (state.bought[stockDay()] || {})[item.id] || 0);
    return currentCount;
  }
  function profileIconOwned(item) { return !!(item.profileIcon && Save.data.profile && Save.data.profile.iconUnlocks && Save.data.profile.iconUnlocks.includes(item.profileIcon)); }
  function leftToday(item) { return profileIconOwned(item) ? 0 : item.unlimited ? Infinity : Math.max(0, (item.limit || 1) - boughtToday(item)); }
  function markBought(item) {
    if (item.claimKey) {
      shopState().packs.claimed[item.claimKey] = 1;
      Save.write();
      return;
    }
    const state = shopState(), key = stockKey();
    if (!state.bought[key]) state.bought[key] = {};
    state.bought[key][item.id] = (state.bought[key][item.id] || 0) + 1;
    Save.write();
  }
  function refreshShop() {
    if (!Save.spend({ counterToken: 1 })) {
      Sound.play('ui_err');
      say("A refresh? Oh, absolutely! I just need one Counter Token... the stamped kind, not the snack kind. Those are different.");
      return false;
    }
    const state = shopState(), day = stockDay();
    state.refreshes[day] = Math.max(0, Math.floor(Number(state.refreshes[day]) || 0)) + 1;
    Save.write();
    Sound.play('get_rare');
    Screens._shopNextLine = 'Fresh stock! New shelves, new deals, and absolutely no suspicious rearranging behind your back.';
    return true;
  }
  function licenseStock() {
    const rng = seeded('dandy-shop-license-' + stockKey());
    const pool = PLAYABLE_IDS.filter(id => heroAvailable(id) && id !== 'Dandy' && id !== 'Phantasia' && !BIG_WIG_HERO_IDS.has(id));
    return rng.pickN(pool, Math.min(ShopUpgrade.stockSlots(ShopUpgrade.level()), pool.length)).map((id, i) => {
      const o = obtainOf(id), amount = 4 + Math.min(6, o.rank * 2);
      const owned = Save.owns(id);
      const pitch = DANDY_LICENSE_LINES[id] || `${HEROES[id].name}! Now there's an interesting file!`;
      return { id:'license-' + id, name:HEROES[id].name + ' License', desc:`${amount} research toward recruiting or promoting ${HEROES[id].name}.`,
        img:Art.hero(id), cost:{ichor:2400 + o.rank * 1200}, hero:id, amount, limit:1,
        say:owned
          ? `${pitch} You've already got ${Save.hero(id).shards} extra research for them, too!`
          : `${pitch} Hmm... the file isn't complete yet. You've collected ${Save.pending(id)} research so far.` };
    });
  }

  function lethalShardStock() {
    const rng = seeded('dandy-shop-lethal-' + stockKey());
    const lethals = PLAYABLE_IDS.filter(id => obtainKey(id) === 'Lethal' && !BIG_WIG_HERO_IDS.has(id));
    return rng.pickN(lethals, Math.min(2, lethals.length)).map(id => ({
      id:'lethal-' + id, name:HEROES[id].name + ' Shards',
      desc:'Rare research from a dedicated Lethal file.', img:Art.hero(id),
      cost:{ichor:11000}, shardHero:id, amount:6, limit:1,
      say:`Ooh... ${HEROES[id].name}'s Lethal file. Careful with that! I don't like leaving it out for long.`
    }));
  }

  // Packs are the premium grind shortcut, so their Ichor price should feel
  // meaningfully heavier than buying a single resource or license. Keeping
  // the multiplier here preserves every pack family's relative value while
  // making the whole shelf an intentional late-run spend.
  const PACK_PRICE_MULTIPLIER = 2.5;
  function packCost(base, factor, currency) {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const counter = ShopUpgrade.level();
    return { [currency || 'ichor']: Math.max(1, Math.round(base * PACK_PRICE_MULTIPLIER * (factor || 1) * (1 + Math.min(1.25, mastery * .006) + counter * .004))) };
  }

  function rewardText(gain) {
    const labels = { ichor:'Ichor', exp:'EXP', tape:'Tape', notes:'Notes', star:'Star Dust', manual:'Manuals', core:'Cores', scrap:'Scrap', gear:'Gears', ticket:'Scratch Tickets', raidTicket:'Raid Tickets', gold:'Gold Crate', diamond:'Diamond Crate' };
    return Object.keys(gain || {}).filter(k => Number(gain[k]) > 0).map(k => `+${fmt(gain[k])} ${labels[k] || k}`).join(' · ');
  }

  function packRewardText(rewards) {
    return (rewards || []).map(reward => reward.kind === 'shards'
      ? `+${fmt(reward.amount)} ${HEROES[reward.id] ? HEROES[reward.id].name : reward.id} research`
      : rewardText({ [reward.key]: reward.amount })
    ).join(' · ');
  }

  function packShell(item) {
    item.isPack = true;
    item.daily = item.daily !== false;
    item.packType = item.packType || 'general';
    return item;
  }

  /* Four permanent character offers rotate with the real shop day. The pool
     deliberately uses heroAvailable() so collab visitors never leak into the
     regular shelf, and Delilah keeps her dedicated encounter path. */
  function dailyCharacterPackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const rng = seeded('dandy-pack-daily-characters-' + stockKey());
    const pool = PLAYABLE_IDS.filter(id => HEROES[id] && heroAvailable(id) && id !== 'Delilah' && !BIG_WIG_HERO_IDS.has(id));
    return rng.pickN(pool, Math.min(4, pool.length)).map((id, i) => {
      const hero = HEROES[id], obtain = obtainOf(id);
      const owned = Save.owns(id), stars = owned ? Save.hero(id).stars : 0;
      const shards = owned
        ? 26 + stars * 9 + obtain.rank * 5 + rng.i(0, 9)
        : 24 + obtain.rank * 8 + rng.i(0, 9);
      const gain = {
        exp: 1500 + mastery * 55 + obtain.rank * 360,
        star: 10 + obtain.rank * 6 + Math.floor(mastery / 14)
      };
      const ichorPack = i % 2 === 0;
      if (ichorPack) gain.ichor = 1800 + mastery * 45 + obtain.rank * 300;
      return packShell({
        id: 'pack-daily-character-' + id, name: hero.name + ' Character Pack',
        desc: `+${shards} ${hero.name} research · ${rewardText(gain)} · rotates daily.`,
        img: Art.hero(id), hero: id, amount: shards, gain,
        cost: ichorPack
          ? packCost(150 + obtain.rank * 18, 1 + i * .08, 'star')
          : packCost(6200 + obtain.rank * 2200, 1 + i * .08), limit: 1,
        packType: 'character-daily',
        say: `${hero.name} Character Pack! A daily file with guaranteed research and a little extra polish. It will be gone when today's counter turns over!`
      });
    });
  }

  /* Care Bears are collaboration visitors, so they stay out of the regular
     four-pack roll. Their three authored packs remain on a dedicated shop
     shelf and rotate purchases daily, like the other premium offers. */
  function careBearPackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const rng = seeded('dandy-pack-care-bears-' + stockKey());
    return Array.from(CARE_BEAR_HERO_IDS).filter(id => HEROES[id]).map((id, i) => {
      const hero = HEROES[id], owned = Save.owns(id), stars = owned ? Save.hero(id).stars : 0;
      const shards = owned ? 30 + stars * 10 + rng.i(0, 10) : 34 + rng.i(0, 12);
      const rewards = [
        { kind: 'shards', id, amount: shards },
        { kind: 'resource', key: 'star', amount: 24 + Math.floor(mastery / 12) },
        { kind: 'resource', key: 'exp', amount: 2200 + mastery * 70 },
        { kind: 'resource', key: 'raidTicket', amount: 1 }
      ];
      return packShell({
        id: 'pack-care-bear-' + id, name: hero.name + ' Care Pack', emoji: '🌈',
        desc: `${owned ? 'Promotion research' : 'Collab research'} · ${packRewardText(rewards)} · rotates daily.`,
        packRewards: rewards, cost: packCost(16800 + i * 1800, 1 + Math.min(1.1, mastery * .004)),
        limit: 1, packType: 'carebears', say: `${hero.name}'s Care Pack! A bright little bundle of research and supplies, restocked every day.`
      });
    });
  }

  function promotionPackStock() {
    const owned = Save.ownedIds().filter(id => HEROES[id]);
    if (!owned.length) return [];
    const team = (Save.data.team || []).filter(id => owned.includes(id));
    const rng = seeded('dandy-pack-promotions-' + stockKey());
    const rest = rng.shuffle(owned.filter(id => !team.includes(id)));
    const ids = team.concat(rest).slice(0, Math.min(8, owned.length));
    return ids.map((id, i) => {
      const hero = Save.hero(id), obtain = obtainOf(id);
      const shards = 28 + hero.stars * 12 + obtain.rank * 5 + rng.i(0, 12);
      const star = 12 + hero.stars * 5 + rng.i(0, 8);
      return packShell({
        id: 'pack-promotion-' + id, name: HEROES[id].name + ' Promotion Pack',
        desc: `+${shards} research · +${star} Star Dust · built for ${hero.stars}★ ${HEROES[id].name}.`,
        img: Art.hero(id), cost: packCost(7800 + obtain.rank * 1800 + hero.stars * 1100, 1 + i * .045),
        hero: id, amount: shards, gain: { star, raidTicket: 1 }, limit: 1, packType: 'promotion',
        say: `${HEROES[id].name}'s Promotion Pack! Research, star dust, and a suspicious amount of paperwork. A very efficient little bundle!`
      });
    });
  }

  function mainCharacterSelectPackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    if (packClaimed({ claimKey: 'main-character-select' })) return [];
    const ids = PLAYABLE_IDS.filter(id => HEROES[id] && obtainKey(id) === 'Main')
      .sort((a, b) => {
        const aOwned = Save.owns(a), bOwned = Save.owns(b);
        if (aOwned !== bOwned) return aOwned ? 1 : -1;
        const aProgress = aOwned ? Save.hero(a).shards : Save.pending(a);
        const bProgress = bOwned ? Save.hero(b).shards : Save.pending(b);
        return bProgress - aProgress;
      });
    if (!ids.length) return [];
    const item = packShell({
      id:'pack-main-select-crate', claimKey:'main-character-select', daily:false,
      name:'Main Character Select Crate',
      desc:'Choose one Main Character · one use only · guaranteed research.',
      emoji:'🌟', cost:packCost(24000), limit:1, packType:'main-select',
      selectMainCharacter:ids,
      mainSelectRewards(id) {
        const rng = seeded('dandy-pack-main-select-' + stockKey() + ':' + id);
        const owned = Save.owns(id), hero = Save.hero(id);
        const amount = owned ? 42 + hero.stars * 10 + rng.i(0, 14) : Save.unlockNeed(id);
        const gain = { star:44 + Math.floor(mastery / 4) + rng.i(0, 12), exp:2600 + mastery * 90, raidTicket: 1 };
        const rewards = [{ kind:'shards', id, amount }];
        Object.keys(gain).forEach(key => rewards.push({ kind:'resource', key, amount:gain[key] }));
        return rewards;
      },
      say:'The Main Character Select Crate! Pick one file and open it once. No mystery character, no rerolls, no second receipt.'
    });
    const preview = item.mainSelectRewards(ids[0]);
    item.desc = `Choose 1 of ${ids.length} Main Characters · ${packRewardText(preview)} · one use only.`;
    return [item];
  }

  function beginnerPackStock() {
    if (packClaimed({ claimKey: 'beginner' })) return [];
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const gain = { exp: 4200 + mastery * 160, tape: 36 + Math.floor(mastery / 3), notes: 28 + Math.floor(mastery / 4), star: 18 + Math.floor(mastery / 5), manual: 6 + Math.floor(mastery / 12), raidTicket: 1 };
    return [packShell({
      id: 'pack-beginner', claimKey: 'beginner', daily: false, name: 'Beginners Pack',
      desc: `${rewardText(gain)} · one generous first order for a growing roster.`,
      emoji: '🎒', cost: packCost(2600), gain, limit: 1, packType: 'beginner',
      say: "The Beginners Pack! A proper bundle for getting a new counter moving. One per account, because even I have to keep records sometimes."
    })];
  }

  function masteryMilestonePacks() {
    const current = Math.max(1, Math.floor(Save.data.mastery || 1));
    const total = 200, masteryCap = 800;
    // Spread 200 packs evenly across the full Mastery journey: pack #1 is
    // Mastery 4, pack #100 is Mastery 400, and pack #200 is Mastery 800.
    const firstRelevant = Math.min(total, Math.max(1, Math.floor((current - 1) / (masteryCap / total)) + 1));
    const visible = [];
    for (let milestone = firstRelevant; milestone <= total && visible.length < 3; milestone++) {
      if (packClaimed({ claimKey: 'mastery-' + milestone })) continue;
      visible.push(milestone);
    }
    return visible.map(milestone => {
      const requiredMastery = Math.ceil(milestone * masteryCap / total);
      const gain = {
        exp: 1800 + milestone * 310,
        tape: 8 + Math.floor(milestone / 5),
        notes: 6 + Math.floor(milestone / 7),
        star: 10 + Math.floor(milestone * .9),
        manual: 2 + Math.floor(milestone / 14)
      };
      if (milestone % 10 === 0) gain.core = 1 + Math.floor(milestone / 100);
      if (milestone % 5 === 0) gain.raidTicket = 1;
      if (milestone % 25 === 0) gain.gold = 1;
      if (milestone % 50 === 0) gain.diamond = 1;
      return packShell({
        id: 'pack-mastery-' + milestone, claimKey: 'mastery-' + milestone, daily: false,
        name: 'Mastery Milestone #' + milestone,
        desc: `${current < requiredMastery ? 'Unlocks at' : 'Unlocked at'} Mastery ${requiredMastery} · ${rewardText(gain)}.`,
        emoji: milestone % 50 === 0 ? '💎' : milestone % 10 === 0 ? '🏅' : '📜',
        cost: packCost(5200 + milestone * 240 + milestone * milestone * 14), gain,
        limit: 1, locked: current < requiredMastery, lockedLabel: 'LOCKED · MASTERY ' + requiredMastery,
        packType: 'milestone', milestone, say: `Mastery Milestone ${milestone}! It is a permanent shelf mark, so once you claim it, it stays claimed. Very tidy!`
      });
    });
  }

  function boosterPackStock() {
    const rng = seeded('dandy-pack-boosters-' + stockKey());
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const ichor = 14500 + mastery * 240;
    const options = [
      { key:'ichor', name:'Ichor Booster Pack', emoji:'🩸', gain:{ ichor: Math.round(ichor * 1.34), exp: 1800 + mastery * 90, raidTicket: 1 }, costCurrency:'star', costBase:500, desc:'A volatile refill that pays back Black Ichor for a Star Dust price.' },
      { key:'hero', name:'Hero Booster Pack', emoji:'🎭', gain:{ ichor: 3600 + mastery * 120, star: 24 + Math.floor(mastery / 4), exp: 2400 + mastery * 110, raidTicket: 1 }, costCurrency:'star', costBase:420, desc:'Ichor, Star Dust, and experience, plus a seeded Hero research drop.' },
      { key:'supply', name:'Supply Booster Pack', emoji:'🧰', gain:{ tape: 44 + Math.floor(mastery / 3), notes: 32 + Math.floor(mastery / 4), manual: 7 + Math.floor(mastery / 20), raidTicket: 1 }, desc:'A broad refill for the materials that make every run smoother.' }
    ];
    return options.map((option, i) => {
      const item = packShell({ id:'pack-booster-' + option.key, name:option.name, emoji:option.emoji,
        desc:option.desc + ' · ' + rewardText(option.gain),
        cost:option.costCurrency ? packCost(option.costBase, 1 + i * .08, option.costCurrency) : packCost(ichor, 1 + i * .08), gain:option.gain,
        limit:1, packType:'booster', say:`${option.name}! A little burst of progress for the grind. The numbers are different today, so don't wait too long!` });
      if (option.key === 'hero') {
        const pool = PLAYABLE_IDS.filter(id => HEROES[id] && heroAvailable(id));
        const id = rng.pick(pool.length ? pool : Save.ownedIds());
        item.hero = id; item.amount = 22 + rng.i(0, 14);
        item.desc = `${item.desc} · +${item.amount} ${HEROES[id] ? HEROES[id].name : id} research.`;
      }
      return item;
    });
  }

  function upgradePackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const options = [
      { id:'skill', name:'Skill Upgrade Pack', emoji:'📼', gain:{ tape:58 + Math.floor(mastery / 2), notes:46 + Math.floor(mastery / 3), raidTicket: 1 }, say:'Skill Upgrade Pack! Tape, notes, and plenty of reasons to stop leaving your skills at level one.' },
      { id:'promotion', name:'Promotion Upgrade Pack', emoji:'⭐', gain:{ star:72 + Math.floor(mastery / 2), core:2 + Math.floor(mastery / 80), manual:10 + Math.floor(mastery / 15), raidTicket: 1 }, say:'Promotion Upgrade Pack! Star dust, cores, and manuals. Your roster will be very pleased with this order.' },
      { id:'trinket', name:'Trinket Upgrade Pack', emoji:'⚙', gain:{ scrap:90 + mastery, core:1 + Math.floor(mastery / 100), diamond: mastery >= 50 ? 1 : 0, raidTicket: 1 }, say:'Trinket Upgrade Pack! Small parts, large ambitions, and absolutely no loose screws on my counter.' }
    ];
    return options.map((option, i) => packShell({
      id:'pack-upgrade-' + option.id, name:option.name, emoji:option.emoji,
      desc:rewardText(option.gain) + ' · tuned to Mastery ' + mastery + '.', cost:packCost(22000, 1 + i * .12),
      gain:option.gain, limit:1, packType:'upgrade', say:option.say
    }));
  }

  function friendshipPackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    const rng = seeded('dandy-shop-friendship-' + stockKey());
    const candidates = Object.values(CAMPAIGNS || {}).filter(c => c && HEROES[c.a] && HEROES[c.b]
      && Save.owns(c.a) && Save.owns(c.b) && !packClaimed({ claimKey: 'friendship-' + c.id }));
    const selected = candidates.map(c => {
      const done = Math.max(0, Math.min(c.stages.length, Save.campaignStage(c.id)));
      const complete = done >= c.stages.length;
      const priority = complete ? 3000 : done ? 2000 + done * 20 : 1000;
      return { c, done, complete, sort: priority + rng.i(0, 99) };
    }).sort((a, b) => b.sort - a.sort).slice(0, 6);

    return selected.map(({ c, done, complete }, i) => {
      // Pack pricing follows the pair's obtainment tier, not the campaign's
      // combat recommendation, which now rises through late-game chapters.
      const pairRanks = [obtainOf(c.a).rank, obtainOf(c.b).rank].sort((a, b) => b - a);
      const packTier = 45 + pairRanks[0] * 5 + pairRanks[1] * 2 + (pairRanks[0] >= OBTAIN.Collab.rank ? 8 : 0);
      const shardAmount = 20 + c.stages.length * 4 + Math.floor(mastery / 18);
      const rewards = [
        { kind: 'shards', id: c.a, amount: shardAmount },
        { kind: 'shards', id: c.b, amount: shardAmount },
        { kind: 'resource', key: 'tape', amount: 24 + c.stages.length * 3 },
        { kind: 'resource', key: 'notes', amount: 18 + c.stages.length * 2 },
        { kind: 'resource', key: 'star', amount: 12 + Math.floor(packTier / 12) },
        { kind: 'resource', key: 'raidTicket', amount: 1 }
      ];
      return packShell({
        id: 'pack-friendship-' + c.id, claimKey: 'friendship-' + c.id, daily: false,
        name: HEROES[c.a].name + ' + ' + HEROES[c.b].name + ' Friendship Pack',
        desc: `${done}/${c.stages.length} chapters cleared · ${complete ? 'CAMPAIGN CLEAR CONFIRMED' : 'COMPLETE CAMPAIGN TO UNLOCK'} · ${packRewardText(rewards)}`,
        emoji: '🤝', packRewards: rewards,
        cost: packCost(26000 + packTier * 360, 1 + i * .045), limit: 1, packType: 'friendship',
        locked: !complete, lockedLabel: 'LOCKED · COMPLETE ' + c.title.toUpperCase(),
        say: complete
          ? `${c.title} is complete! A Friendship Pack for ${HEROES[c.a].name} and ${HEROES[c.b].name}, with enough research to make the badge jealous.`
          : `The ${c.title} pack is still sealed. Clear every chapter of their Friendship Campaign first, then the reward shelf opens.`
      });
    });
  }

  const EVENT_PACK_DEFS = [
    { id:'kingdom-hearts', name:'Kingdom Hearts Pack', emoji:'🔑', eventId:'collab-door-opens', clearAnyStage:true, unlockRequirement:'CLEAR THE DOOR OPENS', boss:'The Door Opens', color:'#8598ff', heroes:['Sora','Riku','Kairi','Goofy'], base:88000,
      say:'The Kingdom Hearts seal! Sora, Riku, Kairi, and Goofy left a very expensive key-shaped receipt. At least the research is excellent.' },
    { id:'toons-universe', name:'Toons Universe Pack', emoji:'🌈', eventId:'phantasia-wishbound', clearAnyStage:true, unlockRequirement:'CLEAR A PHANTASIA STAGE', boss:'Phantasia Stage', color:'#d69bff', heroes:['Phantasia'], base:76000,
      say:'The Toons Universe Pack! Phantasia-grade stardust, star-gate supplies, and absolutely no guarantee that the gate will stay in one place.' },
    { id:'toontown-cogs', name:'Toontown Pack · Cogs', emoji:'⚙', eventId:'unknown-world', clearStage:5, boss:'Big Wig', color:'#8ee1e8', heroes:[], img:typeof UNKNOWN_WORLD_ART !== 'undefined' ? UNKNOWN_WORLD_ART.BigWig : undefined,
      specialHero:'BigWig', specialHeroStars:4, claimKey:'toontown-big-wig', base:108000,
      say:'The Toontown Cogs Pack! Clear Big Wig, then this one-time file stamps him into your roster at 4★ promotion.' }
  ];

  function eventPackUnlocked(def) {
    if (typeof Raid === 'undefined') return false;
    if (def.clearAnyStage) return !!(Raid.stageProgress && Raid.stageProgress(def.eventId) > 0);
    return !!(Raid.stageCleared && Raid.stageCleared(def.eventId, def.clearStage));
  }

  function eventPackStock() {
    const mastery = Math.max(1, Math.floor(Save.data.mastery || 1));
    return EVENT_PACK_DEFS.filter(def=>def.id!=='toons-universe').map(def => {
      if (def.claimKey && packClaimed({ claimKey: def.claimKey })) return null;
      const rng = seeded('dandy-pack-event-' + def.id + '-' + stockKey());
      const unlocked = eventPackUnlocked(def);
      const rewards = [];
      if (def.heroes.length) {
        // Kingdom Hearts is a party pack, not a random two-character roll:
        // every purchase should visibly include Sora, Riku, Kairi, and Goofy.
        const heroIds = def.id === 'kingdom-hearts'
          ? def.heroes.slice()
          : rng.pickN(def.heroes, Math.min(def.heroes.length, 1));
        heroIds.forEach(id => rewards.push({
          kind:'shards', id,
          amount: def.id === 'kingdom-hearts' ? 24 + rng.i(0, 12) : 72 + rng.i(0, 24)
        }));
      }
      const gain = def.id === 'kingdom-hearts'
        ? { star: 86 + Math.floor(mastery / 2), exp: 6200 + mastery * 180, core: 2 + Math.floor(mastery / 80), raidTicket: 2 }
        : def.id === 'toons-universe'
        ? { star: 74 + Math.floor(mastery / 2), exp: 5600 + mastery * 160, manual: 12 + Math.floor(mastery / 20), raidTicket: 2 }
        : { gear: 120 + mastery * 2, scrap: 120 + mastery, core: 3 + Math.floor(mastery / 70), manual: 14 + Math.floor(mastery / 18), raidTicket: 2 };
      Object.keys(gain).forEach(key => rewards.push({ kind:'resource', key, amount:gain[key] }));
      const requirement = def.unlockRequirement || 'WIN ' + def.boss.toUpperCase();
      const specialText = def.specialHero
        ? `${Save.owns(def.specialHero) ? 'PROMOTE' : 'UNLOCK'} ${HEROES[def.specialHero].name} at ${def.specialHeroStars}★`
        : '';
      const item = packShell({
        id:'pack-event-' + def.id, name:def.name, emoji:def.emoji, img:def.img, packType:'event', claimKey:def.claimKey,
        daily:def.claimKey ? false : true,
        desc:[unlocked ? 'EVENT CLEAR CONFIRMED' : requirement + ' TO UNLOCK', specialText, packRewardText(rewards)].filter(Boolean).join(' · '),
        packRewards:rewards, specialHero:def.specialHero, specialHeroStars:def.specialHeroStars,
        cost:packCost(def.base, 1 + Math.min(1.2, mastery * .004)), limit:1,
        glow:def.color, locked:!unlocked, lockedLabel:'LOCKED · ' + requirement,
        say:unlocked ? def.say : `That shelf is sealed. ${requirement.charAt(0) + requirement.slice(1).toLowerCase()} first, then I can sell you the proper pack.`
      });
      return item;
    }).filter(Boolean);
  }

  function packSections() {
    return [
      { eyebrow:'ACCOUNT STARTER', title:'Beginner Bundle', className:'beginner', items:beginnerPackStock() },
      { eyebrow:'ONE-TIME GUARANTEE', title:'Main Character Select Crate', className:'main-select', items:mainCharacterSelectPackStock() },
      { eyebrow:'DAILY CHARACTER ROTATION', title:'Character Packs', className:'character-daily', items:dailyCharacterPackStock() },
      { eyebrow:'YOUR ROSTER', title:'Promotion Packs', className:'promotion', items:promotionPackStock() },
      { eyebrow:'REPEATABLE DAILY STOCK', title:'Booster Packs', className:'booster', items:boosterPackStock() },
      { eyebrow:'REPEATABLE DAILY STOCK', title:'Upgrade Packs', className:'upgrade', items:upgradePackStock() },
      { eyebrow:'CARE BEARS COLLECTION', title:'Care Bears Packs', className:'carebears', items:careBearPackStock() },
      { eyebrow:'TEAM STORY REWARDS', title:'Friendship Packs', className:'friendship', items:friendshipPackStock() },
      { eyebrow:'200 PERMANENT UNLOCKS', title:'Mastery Milestones', className:'milestones', items:masteryMilestonePacks() },
      { eyebrow:'EVENT BOSS REWARDS', title:'World Packs', className:'world', items:eventPackStock() }
    ].filter(section => section.items.length);
  }

  function applyPackRewards(rewards) {
    const resourceGain = {};
    let result = 'done';
    (rewards || []).forEach(reward => {
      if (reward.kind === 'shards') {
        const outcome = Save.giveShards(reward.id, reward.amount);
        if (outcome === 'new') result = 'new';
      } else if (reward.kind === 'resource') {
        resourceGain[reward.key] = (resourceGain[reward.key] || 0) + reward.amount;
      }
    });
    if (Object.keys(resourceGain).length) Save.give(resourceGain, true, { exact: true });
    return result;
  }

  function trinketStock() {
    const preferred = ['alarm','fancypurse','machinemanual','researchmap','speedyshoes','thinkingcap','wrench'];
    const pool = preferred.concat(TRINKET_IDS.filter(id => !preferred.includes(id))).filter(id => TRINKETS[id] && !TRINKETS[id].eventOnly);
    const rng = seeded('dandy-shop-trinket-' + stockKey());
    return rng.pickN(pool, Math.min(ShopUpgrade.stockSlots(ShopUpgrade.level()), pool.length)).map((id, i) => {
      const t = TRINKETS[id];
      return { id:'trinket-' + id, name:t.name + (t.placeholder ? ' · WIP ART' : ''), desc:trinketStatText(t, 1) + ' · ' + t.effect,
        img:trinketIcon(id), cost:{ichor:1400 + i * 200}, trinket:id, limit:1,
        say:`The ${t.name}! It grants ${trinketStatText(t, 1)}... all from that tiny thing! Trinkets are funny like that.` };
    });
  }

  function stockFor(tab) {
    const level = ShopUpgrade.level();
    const stock = tab === 'resources' ? RESOURCE_STOCK.filter(item => level >= item.unlock).map(item => item.id === 'ticket' && Save.data.mastery >= 500 ? { ...item, cost: { ichor: Math.ceil(scratchRewardValue(70000, Save.data.mastery) / 8) } } : item).concat(level >= 85 ? lethalShardStock() : [])
      : tab === 'licenses' ? (level >= 70 ? licenseStock() : [])
      : tab === 'trinkets' && level >= 60 ? trinketStock()
      : tab === 'icons' ? PROFILE_ICON_STOCK : [];
    return stock.map(item => ShopUpgrade.stock(item));
  }

  function say(text, mood) {
    const box = $('#shopSpeech'), root = $('.shop-screen');
    if (!box || !root || !text) return;
    text = String(text); root._speechText = text;
    Screens._shopRig?.speak(mood);
    const measure = $('.shop-speech-measure',root); if (measure) measure.textContent = text;
    const announcement = $('#shopSpeechAnnouncement', root);
    clearInterval(Screens._shopTalkTimer);
    Screens._shopTalkTimer = null;
    root.classList.add('talking');
    if (announcement) announcement.textContent = text;
    box.textContent = '';
    const reduced = typeof Accessibility !== 'undefined' ? Accessibility.enabled() : document.documentElement.classList.contains('accessibility-reduced-effects');
    if (reduced) {
      box.textContent = text;
      root.classList.remove('talking');
      box.insertAdjacentHTML('beforeend', '<i class="shop-caret"></i>');
      return;
    }
    let at = 0;
    Screens._shopTalkTimer = setInterval(() => {
      if (!root.isConnected) { clearInterval(Screens._shopTalkTimer); Screens._shopTalkTimer = null; return; }
      box.textContent = text.slice(0, ++at);
      const ch = text[at - 1];
      if (ch && ch !== ' ' && at % 4 === 1) {
        const bright = /[!?.,]/.test(ch);
        Sound.play(bright ? 'dandy_text_bright' : 'dandy_text', {
          vol: bright ? .13 : .075,
          rate: root.dataset.keeper === 'dyle' ? (bright ? 1.25 : 1.1) : (bright ? 2.5 : 2.9),
          throttle: 45
        });
      }
      if (at >= text.length) {
        clearInterval(Screens._shopTalkTimer);
        Screens._shopTalkTimer = null;
        root.classList.remove('talking');
        box.insertAdjacentHTML('beforeend', '<i class="shop-caret"></i>');
      }
    }, 13);
  }

  function openMainCharacterSelect(item, card) {
    const ids = item.selectMainCharacter || [];
    if (!ids.length || packClaimed(item)) return;
    const body = el('div', 'main-character-select');
    body.innerHTML = `<div class="main-character-select-head">
      <span class="main-character-select-icon" aria-hidden="true">🌟</span>
      <small>ONE-TIME SELECTION</small>
      <h2>Choose your Main Character</h2>
      <p>This crate is used once. Select one file; the others stay available through normal progression.</p>
    </div><div class="main-character-select-grid" role="group" aria-label="Main Characters"></div>
    <div class="main-character-select-foot"><span class="main-character-select-status" role="status">Choose one character.</span><button type="button" class="main-character-select-confirm" disabled>OPEN CRATE</button></div>`;
    const grid = $('.main-character-select-grid', body);
    const status = $('.main-character-select-status', body);
    const confirm = $('.main-character-select-confirm', body);
    let selected = null;
    let committing = false;

    ids.forEach((id, index) => {
      const rewards = item.mainSelectRewards(id);
      const owned = Save.owns(id);
      const option = el('button', 'main-character-select-option');
      option.type = 'button';
      option.dataset.id = id;
      option.style.setProperty('--select-delay', index + 'ms');
      option.setAttribute('aria-pressed', 'false');
      option.setAttribute('aria-label', `${HEROES[id].name}. ${owned ? 'Owned, promotion research.' : 'Recruitment guaranteed.'}`);
      option.innerHTML = `<img src="${Art.hero(id)}" alt=""><b>${HEROES[id].name}</b><small>${owned ? 'OWNED · PROMOTION RESEARCH' : 'RECRUITMENT GUARANTEED'}</small><em>${packRewardText(rewards)}</em>`;
      option.onclick = () => {
        if (committing) return;
        selected = id;
        $$('.main-character-select-option', grid).forEach(other => {
          const active = other === option;
          other.classList.toggle('selected', active);
          other.setAttribute('aria-pressed', String(active));
        });
        status.textContent = `${HEROES[id].name} selected. This choice uses the crate once.`;
        confirm.disabled = false;
      };
      grid.appendChild(option);
    });

    confirm.onclick = () => {
      if (committing || !selected || packClaimed(item)) return;
      const cost = ShopUpgrade.price(item.cost);
      if (!Save.can(cost)) {
        UI.toast('Not enough Ichor');
        Sound.play('ui_err');
        return;
      }
      // The reward path closes the modal immediately. Lock the commit before
      // spending so a fast double tap cannot buy/open the one-time crate twice.
      committing = true;
      confirm.disabled = true;
      const rewards = item.mainSelectRewards(selected);
      Save.spend(cost);
      const result = applyPackRewards(rewards);
      markBought(item);
      Sound.play(result === 'new' ? 'get_rare' : 'currency');
      UI.refreshBar(true);
      UI.closeModal();
      card.classList.remove('shop-bought'); void card.offsetWidth; card.classList.add('shop-bought');
      const chosen = HEROES[selected].name;
      say(result === 'new'
        ? `${chosen} is joining the roster! The crate picked a file and I stamped it immediately.`
        : `${chosen} research secured! Your one-time crate has been opened and filed away.`);
      refreshAffordability();
    };

    UI.modal('🌟 Main Character Select Crate', body, { className:'main-character-select-modal', dismissOnBackdrop:true });
  }

  function unlockHeroAtStars(id, stars) {
    if (!HEROES[id]) return false;
    const target = Math.max(1, Math.min(5, Math.floor(Number(stars) || 1)));
    if (Save.owns(id)) {
      const hero = Save.hero(id);
      if (hero.stars < target) hero.stars = target;
      Save.write();
      return 'promoted';
    }
    const hero = Save.newHeroWithPending(id);
    hero.stars = target;
    Save.data.heroes[id] = hero;
    Save.addMasteryXp(260, true);
    Achievements.record('heroUnlock', 1);
    Save.write();
    if (UI.queueHeroUnlock) UI.queueHeroUnlock(id);
    return 'new';
  }

  function buy(item, card) {
    const tuIds=['Phantasia','Discard','Copper','Selena'];const tuTarget=item.visitorHero||item.hero||item.shardHero;if(item.id==='pack-event-toons-universe'||(tuIds.includes(tuTarget)&&!Save.owns(tuTarget))){UI.toast('Agent recruitment has moved to Toons Universe. Earn field requirements in the Evade expedition.');Sound.play('ui_err');return;}
    if (item.locked) {
      Sound.play('ui_err');
      say(item.say || item.lockedLabel || 'That pack is still sealed.');
      return;
    }
    if (!leftToday(item)) {
      Sound.play('ui_err');
      say(dandyLine([
        "Oh... that spot is empty! I could check the back, but I already did. Probably. Come back after the stock changes!",
        "Sold out! Golly, that went fast... Maybe everyone finally noticed my excellent selection!",
        "That was the last one! I counted twice... then forgot the number and counted again. Still gone!"
      ]));
      return;
    }
    const cost = ShopUpgrade.price(item.cost);
    if (!Save.can(cost)) {
      Sound.play('ui_err');
      card.classList.remove('shop-nope'); void card.offsetWidth; card.classList.add('shop-nope');
      say(dandyLine([
        "Oh! You're a little short... quite a bit short, actually. A few trips into the Depths should help!",
        "Hmm... I love the confidence, but the numbers aren't agreeing with you. Come back with a bit more!",
        "Wonderful choice! Tiny problem... you can't afford it yet. But I believe in you! And your wallet!"
      ]));
      return;
    }
    if (item.selectMainCharacter) {
      openMainCharacterSelect(item, card);
      return;
    }
    Save.spend(cost);
    let result = 'done';
    if (item.specialHero) result = unlockHeroAtStars(item.specialHero, item.specialHeroStars);
    if (item.packRewards) {
      const packResult = applyPackRewards(item.packRewards);
      if (packResult === 'new') result = 'new';
    } else if (!item.specialHero) {
      if (item.gain) Save.give(item.gain, true, { exact: true });
      if (item.hero) result = Save.giveShards(item.hero, item.amount);
      if (item.shardHero) result = Save.giveShards(item.shardHero, item.amount);
      if (item.visitorHero) {
        if (!Save.owns(item.visitorHero)) {
          Save.data.heroes[item.visitorHero] = Save.newHeroWithPending(item.visitorHero);
          Save.addMasteryXp(260, true);
          Achievements.record('heroUnlock', 1);
          Save.write(); result = 'new';
        } else { Save.giveShards(item.visitorHero, item.amount); result = 'shards'; }
      }
      if (item.trinket) result = Save.addTrinketCopy(item.trinket, item.trinketRank || 1);
      if (item.profileIcon) {
        Save.data.profile = Save.data.profile || {};
        Save.data.profile.iconUnlocks = Save.data.profile.iconUnlocks || [];
        if (!Save.data.profile.iconUnlocks.includes(item.profileIcon)) Save.data.profile.iconUnlocks.push(item.profileIcon);
        Save.write(); result = 'new';
      }
    }
    markBought(item);
    UI.toast(item.name + ' received');
    Sound.play(result === 'new' ? 'get_rare' : 'currency');
    UI.refreshBar(true);
    card.classList.remove('shop-bought'); void card.offsetWidth; card.classList.add('shop-bought');
    if ((item.hero || item.shardHero || item.visitorHero) && result === 'new') {
      const id = item.hero || item.shardHero || item.visitorHero;
      if (item.visitorHero) {
        UI.queueHeroUnlock(item.visitorHero);
        say("Phantasia is joining the roster! I still don't know where she came from, but she did leave peppermint on the counter.");
        refreshAffordability(); return;
      }
      say(`${DANDY_LICENSE_LINES[id] || `${HEROES[id].name}!`} There we go! The file is complete and they're ready for your roster!`);
    }
    else if (item.hero && !item.isPack) say(`More research for ${HEROES[item.hero].name}! You're getting quite a collection... of paperwork, I mean. Hehe!`);
    else if (item.shardHero) say(`More Lethal research for ${HEROES[item.shardHero].name}! Put it somewhere safe... somewhere away from my counter.`);
    else if (item.visitorHero) say('Regular Phantasia shards this time! She appeared, left these, asked where the peppermint was, and vanished into the wrong hallway.');
    else if (item.profileIcon) say(`${item.name} is now available in your profile icon picker! Very distinguished.`);
    else if (item.specialHero && result === 'new') say(`${HEROES[item.specialHero].name} is joining the roster at ${item.specialHeroStars}★! The Toontown clearance came with one very official promotion stamp.`);
    else if (item.specialHero) say(`${HEROES[item.specialHero].name} is already on your roster. The pack keeps its other rewards ready for you.`);
    else if (item.isPack) say(item.say || `${item.name} opened! ${item.desc.replace(/^.*?· /, '')}`);
    else if (item.trinket && result === 'new') say(`Your first ${item.name}! Ooh, shiny! Try it out and tell everyone where you got it.`);
    else if (item.trinket) say(`Another ${item.name}? You must really like it! Or maybe you forgot you had one... I've done that.`);
    else say(dandyLine([
      `${item.name}, all wrapped up! Hmm... I did a nice job on that one, didn't I?`,
      `Sold! Another perfectly successful trade at Dandy's Store! I do make this look easy.`,
      `${item.name}? Great choice! I was hoping you'd pick that one... it was taking up a lot of room.`
    ]));
    refreshAffordability();
    const root = $('.market'); if (root) applyShopSearch(root);
  }

  function refreshAffordability() {
    $$('.shop-item').forEach(card => {
      const item = Screens._shopItems && Screens._shopItems.find(x => x.id === card.dataset.item);
      const b = $('.shop-buy', card);
      if (item && b) {
        const locked = !!item.locked, sold = !locked && !leftToday(item);
        const cost = ShopUpgrade.price(item.cost);
        const canAfford = Save.can(cost);
        b.classList.toggle('cant', locked || sold || !Save.can(cost));
        b.disabled = locked || sold;
        b.setAttribute('aria-disabled', String(!locked && !sold && !canAfford));
        b.setAttribute('aria-label', locked ? `${item.name}: ${item.lockedLabel}` : sold ? `${item.name}: ${item.profileIcon && profileIconOwned(item) ? 'Unlocked' : item.claimKey ? 'Claimed' : 'Sold for today'}` : `Trade ${item.name} for ${costText(cost)}`);
        b.innerHTML = locked ? item.lockedLabel : sold ? (item.profileIcon && profileIconOwned(item) ? 'UNLOCKED' : item.claimKey ? 'CLAIMED' : 'SOLD FOR TODAY') : `TRADE · ${resLabel(cost)}`;
        card.classList.toggle('sold', sold);
        card.classList.toggle('pack-locked', locked);
        const stock = $('.shop-item-stock',card);
        if (stock) stock.textContent = locked ? 'Requirement not met' : item.unlimited ? 'Always available' : item.claimKey ? (packClaimed(item) ? 'Claimed' : 'One-time pack') : leftToday(item) + ' left today';
      }
    });
  }

  function makeItem(item) {
    const locked = !!item.locked, sold = !locked && !leftToday(item);
    const card = el('article', 'shop-item' + (item.daily === false ? '' : ' new') + (item.isPack ? ' shop-pack pack-' + item.packType : '') + (sold ? ' sold' : '') + (locked ? ' pack-locked' : '')); card.dataset.item = item.id;
    if (item.glow) card.style.setProperty('--item-glow', item.glow);
    const art = item.img
      ? `<img src="${item.img}" alt="" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'shop-item-emoji',textContent:'${item.emoji || '◆'}'}))">`
      : `<div class="shop-item-emoji">${item.emoji || '◆'}</div>`;
    const cost = ShopUpgrade.price(item.cost);
    const soldLabel = locked ? item.lockedLabel : item.profileIcon && profileIconOwned(item) ? 'UNLOCKED' : item.claimKey ? 'CLAIMED' : 'SOLD FOR TODAY';
    const nameId = 'shop-item-name-' + item.id.replace(/[^a-z0-9_-]/gi, '-');
    const descId = 'shop-item-desc-' + item.id.replace(/[^a-z0-9_-]/gi, '-');
    const canAfford = Save.can(cost);
    const actionLabel = locked ? `${item.name}: ${item.lockedLabel}` : sold ? `${item.name}: ${soldLabel}` : `Trade ${item.name} for ${costText(cost)}`;
    card.setAttribute('aria-labelledby', nameId);
    card.innerHTML = `<div class="shop-item-art" aria-hidden="true">${art}</div><div class="shop-item-copy">
      <h3 class="shop-item-name" id="${nameId}">${item.name}</h3><p class="shop-item-desc" id="${descId}">${item.desc}</p><small class="shop-item-stock">${locked ? 'Requirement not met' : item.unlimited ? 'Always available' : item.claimKey ? 'One-time pack' : leftToday(item) + ' left today'}</small>
      <button type="button" class="shop-buy${!locked && !sold && canAfford ? '' : ' cant'}" ${locked || sold ? 'disabled' : ''} aria-disabled="${!locked && !sold && !canAfford}" aria-label="${actionLabel}" aria-describedby="${descId}">${locked || sold ? soldLabel : `TRADE · ${resLabel(cost)}`}</button></div>`;
    card.setAttribute('role', 'listitem');
    card.dataset.search = (item.name + ' ' + item.desc).toLowerCase();
    card.onclick = e => { if (!e.target.closest('.shop-buy')) say(item.say); };
    $('.shop-buy', card).onclick = e => { e.stopPropagation(); buy(item, card); };
    return card;
  }

  function startRotationClock() {
    Screens.liveClocks([{ selector: '#shopRotation', kind: 'day' }]);
  }

  function renderPackShop(contents, root) {
    const sections = packSections();
    const selected = sections.find(s=>s.className === Screens.shopPackGroup) || sections.find(s=>s.className === 'character-daily') || sections[0];
    if (!selected) { contents.appendChild(el('div','shop-empty','No packs are available yet.')); return; }
    Screens.shopPackGroup = selected.className;
    Screens._shopItems = selected.items;
    const chooser = el('label','market-pack-chooser');
    chooser.innerHTML = '<span>Pack collection</span><select aria-label="Pack collection">'+sections.map(section=>`<option value="${section.className}" ${section === selected ? 'selected' : ''}>${section.title} (${section.items.length})</option>`).join('')+'</select>';
    contents.appendChild(chooser);
    $('select',chooser).onchange = e => { Screens.shopPackGroup=e.target.value;Screens.shopPackPage=0;clear(contents);renderPackShop(contents,root);applyShopSearch(root); };
    const query = ($('#marketSearch',root)?.value || '').toLowerCase().trim();
    const filter = $('#marketFilter',root)?.value || 'all';
    const items = selected.items.filter(item=>(item.name+' '+item.desc).toLowerCase().includes(query) && (filter === 'all' || !item.locked && leftToday(item)>0 && (filter !== 'affordable' || Save.can(ShopUpgrade.price(item.cost)))));
    const pageCount = Math.max(1,Math.ceil(items.length/12));
    const page = Math.min(Math.max(0,Screens.shopPackPage||0),pageCount-1); Screens.shopPackPage=page;
    const grid = el('div','shop-grid shop-pack-grid'); grid.setAttribute('role','list');
    items.slice(page*12,(page+1)*12).forEach(item=>grid.appendChild(makeItem(item)));
    contents.appendChild(grid);
    if (!items.length) contents.appendChild(el('p','shop-empty','No packs match this search and filter.'));
    if (pageCount>1) {
      const pager=el('nav','market-pagination');pager.setAttribute('aria-label','Pack pages');
      pager.innerHTML=`<button ${page===0?'disabled':''} aria-label="Previous pack page">‹ Previous</button><span>${page+1} / ${pageCount}</span><button ${page===pageCount-1?'disabled':''} aria-label="Next pack page">Next ›</button>`;
      contents.appendChild(pager);
      $$('button',pager).forEach((b,i)=>b.onclick=()=>{Screens.shopPackPage=page+(i?1:-1);clear(contents);renderPackShop(contents,root);applyShopSearch(root);$('.market-pack-chooser',root)?.scrollIntoView({block:'nearest'});});
    }
  }

  function renderGossipFeature(id, root) {
    const feature = $('#gossipFeature', root); if (!feature || !Save.owns(id)) return;
    const h = Save.hero(id), loreOpen = h.stars >= 2;
    feature.innerHTML = `<img src="${toonPortrait(id)}" alt=""><div class="gossip-feature-copy"><small>DANDY'S NOTES ON</small><b>${toonName(id)}</b><span>${heroRole(HEROES[id].role)} · ${HEROES[id].element} · ${'★'.repeat(h.stars)}</span>
      <div class="gossip-actions"><button data-gossip-mode="rumor">RUMOR</button><button data-gossip-mode="lore" ${loreOpen ? '' : 'disabled'}>${loreOpen ? '2★ LORE' : '🔒 2★ LORE'}</button></div></div>`;
    $('[data-gossip-mode="rumor"]', feature).onclick = () => showToonGossip(id, root, false);
    const lore = $('[data-gossip-mode="lore"]', feature);
    if (loreOpen) lore.onclick = () => showToonGossip(id, root, true);
  }

  function showToonGossip(id, root, deep) {
    if (!Save.owns(id)) return;
    const h = Save.hero(id);
    if (deep && h.stars < 2) return;
    const line = deep ? TOON_LORE[id] : TOON_GOSSIP[id];
    Screens.shopGossipToon = id;
    $$('.gossip-toon', root).forEach(b => b.classList.toggle('selected', b.dataset.toon === id));
    renderGossipFeature(id, root);
    $$('.gossip-actions button', root).forEach(b => b.classList.toggle('active', b.dataset.gossipMode === (deep ? 'lore' : 'rumor')));
    Save.data.seen = Save.data.seen || {};
    Save.data.seen.gossipToons = Save.data.seen.gossipToons || [];
    const heardKey = id + (deep ? ':lore' : ':rumor');
    if (!Save.data.seen.gossipToons.includes(heardKey)) { Save.data.seen.gossipToons.push(heardKey); Save.write(); }
    const toonCard = $(`[data-toon="${id}"]`,root);
    if (toonCard) toonCard.dataset.unread = String(!Save.data.seen.gossipToons.includes(id + ':rumor') || h.stars >= 2 && !Save.data.seen.gossipToons.includes(id + ':lore'));
    Sound.play('ui_ok');
    say(line); revealShopDialogue(root); applyShopSearch(root);
  }

  function applyShopSearch(root) {
    $('[data-shop-tab="skins"]',root)?.classList.toggle('reward-ready',typeof DyleShop !== 'undefined' && DyleShop.ready() && !DyleShop.hasSkin());
    const query = ($('#marketSearch',root)?.value || '').trim().toLowerCase();
    const filter = $('#marketFilter',root)?.value || 'all';
    const cards = $$('.shop-item, .gossip-case-card, .gossip-toon, .dyle-gossip-card',root);
    let count = 0;
    cards.forEach(card => {
      const item = card.dataset.item && Screens._shopItems?.find(i => i.id === card.dataset.item);
      const available = item ? !item.locked && leftToday(item)>0 : card.dataset.available ? card.dataset.available === 'true' : !card.classList.contains('locked');
      const unread = card.dataset.unread ? card.dataset.unread === 'true' : available && !card.classList.contains('read');
      const matches = (card.dataset.search || card.textContent).toLowerCase().includes(query)
        && (filter === 'all' || filter === 'available' && available || filter === 'unread' && unread || filter === 'affordable' && available && item && Save.can(ShopUpgrade.price(item.cost)));
      card.hidden = !matches;
      if (matches) count++;
    });
    const result = $('.market-results',root);
    if (result) result.textContent = cards.length ? `${count} shown` : '';
    const empty = $('.market-search-empty',root);
    if (empty) empty.hidden = !cards.length || count > 0;
  }

  function revealShopDialogue(root) {
    const stage = $('.market-stage',root), screen = $('#screen');
    if (stage && screen && stage.getBoundingClientRect().top < screen.getBoundingClientRect().top)
      stage.scrollIntoView({block:'start',behavior:Accessibility.enabled() ? 'auto' : 'smooth'});
  }

  function finishSpeech() {
    clearInterval(Screens._shopTalkTimer); Screens._shopTalkTimer = null;
    const root = $('.shop-screen'); if (!root) return;
    root.classList.remove('talking');
    const box = $('#shopSpeech',root);
    if (box) {
      box.textContent = root._speechText || '';
      box.insertAdjacentHTML('beforeend', '<i class="shop-caret"></i>');
    }
  }

  function renderUpgrade(root) {
    const level = ShopUpgrade.level(), nextTape = ShopUpgrade.tapeCost(level), next = ShopUpgrade.nextUnlock(level);
    const details = el('details','market-upgrade');
    if (Screens._shopUpgradeOpen) details.open = true;
    details.ontoggle = () => { Screens._shopUpgradeOpen = details.open; };
    details.innerHTML = `<summary><span>✦ Counter level <b>${level}</b><small> / ${ShopUpgrade.MAX}</small></span><span>${level === ShopUpgrade.MAX ? 'Benefits' : 'Upgrade'} <i>⌄</i></span></summary><div class="market-upgrade-body"><p>${ShopUpgrade.summary(level)}</p><div class="market-level-bar"><i style="width:${level}%"></i></div>${next ? `<p>Next shelf: <b>${next.label}</b> at level ${next.level}.</p>` : ''}<button class="shop-upgrade-btn" ${level >= ShopUpgrade.MAX ? 'disabled' : ''}>${level >= ShopUpgrade.MAX ? 'Counter fully upgraded' : `Upgrade · 📼 ${fmt(nextTape)}`}</button><small>You have ${fmt(Save.res('tape'))} Field Tape</small></div>`;
    $('.shop-upgrade-btn',details).onclick = () => {
      if (ShopUpgrade.upgrade()) {
        Sound.play('get_rare'); UI.refreshBar(true);
        Screens._shopNextLine = `Counter level ${ShopUpgrade.level()}! A little more room, a little more shine. Have a look at what is on the shelves now!`;
        Screens.render();
      } else if (level < ShopUpgrade.MAX) { Sound.play('ui_err'); say(`I need ${fmt(nextTape)} Field Tape for the next upgrade. You have ${fmt(Save.res('tape'))} so far.`, 'concerned'); }
    };
    $('.market-stock',root).prepend(details);
  }

  Screens.shop = function (s) {
    this._shopRig?.destroy(); this._shopRig = null;
    clearInterval(this._shopTalkTimer); clearTimeout(this._shopStartTimer); clearTimeout(this._shopEntranceTimer);
    shopState();
    const dyle = this.shopKeeper === 'dyle';
    const tabs = dyle ? [['skins','◇','Skins'],['stickers','✿','Stickers'],['radio','♫','Radio'],['gossip','☏','Gossip']] : [['resources','◈','Supplies'],['licenses','♡','Toons'],['packs','▣','Packs'],['trinkets','✧','Trinkets'],['icons','◉','Icons'],['gossip','☏','Gossip']];
    const remembered = dyle ? this.dyleShopTab : this.shopTab;
    const tab = tabs.some(t=>t[0] === remembered) ? remembered : tabs[0][0];
    if (dyle) this.dyleShopTab = tab; else this.shopTab = tab;
    const entering = !this._shopInStore; this._shopInStore = true;
    const isGossip = tab === 'gossip', isSkin = dyle && tab === 'skins', isRadio = dyle && tab === 'radio', isSticker = dyle && tab === 'stickers';
    const root = el('div',`shop-screen market${dyle ? ' market-dyle' : ' market-dandy'}`);
    root.dataset.keeper = dyle ? 'dyle' : 'dandy';
    root.innerHTML = `<header class="market-header"><button class="market-back" aria-label="Back to Home">‹</button><h1>Gardenview shops</h1><span class="market-open"><i></i> OPEN</span></header>
      <nav class="market-keepers" aria-label="Choose shopkeeper"><button data-keeper="dandy" class="${dyle ? '' : 'selected'}" aria-pressed="${!dyle}"><img src="Characters/Dandy/Dandy.png" alt=""><span><b>Dandy’s</b><small>Supplies & curios</small></span><i>✦</i></button><button data-keeper="dyle" class="${dyle ? 'selected' : ''}" aria-pressed="${dyle}"><img src="Characters/Dyle/Dyle.png" alt=""><span><b>Dyle’s</b><small>Skins & sounds</small></span><i>◷</i>${DyleShop.ready() && !DyleShop.hasSkin() ? '<em aria-label="Skin ready to claim"></em>' : ''}</button></nav>
      <section class="market-stage" aria-label="${dyle ? 'Dyle' : 'Dandy'} at the counter"><div class="market-keeper" role="img" aria-label="${dyle ? 'Animated Dyle' : 'Dandy'}"></div><div class="market-counter" aria-hidden="true"></div><div class="market-dialogue"><div class="market-speaker">${dyle ? 'DYLE' : 'DANDY'}<button class="market-finish" aria-label="Show the complete dialogue" title="Show complete dialogue">››</button></div><div class="market-speech-wrap"><div class="shop-speech-measure" aria-hidden="true"></div><div class="shop-speech" id="shopSpeech" aria-hidden="true"></div></div><span class="sr-only" id="shopSpeechAnnouncement" aria-live="polite" aria-atomic="true"></span></div></section>
      <a class="shop-skip-link" href="#shopContents">Skip to shop contents</a>
      <nav class="market-departments" role="tablist" aria-label="${dyle ? 'Dyle' : 'Dandy'}’s departments">${tabs.map(([key,icon,label])=>`<button role="tab" id="shop-tab-${key}" aria-selected="${key === tab}" aria-controls="shopContents" data-shop-tab="${key}" class="${tab === key ? 'on' : ''}"><i aria-hidden="true">${icon}</i><span>${label}</span></button>`).join('')}</nav>
      <section class="market-stock"><div class="market-stock-heading"><h2>${isGossip ? dyle ? 'Off the record' : 'Between us' : isSkin ? 'The wardrobe' : isRadio ? 'The radio' : isSticker ? 'The sticker board' : tabs.find(t=>t[0] === tab)[2]}</h2>${!dyle && !isGossip ? '<span class="market-reset">Restocks in <b id="shopRotation">—</b></span>' : '<span class="market-heading-note">'+(isSkin ? 'A gift from Dyle' : isSticker ? 'For your profile book' : isRadio ? 'Permanent tracks' : 'Choose a conversation')+'</span>'}</div>
      ${!isSkin && !isRadio && !isSticker ? `<div class="market-search-row"><label class="market-search"><span aria-hidden="true">⌕</span><input type="search" id="marketSearch" placeholder="${isGossip ? 'Search gossip…' : 'Find '+(tab === 'licenses' ? 'a Toon' : 'stock')+'…'}" aria-label="Search ${isGossip ? 'gossip' : 'shop stock'}"></label><select id="marketFilter" aria-label="Filter ${isGossip ? 'gossip' : 'stock'}"><option value="all">All ${isGossip ? 'files' : 'stock'}</option><option value="available">Available</option><option value="${isGossip ? 'unread' : 'affordable'}">${isGossip ? 'Unheard' : 'Can afford'}</option></select></div>` : ''}
      <div class="market-tools">${!isSkin && !isRadio && !isSticker ? '<span class="market-results" aria-live="polite"></span>' : ''}${!dyle && !isGossip ? `<button class="market-refresh" id="shopRefresh" aria-label="Refresh stock for one Counter Token">↻ Refresh <b>🔄 1</b><small>${fmt(Save.res('counterToken'))} owned</small></button>` : ''}</div>
      <div id="shopContents" role="tabpanel" aria-labelledby="shop-tab-${tab}" tabindex="-1"></div><div class="market-search-empty" hidden>No matches. Try another search or filter.</div></section>`;
    s.appendChild(root);
    this._shopRig = ShopKeepers.mount($('.market-keeper',root),dyle ? 'dyle' : 'dandy',root);
    $('.market-back',root).onclick = () => { Sound.play('ui_back'); Screens.go('home'); };
    $('.market-finish',root).onclick = finishSpeech;
    $$('[data-keeper]',root).forEach(button => button.onclick = () => {
      this.shopKeeper = button.dataset.keeper; this.shopQuery = ''; this.shopFilter = 'all'; this._shopFocusKeeper = button.dataset.keeper;
      Sound.play('ui_move'); this.render();
    });
    const buttons = $$('[data-shop-tab]',root);
    buttons.forEach((b,index) => {
      b.tabIndex = b.dataset.shopTab === tab ? 0 : -1;
      b.onclick = () => {
        if (dyle) this.dyleShopTab = b.dataset.shopTab; else this.shopTab = b.dataset.shopTab;
        this.shopQuery = ''; this.shopFilter = 'all'; this.shopPackPage = 0;
        this._shopFocusTab = b.dataset.shopTab; Sound.play('ui_move'); this.render();
      };
      b.onkeydown = e => {
        if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        e.preventDefault();
        const idx = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length-1 : (index+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+buttons.length)%buttons.length;
        buttons[idx].click();
      };
    });
    if (this._shopFocusKeeper) { const target = this._shopFocusKeeper; this._shopFocusKeeper = null; requestAnimationFrame(()=> $(`[data-keeper="${target}"]`,root)?.focus({preventScroll:true})); }
    else if (this._shopFocusTab) { const target = this._shopFocusTab; this._shopFocusTab = null; requestAnimationFrame(()=> $(`[data-shop-tab="${target}"]`,root)?.focus({preventScroll:true})); }
    const contents = $('#shopContents',root);
    const api = { say:(text,mood)=>{say(text,mood);revealShopDialogue(root);}, filter:() => applyShopSearch(root) };
    if (!dyle && !isGossip) renderUpgrade(root);
    const search = $('#marketSearch',root), filter = $('#marketFilter',root);
    if (search) search.value = this.shopQuery || '';
    if (filter) { filter.value = this.shopFilter || 'all'; if (!filter.value) filter.value = 'all'; }
    const refreshSearch = () => {
      this.shopQuery = search?.value || ''; this.shopFilter = filter?.value || 'all';
      if (!dyle && tab === 'packs') { this.shopPackPage = 0; clear(contents); renderPackShop.call(this,contents,root); }
      applyShopSearch(root);
    };
    if (search) search.oninput = refreshSearch;
    if (filter) filter.onchange = refreshSearch;
    if (dyle) {
      this._shopItems = [];
      if (isSkin) DyleShop.renderSkins(contents,root,api);
      else if (isSticker) DyleShop.renderStickers(contents,root,api);
      else if (isRadio) DyleShop.renderRadio(contents,root,api);
      else DyleShop.renderGossip(contents,root,api);
    } else if (isGossip) {
      this._shopItems = [];
      const view = this.shopGossipView || 'threads', board = el('div','gossip-board');
      board.innerHTML = `<div class="gossip-view-tabs"><button class="${view === 'threads' ? 'selected' : ''}" data-gossip-view="threads">Case files</button><button class="${view === 'toons' ? 'selected' : ''}" data-gossip-view="toons">Toon notes</button></div><div id="gossipThreadArea"></div>`;
      contents.appendChild(board);
      $$('[data-gossip-view]',board).forEach(b=>b.onclick=()=>{this.shopGossipView=b.dataset.gossipView;this.shopQuery='';this.shopGossipCase=null;Sound.play('ui_move');this.render();});
      if (view === 'threads') renderGossipThreads(root); else renderGossipToonFiles(root);
    } else if (tab === 'packs') renderPackShop.call(this,contents,root);
    else {
      this._shopItems = stockFor(tab);
      if (this._shopItems.length) {
        const grid = el('div','shop-grid'); grid.setAttribute('role','list');
        this._shopItems.forEach(item=>grid.appendChild(makeItem(item))); contents.appendChild(grid);
      } else {
        const needed = tab === 'trinkets' ? 60 : 70;
        contents.innerHTML = `<div class="market-locked-department"><i>⌑</i><h3>${tab === 'trinkets' ? 'Trinkets' : 'Toon licenses'} unlock at counter level ${needed}</h3><p>Your counter is level ${ShopUpgrade.level()}. Upgrade it to open this shelf.</p><button class="market-primary">View counter upgrades</button></div>`;
        $('.market-primary',contents).onclick=()=>{const details=$('.market-upgrade',root);details.open=true;details.scrollIntoView({block:'nearest',behavior:'smooth'});};
      }
    }
    if (!dyle && !isGossip) {
      $('#shopRefresh',root).onclick=()=>{if(refreshShop())this.render();};
      startRotationClock();
    }
    applyShopSearch(root);
    const line = this._shopNextLine || (dyle ? isSkin ? 'Hello! Take your time to browse. There is a caramel apron here with Sprout’s name on it… once we have had a proper chat.' : isRadio ? 'A pair of records arrived for the radio. Choose the one you would like to keep.' : 'You know… if you REALLY think about it, everyone leaves a little story behind. Which one caught your attention?' : dandyLine(TAB_LINES[tab]));
    const mood = this._shopNextMood; this._shopNextLine = null; this._shopNextMood = null;
    say(line,mood);
    if (entering && !dyle) Sound.play('dandy_entrance',{vol:.4,rate:1.15});
    this._shopVisited = true;
  };
})();
