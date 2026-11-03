/* Vee + Shelly friendship campaign: the story behind Vee's badge,
   "Shelly's Amber Broadcast Lens". The existing Shelly + Vee campaign
   ("Field Update") belongs to Shelly's badge; this is Vee's side of it.
   Voices follow Dandy's World: Vee is a blunt quiz-show host who sounds
   superior without meaning to and is quietly protective; Shelly is a warm
   fossil and dinosaur fan. Fan lore pairs them as "Future and Past"
   (Vee is the television, Shelly the ammonite shell). */
'use strict';

defCampaign({
  id: 'vee_shelly', badge: 'vee_shelly', a: 'Vee', b: 'Shelly', recLevel: friendshipRecLevel('Vee', 'Shelly'),
  title: 'Future and Past',
  intro: [
    { who: 'Narrator', text: 'Vee\'s camera lens is cracked. Shelly is holding a piece of amber the size of her hand.' },
    { who: 'Shelly', text: 'I think I can fix that.' },
    { who: 'Vee', text: 'With a rock.' },
    { who: 'Shelly', text: 'With a very old rock.' }
  ],
  stages: [
    { name: 'Cracked Lens', lines: [
      { who: 'Shelly', text: 'Vee, your camera lens has a crack in it.' },
      { who: 'Vee', text: 'I am aware. Next question.' },
      { who: 'Shelly', text: 'Since when?' },
      { who: 'Vee', text: 'Since the last Twisted. That was two floors ago. You were standing right there.' },
      { who: 'Shelly', text: 'I was looking at a fossil.' },
      { who: 'Vee', text: 'You are always looking at a fossil.' },
      { who: 'Shelly', text: 'Can I fix the lens?' },
      { who: 'Vee', text: 'It is a broadcast lens. It is not a dig site.' },
      { who: 'Shelly', text: 'That is a no?' },
      { who: 'Vee', text: '...That is a "be careful."' }
    ]},
    { name: 'Resin', lines: [
      { who: 'Shelly', text: 'Okay! So, it\'s amber! Tree resin that got old and hard, like, millions of years old!' },
      { who: 'Vee', text: 'Which is why it has a bug in it.' },
      { who: 'Shelly', text: 'That\'s the best part! The bug is still perfect inside. Hehe.' },
      { who: 'Vee', text: 'A bug stuck in sap for millions of years. Wonderful.' },
      { who: 'Shelly', text: 'You say that like it\'s sad.' },
      { who: 'Vee', text: 'It did not choose to be kept.' },
      { who: 'Shelly', text: '...Oh. I never thought about it like that.' },
      { who: 'Vee', text: 'I was joking.' },
      { who: 'Shelly', text: 'You were not.' },
      { who: 'Vee', text: 'No. Keep going.' }
    ]},
    { name: 'Dinosaur Facts', lines: [
      { who: 'Shelly', text: 'Did you know feathers have been found preserved in amber? From dinosaurs!' },
      { who: 'Vee', text: 'Yes. Several specimens are on record. Question for the audience: which kind of dinosaur?' },
      { who: 'Shelly', text: 'Wait, you KNOW this?!' },
      { who: 'Vee', text: 'I have every fact ever written on a card. That is the job.' },
      { who: 'Shelly', text: 'Then you already knew the thing I was about to tell you!' },
      { who: 'Vee', text: 'Yes.' },
      { who: 'Shelly', text: 'Why did you let me say all of it?' },
      { who: 'Vee', text: 'You looked happy. It would have been rude to interrupt.' },
      { who: 'Shelly', text: 'That\'s the nicest thing you\'ve ever said, and you said it like a quiz question!' }
    ]},
    { name: 'Calibration', lines: [
      { who: 'Vee', text: 'Everything is orange.' },
      { who: 'Shelly', text: 'Give it a second!' },
      { who: 'Vee', text: 'The picture is warmer. The flaws are easier to see.' },
      { who: 'Shelly', text: 'Good flaws or bad flaws?' },
      { who: 'Vee', text: 'The Twisted over there has a loose plate. And your shell has a chip.' },
      { who: 'Shelly', text: 'It does?' },
      { who: 'Vee', text: 'It has had that chip all day. I am only mentioning it now.' },
      { who: 'Shelly', text: 'You noticed that, but you waited until now to say it?' },
      { who: 'Vee', text: 'I wanted to be sure it was not part of the design.' }
    ]},
    { name: 'Future and Past', lines: [
      { who: 'Shelly', text: 'Vee, you are staring at the poster again.' },
      { who: 'Vee', text: 'I am reviewing it. Production values are high.' },
      { who: 'Shelly', text: 'It is the one of us. Future and Past.' },
      { who: 'Vee', text: 'I know what it says.' },
      { who: 'Shelly', text: 'You are the future, and I am the past?' },
      { who: 'Vee', text: 'That is how they cast it.' },
      { who: 'Shelly', text: 'Do you mind?' },
      { who: 'Vee', text: 'No. Someone has to keep the past in good shape for the future to find.' },
      { who: 'Shelly', text: 'That is a really nice way to say it.' },
      { who: 'Vee', text: 'It is a terrible way to say it. I was going to cut it.' }
    ]},
    { name: 'Amber Broadcast', lines: [
      { who: 'Vee', text: 'The lens is finished. One question, and it is not for the audience.' },
      { who: 'Shelly', text: 'Sure!' },
      { who: 'Vee', text: 'Does amber ever forget what is inside it?' },
      { who: 'Shelly', text: 'No. It holds everything exactly as it was.' },
      { who: 'Vee', text: 'Then I will keep recording through it.' },
      { who: 'Shelly', text: 'Is that a live broadcast?' },
      { who: 'Vee', text: 'No. It is an archive. Live is for people who are not worried about losing it.' },
      { who: 'Shelly', text: 'Then I am glad I am in it.' },
      { who: 'Vee', text: '...So am I. Do not make it weird.' }
    ]}
  ]
});
