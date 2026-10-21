/* campaigns_ribecca.js - Shelly and Ribecca's costume workshop story. */
'use strict';

const shellyRibeccaCampaign = defCampaign({
  id: 'shelly_ribecca', badge: 'cheerbear_shelly_ribecca', a: 'CheerbearShelly', b: 'Ribecca',
  recLevel: friendshipRecLevel('CheerbearShelly', 'Ribecca'), title: 'Cheer Bear Shelly',
  stages: [
    { name: 'Pink', cast: ['Shelly', 'Ribecca'], guests: [], lines: [
      { who: 'Narrator', text: 'Ribecca holds a piece of pink fabric against Shelly.' }, { who: 'Shelly', text: '...What are you doing?' },
      { who: 'Ribecca', text: 'Checking something.' }, { who: 'Shelly', text: 'On me?' }, { who: 'Ribecca', text: 'Mhm.' },
      { who: 'Narrator', text: 'Shelly looks down at the fabric.' }, { who: 'Shelly', text: 'Pink?' }, { who: 'Ribecca', text: "Doesn't look bad." },
      { who: 'Shelly', text: "I didn't say it did! I'm just confused!" }, { who: 'Narrator', text: 'Ribecca steps back.' },
      { who: 'Ribecca', text: "I've been wanting to make something different." }, { who: 'Shelly', text: 'A costume?' }, { who: 'Ribecca', text: 'Yeah.' },
      { who: 'Narrator', text: 'Shelly perks up.' }, { who: 'Shelly', text: 'Wait, you want ME to wear it?' }, { who: 'Ribecca', text: "That's why you're standing here." },
      { who: 'Shelly', text: 'Oh!' }, { who: 'Narrator', text: 'A beat.' }, { who: 'Shelly', text: "Sorry, I just didn't think you were asking me!" },
      { who: 'Ribecca', text: 'Well, I am.' }, { who: 'Shelly', text: 'Then absolutely!' }
    ]},
    { name: 'The Idea', cast: ['Shelly', 'Ribecca'], guests: [], lines: [
      { who: 'Narrator', text: 'Ribecca lays several pieces across a table. Shelly immediately recognizes the theme.' }, { who: 'Shelly', text: 'Wait a second.' },
      { who: 'Ribecca', text: 'What?' }, { who: 'Shelly', text: 'Pink. Rainbow...' }, { who: 'Narrator', text: 'She picks up the emblem.' },
      { who: 'Shelly', text: 'Cheer Bear?' }, { who: 'Ribecca', text: "That's the idea." }, { who: 'Shelly', text: "Oh, that's CUTE!" },
      { who: 'Narrator', text: 'Ribecca hands her another piece.' }, { who: 'Ribecca', text: "Thought it'd suit you." }, { who: 'Narrator', text: 'Shelly pauses.' },
      { who: 'Shelly', text: 'Really?' }, { who: 'Ribecca', text: "You're both pretty hard to discourage." }, { who: 'Shelly', text: 'Hehe... I guess that\'s true!' },
      { who: 'Narrator', text: 'Shelly examines one of the seams.' }, { who: 'Shelly', text: 'You could reinforce this part.' }, { who: 'Ribecca', text: 'Hm?' },
      { who: 'Shelly', text: 'I sew too, remember?' }, { who: 'Narrator', text: 'Ribecca looks at it again.' }, { who: 'Ribecca', text: '...Good catch.' },
      { who: 'Shelly', text: 'See! Now I\'m helping!' }, { who: 'Ribecca', text: "You're modeling." }, { who: 'Shelly', text: 'I can do both!' }
    ]},
    { name: 'Cheer Bear Shelly', cast: ['Shelly', 'Ribecca'], guests: [], lines: [
      { who: 'Narrator', text: 'Shelly returns wearing the finished base costume.' }, { who: 'Shelly', text: 'Okay!' },
      { who: 'Narrator', text: 'She holds her arms out.' }, { who: 'Shelly', text: 'What do you think?' }, { who: 'Narrator', text: 'Ribecca walks around her, checking the fit.' },
      { who: 'Shelly', text: "You're being really quiet." }, { who: 'Ribecca', text: "I'm looking." }, { who: 'Shelly', text: 'I know, but you could look and talk at the same time!' },
      { who: 'Ribecca', text: 'Turn.' }, { who: 'Narrator', text: 'Shelly turns. Ribecca adjusts part of the costume.' }, { who: 'Ribecca', text: 'There.' },
      { who: 'Narrator', text: 'Shelly looks into the mirror. Her excitement briefly gives way to surprise.' }, { who: 'Shelly', text: '...Woah.' },
      { who: 'Ribecca', text: 'Like it?' }, { who: 'Shelly', text: 'I look completely different.' }, { who: 'Ribecca', text: 'Is that a no?' },
      { who: 'Shelly', text: 'No! No, I like it!' }, { who: 'Narrator', text: 'She turns again.' }, { who: 'Shelly', text: "I just wasn't expecting it to look this good on me." },
      { who: 'Ribecca', text: 'I was.' }, { who: 'Narrator', text: 'Shelly looks back at her.' }, { who: 'Shelly', text: '...Oh.' }, { who: 'Ribecca', text: 'What?' },
      { who: 'Shelly', text: 'Nothing!' }, { who: 'Narrator', text: 'She turns back toward the mirror, smiling.' }
    ]},
    { name: 'Alterations', lines: [
      { who: 'Narrator', text: 'Shelly is examining the stitching.' }, { who: 'Shelly', text: 'Ribecca?' }, { who: 'Ribecca', text: 'Yeah?' },
      { who: 'Shelly', text: 'Can we change this?' }, { who: 'Narrator', text: 'Ribecca looks over.' }, { who: 'Ribecca', text: "Don't like it?" },
      { who: 'Shelly', text: "I do! I just think it'd sit better like this." }, { who: 'Narrator', text: 'Shelly folds part of the material.' },
      { who: 'Narrator', text: 'Ribecca considers it.' }, { who: 'Ribecca', text: "You're right." }, { who: 'Shelly', text: 'Really?!' }, { who: 'Ribecca', text: "You don't have to sound surprised every time." },
      { who: 'Shelly', text: "Sorry! I'm just used to people tuning me out when I get really into something." }, { who: 'Narrator', text: 'Ribecca starts undoing the stitching.' },
      { who: 'Ribecca', text: "I'm not them." }, { who: 'Narrator', text: 'Shelly goes quiet for a second. Then she sits beside her.' }, { who: 'Shelly', text: 'Okay. Hand me the thread.' }
    ]},
    { name: 'Too Much', lines: [
      { who: 'Narrator', text: 'Their alterations have become considerably more elaborate.' }, { who: 'Ribecca', text: 'Shelly.' }, { who: 'Shelly', text: 'Hm?' },
      { who: 'Ribecca', text: "What's this?" }, { who: 'Narrator', text: 'Shelly looks at the accessory she is holding.' }, { who: 'Shelly', text: 'A little ammonite!' }, { who: 'Ribecca', text: 'No.' },
      { who: 'Shelly', text: "You didn't even let me explain!" }, { who: 'Ribecca', text: "It's a Cheer Bear costume." }, { who: 'Shelly', text: 'Waaaait! Hear me out!' },
      { who: 'Narrator', text: 'Shelly holds it against the outfit.' }, { who: 'Shelly', text: 'Cheer Bear Shelly.' }, { who: 'Narrator', text: 'Ribecca looks between them.' },
      { who: 'Shelly', text: 'See?' }, { who: 'Ribecca', text: '...Smaller.' }, { who: 'Shelly', text: 'THAT\'S A YES!' }, { who: 'Ribecca', text: "It's a compromise." }, { who: 'Shelly', text: 'Still counts!' }
    ]},
    { name: "Shelly's Version", lines: [
      { who: 'Narrator', text: 'Ribecca finishes attaching a much smaller fossil detail.' }, { who: 'Shelly', text: 'There!' }, { who: 'Ribecca', text: 'Happy?' }, { who: 'Shelly', text: 'Mhm!' },
      { who: 'Narrator', text: 'Shelly looks over the costume.' }, { who: 'Shelly', text: 'I was worried changing it would ruin your design.' }, { who: 'Ribecca', text: 'Why?' },
      { who: 'Shelly', text: 'Because you made it.' }, { who: 'Ribecca', text: 'For you.' }, { who: 'Narrator', text: 'Shelly pauses.' },
      { who: 'Ribecca', text: "You're the one wearing it. You should actually like wearing it." }, { who: 'Shelly', text: 'I already liked it!' }, { who: 'Ribecca', text: 'You know what I mean.' },
      { who: 'Shelly', text: '...Yeah.' }, { who: 'Narrator', text: 'She looks at the little fossil detail.' }, { who: 'Shelly', text: 'Now it feels like something we made.' },
      { who: 'Narrator', text: 'Ribecca smiles.' }, { who: 'Ribecca', text: 'Better.' }
    ]},
    { name: 'Another One', lines: [
      { who: 'Narrator', text: 'Ribecca finds Shelly sketching something.' }, { who: 'Ribecca', text: "What's that?" }, { who: 'Shelly', text: 'Nothing!' },
      { who: 'Ribecca', text: 'Shelly.' }, { who: 'Shelly', text: "It's not finished!" }, { who: 'Narrator', text: 'Ribecca waits.' },
      { who: 'Narrator', text: 'Shelly reluctantly shows her. It is another costume concept.' }, { who: 'Ribecca', text: 'You made this?' }, { who: 'Shelly', text: 'Mhm.' },
      { who: 'Ribecca', text: "It's good." }, { who: 'Shelly', text: 'Really?!' }, { who: 'Ribecca', text: 'There you go again.' }, { who: 'Shelly', text: 'Sorry!' },
      { who: 'Narrator', text: 'Ribecca points at part of the sketch.' }, { who: 'Ribecca', text: "This wouldn't work." }, { who: 'Shelly', text: 'Why not?' },
      { who: 'Narrator', text: 'Ribecca sits beside her.' }, { who: 'Ribecca', text: "I'll show you." }, { who: 'Narrator', text: 'Shelly immediately scoots closer.' }, { who: 'Shelly', text: 'Okay!' }
    ]},
    { name: 'Keep It', lines: [
      { who: 'Narrator', text: 'Ribecca finds Shelly wearing the Cheer Bear look again.' }, { who: 'Ribecca', text: "You're still wearing it." }, { who: 'Shelly', text: 'Of course!' },
      { who: 'Ribecca', text: "Thought you'd be tired of it by now." }, { who: 'Shelly', text: 'Why would I be?' }, { who: 'Narrator', text: 'Shelly turns around.' },
      { who: 'Shelly', text: "It's cute, it's comfortable, and I helped make it!" }, { who: 'Ribecca', text: 'Fair.' }, { who: 'Shelly', text: 'Besides, people keep noticing it.' },
      { who: 'Narrator', text: 'Ribecca catches the slight change in her voice.' }, { who: 'Ribecca', text: 'You like that.' }, { who: 'Shelly', text: 'Well...' },
      { who: 'Narrator', text: 'Shelly fidgets with the costume.' }, { who: 'Shelly', text: "It's nice when somebody notices." }, { who: 'Narrator', text: 'Ribecca looks at her for a moment.' },
      { who: 'Ribecca', text: 'I noticed.' }, { who: 'Narrator', text: 'Shelly looks up.' }, { who: 'Shelly', text: '...Yeah.' }, { who: 'Narrator', text: 'A small smile.' },
      { who: 'Shelly', text: 'You did.' }, { who: 'Narrator', text: "Ribecca picks up Shelly's sketch from earlier." }, { who: 'Ribecca', text: 'Now, are we fixing this disaster or not?' },
      { who: 'Shelly', text: 'HEY!' }, { who: 'Narrator', text: 'Shelly hurries over.' }, { who: 'Shelly', text: 'It is NOT a disaster!' }, { who: 'Ribecca', text: 'This seam says otherwise.' }, { who: 'Shelly', text: 'Okay, okay! Show me!' }
    ]}
  ]
});

