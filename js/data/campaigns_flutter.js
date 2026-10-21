/* campaigns_flutter.js - Flutter and Flyte's shared scrapbook. */
'use strict';

defCampaign({
  id: 'flutter_flyte', badge: 'flutter_flyte', a: 'Flutter', b: 'Flyte',
  recLevel: friendshipRecLevel('Flutter', 'Flyte'), title: 'For the Record',
  guests: ['Cocoa', 'Bassie', 'Eggson'],
  stages: [
    { name: 'Her Version', cast: ['Flutter', 'Flyte'], guests: [], lines: [
      { who: 'Narrator', text: 'After the battle, Flutter looks through her diary.' },
      { who: 'Flyte', text: "Hey, what's Gigi been writing in there for you?" }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: 'Your diary!' }, { who: 'Narrator', text: 'Flutter hesitates, then shows him a page.' },
      { who: 'Flyte', text: 'Wait.' }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: 'I did NOT nearly get caught by that Twisted.' }, { who: 'Flutter', text: '!!!' },
      { who: 'Flyte', text: 'Flutter, you were halfway across the room!' }, { who: 'Flutter', text: '...!!!' },
      { who: 'Flyte', text: 'I had it handled!' }, { who: 'Narrator', text: 'Flutter gives him a look.' },
      { who: 'Flyte', text: 'Mostly handled.' }, { who: 'Flutter', text: '...!' }, { who: 'Flyte', text: 'Oh, shut it.' }
    ]},
    { name: 'Scrapbook', cast: ['Flutter', 'Flyte'], guests: [], lines: [
      { who: 'Narrator', text: 'After another battle, Flyte pulls out his scrapbook.' }, { who: 'Flyte', text: 'Okay. New idea.' }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: "We start keeping track together." }, { who: 'Narrator', text: 'Flutter looks interested.' },
      { who: 'Flyte', text: "Your diary has your version. I've got mine. We put both in here." }, { who: 'Flutter', text: '...!!!' },
      { who: 'Flyte', text: "Exactly!" }, { who: 'Narrator', text: 'Flutter immediately grabs the scrapbook.' },
      { who: 'Flyte', text: "Hey! I didn't say you get the whole thing!" }, { who: 'Flutter', text: '???' },
      { who: 'Flyte', text: "Fine. Our scrapbook." }, { who: 'Flutter', text: '...!' }, { who: 'Flyte', text: "You're enjoying this way too much." }
    ]},
    { name: 'Witness', cast: ['Flutter', 'Flyte', 'Cocoa'], guests: ['Cocoa'], lines: [
      { who: 'Narrator', text: 'After another encounter, Flutter immediately starts working on a page.' },
      { who: 'Flyte', text: "Hold on. You can't put that." }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: "I didn't fall." }, { who: 'Flutter', text: '!!!' }, { who: 'Flyte', text: 'I stumbled.' }, { who: 'Flutter', text: '...!!!' },
      { who: 'Flyte', text: 'Those are different things!' }, { who: 'Cocoa', text: "What's happening?" },
      { who: 'Flyte', text: 'Cocoa! Perfect. You saw it.' }, { who: 'Narrator', text: 'Cocoa pauses.' }, { who: 'Flyte', text: 'Did I fall?' },
      { who: 'Cocoa', text: 'You were on the floor.' }, { who: 'Flutter', text: '!!!' }, { who: 'Flyte', text: "That doesn't answer the question!" },
      { who: 'Narrator', text: 'Flutter happily adds something to the page.' }, { who: 'Flyte', text: "I'm surrounded by traitors." }
    ]},
    { name: 'Bassie Decides', cast: ['Flutter', 'Flyte', 'Bassie'], guests: ['Bassie'], lines: [
      { who: 'Narrator', text: 'Bassie examines their increasingly messy scrapbook.' }, { who: 'Bassie', text: "Oh! You've been adding a lot!" },
      { who: 'Flyte', text: 'Bassie, settle something.' }, { who: 'Bassie', text: 'Me?' },
      { who: 'Flyte', text: 'Flutter says she saved me twice today.' }, { who: 'Flutter', text: '...!!!' },
      { who: 'Flyte', text: 'It was ONCE.' }, { who: 'Flutter', text: '!?!!' }, { who: 'Bassie', text: "I... wasn't there." },
      { who: 'Flyte', text: "You've heard both versions." }, { who: 'Bassie', text: "That's not evidence!" },
      { who: 'Narrator', text: 'Flutter excitedly shows Bassie her page.' }, { who: 'Bassie', text: "Flutter's version does have pictures." },
      { who: 'Flyte', text: 'Bassie!' }, { who: 'Bassie', text: "I'm sorry!" }, { who: 'Flutter', text: '...!!!' },
      { who: 'Bassie', text: "Please don't make me judge these anymore." }
    ]},
    { name: 'Not Funny', cast: ['Flutter', 'Flyte'], guests: [], lines: [
      { who: 'Narrator', text: 'After a rougher battle, Flyte starts writing immediately.' }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: 'Just putting down what happened.' }, { who: 'Narrator', text: "Flutter's expression changes." },
      { who: 'Flyte', text: 'What?' }, { who: 'Narrator', text: 'She takes the scrapbook and crosses something out.' }, { who: 'Flyte', text: 'Hey!' },
      { who: 'Flyte', text: "Flutter, you got cornered. That's what happened." }, { who: 'Flutter', text: '!?!!' },
      { who: 'Flyte', text: 'And I helped you!' }, { who: 'Flutter', text: '...!!!' }, { who: 'Flyte', text: "Why are you getting mad?!" },
      { who: 'Narrator', text: 'Flutter points to the crossed-out section. Flyte reads it again.' },
      { who: 'Narrator', text: "He'd written that Flutter 'needed rescuing.'" }, { who: 'Flyte', text: '...Oh.' },
      { who: 'Narrator', text: 'Flutter folds her arms.' }, { who: 'Flyte', text: 'Okay. Bad choice of words.' }, { who: 'Flutter', text: '...' },
      { who: 'Flyte', text: 'Really bad choice.' }
    ]},
    { name: 'Eggson Remembers', cast: ['Flutter', 'Flyte', 'Eggson'], guests: ['Eggson'], lines: [
      { who: 'Narrator', text: 'Eggson has been appointed as an impartial witness.' }, { who: 'Eggson', text: 'Ah! A disagreement over historical record!' },
      { who: 'Flyte', text: "Don't call it that." }, { who: 'Eggson', text: 'Reminds me of the Great Egg Hunt of...' }, { who: 'Flyte', text: 'Eggson.' }, { who: 'Eggson', text: 'Right!' },
      { who: 'Narrator', text: 'Flutter shows him the disputed page.' }, { who: 'Eggson', text: 'Hmm.' }, { who: 'Flyte', text: 'Well?' },
      { who: 'Eggson', text: 'Flutter believes she escaped on her own. You believe you rescued her.' }, { who: 'Flyte', text: 'Yeah.' },
      { who: 'Eggson', text: 'Perhaps both are true.' }, { who: 'Flyte', text: "That's incredibly unhelpful." },
      { who: 'Eggson', text: 'Memory is not always about perfect accuracy.' }, { who: 'Flyte', text: "This is coming from the guy who told Bassie a story she doesn't even remember happening." },
      { who: 'Eggson', text: '...Excellent point.' }, { who: 'Narrator', text: 'Flutter snickers.' }, { who: 'Flyte', text: "At least he's honest." }
    ]},
    { name: 'What She Meant', cast: ['Flutter', 'Flyte'], guests: [], lines: [
      { who: 'Narrator', text: 'Flyte finds Flutter adding something to the scrapbook.' }, { who: 'Flyte', text: 'Hey.' }, { who: 'Flutter', text: '...' },
      { who: 'Flyte', text: 'About earlier...' }, { who: 'Flutter', text: '...' }, { who: 'Flyte', text: 'I know you can handle yourself.' }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: 'I mean it.' }, { who: 'Narrator', text: 'He sits beside her.' },
      { who: 'Flyte', text: 'I just worry. Then I start remembering every bad situation as one where I had to protect you.' },
      { who: 'Flyte', text: "Guess that's annoying." }, { who: 'Flutter', text: '!!!' }, { who: 'Flyte', text: 'Okay, VERY annoying.' },
      { who: 'Flyte', text: "Your version stays." }, { who: 'Flutter', text: '...!' }, { who: 'Flyte', text: "But so does mine. With 'rescued' crossed out." },
      { who: 'Narrator', text: 'Flutter considers it.' }, { who: 'Flutter', text: '...!' }, { who: 'Flyte', text: 'Deal.' }
    ]},
    { name: 'For the Record', cast: ['Flutter', 'Flyte', 'Cocoa', 'Bassie', 'Eggson'], guests: ['Cocoa', 'Bassie', 'Eggson'], lines: [
      { who: 'Narrator', text: 'After the final battle, everyone gathers around the finished scrapbook.' }, { who: 'Cocoa', text: 'This is so cute!' },
      { who: 'Bassie', text: 'You kept both versions?' }, { who: 'Flyte', text: 'Yep.' },
      { who: 'Cocoa', text: '"Flyte distracted the Twisted."' }, { who: 'Flyte', text: "Don't read hers." },
      { who: 'Cocoa', text: '"Flyte screamed and ran in the opposite direction."' }, { who: 'Flutter', text: '!!!' },
      { who: 'Flyte', text: 'I was DISTRACTING IT!' }, { who: 'Flutter', text: '...!!!' }, { who: 'Bassie', text: 'I think Flutter disagrees.' },
      { who: 'Eggson', text: 'Personally, I prefer her account.' }, { who: 'Flyte', text: 'Nobody asked you!' },
      { who: 'Narrator', text: 'Flutter turns to a blank final page.' }, { who: 'Flyte', text: 'Saving that one.' }, { who: 'Flutter', text: '...?' },
      { who: 'Flyte', text: 'For whatever happens next.' }, { who: 'Narrator', text: 'Flutter smiles.' }, { who: 'Flutter', text: '...!' },
      { who: 'Flyte', text: "Just don't make me look stupid." }, { who: 'Narrator', text: 'Flutter slowly looks at him.' }, { who: 'Flyte', text: 'Flutter.' },
      { who: 'Flutter', text: '...' }, { who: 'Flyte', text: "Don't." }, { who: 'Flutter', text: '...!!!' }, { who: 'Flyte', text: 'Oh, come on!' },
      { who: 'Cocoa', text: 'I think she already has an idea!' }, { who: 'Flyte', text: "That's exactly what I'm afraid of." }
    ]}
  ]
});

