/* banter.js - short in-character exchanges that can surface between floors
   of the Depths when the right Toons happen to be on the team together.
   Each entry's `cast` is the exact set of Heroes required (all of them, no
   substitutes) - see Banter.rollFor() in meta/modes.js for the trigger and
   selection logic, and screens/depths.js for where it actually gets shown.

   Voice reference for each character (personality, speech quirks, what NOT
   to do) lives in ../../CHARACTER_VOICES.md at the project root - read that
   before adding anyone new. One quirk worth calling out here since it's not
   optional: Blot's lines are written as his INTENDED sentence with the
   whole string reversed character-by-character (not word order - literally
   every character back to front, punctuation included). Write the real
   sentence first, then reverse it; don't try to write backwards-sounding
   English by hand. */
'use strict';

const BANTER = [
  {
    id: 'gourdy-holloway-family',
    cast: ['Gourdy', 'MrsHolloway', 'MrHolloway'],
    lines: [
      { who: 'Gourdy', text: 'Mama! Papa! You\'re really both walking with me?!' },
      { who: 'MrsHolloway', text: 'Always, my sweet pumpkin. Even through the darkest spirals, Mother never left.' },
      { who: 'MrHolloway', text: 'Keep close behind me, Gourdy. Nothing in these Depths gets past your old man.' },
      { who: 'Gourdy', text: 'I kept my locket safe the whole time! See? Inside is our family portrait!' },
      { who: 'MrHolloway', text: 'You did good, son. A real Holloway stands tall.' },
      { who: 'MrsHolloway', text: 'And now our family stands together again. Look ahead, little one!' }
    ]
  },
  {
    id: 'gourdy-soulvester-eclipse',
    cast: ['Gourdy', 'Soulvester', 'Eclipse'],
    lines: [
      { who: 'Eclipse', text: 'Okay, everybody! Next floor! Who is ready?!' },
      { who: 'Gourdy', text: 'I am, Miss Eclipse!' },
      { who: 'Soulvester', text: "You needn't shout. We are all quite close." },
      { who: 'Eclipse', text: 'I know! I am excited!' },
      { who: 'Gourdy', text: 'Mr. Soulvester, are you ever excited?' },
      { who: 'Soulvester', text: 'Of course.' },
      { who: 'Gourdy', text: 'Really?' },
      { who: 'Soulvester', text: 'I am presently excited about getting you both through this floor alive.' },
      { who: 'Eclipse', text: 'See?! He is excited!' },
      { who: 'Soulvester', text: 'That is not quite what I said.' },
      { who: 'Gourdy', text: 'I think it counts.' },
      { who: 'Soulvester', text: 'Then I shall allow it.' },
      { who: 'Eclipse', text: 'YES! Team excitement!' }
    ]
  },
  {
    id: 'gourdy-soulvester',
    cast: ['Gourdy', 'Soulvester'],
    lines: [
      { who: 'Gourdy', text: 'Mr. Soulvester?' },
      { who: 'Soulvester', text: 'Yes?' },
      { who: 'Gourdy', text: 'Why do you always walk behind me?' },
      { who: 'Soulvester', text: 'So that I may keep watch.' },
      { who: 'Gourdy', text: 'You have been keeping watch for three floors.' },
      { who: 'Soulvester', text: 'And?' },
      { who: 'Gourdy', text: 'And I think you can stop now.' },
      { who: 'Soulvester', text: 'I could.' },
      { who: 'Gourdy', text: "But you won't." },
      { who: 'Soulvester', text: 'No.' },
      { who: 'Gourdy', text: '...Okay.' },
      { who: 'Soulvester', text: 'You may walk beside me, if that is preferable.' },
      { who: 'Gourdy', text: 'That would be nice.' },
      { who: 'Soulvester', text: 'Very well. Stay close.' },
      { who: 'Gourdy', text: 'You really do worry a lot.' },
      { who: 'Soulvester', text: 'Someone must.' }
    ]
  },
  {
    id: 'soulvester-connie',
    cast: ['Soulvester', 'Connie'],
    lines: [
      { who: 'Connie', text: 'You know, for a knight, you spend an awful lot of time telling people what to do.' },
      { who: 'Soulvester', text: 'For a ghost, you spend an awful lot of time where you were not invited.' },
      { who: 'Connie', text: "That's my job." },
      { who: 'Soulvester', text: 'I do not believe haunting is a job.' },
      { who: 'Connie', text: "It is when you're good at it." },
      { who: 'Soulvester', text: 'You are insufferable.' },
      { who: 'Connie', text: "And you're still doing the knight voice." },
      { who: 'Soulvester', text: 'It is not a "knight voice."' },
      { who: 'Connie', text: 'You just did it again.' },
      { who: 'Soulvester', text: 'I was speaking normally.' },
      { who: 'Connie', text: 'Sure, Soul.' },
      { who: 'Soulvester', text: 'Do not call me that.' },
      { who: 'Connie', text: 'Sure, Soulvester.' },
      { who: 'Soulvester', text: '...You are doing this deliberately.' },
      { who: 'Connie', text: 'Obviously.' }
    ]
  },
  {
    id: 'gigi-scraps',
    cast: ['Gigi', 'Scraps'],
    lines: [
      { who: 'Gigi', text: 'Scraps.' },
      { who: 'Scraps', text: 'No.' },
      { who: 'Gigi', text: "I didn't even ask anything!" },
      { who: 'Scraps', text: 'You were about to.' },
      { who: 'Gigi', text: 'Okay, fine. Have you seen my little blue button?' },
      { who: 'Scraps', text: 'The one you took from me yesterday?' },
      { who: 'Gigi', text: 'I prefer "found."' },
      { who: 'Scraps', text: 'It was sewn onto my dress.' },
      { who: 'Gigi', text: "And now it's part of my collection." },
      { who: 'Scraps', text: "You can't collect everything you see." },
      { who: 'Gigi', text: 'I can try.' },
      { who: 'Scraps', text: "That's exactly what I'm worried about." },
      { who: 'Gigi', text: "You make it sound like I'm a problem." },
      { who: 'Scraps', text: 'You are a problem.' },
      { who: 'Gigi', text: 'A fun problem.' },
      { who: 'Scraps', text: '...A fun problem.' }
    ]
  },
  {
    id: 'rodger-scraps',
    cast: ['Rodger', 'Scraps'],
    lines: [
      { who: 'Scraps', text: 'Rodger, can I ask you something?' },
      { who: 'Rodger', text: 'Certainly.' },
      { who: 'Scraps', text: 'If I borrowed something and forgot I borrowed it, does that still count as borrowing?' },
      { who: 'Rodger', text: 'Interesting.' },
      { who: 'Scraps', text: 'Why did you say it like that?' },
      { who: 'Rodger', text: 'Because I suspect there is more to this question.' },
      { who: 'Scraps', text: "There isn't." },
      { who: 'Rodger', text: 'What did you borrow?' },
      { who: 'Scraps', text: 'Nothing.' },
      { who: 'Rodger', text: 'From whom?' },
      { who: 'Scraps', text: '...Gigi.' },
      { who: 'Rodger', text: 'I see.' },
      { who: 'Scraps', text: "Don't make that detective face." },
      { who: 'Rodger', text: 'I have only one face.' },
      { who: 'Scraps', text: 'Exactly.' },
      { who: 'Rodger', text: 'And I would like to know what you borrowed.' },
      { who: 'Scraps', text: 'A button.' },
      { who: 'Rodger', text: 'That is rather less interesting than I expected.' }
    ]
  },
  {
    id: 'scraps-yatta',
    cast: ['Scraps', 'Yatta'],
    lines: [
      { who: 'Yatta', text: 'SCRAPS! Look what I found!' },
      { who: 'Scraps', text: "Yatta, don't run..." },
      { who: 'Yatta', text: "I'M NOT RUNNING!" },
      { who: 'Scraps', text: "You're absolutely running." },
      { who: 'Yatta', text: 'Okay, I am running a LITTLE.' },
      { who: 'Scraps', text: 'What did you find?' },
      { who: 'Yatta', text: 'A piece of ribbon!' },
      { who: 'Scraps', text: "Oh! That's actually useful." },
      { who: 'Yatta', text: "I knew it! I knew you'd like it!" },
      { who: 'Scraps', text: 'Thank you.' },
      { who: 'Yatta', text: "You're welcome! I also found a candy wrapper, a button, two coins, and something that might be a tooth." },
      { who: 'Scraps', text: "Please don't bring me the tooth." },
      { who: 'Yatta', text: 'Okay!' },
      { who: 'Scraps', text: 'Yatta.' },
      { who: 'Yatta', text: "Okay, okay! I'm throwing it away!" },
      { who: 'Scraps', text: 'Thank you.' }
    ]
  },
  {
    id: 'yatta-looey-blot',
    cast: ['Yatta', 'Looey', 'Blot'],
    lines: [
      { who: 'Yatta', text: 'Looey, can I practice my new trick?' },
      { who: 'Looey', text: 'How new?' },
      { who: 'Yatta', text: 'I made it up thirty seconds ago!' },
      { who: 'Looey', text: 'Then absolutely not.' },
      { who: 'Yatta', text: "But I haven't fallen once!" },
      { who: 'Looey', text: "That's because you haven't tried it yet." },
      { who: 'Blot', text: '.sllaw eht gnibmilc pots esaelp ,attaY' }, // "Yatta, please stop climbing the walls."
      { who: 'Yatta', text: 'Blot says I should try it!' },
      { who: 'Looey', text: 'That is NOT what he said.' },
      { who: 'Yatta', text: "He said it backwards! Maybe that's what it means!" },
      { who: 'Blot', text: '.snaem ti tahw ton si tahT' }, // "That is not what it means."
      { who: 'Looey', text: "He says that's not what it means." },
      { who: 'Yatta', text: 'Oh.' },
      { who: 'Looey', text: 'Thank you, Blot.' },
      { who: 'Blot', text: '.taht rof tnuocca ot gniog er\'eW' } // "We're going to account for that."
    ]
  },
  {
    id: 'shelly-connie',
    cast: ['Shelly', 'Connie'],
    lines: [
      { who: 'Shelly', text: 'Connie, can I ask you something?' },
      { who: 'Connie', text: "If it's about dinosaurs, I'm invisible." },
      { who: 'Shelly', text: "It's not!" },
      { who: 'Connie', text: 'Then go ahead.' },
      { who: 'Shelly', text: 'Do you ever get tired of being a ghost?' },
      { who: 'Connie', text: 'Do you ever get tired of talking about extinct animals?' },
      { who: 'Shelly', text: 'No.' },
      { who: 'Connie', text: 'Fair.' },
      { who: 'Shelly', text: 'Actually, being a ghost sounds kind of convenient.' },
      { who: 'Connie', text: 'It is.' },
      { who: 'Shelly', text: 'You can sneak into places nobody else can.' },
      { who: 'Connie', text: 'Exactly.' },
      { who: 'Shelly', text: 'You could sneak into a museum after closing.' },
      { who: 'Connie', text: "...Now you're thinking like me." },
      { who: 'Shelly', text: 'I could finally see the fossils without anybody interrupting!' },
      { who: 'Connie', text: 'I was thinking about stealing something.' },
      { who: 'Shelly', text: 'Oh.' },
      { who: 'Connie', text: "Don't look at me like that." },
      { who: 'Shelly', text: "I'm not." },
      { who: 'Connie', text: "You're absolutely looking at me like that." }
    ]
  },
  {
    id: 'shelly-yatta',
    cast: ['Shelly', 'Yatta'],
    lines: [
      { who: 'Shelly', text: 'Yatta, hold still for a second.' },
      { who: 'Yatta', text: "I'M HOLDING STILL!" },
      { who: 'Shelly', text: "You're moving." },
      { who: 'Yatta', text: "I'm holding still while moving!" },
      { who: 'Shelly', text: "That doesn't make any sense." },
      { who: 'Yatta', text: 'It does to me!' },
      { who: 'Shelly', text: 'I just want to fix this little tear.' },
      { who: 'Yatta', text: 'Oh! Are you sewing?' },
      { who: 'Shelly', text: 'Yeah. I make things sometimes.' },
      { who: 'Yatta', text: "I didn't know that!" },
      { who: 'Shelly', text: "Most people don't." },
      { who: 'Yatta', text: 'Well, I know now!' },
      { who: 'Shelly', text: '...Yeah.' },
      { who: 'Yatta', text: 'Can you teach me?' },
      { who: 'Shelly', text: "You'd have to sit still." },
      { who: 'Yatta', text: 'Oh.' },
      { who: 'Shelly', text: "That's what I thought." },
      { who: 'Yatta', text: 'I can learn!' },
      { who: 'Shelly', text: "Okay. We'll start with that." }
    ]
  }
];