/* The first three chapters are the regular Shelly preparing for the costume.
   Cheer Bear Shelly becomes the speaking character beginning with Alterations
   (chapter four), while the campaign itself remains hers for progression and
   badge ownership. */
shellyRibeccaCampaign.stages.forEach((stage, index) => {
  if (index < 3) return;
  stage.lines.forEach(line => {
    if (line.who === 'Shelly') line.who = 'CheerbearShelly';
  });
});

defCampaign({
  id: 'ribecca_scraps', badge: 'ribecca_scraps', a: 'Ribecca', b: 'Scraps',
  recLevel: friendshipRecLevel('Ribecca', 'Scraps'), title: 'Ribecca & Scraps',
  guests: ['Shelly'],
  stages: [
    { name: 'Materials', cast: ['Ribecca', 'Scraps'], guests: [], lines: [
      { who: 'Narrator', text: 'After the battle, Scraps stops when she notices Ribecca examining some discarded fabric.' },
      { who: 'Scraps', text: 'Hey, I saw that first.' }, { who: 'Ribecca', text: 'Did you?' }, { who: 'Scraps', text: 'Mhm.' },
      { who: 'Narrator', text: 'Ribecca holds it out.' }, { who: 'Ribecca', text: 'Then take it.' }, { who: 'Narrator', text: 'Scraps pauses.' },
      { who: 'Scraps', text: '...Really?' }, { who: 'Ribecca', text: "Sure. I've got enough." },
      { who: 'Narrator', text: 'Scraps takes it and examines the pattern.' }, { who: 'Scraps', text: "What're you making?" }, { who: 'Ribecca', text: 'Costume.' },
      { who: 'Narrator', text: 'Scraps immediately looks interested.' }, { who: 'Scraps', text: 'For who?' }, { who: 'Narrator', text: 'Ribecca looks down the hall.' },
      { who: 'Ribecca', text: "Haven't decided yet." }, { who: 'Scraps', text: "That's backwards." }, { who: 'Ribecca', text: 'I like figuring it out as I go.' },
      { who: 'Narrator', text: 'Scraps smiles.' }, { who: 'Scraps', text: 'Oh. Me too.' }
    ]},
    { name: 'Volunteer', cast: ['Ribecca', 'Scraps', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'Another battle ends. Shelly catches the two comparing materials.' }, { who: 'Shelly', text: 'Ooh! Are you two making something?' },
      { who: 'Scraps', text: 'Costume.' }, { who: 'Shelly', text: 'Really?!' }, { who: 'Ribecca', text: 'Interested?' },
      { who: 'Shelly', text: 'In the costume or helping?' }, { who: 'Ribecca', text: 'Either.' }, { who: 'Shelly', text: 'Both!' },
      { who: 'Narrator', text: 'Ribecca looks at Scraps.' }, { who: 'Ribecca', text: 'Guess we found our model.' },
      { who: 'Shelly', text: "Wait, I'M wearing it?" }, { who: 'Scraps', text: 'You said both.' },
      { who: 'Shelly', text: "I know! I just didn't think you'd say yes that fast!" }, { who: 'Ribecca', text: 'Too late now.' },
      { who: 'Narrator', text: 'Shelly laughs.' }, { who: 'Shelly', text: "Okay! I'm in." }
    ]},
    { name: 'The Idea', cast: ['Ribecca', 'Scraps', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'After the next floor, Ribecca starts sketching.' }, { who: 'Ribecca', text: 'Something prehistoric.' },
      { who: 'Narrator', text: 'Shelly immediately lights up.' }, { who: 'Shelly', text: 'Seriously?!' }, { who: 'Ribecca', text: "Figured you'd like that." },
      { who: 'Shelly', text: "Okay, because there's a LOT we could do. We could go Paleozoic, Mesozoic, Cenozoic..." },
      { who: 'Scraps', text: 'Mesozoic.' }, { who: 'Shelly', text: 'You picked that really fast.' }, { who: 'Scraps', text: 'Dinosaurs.' },
      { who: 'Shelly', text: "Not everything from the Mesozoic was a dinosaur!" }, { who: 'Scraps', text: 'I know.' }, { who: 'Shelly', text: 'Really?' },
      { who: 'Scraps', text: "You've told me." }, { who: 'Narrator', text: 'Shelly pauses.' }, { who: 'Shelly', text: '...Oh.' },
      { who: 'Narrator', text: 'Ribecca quietly continues sketching.' }, { who: 'Ribecca', text: 'Keep going. This is useful.' },
      { who: 'Narrator', text: 'Shelly looks delighted.' }
    ]},
    { name: 'Different Ideas', cast: ['Ribecca', 'Scraps'], guests: [], lines: [
      { who: 'Narrator', text: 'After another battle, Scraps lays several pieces beside Ribecca\'s sketch.' }, { who: 'Scraps', text: 'I made these!' },
      { who: 'Narrator', text: 'Ribecca picks one up.' }, { who: 'Ribecca', text: 'Nice.' }, { who: 'Scraps', text: 'I thought they could go around the shoulders.' },
      { who: 'Ribecca', text: 'Hm.' }, { who: 'Scraps', text: 'What?' }, { who: 'Ribecca', text: 'I was keeping that part simple.' }, { who: 'Scraps', text: 'Why?' },
      { who: 'Ribecca', text: 'Because the rest already has a lot going on.' }, { who: 'Narrator', text: 'Scraps looks at the costume.' },
      { who: 'Scraps', text: 'I think it needs more.' }, { who: 'Ribecca', text: "I think it'll look crowded." }, { who: 'Scraps', text: 'I like crowded.' },
      { who: 'Ribecca', text: 'I noticed.' }, { who: 'Narrator', text: "Scraps' tail flicks." }, { who: 'Scraps', text: 'Is that bad?' },
      { who: 'Ribecca', text: "Didn't say that." }, { who: 'Narrator', text: 'A pause.' }, { who: 'Scraps', text: "Didn't sound good either." }
    ]},
    { name: 'Not an Assistant', cast: ['Ribecca', 'Scraps'], guests: [], lines: [
      { who: 'Narrator', text: 'The next battle ends. Scraps has gone quiet.' }, { who: 'Ribecca', text: "You haven't touched anything." },
      { who: 'Scraps', text: "Didn't want to mess up your design." }, { who: 'Ribecca', text: 'Our design.' }, { who: 'Scraps', text: "Doesn't really feel like mine." },
      { who: 'Narrator', text: 'Ribecca looks at her.' }, { who: 'Scraps', text: 'Every time I add something, you take it off.' }, { who: 'Ribecca', text: "Because some of it doesn't work." },
      { who: 'Scraps', text: "Then why'd you ask me to help?" }, { who: 'Ribecca', text: 'Because I like your work.' }, { who: 'Scraps', text: "You don't use any of it!" },
      { who: 'Narrator', text: 'Ribecca pauses. That lands harder than Scraps expected.' }, { who: 'Scraps', text: "...I'm gonna go find more material." },
      { who: 'Narrator', text: 'She leaves. Ribecca looks down at the unfinished costume.' }
    ]},
    { name: 'Shelly', cast: ['Ribecca', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'Shelly finds Ribecca working alone after the next battle.' }, { who: 'Shelly', text: "Where's Scraps?" },
      { who: 'Ribecca', text: 'Looking for supplies.' }, { who: 'Shelly', text: 'Still?' }, { who: 'Narrator', text: "Ribecca doesn't answer." },
      { who: 'Narrator', text: 'Shelly looks at the costume.' }, { who: 'Shelly', text: 'You took her shoulder pieces off.' }, { who: 'Ribecca', text: 'They were too much.' },
      { who: 'Shelly', text: 'I liked them.' }, { who: 'Narrator', text: 'Ribecca looks up.' }, { who: 'Shelly', text: "Sorry! It's your costume." }, { who: 'Ribecca', text: "No. That's the problem." },
      { who: 'Narrator', text: 'Shelly waits.' }, { who: 'Ribecca', text: 'I asked her to work with me, then kept treating it like she was helping with mine.' },
      { who: 'Shelly', text: 'Oh.' }, { who: 'Ribecca', text: 'Yeah.' }, { who: 'Narrator', text: 'Shelly sits beside her.' },
      { who: 'Shelly', text: "For what it's worth, I like both of your stuff." }, { who: 'Ribecca', text: "That's diplomatic." }, { who: 'Shelly', text: 'I mean it!' },
      { who: 'Ribecca', text: 'I know.' }, { who: 'Narrator', text: "Ribecca picks up one of Scraps' discarded pieces." },
      { who: 'Ribecca', text: 'Think we can make this work?' }, { who: 'Narrator', text: 'Shelly smiles.' }, { who: 'Shelly', text: 'Definitely.' }
    ]},
    { name: 'Try That Again', cast: ['Ribecca', 'Scraps', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'After another encounter, Scraps returns with more scraps of fabric.' },
      { who: 'Narrator', text: 'She notices her shoulder pieces are back on the costume.' }, { who: 'Scraps', text: '...' }, { who: 'Ribecca', text: 'Too much?' },
      { who: 'Narrator', text: 'Scraps looks at her.' }, { who: 'Scraps', text: 'You put them back.' }, { who: 'Ribecca', text: 'Changed them a little.' },
      { who: 'Narrator', text: 'Scraps examines the stitching.' }, { who: 'Scraps', text: 'Shelly did this.' }, { who: 'Shelly', text: "How'd you know?!" }, { who: 'Scraps', text: 'Yours are tighter than mine.' },
      { who: 'Shelly', text: 'Oh!' }, { who: 'Narrator', text: 'Ribecca holds the costume toward Scraps.' }, { who: 'Ribecca', text: "I still don't want everything on it." },
      { who: 'Scraps', text: 'I know.' }, { who: 'Ribecca', text: "And I'm still gonna tell you when something doesn't work." }, { who: 'Scraps', text: 'I know.' },
      { who: 'Ribecca', text: 'But you get to tell me the same thing.' }, { who: 'Narrator', text: 'Scraps looks at the costume. Then points.' },
      { who: 'Scraps', text: "That part doesn't work." }, { who: 'Narrator', text: 'Ribecca looks.' }, { who: 'Ribecca', text: 'Seriously?' }, { who: 'Scraps', text: 'Mhm.' },
      { who: 'Narrator', text: 'A pause.' }, { who: 'Narrator', text: 'Ribecca removes it.' }, { who: 'Ribecca', text: 'Better?' }, { who: 'Narrator', text: 'Scraps smiles.' }, { who: 'Scraps', text: 'Better.' }
    ]},
    { name: 'Finished', cast: ['Ribecca', 'Scraps', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'The final battle ends. Shelly finally puts the completed costume on.' }, { who: 'Shelly', text: 'Okay...?' },
      { who: 'Narrator', text: 'She steps out. Scraps\' tail perks up.' }, { who: 'Scraps', text: 'Oh, I like it.' }, { who: 'Narrator', text: 'Ribecca looks her over.' },
      { who: 'Ribecca', text: 'Turn around.' }, { who: 'Narrator', text: 'Shelly does.' }, { who: 'Ribecca', text: 'Again.' }, { who: 'Shelly', text: 'Am I modeling now?' }, { who: 'Ribecca', text: 'Obviously.' },
      { who: 'Narrator', text: 'Shelly turns again.' }, { who: 'Scraps', text: 'The back needs something.' }, { who: 'Ribecca', text: "Don't." }, { who: 'Scraps', text: 'Just a little something.' },
      { who: 'Ribecca', text: 'Scraps.' }, { who: 'Scraps', text: 'Fine.' }, { who: 'Narrator', text: 'Shelly examines part of the costume.' }, { who: 'Shelly', text: 'Wait!' }, { who: 'Narrator', text: 'Both look at her.' },
      { who: 'Shelly', text: 'You kept the scale pattern!' }, { who: 'Ribecca', text: 'Your idea.' }, { who: 'Shelly', text: 'And the shoulder pieces!' }, { who: 'Scraps', text: 'Mine.' },
      { who: 'Narrator', text: 'Shelly notices the stitching.' }, { who: 'Shelly', text: 'And I did that!' }, { who: 'Ribecca', text: "So I guess it's all three of ours." },
      { who: 'Narrator', text: 'Shelly goes quiet for a second.' }, { who: 'Scraps', text: 'Shelly?' }, { who: 'Shelly', text: 'Sorry. I just...' },
      { who: 'Narrator', text: 'She looks at the costume again.' }, { who: 'Shelly', text: 'I really like that.' }, { who: 'Narrator', text: 'Ribecca adjusts one small piece.' },
      { who: 'Ribecca', text: "Good. You're the one wearing it." }, { who: 'Scraps', text: 'Can we make another?' }, { who: 'Ribecca', text: 'Already?' }, { who: 'Scraps', text: 'Mhm.' }, { who: 'Ribecca', text: 'Sure.' },
      { who: 'Shelly', text: 'Can I pick the theme?!' }, { who: 'Ribecca', text: 'Depends.' }, { who: 'Shelly', text: 'Cambrian.' }, { who: 'Narrator', text: 'Scraps stares at her.' },
      { who: 'Scraps', text: "What's Cambrian?" }, { who: 'Narrator', text: "Shelly's eyes widen." }, { who: 'Shelly', text: "You don't know?!" },
      { who: 'Narrator', text: 'Ribecca immediately starts gathering the supplies.' }, { who: 'Ribecca', text: "We've got time." },
      { who: 'Shelly', text: "Okay, so the Cambrian Explosion was around five hundred and thirty eight million years ago and it's REALLY important because..." },
      { who: 'Narrator', text: 'Scraps settles in beside her.' }, { who: 'Scraps', text: "I'm listening." }, { who: 'Narrator', text: 'Shelly pauses for just a moment. Then smiles.' }, { who: 'Shelly', text: 'Okay!' }
    ]}
  ]
});
