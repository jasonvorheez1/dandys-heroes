/* Friendship stories that award Dandy's Brusha and Pebble badges. */
'use strict';

defCampaign({
  id: 'dandy_brusha', badge: 'dandy_brusha', a: 'Dandy', b: 'Brusha',
  recLevel: friendshipRecLevel('Dandy', 'Brusha'), title: 'The Whole Picture',
  stages: [
    { name: 'In the Frame', lines: [
      { who: 'Narrator', text: 'Brusha sketches a poster while Dandy hovers at her shoulder.' },
      { who: 'Dandy', text: 'There is a lot of empty space around me.' },
      { who: 'Brusha', text: 'That is where everyone else goes.' },
      { who: 'Dandy', text: 'They could go behind me.' },
      { who: 'Brusha', text: 'They could. Then it would be a very boring poster.' },
      { who: 'Dandy', text: 'You are surprisingly difficult to commission.' }
    ]},
    { name: 'Wet Paint', lines: [
      { who: 'Narrator', text: 'After the fight, paint marks the places the Twisteds tried to rush past Dandy.' },
      { who: 'Dandy', text: 'Your colors gave away every one of them.' },
      { who: 'Brusha', text: 'Your shouting made them look at you.' },
      { who: 'Dandy', text: 'That part comes naturally.' },
      { who: 'Brusha', text: 'Then keep doing it. I will show the others where to stand.' }
    ]},
    { name: 'Off Center', lines: [
      { who: 'Brusha', text: 'You stepped out of the spotlight.' },
      { who: 'Dandy', text: 'A Twisted was behind you.' },
      { who: 'Brusha', text: 'I noticed. So did everyone who saw you stop it.' },
      { who: 'Dandy', text: 'I suppose the angle was dramatic.' },
      { who: 'Brusha', text: 'It was useful. You can be both.' }
    ]},
    { name: 'The Whole Picture', lines: [
      { who: 'Narrator', text: 'Brusha gives Dandy a small palette painted with a bright oval of light.' },
      { who: 'Dandy', text: 'You finally finished my portrait?' },
      { who: 'Brusha', text: 'Look closer.' },
      { who: 'Narrator', text: 'In the light stand the whole team. Dandy is at the front, facing outward.' },
      { who: 'Dandy', text: 'You put me in front.' },
      { who: 'Brusha', text: 'You made room for the others. I thought you might want to remember that.' },
      { who: 'Dandy', text: '...The colors are excellent.' }
    ]}
  ]
});

defCampaign({
  id: 'dandy_pebble', badge: 'dandy_pebble', a: 'Dandy', b: 'Pebble',
  recLevel: friendshipRecLevel('Dandy', 'Pebble'), title: 'The Lookout',
  stages: [
    { name: 'The Missing Bell', lines: [
      { who: 'Narrator', text: 'Dandy searches beneath the shop counter. Pebble watches from the doorway.' },
      { who: 'Dandy', text: 'Your bell was here a moment ago.' },
      { who: 'Pebble', text: 'Bworff!' },
      { who: 'Dandy', text: 'Yes, I checked the obvious place.' },
      { who: 'Narrator', text: 'Pebble trots to the hall and barks at a fallen shelf.' },
      { who: 'Dandy', text: 'Oh. You found the less obvious place.' }
    ]},
    { name: 'Stay Close', lines: [
      { who: 'Dandy', text: 'Pebble, stay behind me.' },
      { who: 'Pebble', text: 'Arf!' },
      { who: 'Narrator', text: 'Pebble darts past Dandy and barks beside an injured Toon.' },
      { who: 'Dandy', text: 'That is the opposite of what I said.' },
      { who: 'Narrator', text: 'Dandy spots a Twisted closing in and steps between them.' },
      { who: 'Dandy', text: '...And exactly where I needed to be.' }
    ]},
    { name: 'A Warning', lines: [
      { who: 'Dandy', text: 'One bark when you find trouble. Two if someone needs me.' },
      { who: 'Pebble', text: 'Bark! Bark!' },
      { who: 'Dandy', text: 'Not right now. We are rehearsing.' },
      { who: 'Narrator', text: 'Pebble stares past him. A shadow moves behind the display.' },
      { who: 'Dandy', text: '...Two barks. Understood.' }
    ]},
    { name: 'The Lookout', lines: [
      { who: 'Narrator', text: 'Pebble drops a tiny silver bell at Dandy’s feet.' },
      { who: 'Dandy', text: 'That one is yours.' },
      { who: 'Pebble', text: 'Arf.' },
      { who: 'Dandy', text: 'You want me to keep it?' },
      { who: 'Narrator', text: 'Pebble nudges the bell against Dandy’s hand.' },
      { who: 'Dandy', text: 'All right. But if it rings, I am counting on you to show me where to go.' },
      { who: 'Pebble', text: 'Bark! Bark!' },
      { who: 'Dandy', text: 'Yes. I heard you.' }
    ]}
  ]
});