defCampaign({
  id: 'flyte_brightney', badge: 'flyte_brightney', a: 'Flyte', b: 'Brightney',
  recLevel: friendshipRecLevel('Flyte', 'Brightney'), title: 'A Steady Light',
  guests: ['Flutter', 'RnD'],
  stages: [
    { name: 'First Proper Talk', cast: ['Flyte', 'Brightney'], guests: [], lines: [
      { who: 'Narrator', text: 'Brightney adjusts her light slightly.' },
      { who: 'Brightney', text: 'Flyte, you always seem so calm even when everything’s moving fast. How do you do that?' },
      { who: 'Narrator', text: 'Flyte shrugs, wings folded neatly.' },
      { who: 'Flyte', text: 'Practice, mostly. And making sure the people I care about don’t run themselves into the ground.' },
      { who: 'Narrator', text: 'Brightney laughs softly.' },
      { who: 'Brightney', text: 'That sounds familiar. I might need to take notes.' },
      { who: 'Flyte', text: 'You’re welcome to. I already keep a mental list of who’s pushing too hard.' }
    ]},
    { name: 'Flutter Joins In', cast: ['Flyte', 'Brightney', 'Flutter'], guests: ['Flutter'], lines: [
      { who: 'Narrator', text: 'Flutter flies in with a burst of energy.' },
      { who: 'Flyte', text: 'Hey, little sis. Easy on the landings.' },
      { who: 'Narrator', text: 'Flutter bounces closer to Brightney and points at her light, then gives a thumbs-up.' },
      { who: 'Brightney', text: 'Oh—hello, Flutter. Looking for something?' },
      { who: 'Brightney', text: 'You like the glow? It’s just an old-fashioned bulb. Nothing fancy.' },
      { who: 'Narrator', text: 'Flutter nods happily.' },
      { who: 'Flyte', text: 'She means it. She doesn’t give those out often.' }
    ]},
    { name: 'Book Club Spillover', cast: ['Flyte', 'Brightney', 'RnD'], guests: ['RnD'], lines: [
      { who: 'Narrator', text: 'Razzle waves both hands.' },
      { who: 'Razzle', text: 'Brightney! We finished the last chapter early!' },
      { who: 'Dazzle', text: '(…Somehow.)' },
      { who: 'Brightney', text: 'That’s wonderful. Did you both enjoy it?' },
      { who: 'Razzle', text: 'I loved every page!' },
      { who: 'Dazzle', text: '(I… tried. It was a lot.)' },
      { who: 'Narrator', text: 'Flyte speaks quietly to Brightney.' },
      { who: 'Flyte', text: 'They’re lucky to have you running things. You make space for both of them.' },
      { who: 'Narrator', text: 'Brightney glances at him.' },
      { who: 'Brightney', text: 'Someone has to. Just like someone has to keep an eye on a certain butterfly who never slows down.' },
      { who: 'Narrator', text: 'Flutter pouts.' }
    ]},
    { name: 'Looking Out for Each Other', cast: ['Flyte', 'Brightney', 'Flutter'], guests: ['Flutter'], lines: [
      { who: 'Narrator', text: 'Flyte watches Flutter zip ahead.' },
      { who: 'Flyte', text: 'She won’t rest until she’s checked every corner twice.' },
      { who: 'Brightney', text: 'And you won’t rest until she’s safe. I see the same pattern in myself with the book club. Sometimes I forget to leave room for my own quiet.' },
      { who: 'Flyte', text: 'Then maybe we both need a reminder now and then.' },
      { who: 'Brightney', text: 'From someone who actually notices.' }
    ]},
    { name: 'A Shared Concern', cast: ['Flyte', 'Brightney', 'Flutter', 'RnD'], guests: ['Flutter', 'RnD'], lines: [
      { who: 'Narrator', text: 'Flutter lands hard, clearly frustrated.' },
      { who: 'Razzle', text: 'Whoa, someone’s having a day!' },
      { who: 'Dazzle', text: '(I don’t blame her…)' },
      { who: 'Narrator', text: 'Flyte kneels a little.' },
      { who: 'Flyte', text: 'Hey. Talk to me. Or… flap it out. Whatever works.' },
      { who: 'Narrator', text: 'Flutter sighs, then leans against him briefly.' },
      { who: 'Brightney', text: 'You’re allowed to be tired, Flutter. Even the brightest lights need a break.' },
      { who: 'Narrator', text: 'Flutter looks between them, then nods slowly.' }
    ]},
    { name: 'Honest Words', cast: ['Flyte', 'Brightney'], guests: [], lines: [
      { who: 'Narrator', text: 'After the others drift off, Brightney speaks.' },
      { who: 'Brightney', text: 'I used to think being useful was the same as being needed. Lately I’m learning they’re different.' },
      { who: 'Flyte', text: 'I used to think worrying was the same as caring. Turns out caring can look quieter than that.' },
      { who: 'Brightney', text: 'You’re good at the quiet kind.' },
      { who: 'Flyte', text: 'And you’re good at the steady kind. The kind that keeps everyone else’s pages turning.' },
      { who: 'Brightney', text: 'Then maybe we balance each other out.' }
    ]},
    { name: 'Found Circle', cast: ['Flyte', 'Brightney', 'Flutter', 'RnD'], guests: ['Flutter', 'RnD'], lines: [
      { who: 'Narrator', text: 'Flutter flies in with Razzle and Dazzle trailing behind.' },
      { who: 'Razzle', text: 'Group hang! We decided!' },
      { who: 'Dazzle', text: '(…We did?)' },
      { who: 'Narrator', text: 'Flyte is already making space.' },
      { who: 'Flyte', text: 'Looks like we have company.' },
      { who: 'Narrator', text: 'Brightney sets her light a little softer.' },
      { who: 'Brightney', text: 'Perfect timing. I was just thinking the table felt too empty.' },
      { who: 'Narrator', text: 'Flutter settles beside her brother, content.' },
      { who: 'Razzle', text: 'Best seats in the house!' },
      { who: 'Dazzle', text: '(…As long as no one expects a speech.)' },
      { who: 'Narrator', text: 'Flyte and Brightney exchange a small, knowing look—one that says they wouldn’t change a thing about this slightly chaotic, thoroughly welcome gathering.' }
    ]}
  ]
});
