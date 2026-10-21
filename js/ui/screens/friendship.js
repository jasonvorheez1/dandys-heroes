/* screens/friendship.js - illustrated Friendship Campaign hub + stage launcher.
   Extends Screens (screens/core.js). */
'use strict';

/* Every duo gets a distinct first hello. Keep these introductions short, but
   let the pair's habits and friction establish the relationship immediately.
   A generic greeting here reads like placeholder copy, so every current
   campaign is covered explicitly. */
const FRIENDSHIP_GREETING_LINES = {
  toodles_shelly: [
    { who: 'Narrator', text: 'Shelly studies a fossil by the elevator. Toodles reaches for it.' },
    { who: 'Shelly', text: 'Wait, I have not finished recording the tracks.' },
    { who: 'Toodles', text: 'It is a rock, Shelly. How many notes does it need?' },
    { who: 'Vee', text: 'More than your last lucky guess did.' },
    { who: 'Toodles', text: 'Nobody asked for the replay, Vee.' },
    { who: 'Shelly', text: 'Then let me finish this one.' }
  ],
  shelly_ribecca: [
    { who: 'Narrator', text: 'Ribecca quietly measures a strip of fabric beside Shelly.' },
    { who: 'CheerbearShelly', text: 'Is that for me?' },
    { who: 'Ribecca', text: 'It could be.' },
    { who: 'CheerbearShelly', text: 'That sounds like a yes.' },
    { who: 'Ribecca', text: 'It sounds like you should stand still.' },
    { who: 'CheerbearShelly', text: 'I can do that!' },
    { who: 'Narrator', text: 'Shelly immediately starts swaying.' },
    { who: 'Ribecca', text: 'We will work on it.' }
  ],
  cocoa_rudie: [
    { who: 'Narrator', text: 'Cocoa finds Rudie checking the same supply bag for the third time.' },
    { who: 'Cocoa', text: 'You know, looking at it will not make more supplies appear.' },
    { who: 'Rudie', text: 'I am making sure we still have some.' },
    { who: 'Cocoa', text: 'Then you should come with me.' },
    { who: 'Rudie', text: 'That sounds like a plan.' },
    { who: 'Cocoa', text: 'It is a plan! We are going to help people.' },
    { who: 'Rudie', text: 'And save something for ourselves?' },
    { who: 'Cocoa', text: 'We will see.' }
  ],
  brusha_tisha: [
    { who: 'Narrator', text: 'Tisha finds Brusha painting a bright line across the hallway.' },
    { who: 'Tisha', text: 'That is not where the line goes.' },
    { who: 'Brusha', text: 'It goes where the color goes.' },
    { who: 'Tisha', text: 'That is not how maps work.' },
    { who: 'Brusha', text: 'Then we will make a better map.' },
    { who: 'Tisha', text: 'You are going to help?' },
    { who: 'Brusha', text: 'Obviously. Someone has to make it pretty.' }
  ],
  tisha_blot: [
    { who: 'Narrator', text: 'Tisha finds Blot sitting beside a cart with one squeaky wheel.' },
    { who: 'Tisha', text: 'You fixed it.' },
    { who: 'Blot', text: '.ti delruoW' },
    { who: 'Tisha', text: 'That is not the same thing.' },
    { who: 'Blot', text: '.gnikoow s\'tI' },
    { who: 'Tisha', text: '...Good enough.' },
    { who: 'Blot', text: '.hO' }
  ],
  shelly_vee: [
    { who: 'Narrator', text: 'Shelly is labeling a fossil fragment when Vee steps into the light.' },
    { who: 'Vee', text: 'You wrote three possibilities for one rock.' },
    { who: 'Shelly', text: 'Four, actually! The fourth one is very exciting.' },
    { who: 'Vee', text: 'You sound excited about all of them.' },
    { who: 'Shelly', text: "That's because you're here to help me test them." },
    { who: 'Vee', text: "I didn't agree to that." },
    { who: 'Shelly', text: 'You stayed.' }
  ],
  poppy_boxten: [
    { who: 'Narrator', text: 'A soft melody slips through the hallway. Poppy follows it to Boxten.' },
    { who: 'Poppy', text: 'Your key is turning.' },
    { who: 'Boxten', text: 'It does that.' },
    { who: 'Poppy', text: 'I know. It sounds nice.' },
    { who: 'Boxten', text: 'You can hear it over everything?' },
    { who: 'Poppy', text: 'I was listening for it.' },
    { who: 'Boxten', text: '...Oh.' }
  ],
  dyle_shrimpo: [
    { who: 'Narrator', text: 'Dyle stops beside the elevator. Shrimpo is already yelling at it.' },
    { who: 'Dyle', text: 'Stand clear. I am departing.' },
    { who: 'Shrimpo', text: "I'M NOT STANDING ANYWHERE!" },
    { who: 'Dyle', text: 'Then you are obstructing the platform.' },
    { who: 'Shrimpo', text: 'I AM THE PLATFORM!' },
    { who: 'Dyle', text: 'That is not how platforms work.' },
    { who: 'Shrimpo', text: 'I HATE TRAINS IN ADVANCE!' }
  ],
  poppy_toodles: [
    { who: 'Narrator', text: 'Poppy searches under a bench while Toodles studies the trail beside it.' },
    { who: 'Toodles', text: 'You lost something.' },
    { who: 'Poppy', text: 'My ribbon. It was right here!' },
    { who: 'Toodles', text: 'Then we start with where you last saw it.' },
    { who: 'Poppy', text: 'You make finding things sound so easy!' },
    { who: 'Toodles', text: 'It is easier when you stop searching everywhere.' },
    { who: 'Poppy', text: "I'll try! No promises." }
  ],
  squirm_cocoa: [
    { who: 'Narrator', text: 'Cocoa opens a tin of BonBons. Squirm peeks over the edge.' },
    { who: 'Squirm', text: 'I-is that a snack?' },
    { who: 'Cocoa', text: 'It is! I made extras.' },
    { who: 'Squirm', text: 'Why?' },
    { who: 'Cocoa', text: 'Because you looked hungry.' },
    { who: 'Squirm', text: 'I always look hungry when I am nervous.' },
    { who: 'Cocoa', text: "Then I'll keep extras." },
    { who: 'Squirm', text: "That's... a lot of pressure." }
  ],
  bassie_shelly: [
    { who: 'Narrator', text: 'Bassie spots Shelly trying to carry three supplies and a notebook at once.' },
    { who: 'Bassie', text: 'You know, a basket is allowed to hold things for you.' },
    { who: 'Shelly', text: 'I have a system.' },
    { who: 'Bassie', text: 'Your system is dropping a snack every six steps.' },
    { who: 'Shelly', text: 'That is why good company brings backup snacks.' },
    { who: 'Bassie', text: 'I brought enough for everyone!' },
    { who: 'Shelly', text: 'I knew I liked your system.' }
  ],
  finn_shelly: [
    { who: 'Narrator', text: 'Shelly holds a fossil up to the light while Finn studies the markings.' },
    { who: 'Shelly', text: 'It has to mean something.' },
    { who: 'Finn', text: 'Everything means something. The trick is finding the right question.' },
    { who: 'Shelly', text: 'Good. I brought someone who likes questions.' },
    { who: 'Finn', text: 'And I brought someone who notices the answers.' }
  ],
  eclipse_pebble: [
    { who: 'Narrator', text: 'Eclipse follows a pawprint through the dark. Pebble looks up from the next one.' },
    { who: 'Eclipse', text: 'You found the trail before I did.' },
    { who: 'Pebble', text: 'Woof!' },
    { who: 'Eclipse', text: 'Something is tearing through the dark nearby.' },
    { who: 'Pebble', text: 'Rrrr.' },
    { who: 'Eclipse', text: 'Stay close. We hunt together.' },
    { who: 'Narrator', text: 'Pebble bounds ahead. Eclipse follows, already focused on the trail.' }
  ],
  goofy_rodger: [
    { who: 'Narrator', text: 'Goofy waves a key in front of Rodger. Rodger immediately reaches for his notebook.' },
    { who: 'Goofy', text: 'Gawrsh, I found this in the hallway!' },
    { who: 'Rodger', text: 'And you did not test which lock it opens?' },
    { who: 'Goofy', text: 'I was waiting for someone clever to tell me.' },
    { who: 'Rodger', text: 'That is either considerate or extremely dangerous.' },
    { who: 'Goofy', text: 'Why not both?' },
    { who: 'Rodger', text: 'I am writing that down.' }
  ],
  rudie_eggson: [
    { who: 'Rudie', text: 'Eggson! Race you to the elevator!' },
    { who: 'Eggson', text: 'No.' },
    { who: 'Rudie', text: 'You did not even think about it!' },
    { who: 'Eggson', text: 'I have considered it many times.' },
    { who: 'Rudie', text: 'And?' },
    { who: 'Eggson', text: 'No.' },
    { who: 'Rudie', text: "Great! I'll race you anyway!" },
    { who: 'Eggson', text: 'That is not how a race works.' }
  ],
  waxwell_soulvester: [
    { who: 'Narrator', text: 'Waxwell has arranged a tiny warning sign in front of Soulvester.' },
    { who: 'Waxwell', text: 'At last, a worthy target.' },
    { who: 'Soulvester', text: 'I am not thy target.' },
    { who: 'Waxwell', text: 'You are a knight. You are practically volunteering.' },
    { who: 'Soulvester', text: 'I am here to protect the others.' },
    { who: 'Waxwell', text: 'Wonderful. I shall begin with you.' },
    { who: 'Soulvester', text: 'Then thou hast chosen poorly.' }
  ],
  shrimpo_waxwell: [
    { who: 'Narrator', text: 'Shrimpo is yelling at a defeated Twisted. Waxwell watches, fascinated.' },
    { who: 'Waxwell', text: 'You are either the loudest creature alive or a very committed nuisance.' },
    { who: 'Shrimpo', text: "I'M THE BEST AT BEING LOUD!" },
    { who: 'Waxwell', text: 'I had not finished.' },
    { who: 'Shrimpo', text: "I DON'T CARE!" },
    { who: 'Waxwell', text: 'Excellent. You may be useful.' },
    { who: 'Shrimpo', text: "I'M NOT HELPING YOU!" },
    { who: 'Waxwell', text: 'You already are.' }
  ],
  yatta_looey: [
    { who: 'Narrator', text: 'Looey hurries after Yatta, who is already halfway down the hall.' },
    { who: 'Looey', text: 'Hey, Yatta! Wait up!' },
    { who: 'Yatta', text: "You're slow." },
    { who: 'Looey', text: "I'm a balloon. I have a natural excuse." },
    { who: 'Yatta', text: 'Then float faster.' },
    { who: 'Looey', text: "That's not how balloons work!" },
    { who: 'Yatta', text: 'It is now. Keep up.' }
  ],
  bobette_cocoa: [
    { who: 'Narrator', text: 'Bobette spots Cocoa leaving Bonbons beside the team’s supplies.' },
    { who: 'Bobette', text: 'Cocoa! Are you planning something?' },
    { who: 'Cocoa', text: 'Just helping!' },
    { who: 'Bobette', text: 'That is exactly what I was afraid of.' }
  ],
  ginger_scraps: [
    { who: 'Narrator', text: 'Scraps has spread craft supplies across an entire table.' },
    { who: 'Scraps', text: 'Ginger! Perfect timing!' },
    { who: 'Ginger', text: 'Oh... what are you making?' },
    { who: 'Scraps', text: 'Something we can put on display.' }
  ],
  sprout_cosmo: [
    { who: 'Narrator', text: 'Sprout catches Cosmo setting out a fresh baking tray with flour on his cheek.' },
    { who: 'Cosmo', text: 'I was thinking about baking another batch.' },
    { who: 'Sprout', text: 'You already did three this morning.' },
    { who: 'Cosmo', text: 'Just one more tray. I promised Cocoa and Toodles.' },
    { who: 'Sprout', text: 'Fine. But I’m watching you, and you take a break when your wrist starts hurting.' },
    { who: 'Cosmo', text: 'I know. Thanks, Sprout.' }
  ],
  wishbeargigi_gourdy: [
    { who: 'Gourdy', text: 'Miss Gigi! Miss Gigi! Look at my pumpkin bucket!' },
    { who: 'WishBearGigi', text: 'Aww, did you decorate it with little stars?' },
    { who: 'Gourdy', text: 'Nope! It made those stars by itself after I wished on your tummy!' },
    { who: 'WishBearGigi', text: 'Wait... did you wish on my tummy star without telling me?!' },
    { who: 'Gourdy', text: 'Maybe a little bit! But don’t worry, Cocoa and Shelly are here to help!' },
    { who: 'WishBearGigi', text: 'Oh goodness. What did you wish for, Gourdy...?' }
  ],
  mrsholloway_gourdy: [
    { who: 'Narrator', text: 'Gourdy spots a familiar purple bandana floating gently above the overgrown brambles.' },
    { who: 'Gourdy', text: 'Mama?! MAMA! Is that really you?!' },
    { who: 'MrsHolloway', text: 'My sweet little pumpkin... you’ve grown so strong and brave.' },
    { who: 'Gourdy', text: 'I never stopped looking for you! Even when the lights went out!' },
    { who: 'MrsHolloway', text: 'I felt your warmth through the roots, my darling. Come, let us walk together.' },
    { who: 'Narrator', text: 'Gourdy clutches his mother’s paw, spiraling violet runes glowing warmly around them.' }
  ],
  mrholloway_gourdy: [
    { who: 'Narrator', text: 'A heavy thud shakes the soil as Mr. Holloway rests a massive claw on a wooden trellis.' },
    { who: 'MrHolloway', text: 'Standing tall, son? Check your footing before the wind picks up.' },
    { who: 'Gourdy', text: 'Papa! Mama said we have to stick together!' },
    { who: 'MrHolloway', text: 'Your mother’s always right. Now chin up, shoulders back. A Holloway never cowers.' },
    { who: 'Gourdy', text: 'I’m ready, Papa! Nothing in Gardenview can push past us!' },
    { who: 'MrHolloway', text: '*chuckles deeply* That’s what I like to hear. Let’s tend this garden.' }
  ],
  mrsholloway_eclipse: [
    { who: 'Narrator', text: 'Eclipse slips silently through the shadow of the moonflower arch. Mrs. Holloway turns with a gentle smile.' },
    { who: 'Eclipse', text: 'You heard me coming. Most Toons don’t notice the dark until it’s already here.' },
    { who: 'MrsHolloway', text: 'The dark is only quiet, little one. It has nothing to fear from a caring mother.' },
    { who: 'Eclipse', text: 'People here... they fear shadows. They think everything in the dark is twisted.' },
    { who: 'MrsHolloway', text: 'Spirals exist in both shadow and starlight. Walk beside me, Eclipse. We will keep each other safe.' },
    { who: 'Eclipse', text: '...Thank you, Mrs. Holloway.' }
  ],
  mrholloway_connie: [
    { who: 'Narrator', text: 'Connie hovers upside down right in front of Mr. Holloway’s nose.' },
    { who: 'Connie', text: 'BOO! Did I scare ya?! Did ya jump?!' },
    { who: 'MrHolloway', text: '*blinks once slowly* You’re hovering a little crooked there, Connie.' },
    { who: 'Connie', text: 'Aw come on! Not even a flinch? I’m supposed to be terrifying!' },
    { who: 'MrHolloway', text: 'Takes more than a friendly spirit to scare an old harvest hand. But I like your energy, kid.' },
    { who: 'Connie', text: 'Alright then, Mr. H! If I can’t spook ya, let’s go spook some Twisteds together!' }
  ],
  delilah_bassie: [
    { who: 'Narrator', text: 'Bassie skips up to Delilah’s workbench, setting down a brightly woven Easter basket.' },
    { who: 'Bassie', text: 'Good morning, Miss Delilah! I brought fresh medical gauze and spring treats!' },
    { who: 'Delilah', text: '*adjusts her blue rubber gloves coldly* Unsanitary wicker. Keep it off the clean surfaces.' },
    { who: 'Bassie', text: 'I wiped it down with laboratory alcohol three times! Even the ribbons are sterile!' },
    { who: 'Delilah', text: '*pauses, raising an eyebrow behind dark bangs* ...Three times? Perhaps you are more observant than the other specimens.' },
    { who: 'Bassie', text: 'Hehe! A good helper is always prepared!' }
  ],
  delilah_dandy: [
    { who: 'Narrator', text: 'Dandy leans against the doorframe of Delilah’s observation chamber, grinning broadly.' },
    { who: 'Dandy', text: 'Well well! If it isn’t our brilliant chief architect. Hard at work as always?' },
    { who: 'Delilah', text: 'I am calibrating Ichor densities, Dandy. Go back to your shop before you contaminate the batch.' },
    { who: 'Dandy', text: 'Aw, so cold! You know, without my charming face on the posters, your little formulas would still be in the basement.' },
    { who: 'Delilah', text: 'And without my formulas, you would be paint on cardboard. Do not forget who brought you to life, flower.' },
    { who: 'Dandy', text: '*chuckles smoothly* That’s why we make such a wonderful team, Delilah.' }
  ],
  connie_waxwell: [
    { who: 'Narrator', text: 'Waxwell stands atop a crate in the dark, posing theatrically with a violet flame.' },
    { who: 'Waxwell', text: 'Hear me, denizens of the gloom! The hour of reckoning approaches! Tremble before the—' },
    { who: 'Narrator', text: 'Connie floats in upside down behind him and casually puffs out his flame.' },
    { who: 'Waxwell', text: '—*pfft*—HEY! MY AMBIANCE! DO YOU MIND?!' },
    { who: 'Connie', text: 'Pfffft! Hahahahaha! You should see your face, candle-boy! It’s pitch black!' },
    { who: 'Waxwell', text: '*furiously relighting his wick* Insolent spirit! You dare extinguish the dark wick of doom?!' },
    { who: 'Connie', text: 'I do! And I’ll do it again if your villain monologue runs longer than ten seconds! Come on, let’s go spook some Twisteds!' }
  ]
};

