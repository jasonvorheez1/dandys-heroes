/* White-skill callouts. These are short, character-led lines rather than a
   combat log: the bubble is intentionally brief and the line is re-rolled on
   every White cast. */
'use strict';

const HERO_WHITE_DIALOGUE = {
  Astro: ['Cosmic correction!', 'Back to orbit!', 'The stars align!'],
  Scraps: ['I made this for you!', 'Hold still!', 'Crafted with care!'],
  Vee: ['Ahem. . . is it working?', 'Is this thing on?', 'Testing. . . Testing!', 'Testing 1 2 3. . .'],
  Cosmo: ['Enjoy, I made this just for you...', 'I hope this cookie is not too dry...', 'I tried my best to make this one delicious!', 'Tell me if I made it too sweet...'],
  Cocoa: ['Warm and ready!', 'Fresh from the oven!', 'Have a sweet one!'],
  Bobette: ['Nicely wrapped up for the Holidays!', 'Packaged with care!', 'Taking cover!'],
  Boxten: ['I-I think this helps!', 'Here, take this!', 'It\'s working!'],
  Brightney: ['Let\'s light it up!', 'Need a light?', 'Sparkle on!', 'Time to turn on the lights!'],
  Coal: ['Bork...Bwoof!', 'Bwoof!', 'Bworf! Bork!'],
  Connie: ['Boo!', 'You didn\'t see me coming!', 'Just passing through!'],
  Ginger: ['I decorated the cookie myself!', 'Might be a little bitter haha...', 'Quick! For you!'],
  Dyle: ['All aboard!', 'Right on schedule!', 'Express service!'],
  Gigi: ['Let\'s get going!', 'Catch me if you can!', 'Right on time!'],
  Goob: ['I\'ve got you!', 'Let\'s stick together!', 'Big hug incoming!'],
  Squirm: ['...I-I feel a bit better.', 'I-I really can\'t help it...'],
  Eggson: ['Back in my day...', 'Still got it.', 'Found one.'],
  Flyte: ['Up we go!', 'Need a lift?', 'Clear the way!'],
  Delilah: ['Smile for the camera!', 'Let\'s make this interesting!', 'A perfect little sample.'],
  Rodger: ['Fascinating.', 'The evidence is clear.', 'As I suspected.'],
  Soulvester: ['By my blade, stand firm!', 'Fear not, I have thee!', 'The line shall hold!'],
  Gourdy: ['Trick or treat!', 'A little something spooky!', 'Gotcha!'],
  Eclipse: ['Stay in the dark.', 'The night falls.', 'Shadows, gather.'],
  Sprout: ['Fresh from the garden!', 'Grow strong!', 'Here, this should help!'],
  Blot: ['!em inim A'],
  Brusha: ['Let\'s make it pretty!', 'A little polish!', 'Brush it off!'],
  Looey: ['Look out below!', 'Got it!', 'Ta-da!'],
  Rudie: ['Coming through!', 'Nyoom!', 'Watch out!'],
  Shelly: ['I\'m here for you!', 'Let\'s do this!', 'Teamwork make the dream work!', 'You can do this!', 'Did you know? Some dinosaurs had feathers?', 'Triceratops had three horns!'],
  CheerbearShelly: ['Did you know? Some dinosaurs had feathers?', 'A T. rex had tiny arms, but huge teeth!', 'Triceratops had three horns!'],
  Shrimpo: ['I DID THAT!', 'OUT OF MY WAY!', 'DON\'T THANK ME!'],
  Toodles: ['Hehehe!', 'Here I go!', 'Lucky me!'],
  Yatta: ['Gotcha!', 'Let\'s go!', 'That\'ll do it!'],
  Poppy: ['Pop goes the plan!', 'Bubble up!', 'Nice and easy!'],
  Bassie: ['A little something for you!', 'Fresh from the basket!', 'Here, have a bite!'],
  Waxwell: ['BURN! IGNITE! JOIN THE FLAME!', 'Step into the flame, and IGNITE!'],
  Tisha: ['Gotta sweep!', 'Let\'s clean this up!', 'Watch your step, the floor\'s wet!'],
  Finn: ['Swim time!', 'Making waves!', 'Hang on!'],
  RnD: ['Lights, camera, action!', 'A dazzling finish!', 'Let\'s put on a show!'],
  Teagan: ['Let\'s fix that.', 'Thank goodness.', 'That\'s more like it.'],
  Dandy: ['A splendid show!', 'Keep smiling, everyone!', 'Dandy\'s got this!'],
  MrsHolloway: ['Spirals remember...', 'Mother is here.', 'The spiral never unravels.', 'Sleep now in spectral dreams...'],
  MrHolloway: ['Stand behind me!', 'Harvest comes for all of us.', 'Not while I\'m still standing!', 'Firm as autumn roots!'],
  Glisten: ['Mirror, mirror, on the wall!', 'Simply magnificent!', 'Look at this reflection!'],
  Flutter: ['Flutter away!', 'Gentle breeze, carry us!', 'Soft wings, take flight!'],
  Pebble: ['Bark! Ruff!', 'Woof woof!', '*protective growl*']
};

const HERO_WHITE_DIALOGUE_COLLAB = new Set(['Sora', 'Riku', 'Kairi', 'Goofy', 'Phantasia']);
