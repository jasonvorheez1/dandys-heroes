/* Scraps and Poppy turn an abandoned craft room into a place worth returning to. */
'use strict';

defCampaign({
  id: 'scraps_poppy', badge: 'scraps_poppy', a: 'Scraps', b: 'Poppy',
  recLevel: friendshipRecLevel('Scraps', 'Poppy'), title: 'Made to Last',
  intro: [
    { who: 'Narrator', text: 'Poppy catches Scraps sorting bent paper and loose yarn outside the old craft room.' },
    { who: 'Poppy', text: 'Your claws are shiny! We should paint them sometime.' },
    { who: 'Scraps', text: 'I would, if wet paint did not turn my hands into a soggy project.' },
    { who: 'Poppy', text: 'Then we find a dry way. You are the craft expert, right?' },
    { who: 'Scraps', text: 'I am. And you are already reaching for my supplies.' },
    { who: 'Poppy', text: 'Only the pretty ones!' },
    { who: 'Narrator', text: 'Scraps moves the box closer instead of taking it away.' }
  ],
  stages: [
    { name: 'Color Test', lines: [
      { who: 'Narrator', text: 'After the fight, Poppy offers three jars of powder pigment and a scrap of cardboard.' },
      { who: 'Poppy', text: 'Blue for the tips, pink around the edges, and the yellow can be a tiny star!' },
      { who: 'Scraps', text: 'That is too much color for one claw.' },
      { who: 'Poppy', text: 'You have more than one claw.' },
      { who: 'Narrator', text: 'Scraps tests the powder on the cardboard. It brushes off with one swipe.' },
      { who: 'Scraps', text: 'Pretty does not help if it disappears before we leave the room.' },
      { who: 'Poppy', text: 'Okay. I will stop picking colors. You tell me what makes them stay.' },
      { who: 'Scraps', text: 'A dry sealant. And... keep the blue.' }
    ]},
    { name: 'One More Project', lines: [
      { who: 'Narrator', text: 'They pass the old craft room. Half-finished paper figures still hang from a damaged display.' },
      { who: 'Poppy', text: 'Did you make these?' },
      { who: 'Scraps', text: 'Some. Goob made the one with six arms. He was proud of every single arm.' },
      { who: 'Poppy', text: 'We could finish the display for him.' },
      { who: 'Scraps', text: 'I promised him that months ago. Then things kept getting torn up.' },
      { who: 'Poppy', text: 'It can get torn up again. We can still make it today.' },
      { who: 'Scraps', text: 'You sound sure for someone who has not seen the missing pieces.' },
      { who: 'Poppy', text: 'You have seen them. Show me where to start.' }
    ]},
    { name: 'The Leak', lines: [
      { who: 'Narrator', text: 'A pipe above the room splits during the battle. Water races along the ceiling toward the paper display.' },
      { who: 'Scraps', text: 'No, no, no. Not the paper. Not me either.' },
      { who: 'Poppy', text: 'I can catch the water for a little while!' },
      { who: 'Narrator', text: 'Poppy stretches a bubble beneath the leak. Drops gather over her head as the bubble begins to sag.' },
      { who: 'Scraps', text: 'Poppy, move! The shelf is coming down.' },
      { who: 'Poppy', text: 'If I let go, the display is gone!' },
      { who: 'Scraps', text: 'Then we lose the display. I can make another. I cannot make another you.' },
      { who: 'Narrator', text: 'Scraps grapples to Poppy and pulls her clear. The shelf crashes into the flooded floor.' }
    ]},
    { name: 'The Seam', lines: [
      { who: 'Narrator', text: 'The display lies in damp pieces. Scraps stares at the seams while Poppy wrings out her bow.' },
      { who: 'Scraps', text: 'I checked the wall, the shelf, the string. I forgot to check the ceiling.' },
      { who: 'Poppy', text: 'I saw the leak. I did not tell you until it was almost on us.' },
      { who: 'Scraps', text: 'We both thought we had to fix it alone.' },
      { who: 'Poppy', text: 'We are pretty bad at that, huh?' },
      { who: 'Narrator', text: 'Scraps lifts two dry pieces from beneath the cabinet.' },
      { who: 'Scraps', text: 'These survived. The seams can become part of the picture.' },
      { who: 'Poppy', text: 'I can hold the next piece in place. You can tell me when to let go.' }
    ]},
    { name: 'A Better Anchor', lines: [
      { who: 'Narrator', text: 'Another attack shakes the room. This time a yarn line runs from the display to a sturdy beam.' },
      { who: 'Poppy', text: 'Your line is holding! The bright bit is slipping, though.' },
      { who: 'Scraps', text: 'I see it. Give me a bubble around the corner, just the corner.' },
      { who: 'Poppy', text: 'Small bubble. Got it!' },
      { who: 'Narrator', text: 'Scraps hooks the loose piece into place while Poppy catches the falling dust.' },
      { who: 'Scraps', text: 'There. Nothing bent.' },
      { who: 'Poppy', text: 'And nobody had to be the whole shield.' },
      { who: 'Scraps', text: 'I could get used to that.' }
    ]},
    { name: 'Made to Last', lines: [
      { who: 'Narrator', text: 'The last Twisted retreats. The restored display hangs above the dry worktable, its repaired seams traced in blue and pink.' },
      { who: 'Poppy', text: 'It looks better with the seams showing.' },
      { who: 'Scraps', text: 'It looks like someone cared enough to put it back together.' },
      { who: 'Narrator', text: 'Poppy opens a small tin of quick-dry claw caps, each painted with the same colors as the display.' },
      { who: 'Poppy', text: 'For your next rescue. I tested the sealant on cardboard first.' },
      { who: 'Scraps', text: 'You listened.' },
      { who: 'Poppy', text: 'You let me help.' },
      { who: 'Scraps', text: 'Do not tell Goob I was the hard one to work with.' },
      { who: 'Poppy', text: 'I will let him guess when he sees the display.' },
      { who: 'Narrator', text: 'Scraps tries on a blue cap. It stays on when she flexes her claw.' }
    ]}
  ]
});