function friendshipGreeting(c, a, b) {
  return FRIENDSHIP_GREETING_LINES[c.id] || [
    { who: 'Narrator', text: `${a.name} and ${b.name} find the next room together.` },
    { who: a.name, text: `${b.name}. We move when you are ready.` },
    { who: b.name, text: 'I am ready.' }
  ];
}

Object.assign(Screens, {

  /* ============================================================ FRIENDSHIP */
  friendship(s) {
    if (this._friendshipChunkTimer) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._friendshipChunkTimer);
      this._friendshipChunkTimer = null;
    }
    const campaigns = Campaign.list();
    const complete = campaigns.filter(c => Save.campaignDone(c.id)).length;
    const available = campaigns.filter(c => Campaign.unlocked(c) && !Save.campaignDone(c.id)).length;
    const root = el('div', 'friendship-screen');

    const head = el('header', 'friendship-hub-head');
    head.innerHTML = `<div class="friendship-head-motifs" aria-hidden="true"><i>✦</i><i>★</i><i>✦</i></div>
      <div class="friendship-head-copy"><small>TEAM STORIES</small><h1>Friendship Campaigns</h1>
      <p>Own both featured Toons to open their story. Chapter guests join the battle if recruited; missing battle guests leave a slot open.</p></div>
      <div class="friendship-head-stats">
        <div><b>${complete}<span>/${campaigns.length}</span></b><small>BADGES</small></div>
        <div><b>${available}</b><small>READY</small></div>
      </div>`;
    root.appendChild(head);

    const sortBar = el('div', 'friendship-sortbar');
    const savedSort = Save.data.opt && Save.data.opt.friendshipSort;
    const sort = ['level', 'progress', 'ready', 'name'].includes(savedSort) ? savedSort : 'level';
    sortBar.innerHTML = '<span class="friendship-sort-label">SORT</span>';
    const select = el('select', 'friendship-sort');
    select.setAttribute('aria-label', 'Sort friendship campaigns');
    select.innerHTML = `<option value="level">Recommended level</option>
      <option value="progress">Progress · closest first</option>
      <option value="ready">Ready to play</option>
      <option value="name">Name · A–Z</option>`;
    select.value = sort;
    select.onchange = () => {
      Save.data.opt = Save.data.opt || {};
      Save.data.opt.friendshipSort = select.value;
      Save.write();
      this.render();
    };
    sortBar.appendChild(select);
    const hints = { level: 'Lowest level first', progress: 'Most complete first', ready: 'Playable stories first', name: 'Alphabetical' };
    sortBar.appendChild(el('span', 'friendship-sort-hint', hints[sort]));
    root.appendChild(sortBar);

    const grid = el('div', 'friendship-grid');
    const sorted = this.sortFriendshipCampaigns(campaigns, sort);
    const BATCH_SIZE = 8;
    const initialBatch = sorted.slice(0, BATCH_SIZE);
    initialBatch.forEach((c, index) => grid.appendChild(this.friendshipCard(c, index)));
    root.appendChild(grid);
    s.appendChild(root);

    if (sorted.length > BATCH_SIZE) {
      let cursor = BATCH_SIZE;
      const step = () => {
        const isConnected = grid.isConnected !== undefined ? grid.isConnected : true;
        if (!isConnected) {
          this._friendshipChunkTimer = null;
          return;
        }
        const nextBatch = sorted.slice(cursor, cursor + BATCH_SIZE);
        const frag = typeof document !== 'undefined' && document.createDocumentFragment ? document.createDocumentFragment() : el('div');
        nextBatch.forEach((c, i) => frag.appendChild(this.friendshipCard(c, cursor + i)));
        grid.appendChild(frag);
        cursor += BATCH_SIZE;
        if (cursor < sorted.length) {
          if (typeof requestAnimationFrame === 'function') {
            this._friendshipChunkTimer = requestAnimationFrame(step);
          } else {
            step();
          }
        } else {
          this._friendshipChunkTimer = null;
        }
      };
      if (typeof requestAnimationFrame === 'function') {
        this._friendshipChunkTimer = requestAnimationFrame(step);
      } else {
        step();
      }
    }
  },

  sortFriendshipCampaigns(campaigns, sort) {
    const state = c => {
      const total = c.stages.length;
      const done = clamp(Save.campaignStage(c.id), 0, total);
      const unlocked = Campaign.unlocked(c);
      const introSeen = unlocked && Save.campaignIntroSeen(c.id);
      const finished = done >= total;
      return { done, total, unlocked, introSeen, finished, pct: done / Math.max(1, total) };
    };
    const decorated = campaigns.map((c, index) => ({ c, index, s: state(c) }));
    const name = c => String(c.title || c.id).toLocaleLowerCase();
    const level = c => Number(c.recLevel) || 0;
    const canon = c => Number(c.canonicalOrder) || 999;
    const readyRank = s => !s.unlocked ? 3 : s.finished ? 2 : s.introSeen ? 0 : 1;
    decorated.sort((a, b) => {
      let result = 0;
      if (sort === 'progress') result = b.s.pct - a.s.pct || b.s.done - a.s.done;
      else if (sort === 'ready') result = readyRank(a.s) - readyRank(b.s) || b.s.pct - a.s.pct;
      else if (sort === 'name') result = name(a.c).localeCompare(name(b.c));
      else result = canon(a.c) - canon(b.c) || level(a.c) - level(b.c);
      return result || canon(a.c) - canon(b.c) || level(a.c) - level(b.c) || name(a.c).localeCompare(name(b.c)) || a.index - b.index;
    });
    return decorated.map(item => item.c);
  },

  friendshipCard(c, index) {
    const total = c.stages.length;
    const done = clamp(Save.campaignStage(c.id), 0, total);
    const unlocked = Campaign.unlocked(c);
    const introSeen = unlocked && Save.campaignIntroSeen(c.id);
    const finished = done >= total;
    const badge = BADGES[c.badge] || { color: '#ffb0dc', name: c.badge || 'Badge', stat: () => '', effect: '' };
    const badgeOwned = Save.ownsBadge(c.badge);
    const storyIds = Campaign.requiredIds(c, Math.min(done, total - 1));
    const missing = storyIds.filter(id => !Save.owns(id));
    const maps = ['shelly-floor', 'rainbow-rooms', 'warehouse', 'library-floor'];
    const card = el('article', `friendship-card${unlocked && !introSeen ? ' duo-ready' : ''}${finished ? ' complete' : ''}`);
    card.style.setProperty('--pair-color', badge.color || '#ffb0dc');
    card.style.setProperty('--friend-delay', Math.min(index * 0.04, 0.24) + 's');

    const scene = el('div', 'friendship-scene');
    scene.style.backgroundImage = `linear-gradient(180deg,#10121b1f,#11151ce8),url("${bgForMap(maps[index % maps.length])}")`;
    const primaryMissing = !Save.owns(c.a) || !Save.owns(c.b);
    const hasPrereq = c.prereq && !Save.campaignDone(c.prereq);
    const status = primaryMissing ? 'DUO LOCKED' : hasPrereq ? 'PREREQUISITE' : finished ? 'COMPLETE' : missing.length ? 'PARTY SHORT' : !introSeen ? 'DUO READY' : done ? `CHAPTER ${done + 1}` : 'NEW STORY';
    scene.innerHTML = `<div class="friendship-scene-glow"></div>
      <div class="friendship-status">${status}</div>
      <button class="friendship-toon toon-a${Save.owns(c.a) ? '' : ' missing'}" aria-label="View ${HEROES[c.a].name}">
        <img src="${Art.hero(c.a)}" alt="${HEROES[c.a].name}" loading="lazy" decoding="async"><span>${HEROES[c.a].name}</span>
      </button>
      <div class="friendship-bond" aria-hidden="true">🤝<i></i><i></i></div>
      <button class="friendship-toon toon-b${Save.owns(c.b) ? '' : ' missing'}" aria-label="View ${HEROES[c.b].name}">
        <img src="${Art.hero(c.b)}" alt="${HEROES[c.b].name}" loading="lazy" decoding="async"><span>${HEROES[c.b].name}</span>
      </button>
      <div class="friendship-scene-title"><small>${HEROES[c.a].name} + ${HEROES[c.b].name}</small><strong>${c.title}</strong></div>`;
    const openHero = id => Save.owns(id) ? HeroPage.open(id) : UI.unlockInfo(id);
    $('.toon-a', scene).onclick = () => { Sound.play('ui_move'); openHero(c.a); };
    $('.toon-b', scene).onclick = () => { Sound.play('ui_move'); openHero(c.b); };
    scene.onclick = e => {
      if (e.target.closest('.friendship-toon')) return;
      if (primaryMissing) { UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} to open this story`); Sound.play('ui_err'); return; }
      if (hasPrereq) { UI.toast(c.prereqMsg || 'Clear prerequisite story first'); Sound.play('ui_err'); return; }
      if (!unlocked) { UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} to open this story`); Sound.play('ui_err'); return; }
      Sound.play('ui_ok');
      if (!introSeen) this.friendshipIntro(c);
      else if (finished) this.campaignReader(c, 0);
      else this.campaignSetup(c, done);
    };
    card.appendChild(scene);

    const body = el('div', 'friendship-card-body');
    const proof = el('div', 'friendship-duo-proof');
    const partner = id => Save.owns(id) ? `<span>✓ ${HEROES[id].name}</span>` : `<span class="guest">○ ${HEROES[id].name}</span>`;
    proof.innerHTML = `${partner(c.a)}${partner(c.b)}<b>${primaryMissing ? 'OWN BOTH TO UNLOCK' : hasPrereq ? (c.prereqMsg ? c.prereqMsg.toUpperCase() : 'CLEAR PREREQUISITE STORY FIRST') : finished ? 'STORY COMPLETE' : missing.length ? 'STORY CAST · PARTY SHORT' : introSeen ? 'INTRO COMPLETE' : 'DUO READY'}</b>`;
    body.appendChild(proof);
    const progress = el('div', 'friendship-progress');
    progress.innerHTML = `<div><b>${primaryMissing ? 'Own both featured Toons to unlock' : hasPrereq ? (c.prereqMsg || 'Clear prerequisite story first') : finished ? 'Story complete' : !introSeen ? 'Story introduction ready' : `${done} of ${total} chapters`}</b>
      <span>Recommended level ${c.recLevel} · ${friendshipObtainLabel(c.a, c.b)}</span></div><strong>${Math.round(done / total * 100)}%</strong>`;
    const meter = el('div', 'friendship-meter');
    for (let i = 0; i < total; i++) meter.appendChild(el('i', i < done ? 'filled' : i === done && unlocked && introSeen ? 'next' : ''));
    progress.appendChild(meter);
    body.appendChild(progress);

    const trail = el('div', 'friendship-trail');
    c.stages.forEach((stage, i) => {
      const cleared = i < done;
      const next = i === done && !finished;
      const accessible = introSeen && (cleared || next || finished);
      const node = el('button', `friendship-stage${cleared ? ' cleared' : ''}${next ? ' current' : ''}${accessible ? '' : ' unavailable'}`);
      node.setAttribute('aria-label', `${primaryMissing ? 'Locked until both featured Toons are owned' : hasPrereq ? 'Locked until prerequisite cleared' : !introSeen ? 'Locked until introduction' : finished ? 'Read' : cleared ? 'Replay' : next ? 'Play' : 'Locked'} chapter ${i + 1}: ${stage.name}`);
      node.innerHTML = `<i>${cleared ? '✓' : i + 1}</i><span><small>CHAPTER ${i + 1}</small><b>${stage.name}</b></span>${next ? '<em>PLAY</em>' : ''}`;
      node.onclick = () => {
        if (primaryMissing) {
          UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} first`); Sound.play('ui_err'); return;
        }
        if (hasPrereq) {
          UI.toast(c.prereqMsg || 'Clear prerequisite story first'); Sound.play('ui_err'); return;
        }
        if (!introSeen) {
          UI.toast(`Meet ${HEROES[c.a].name} and ${HEROES[c.b].name} first`); Sound.play('ui_err'); return;
        }
        if (!accessible) {
          UI.toast('Clear chapter ' + (done + 1) + ' first'); Sound.play('ui_err'); return;
        }
        Sound.play(cleared || finished ? 'ui_move' : 'ui_ok');
        if (finished) this.campaignReader(c, i);
        else this.campaignSetup(c, i);
      };
      trail.appendChild(node);
    });
    const playAt = finished ? total - 1 : done;
    const play = el('button', 'friendship-play', primaryMissing
      ? `🔒 Own ${HEROES[c.a].name} + ${HEROES[c.b].name}`
      : hasPrereq
      ? `🔒 ${c.prereqMsg || 'Clear prerequisite story first'}`
      : !introSeen
      ? `▶ Meet ${HEROES[c.a].name} & ${HEROES[c.b].name}`
      : finished
      ? `📖 Read Story`
      : `▶ Play Chapter ${playAt + 1} · ${c.stages[playAt].name}`);
    play.onclick = () => {
      if (primaryMissing) { UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} first`); Sound.play('ui_err'); return; }
      if (hasPrereq) { UI.toast(c.prereqMsg || 'Clear prerequisite story first'); Sound.play('ui_err'); return; }
      if (!unlocked) { UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} first`); Sound.play('ui_err'); return; }
      Sound.play('ui_ok');
      if (!introSeen) this.friendshipIntro(c);
      else if (finished) this.campaignReader(c, 0);
      else this.campaignSetup(c, playAt);
    };
    body.appendChild(play);
    if (introSeen) {
      const replayIntro = el('button', 'friendship-intro-replay', '↻ Rewatch Introduction');
      replayIntro.onclick = () => this.friendshipIntro(c, true);
      body.appendChild(replayIntro);
    }

    // The next chapter is the primary action. Keep its button above the
    // chapter trail so opening a campaign never means scrolling past history.
    body.appendChild(trail);

    const reward = el('div', 'friendship-reward');
    reward.innerHTML = `${badgeIconHtml(c.badge, badgeOwned ? Save.badgeLvl(c.badge) : 0)}
      <div><small>${badgeOwned ? 'FRIENDSHIP BADGE EARNED' : 'FINALE REWARD'}</small><b>${badge.name}</b>
      <span>${badgeOwned ? badge.stat(Save.badgeLvl(c.badge)) : badge.effect}</span></div>
      <i>${badgeOwned ? '✓' : '›'}</i>`;
    body.appendChild(reward);
    card.appendChild(body);
    return card;
  },

  /** This first-look scene is deliberately separate from battle: it records
    the introduction only when the player finishes it, so closing it keeps
      the chapters gated until the story introduction has been seen. */
  friendshipIntro(c, replay) {
    const a = HEROES[c.a], b = HEROES[c.b];
    const body = el('div', 'friendship-intro');
    body.style.setProperty('--pair-color', BADGES[c.badge]?.color || '#9eeaa7');
    const lines = c.intro || friendshipGreeting(c, a, b);
    const esc = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const format = value => esc(value).replace(/\*([^*]+)\*/g, '<em>$1</em>');
    body.innerHTML = `<div class="friendship-intro-scene">
      <div class="friendship-intro-glow"></div><div class="friendship-intro-stamp">${replay ? 'REVISITING' : 'DUO FOUND'}</div>
      <div class="friendship-intro-toon intro-a"><img src="${Art.hero(c.a)}" alt="${esc(a.name)}" loading="lazy" decoding="async"><span>${esc(a.name)}</span></div>
      <div class="friendship-bond">🤝</div>
      <div class="friendship-intro-toon intro-b"><img src="${Art.hero(c.b)}" alt="${esc(b.name)}" loading="lazy" decoding="async"><span>${esc(b.name)}</span></div>
    </div><div class="friendship-intro-dialogue"><small></small><p></p><b></b></div>`;
    const dialogue = $('.friendship-intro-dialogue', body);
    const next = el('button', 'friendship-intro-next', 'Continue');
    body.appendChild(next);
    let i = -1;
    const show = () => {
      i++;
      if (i >= lines.length) {
        Save.markCampaignIntro(c.id);
        Sound.play('sparkle');
        UI.closeModal();
        this.render();
        return;
      }
      const line = lines[i];
      dialogue.classList.toggle('scene', line.who === 'Narrator');
      dialogue.querySelector('small').textContent = line.who === 'Narrator' ? 'SCENE' : line.who;
      dialogue.querySelector('p').innerHTML = format(line.text);
      dialogue.querySelector('b').textContent = `${i + 1} / ${lines.length}`;
      next.textContent = i === lines.length - 1 ? 'Open Campaign' : 'Continue';
      Sound.play(i === 0 ? 'ui_ok' : 'ui_move');
    };
    next.onclick = show;
    UI.modal(`${a.name} & ${b.name}`, body, { className: 'friendship-intro-modal' });
    show();
  },

  /** Completed campaigns become a quiet story archive. Reading a chapter here
      does not spend resources, start a battle, or replay its rewards. */
  campaignReader(c, initialStage) {
    let selected = clamp(initialStage || 0, 0, c.stages.length - 1);
    const body = el('div', 'friendship-reader');
    body.style.setProperty('--pair-color', BADGES[c.badge]?.color || '#9eeaa7');
    const tabs = el('div', 'friendship-reader-tabs');
    const transcript = el('div', 'friendship-reader-transcript');
    const escape = value => String(value || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const format = value => escape(value).replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const render = () => {
      [...tabs.children].forEach((tab, i) => tab.classList.toggle('active', i === selected));
      const stage = c.stages[selected];
      transcript.innerHTML = `<div class="friendship-reader-heading"><small>CHAPTER ${selected + 1} OF ${c.stages.length}</small><b>${escape(stage.name)}</b></div>`;
      stage.lines.forEach(line => {
        const row = el('div', `friendship-reader-line${line.who === 'Narrator' ? ' scene' : ''}`);
        row.innerHTML = `<small>${line.who === 'Narrator' ? 'SCENE' : escape(line.who)}</small><p>${format(line.text)}</p>`;
        transcript.appendChild(row);
      });
      transcript.scrollTop = 0;
    };

    c.stages.forEach((stage, i) => {
      const tab = el('button', `friendship-reader-tab${i === selected ? ' active' : ''}`);
      tab.type = 'button';
      tab.innerHTML = `<i>${i + 1}</i><span>${escape(stage.name)}</span>`;
      tab.onclick = () => { selected = i; Sound.play('ui_move'); render(); };
      tabs.appendChild(tab);
    });
    body.appendChild(tabs);
    body.appendChild(transcript);
    UI.modal('📖 ' + c.title, body, { className: 'friendship-reader-modal' });
    render();
  },

  /** The pair stays in the chapter story. Owned partners are locked into the
      team; every unowned partner leaves one of the five formation slots empty. */
  campaignSetup(c, stageIdx) {
    if (!Campaign.unlocked(c)) { UI.toast(`Own ${HEROES[c.a].name} and ${HEROES[c.b].name} first`); Sound.play('ui_err'); return; }
    const stage = c.stages[stageIdx];
    const replay = stageIdx < Save.campaignStage(c.id);
    const storyIds = Campaign.requiredIds(c, stageIdx);
    const ownedStory = storyIds.filter(id => Save.owns(id));
    const partySize = Math.max(1, 5 - storyIds.filter(id => !Save.owns(id)).length);
    const seed = ownedStory.concat(Save.data.team.filter(id => id && !storyIds.includes(id))).slice(0, partySize);
    const p = UI.teamPicker({ team: seed, required: ownedStory, maxSize: partySize });
    const body = el('div', 'friendship-setup team-editor-body');
    body.style.setProperty('--pair-color', BADGES[c.badge]?.color || '#ffb0dc');
    const scroll = el('div', 'team-editor-scroll');
    scroll.innerHTML = `<div class="friendship-setup-scene">
      <img src="${Art.hero(c.a)}" alt="${HEROES[c.a].name}" loading="lazy" decoding="async"><div><small>${replay ? 'REPLAY' : `CHAPTER ${stageIdx + 1} OF ${c.stages.length}`}</small>
      <b>${stage.name}</b><span>${HEROES[c.a].name} + ${HEROES[c.b].name}</span></div><img src="${Art.hero(c.b)}" alt="${HEROES[c.b].name}" loading="lazy" decoding="async"></div>
      <div class="friendship-setup-info"><span>★ Recommended Lv ${c.recLevel}</span><span>${friendshipObtainLabel(c.a, c.b)}</span><span>${RES.ichor.icon} ${300 + c.recLevel * 8}</span><span>${RES.exp.icon} ${250 + c.recLevel * 6}</span></div>
      <div class="friendship-required"><b>Story cast · ${partySize}/5 battle slots</b>${storyIds.map(id => `<span class="${Save.owns(id) ? 'owned' : 'guest'}">${Save.owns(id) ? '✓' : '○'} ${HEROES[id].name}</span>`).join('')}</div>`;
    scroll.appendChild(p.node);
    body.appendChild(scroll);
    const ok = el('button', 'btn go wide team-confirm', replay ? `Replay “${stage.name}”` : `Start “${stage.name}”`);
    ok.onclick = () => {
      const team = p.team.filter(Boolean);
      UI.closeModal();
      Campaign.start(c.id, stageIdx, team, () => this.render());
    };
    const actions = el('div', 'friendship-setup-actions');
    actions.appendChild(ok);
    const tape = el('button', 'btn wide team-confirm friendship-raid-ticket', `⚡ RAID TICKET · ${fmt(Save.res('raidTicket'))} HELD`);
    tape.disabled = !Save.res('raidTicket');
    tape.title = tape.disabled ? 'You need a Raid Ticket' : 'Resolve this chapter off screen at 10,000× speed';
    tape.onclick = () => {
      const team = p.team.filter(Boolean);
      UI.closeModal();
      this.openRaidTicketQuantity(`${c.title} · Chapter ${stageIdx + 1}`, amount => this.campaignRaidTicketFight(c, stageIdx, team, amount));
    };
    actions.appendChild(tape);
    body.appendChild(actions);
    UI.modal(c.title, body, { className: 'friendship-setup-modal team-editor-modal' });
  },

  campaignRaidTicketFight(c, stageIdx, team, amount) {
    if (this._raidTicketRunning) return;
    this._raidTicketRunning = true;
    const stage = c.stages[stageIdx];
    const body = el('div', 'raid-ticket-running');
    body.innerHTML = `<div class="raid-ticket-spinner">⚡</div><b>RUNNING FRIENDSHIP RAID SIM</b><p>${c.title} · ${stage.name} · 10,000× off screen</p>`;
    UI.modal('Friendship Raid Ticket', body, { dismissOnBackdrop: false });
    setTimeout(async () => {
      let result;
      const ticketBalanceBefore = Save.res('raidTicket');
      try {
        result = await RaidTicket.runBatch(() => RaidTicket.runCampaign(c, stageIdx, team), amount || 1);
      } catch (error) {
        console.error('Friendship Raid Ticket UI failed', error);
        if (Save.res('raidTicket') < ticketBalanceBefore && typeof RaidTicket.refund === 'function') RaidTicket.refund();
        result = { win: false, why: 'The Friendship battle simulation could not be completed. Your Raid Ticket was returned.', consumed: false, refunded: true };
      } finally {
        this._raidTicketRunning = false;
      }
      UI.closeModal();
      this.render();
      if (result && result.badgeEarned) UI.toast('🤝 Friendship Badge earned: ' + BADGES[c.badge].name);
      this.showRaidTicketResult(`${c.title} · Chapter ${stageIdx + 1}`, result, { id: 'friendship' }, stageIdx, result && result.rewards);
    }, 40);
  }

});
