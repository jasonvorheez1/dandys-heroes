/* gossip.js - relationship threads and Gardenview archive cases.
   Facts are kept separate from Dandy's commentary so the canon is readable
   even when the shopkeeper is being evasive or theatrical. */
'use strict';

const GOSSIP_CATEGORIES = {
  all: { label: 'All Files', icon: '✦' },
  relationships: { label: 'Relationships', icon: '♥' },
  personalities: { label: 'Personalities', icon: '☻' },
  show: { label: 'Show Files', icon: '▣' },
  origins: { label: 'Origins', icon: '◈' },
  archives: { label: 'Gardenview', icon: '⌂' }
};

const GOSSIP_CASES = [
  {
    id: 'phantasia-outsider', category: 'origins', cast: ['Phantasia'], unlock: ['Phantasia'], icon: '🦄',
    eyebrow: 'OUTSIDER SIGHTING', title: 'A Wish From Elsewhere', summary: 'A distractible unicorn fled monstrous reflections of her own world and wandered into Gardenview without a file or a Twisted form.',
    facts: [
      'Phantasia loves peppermint.',
      'Phantasia is very easily distracted.',
      'Monstrous versions of people roam her world, creating a danger similar to Gardenview’s Twisted problem.',
      'She tried to escape those creatures and eventually ended up in Gardenview.',
      'Phantasia was not created by Delilah, cannot be encountered as an enemy, and has no Twisted form.',
      'She is a collaboration visitor, but she is not from Kingdom Hearts.'
    ],
    dandy: "I don't know her. She appeared near the shop, asked whether I had peppermint, got distracted halfway through the question, and wandered off before I could check a single file."
  },
  {
    id: 'cosmo-sprout', category: 'relationships', cast: ['Cosmo', 'Sprout'], unlock: ['Cosmo', 'Sprout'],
    eyebrow: 'BEST FRIENDS', title: 'Too Close to Lose', summary: 'Cosmo and Sprout are inseparable, but Sprout holds on much tighter than Cosmo realizes.',
    facts: [
      'Cosmo and Sprout are best friends.',
      'Sprout has attachment issues centered on Cosmo and becomes deeply uneasy when they are separated.',
      'His protectiveness is genuine, but it can turn ordinary distance into an emergency in his mind.'
    ],
    dandy: "Sprout checked the same doorway six times while Cosmo was gone. I counted! Cosmo thought it was sweet... so I suppose that's what matters."
  },
  {
    id: 'scraps-goob', category: 'relationships', cast: ['Scraps', 'Goob'], unlock: ['Scraps', 'Goob'],
    eyebrow: 'SIBLING FILE', title: 'Long Arms, Strong Thread', summary: 'Scraps and Goob are siblings whose very different kinds of creativity still point back to each other.',
    facts: [
      'Scraps is Goob’s older sister, and Goob is her younger brother.',
      'Scraps is kind, artistic, and especially attentive to Goob’s well-being.',
      'She can be airheaded and forgetful, but she does not forget that Goob needs her.',
      'Goob’s instinct is physical closeness; Scraps’s is to mend, make, and quietly look after him.'
    ],
    dandy: "Scraps usually fixes the problem while Goob hugs whoever caused it. Strange method... but it works more often than mine. Sometimes!"
  },
  {
    id: 'goob-dyle', category: 'personalities', cast: ['Goob', 'Dyle'], unlock: ['Goob', 'Dyle'],
    eyebrow: 'INCIDENT REPORT', title: 'The Dyle Situation', summary: 'Goob once made Dyle extremely uncomfortable. Neither of them tells the story the same way. Dyle barely tells it at all.',
    facts: [
      'Goob once did something that made Dyle very uncomfortable.',
      'Dyle does not enjoy discussing the incident.',
      'Goob’s friendliness and poor sense of personal space appear to have been central to the problem.'
    ],
    dandy: "Dyle set aside twelve quiet minutes after the incident. Goob thought he could help with another hug... He could not."
  },
  {
    id: 'brusha-tisha', category: 'relationships', cast: ['Brusha', 'Tisha'], unlock: ['Brusha'],
    eyebrow: 'CASTING FRICTION', title: 'Best Friends, Per Script', summary: 'The show expected Brusha and Tisha to be best friends. Being told that only gave them something new to resent.',
    facts: [
      'Brusha and Tisha dislike each other.',
      'Their conflict grew because Dandy’s World expected and promoted them as best friends.',
      'Brusha is rude and arrogant, which makes forced closeness especially difficult.',
      'The friendship worked better in promotional expectations than it ever did between the two Toons.'
    ],
    dandy: "Production kept pairing Brusha and Tisha together and telling them to look friendly. Ooh... you could feel the room getting colder every time."
  },
  {
    id: 'gourdy-origin', category: 'origins', cast: ['Gourdy'], unlock: ['Gourdy'],
    eyebrow: 'MISSING FAMILY', title: 'The Parents Who Weren’t Made', summary: 'Gourdy is a child carrying the loss of parents who do not appear in Delilah’s creation records.',
    facts: [
      'Gourdy is a kid who lost his parents.',
      'It was later revealed that Delilah never created Gourdy’s parents.',
      'That absence makes Gourdy’s origin different from a simple missing Toon record.'
    ],
    dandy: "Let's not ask Gourdy about home unless he brings it up first, alright? I mean it. Some files aren't fun gossip."
  },
  {
    id: 'delilah-shutdown', category: 'origins', cast: ['Delilah', 'Dandy'], public: true,
    eyebrow: 'SHUTDOWN FILE', title: 'Creator and Scapegoat', summary: 'Delilah created the Toons. When Gardenview shut down, she placed the blame on Dandy.',
    facts: [
      'Delilah Keen created the Toons.',
      'After the shutdown, Delilah blamed Dandy for what happened.',
      'The blame tied Gardenview’s collapse to one of its own creations instead of only to its founders and management.'
    ],
    dandy: "Delilah made us and wrote the rules. Then Gardenview closed and suddenly my name was all over the blame... Funny how that happened, isn't it?"
  },
  {
    id: 'gardenview-entertainment', category: 'archives', cast: [], public: true, icon: '🏢',
    eyebrow: 'COMPANY ARCHIVE', title: 'Gardenview Entertainment', summary: 'The company behind the show, the park, the museum, and nearly everything carrying the Gardenview name.',
    facts: [
      'Gardenview Entertainment was founded in the early 1980s by Arthur Walton and Delilah Keen.',
      'The company created the Dandy’s World television show.',
      'It also created Gardenview Park and the Gardenview Educational Center and Museum.',
      'Gardenview Entertainment produced and sold merchandise inside Gardenview.',
      'Known employees include Arthur Walton, Delilah Keen, and the Toon Handlers.'
    ],
    dandy: "Gardenview put its name on the show, the park, the museum, and every little souvenir it could fit on a shelf! Very thorough... and very profitable."
  },
  {
    id: 'gardenview-park', category: 'archives', cast: [], public: true, icon: '🚉',
    eyebrow: 'LOCATION ARCHIVE', title: 'The Park and the Train', summary: 'A natural park built as both a destination and the first step toward Gardenview’s educational center.',
    facts: [
      'Gardenview Park is a natural park containing a train station.',
      'The train station leads to the Gardenview Educational Center and Museum.',
      'Gardenview Entertainment built the park in the mid-1980s.',
      'The park was owned by Arthur Walton and Delilah Keen.'
    ],
    dandy: "The train was meant to bring guests to the museum, but the snack stands certainly helped! People learn better with a souvenir in each hand. Probably."
  },
  {
    id: 'shelly-vee', category: 'show', cast: ['Shelly', 'Vee'], unlock: ['Shelly', 'Vee'],
    eyebrow: 'FOCUS EPISODE', title: 'Future and Past', summary: 'Shelly and Vee shared a focus episode built around two very different ways of preserving knowledge.',
    facts: [
      'Shelly is a paleontologist who studies, cleans, and preserves ancient remains instead of treating fossils as decoration.',
      'Her map contains dinosaur and ancient fossils, and its television animation shows her cleaning a fossil.',
      'A poster titled Future and Past advertises a Shelly and Vee focus episode.',
      'Shelly represents the past while Vee represents the future.'
    ],
    dandy: "Shelly represented the past and Vee represented the future! Production spent ages arranging that poster... everyone had opinions. So many opinions."
  },
  {
    id: 'vee-quiz-show', category: 'show', cast: ['Vee', 'Scraps', 'Brightney'], unlock: ['Vee', 'Scraps'],
    eyebrow: 'BROADCAST FILE', title: 'M-005 On the Air', summary: 'Vee’s quiz show is a Gardenview favorite, unless Scraps is back to win every prize again.',
    facts: [
      'Vee’s Toon Handler is Veronica Hurley.',
      'Vee hosts a quiz show that is popular with both Toons and children, with some episodes dedicated to the game show.',
      'Vee’s designation is M-005; the M most likely identifies her as a Main Character.',
      'Scraps repeatedly wins Vee’s game-show prizes.',
      'A television animation featuring Vee, Scraps, and Brightney implies that Vee is unhappy about Scraps’s winning streak.'
    ],
    dandy: "Vee loves a clever contestant until Scraps walks away with another armful of prizes. Then the smile gets a little... stiff. Hehe!"
  },
  {
    id: 'scraps-artist', category: 'personalities', cast: ['Scraps'], unlock: ['Scraps'],
    eyebrow: 'TOON PROFILE', title: 'Made by Hand', summary: 'Scraps loves creating for others, even if being watched makes every pencil line suddenly feel much louder.',
    facts: [
      'Scraps is a kind and artistic Toon who loves arts and crafts.',
      'She becomes nervous when someone watches her draw.',
      'She cares deeply about the other Toons, especially her younger brother Goob.',
      'Scraps can be airheaded and sometimes forgets to do things.'
    ],
    dandy: "If you want to see Scraps draw, don't stare at her! Look at the wall, hum a little, act completely uninterested... then peek carefully."
  },
  {
    id: 'waxwell-pranks', category: 'personalities', cast: ['Waxwell', 'Toodles', 'Sprout', 'Cosmo'], unlock: ['Waxwell'],
    eyebrow: 'PRANK LOG', title: 'The Joke Is on the Wick', summary: 'Waxwell’s pranks are bolder than Gigi’s tricks, but they have an impressive habit of backfiring before anyone gets properly upset.',
    facts: [
      'Waxwell is a mischievous Toon whose pranks can go further than Gigi’s.',
      'He once stole Toodles’s Dog Plush as part of a prank.',
      'He has added unexpected extra ingredients to Sprout and Cosmo’s cookies.',
      'His plans commonly fail because he makes a mistake or because the intended target accepts, or even enjoys, the result.',
      'When a prank goes wrong, Waxwell can have an angry tantrum. His flame sometimes grows larger with his frustration.'
    ],
    dandy: "Waxwell got the plush back, the cookies still tasted good, and somehow his own prank upset him most! His flame nearly touched the ceiling."
  },
  {
    id: 'finn-barnaby', category: 'personalities', cast: ['Finn'], unlock: ['Finn'], icon: '🐟',
    eyebrow: 'COMPANION FILE', title: 'One Line, Two Troublemakers', summary: 'Finn handles the fishing line. Barnaby handles the splash and refuses to be treated like ordinary equipment.',
    facts: [
      'Barnaby is Finn’s constant companion and swims beside him during a fight.',
      'Finn controls enemy movement with fishing lines while Barnaby disrupts enemies with water and surprise leaps.',
      'Barnaby cannot be targeted like a separate fighter and does not take hits for Finn.',
      'Their coordination is flexible and irritating, but it is built to disrupt rather than completely lock opponents down.'
    ],
    dandy: "Finn insists Barnaby follows instructions. Then Barnaby splashes whoever he wants and Finn pretends that was the plan... convincing, isn't it?"
  },
  {
    id: 'door-opens', category: 'archives', cast: ['Sora', 'Riku', 'Kairi', 'Goofy'], unlock: ['Sora', 'Riku', 'Kairi', 'Goofy'], icon: '🔑',
    eyebrow: 'COLLAB INCIDENT', title: 'The Door That Wasn’t There', summary: 'Four strangers arrived without Gardenview files and fought as if the Center had always been their responsibility.',
    facts: [
      'Sora, Riku, Kairi, and Goofy were not created by Delilah and have no Gardenview Toon records.',
      'Sora uses extended Keyblade combinations to interrupt and launch enemies.',
      'Riku protects his allies by absorbing pressure and returning it through counters.',
      'Kairi controls safe space with light marks and Radiant Circles.',
      'Goofy blocks direct pressure, intercepts attacks aimed at weak allies, and pushes enemies away from the backline.',
      'Their event encounter is a single five-minute endurance fight, and their entrance only plays when they are challengers.'
    ],
    dandy: "I checked every drawer twice. Nothing! Sora still ran in like saving the Gardenview Center was his job. I do not know who hired him, but his timing was excellent."
  }
];
