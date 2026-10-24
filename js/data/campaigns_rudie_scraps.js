/* Rudie and Scraps make a path of handmade stars through a dark floor. */
'use strict';

defCampaign({
  id: 'rudie_scraps', badge: 'rudie_scraps', a: 'Rudie', b: 'Scraps',
  recLevel: friendshipRecLevel('Rudie', 'Scraps'), title: 'A Star to Follow',
  intro: [
    { who: 'Narrator', text: 'Rudie skids to a stop at Scraps’s worktable. She is cutting a yellow paper star.' },
    { who: 'Rudie', text: 'Happy holidays! Can you make enough of those to fill the whole hallway?' },
    { who: 'Scraps', text: 'I have made one. You almost blew it off the table.' },
    { who: 'Rudie', text: 'One is a start! I want everyone to find their way back when the lights go out.' },
    { who: 'Scraps', text: 'Then start by holding this one carefully.' },
    { who: 'Narrator', text: 'Rudie cups the star between his hooves and, for once, stays still.' }
  ],
  stages: [
    { name: 'The First Star', lines: [
      { who: 'Narrator', text: 'When the corridor is clear, Scraps pins the first star beside an unlit doorway.' },
      { who: 'Rudie', text: 'It looks like a tiny sun! We should put one at every turn.' },
      { who: 'Scraps', text: 'I am stitching foil to the edges. Your nose will light it when we pass.' },
      { who: 'Rudie', text: 'I can carry them while you stitch!' },
      { who: 'Scraps', text: 'You can carry five. They are not snowflakes to scatter.' },
      { who: 'Rudie', text: 'Five presents coming right up!' },
      { who: 'Scraps', text: 'Route markers, Rudie.' },
      { who: 'Rudie', text: 'A safe way home is a pretty good present.' }
    ]},
    { name: 'Scattered', lines: [
      { who: 'Narrator', text: 'Rudie charges ahead after the next fight. A gust lifts the loose stars from his antlers.' },
      { who: 'Rudie', text: 'I can catch them!' },
      { who: 'Narrator', text: 'He catches one. The others slide under a locked security grate.' },
      { who: 'Rudie', text: 'Sorry. You can make more, though. Right?' },
      { who: 'Scraps', text: 'I can. That does not give me back the time I spent on those.' },
      { who: 'Rudie', text: 'I did not mean to lose them.' },
      { who: 'Scraps', text: 'I know. You were already thinking about where to run next.' },
      { who: 'Narrator', text: 'Rudie looks at the one star still caught against his hoof.' }
    ]},
    { name: 'Names on the Back', lines: [
      { who: 'Narrator', text: 'Scraps unfolds a fresh star. There is a name written on its back.' },
      { who: 'Rudie', text: 'Goob. This one is for Goob?' },
      { who: 'Scraps', text: 'He gets nervous in the dark. I thought he might look for my handwriting.' },
      { who: 'Rudie', text: 'I thought the stars were for everyone. I did not know each one was for someone.' },
      { who: 'Scraps', text: 'They can be both.' },
      { who: 'Rudie', text: 'That is why I keep calling it Christmas. I want everyone to have a reason to smile today.' },
      { who: 'Scraps', text: 'Then help me write the names before we hang another one.' },
      { who: 'Rudie', text: 'And this time I will remember who I am carrying.' }
    ]},
    { name: 'The Bell Line', lines: [
      { who: 'Narrator', text: 'Scraps threads each new star onto a long length of yarn. Rudie holds one end between his antlers.' },
      { who: 'Rudie', text: 'If I run, the whole line comes with me.' },
      { who: 'Scraps', text: 'Exactly why you are walking.' },
      { who: 'Rudie', text: 'Walking. I remember how.' },
      { who: 'Narrator', text: 'He takes three careful steps. A tiny bell on his strap rings with each one.' },
      { who: 'Scraps', text: 'That bell gives me a place to aim my grapple if the lights fail.' },
      { who: 'Rudie', text: 'And the yarn will show everyone the turn. We made a team plan!' },
      { who: 'Scraps', text: 'Keep walking and it might even work.' }
    ]},
    { name: 'Lights Out', lines: [
      { who: 'Narrator', text: 'The next battle cuts the power. Rudie’s red nose catches the foil on the nearest stars.' },
      { who: 'Rudie', text: 'Scraps? I can hear the bell. Are you still there?' },
      { who: 'Scraps', text: 'I am at the other end. The line caught on the grate.' },
      { who: 'Rudie', text: 'I could charge back and break it open!' },
      { who: 'Scraps', text: 'You would tear every star off the wall. Hold still. Let me come to you.' },
      { who: 'Narrator', text: 'Scraps follows the bell, grapples across the gap, and unhooks the yarn by hand.' },
      { who: 'Rudie', text: 'You found me.' },
      { who: 'Scraps', text: 'You stayed where I could.' },
      { who: 'Narrator', text: 'Rudie leads them onward at a walk. The stars lift and settle behind him.' }
    ]},
    { name: 'A Star to Follow', lines: [
      { who: 'Narrator', text: 'The final fight ends. The restored lights reveal a line of stars pointing toward the elevator.' },
      { who: 'Rudie', text: 'Every name is still there! Even the one for Goob.' },
      { who: 'Scraps', text: 'You kept the yarn taut all the way back.' },
      { who: 'Rudie', text: 'Best delivery I ever made without running.' },
      { who: 'Narrator', text: 'Scraps takes the little bell from Rudie’s strap, stitches a paper star around its loop, and gives it back.' },
      { who: 'Scraps', text: 'A marker for you. If we get separated again, I will know where to find you.' },
      { who: 'Rudie', text: 'Can I ring it when I bring the next batch?' },
      { who: 'Scraps', text: 'As long as the next batch arrives in one piece.' },
      { who: 'Rudie', text: 'Deal. Happy holidays, Scraps.' },
      { who: 'Scraps', text: 'Happy holidays, Rudie.' }
    ]}
  ]
});
