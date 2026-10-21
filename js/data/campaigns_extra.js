/* campaigns_extra.js - additional authored Friendship Campaigns. */
'use strict';

defCampaign({
  id: 'phantasia_dandy', badge: 'phantasia_dandy', a: 'Phantasia', b: 'Dandy',
  recLevel: friendshipRecLevel('Phantasia', 'Dandy'), title: 'A Star for the Shop',
  guests: ['Sora', 'Delilah'],
  stages: [
    { name: 'A Wish in the Window', lines: [
      { who: 'Narrator', text: 'Phantasia drifts into Dandy’s shop, leaving little sparks of light in her wake.' },
      { who: 'Dandy', text: 'Careful with those sparks, Phantasia. Some of the stock is rather flammable.' },
      { who: 'Phantasia', text: 'Oh! I was wishing for a star. I think one followed me inside.' },
      { who: 'Dandy', text: 'Then let’s make sure it doesn’t land on anything expensive.' }
    ]},
    { name: 'A Little Trouble', lines: [
      { who: 'Narrator', text: 'A burst of unstable magic sends a display tumbling toward the doorway.' },
      { who: 'Phantasia', text: 'I wished for everything to stay safe! Did it work?' },
      { who: 'Dandy', text: 'You gave me just enough time to catch it. That counts.' },
      { who: 'Phantasia', text: 'Good. I was worried my wish had gone sideways again.' }
    ]},
    { name: 'The Wishkeeper', lines: [
      { who: 'Dandy', text: 'Here. A little star for your collection.' },
      { who: 'Phantasia', text: 'For me? I’ll keep it safe.' },
      { who: 'Dandy', text: 'Keep it close. A bit of light helps when wishes get unpredictable.' },
      { who: 'Phantasia', text: 'Then I’ll use it to help everyone get home safely.' },
      { who: 'Narrator', text: 'The star glows softly as they leave the shop together.' }
    ]}
  ]
});

defCampaign({
  id: 'cocoa_rudie', badge: 'cocoa_rudie', a: 'Cocoa', b: 'Rudie',
  recLevel: friendshipRecLevel('Cocoa', 'Rudie'), title: 'Save It For Later',
  guests: ['Eclipse', 'Looey', 'Gourdy'],
  stages: [
    { name: 'Left Behind', lines: [
      { who: 'Narrator', text: 'After the battle, Cocoa finds a bag beneath some debris.' },
      { who: 'Cocoa', text: 'Rudie! Look at this!' }, { who: 'Rudie', text: 'Woah. Somebody left all that?' },
      { who: 'Cocoa', text: 'Looks like it.' }, { who: 'Narrator', text: 'She checks inside.' },
      { who: 'Cocoa', text: "There's actually some useful stuff in here." }, { who: 'Rudie', text: 'We should keep it!' },
      { who: 'Cocoa', text: 'Keep it?' }, { who: 'Rudie', text: 'For later.' }, { who: 'Cocoa', text: 'Hmm...' },
      { who: 'Narrator', text: 'Cocoa picks up the bag.' }, { who: 'Cocoa', text: "Let's see if anybody needs it first." },
      { who: 'Rudie', text: "That's not what I meant." }, { who: 'Cocoa', text: 'I know!' }
    ]},
    { name: 'Looey', lines: [
      { who: 'Narrator', text: 'After another battle, they find Looey.' }, { who: 'Cocoa', text: 'Looey! Need anything?' },
      { who: 'Looey', text: 'From the entire bag?' }, { who: 'Cocoa', text: 'Not the entire bag!' },
      { who: 'Rudie', text: "That's what I'm trying to prevent." }, { who: 'Cocoa', text: 'Rudie!' },
      { who: 'Narrator', text: 'Looey looks inside.' }, { who: 'Looey', text: "I'm alright. Haha... somehow." },
      { who: 'Cocoa', text: 'You sure?' }, { who: 'Looey', text: 'Yep!' }, { who: 'Narrator', text: 'Cocoa closes the bag.' },
      { who: 'Cocoa', text: 'Okay!' }, { who: 'Narrator', text: 'Rudie looks surprised.' }, { who: 'Cocoa', text: 'What?' },
      { who: 'Rudie', text: 'Nothing.' }, { who: 'Cocoa', text: "You thought I wouldn't listen!" }, { who: 'Rudie', text: 'Maybe.' }
    ]},
    { name: 'Half Empty', lines: [
      { who: 'Narrator', text: 'The next battle ends.' }, { who: 'Rudie', text: 'Cocoa.' }, { who: 'Cocoa', text: 'Hm?' },
      { who: 'Rudie', text: 'The bag.' }, { who: 'Narrator', text: 'Cocoa looks inside.' }, { who: 'Cocoa', text: 'Oh.' },
      { who: 'Rudie', text: "You've given away half of it." }, { who: 'Cocoa', text: 'They needed it!' },
      { who: 'Rudie', text: "I know. I'm just saying we might too." }, { who: 'Cocoa', text: "Then we'll find more!" },
      { who: 'Rudie', text: "What if we don't?" }, { who: 'Narrator', text: 'Cocoa pauses.' },
      { who: 'Cocoa', text: "...Then we'll figure something out." }, { who: 'Rudie', text: "That's not really a plan." },
      { who: 'Cocoa', text: "It's worked so far!" }
    ]},
    { name: 'Eclipse', lines: [
      { who: 'Narrator', text: 'A Blackout ends with another group of Twisteds defeated.' },
      { who: 'Eclipse', text: 'That was AMAZING!' }, { who: 'Rudie', text: 'You nearly ran straight past us.' },
      { who: 'Eclipse', text: 'I had a scent!' }, { who: 'Cocoa', text: 'Are you okay?' }, { who: 'Eclipse', text: 'Yeah! Why?' },
      { who: 'Narrator', text: 'Cocoa opens the bag, then notices how little remains. She closes it again.' },
      { who: 'Cocoa', text: 'Just checking.' }, { who: 'Eclipse', text: '...Okay!' }, { who: 'Narrator', text: 'Rudie notices.' },
      { who: 'Rudie', text: "You didn't give her anything." }, { who: 'Cocoa', text: "She didn't need anything." },
      { who: 'Rudie', text: 'Huh.' }, { who: 'Cocoa', text: 'Stop looking so surprised!' }
    ]},
    { name: "Rudie's Turn", lines: [
      { who: 'Narrator', text: 'After another battle, Rudie checks himself over.' }, { who: 'Cocoa', text: "You're hurt." },
      { who: 'Rudie', text: "I'm fine!" }, { who: 'Cocoa', text: 'Rudie.' }, { who: 'Rudie', text: "I've had worse!" },
      { who: 'Narrator', text: 'Cocoa holds out something from the bag.' }, { who: 'Rudie', text: 'We barely have anything left.' },
      { who: 'Cocoa', text: 'And?' }, { who: 'Rudie', text: 'Save it.' },
      { who: 'Cocoa', text: 'You were the one telling me to save things for when we needed them.' },
      { who: 'Narrator', text: 'Rudie pauses.' }, { who: 'Cocoa', text: 'Well?' },
      { who: 'Rudie', text: "...I don't like it when you use my own point against me." }, { who: 'Cocoa', text: 'Hehehe! Too bad.' }
    ]},
    { name: 'Gourdy', lines: [
      { who: 'Narrator', text: 'They find Gourdy after the next battle.' }, { who: 'Gourdy', text: 'Ms. Cocoa! Mr. Rudie!' },
      { who: 'Cocoa', text: 'Hey, Gourdy!' }, { who: 'Narrator', text: 'Gourdy notices the nearly empty bag.' },
      { who: 'Gourdy', text: 'Did you two find all that?' }, { who: 'Rudie', text: 'Cocoa found it.' },
      { who: 'Cocoa', text: "We've been sharing it." }, { who: 'Gourdy', text: "Oh! That's very nice of you!" },
      { who: 'Rudie', text: 'A little too much sharing.' }, { who: 'Cocoa', text: "We're still fine!" },
      { who: 'Gourdy', text: 'Um... I have some things too, if you need them.' }, { who: 'Narrator', text: 'Cocoa blinks.' },
      { who: 'Cocoa', text: "You're offering us stuff?" }, { who: 'Gourdy', text: 'Of course!' },
      { who: 'Rudie', text: 'See?' }, { who: 'Cocoa', text: "Don't start." }
    ]},
    { name: 'Empty', lines: [
      { who: 'Narrator', text: 'Another battle ends. Cocoa checks the bag.' }, { who: 'Cocoa', text: "...That's the last one." },
      { who: 'Rudie', text: 'Keep it.' }, { who: 'Cocoa', text: 'You need it too.' },
      { who: 'Rudie', text: "Then we'll save it until one of us actually needs it." }, { who: 'Narrator', text: 'Cocoa considers that.' },
      { who: 'Cocoa', text: 'Okay.' }, { who: 'Rudie', text: 'Really?' }, { who: 'Cocoa', text: 'What?!' },
      { who: 'Rudie', text: 'Nothing!' }, { who: 'Cocoa', text: 'I can be reasonable!' },
      { who: 'Rudie', text: "I didn't say you couldn't!" }, { who: 'Cocoa', text: 'You were thinking it.' },
      { who: 'Rudie', text: 'Maybe a little.' }, { who: 'Narrator', text: 'Cocoa bumps him with her shoulder.' }
    ]},
    { name: 'Later', lines: [
      { who: 'Narrator', text: 'The final battle ends. The last item is still in the bag.' }, { who: 'Rudie', text: 'Huh.' },
      { who: 'Cocoa', text: 'What?' }, { who: 'Rudie', text: 'We never used it.' }, { who: 'Cocoa', text: "Guess we didn't need it." },
      { who: 'Rudie', text: 'So I was right about saving it.' }, { who: 'Cocoa', text: 'And everyone we helped needed the others.' },
      { who: 'Rudie', text: 'So you were right too.' }, { who: 'Narrator', text: 'They stare at each other.' },
      { who: 'Cocoa', text: "That's boring." }, { who: 'Rudie', text: 'Very.' },
      { who: 'Narrator', text: 'Eclipse catches up with Gourdy and Looey.' }, { who: 'Eclipse', text: 'Are you two STILL arguing about that bag?!' },
      { who: 'Looey', text: "I'm starting to think they like arguing about it." }, { who: 'Cocoa', text: 'We do not!' },
      { who: 'Rudie', text: 'I kinda do.' }, { who: 'Narrator', text: 'Cocoa laughs.' },
      { who: 'Cocoa', text: 'Fine. What do we do with the last one?' }, { who: 'Narrator', text: 'Rudie thinks.' },
      { who: 'Rudie', text: 'Save it for Christmas?' }, { who: 'Narrator', text: 'Cocoa gives him a look.' },
      { who: 'Rudie', text: 'Worth a try.' }, { who: 'Cocoa', text: 'Ask me again in December.' },
      { who: 'Rudie', text: 'So tomorrow?' }, { who: 'Cocoa', text: 'Rudie.' },
      { who: 'Narrator', text: 'Rudie snickers and picks up the bag.' }
    ]}
  ]
});

defCampaign({
  id: 'bobette_cocoa', badge: 'bobette_cocoa', a: 'Bobette', b: 'Cocoa',
  recLevel: friendshipRecLevel('Bobette', 'Cocoa'), title: 'Bobette & Cocoa', guests: ['Bassie'],
  stages: [
    { name: "That's Strange", lines: [
      { who: 'Narrator', text: `After the battle, Bobette notices Cocoa leaving Bonbons around for everyone.` },
      { who: 'Bobette', text: `Cocoa!` }, { who: 'Cocoa', text: `Bobette! Want one?` }, { who: 'Bobette', text: `Of course!` },
      { who: 'Narrator', text: `Cocoa hands her a Bonbon.` }, { who: 'Bobette', text: `You always bring enough for everyone?` },
      { who: 'Cocoa', text: `I try! Someone usually needs one.` }, { who: 'Bobette', text: `That's a lot to keep track of.` },
      { who: 'Cocoa', text: `It's not that bad!` }, { who: 'Narrator', text: `Bobette thinks.` }, { who: 'Bobette', text: `Huh.` },
      { who: 'Cocoa', text: `What?` }, { who: 'Bobette', text: `Nothing!` }, { who: 'Cocoa', text: `That was a very suspicious "nothing."` },
      { who: 'Bobette', text: `I'm thinking!` }, { who: 'Cocoa', text: `Even more suspicious!` }
    ]},
    { name: 'Familiar', lines: [
      { who: 'Narrator', text: `Another battle is over. Cocoa is helping gather everyone's things.` },
      { who: 'Bobette', text: `You know, you remind me of someone.` }, { who: 'Cocoa', text: `Who?` }, { who: 'Bobette', text: `Me!` }, { who: 'Cocoa', text: `Really?!` },
      { who: 'Bobette', text: `Always helping, always running around making sure everyone has what they need...` }, { who: 'Narrator', text: `Bobette pauses.` },
      { who: 'Bobette', text: `You're practically doing a Main's job already!` }, { who: 'Cocoa', text: `Pfft! I'm just helping!` },
      { who: 'Bobette', text: `That's what I say!` }, { who: 'Cocoa', text: `Bobette, I think you just proved my point.` }, { who: 'Bobette', text: `...Oh.` },
      { who: 'Narrator', text: `Bassie, walking past, slows down.` }
    ]},
    { name: 'A Main?', lines: [
      { who: 'Narrator', text: `Bassie catches up after the next battle.` }, { who: 'Bassie', text: `Cocoa.` }, { who: 'Cocoa', text: `Oh! Hey Bassie!` },
      { who: 'Bassie', text: `What were you and Bobette talking about earlier?` }, { who: 'Cocoa', text: `She thinks I act like a Main!` },
      { who: 'Narrator', text: `Bassie goes completely still.` }, { who: 'Cocoa', text: `Isn't that funny?` }, { who: 'Bassie', text: `...She said that?` },
      { who: 'Cocoa', text: `Mhm!` }, { who: 'Narrator', text: `Bobette walks over.` },
      { who: 'Bobette', text: `I mean, look at her! She's helpful, everyone knows her, she's got merchandise...` }, { who: 'Narrator', text: `Bassie's expression changes.` },
      { who: 'Bobette', text: `Wait.` }, { who: 'Bassie', text: `Merchandise?` }, { who: 'Cocoa', text: `Bassie?` }, { who: 'Bassie', text: `I'm fine.` },
      { who: 'Bobette', text: `Bassie, I didn't mean...` }, { who: 'Bassie', text: `I said I'm fine.` }, { who: 'Narrator', text: `She walks off.` },
      { who: 'Narrator', text: `Bobette watches her.` }, { who: 'Bobette', text: `...I did it again, didn't I?` }
    ]},
    { name: 'The Theory', lines: [
      { who: 'Narrator', text: `Bobette and Cocoa walk together after another fight.` }, { who: 'Cocoa', text: `You really think I'm a Main?` },
      { who: 'Bobette', text: `Not officially.` }, { who: 'Cocoa', text: `Then I'm not one!` }, { who: 'Bobette', text: `But that's what's strange!` },
      { who: 'Cocoa', text: `What's strange?` }, { who: 'Bobette', text: `The way you're treated.` }, { who: 'Narrator', text: `Cocoa's smile fades slightly.` },
      { who: 'Bobette', text: `You have merchandise. You're popular. You're always helping everyone. If I didn't know better...` },
      { who: 'Cocoa', text: `But you do know better.` }, { who: 'Bobette', text: `I suppose.` }, { who: 'Narrator', text: `Cocoa notices Bassie standing farther away.` },
      { who: 'Cocoa', text: `Maybe we shouldn't talk about this anymore.` }, { who: 'Bobette', text: `Because of Bassie?` },
      { who: 'Narrator', text: `Cocoa doesn't answer.` }, { who: 'Bobette', text: `...Oh.` }
    ]},
    { name: 'Last I Checked', lines: [
      { who: 'Narrator', text: `After the next battle, Bassie finally approaches Bobette.` }, { who: 'Bassie', text: `Do you know something?` },
      { who: 'Bobette', text: `About what?` }, { who: 'Bassie', text: `Cocoa.` }, { who: 'Bobette', text: `I know lots about Cocoa!` }, { who: 'Bassie', text: `That's not what I mean!` },
      { who: 'Narrator', text: `Bobette falls quiet.` }, { who: 'Bassie', text: `Sorry. I...` }, { who: 'Narrator', text: `She laughs nervously.` }, { who: 'Bassie', text: `Haha... Sorry.` },
      { who: 'Bobette', text: `Bassie.` }, { who: 'Bassie', text: `You said she was practically a Main.` }, { who: 'Bobette', text: `I was joking around.` },
      { who: 'Bassie', text: `You joked about being replaced before, too.` }, { who: 'Narrator', text: `Bobette's expression drops.` }, { who: 'Bassie', text: `So I'm asking you.` },
      { who: 'Narrator', text: `A pause.` }, { who: 'Bassie', text: `Do you know something?` }, { who: 'Bobette', text: `No.` }, { who: 'Bobette', text: `I promise.` },
      { who: 'Narrator', text: `Bassie watches her carefully.` }, { who: 'Bassie', text: `...Okay.` }, { who: 'Narrator', text: `She doesn't sound convinced.` }
    ]},
    { name: 'Not Funny Anymore', lines: [
      { who: 'Narrator', text: `Bobette sits beside Cocoa after another battle.` }, { who: 'Bobette', text: `I think I messed up.` }, { who: 'Cocoa', text: `Bassie?` },
      { who: 'Narrator', text: `Bobette nods.` }, { who: 'Bobette', text: `I thought I was teasing.` }, { who: 'Cocoa', text: `She doesn't think you were.` },
      { who: 'Bobette', text: `I noticed.` }, { who: 'Cocoa', text: `She doesn't like when I help her.` }, { who: 'Bobette', text: `Really?` },
      { who: 'Cocoa', text: `She'll let other people help.` }, { who: 'Narrator', text: `Bobette's smile fades.` }, { who: 'Cocoa', text: `I don't know what I did.` },
      { who: 'Bobette', text: `Maybe you didn't do anything.` }, { who: 'Narrator', text: `Cocoa looks at her.` },
      { who: 'Bobette', text: `Sometimes people get scared of things that aren't actually trying to hurt them.` }, { who: 'Narrator', text: `Cocoa looks toward Bassie.` },
      { who: 'Cocoa', text: `...Yeah.` }
    ]},
    { name: 'The Wrong Question', lines: [
      { who: 'Narrator', text: `Bassie is struggling with something after the battle. Cocoa approaches, then stops herself.` }, { who: 'Cocoa', text: `Bassie?` },
      { who: 'Bassie', text: `What?` }, { who: 'Cocoa', text: `...` }, { who: 'Narrator', text: `Bassie braces herself.` }, { who: 'Cocoa', text: `Never mind.` },
      { who: 'Narrator', text: `Cocoa starts to leave.` }, { who: 'Bassie', text: `Wait.` }, { who: 'Narrator', text: `Cocoa turns.` }, { who: 'Bassie', text: `Weren't you going to offer to help?` },
      { who: 'Cocoa', text: `I was.` }, { who: 'Bassie', text: `Why didn't you?` }, { who: 'Cocoa', text: `Because you always say no.` }, { who: 'Narrator', text: `Bassie goes quiet.` },
      { who: 'Cocoa', text: `I don't want to bother you.` }, { who: 'Bassie', text: `You don't.` }, { who: 'Narrator', text: `Cocoa looks genuinely surprised.` },
      { who: 'Bassie', text: `I mean... you do sometimes.` }, { who: 'Cocoa', text: `Oh.` }, { who: 'Bassie', text: `That's not...` }, { who: 'Narrator', text: `Bassie closes her eyes.` },
      { who: 'Bassie', text: `Could you just help me?` }, { who: 'Cocoa', text: `Yeah!` }, { who: 'Bassie', text: `Quietly.` }, { who: 'Cocoa', text: `Thank you.` }
    ]},
    { name: 'Main Material', lines: [
      { who: 'Narrator', text: `After the final battle, Bobette finds Cocoa and Bassie together.` }, { who: 'Bobette', text: `There you two are!` }, { who: 'Cocoa', text: `Hi!` }, { who: 'Bassie', text: `Hello, Bobette.` },
      { who: 'Bobette', text: `Cocoa, I've reached my final conclusion.` }, { who: 'Narrator', text: `Bassie's shoulders immediately tense.` }, { who: 'Cocoa', text: `Bobette...` }, { who: 'Bobette', text: `You're not a Main.` },
      { who: 'Cocoa', text: `I KNOW!` }, { who: 'Bobette', text: `Let me finish!` }, { who: 'Narrator', text: `Cocoa folds her arms.` }, { who: 'Bobette', text: `I kept looking at everything you do and thinking, "That's what a Main does."` },
      { who: 'Bobette', text: `But that's silly.` }, { who: 'Cocoa', text: `Why?` }, { who: 'Bobette', text: `Because you don't help everyone because you're supposed to.` }, { who: 'Narrator', text: `Bobette smiles.` },
      { who: 'Bobette', text: `You just like helping people.` }, { who: 'Narrator', text: `Cocoa softens.` }, { who: 'Cocoa', text: `Well... yeah!` }, { who: 'Bobette', text: `So you're Cocoa.` }, { who: 'Cocoa', text: `I'm glad we solved that mystery!` },
      { who: 'Bobette', text: `And being a Main isn't something you earn by acting more like Cocoa.` }, { who: 'Bassie', text: `I never said it was.` }, { who: 'Bobette', text: `I know.` }, { who: 'Bassie', text: `...Good.` },
      { who: 'Narrator', text: `Cocoa offers Bassie a Bonbon.` }, { who: 'Bassie', text: `Is that supposed to mean something?` }, { who: 'Cocoa', text: `It means I have too many again.` },
      { who: 'Bassie', text: `...Thank you.` }, { who: 'Cocoa', text: `Anytime!` }, { who: 'Bassie', text: `Don't push it.` }, { who: 'Narrator', text: `Cocoa giggles.` },
      { who: 'Bobette', text: `You know, the three of us would make pretty good Holiday Mains together.` }, { who: 'Narrator', text: `Bassie nearly drops the Bonbon.` },
      { who: 'Bobette', text: `WAIT! NOT LIKE THAT!` }, { who: 'Cocoa', text: `BOBETTE!` }, { who: 'Bobette', text: `I MEANT AS A TEAM!` }, { who: 'Narrator', text: `Bassie starts laughing.` },
      { who: 'Bassie', text: `Hahaha... You are TERRIBLE at this!` }, { who: 'Bobette', text: `I KNOW!` }
    ]}
  ]
});

defCampaign({
  id: 'ginger_scraps', badge: 'ginger_scraps', a: 'Ginger', b: 'Scraps',
  recLevel: friendshipRecLevel('Ginger', 'Scraps'), title: 'Ginger & Scraps', guests: ['Cosmo', 'Shelly'],
  stages: [
    { name: 'Craft Class', lines: [
      { who: 'Narrator', text: `After the battle, Ginger catches Scraps carrying an armful of supplies.` }, { who: 'Ginger', text: `Oh... do you need help?` }, { who: 'Scraps', text: `Yes! Actually, perfect timing!` },
      { who: 'Narrator', text: `Scraps dumps everything onto a table.` }, { who: 'Ginger', text: `That's... a lot.` }, { who: 'Scraps', text: `I'm making a new Craft Class display!` },
      { who: 'Ginger', text: `Like the one from the show?` }, { who: 'Scraps', text: `Mhm! Except this one won't have somebody telling me what I'm allowed to make.` }, { who: 'Ginger', text: `That sounds nice.` },
      { who: 'Scraps', text: `You're helping.` }, { who: 'Ginger', text: `Me?` }, { who: 'Scraps', text: `Yeah!` }, { who: 'Ginger', text: `Oh... I didn't bring anything to eat.` }, { who: 'Scraps', text: `What does that have to do with anything?` }
    ]},
    { name: 'Not the Cookies', lines: [
      { who: 'Narrator', text: `Scraps slides a blank piece of cardboard toward Ginger.` }, { who: 'Ginger', text: `Wait... you want me to decorate?` }, { who: 'Scraps', text: `That's why I asked you!` },
      { who: 'Ginger', text: `I thought you wanted baked goods for everyone.` }, { who: 'Scraps', text: `Ginger, I've seen your cookies.` }, { who: 'Narrator', text: `Ginger shrinks slightly.` },
      { who: 'Scraps', text: `The decorations!` }, { who: 'Ginger', text: `Oh!` }, { who: 'Scraps', text: `I meant the decorations!` }, { who: 'Ginger', text: `Haha... right.` },
      { who: 'Scraps', text: `You're really good at that stuff.` }, { who: 'Ginger', text: `You think so?` }, { who: 'Scraps', text: `Obviously! Now help me before I glue something down and regret it.` },
      { who: 'Ginger', text: `Does that happen often?` }, { who: 'Scraps', text: `...No comment.` }
    ]},
    { name: 'Different Materials', lines: [
      { who: 'Narrator', text: `Ginger carefully pipes a design onto part of the display.` }, { who: 'Scraps', text: `Woah.` }, { who: 'Ginger', text: `What?` }, { who: 'Scraps', text: `How do you make your hands stay that steady?` },
      { who: 'Ginger', text: `Practice, mostly.` }, { who: 'Scraps', text: `Mine have claws.` }, { who: 'Ginger', text: `Oh.` }, { who: 'Scraps', text: `They make things complicated.` },
      { who: 'Ginger', text: `Well... yours are probably better for cutting.` }, { who: 'Narrator', text: `Scraps pauses.` }, { who: 'Scraps', text: `Huh.` }, { who: 'Narrator', text: `She slices through some paper.` },
      { who: 'Scraps', text: `You're right!` }, { who: 'Ginger', text: `And I can do the smaller details.` }, { who: 'Scraps', text: `Okay. You do tiny stuff. I do claw stuff.` }, { who: 'Ginger', text: `"Claw stuff?"` },
      { who: 'Scraps', text: `Technical term.` }, { who: 'Narrator', text: `Ginger laughs.` }
    ]},
    { name: 'Shelly', lines: [
      { who: 'Narrator', text: `Shelly discovers them working.` }, { who: 'Shelly', text: `Oh! Are you two making something?!` }, { who: 'Scraps', text: `Yep!` }, { who: 'Ginger', text: `It's for Scraps' Craft Class.` },
      { who: 'Shelly', text: `Can I see?` }, { who: 'Narrator', text: `She immediately notices the stitching.` }, { who: 'Shelly', text: `Wait, who did this part?` }, { who: 'Scraps', text: `Ginger.` }, { who: 'Ginger', text: `I only fixed it a little.` },
      { who: 'Shelly', text: `That's really clean!` }, { who: 'Ginger', text: `Oh... thank you.` }, { who: 'Shelly', text: `I've been learning to sew too!` }, { who: 'Ginger', text: `Really?` },
      { who: 'Shelly', text: `Mhm! I'm still learning, though. I kinda thought I'd be better by now...` }, { who: 'Scraps', text: `That's why you keep doing it.` }, { who: 'Narrator', text: `Shelly pauses.` },
      { who: 'Shelly', text: `...That's actually pretty good advice.` }, { who: 'Scraps', text: `I have those sometimes.` }
    ]},
    { name: 'Ruined', lines: [
      { who: 'Narrator', text: `Part of the display has collapsed.` }, { who: 'Ginger', text: `Oh no...` }, { who: 'Scraps', text: `Don't touch it.` }, { who: 'Ginger', text: `I can fix it!` }, { who: 'Scraps', text: `Ginger.` },
      { who: 'Ginger', text: `I used too much icing here and it pulled everything down.` }, { who: 'Scraps', text: `So?` }, { who: 'Ginger', text: `So I ruined it!` }, { who: 'Narrator', text: `Scraps picks up the broken section.` },
      { who: 'Scraps', text: `No you didn't.` }, { who: 'Ginger', text: `Scraps, it's in two pieces.` }, { who: 'Scraps', text: `Yeah.` }, { who: 'Narrator', text: `Scraps tears another piece of paper.` },
      { who: 'Ginger', text: `What are you doing?!` }, { who: 'Scraps', text: `Making it three.` }, { who: 'Ginger', text: `That doesn't FIX IT!` }, { who: 'Scraps', text: `Didn't say I was fixing it.` },
      { who: 'Narrator', text: `She rearranges the pieces.` }, { who: 'Scraps', text: `We're changing it.` }, { who: 'Narrator', text: `Ginger stares.` }, { who: 'Ginger', text: `...You really don't mind starting over?` }, { who: 'Scraps', text: `I mind wasting good material.` }
    ]},
    { name: "Ginger's Part", lines: [
      { who: 'Narrator', text: `Cosmo examines their rebuilt display.` }, { who: 'Cosmo', text: `Ginger, this is beautiful!` }, { who: 'Ginger', text: `Scraps made most of it.` }, { who: 'Scraps', text: `No I didn't.` },
      { who: 'Ginger', text: `You made the whole structure!` }, { who: 'Scraps', text: `And you did all of that.` }, { who: 'Narrator', text: `She points at Ginger's section.` }, { who: 'Ginger', text: `That's just decorating.` },
      { who: 'Cosmo', text: `Ginger.` }, { who: 'Narrator', text: `She looks at him.` }, { who: 'Cosmo', text: `We've talked about this.` }, { who: 'Ginger', text: `I know...` }, { who: 'Scraps', text: `Talked about what?` },
      { who: 'Cosmo', text: `She doesn't think decorating counts as art.` }, { who: 'Ginger', text: `I didn't say it DOESN'T count!` }, { who: 'Narrator', text: `Ginger goes quiet.` }, { who: 'Scraps', text: `Well, that's dumb.` },
      { who: 'Ginger', text: `Scraps!` }, { who: 'Scraps', text: `What? It is!` }
    ]},
    { name: 'Artist', lines: [
      { who: 'Narrator', text: `Ginger and Scraps are finishing the replacement section.` }, { who: 'Ginger', text: `Can I ask you something?` }, { who: 'Scraps', text: `Mhm?` }, { who: 'Ginger', text: `Why did you ask me?` },
      { who: 'Scraps', text: `To help?` }, { who: 'Narrator', text: `Ginger nods.` }, { who: 'Scraps', text: `Because I like your work.` }, { who: 'Ginger', text: `You could've asked someone better at crafts.` },
      { who: 'Scraps', text: `I didn't want someone else.` }, { who: 'Narrator', text: `Ginger looks at her.` }, { who: 'Scraps', text: `I wanted the cookie artist.` }, { who: 'Ginger', text: `Cookie artist...` },
      { who: 'Scraps', text: `Don't like it?` }, { who: 'Ginger', text: `No, I...` }, { who: 'Narrator', text: `She smiles.` }, { who: 'Ginger', text: `I think I do.` }, { who: 'Scraps', text: `Good. Because I already wrote it on the display.` }, { who: 'Ginger', text: `YOU WHAT?!` }, { who: 'Narrator', text: `Scraps grins.` }
    ]},
    { name: 'On Display', lines: [
      { who: 'Narrator', text: `The finished piece has been set up.` }, { who: 'Shelly', text: `You finished it!` }, { who: 'Scraps', text: `We finished it.` }, { who: 'Narrator', text: `Ginger notices the little label underneath.` },
      { who: 'Ginger', text: `You really wrote it...` }, { who: 'Scraps', text: `Told you.` }, { who: 'Ginger', text: `"Scraps and Ginger."` }, { who: 'Scraps', text: `Mhm.` }, { who: 'Ginger', text: `You didn't put "cookie artist."` },
      { who: 'Scraps', text: `Thought that might embarrass you.` }, { who: 'Ginger', text: `...Thank you.` }, { who: 'Cosmo', text: `Woah! It came out great!` }, { who: 'Ginger', text: `Thanks!` },
      { who: 'Narrator', text: `Cosmo pauses. Ginger pauses too.` }, { who: 'Cosmo', text: `You didn't tell everyone Scraps did most of it.` }, { who: 'Ginger', text: `I know.` }, { who: 'Cosmo', text: `Progress!` },
      { who: 'Ginger', text: `Cosmo...` }, { who: 'Narrator', text: `Scraps snickers.` }, { who: 'Shelly', text: `So are you doing another one?` }, { who: 'Scraps', text: `Probably.` }, { who: 'Ginger', text: `I'd like to.` },
      { who: 'Shelly', text: `Can I help?!` }, { who: 'Scraps', text: `Sure.` }, { who: 'Ginger', text: `Of course!` }, { who: 'Shelly', text: `YES! I've been wanting to try this prehistoric fabric pattern and I was thinking maybe we could make a Late Cretaceous theme because there are SO many options and...` },
      { who: 'Narrator', text: `Ginger listens intently. Scraps starts gathering supplies.` }, { who: 'Scraps', text: `We're gonna need a bigger table.` }
    ]}
  ]
});

defCampaign({
  id: 'brusha_tisha', badge: 'brusha_tisha', a: 'Brusha', b: 'Tisha',
  recLevel: friendshipRecLevel('Brusha', 'Tisha'), title: 'A Clean Canvas', guests: ['Finn'],
  stages: [
    { name: 'The Mess', lines: [
      { who: 'Narrator', text: 'Brusha finishes a bright stroke across a damaged wall.' }, { who: 'Brusha', text: 'Perfect!' },
      { who: 'Tisha', text: 'That is not perfect.' }, { who: 'Brusha', text: 'It is colorful.' },
      { who: 'Tisha', text: 'It is on the floor, the wall, and three crates.' }, { who: 'Brusha', text: 'That is called composition.' },
      { who: 'Tisha', text: 'That is called a mess.' }, { who: 'Brusha', text: 'You say that like it is a bad thing.' }, { who: 'Tisha', text: 'It is.' }
    ]},
    { name: 'Straight Lines', lines: [
      { who: 'Tisha', text: 'If you are going to paint a path, keep it straight.' }, { who: 'Brusha', text: 'Straight is boring.' },
      { who: 'Tisha', text: 'Straight is useful.' }, { who: 'Brusha', text: 'Useful can still be pretty.' },
      { who: 'Finn', text: 'I think it looks like a river!' }, { who: 'Tisha', text: 'It is crossing the entire hallway.' },
      { who: 'Brusha', text: 'A very determined river.' }, { who: 'Tisha', text: 'I am not arguing with paint.' },
      { who: 'Brusha', text: 'You are arguing with me.' }, { who: 'Tisha', text: 'That is different.' }
    ]},
    { name: 'Color Code', lines: [
      { who: 'Narrator', text: 'After the next battle, Tisha finds colored marks on every supply box.' }, { who: 'Tisha', text: 'What are these for?' },
      { who: 'Brusha', text: 'Organization!' }, { who: 'Tisha', text: 'You organized something?' }, { who: 'Brusha', text: 'I can organize.' },
      { who: 'Tisha', text: 'You painted the labels upside down.' }, { who: 'Brusha', text: 'The boxes are still labeled.' },
      { who: 'Tisha', text: 'That is not the defense you think it is.' }, { who: 'Brusha', text: 'But you knew what they meant.' }, { who: 'Tisha', text: '...I did.' }
    ]},
    { name: 'Too Much', lines: [
      { who: 'Brusha', text: 'Tisha, you need more color.' }, { who: 'Tisha', text: 'I need less color.' }, { who: 'Brusha', text: 'Your whole plan is gray.' },
      { who: 'Tisha', text: 'My plan is legible.' }, { who: 'Brusha', text: 'No one gets excited about legible.' }, { who: 'Tisha', text: 'The team gets home safely.' },
      { who: 'Brusha', text: 'They can do both.' }, { who: 'Tisha', text: 'Then show me.' }, { who: 'Narrator', text: 'Brusha looks at the battlefield, then at Tisha.' }, { who: 'Brusha', text: 'Challenge accepted!' }
    ]},
    { name: 'The Palette', lines: [
      { who: 'Narrator', text: "Brusha lays out four paint pots beside Tisha's carefully marked map." },
      { who: 'Brusha', text: 'Pink means safe. Blue means danger. Yellow means supplies. Purple means absolutely do not touch.' },
      { who: 'Tisha', text: 'Why would purple mean that?' }, { who: 'Brusha', text: 'Because it is a very serious color.' },
      { who: 'Tisha', text: 'That is not a system.' }, { who: 'Brusha', text: 'It is a memorable system.' },
      { who: 'Tisha', text: 'I will allow the first three.' }, { who: 'Brusha', text: 'You are keeping purple.' }, { who: 'Tisha', text: 'For emergencies.' }, { who: 'Brusha', text: 'See? You like it.' }
    ]},
    { name: 'Crossing Over', lines: [
      { who: 'Narrator', text: "A Twisted charges through Brusha's painted path and scatters the supplies." }, { who: 'Tisha', text: 'The line was supposed to keep everyone in position!' },
      { who: 'Brusha', text: 'It needs a little more impact.' }, { who: 'Tisha', text: 'It needs to be respected.' }, { who: 'Brusha', text: 'Paint does not command people.' },
      { who: 'Tisha', text: 'Neither do I.' }, { who: 'Brusha', text: 'You absolutely do.' }, { who: 'Narrator', text: 'Tisha stops.' },
      { who: 'Tisha', text: '...I am trying to help.' }, { who: 'Brusha', text: 'I know. I am trying to help too.' }
    ]},
    { name: 'The Right Place', lines: [
      { who: 'Narrator', text: 'Together, they repaint the path: bright enough to follow, clear enough to trust.' }, { who: 'Tisha', text: 'That line is too wide.' },
      { who: 'Brusha', text: 'It is visible.' }, { who: 'Tisha', text: 'It is both.' }, { who: 'Brusha', text: 'That sounds like a compliment.' }, { who: 'Tisha', text: 'Do not get used to it.' },
      { who: 'Finn', text: 'It looks like a rainbow road!' }, { who: 'Brusha', text: 'Exactly!' }, { who: 'Tisha', text: 'It is not a road.' }, { who: 'Brusha', text: 'It is now.' }
    ]},
    { name: 'A Clean Canvas', lines: [
      { who: 'Narrator', text: 'The final battle ends. The painted route leads everyone safely back through the room.' }, { who: 'Brusha', text: 'See? Color and structure.' },
      { who: 'Tisha', text: 'A useful combination.' }, { who: 'Brusha', text: 'Useful and pretty.' }, { who: 'Tisha', text: '...Useful and pretty.' }, { who: 'Brusha', text: 'You said it!' },
      { who: 'Tisha', text: 'I said it once.' }, { who: 'Brusha', text: 'I am putting it on a sign.' }, { who: 'Tisha', text: 'Do not.' },
      { who: 'Narrator', text: 'Brusha quietly adds a tiny purple mark to the corner of the map.' }, { who: 'Tisha', text: 'What does that mean?' },
      { who: 'Brusha', text: 'Absolutely do not touch.' }, { who: 'Tisha', text: 'Brusha.' }, { who: 'Brusha', text: 'Worth it.' }
    ]}
  ]
});

defCampaign({
  id: 'tisha_blot', badge: 'tisha_blot', a: 'Tisha', b: 'Blot',
  recLevel: friendshipRecLevel('Tisha', 'Blot'), title: 'Leave It', guests: ['Finn', 'Eggson'],
  stages: [
    { name: 'A Little Problem', lines: [
      { who: 'Narrator', text: 'Blot is staring at a supply cart with one broken wheel.' }, { who: 'Tisha', text: "What's wrong?" }, { who: 'Blot', text: ".nekorb s'tI" },
      { who: 'Tisha', text: "Oh. That's not too bad!" }, { who: 'Narrator', text: 'Tisha crouches beside it.' }, { who: 'Blot', text: ".ti xif ot evah t'nod uoY" },
      { who: 'Tisha', text: 'I know.' }, { who: 'Blot', text: "...ti xif ot gniog er'uoY" }, { who: 'Tisha', text: 'Yep!' }, { who: 'Narrator', text: 'Blot sighs and sits beside her.' },
      { who: 'Tisha', text: 'You can go ahead.' }, { who: 'Blot', text: ".pleh ll'I" }, { who: 'Narrator', text: 'Tisha smiles.' }, { who: 'Tisha', text: 'Knew you would.' }
    ]},
    { name: 'Not Quite', lines: [
      { who: 'Narrator', text: 'After the next battle, Tisha tests the wheel. It immediately falls off.' }, { who: 'Tisha', text: '...' }, { who: 'Blot', text: '.taerG' },
      { who: 'Tisha', text: "Don't." }, { who: 'Narrator', text: 'Blot picks it up.' }, { who: 'Tisha', text: 'I just need something to hold the axle in place.' },
      { who: 'Blot', text: '.nniF ksA' }, { who: 'Tisha', text: 'Why Finn?' }, { who: 'Blot', text: '.knuj fo tol a sah eH' }, { who: 'Tisha', text: "That's rude." },
      { who: 'Blot', text: '?gnorw I mA' }, { who: 'Narrator', text: 'Tisha pauses.' }, { who: 'Tisha', text: '...No.' }
    ]},
    { name: "Finn's Solution", lines: [
      { who: 'Narrator', text: 'Finn digs through his things.' }, { who: 'Finn', text: "Let's sea what I've got!" }, { who: 'Tisha', text: "You don't have to do that every time." },
      { who: 'Finn', text: 'Do what?' }, { who: 'Narrator', text: 'Blot looks at Tisha.' }, { who: 'Blot', text: ".mih llet t'noD" }, { who: 'Finn', text: 'Tell me what?' },
      { who: 'Tisha', text: 'Nothing.' }, { who: 'Finn', text: 'Hm...' }, { who: 'Narrator', text: 'He pulls out a small metal piece.' }, { who: 'Finn', text: 'This work?' },
      { who: 'Narrator', text: 'Tisha tries it.' }, { who: 'Tisha', text: 'Almost.' }, { who: 'Finn', text: 'So close, yet so far out to sea.' }, { who: 'Blot', text: '.eno tsal eht naht esrow saw tahT' },
      { who: 'Tisha', text: 'Much worse.' }, { who: 'Finn', text: 'Hey!' }
    ]},
    { name: 'The Argument', lines: [
      { who: 'Narrator', text: 'The wheel breaks loose again.' }, { who: 'Tisha', text: 'Ugh!' }, { who: 'Narrator', text: 'She immediately reaches for it. Blot stops her.' }, { who: 'Tisha', text: 'What?' },
      { who: 'Blot', text: '.ti evaeL' }, { who: 'Tisha', text: "We're almost done." }, { who: 'Blot', text: ".ruoh na neeb s'tI" }, { who: 'Tisha', text: 'So?' },
      { who: 'Blot', text: ".derit er'uoY" }, { who: 'Tisha', text: "I'm fine." }, { who: 'Blot', text: '.taht yas syawla uoY' }, { who: 'Narrator', text: "Tisha's expression changes." },
      { who: 'Tisha', text: '...Excuse me?' }, { who: 'Blot', text: '.ti xif nac ew retal emoC' }, { who: 'Tisha', text: "I don't leave jobs half finished." }, { who: 'Blot', text: '.od uoy ,seY' },
      { who: 'Narrator', text: 'Tisha goes quiet.' }, { who: 'Tisha', text: "What's that supposed to mean?" }, { who: 'Narrator', text: 'Blot realizes he struck something deeper.' }, { who: 'Blot', text: '...gnihtoN' }, { who: 'Tisha', text: 'Right.' }
    ]},
    { name: 'Eggson', lines: [
      { who: 'Narrator', text: 'Eggson finds Blot sitting beside the cart.' }, { who: 'Eggson', text: 'Trouble?' }, { who: 'Blot', text: '.deipuccO' }, { who: 'Eggson', text: 'Ah. Serious trouble.' },
      { who: 'Narrator', text: 'Blot gives him a look.' }, { who: 'Eggson', text: 'Would an old fellow be intruding if he sat down?' }, { who: 'Narrator', text: 'Blot shrugs. Eggson sits.' },
      { who: 'Eggson', text: 'You know, sometimes being correct and being helpful are entirely different things.' }, { who: 'Blot', text: '.wonk I' }, { who: 'Eggson', text: 'Mm.' },
      { who: 'Narrator', text: 'A pause.' }, { who: 'Blot', text: ".ti ekil dluow ehs wonk t'ndiD" }, { who: 'Eggson', text: "Perhaps you touched on something that wasn't really about you." },
      { who: 'Narrator', text: 'Blot glances down the hallway.' }, { who: 'Eggson', text: "Happens more often than you'd think." }
    ]},
    { name: 'Sorry', lines: [
      { who: 'Narrator', text: 'Tisha returns later.' }, { who: 'Blot', text: '.ahsiT' }, { who: 'Tisha', text: 'What?' }, { who: 'Blot', text: '.yrroS' }, { who: 'Narrator', text: 'That catches her off guard.' },
      { who: 'Tisha', text: 'Oh.' }, { who: 'Blot', text: ".taht ekil ti naem t'ndiD" }, { who: 'Tisha', text: 'I know.' }, { who: 'Narrator', text: 'A pause.' },
      { who: 'Tisha', text: 'Someone else used to say things like that to me.' }, { who: 'Blot', text: '?thgir ehs saW' }, { who: 'Tisha', text: 'That I could not fix everything. That I should just leave things alone sometimes.' },
      { who: 'Narrator', text: 'Blot waits.' }, { who: 'Tisha', text: '...Sometimes.' }, { who: 'Blot', text: '.hO' }, { who: 'Tisha', text: "Don't look so pleased." }
    ]},
    { name: 'Together', lines: [
      { who: 'Narrator', text: 'They return to the cart.' }, { who: 'Tisha', text: 'Okay. New rule.' }, { who: 'Blot', text: '?eluR' }, { who: 'Tisha', text: "If this doesn't work, we're done for today." }, { who: 'Blot', text: '.laeD' },
      { who: 'Narrator', text: 'They fit the wheel back into place.' }, { who: 'Narrator', text: 'Tisha slowly pushes the cart. It rolls.' }, { who: 'Tisha', text: 'Ha!' }, { who: 'Narrator', text: 'Blot applauds.' },
      { who: 'Tisha', text: "Oh, don't act surprised!" }, { who: 'Blot', text: '.reven I dluoW' }, { who: 'Narrator', text: 'The wheel squeaks loudly. They both stop.' }, { who: 'Tisha', text: '...' }, { who: 'Blot', text: '...' },
      { who: 'Tisha', text: "Don't say it." }, { who: 'Blot', text: '.gnihton dias I' }, { who: 'Tisha', text: 'Your face did.' }
    ]},
    { name: 'Leave It', lines: [
      { who: 'Narrator', text: 'The cart is still working after the final battle, although the wheel continues squeaking.' }, { who: 'Tisha', text: 'That noise is bothering me.' },
      { who: 'Narrator', text: 'Blot reaches for the wheel. Tisha stops him.' }, { who: 'Tisha', text: 'No.' }, { who: 'Narrator', text: 'Blot looks surprised.' }, { who: 'Tisha', text: 'It works.' },
      { who: 'Blot', text: '.seY' }, { who: 'Tisha', text: "So we're leaving it." }, { who: 'Narrator', text: 'Blot looks almost impressed.' }, { who: 'Tisha', text: "Don't." },
      { who: 'Blot', text: '.gnihton dias I' }, { who: 'Tisha', text: 'Again. Your face.' }, { who: 'Narrator', text: 'Finn and Eggson approach.' }, { who: 'Finn', text: 'Hey! You fixed it!' },
      { who: 'Tisha', text: 'Mostly.' }, { who: 'Finn', text: 'Wheel done!' }, { who: 'Narrator', text: 'Silence.' }, { who: 'Blot', text: ".og s'teL" }, { who: 'Tisha', text: 'Please.' },
      { who: 'Narrator', text: 'They immediately start walking.' }, { who: 'Finn', text: 'What?!' }, { who: 'Eggson', text: 'I believe you have driven them away.' }, { who: 'Finn', text: "That wasn't even a fish pun!" },
      { who: 'Tisha', text: 'That somehow made it worse.' }, { who: 'Narrator', text: 'Blot gives her a thumbs up.' }
    ]}
  ]
});

defCampaign({
  id: 'cocoa_soulvester', badge: 'cocoa_soulvester', a: 'Cocoa', b: 'Soulvester',
  recLevel: friendshipRecLevel('Cocoa', 'Soulvester'), title: 'A Knight\'s Duty',
  guests: ['Bassie', 'Gourdy'],
  stages: [
    { name: "A Knight's Duty", cast: ['Cocoa', 'Soulvester'], lines: [
      { who: 'Narrator', text: 'The battle ends. Cocoa notices Soulvester checking the hallway.' },
      { who: 'Cocoa', text: 'Soulvester!' }, { who: 'Soulvester', text: 'Cocoa.' },
      { who: 'Cocoa', text: "What're you looking for?" }, { who: 'Soulvester', text: 'Further danger. We may have bested these creatures, but our quest is not yet complete.' },
      { who: 'Cocoa', text: 'Quest?' }, { who: 'Soulvester', text: 'Indeed.' }, { who: 'Narrator', text: "Cocoa's ears perk up." },
      { who: 'Cocoa', text: 'Ooooh. What kind of quest?' }, { who: 'Soulvester', text: 'One requiring courage, vigilance, and perhaps a worthy companion.' },
      { who: 'Cocoa', text: 'I can do that!' }, { who: 'Soulvester', text: 'I had suspected thou wouldst volunteer.' },
      { who: 'Cocoa', text: 'Hehehe! You know me!' }, { who: 'Soulvester', text: 'Then stay close. We have others to protect.' },
      { who: 'Cocoa', text: 'Are we knights?!' }, { who: 'Soulvester', text: 'I am a knight.' }, { who: 'Cocoa', text: "I'm counting that as a yes!" }
    ]},
    { name: 'The Princess', cast: ['Cocoa', 'Soulvester', 'Bassie'], lines: [
      { who: 'Narrator', text: 'They find Bassie after the next battle.' }, { who: 'Cocoa', text: 'Bassie!' }, { who: 'Bassie', text: 'Oh. Hello, Cocoa.' },
      { who: 'Cocoa', text: 'We found you!' }, { who: 'Bassie', text: '...Was I missing?' }, { who: 'Soulvester', text: 'Fear not, princess. Thou art under our protection.' },
      { who: 'Bassie', text: "I'm sorry?" }, { who: 'Cocoa', text: "You're the princess!" }, { who: 'Bassie', text: 'Why am I the princess?!' },
      { who: 'Soulvester', text: 'Every great quest requires someone worthy of protection.' }, { who: 'Bassie', text: 'I can protect myself!' },
      { who: 'Soulvester', text: 'Even better! A princess of formidable spirit.' }, { who: 'Bassie', text: "That's not what I..." },
      { who: 'Narrator', text: 'Cocoa offers her a Bonbon.' }, { who: 'Cocoa', text: 'Princess snack?' }, { who: 'Bassie', text: '...Fine.' }, { who: 'Cocoa', text: 'Yay!' },
      { who: 'Bassie', text: 'I am not agreeing to the princess part.' }
    ]},
    { name: 'The Quest', cast: ['Cocoa', 'Soulvester', 'Bassie'], lines: [
      { who: 'Narrator', text: 'After another fight, Soulvester surveys the damage.' }, { who: 'Soulvester', text: 'A fierce encounter.' }, { who: 'Cocoa', text: 'But we won!' },
      { who: 'Soulvester', text: 'Indeed. Thou fought valiantly.' }, { who: 'Cocoa', text: 'Does that make me a knight now?' }, { who: 'Soulvester', text: 'Squire.' },
      { who: 'Cocoa', text: 'SQUIRE?!' }, { who: 'Soulvester', text: 'A respected position.' }, { who: 'Cocoa', text: 'I wanna be a knight!' },
      { who: 'Bassie', text: 'Could you please discuss promotions after we get somewhere safer?' }, { who: 'Soulvester', text: 'The princess speaks wisely.' },
      { who: 'Bassie', text: 'Stop calling me that.' }, { who: 'Cocoa', text: 'Yes, Princess Bassie!' }, { who: 'Bassie', text: '...' }, { who: 'Cocoa', text: 'Sorry.' }
    ]},
    { name: 'His Liege', cast: ['Cocoa', 'Soulvester', 'Bassie', 'Gourdy'], lines: [
      { who: 'Narrator', text: 'Gourdy catches up with them.' }, { who: 'Gourdy', text: 'Hey guys!! What are you doing?' }, { who: 'Cocoa', text: "We're on a quest!" },
      { who: 'Gourdy', text: 'A QUEST?!' }, { who: 'Soulvester', text: 'My liege!' }, { who: 'Gourdy', text: "Soulvester, I'm Gourdy!" }, { who: 'Soulvester', text: 'Thou art both.' },
      { who: 'Gourdy', text: 'Okay!' }, { who: 'Bassie', text: "Don't encourage him." }, { who: 'Gourdy', text: "What's the quest?" },
      { who: 'Cocoa', text: "We're protecting Princess Bassie!" }, { who: 'Bassie', text: 'Cocoa.' }, { who: 'Gourdy', text: 'Woah!!' }, { who: 'Bassie', text: 'No.' },
      { who: 'Gourdy', text: 'Does she have a castle?' }, { who: 'Cocoa', text: 'She needs one!' }, { who: 'Gourdy', text: 'And treasure!' }, { who: 'Cocoa', text: 'YES!' },
      { who: 'Bassie', text: 'No.' }, { who: 'Soulvester', text: 'My liege, thou hast greatly complicated our mission.' }, { who: 'Gourdy', text: "You're welcome!" }
    ]},
    { name: 'The Rescue', cast: ['Cocoa', 'Soulvester', 'Bassie'], lines: [
      { who: 'Narrator', text: 'Another battle ends with Bassie separated from the others.' }, { who: 'Cocoa', text: 'BASSIE!' }, { who: 'Narrator', text: 'Cocoa immediately runs toward her.' },
      { who: 'Soulvester', text: 'Squire! Wait!' }, { who: 'Cocoa', text: 'Are you okay?!' }, { who: 'Bassie', text: "I'm fine!" }, { who: 'Cocoa', text: "You're sure?" },
      { who: 'Bassie', text: "Cocoa, I'm fine." }, { who: 'Soulvester', text: 'Princess! Art thou harmed?' }, { who: 'Bassie', text: 'No!' }, { who: 'Cocoa', text: 'We rescued you!' },
      { who: 'Bassie', text: 'I defeated the Twisted myself.' }, { who: 'Narrator', text: 'A pause.' }, { who: 'Soulvester', text: 'Ah.' }, { who: 'Cocoa', text: 'Oh.' },
      { who: 'Bassie', text: 'So technically, I rescued myself.' }, { who: 'Soulvester', text: 'A most capable princess.' }, { who: 'Bassie', text: 'Soulvester!' }, { who: 'Narrator', text: 'Cocoa starts giggling.' },
      { who: 'Bassie', text: "This isn't funny." }, { who: 'Cocoa', text: "You're smiling!" }, { who: 'Bassie', text: 'I am NOT.' }
    ]},
    { name: 'The Dragon', cast: ['Cocoa', 'Soulvester', 'Bassie', 'Gourdy'], lines: [
      { who: 'Narrator', text: 'Gourdy rejoins them carrying a cardboard dragon head.' }, { who: 'Gourdy', text: 'RAAAAH!' }, { who: 'Cocoa', text: 'GOURDY?!' },
      { who: 'Gourdy', text: "I'm the dragon!" }, { who: 'Bassie', text: 'Where did you even get that?' }, { who: 'Gourdy', text: 'I made it!' },
      { who: 'Soulvester', text: 'My liege, thou cannot be both king and dragon.' }, { who: 'Gourdy', text: 'Why not?' }, { who: 'Soulvester', text: 'Because...' },
      { who: 'Soulvester', text: '...such matters are traditionally frowned upon.' }, { who: 'Cocoa', text: 'I think he should be the dragon!' }, { who: 'Gourdy', text: 'RAAAH!' },
      { who: 'Soulvester', text: 'Cocoa, thou art encouraging chaos.' }, { who: 'Cocoa', text: "It's fun!" }, { who: 'Gourdy', text: "I'm kidnapping the princess!" },
      { who: 'Bassie', text: "No, you're not." }, { who: 'Gourdy', text: 'Oh.' }, { who: 'Bassie', text: 'You can pretend to.' }, { who: 'Gourdy', text: 'YEAH!!' },
      { who: 'Soulvester', text: 'The princess has embraced the quest.' }, { who: 'Bassie', text: "Don't make me regret it." }
    ]},
    { name: 'Knight Cocoa', cast: ['Cocoa', 'Soulvester', 'Bassie', 'Gourdy'], lines: [
      { who: 'Narrator', text: 'After defeating another group of Twisteds, Cocoa dramatically stands beside Soulvester.' }, { who: 'Cocoa', text: 'Sir Soulvester!' }, { who: 'Soulvester', text: 'Squire Cocoa.' },
      { who: 'Cocoa', text: "I've fought Twisteds, protected Bassie, survived Gourdy's dragon..." }, { who: 'Gourdy', text: 'RAAAH!' }, { who: 'Cocoa', text: '...and delivered emergency Bonbons!' },
      { who: 'Soulvester', text: 'Indeed.' }, { who: 'Cocoa', text: 'Am I a knight yet?' }, { who: 'Soulvester', text: 'There is more to knighthood than defeating monsters.' },
      { who: 'Narrator', text: "Cocoa's ears droop slightly." }, { who: 'Cocoa', text: 'Oh.' }, { who: 'Soulvester', text: 'A knight aids those in need.' }, { who: 'Soulvester', text: 'A knight remains steadfast when others require them.' },
      { who: 'Bassie', text: '...' }, { who: 'Soulvester', text: 'And a knight shares what she has without demanding reward.' }, { who: 'Cocoa', text: 'I do like sharing!' }, { who: 'Bassie', text: "That's putting it mildly." },
      { who: 'Narrator', text: 'Soulvester kneels.' }, { who: 'Soulvester', text: 'Then arise, Dame Cocoa.' }, { who: 'Cocoa', text: 'REALLY?!' }, { who: 'Soulvester', text: 'Indeed.' }, { who: 'Cocoa', text: 'YES!!' },
      { who: 'Narrator', text: 'She hugs him.' }, { who: 'Soulvester', text: 'ACK! Cocoa!' }, { who: 'Cocoa', text: 'Sorry!' }, { who: 'Soulvester', text: '...Thy enthusiasm is formidable.' }
    ]},
    { name: 'Happily Ever After', cast: ['Cocoa', 'Soulvester', 'Bassie', 'Gourdy'], lines: [
      { who: 'Narrator', text: 'The final battle ends.' }, { who: 'Soulvester', text: 'Victory!' }, { who: 'Cocoa', text: 'WE DID IT!' }, { who: 'Gourdy', text: 'The dragon has been defeated!' },
      { who: 'Bassie', text: 'You helped us fight.' }, { who: 'Gourdy', text: 'The dragon switched sides!' }, { who: 'Cocoa', text: 'Good dragon!' }, { who: 'Gourdy', text: 'Hehehe!' },
      { who: 'Soulvester', text: 'Princess Bassie. The kingdom is safe.' }, { who: 'Bassie', text: 'Finally.' }, { who: 'Soulvester', text: 'Thou mayst return to thy castle.' }, { who: 'Bassie', text: "I don't have a castle." },
      { who: 'Cocoa', text: 'We can make one!' }, { who: 'Bassie', text: "Please don't." }, { who: 'Gourdy', text: 'TOO LATE!' }, { who: 'Bassie', text: 'What?' },
      { who: 'Narrator', text: 'Gourdy points down the hall. Bassie looks.' }, { who: 'Bassie', text: '...' }, { who: 'Cocoa', text: 'Is that cardboard?' }, { who: 'Gourdy', text: 'Mhm!!' },
      { who: 'Bassie', text: 'Gourdy, how long have you been working on that?!' }, { who: 'Gourdy', text: 'Since you said I could pretend to kidnap you!' },
      { who: 'Bassie', text: '...' }, { who: 'Narrator', text: 'Bassie walks inside the cardboard castle.' }, { who: 'Cocoa', text: 'YES!' }, { who: 'Gourdy', text: 'PRINCESS BASSIE!!' },
      { who: 'Bassie', text: 'Just for five minutes!' }, { who: 'Soulvester', text: 'As thou commands, Your Highness.' }, { who: 'Cocoa', text: "Don't worry, Princess! Your knights are here!" },
      { who: 'Bassie', text: '...Then I suppose I\'m safe.' }, { who: 'Cocoa', text: 'Mhm!' }, { who: 'Gourdy', text: 'What am I?!' }, { who: 'Bassie', text: "You're still the dragon." }, { who: 'Gourdy', text: 'YEAH!!' }
    ]}
  ]
});

defCampaign({
  id: 'cocoa_kairi', badge: 'kairi_cocoa', a: 'Cocoa', b: 'Kairi',
  recLevel: friendshipRecLevel('Cocoa', 'Kairi'), title: 'The Light That\'s Left',
  guests: ['Goofy', 'Sprout', 'Vee', 'Tisha'],
  stages: [
    { name: 'A Different World', cast: ['Cocoa', 'Kairi'], lines: [
      { who: 'Narrator', text: 'The last Twisted disappears. Kairi lowers her Keyblade.' }, { who: 'Cocoa', text: 'Kairi! You okay?' }, { who: 'Kairi', text: 'Yeah.' },
      { who: 'Narrator', text: 'She looks where the Twisted fell.' }, { who: 'Kairi', text: 'Cocoa... those creatures.' }, { who: 'Cocoa', text: 'Twisteds.' }, { who: 'Kairi', text: 'Right.' },
      { who: 'Narrator', text: 'A pause.' }, { who: 'Kairi', text: 'You recognized that one.' }, { who: 'Cocoa', text: '...Mhm.' }, { who: 'Kairi', text: "Then it wasn't always a monster." }, { who: 'Cocoa', text: 'No.' },
      { who: 'Narrator', text: 'Kairi looks around Gardenview.' }, { who: 'Kairi', text: 'I see.' }, { who: 'Cocoa', text: "Sorry. This probably isn't the best welcome." }, { who: 'Kairi', text: "I've had stranger ones." },
      { who: 'Narrator', text: 'Cocoa laughs.' }, { who: 'Cocoa', text: "Then I'll show you around!" }, { who: 'Kairi', text: 'Okay.' }, { who: 'Narrator', text: 'Kairi looks back once.' }, { who: 'Kairi', text: "Maybe I'll understand if I see more." }
    ]},
    { name: 'Something Sweet', cast: ['Cocoa', 'Kairi', 'Sprout'], guests: ['Sprout'], lines: [
      { who: 'Narrator', text: 'After another battle, Cocoa brings Kairi to Sprout.' }, { who: 'Cocoa', text: 'Sprout! This is Kairi!' }, { who: 'Sprout', text: "We've met." }, { who: 'Cocoa', text: 'Oh.' },
      { who: 'Kairi', text: 'Barely.' }, { who: 'Sprout', text: 'Fair.' }, { who: 'Narrator', text: 'Cocoa hands Kairi a Bonbon.' }, { who: 'Cocoa', text: 'Here!' }, { who: 'Kairi', text: 'For me?' }, { who: 'Cocoa', text: 'Mhm!' },
      { who: 'Sprout', text: 'She does that.' }, { who: 'Cocoa', text: "What's wrong with that?!" }, { who: 'Sprout', text: 'Nothing.' }, { who: 'Narrator', text: 'Kairi smiles and takes it.' },
      { who: 'Kairi', text: 'You remind me of someone.' }, { who: 'Cocoa', text: 'Really?!' }, { who: 'Kairi', text: 'Someone who thinks giving everything he has to his friends will somehow leave him with more.' },
      { who: 'Sprout', text: "Doesn't make much sense." }, { who: 'Kairi', text: 'No.' }, { who: 'Narrator', text: 'She smiles.' }, { who: 'Kairi', text: 'Somehow, with him, it does.' }
    ]},
    { name: 'The Screen', cast: ['Cocoa', 'Kairi', 'Vee'], guests: ['Vee'], lines: [
      { who: 'Narrator', text: 'Another floor. Another victory. Vee has been watching Kairi.' }, { who: 'Kairi', text: "You've been staring at me." }, { who: 'Vee', text: 'Observing.' }, { who: 'Kairi', text: 'Is there a difference?' },
      { who: 'Vee', text: 'When I do it.' }, { who: 'Narrator', text: 'Kairi almost smiles.' }, { who: 'Cocoa', text: 'Vee!' }, { who: 'Vee', text: 'What?' }, { who: 'Narrator', text: 'Kairi looks toward a nearby screen.' },
      { who: 'Kairi', text: 'Cocoa said this place used to be different.' }, { who: 'Vee', text: 'Everything used to be different.' }, { who: 'Kairi', text: "That's not an answer." }, { who: 'Vee', text: "You're learning." },
      { who: 'Kairi', text: 'You remember what it was like.' }, { who: 'Vee', text: 'Unfortunately.' }, { who: 'Kairi', text: 'Then why stay?' }, { who: 'Narrator', text: 'Vee goes quiet.' }, { who: 'Vee', text: "Ask me when you've been here longer." },
      { who: 'Kairi', text: '...All right.' }, { who: 'Narrator', text: 'Cocoa watches them. For once, she does not interrupt.' }
    ]},
    { name: 'What Remains', cast: ['Cocoa', 'Kairi', 'Tisha'], guests: ['Tisha'], lines: [
      { who: 'Narrator', text: 'Another Twisted is defeated. Tisha immediately starts straightening the room.' }, { who: 'Tisha', text: 'Honestly... every floor.' }, { who: 'Cocoa', text: 'Need help?' }, { who: 'Tisha', text: 'No thank you, Cocoa.' }, { who: 'Cocoa', text: "You didn't even think about it!" }, { who: 'Tisha', text: 'I have thought about it before.' }, { who: 'Cocoa', text: 'Oh.' },
      { who: 'Narrator', text: 'Kairi quietly helps move something out of Tisha\'s way.' }, { who: 'Tisha', text: 'Thank you, Kairi.' }, { who: 'Kairi', text: 'Tisha.' }, { who: 'Tisha', text: 'Hm?' },
      { who: 'Kairi', text: 'If one of your friends became a Twisted...' }, { who: 'Narrator', text: 'Tisha stops.' }, { who: 'Kairi', text: 'Would you still call them your friend?' }, { who: 'Narrator', text: 'Silence.' },
      { who: 'Tisha', text: "That's a rather difficult question." }, { who: 'Kairi', text: 'I know.' }, { who: 'Narrator', text: 'Tisha looks down.' }, { who: 'Tisha', text: 'I suppose... becoming something terrible does not erase everything that came before it.' },
      { who: 'Narrator', text: 'Kairi thinks about that.' }, { who: 'Kairi', text: 'No.' }, { who: 'Narrator', text: 'She looks toward Cocoa.' }, { who: 'Kairi', text: "I don't think it does either." }
    ]},
    { name: 'Hearts', cast: ['Cocoa', 'Kairi'], lines: [
      { who: 'Narrator', text: 'The battle was harder this time. Cocoa finds Kairi standing alone afterward.' }, { who: 'Cocoa', text: 'Kairi?' }, { who: 'Kairi', text: "I'm okay." }, { who: 'Cocoa', text: 'You sure?' }, { who: 'Kairi', text: 'Cocoa...' },
      { who: 'Narrator', text: 'She turns.' }, { who: 'Kairi', text: 'Do Twisteds have hearts?' }, { who: 'Cocoa', text: 'Hearts?' }, { who: 'Kairi', text: 'Not the kind that beats.' }, { who: 'Narrator', text: 'Cocoa does not understand.' },
      { who: 'Kairi', text: "Sorry. Where I'm from, the heart is more than that." }, { who: 'Narrator', text: 'She touches her chest.' }, { who: 'Kairi', text: 'Memories. Feelings. The connections we make with other people.' },
      { who: 'Narrator', text: 'Cocoa looks toward the defeated Twisted.' }, { who: 'Cocoa', text: 'Then...' }, { who: 'Narrator', text: 'A pause.' }, { who: 'Cocoa', text: 'I hope they do.' }, { who: 'Kairi', text: 'Because if they do not...' },
      { who: 'Cocoa', text: '...' }, { who: 'Kairi', text: "You don't want to believe they're completely gone." }, { who: 'Narrator', text: 'Cocoa nods.' }, { who: 'Kairi', text: 'Neither would I.' }
    ]},
    { name: 'Donald', cast: ['Cocoa', 'Kairi', 'Goofy'], guests: ['Goofy'], lines: [
      { who: 'Narrator', text: 'Goofy joins them after the next battle.' }, { who: 'Goofy', text: 'Kairi!' }, { who: 'Kairi', text: 'Goofy.' }, { who: 'Cocoa', text: "We're trying to figure out hearts!" }, { who: 'Goofy', text: "Gawrsh. That's a pretty big thing to figure out." },
      { who: 'Kairi', text: 'You can say that again.' }, { who: 'Narrator', text: 'Goofy notices her expression.' }, { who: 'Goofy', text: "Somethin' bothering ya?" }, { who: 'Kairi', text: 'I was wondering how somebody can change completely...' },
      { who: 'Narrator', text: 'She looks down.' }, { who: 'Kairi', text: '...and still be the same person you remember.' }, { who: 'Narrator', text: 'Goofy thinks.' }, { who: 'Goofy', text: "Y'know, Donald'd probably yell at me for saying something too simple." },
      { who: 'Cocoa', text: 'You miss him, huh?' }, { who: 'Goofy', text: 'Sure do.' }, { who: 'Narrator', text: 'A small pause.' }, { who: 'Goofy', text: "But I don't gotta see Donald to know he's still my pal." }, { who: 'Kairi', text: "That's exactly the kind of thing you'd say." },
      { who: 'Goofy', text: 'Is that good?' }, { who: 'Kairi', text: 'Yeah.' }, { who: 'Goofy', text: 'Then Donald would definitely complain.' }, { who: 'Narrator', text: 'Kairi laughs.' }
    ]},
    { name: 'Familiar', cast: ['Cocoa', 'Kairi'], lines: [
      { who: 'Narrator', text: 'Another victory. Cocoa walks beside Kairi.' }, { who: 'Cocoa', text: "I haven't been doing a very good job." }, { who: 'Kairi', text: 'At what?' }, { who: 'Cocoa', text: 'Showing you Gardenview!' }, { who: 'Kairi', text: 'Cocoa...' }, { who: 'Cocoa', text: 'We barely did anything fun!' },
      { who: 'Kairi', text: 'You introduced me to Sprout.' }, { who: 'Cocoa', text: 'Mhm.' }, { who: 'Kairi', text: 'Tisha trusts me enough to let me touch things she is cleaning.' }, { who: 'Cocoa', text: "She STILL won't let me!" }, { who: 'Kairi', text: 'Vee insulted me.' }, { who: 'Cocoa', text: "That's normal!" },
      { who: 'Kairi', text: 'And you showed me what this place means to you.' }, { who: 'Narrator', text: 'Cocoa pauses.' }, { who: 'Cocoa', text: 'I did?' }, { who: 'Kairi', text: 'You did.' }, { who: 'Narrator', text: 'Kairi looks ahead.' }, { who: 'Kairi', text: 'A world is not just the place you are standing in.' },
      { who: 'Cocoa', text: 'Then what is it?' }, { who: 'Kairi', text: 'Maybe it is the people who make you want to come back.' }, { who: 'Narrator', text: 'Cocoa thinks about that.' }, { who: 'Cocoa', text: "Then Gardenview's pretty big." }, { who: 'Kairi', text: 'Yeah.' }, { who: 'Cocoa', text: "Even if it isn't?" }, { who: 'Kairi', text: 'Even if it is not.' }
    ]},
    { name: "The Light That's Left", cast: ['Cocoa', 'Kairi', 'Goofy', 'Sprout', 'Vee', 'Tisha'], guests: ['Goofy', 'Sprout', 'Vee', 'Tisha'], lines: [
      { who: 'Narrator', text: 'The final Twisted falls. Nobody speaks immediately. Kairi dismisses her Keyblade.' }, { who: 'Cocoa', text: 'Kairi?' }, { who: 'Kairi', text: 'When I first came here, I thought the Twisteds were the part I needed to understand.' },
      { who: 'Vee', text: 'And now?' }, { who: 'Kairi', text: 'I was looking at it backwards.' }, { who: 'Narrator', text: 'Vee raises an eyebrow.' }, { who: 'Kairi', text: 'If I only looked at what Gardenview became, I would never understand why all of you keep fighting for it.' },
      { who: 'Sprout', text: "She's got a point." }, { who: 'Tisha', text: 'I think so too.' }, { who: 'Kairi', text: 'You knew what those Twisteds used to be.' }, { who: 'Cocoa', text: 'Mhm.' }, { who: 'Kairi', text: 'And you still smiled when you showed me around.' }, { who: 'Cocoa', text: 'Well... yeah.' },
      { who: 'Kairi', text: "At first, I didn't understand that." }, { who: 'Narrator', text: 'A pause.' }, { who: 'Kairi', text: 'Now I think I do.' }, { who: 'Narrator', text: 'Cocoa tilts her head.' }, { who: 'Kairi', text: "You're not pretending the darkness isn't here." }, { who: 'Kairi', text: "You're reminding yourself there's still light here too." },
      { who: 'Narrator', text: "Cocoa's expression softens." }, { who: 'Cocoa', text: 'Kairi...' }, { who: 'Vee', text: 'That was disgustingly sentimental.' }, { who: 'Tisha', text: 'Vee!' }, { who: 'Vee', text: "I didn't say she was wrong." }, { who: 'Narrator', text: 'Kairi laughs.' },
      { who: 'Goofy', text: "Y'know, this place kinda reminds me of our adventures." }, { who: 'Kairi', text: 'How?' }, { who: 'Goofy', text: 'We usually show up somewhere we do not understand, fight a bunch of monsters, make some new friends...' }, { who: 'Goofy', text: 'Then Donald gets mad at us.' },
      { who: 'Narrator', text: 'Silence. Goofy’s smile weakens.' }, { who: 'Goofy', text: 'Gawrsh. I really miss Donald.' }, { who: 'Narrator', text: 'Kairi puts a hand on his shoulder.' }, { who: 'Kairi', text: "We'll see him again." }, { who: 'Goofy', text: 'You really think so?' }, { who: 'Kairi', text: 'I do not think.' }, { who: 'Narrator', text: 'A beat.' }, { who: 'Kairi', text: 'I know.' },
      { who: 'Cocoa', text: 'Then when you find him...' }, { who: 'Goofy', text: 'Hm?' }, { who: 'Cocoa', text: 'Bring him here!' }, { who: 'Vee', text: 'Absolutely not.' }, { who: 'Cocoa', text: 'Vee!' }, { who: 'Vee', text: 'One Goofy is enough.' }, { who: 'Goofy', text: 'Hyuck! Hey!' }, { who: 'Narrator', text: 'Kairi laughs with them.' },
      { who: 'Narrator', text: 'Then she looks down the hallway ahead.' }, { who: 'Kairi', text: 'Come on.' }, { who: 'Cocoa', text: 'Where are we going?' }, { who: 'Narrator', text: 'Kairi summons her Keyblade.' }, { who: 'Kairi', text: 'You said there was more of Gardenview to see.' }, { who: 'Cocoa', text: 'There is!' }, { who: 'Narrator', text: 'They walk ahead together.' }
    ]}
  ]
});

defCampaign({
  id: 'astro_pebble', badge: 'astro_pebble', a: 'Astro', b: 'Pebble',
  recLevel: friendshipRecLevel('Astro', 'Pebble'), title: 'Stars',
  guests: ['Dandy', 'Cocoa', 'Shelly'],
  stages: [
    { name: 'Looking', cast: ['Astro', 'Pebble'], lines: [
      { who: 'Narrator', text: 'The battle ends. Astro notices Pebble sniffing around instead of following everyone.' }, { who: 'Astro', text: 'Pebble...?' }, { who: 'Pebble', text: '(Sniff sniff.)' },
      { who: 'Astro', text: 'What are you looking for?' }, { who: 'Narrator', text: 'Pebble keeps sniffing.' }, { who: 'Astro', text: '...' }, { who: 'Pebble', text: 'Arf!' }, { who: 'Astro', text: 'Oh.' },
      { who: 'Narrator', text: 'Pebble looks at him.' }, { who: 'Astro', text: 'Dandy.' }, { who: 'Pebble', text: 'Arf arf!' }, { who: 'Narrator', text: 'Astro looks down the empty hallway.' },
      { who: 'Astro', text: "...I haven't seen him either." }, { who: 'Narrator', text: 'Pebble whines.' }, { who: 'Astro', text: 'Come on.' }, { who: 'Pebble', text: '...Bwoof?' }, { who: 'Astro', text: "We'll find him." }
    ]},
    { name: 'His Favorite', cast: ['Astro', 'Cocoa', 'Pebble'], guests: ['Cocoa'], lines: [
      { who: 'Narrator', text: "After another battle, Cocoa finds Astro carrying one of Pebble's treats." }, { who: 'Cocoa', text: "Astro! What's that for?" }, { who: 'Astro', text: 'Pebble.' }, { who: 'Cocoa', text: 'Aww! Where is he?' }, { who: 'Narrator', text: 'Astro points.' },
      { who: 'Narrator', text: 'Pebble is staring down another hallway.' }, { who: 'Cocoa', text: 'Pebble!' }, { who: 'Pebble', text: '...' }, { who: 'Cocoa', text: 'Treat!' }, { who: 'Narrator', text: 'Nothing.' },
      { who: 'Cocoa', text: "He doesn't want it?" }, { who: 'Astro', text: 'Not right now.' }, { who: 'Narrator', text: 'Pebble whines again.' }, { who: 'Cocoa', text: 'Is he okay?' }, { who: 'Narrator', text: 'Astro hesitates.' },
      { who: 'Astro', text: "He's looking for someone." }, { who: 'Narrator', text: 'Cocoa looks at Pebble. Then understands.' }, { who: 'Cocoa', text: '...Oh.' }, { who: 'Narrator', text: 'She quietly leaves the treat beside him.' }
    ]},
    { name: 'Old Habits', cast: ['Astro', 'Pebble'], lines: [
      { who: 'Narrator', text: 'Another battle ends. Pebble suddenly takes off.' }, { who: 'Astro', text: 'Pebble!' }, { who: 'Narrator', text: 'Astro follows him into another room.' }, { who: 'Pebble', text: 'BARK! BARK!' }, { who: 'Narrator', text: 'Nothing answers.' },
      { who: 'Narrator', text: 'Pebble checks behind the counter.' }, { who: 'Astro', text: "He's not here." }, { who: 'Pebble', text: '(Whine.)' }, { who: 'Astro', text: 'I know.' }, { who: 'Narrator', text: 'Pebble sits. Astro sits beside him.' },
      { who: 'Astro', text: 'You used to wait for him here, did you not?' }, { who: 'Pebble', text: 'Arf.' }, { who: 'Astro', text: '...' }, { who: 'Narrator', text: 'Pebble nudges him.' }, { who: 'Astro', text: 'What?' }, { who: 'Pebble', text: 'Bwoof.' },
      { who: 'Narrator', text: 'Astro understands.' }, { who: 'Astro', text: 'I used to wait for him too.' }, { who: 'Narrator', text: 'Neither of them moves for a while.' }
    ]},
    { name: 'Before', cast: ['Astro', 'Pebble', 'Shelly'], guests: ['Shelly'], lines: [
      { who: 'Narrator', text: 'Shelly joins them after the next battle.' }, { who: 'Shelly', text: 'There you two are!' }, { who: 'Astro', text: 'Hi, Shelly...' }, { who: 'Narrator', text: 'She notices Pebble sitting unusually close to Astro.' },
      { who: 'Shelly', text: 'Is something wrong?' }, { who: 'Astro', text: "He's been looking for Dandy." }, { who: 'Shelly', text: 'Oh.' }, { who: 'Pebble', text: '(Whine.)' }, { who: 'Narrator', text: 'Shelly crouches beside him.' }, { who: 'Shelly', text: 'Sorry, buddy.' },
      { who: 'Narrator', text: 'Pebble leans against her.' }, { who: 'Shelly', text: 'You know...' }, { who: 'Narrator', text: 'She looks at Astro.' }, { who: 'Shelly', text: 'It is weird remembering how everything used to be.' }, { who: 'Astro', text: 'Yeah.' },
      { who: 'Shelly', text: 'Sometimes it feels like it was not even the same place.' }, { who: 'Astro', text: 'It was.' }, { who: 'Narrator', text: 'Shelly looks at him.' }, { who: 'Astro', text: "That's what makes it hurt." }, { who: 'Narrator', text: 'Shelly does not have an answer for that.' }
    ]},
    { name: 'Found', cast: ['Astro', 'Dandy', 'Pebble'], lines: [
      { who: 'Narrator', text: 'After another fight, Pebble suddenly perks up.' }, { who: 'Pebble', text: 'ARF!' }, { who: 'Narrator', text: 'He bolts away.' }, { who: 'Astro', text: 'Pebble, wait!' }, { who: 'Narrator', text: 'They follow.' }, { who: 'Narrator', text: 'Dandy is there.' },
      { who: 'Dandy', text: 'Pebble!' }, { who: 'Pebble', text: 'BARK! ARF ARF!!' }, { who: 'Narrator', text: 'Pebble launches himself at Dandy.' }, { who: 'Dandy', text: 'Woah! Hey, buddy!' }, { who: 'Narrator', text: 'Dandy laughs and pets him.' }, { who: 'Dandy', text: 'I missed you too!' },
      { who: 'Narrator', text: 'Astro stops several steps away.' }, { who: 'Narrator', text: 'Dandy notices him. His smile falters.' }, { who: 'Dandy', text: '...Astro.' }, { who: 'Astro', text: 'Hi, Dandy.' }, { who: 'Narrator', text: 'Silence.' }, { who: 'Narrator', text: 'Pebble looks between them.' },
      { who: 'Dandy', text: 'Been a while.' }, { who: 'Astro', text: 'Yeah.' }, { who: 'Dandy', text: 'We should catch up sometime!' }, { who: 'Narrator', text: 'Astro gives him a small smile.' }, { who: 'Astro', text: '...We should.' }, { who: 'Narrator', text: 'Neither of them suggests when.' }
    ]},
    { name: 'Stay', cast: ['Astro', 'Dandy', 'Pebble'], lines: [
      { who: 'Narrator', text: 'Dandy prepares to leave.' }, { who: 'Pebble', text: '...Bwoof?' }, { who: 'Dandy', text: "I'll see you later, buddy." }, { who: 'Narrator', text: 'Pebble follows him.' }, { who: 'Narrator', text: 'Dandy stops.' },
      { who: 'Dandy', text: 'Pebble.' }, { who: 'Pebble', text: 'Arf!' }, { who: 'Dandy', text: 'You should stay with Astro.' }, { who: 'Narrator', text: 'Pebble does not move.' }, { who: 'Dandy', text: "C'mon. I'll be fine!" }, { who: 'Pebble', text: '(Whine.)' },
      { who: 'Narrator', text: "Dandy's cheerful expression strains." }, { who: 'Dandy', text: "Don't look at me like that." }, { who: 'Narrator', text: 'Astro watches quietly.' }, { who: 'Pebble', text: '...' }, { who: 'Narrator', text: 'Dandy crouches and pets him.' },
      { who: 'Dandy', text: "I'm not going anywhere." }, { who: 'Narrator', text: 'Astro finally speaks.' }, { who: 'Astro', text: 'Dandy...' }, { who: 'Narrator', text: 'Dandy looks at him. Astro wants to say something.' }, { who: 'Astro', text: '...' }, { who: 'Dandy', text: "I'll see you around, Astro." },
      { who: 'Narrator', text: 'Dandy leaves. Pebble watches until he is gone.' }
    ]},
    { name: 'Worried', cast: ['Astro', 'Pebble'], lines: [
      { who: 'Narrator', text: 'After the next battle, Pebble is quiet again.' }, { who: 'Astro', text: 'Pebble.' }, { who: 'Pebble', text: '...' }, { who: 'Narrator', text: 'Astro sits beside him.' }, { who: 'Astro', text: 'I know.' }, { who: 'Pebble', text: '(Whine.)' }, { who: 'Astro', text: 'Me too.' },
      { who: 'Narrator', text: 'Pebble looks at him.' }, { who: 'Astro', text: 'I keep thinking if I talk to him long enough...' }, { who: 'Narrator', text: 'Astro trails off.' }, { who: 'Pebble', text: '...Arf?' }, { who: 'Astro', text: "I don't know." },
      { who: 'Narrator', text: 'A long pause.' }, { who: 'Astro', text: 'Maybe things will feel like they used to.' }, { who: 'Narrator', text: 'Pebble rests his head against Astro.' }, { who: 'Astro', text: 'But they do not.' }, { who: 'Pebble', text: '(Whine.)' }, { who: 'Astro', text: 'Yeah.' },
      { who: 'Narrator', text: 'Astro gently pets him.' }, { who: 'Astro', text: 'I miss him too.' }
    ]},
    { name: 'Stars', cast: ['Astro', 'Dandy', 'Cocoa', 'Shelly', 'Pebble'], guests: ['Cocoa', 'Shelly', 'Pebble'], lines: [
      { who: 'Narrator', text: 'The final battle ends. Pebble starts sniffing again.' }, { who: 'Astro', text: 'Pebble...' }, { who: 'Narrator', text: 'Pebble stops. He looks toward the hallway where Dandy disappeared earlier, then back at Astro.' }, { who: 'Pebble', text: '...Arf.' },
      { who: 'Narrator', text: 'Astro sits down.' }, { who: 'Astro', text: 'Come here.' }, { who: 'Narrator', text: 'Pebble settles beside him.' }, { who: 'Narrator', text: 'Cocoa and Shelly eventually find them.' }, { who: 'Cocoa', text: 'There you are!' }, { who: 'Shelly', text: "We've been looking everywhere!" },
      { who: 'Narrator', text: 'Astro looks upward.' }, { who: 'Astro', text: 'Dandy and I used to look at the stars together.' }, { who: 'Shelly', text: 'Really?' }, { who: 'Astro', text: 'Mhm.' }, { who: 'Cocoa', text: 'Do you still?' }, { who: 'Astro', text: 'Not much anymore.' },
      { who: 'Narrator', text: 'Pebble nudges him.' }, { who: 'Astro', text: 'Heh...' }, { who: 'Narrator', text: 'Astro looks at Pebble.' }, { who: 'Astro', text: 'You want to?' }, { who: 'Pebble', text: 'Arf!' }, { who: 'Cocoa', text: 'Me too!' }, { who: 'Narrator', text: 'Cocoa sits down.' },
      { who: 'Shelly', text: 'Oh! Wait, I know a few constellations!' }, { who: 'Astro', text: 'Really?' }, { who: 'Shelly', text: 'A few! You probably know WAY more than me.' }, { who: 'Astro', text: 'I could show you.' }, { who: 'Shelly', text: "I'd like that!" }, { who: 'Narrator', text: 'Pebble settles against Astro.' },
      { who: 'Astro', text: 'Dandy taught me where to look for some of them.' }, { who: 'Narrator', text: 'A quiet pause.' }, { who: 'Cocoa', text: 'Maybe he could come next time.' }, { who: 'Narrator', text: 'Astro does not answer immediately.' }, { who: 'Astro', text: '...' }, { who: 'Pebble', text: '...' },
      { who: 'Astro', text: "I'd like that." }, { who: 'Narrator', text: 'Pebble rests his head in Astro’s lap.' }, { who: 'Astro', text: "Even if things aren't like they were." }, { who: 'Narrator', text: 'He gently pets Pebble.' }, { who: 'Astro', text: "I'd still like that." }
    ]}
  ]
});

defCampaign({
  id: 'blot_scraps', badge: 'blot_scraps', a: 'Blot', b: 'Scraps',
  recLevel: friendshipRecLevel('Blot', 'Scraps'), title: 'Blot & Scraps',
  guests: ['Cocoa', 'Brusha', 'Shrimpo'],
  stages: [
    { name: 'Ink', cast: ['Scraps', 'Blot'], lines: [
      { who: 'Narrator', text: 'The battle ends. Scraps notices the ink Blot left across the floor.' },
      { who: 'Scraps', text: 'Blot.' }, { who: 'Blot', text: '?seY' },
      { who: 'Narrator', text: 'Scraps crouches beside the trail.' },
      { who: 'Scraps', text: 'How hard is this to get out of paper?' }, { who: 'Blot', text: '...' },
      { who: 'Scraps', text: "I'm asking for art reasons!" }, { who: 'Blot', text: '.erom neve em seirrow taht' },
      { who: 'Scraps', text: 'Oh, come on! Just a little?' }, { who: 'Narrator', text: 'Blot considers it.' },
      { who: 'Narrator', text: 'Then holds out a hand.' }, { who: 'Scraps', text: 'Really?!' },
      { who: 'Blot', text: '.em rof gnihtemos ekaM' }, { who: 'Narrator', text: 'Scraps smiles.' },
      { who: 'Scraps', text: 'Deal.' }
    ]},
    { name: 'Collaboration', cast: ['Scraps', 'Blot'], lines: [
      { who: 'Narrator', text: 'After the next battle, Scraps shows Blot what she made.' },
      { who: 'Scraps', text: 'Okay! What do you think?' }, { who: 'Narrator', text: 'Blot examines the collage.' },
      { who: 'Blot', text: '...daB' }, { who: 'Narrator', text: "Scraps' ears drop." },
      { who: 'Narrator', text: 'Blot immediately turns it upside down.' }, { who: 'Blot', text: '.retteB' },
      { who: 'Scraps', text: 'HEY!' }, { who: 'Narrator', text: 'Blot snickers.' },
      { who: 'Scraps', text: 'I thought you hated it!' }, { who: 'Blot', text: '.daB ton dias I' },
      { who: 'Scraps', text: 'You literally said...' }, { who: 'Narrator', text: 'Scraps stops.' },
      { who: 'Scraps', text: 'Oh.' }, { who: 'Narrator', text: 'Blot looks incredibly pleased with himself.' },
      { who: 'Scraps', text: "You're annoying." }, { who: 'Blot', text: '.uoy knahT' }
    ]},
    { name: 'Add Something', cast: ['Scraps', 'Blot'], lines: [
      { who: 'Narrator', text: 'Another Twisted is dealt with. Scraps immediately pulls the artwork back out.' },
      { who: 'Scraps', text: 'Your turn.' }, { who: 'Blot', text: '...?' },
      { who: 'Scraps', text: 'You wanted something made. Help me.' }, { who: 'Narrator', text: 'Blot points at himself.' },
      { who: 'Scraps', text: 'Yes, you!' },
      { who: 'Narrator', text: 'Blot takes some ink and adds a sweeping shape through the background.' },
      { who: 'Narrator', text: 'Scraps watches.' }, { who: 'Scraps', text: 'Huh.' },
      { who: 'Narrator', text: 'Blot adds another.' }, { who: 'Scraps', text: 'Wait, actually...' },
      { who: 'Narrator', text: 'He finishes.' }, { who: 'Scraps', text: 'I like that!' },
      { who: 'Blot', text: '.esuac fo' }, { who: 'Scraps', text: "Don't ruin the moment." },
      { who: 'Narrator', text: 'Blot gives an exaggerated bow.' }, { who: 'Scraps', text: "Hehehe! Okay. Maybe this'll work." }
    ]},
    { name: 'Critics', cast: ['Cocoa', 'Brusha', 'Scraps', 'Blot'], guests: ['Cocoa', 'Brusha'], lines: [
      { who: 'Narrator', text: 'Cocoa and Brusha examine their increasingly strange collaborative piece.' },
      { who: 'Cocoa', text: 'Woah!' }, { who: 'Scraps', text: 'Good woah?' }, { who: 'Cocoa', text: 'Mhm!' },
      { who: 'Blot', text: '.ylsuoibvO' }, { who: 'Narrator', text: 'Brusha leans closer.' },
      { who: 'Brusha', text: 'Interesting.' }, { who: 'Narrator', text: "Scraps' tail twitches." },
      { who: 'Scraps', text: '"Interesting?"' }, { who: 'Brusha', text: 'Must everything be praise?' },
      { who: 'Scraps', text: "No! I just don't know what that means!" },
      { who: 'Brusha', text: 'This is clearly yours.' }, { who: 'Narrator', text: 'Then another.' },
      { who: 'Brusha', text: 'And this is clearly his.' }, { who: 'Scraps', text: 'Is that bad?' },
      { who: 'Brusha', text: 'No.' }, { who: 'Narrator', text: 'Brusha studies it again.' },
      { who: 'Brusha', text: 'But I do not yet see what belongs to both of you.' },
      { who: 'Narrator', text: 'Blot and Scraps exchange a look.' }, { who: 'Cocoa', text: 'I still think it is pretty!' },
      { who: 'Brusha', text: "I never said it wasn't." }
    ]},
    { name: 'Too Far', cast: ['Scraps', 'Blot'], lines: [
      { who: 'Narrator', text: 'After another battle, Scraps returns to find Blot working on the piece.' },
      { who: 'Scraps', text: 'Oh! Did you add...' }, { who: 'Narrator', text: 'She stops.' },
      { who: 'Narrator', text: 'A section of her original collage has been covered in ink.' },
      { who: 'Scraps', text: 'Blot.' }, { who: 'Blot', text: '...?' },
      { who: 'Scraps', text: 'Why did you cover that?' }, { who: 'Narrator', text: 'Blot gestures toward the new composition.' },
      { who: 'Blot', text: '.retteb skool tI' }, { who: 'Scraps', text: "You could've asked!" },
      { who: 'Blot', text: '.gnitteg eb uoy thguoht I' }, { who: 'Scraps', text: "Well, I wasn't!" },
      { who: 'Narrator', text: 'She takes the artwork.' }, { who: 'Scraps', text: 'That part mattered to me.' },
      { who: 'Narrator', text: 'Blot starts to respond.' }, { who: 'Scraps', text: 'No.' },
      { who: 'Narrator', text: 'Her tail flicks sharply.' }, { who: 'Scraps', text: "I'm done for now." },
      { who: 'Narrator', text: 'She leaves.' }, { who: 'Narrator', text: 'Blot does not joke this time.' }
    ]},
    { name: 'Artistic Advice', cast: ['Brusha', 'Blot'], guests: ['Brusha'], lines: [
      { who: 'Narrator', text: 'Brusha finds Blot staring at the unfinished piece.' },
      { who: 'Brusha', text: 'You altered her work.' }, { who: 'Blot', text: '.krow ruo saw tI' },
      { who: 'Brusha', text: 'That does not mean everything on it belongs to you.' }, { who: 'Blot', text: '...' },
      { who: 'Narrator', text: 'Blot looks at her.' },
      { who: 'Brusha', text: "Collaboration is not permission to erase someone else's contribution." },
      { who: 'Blot', text: '...' }, { who: 'Narrator', text: 'Brusha examines the covered section.' },
      { who: 'Brusha', text: 'Though technically...' }, { who: 'Narrator', text: 'Blot waits.' },
      { who: 'Brusha', text: 'Your composition is stronger now.' }, { who: 'Narrator', text: 'Blot perks up.' },
      { who: 'Brusha', text: "That wasn't approval." }, { who: 'Narrator', text: 'He slumps again.' },
      { who: 'Brusha', text: "Artists are allowed to disagree." }, { who: 'Narrator', text: 'She looks toward where Scraps left.' },
      { who: 'Brusha', text: "They're also allowed to care about what gets destroyed." },
      { who: 'Narrator', text: 'Blot looks back at the piece.' }
    ]},
    { name: 'Fixing It', cast: ['Scraps', 'Blot'], lines: [
      { who: 'Narrator', text: 'After the next battle, Scraps finds Blot waiting for her.' },
      { who: 'Scraps', text: 'What?' }, { who: 'Narrator', text: 'Blot hands her the artwork.' },
      { who: 'Narrator', text: 'The covered section has been carefully worked back into the design instead of erased completely.' },
      { who: 'Scraps', text: 'You fixed it.' }, { who: 'Blot', text: '.deirt I' },
      { who: 'Narrator', text: 'Scraps examines it closer.' },
      { who: 'Scraps', text: "You didn't have to make it exactly like before." },
      { who: 'Narrator', text: 'Blot tilts his head.' }, { who: 'Scraps', text: "I just didn't want it gone." },
      { who: 'Narrator', text: 'Blot nods.' }, { who: 'Scraps', text: 'Hand me the ink.' },
      { who: 'Narrator', text: 'Blot smiles.' }, { who: 'Scraps', text: 'And ASK before you cover anything!' },
      { who: 'Blot', text: '.sesimorp oN' }, { who: 'Narrator', text: 'Scraps hisses.' },
      { who: 'Blot', text: '!gniKoj' }, { who: 'Scraps', text: 'You better be!' }
    ]},
    { name: 'Finished', cast: ['Scraps', 'Blot', 'Cocoa', 'Brusha', 'Shrimpo'], guests: ['Cocoa', 'Brusha', 'Shrimpo'], lines: [
      { who: 'Narrator', text: 'After the final battle, everyone gathers around the completed piece.' },
      { who: 'Cocoa', text: 'You finished it!' }, { who: 'Scraps', text: 'Mhm!' }, { who: 'Blot', text: '.eceipretsaM' },
      { who: 'Narrator', text: 'Brusha studies it carefully.' }, { who: 'Scraps', text: 'Well?' },
      { who: 'Brusha', text: 'Better.' }, { who: 'Scraps', text: 'Just better?' },
      { who: 'Brusha', text: 'Would you prefer dishonesty?' }, { who: 'Scraps', text: '...No.' },
      { who: 'Cocoa', text: 'I love it!' }, { who: 'Scraps', text: 'Thank you, Cocoa.' },
      { who: 'Blot', text: '.etsat doog sah enoemoS' }, { who: 'Narrator', text: 'Brusha looks at him.' },
      { who: 'Brusha', text: 'I understood that.' }, { who: 'Narrator', text: 'Blot freezes.' },
      { who: 'Scraps', text: "What'd he say?" }, { who: 'Brusha', text: 'Nothing important.' },
      { who: 'Narrator', text: 'Blot gives Brusha a grateful thumbs up.' },
      { who: 'Narrator', text: 'Suddenly:' }, { who: 'Shrimpo', text: 'I HATE ART!!!' },
      { who: 'Narrator', text: 'Everyone turns.' }, { who: 'Scraps', text: 'Oh, YOU.' },
      { who: 'Shrimpo', text: 'AND I HATE CATS!!!' }, { who: 'Scraps', text: "I'm not a cat!" },
      { who: 'Shrimpo', text: 'I LIKE DOGS MORE!!!' }, { who: 'Narrator', text: "Scraps' tail shoots straight up." },
      { who: 'Scraps', text: "You don't even like dogs!" }, { who: 'Shrimpo', text: 'I HATE THEM TOO!!!' },
      { who: 'Narrator', text: 'Blot slowly steps between them.' }, { who: 'Blot', text: '.uoy sekil enO oN' },
      { who: 'Shrimpo', text: 'WHATEVER YOU SAID, I HATE IT!!!' }, { who: 'Narrator', text: 'Brusha quietly examines the argument.' },
      { who: 'Brusha', text: 'Fascinating.' }, { who: 'Cocoa', text: 'What is?' },
      { who: 'Brusha', text: 'Our first negative review.' }, { who: 'Narrator', text: 'Scraps looks at the artwork.' },
      { who: 'Narrator', text: 'Then at Shrimpo screaming at Blot.' }, { who: 'Scraps', text: "...I'm okay with that one." },
      { who: 'Blot', text: '.emaS' }
    ]}
  ]
});

defCampaign({
  id: 'brightney_rnd', badge: 'brightney_rnd', a: 'Brightney', b: 'RnD',
  recLevel: friendshipRecLevel('Brightney', 'RnD'), title: 'Brightney & Razzle',
  guests: ['Squirm', 'Vee'],
  stages: [
    { name: 'Catching Up', cast: ['Brightney', 'RnD', 'Squirm'], guests: ['Squirm'], lines: [
      { who: 'Narrator', text: 'After the battle, Razzle and Dazzle find Squirm lingering nearby.' },
      { who: 'Razzle', text: "Squirm! Haven't seen you in a while." }, { who: 'Dazzle', text: '(...Not enough, anyway...)' },
      { who: 'Squirm', text: 'Oh... hey. I-I guess it has been a while.' }, { who: 'Razzle', text: 'You could always come talk to us!' },
      { who: 'Dazzle', text: "(...We wouldn't mind...)" }, { who: 'Squirm', text: "I know. It's just..." },
      { who: 'Narrator', text: 'He glances at the book Dazzle is carrying.' }, { who: 'Squirm', text: "I miss when I didn't have to find a reason." },
      { who: 'Narrator', text: "Razzle's expression softens." }, { who: 'Dazzle', text: '(...I miss that too...)' },
      { who: 'Narrator', text: "Brightney has heard enough to understand what they're talking about." },
      { who: 'Brightney', text: 'Squirm.' }, { who: 'Squirm', text: 'Hm?' },
      { who: 'Brightney', text: 'Let me think about something.' }, { who: 'Squirm', text: '...That sounds ominous.' },
      { who: 'Brightney', text: "It wasn't supposed to." }
    ]},
    { name: 'Considering It', cast: ['Brightney', 'Vee'], guests: ['Vee'], lines: [
      { who: 'Narrator', text: 'Another floor is cleared. Brightney is walking beside Vee.' },
      { who: 'Vee', text: "You've been quiet." }, { who: 'Brightney', text: "I've been thinking." },
      { who: 'Vee', text: 'Dangerous.' }, { who: 'Narrator', text: 'Brightney looks at her.' },
      { who: 'Vee', text: 'What? You left that open.' }, { who: 'Brightney', text: 'Squirm wants to come back to Book Club.' },
      { who: 'Vee', text: 'Oh.' }, { who: 'Brightney', text: "That's it?" }, { who: 'Vee', text: 'Were you expecting a dramatic reaction?' },
      { who: 'Brightney', text: 'From you? Never.' }, { who: 'Narrator', text: 'Vee looks ahead.' },
      { who: 'Vee', text: 'You want to let him.' }, { who: 'Brightney', text: '...Maybe.' },
      { who: 'Vee', text: 'Then why are you asking me?' }, { who: 'Brightney', text: "I'm not." },
      { who: 'Vee', text: 'Right. Good talk.' }, { who: 'Narrator', text: 'Brightney smiles slightly.' }
    ]},
    { name: 'One Meeting', cast: ['Brightney', 'Squirm'], guests: ['Squirm'], lines: [
      { who: 'Narrator', text: 'After another encounter, Brightney catches Squirm.' },
      { who: 'Brightney', text: 'Squirm.' }, { who: 'Squirm', text: 'H-hi.' },
      { who: 'Brightney', text: 'Would you still like to come to Book Club?' }, { who: 'Narrator', text: 'Squirm stares.' },
      { who: 'Squirm', text: '...You mean that?' }, { who: 'Brightney', text: 'One meeting.' },
      { who: 'Squirm', text: 'One...' }, { who: 'Narrator', text: 'He takes a breath.' },
      { who: 'Squirm', text: "Yeah. Yeah, I'd like that." }, { who: 'Brightney', text: "Then you're welcome to come." },
      { who: 'Squirm', text: "I won't mess anything up. I-I won't touch anything I'm not supposed to, and I won't..." },
      { who: 'Brightney', text: 'Squirm.' }, { who: 'Narrator', text: 'He stops.' },
      { who: 'Brightney', text: 'I invited you to read with us. Not sit in the corner and apologize.' },
      { who: 'Squirm', text: '...Right.' }, { who: 'Brightney', text: 'Just come.' },
      { who: 'Narrator', text: 'A small smile.' }, { who: 'Squirm', text: 'Okay.' }
    ]},
    { name: 'Back', cast: ['Brightney', 'RnD', 'Squirm'], guests: ['Squirm'], lines: [
      { who: 'Narrator', text: 'The meeting happens after the next battle.' },
      { who: 'Brightney', text: 'Chapter six.' }, { who: 'Razzle', text: 'Already?' }, { who: 'Dazzle', text: "(...You'd know that if you hadn't fallen asleep...)" },
      { who: 'Razzle', text: "I wasn't asleep." }, { who: 'Narrator', text: 'Brightney looks at him.' }, { who: 'Razzle', text: '...For very long.' },
      { who: 'Brightney', text: 'Improvement.' }, { who: 'Narrator', text: 'Squirm laughs quietly.' },
      { who: 'Dazzle', text: '(...What did you think of the last chapter, Squirm...?)' },
      { who: 'Squirm', text: 'I liked it. I thought the ending was a little...' },
      { who: 'Narrator', text: 'He notices Brightney move one of the books farther from the edge of the table.' },
      { who: 'Narrator', text: 'Squirm stops.' }, { who: 'Dazzle', text: '(...A little...?)' }, { who: 'Squirm', text: 'Nothing.' },
      { who: 'Brightney', text: 'You were saying something.' }, { who: 'Squirm', text: "It's fine." },
      { who: 'Narrator', text: "Brightney notices the change, but doesn't press him." }
    ]},
    { name: 'Distracted', cast: ['RnD', 'Squirm'], guests: ['Squirm'], lines: [
      { who: 'Narrator', text: 'After the next battle, Dazzle catches Squirm alone.' },
      { who: 'Dazzle', text: "(...You didn't enjoy yourself...)" }, { who: 'Squirm', text: 'I did.' }, { who: 'Dazzle', text: '(...)' },
      { who: 'Squirm', text: 'I did! I just...' }, { who: 'Narrator', text: 'He rubs his arm.' },
      { who: 'Squirm', text: 'I kept thinking about it.' }, { who: 'Dazzle', text: '(...The books...?)' },
      { who: 'Narrator', text: 'Squirm nods.' },
      { who: 'Squirm', text: 'Every time somebody moved one, I thought it was because of me. Every time Brightney looked over, I thought...' },
      { who: 'Narrator', text: 'He takes a shaky breath.' }, { who: 'Squirm', text: "I don't know. Maybe coming back was stupid." },
      { who: 'Dazzle', text: "(...I don't think so...)" }, { who: 'Squirm', text: "You don't?" }, { who: 'Dazzle', text: '(...No...)' },
      { who: 'Narrator', text: 'Razzle approaches.' }, { who: 'Razzle', text: 'Neither do I.' }, { who: 'Narrator', text: 'Squirm looks at them.' },
      { who: 'Razzle', text: 'It was better having you there.' }, { who: 'Dazzle', text: '(...Much better...)' },
      { who: 'Narrator', text: 'Squirm looks down.' }, { who: 'Squirm', text: '...Thanks.' }
    ]},
    { name: 'Brightney', cast: ['Brightney', 'Vee'], guests: ['Vee'], lines: [
      { who: 'Narrator', text: 'Vee finds Brightney after another floor.' }, { who: 'Vee', text: 'So.' }, { who: 'Brightney', text: 'So?' },
      { who: 'Vee', text: "How'd your experiment go?" }, { who: 'Brightney', text: "It wasn't an experiment." },
      { who: 'Vee', text: 'You called it "one meeting."' }, { who: 'Narrator', text: 'Brightney sighs.' },
      { who: 'Brightney', text: 'Not very well.' }, { who: 'Vee', text: 'Did he eat anything?' }, { who: 'Brightney', text: 'Vee.' },
      { who: 'Vee', text: 'A book. I meant a book.' }, { who: 'Brightney', text: 'No.' }, { who: 'Vee', text: 'Did he cause a problem?' },
      { who: 'Brightney', text: 'No.' }, { who: 'Vee', text: 'Then what went wrong?' }, { who: 'Narrator', text: 'Brightney does not answer immediately.' },
      { who: 'Brightney', text: 'I think I made him feel like I expected one.' }, { who: 'Narrator', text: 'Vee glances at her.' }, { who: 'Vee', text: 'Ah.' },
      { who: 'Brightney', text: 'Do not "ah" me.' }, { who: 'Vee', text: 'I did not say anything.' }, { who: 'Brightney', text: 'You did not have to.' },
      { who: 'Narrator', text: 'Vee pauses.' }, { who: 'Vee', text: 'Want me to say something useful?' }, { who: 'Brightney', text: 'Preferably.' },
      { who: 'Vee', text: 'Talk to him.' }, { who: 'Narrator', text: 'Brightney stares at her.' }, { who: 'Vee', text: 'What?' },
      { who: 'Brightney', text: 'That was disappointingly reasonable.' }, { who: 'Vee', text: "I'm capable of those occasionally." }
    ]},
    { name: 'Trust', cast: ['Brightney', 'Squirm'], guests: ['Squirm'], lines: [
      { who: 'Narrator', text: 'After another battle, Brightney sits beside Squirm.' }, { who: 'Brightney', text: 'You left quickly last time.' },
      { who: 'Squirm', text: 'Sorry.' }, { who: 'Brightney', text: 'Do not apologize.' }, { who: 'Narrator', text: 'Squirm goes quiet.' },
      { who: 'Brightney', text: 'I was nervous.' }, { who: 'Narrator', text: 'He looks at her.' }, { who: 'Brightney', text: 'About inviting you back.' },
      { who: 'Squirm', text: '...I knew it.' }, { who: 'Brightney', text: 'Let me finish.' }, { who: 'Narrator', text: 'Squirm stops.' },
      { who: 'Brightney', text: 'I was not nervous because I did not want you there. I was nervous because I wanted it to work.' },
      { who: 'Squirm', text: 'But you do not trust me.' }, { who: 'Narrator', text: 'Brightney thinks before answering.' },
      { who: 'Brightney', text: 'Not completely.' }, { who: 'Narrator', text: 'Squirm looks down.' }, { who: 'Brightney', text: 'Yet.' },
      { who: 'Narrator', text: 'He looks back at her.' },
      { who: 'Brightney', text: 'I do not think pretending otherwise would help either of us.' }, { who: 'Squirm', text: '...No.' },
      { who: 'Brightney', text: 'But I trusted you enough to invite you once.' }, { who: 'Narrator', text: 'A pause.' },
      { who: 'Brightney', text: 'I think I can do it again.' }, { who: 'Narrator', text: 'Squirm sniffles.' },
      { who: 'Squirm', text: "I-I'd like that." }, { who: 'Brightney', text: 'Good.' }
    ]},
    { name: 'Next Chapter', cast: ['Brightney', 'RnD', 'Squirm', 'Vee'], guests: ['Squirm', 'Vee'], lines: [
      { who: 'Narrator', text: 'After the final battle, Brightney puts the book down.' }, { who: 'Brightney', text: 'Same time next meeting?' },
      { who: 'Squirm', text: 'You mean I am still invited?' }, { who: 'Brightney', text: 'I would not have asked otherwise.' },
      { who: 'Razzle', text: "Great! We're all back!" }, { who: 'Dazzle', text: '(...Assuming you stay awake...)' },
      { who: 'Razzle', text: 'I stay awake!' }, { who: 'Narrator', text: 'Brightney glances at Vee.' }, { who: 'Brightney', text: 'How long?' },
      { who: 'Vee', text: 'Seventeen minutes.' }, { who: 'Narrator', text: 'Razzle stares at her.' }, { who: 'Razzle', text: 'You TIMED me?!' },
      { who: 'Vee', text: 'Brightney said you had a record.' }, { who: 'Brightney', text: 'I was joking!' }, { who: 'Vee', text: 'You should have specified that.' },
      { who: 'Narrator', text: 'Dazzle quietly laughs.' }, { who: 'Dazzle', text: '(...Seventeen is not terrible...)' }, { who: 'Razzle', text: 'Thank you!' },
      { who: 'Dazzle', text: '(...For you...)' }, { who: 'Razzle', text: 'Oh.' }, { who: 'Narrator', text: 'Squirm laughs too.' },
      { who: 'Narrator', text: 'Then he notices the book sitting directly beside him.' }, { who: 'Narrator', text: 'Brightney has not moved it.' },
      { who: 'Narrator', text: 'He looks at her.' }, { who: 'Narrator', text: 'Brightney notices.' }, { who: 'Narrator', text: 'Neither says anything about it.' },
      { who: 'Squirm', text: 'So... chapter seven next time?' }, { who: 'Brightney', text: 'Chapter seven.' },
      { who: 'Dazzle', text: '(...I will be looking forward to it...)' }, { who: 'Razzle', text: 'Me too!' }, { who: 'Vee', text: 'Riveting.' },
      { who: 'Brightney', text: 'You do not have to stay, Vee.' }, { who: 'Vee', text: 'I know.' }, { who: 'Narrator', text: 'Vee does not leave.' }
    ]}
  ]
});

defCampaign({
  id: 'qom_soulvester_gourdy', badge: 'qom_soulvester_gourdy',
  a: 'QOMSoulvester', b: 'QOMGourdy',
  recLevel: friendshipRecLevel('QOMSoulvester', 'QOMGourdy'),
  title: 'Queens of Mischief: The Comeback',
  guests: ['QOMConnie', 'QOMEclipse', 'Vee'],
  stages: [
    { name: 'Getting the Band Back Together', cast: ['QOMSoulvester', 'QOMGourdy'], guests: [], lines: [
      { who: 'Narrator', text: 'Soulvester stands in his armor, looking over the empty stage.' },
      { who: 'Soulvester', text: 'The original show was cancelled long ago. “Queens of Parties” never saw the light. Yet here we stand once more.' },
      { who: 'Gourdy', text: 'We’re not doing “Parties” this time though, right? We’re doing it our way.' },
      { who: 'Soulvester', text: 'Indeed. Mischief instead. Chaos of our own design.' },
      { who: 'Narrator', text: 'Gourdy grins.' },
      { who: 'Gourdy', text: 'Then let’s make it count.' }
    ]},
    { name: 'The Original Queens Arrive', cast: ['QOMSoulvester', 'QOMGourdy', 'QOMConnie', 'QOMEclipse'], guests: ['QOMConnie', 'QOMEclipse'], lines: [
      { who: 'Narrator', text: 'Connie floats in, bass already in hand.' },
      { who: 'Connie', text: 'Look who finally showed up. My brother and the pumpkin. You two ready to stop practicing in secret?' },
      { who: 'Narrator', text: 'Eclipse’s tail swishes, her guitar strapped on.' },
      { who: 'Eclipse', text: 'We’re all in this now. The Queens of Mischief are back—whether the old plans liked it or not.' },
      { who: 'Soulvester', text: 'Sister. Eclipse. We will not fail this time.' },
      { who: 'Gourdy', text: 'Miss Connie, Miss Eclipse… it’s really happening.' },
      { who: 'Connie', text: 'Don’t get soft on us, Gourdy. Soft doesn’t sew chaos.' }
    ]},
    { name: 'Vee Watches from the Sidelines', cast: ['QOMSoulvester', 'QOMGourdy', 'QOMEclipse', 'Vee'], guests: ['QOMEclipse', 'Vee'], lines: [
      { who: 'Narrator', text: 'Vee leans against a prop, her screen flickering.' },
      { who: 'Vee', text: 'So the cancelled musical finally gets a second chance. With a new name and a lot more attitude.' },
      { who: 'Gourdy', text: 'We’re not trying to copy the old version, Miss Vee. We’re changing it.' },
      { who: 'Vee', text: 'I can see that. Just try not to short-circuit my cameras while you’re “sewing chaos all over town.”' },
      { who: 'Eclipse', text: 'No promises.' },
      { who: 'Soulvester', text: 'We shall endeavor to keep the property mostly intact.' }
    ]},
    { name: 'Quiet Doubts', cast: ['QOMSoulvester', 'QOMGourdy'], guests: [], lines: [
      { who: 'Narrator', text: 'The others tune up as Gourdy lowers his voice.' },
      { who: 'Gourdy', text: 'What if it still doesn’t work? What if people only remember the version that never happened?' },
      { who: 'Narrator', text: 'Soulvester places a gauntleted hand near his shoulder.' },
      { who: 'Soulvester', text: 'Then we give them something better to remember. Thou art not alone in this, my liege. Neither of us is.' },
      { who: 'Gourdy', text: '…Thanks. I needed that.' }
    ]},
    { name: 'Sibling Honesty', cast: ['QOMSoulvester', 'QOMGourdy', 'QOMConnie', 'QOMEclipse'], guests: ['QOMConnie', 'QOMEclipse'], lines: [
      { who: 'Narrator', text: 'Connie drifts beside Soulvester while Eclipse and Gourdy check the lights.' },
      { who: 'Connie', text: 'You know you don’t have to keep the full knight act the whole time. We’re not on the old script anymore.' },
      { who: 'Soulvester', text: 'The armor is part of the role I chose.' },
      { who: 'Connie', text: 'And the role we’re writing now is different. Just… don’t disappear behind it completely. Even I can tell when you’re actually worried.' },
      { who: 'Narrator', text: 'Soulvester pauses.' },
      { who: 'Soulvester', text: '…Thy words are noted. Unexpected, yet not unwelcome.' }
    ]},
    { name: 'The Perfect Team', cast: ['QOMSoulvester', 'QOMGourdy', 'QOMConnie', 'QOMEclipse', 'Vee'], guests: ['QOMConnie', 'QOMEclipse', 'Vee'], lines: [
      { who: 'Narrator', text: 'Eclipse looks around the group.' },
      { who: 'Eclipse', text: 'Double the trouble. Triple the fun. And now we’ve got five.' },
      { who: 'Gourdy', text: 'We’re the ones who actually get to finish what was started.' },
      { who: 'Soulvester', text: 'And we finish it on our terms.' },
      { who: 'Connie', text: 'Exactly. No cheap gimmicks. Only our real style.' },
      { who: 'Narrator', text: 'Vee watches from a distance, almost smiling.' },
      { who: 'Vee', text: 'You’re right on track. I’ll be watching the ratings.' }
    ]},
    { name: 'Finally Back', cast: ['QOMSoulvester', 'QOMGourdy', 'QOMConnie', 'QOMEclipse', 'Vee'], guests: ['QOMConnie', 'QOMEclipse', 'Vee'], lines: [
      { who: 'Soulvester', text: 'Ready?' },
      { who: 'Gourdy', text: 'Ready.' },
      { who: 'Eclipse', text: 'Howl check.' },
      { who: 'Connie', text: 'Haunt check.' },
      { who: 'Narrator', text: 'Vee sighs, but her screen stays bright.' },
      { who: 'Vee', text: 'Don’t make me regret giving you the spotlight.' },
      { who: 'Narrator', text: 'The five of them step onto the stage together—armor, pumpkin grin, floating ghost, glowing crescent, and a television keeping score—as the first notes of their own song finally fill the air.' },
      { who: 'Narrator', text: 'The Queens of Mischief are finally back.' }
    ]}
  ]
});

defCampaign({
  id: 'rodger_toodles', badge: 'rodger_toodles', a: 'Rodger', b: 'Toodles',
  recLevel: friendshipRecLevel('Rodger', 'Toodles'), title: 'Junior Detective',
  guests: ['Cocoa', 'Teagan', 'Blot'],
  stages: [
    { name: 'Next Time', cast: ['Rodger', 'Toodles'], guests: [], lines: [
      { who: 'Narrator', text: 'After the battle, Rodger examines a damaged sign.' }, { who: 'Toodles', text: 'Rodger!' }, { who: 'Rodger', text: 'Toodles.' },
      { who: 'Toodles', text: 'Is that a clue?' }, { who: 'Rodger', text: 'Perhaps.' }, { who: 'Narrator', text: 'Toodles crouches beside him.' },
      { who: 'Toodles', text: 'Can I help?' }, { who: 'Narrator', text: 'Rodger looks at her.' }, { who: 'Toodles', text: "Don't say next time." },
      { who: 'Rodger', text: "I haven't said anything." }, { who: 'Toodles', text: "You were gonna." }, { who: 'Rodger', text: '...Was I?' }, { who: 'Toodles', text: 'Yep.' },
      { who: 'Narrator', text: 'Rodger thinks.' }, { who: 'Rodger', text: 'Very well.' }, { who: 'Toodles', text: 'Huh?' }, { who: 'Rodger', text: 'You may assist.' },
      { who: 'Narrator', text: 'Toodles stares at him.' }, { who: 'Toodles', text: 'Really?!' }, { who: 'Rodger', text: 'Provided you listen to me.' },
      { who: 'Toodles', text: 'Junior Detective Toodles is on the case!' }, { who: 'Rodger', text: "I haven't even explained the case." }, { who: 'Toodles', text: 'Oh.' },
      { who: 'Narrator', text: 'A beat.' }, { who: 'Toodles', text: "What's the case?" }
    ]},
    { name: 'Missing', cast: ['Rodger', 'Toodles'], guests: [], lines: [
      { who: 'Narrator', text: 'Another battle is over.' }, { who: 'Narrator', text: 'Rodger opens his case.' },
      { who: 'Rodger', text: 'Three items have disappeared from this area since yesterday.' }, { who: 'Toodles', text: 'Somebody stole them!' },
      { who: 'Rodger', text: "That's what we're determining." }, { who: 'Toodles', text: 'What went missing?' },
      { who: 'Rodger', text: 'A roll of tape, a box of crayons and several pieces of candy.' }, { who: 'Narrator', text: 'Toodles thinks hard.' },
      { who: 'Toodles', text: "That's weird." }, { who: 'Rodger', text: 'Why?' }, { who: 'Toodles', text: 'If somebody wanted candy, why steal crayons?' },
      { who: 'Narrator', text: 'Rodger pauses.' }, { who: 'Rodger', text: 'Good.' }, { who: 'Toodles', text: 'Good?' }, { who: 'Rodger', text: "That's the correct question." },
      { who: 'Narrator', text: 'Toodles grins.' }, { who: 'Toodles', text: 'I knew that.' }, { who: 'Rodger', text: 'Of course you did.' }
    ]},
    { name: 'Cocoa', cast: ['Rodger', 'Toodles', 'Cocoa'], guests: ['Cocoa'], lines: [
      { who: 'Narrator', text: 'They catch Cocoa after the next encounter.' }, { who: 'Rodger', text: 'Cocoa. A moment, please.' }, { who: 'Cocoa', text: 'Sure!' },
      { who: 'Toodles', text: "We're investigating a robbery!" }, { who: 'Rodger', text: 'Missing items.' }, { who: 'Toodles', text: "That's less exciting." },
      { who: 'Cocoa', text: 'What went missing?' }, { who: 'Toodles', text: 'Candy, crayons and tape.' }, { who: 'Cocoa', text: 'Oh! I saw the candy!' },
      { who: 'Narrator', text: 'Rodger immediately focuses.' }, { who: 'Rodger', text: 'Where?' }, { who: 'Cocoa', text: 'Someone left it near the elevator. I moved it so nobody would step on it.' },
      { who: 'Toodles', text: "Where'd you put it?" }, { who: 'Cocoa', text: 'I...' }, { who: 'Narrator', text: 'Cocoa stops.' }, { who: 'Cocoa', text: 'Huh.' },
      { who: 'Toodles', text: 'You forgot?!' }, { who: 'Cocoa', text: 'I was helping with a lot of things!' }, { who: 'Narrator', text: 'Rodger makes a note.' },
      { who: 'Rodger', text: 'So the candy may never have been stolen.' }, { who: 'Toodles', text: 'One down!' }, { who: 'Rodger', text: 'Possibly.' },
      { who: 'Toodles', text: 'You really hate saying we solved stuff.' }, { who: 'Rodger', text: 'Premature conclusions ruin investigations.' }
    ]},
    { name: 'Prime Suspect', cast: ['Rodger', 'Toodles', 'Blot'], guests: ['Blot'], lines: [
      { who: 'Narrator', text: 'After another battle, they find Blot.' }, { who: 'Toodles', text: 'BLOT!' }, { who: 'Blot', text: '...' }, { who: 'Toodles', text: 'Hey! Blot!' },
      { who: 'Blot', text: '...' }, { who: 'Toodles', text: 'Blooooot!' }, { who: 'Blot', text: '?...seY' }, { who: 'Narrator', text: 'Toodles grins.' },
      { who: 'Toodles', text: 'Hehehe! Got you!' }, { who: 'Narrator', text: 'Rodger clears his throat.' }, { who: 'Rodger', text: 'Are you finished?' }, { who: 'Toodles', text: 'Mhm!' },
      { who: 'Narrator', text: 'Rodger shows Blot his notes.' }, { who: 'Rodger', text: "We're looking for several missing items. I believe you may have seen something." },
      { who: 'Narrator', text: 'Blot reads. Then points at the crayons.' }, { who: 'Blot', text: '.meht was I' }, { who: 'Toodles', text: 'He took them.' },
      { who: 'Rodger', text: 'Why?' }, { who: 'Narrator', text: 'Blot pantomimes drawing.' }, { who: 'Toodles', text: 'He was drawing!' }, { who: 'Narrator', text: 'Blot nods.' },
      { who: 'Rodger', text: 'And where are they now?' }, { who: 'Narrator', text: 'Blot points toward another room.' }, { who: 'Toodles', text: "So he didn't steal them." },
      { who: 'Rodger', text: 'Apparently not.' }, { who: 'Toodles', text: 'Two down!' }, { who: 'Rodger', text: 'One confirmed.' }, { who: 'Toodles', text: 'Ugh.' }
    ]},
    { name: 'Solved', cast: ['Rodger', 'Toodles'], guests: [], lines: [
      { who: 'Narrator', text: 'Another floor is cleared.' }, { who: 'Narrator', text: 'Rodger closes his notebook.' }, { who: 'Rodger', text: "I believe that's sufficient." },
      { who: 'Toodles', text: "We haven't found the tape." }, { who: 'Rodger', text: 'I know where it is.' }, { who: 'Toodles', text: 'You do?!' },
      { who: 'Rodger', text: "Scraps borrowed some recently. Most likely, that's our answer." }, { who: 'Narrator', text: 'Toodles stares at him.' },
      { who: 'Toodles', text: '"Most likely?"' }, { who: 'Rodger', text: "It's a reasonable conclusion." }, { who: 'Toodles', text: 'You said premature conclusions ruin investigations.' },
      { who: 'Narrator', text: 'Rodger pauses.' }, { who: 'Rodger', text: "This isn't premature." }, { who: 'Toodles', text: 'Did you ask Scraps?' }, { who: 'Rodger', text: 'Not yet.' },
      { who: 'Toodles', text: 'Then how do you know?' }, { who: 'Rodger', text: 'Toodles.' }, { who: 'Toodles', text: "That's cheating!" }, { who: 'Rodger', text: 'Cheating?' },
      { who: 'Toodles', text: "You're supposed to solve it!" }, { who: 'Narrator', text: 'Rodger sighs.' },
      { who: 'Rodger', text: 'I chose this case because I already had a fairly good idea what happened.' }, { who: 'Narrator', text: 'Silence.' },
      { who: 'Narrator', text: "Toodles' excitement disappears." }, { who: 'Toodles', text: '...You already knew?' }, { who: 'Narrator', text: 'Rodger realizes his mistake.' },
      { who: 'Toodles', text: 'You gave me a pretend case.' }, { who: 'Rodger', text: "Toodles, that's not what I meant." }, { who: 'Toodles', text: 'Whatever.' },
      { who: 'Narrator', text: 'She walks away.' }
    ]},
    { name: 'Tea', cast: ['Rodger', 'Teagan'], guests: ['Teagan'], lines: [
      { who: 'Narrator', text: 'After the next battle, Rodger finds Teagan.' }, { who: 'Teagan', text: 'There you are.' }, { who: 'Rodger', text: 'Have you seen Toodles?' },
      { who: 'Teagan', text: "She's with Cocoa." }, { who: 'Narrator', text: 'Rodger exhales.' }, { who: 'Teagan', text: 'Something happened?' }, { who: 'Rodger', text: 'I may have upset her.' },
      { who: 'Teagan', text: '"May have?"' }, { who: 'Narrator', text: 'Rodger gives her a look.' }, { who: 'Teagan', text: 'Sit.' }, { who: 'Rodger', text: 'Teagan...' },
      { who: 'Teagan', text: 'Sit.' }, { who: 'Narrator', text: 'Rodger does.' }, { who: 'Rodger', text: 'I finally allowed her to assist with a case.' }, { who: 'Teagan', text: 'How marvelous.' },
      { who: 'Rodger', text: 'I chose something simple.' }, { who: 'Teagan', text: 'Sensible.' }, { who: 'Rodger', text: 'Something I thought I had already solved.' },
      { who: 'Narrator', text: 'Teagan stops.' }, { who: 'Teagan', text: 'Ah.' }, { who: 'Rodger', text: 'There it is again.' }, { who: 'Teagan', text: 'What?' },
      { who: 'Rodger', text: "That look everyone gives me before explaining something I've already realized." }, { who: 'Narrator', text: 'Teagan smiles faintly.' },
      { who: 'Teagan', text: "Then I suppose I don't need to explain it." }, { who: 'Rodger', text: 'No.' }, { who: 'Teagan', text: 'Good.' }, { who: 'Narrator', text: 'She pours the tea.' },
      { who: 'Rodger', text: "That's all?" }, { who: 'Teagan', text: 'You already know where Toodles is.' }, { who: 'Narrator', text: 'Rodger looks at her.' }, { who: 'Teagan', text: 'Go talk to her.' }
    ]},
    { name: 'Wrong', cast: ['Rodger', 'Toodles', 'Cocoa'], guests: ['Cocoa'], lines: [
      { who: 'Narrator', text: 'After another battle, Rodger finds Toodles and Cocoa.' }, { who: 'Rodger', text: 'Toodles.' }, { who: 'Toodles', text: 'What?' }, { who: 'Rodger', text: 'You were right.' },
      { who: 'Narrator', text: 'She looks at him.' }, { who: 'Toodles', text: 'About what?' }, { who: 'Narrator', text: 'Rodger produces the missing tape.' }, { who: 'Rodger', text: "Scraps didn't have it." },
      { who: 'Narrator', text: "Toodles' eyes widen." }, { who: 'Toodles', text: 'Then where was it?!' }, { who: 'Rodger', text: "That's the problem." }, { who: 'Toodles', text: "You don't know?" },
      { who: 'Rodger', text: 'Not yet.' }, { who: 'Narrator', text: 'A grin slowly appears on her face.' }, { who: 'Toodles', text: "So the case isn't solved." }, { who: 'Rodger', text: 'No.' },
      { who: 'Toodles', text: 'And you were wrong.' }, { who: 'Narrator', text: 'Rodger hesitates.' }, { who: 'Rodger', text: 'Yes.' }, { who: 'Toodles', text: 'Say it again.' },
      { who: 'Rodger', text: "Don't push your luck." }, { who: 'Toodles', text: 'Hehehe!' }, { who: 'Narrator', text: 'Rodger hands her the notebook.' }, { who: 'Rodger', text: 'Well?' },
      { who: 'Toodles', text: 'What?' }, { who: 'Rodger', text: "It's your case too." }, { who: 'Narrator', text: 'Toodles looks at the notes. This time, Rodger waits for her.' },
      { who: 'Toodles', text: '...The tape was not stolen.' }, { who: 'Rodger', text: 'Go on.' }, { who: 'Toodles', text: 'Somebody was using it.' }, { who: 'Rodger', text: 'Why do you think that?' },
      { who: 'Toodles', text: 'Because Blot gave the crayons back.' }, { who: 'Narrator', text: 'She points to Cocoa.' }, { who: 'Toodles', text: 'Cocoa moved the candy.' }, { who: 'Narrator', text: 'Then the tape.' },
      { who: 'Toodles', text: 'Everybody took something because they needed it.' }, { who: 'Narrator', text: "Rodger's eye widens slightly." }, { who: 'Rodger', text: 'Interesting.' }
    ]},
    { name: 'Case Closed', cast: ['Rodger', 'Toodles', 'Cocoa', 'Blot', 'Teagan'], guests: ['Cocoa', 'Blot', 'Teagan'], lines: [
      { who: 'Narrator', text: 'The final battle ends. Blot is waiting for them.' }, { who: 'Blot', text: '.ereH' }, { who: 'Narrator', text: 'He points.' },
      { who: 'Narrator', text: "There's the missing tape, holding together part of a damaged decoration." }, { who: 'Toodles', text: 'I KNEW IT!' }, { who: 'Rodger', text: 'You suspected it.' },
      { who: 'Toodles', text: 'Same thing!' }, { who: 'Rodger', text: 'Absolutely not.' }, { who: 'Narrator', text: 'Cocoa examines it.' }, { who: 'Cocoa', text: 'Oh! I remember this!' },
      { who: 'Narrator', text: 'Rodger looks at her.' }, { who: 'Cocoa', text: 'I gave somebody the tape to fix that!' }, { who: 'Toodles', text: 'Who?!' }, { who: 'Narrator', text: 'Cocoa thinks.' },
      { who: 'Cocoa', text: '...I do not remember.' }, { who: 'Rodger', text: 'Remarkable.' }, { who: 'Cocoa', text: 'Sorry!' }, { who: 'Rodger', text: 'No harm done.' },
      { who: 'Narrator', text: "Toodles proudly closes Rodger's notebook." }, { who: 'Toodles', text: 'Case closed!' }, { who: 'Rodger', text: 'Indeed.' }, { who: 'Narrator', text: 'Teagan joins them.' },
      { who: 'Teagan', text: 'I take it the investigation was successful?' }, { who: 'Toodles', text: 'Mhm! And Rodger was wrong!' }, { who: 'Rodger', text: 'Must that be included in every retelling?' },
      { who: 'Narrator', text: 'Teagan suppresses a laugh.' }, { who: 'Rodger', text: 'Wonderful.' }, { who: 'Narrator', text: 'Toodles hands his notebook back.' },
      { who: 'Toodles', text: 'So...' }, { who: 'Narrator', text: 'Rodger already knows what is coming.' }, { who: 'Rodger', text: 'Yes.' }, { who: 'Toodles', text: 'I did not even ask yet!' },
      { who: 'Rodger', text: 'You were going to ask about my next case.' }, { who: 'Narrator', text: 'Toodles grins.' }, { who: 'Toodles', text: 'Can I come?' }, { who: 'Narrator', text: 'Rodger considers her for a moment.' },
      { who: 'Rodger', text: 'If it is appropriate.' }, { who: 'Narrator', text: "Toodles' expression changes." }, { who: 'Toodles', text: "That's not next time." }, { who: 'Rodger', text: 'No.' },
      { who: 'Toodles', text: "It's a real yes?" }, { who: 'Rodger', text: "It's a conditional yes." }, { who: 'Toodles', text: "That's close enough!" },
      { who: 'Narrator', text: 'She runs toward Cocoa and Blot.' }, { who: 'Toodles', text: "I'M A REAL DETECTIVE NOW!" }, { who: 'Rodger', text: 'Junior detective.' }, { who: 'Toodles', text: 'STILL COUNTS!' },
      { who: 'Narrator', text: 'Rodger watches her go.' }, { who: 'Narrator', text: 'Teagan steps beside him.' }, { who: 'Teagan', text: 'You look pleased with yourself.' },
      { who: 'Rodger', text: 'She did well.' }, { who: 'Teagan', text: 'She did.' }, { who: 'Narrator', text: 'Rodger glances at his notebook.' }, { who: 'Rodger', text: 'Better than I expected.' },
      { who: 'Teagan', text: "I wouldn't tell her that part." }, { who: 'Rodger', text: "I'm a detective, Teagan. I do possess some survival instinct." }
    ]}
  ]
});

defCampaign({
  id: 'goob_waxwell', badge: 'goob_waxwell', a: 'Goob', b: 'Waxwell',
  recLevel: friendshipRecLevel('Goob', 'Waxwell'), title: 'Stay Close',
  guests: ['Rodger', 'Finn'],
  stages: [
    { name: "Something's Wrong", cast: ['Goob', 'Waxwell', 'Rodger'], guests: ['Rodger'], lines: [
      { who: 'Narrator', text: 'The battle ends. Waxwell is standing farther down the hall.' }, { who: 'Goob', text: 'Waxwell!' }, { who: 'Narrator', text: 'Waxwell turns.' },
      { who: 'Waxwell', text: 'Oh. You.' }, { who: 'Goob', text: 'Are you okay?' }, { who: 'Waxwell', text: 'Perfectly.' }, { who: 'Goob', text: "You don't look okay." },
      { who: 'Waxwell', text: "And you don't look particularly observant." }, { who: 'Narrator', text: 'Goob tilts his head.' }, { who: 'Goob', text: 'You keep looking behind you.' },
      { who: 'Narrator', text: 'Waxwell stops.' }, { who: 'Narrator', text: 'Rodger notices.' }, { who: 'Rodger', text: 'Interesting.' }, { who: 'Waxwell', text: "Don't start." },
      { who: 'Rodger', text: "I haven't said anything." }, { who: 'Waxwell', text: "Somehow that's worse." }, { who: 'Narrator', text: 'Waxwell leaves.' },
      { who: 'Goob', text: 'See?' }, { who: 'Rodger', text: 'Indeed.' }, { who: 'Goob', text: "Something's bothering him." }, { who: 'Rodger', text: "Or he's hiding something." },
      { who: 'Narrator', text: 'Goob looks at him.' }, { who: 'Goob', text: "Those aren't the same thing." }
    ]},
    { name: 'Questions', cast: ['Goob', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'Another group of Twisteds is defeated.' }, { who: 'Rodger', text: 'Waxwell was coming from this direction.' },
      { who: 'Finn', text: 'Maybe he was just trying to get out of a rough plaice.' }, { who: 'Narrator', text: 'Rodger looks at him.' }, { who: 'Finn', text: 'Place.' }, { who: 'Rodger', text: 'I understood.' },
      { who: 'Narrator', text: 'Goob looks around.' }, { who: 'Goob', text: 'He was alone.' }, { who: 'Rodger', text: "Which doesn't tell us much." }, { who: 'Goob', text: "I don't think he wanted to be." },
      { who: 'Narrator', text: 'Rodger turns toward him.' }, { who: 'Rodger', text: 'What makes you say that?' }, { who: 'Goob', text: "I dunno." }, { who: 'Rodger', text: 'You must have noticed something.' },
      { who: 'Goob', text: 'Rodger, sometimes you can just tell!' }, { who: 'Rodger', text: "That's not particularly useful evidence." }, { who: 'Finn', text: 'I thought it was pretty fin sighted.' },
      { who: 'Rodger', text: 'Finn.' }, { who: 'Finn', text: 'Sorry.' }
    ]},
    { name: 'Following Him', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'After the next battle, they find Waxwell again.' }, { who: 'Waxwell', text: 'Are you following me?' }, { who: 'Rodger', text: 'Coincidence.' },
      { who: 'Waxwell', text: "You're a terrible liar." }, { who: 'Rodger', text: "I'm not lying." }, { who: 'Waxwell', text: "Then you're terrible at coincidences." },
      { who: 'Narrator', text: 'Goob walks closer.' }, { who: 'Goob', text: 'Waxwell?' }, { who: 'Waxwell', text: 'What?' }, { who: 'Goob', text: 'Do you want us to come with you?' },
      { who: 'Narrator', text: 'Waxwell stares at him.' }, { who: 'Waxwell', text: 'Why would I want that?' }, { who: 'Goob', text: 'Because you keep waiting for us.' }, { who: 'Narrator', text: 'Silence.' },
      { who: 'Narrator', text: 'Rodger looks at Waxwell.' }, { who: 'Narrator', text: "Waxwell's expression hardens." }, { who: 'Waxwell', text: 'I am doing nothing of the sort.' },
      { who: 'Narrator', text: 'He walks away.' }, { who: 'Narrator', text: 'Finn watches him go.' }, { who: 'Finn', text: '...He was totally waiting.' }, { who: 'Rodger', text: 'Yes.' }, { who: 'Goob', text: 'Told you.' }
    ]},
    { name: 'The Room', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'Another battle ends outside a damaged room.' }, { who: 'Narrator', text: 'Rodger examines the doorway.' }, { who: 'Rodger', text: 'There are marks here.' },
      { who: 'Finn', text: 'Twisted?' }, { who: 'Rodger', text: 'Several, judging by the damage.' }, { who: 'Narrator', text: 'Goob notices Waxwell staring into the room.' }, { who: 'Goob', text: 'Is this where you were going?' },
      { who: 'Narrator', text: 'Waxwell does not answer.' }, { who: 'Rodger', text: 'Waxwell.' }, { who: 'Waxwell', text: 'Must you interrogate everyone you meet?' },
      { who: 'Rodger', text: 'Only those who repeatedly refuse simple questions.' }, { who: 'Waxwell', text: 'Then perhaps ask better ones.' }, { who: 'Goob', text: 'Were you scared?' },
      { who: 'Narrator', text: 'Waxwell turns sharply.' }, { who: 'Waxwell', text: 'Excuse me?' }, { who: 'Goob', text: 'Before.' }, { who: 'Narrator', text: 'Waxwell glares at him.' },
      { who: 'Waxwell', text: "Don't be ridiculous." }, { who: 'Goob', text: 'Okay.' }, { who: 'Narrator', text: 'Goob does not argue. Somehow, that bothers Waxwell more.' }
    ]},
    { name: 'Cornered', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'The next battle is considerably worse.' }, { who: 'Finn', text: 'Whew! That was a little too close for com-fort!' }, { who: 'Narrator', text: 'Nobody reacts.' },
      { who: 'Finn', text: '...Nothing?' }, { who: 'Narrator', text: 'Rodger is looking at Waxwell.' }, { who: 'Rodger', text: 'You knew there would be more here.' },
      { who: 'Waxwell', text: 'I suspected.' }, { who: 'Rodger', text: 'Yet neglected to mention it.' }, { who: 'Waxwell', text: 'Would you have listened?' }, { who: 'Rodger', text: 'Yes.' },
      { who: 'Waxwell', text: 'How unfortunate.' }, { who: 'Rodger', text: 'What exactly are you doing here?' }, { who: 'Waxwell', text: 'None of your concern.' },
      { who: 'Rodger', text: 'Considering we just fought our way through several Twisteds because we followed you, I disagree.' }, { who: 'Narrator', text: 'Waxwell turns away.' },
      { who: 'Goob', text: 'Rodger.' }, { who: 'Rodger', text: 'Yes?' }, { who: 'Goob', text: 'Stop.' }, { who: 'Narrator', text: 'Rodger looks surprised.' },
      { who: 'Goob', text: "He's already scared." }, { who: 'Narrator', text: "Waxwell's expression immediately changes." }, { who: 'Waxwell', text: 'I am NOT scared.' },
      { who: 'Goob', text: 'Okay.' }, { who: 'Waxwell', text: 'Stop saying "okay" like that!' }, { who: 'Goob', text: 'Like what?!' }
    ]},
    { name: 'What Happened', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'After another fight, Waxwell finally stops running ahead.' }, { who: 'Waxwell', text: 'I made a mistake.' }, { who: 'Narrator', text: 'Nobody interrupts.' },
      { who: 'Waxwell', text: 'Earlier. I thought I could get through here alone.' }, { who: 'Rodger', text: 'And?' }, { who: 'Waxwell', text: "And I couldn't." }, { who: 'Narrator', text: "Finn's smile fades." },
      { who: 'Waxwell', text: 'Happy?' }, { who: 'Rodger', text: 'Why would that make me happy?' }, { who: 'Narrator', text: 'Waxwell looks away.' }, { who: 'Waxwell', text: 'I left something behind.' },
      { who: 'Goob', text: 'What?' }, { who: 'Narrator', text: 'Waxwell does not answer.' }, { who: 'Goob', text: 'Is it important?' }, { who: 'Waxwell', text: '...Yes.' },
      { who: 'Narrator', text: 'Rodger starts to speak. Goob holds an arm in front of him.' }, { who: 'Rodger', text: 'Goob.' }, { who: 'Goob', text: 'No more questions.' },
      { who: 'Rodger', text: 'I only intended to ask what we are looking for.' }, { who: 'Narrator', text: 'Goob pauses.' }, { who: 'Goob', text: 'Oh.' }, { who: 'Rodger', text: 'Some questions are necessary.' },
      { who: 'Goob', text: '...Okay, that one can stay.' }, { who: 'Narrator', text: 'Waxwell almost smiles. Almost.' }
    ]},
    { name: 'Going Back', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'The group survives another encounter.' }, { who: 'Finn', text: 'Are we close?' }, { who: 'Waxwell', text: 'Yes.' }, { who: 'Rodger', text: 'You said that ten minutes ago.' },
      { who: 'Waxwell', text: "I didn't ask you to come." }, { who: 'Rodger', text: 'No. You simply led us here while repeatedly checking whether we were still following.' },
      { who: 'Narrator', text: 'Waxwell glares at him.' }, { who: 'Finn', text: "He's got you there." }, { who: 'Waxwell', text: 'Nobody asked you either.' },
      { who: 'Narrator', text: "Goob notices Waxwell's hands shaking slightly." }, { who: 'Narrator', text: 'He reaches out.' }, { who: 'Narrator', text: 'Waxwell immediately pulls away.' },
      { who: 'Waxwell', text: "Don't." }, { who: 'Narrator', text: 'Goob stops.' }, { who: 'Goob', text: 'Okay.' }, { who: 'Narrator', text: 'A pause.' },
      { who: 'Goob', text: 'Want me to stay close, though?' }, { who: 'Narrator', text: 'Waxwell looks at him.' }, { who: 'Waxwell', text: '...' }, { who: 'Goob', text: "I don't have to hug you." },
      { who: 'Waxwell', text: 'What an extraordinarily generous concession.' }, { who: 'Goob', text: 'Thanks!' }, { who: 'Waxwell', text: 'That was sarcasm.' }, { who: 'Goob', text: 'Oh.' },
      { who: 'Narrator', text: 'A beat.' }, { who: 'Goob', text: "I'm still staying close." }, { who: 'Narrator', text: 'Waxwell does not object.' }
    ]},
    { name: 'Found', cast: ['Goob', 'Waxwell', 'Rodger', 'Finn'], guests: ['Rodger', 'Finn'], lines: [
      { who: 'Narrator', text: 'The final Twisted falls.' }, { who: 'Narrator', text: 'Waxwell immediately enters the room. The others follow.' }, { who: 'Finn', text: 'What are we looking for?' },
      { who: 'Narrator', text: 'Waxwell moves some debris. Underneath is a small personal belonging he had lost earlier.' }, { who: 'Narrator', text: 'He picks it up.' }, { who: 'Narrator', text: 'Silence.' },
      { who: 'Rodger', text: 'I see.' }, { who: 'Waxwell', text: "Don't." }, { who: 'Rodger', text: "I wasn't going to say anything." }, { who: 'Waxwell', text: 'For once, continue doing that.' },
      { who: 'Narrator', text: 'Goob smiles.' }, { who: 'Goob', text: 'We found it!' }, { who: 'Waxwell', text: 'I found it.' }, { who: 'Goob', text: 'We helped!' }, { who: 'Waxwell', text: 'Unfortunately.' },
      { who: 'Narrator', text: 'Finn looks around.' }, { who: 'Finn', text: 'Well, I think that went swimmingly.' }, { who: 'Narrator', text: 'Rodger turns toward him.' }, { who: 'Finn', text: 'What?' },
      { who: 'Rodger', text: 'We were nearly caught by Twisteds repeatedly.' }, { who: 'Finn', text: "But we weren't!" }, { who: 'Rodger', text: 'That does not make it "swimmingly."' }, { who: 'Finn', text: 'More like treading water?' }, { who: 'Rodger', text: 'Please stop.' },
      { who: 'Narrator', text: 'Goob is still watching Waxwell.' }, { who: 'Waxwell', text: 'What?' }, { who: 'Goob', text: 'You look better.' }, { who: 'Narrator', text: 'Waxwell pauses.' },
      { who: 'Waxwell', text: 'You really do notice everything, do you not?' }, { who: 'Goob', text: 'Nope!' }, { who: 'Narrator', text: 'Waxwell raises an eyebrow.' }, { who: 'Goob', text: 'Just people.' },
      { who: 'Narrator', text: 'That actually shuts Waxwell up.' }, { who: 'Rodger', text: 'Hm.' }, { who: 'Goob', text: 'What?' }, { who: 'Rodger', text: 'Nothing.' }, { who: 'Goob', text: "You're doing the thinking thing." },
      { who: 'Rodger', text: "I don't have a thinking thing." }, { who: 'Goob', text: 'You do!' }, { who: 'Finn', text: "He's right." }, { who: 'Rodger', text: 'Nobody asked you, Finn.' },
      { who: 'Narrator', text: 'Waxwell starts walking.' }, { who: 'Goob', text: 'Waxwell!' }, { who: 'Waxwell', text: 'What now?' }, { who: 'Narrator', text: 'Goob opens his arms.' },
      { who: 'Goob', text: 'Now can I hug you?' }, { who: 'Waxwell', text: 'No.' }, { who: 'Goob', text: 'Okay!' }, { who: 'Narrator', text: 'Goob follows him anyway.' },
      { who: 'Narrator', text: 'After a moment, Waxwell slows enough for him to catch up.' }
    ]}
  ]
});

defCampaign({
  id: 'gourdy_connie', badge: 'gourdy_connie', a: 'Gourdy', b: 'Connie',
  recLevel: friendshipRecLevel('Gourdy', 'Connie'), title: 'Enough',
  guests: ['Eclipse', 'Sprout', 'Cosmo'],
  stages: [
    { name: 'Again', cast: ['Gourdy', 'Connie', 'Eclipse'], guests: ['Eclipse'], lines: [
      { who: 'Narrator', text: 'The battle ends. Gourdy looks back over the floor.' }, { who: 'Gourdy', text: "Everyone's here?" }, { who: 'Eclipse', text: 'YEP!!!' },
      { who: 'Gourdy', text: 'Ms. Connie?' }, { who: 'Narrator', text: 'No answer.' }, { who: 'Gourdy', text: 'Ms. Connie?' }, { who: 'Narrator', text: 'Connie suddenly appears beside him.' },
      { who: 'Connie', text: 'You called?' }, { who: 'Narrator', text: 'Gourdy jumps.' }, { who: 'Connie', text: 'Still works.' }, { who: 'Gourdy', text: 'Where were you?!' }, { who: 'Connie', text: 'Around.' },
      { who: 'Gourdy', text: 'You disappeared during the fight!' }, { who: 'Connie', text: 'And yet, here I am.' }, { who: 'Gourdy', text: "That's not the point." }, { who: 'Narrator', text: 'Connie looks at him.' },
      { who: 'Connie', text: 'Since when do I need permission to leave?' }, { who: 'Gourdy', text: "You don't." }, { who: 'Narrator', text: 'A pause.' }, { who: 'Gourdy', text: 'Just tell me next time.' }
    ]},
    { name: 'Keeping Track', cast: ['Gourdy', 'Connie'], guests: [], lines: [
      { who: 'Narrator', text: 'Another battle ends.' }, { who: 'Gourdy', text: 'Eclipse?' }, { who: 'Narrator', text: 'Eclipse answers from somewhere nearby.' }, { who: 'Gourdy', text: 'HERE!!!' },
      { who: 'Gourdy', text: 'Soulvester?' }, { who: 'Narrator', text: 'A response comes from farther away.' }, { who: 'Gourdy', text: 'Ms. Connie?' }, { who: 'Connie', text: 'Behind you.' },
      { who: 'Narrator', text: 'Gourdy does not jump this time.' }, { who: 'Connie', text: "You're getting boring." }, { who: 'Gourdy', text: "I'm checking everyone made it." }, { who: 'Connie', text: 'I noticed.' },
      { who: 'Gourdy', text: 'Somebody has to.' }, { who: 'Connie', text: 'Does it have to be you?' }, { who: 'Narrator', text: 'Gourdy pauses.' }, { who: 'Gourdy', text: "I'm the Main." },
      { who: 'Connie', text: "That wasn't my question." }, { who: 'Narrator', text: 'Gourdy does not answer.' }
    ]},
    { name: 'Mr. Seedly', cast: ['Gourdy', 'Sprout'], guests: ['Sprout'], lines: [
      { who: 'Narrator', text: 'After another encounter, Sprout notices Gourdy counting everyone again.' }, { who: 'Sprout', text: 'Gourdy.' }, { who: 'Gourdy', text: 'Yes, Mr. Seedly?' },
      { who: 'Narrator', text: 'Sprout winces.' }, { who: 'Sprout', text: 'Sprout.' }, { who: 'Gourdy', text: 'Right. Sorry, Mr... Sprout.' }, { who: 'Sprout', text: 'You hurt?' }, { who: 'Gourdy', text: 'Nope!' },
      { who: 'Sprout', text: 'Then why are you pacing?' }, { who: 'Gourdy', text: "I'm making sure everyone's alright." }, { who: 'Sprout', text: "You've checked three times." }, { who: 'Narrator', text: 'Gourdy stops.' },
      { who: 'Gourdy', text: "I don't want to miss something." }, { who: 'Sprout', text: 'Neither do I.' }, { who: 'Narrator', text: 'Gourdy looks at him.' }, { who: 'Sprout', text: "Doesn't mean you won't." },
      { who: 'Gourdy', text: "That's reassuring." }, { who: 'Sprout', text: "Wasn't supposed to be." }
    ]},
    { name: 'Main Character', cast: ['Gourdy', 'Connie'], guests: [], lines: [
      { who: 'Narrator', text: 'The next battle was worse. Connie reappears after everyone else.' }, { who: 'Gourdy', text: 'Where were you?' }, { who: 'Connie', text: 'Busy.' }, { who: 'Gourdy', text: 'Doing what?' },
      { who: 'Connie', text: 'Gourdy.' }, { who: 'Gourdy', text: 'What?' }, { who: 'Connie', text: "You're doing it again." }, { who: 'Gourdy', text: 'Doing what?' },
      { who: 'Connie', text: 'Acting like you are responsible for everybody in the room.' }, { who: 'Gourdy', text: 'Somebody should be!' }, { who: 'Connie', text: 'Why?' },
      { who: 'Gourdy', text: "Because I'm supposed to be good at this!" }, { who: 'Narrator', text: "Connie's expression changes." }, { who: 'Gourdy', text: "I'm a Main. They're counting on me." },
      { who: 'Connie', text: 'Did they tell you that?' }, { who: 'Gourdy', text: "They don't have to." }, { who: 'Connie', text: "That's convenient." }, { who: 'Narrator', text: 'Gourdy frowns.' },
      { who: 'Gourdy', text: "What's that supposed to mean?" }, { who: 'Connie', text: 'It means nobody can tell you you are wrong if the conversation only happened in your head.' }, { who: 'Narrator', text: 'Gourdy does not respond.' }
    ]},
    { name: 'Trying Hard', cast: ['Gourdy', 'Cosmo'], guests: ['Cosmo'], lines: [
      { who: 'Narrator', text: 'After another battle, Cosmo finds Gourdy alone.' }, { who: 'Cosmo', text: 'Gourdy?' }, { who: 'Gourdy', text: 'Hi, Mr. Cosmo.' }, { who: 'Cosmo', text: 'Are you okay?' },
      { who: 'Gourdy', text: 'Mhm.' }, { who: 'Narrator', text: 'Cosmo waits.' }, { who: 'Gourdy', text: '...' }, { who: 'Cosmo', text: 'Gourdy.' }, { who: 'Gourdy', text: "I'm trying really hard." },
      { who: 'Cosmo', text: 'At what?' }, { who: 'Narrator', text: 'Gourdy looks toward the others.' }, { who: 'Gourdy', text: 'All of it.' }, { who: 'Narrator', text: 'A pause.' },
      { who: 'Gourdy', text: "Dyle said I'm good at being Halloween's Main." }, { who: 'Cosmo', text: "That's nice." }, { who: 'Gourdy', text: 'It is.' }, { who: 'Narrator', text: 'He looks down.' },
      { who: 'Gourdy', text: 'I just wish hearing it made me stop wondering.' }, { who: 'Narrator', text: 'Cosmo understands.' }, { who: 'Cosmo', text: "I don't think being worried means you're doing badly." },
      { who: 'Gourdy', text: "Doesn't feel that way." }, { who: 'Cosmo', text: 'No.' }, { who: 'Narrator', text: 'Cosmo sits beside him.' }, { who: 'Cosmo', text: 'Usually does not.' }
    ]},
    { name: 'Connie', cast: ['Gourdy', 'Connie'], guests: [], lines: [
      { who: 'Narrator', text: 'Another floor is cleared.' }, { who: 'Connie', text: "You're avoiding me." }, { who: 'Gourdy', text: 'Nope.' }, { who: 'Connie', text: "You're terrible at it." },
      { who: 'Gourdy', text: "I'm busy." }, { who: 'Connie', text: 'Doing?' }, { who: 'Gourdy', text: "Making sure everybody's okay." }, { who: 'Narrator', text: 'Connie sighs.' }, { who: 'Gourdy', text: 'What?' },
      { who: 'Connie', text: "You're exhausting." }, { who: 'Narrator', text: 'Gourdy goes quiet.' }, { who: 'Narrator', text: 'Connie immediately realizes how that sounded.' }, { who: 'Connie', text: 'Not like that.' },
      { who: 'Gourdy', text: "It's fine." }, { who: 'Connie', text: "No, it isn't." }, { who: 'Narrator', text: 'Gourdy looks at her.' }, { who: 'Connie', text: "You're exhausting because you're trying to do five people's jobs and then getting upset when you can't." },
      { who: 'Gourdy', text: "I'm supposed to look after them." }, { who: 'Connie', text: "I'm older than you." }, { who: 'Gourdy', text: 'So?' }, { who: 'Connie', text: 'So stop trying to look after me.' },
      { who: 'Gourdy', text: 'What if something happens?' }, { who: 'Connie', text: 'Then something happens.' }, { who: 'Gourdy', text: 'How can you say that?' }, { who: 'Connie', text: "Because I don't think everything that goes wrong is my fault." },
      { who: 'Narrator', text: 'That shuts him up.' }
    ]},
    { name: 'Blackout', cast: ['Gourdy', 'Connie', 'Eclipse'], guests: ['Eclipse'], lines: [
      { who: 'Narrator', text: 'The lights return after a difficult floor. Eclipse is breathing heavily.' }, { who: 'Gourdy', text: 'Eclipse?' }, { who: 'Eclipse', text: "I'M FINE!!!" }, { who: 'Gourdy', text: "You don't look fine." },
      { who: 'Eclipse', text: 'Just... give me a second!!!' }, { who: 'Narrator', text: 'Gourdy starts toward her.' }, { who: 'Narrator', text: "Connie catches his arm." }, { who: 'Gourdy', text: 'What?' },
      { who: 'Connie', text: 'She said give her a second.' }, { who: 'Narrator', text: 'Gourdy watches Eclipse.' }, { who: 'Gourdy', text: 'I should help.' }, { who: 'Connie', text: 'Maybe.' },
      { who: 'Gourdy', text: 'Maybe?' }, { who: 'Connie', text: 'Or maybe you should listen to her.' }, { who: 'Narrator', text: 'Gourdy reluctantly stays where he is.' },
      { who: 'Narrator', text: 'Eventually Eclipse approaches them herself.' }, { who: 'Eclipse', text: 'Sorry.' }, { who: 'Gourdy', text: "You don't have to apologize." }, { who: 'Eclipse', text: 'I know.' },
      { who: 'Narrator', text: 'She exhales.' }, { who: 'Eclipse', text: '...Thanks for waiting.' }, { who: 'Narrator', text: 'Gourdy looks at Connie. Connie says nothing. She does not need to.' }
    ]},
    { name: 'Enough', cast: ['Gourdy', 'Connie', 'Cosmo', 'Sprout'], guests: ['Cosmo', 'Sprout'], lines: [
      { who: 'Narrator', text: 'The final battle ends. Gourdy automatically looks around. He starts counting. Then stops himself.' }, { who: 'Connie', text: 'Well?' }, { who: 'Gourdy', text: 'What?' },
      { who: 'Connie', text: "Aren't you going to make sure we're all still alive?" }, { who: 'Gourdy', text: 'I can see you.' }, { who: 'Connie', text: 'Look at that. Progress.' },
      { who: 'Gourdy', text: "Don't make fun of me." }, { who: 'Connie', text: "I'm a ghost. It's practically contractual." }, { who: 'Narrator', text: 'Cosmo and Sprout approach.' },
      { who: 'Sprout', text: 'Everyone good?' }, { who: 'Cosmo', text: "I'm okay." }, { who: 'Narrator', text: 'Sprout immediately relaxes.' }, { who: 'Connie', text: 'Subtle.' }, { who: 'Sprout', text: 'What?' }, { who: 'Connie', text: 'Nothing.' },
      { who: 'Narrator', text: 'Gourdy looks at the group.' }, { who: 'Gourdy', text: 'I still feel like I should be doing something.' }, { who: 'Connie', text: 'You are.' }, { who: 'Gourdy', text: 'What?' },
      { who: 'Connie', text: "You're here." }, { who: 'Narrator', text: 'Gourdy does not seem convinced.' }, { who: 'Connie', text: 'You fought. You checked on people. Nobody died. Take the win.' },
      { who: 'Gourdy', text: "That's a pretty low standard." }, { who: 'Connie', text: 'Fine. Raise it tomorrow.' }, { who: 'Narrator', text: 'Gourdy laughs quietly.' }, { who: 'Gourdy', text: 'Ms. Connie?' },
      { who: 'Connie', text: 'Yeah?' }, { who: 'Gourdy', text: 'Do you think I am good at this?' }, { who: 'Narrator', text: 'Connie considers him.' }, { who: 'Connie', text: 'Sometimes.' },
      { who: 'Narrator', text: "Gourdy's face falls." }, { who: 'Connie', text: 'You wanted an honest answer.' }, { who: 'Gourdy', text: '...Yeah.' }, { who: 'Connie', text: 'You are inexperienced. You overthink everything. You try too hard.' },
      { who: 'Narrator', text: 'She looks at him.' }, { who: 'Connie', text: "But you're still here when things get ugly." }, { who: 'Narrator', text: 'A pause.' }, { who: 'Connie', text: "That's worth something." },
      { who: 'Narrator', text: 'Gourdy nods.' }, { who: 'Gourdy', text: "I'll take it." }, { who: 'Connie', text: 'Good.' }, { who: 'Narrator', text: 'They start walking.' },
      { who: 'Gourdy', text: 'Ms. Connie?' }, { who: 'Connie', text: 'What?' }, { who: 'Gourdy', text: 'Where were you during the first battle?' }, { who: 'Connie', text: 'Not telling you.' },
      { who: 'Gourdy', text: 'Why?!' }, { who: 'Connie', text: 'Because this version of you is more entertaining.' }, { who: 'Gourdy', text: 'Ms. Connie!' }, { who: 'Narrator', text: 'Connie disappears.' },
      { who: 'Narrator', text: 'Gourdy watches the empty space. This time, he does not go looking for her.' }
    ]}
  ]
});

defCampaign({
  id: 'rnd_rudie', badge: 'rnd_rudie', a: 'RnD', b: 'Rudie',
  recLevel: friendshipRecLevel('RnD', 'Rudie'), title: 'The Christmas Mystery',
  guests: ['Yatta', 'Boxten'],
  stages: [
    { name: 'Rehearsal', cast: ['RnD', 'Rudie'], guests: [], lines: [
      { who: 'Narrator', text: 'The Twisteds are gone. Razzle and Dazzle immediately return to their script.' },
      { who: 'Razzle', text: 'Alright! Where were we? (We were interrupted.)' }, { who: 'Rudie', text: 'Rehearsing something?!' },
      { who: 'Razzle', text: "Rudie! Yeah! (Please don't encourage him.)" }, { who: 'Rudie', text: "Oooh, a play! What's it about?" },
      { who: 'Razzle', text: 'Mystery! Betrayal! Adventure! (Misery...)' }, { who: 'Narrator', text: 'Rudie looks over the script.' },
      { who: 'Rudie', text: "You know what it's missing?" }, { who: 'Razzle', text: "What? (...Don't ask.)" }, { who: 'Rudie', text: 'CHRISTMAS!!!' },
      { who: 'Dazzle', text: '(...There it is.)' }, { who: 'Razzle', text: 'Hah! Imagine!' }, { who: 'Rudie', text: 'I AM imagining!' }, { who: 'Narrator', text: 'Dazzle looks at Razzle.' },
      { who: 'Dazzle', text: "(...You shouldn't have laughed.)" }
    ]},
    { name: 'Revision', cast: ['RnD', 'Rudie'], guests: [], lines: [
      { who: 'Narrator', text: 'Another battle ends.' }, { who: 'Razzle', text: '"The manor stood empty beneath the moon..." (...Good. We are still on the first page.)' },
      { who: 'Narrator', text: 'Rudie enters carrying a string of decorations.' }, { who: 'Rudie', text: 'NOT ANYMORE!' }, { who: 'Razzle', text: "Where did you even get those? (...I don't want to know.)" },
      { who: 'Rudie', text: "You can't have a gloomy old manor without decorations!" }, { who: 'Dazzle', text: '(...You absolutely can.)' }, { who: 'Narrator', text: 'Rudie hangs one anyway.' },
      { who: 'Rudie', text: 'Better!' }, { who: 'Razzle', text: 'Actually... I kinda like it. (...Razzle.)' }, { who: 'Razzle', text: 'Just one!' }, { who: 'Dazzle', text: '(...It never stays at one.)' },
      { who: 'Narrator', text: 'Rudie looks offended.' }, { who: 'Rudie', text: 'Of course not!' }, { who: 'Dazzle', text: '(...Exactly.)' }
    ]},
    { name: 'Yatta', cast: ['RnD', 'Rudie', 'Yatta'], guests: ['Yatta'], lines: [
      { who: 'Narrator', text: 'After the next floor, Yatta discovers what is happening.' }, { who: 'Yatta', text: "WHAT'S THIS?!" },
      { who: 'Razzle', text: "We're rehearsing! (We were rehearsing.)" }, { who: 'Rudie', text: "We're improving it!" }, { who: 'Dazzle', text: '(...He is ruining it.)' },
      { who: 'Narrator', text: 'Yatta grabs the script.' }, { who: 'Yatta', text: 'Theatre... Christmas... WAIT!!! You need MOVEMENT!' }, { who: 'Razzle', text: 'Movement? (...No.)' },
      { who: 'Yatta', text: 'BACKFLIPS! FRONTFLIPS! SUPER COOL FLIPS!!!' }, { who: 'Dazzle', text: '(...It is a murder mystery.)' }, { who: 'Yatta', text: 'MURDER MYSTERY FLIPS!!!' },
      { who: 'Narrator', text: 'Razzle bursts out laughing.' }, { who: 'Razzle', text: "Okay, I'd watch that! (...Of course you would.)" }, { who: 'Yatta', text: "THEN WE'RE DOING IT!!!" },
      { who: 'Dazzle', text: '(...I preferred the Twisteds.)' }
    ]},
    { name: 'Music', cast: ['RnD', 'Rudie', 'Yatta', 'Boxten'], guests: ['Yatta', 'Boxten'], lines: [
      { who: 'Narrator', text: 'Boxten arrives after another battle.' }, { who: 'Boxten', text: 'Uh... why is there tinsel everywhere?' }, { who: 'Rudie', text: 'BOXTEN!!!' }, { who: 'Narrator', text: 'Boxten flinches.' },
      { who: 'Boxten', text: 'Rudie...' }, { who: 'Rudie', text: 'Our performance needs music!' }, { who: 'Boxten', text: 'Oh. Uhm... I could probably help with that.' },
      { who: 'Rudie', text: 'And it has to sound CHRISTMASY!' }, { who: 'Narrator', text: 'Boxten pauses.' }, { who: 'Boxten', text: '...Of course it does.' },
      { who: 'Razzle', text: "It'll be fun! (It's getting difficult to tell what we're rehearsing.)" }, { who: 'Narrator', text: 'Boxten looks at the script.' },
      { who: 'Boxten', text: "Wasn't this supposed to be a mystery?" }, { who: 'Dazzle', text: '(...Thank you.)' }, { who: 'Rudie', text: "It's a CHRISTMAS mystery now!" },
      { who: 'Boxten', text: 'Right...' }, { who: 'Yatta', text: 'WITH ACROBATICS!!!' }, { who: 'Boxten', text: '...Right.' }, { who: 'Dazzle', text: "(...He's reconsidering.)" }, { who: 'Boxten', text: 'A little.' }
    ]},
    { name: 'Off Script', cast: ['RnD', 'Rudie', 'Yatta'], guests: ['Yatta'], lines: [
      { who: 'Narrator', text: 'Another encounter ends. They try running the scene.' }, { who: 'Razzle', text: '"Whoever entered this room left no trace!" (...Except the footprints by the door.)' },
      { who: 'Rudie', text: '"Except... THIS!"' }, { who: 'Narrator', text: 'Rudie produces a wrapped present.' }, { who: 'Dazzle', text: '...' }, { who: 'Razzle', text: "Hah! Nice! (...That's not in the script.)" },
      { who: 'Rudie', text: 'Improvise!' }, { who: 'Dazzle', text: '(...No.)' }, { who: 'Narrator', text: 'Everyone pauses.' }, { who: 'Rudie', text: 'No?' }, { who: 'Dazzle', text: '(...No.)' },
      { who: 'Yatta', text: "C'MON! It'll be FUN! Just SAY something!" }, { who: 'Narrator', text: 'Dazzle looks down at the script.' }, { who: 'Dazzle', text: '(...)' },
      { who: 'Razzle', text: 'Dazzle?' }, { who: 'Dazzle', text: "(...I don't know what I'm supposed to say.)" }, { who: 'Razzle', text: 'Anything!' }, { who: 'Narrator', text: 'Dazzle goes quiet again.' },
      { who: 'Dazzle', text: "(...That's the problem.)" }, { who: 'Narrator', text: 'The room finally settles.' }
    ]},
    { name: 'Lines', cast: ['RnD', 'Boxten'], guests: ['Boxten'], lines: [
      { who: 'Narrator', text: 'After the next battle, Boxten finds Razzle and Dazzle away from the others.' },
      { who: 'Razzle', text: 'I thought you liked acting. (...I do.)' }, { who: 'Razzle', text: "Then what's wrong? (...This isn't acting anymore.)" }, { who: 'Narrator', text: 'Razzle looks confused.' },
      { who: 'Dazzle', text: '(...I know my lines. I know what happens next.)' }, { who: 'Narrator', text: 'Boxten glances at him.' }, { who: 'Dazzle', text: '(...When I am reading them, my mind stays there.)' },
      { who: 'Narrator', text: 'A pause.' }, { who: 'Razzle', text: 'And we kept changing them. (...Constantly.)' }, { who: 'Boxten', text: 'Uhm... I think I get it.' }, { who: 'Narrator', text: 'Razzle looks at him.' },
      { who: 'Boxten', text: 'If I practiced something and then everyone changed it right before I had to perform it...' }, { who: 'Narrator', text: 'He grimaces.' }, { who: 'Boxten', text: "Yeah. No. I'd hate that." },
      { who: 'Dazzle', text: '(...Exactly.)' }, { who: 'Narrator', text: 'Razzle looks back at the script.' }, { who: 'Razzle', text: 'I thought we were making it more fun. (...You were having fun.)' },
      { who: 'Narrator', text: 'That one lands.' }, { who: 'Razzle', text: '...Yeah.' }, { who: 'Dazzle', text: "(...I wasn't.)" }
    ]},
    { name: 'His Part', cast: ['RnD', 'Rudie', 'Yatta', 'Boxten'], guests: ['Yatta', 'Boxten'], lines: [
      { who: 'Narrator', text: 'The next battle ends. Rudie and Yatta return.' }, { who: 'Rudie', text: 'READY FOR ANOTHER RUN?!' }, { who: 'Yatta', text: "I'VE GOT THREE NEW IDEAS!!! Actually FIVE! WAIT, SIX!!!" },
      { who: 'Razzle', text: 'No.' }, { who: 'Narrator', text: 'Yatta stops.' }, { who: 'Yatta', text: '...No?' }, { who: 'Razzle', text: 'We are going back to the script. (Thank you.)' },
      { who: 'Rudie', text: 'What about my Christmas scene?!' }, { who: 'Razzle', text: 'Keep it.' }, { who: 'Narrator', text: 'Dazzle looks at him.' }, { who: 'Razzle', text: "But it's your scene, Rudie. Don't change ours." },
      { who: 'Narrator', text: 'Rudie thinks.' }, { who: 'Rudie', text: 'So I get my OWN part?' }, { who: 'Razzle', text: 'Yep! (Provided it stays there.)' }, { who: 'Rudie', text: 'DEAL!!!' },
      { who: 'Yatta', text: 'AND MY FLIPS?!' }, { who: 'Razzle', text: 'Between scenes. (Far away from me.)' }, { who: 'Yatta', text: 'PERFECT!!!' }, { who: 'Boxten', text: 'What about me?' },
      { who: 'Narrator', text: 'Everyone looks at him.' }, { who: 'Boxten', text: "...I shouldn't have asked." }, { who: 'Razzle', text: 'Music! (Normal music.)' }, { who: 'Rudie', text: 'Mostly normal!' }, { who: 'Boxten', text: "I'll take it." }
    ]},
    { name: 'Curtain', cast: ['RnD', 'Rudie', 'Yatta', 'Boxten'], guests: ['Yatta', 'Boxten'], lines: [
      { who: 'Narrator', text: 'The final battle is over. Later, the performance finally reaches its ending.' }, { who: 'Razzle', text: '"Then the answer was here all along!" (...Hidden where nobody thought to look.)' },
      { who: 'Narrator', text: 'Rudie waits. Dazzle glances toward him. A pause.' }, { who: 'Rudie', text: 'MERRY CHRISTMAS!!!' }, { who: 'Narrator', text: 'Yatta launches across the stage.' }, { who: 'Yatta', text: 'WOOOOOO!!!' },
      { who: 'Narrator', text: 'Boxten hits the final note. Silence. Then applause.' }, { who: 'Narrator', text: 'Backstage, Razzle is laughing.' }, { who: 'Razzle', text: 'We actually did it! (...Somehow.)' },
      { who: 'Rudie', text: 'THAT WAS AMAZING!!!' }, { who: 'Yatta', text: 'AGAIN AGAIN AGAIN!!!' }, { who: 'Boxten', text: 'C-could we maybe wait a little before doing that again?' }, { who: 'Yatta', text: 'FIVE MINUTES!!!' },
      { who: 'Boxten', text: 'Longer.' }, { who: 'Yatta', text: 'TEN!!!' }, { who: 'Boxten', text: '...Much longer.' }, { who: 'Narrator', text: 'Rudie turns to Dazzle.' }, { who: 'Rudie', text: 'You liked my scene, right?' },
      { who: 'Razzle', text: 'I thought it was great! (...It was tolerable.)' }, { who: 'Rudie', text: "I'll TAKE IT!" }, { who: 'Narrator', text: 'Razzle looks at Dazzle.' }, { who: 'Razzle', text: 'You alright? (...Mhm.)' },
      { who: 'Razzle', text: 'Really? (...Really.)' }, { who: 'Narrator', text: 'A small pause.' }, { who: 'Razzle', text: 'I think the Christmas part worked. (...Do not encourage him.)' }, { who: 'Rudie', text: 'TOO LATE!!!' },
      { who: 'Dazzle', text: '(...I knew you would say that.)' }, { who: 'Narrator', text: 'Razzle smiles.' }, { who: 'Razzle', text: 'New play tomorrow? (...Already?)' }, { who: 'Razzle', text: 'We could start writing tonight! (...That sounds exhausting.)' },
      { who: 'Razzle', text: 'Comedy this time? (...Tragedy.)' }, { who: 'Razzle', text: 'Both! (...Obviously.)' }, { who: 'Narrator', text: 'They start gathering their scripts.' },
      { who: 'Narrator', text: 'Behind them:' }, { who: 'Rudie', text: 'CHRISTMAS COMEDY!!!' }, { who: 'Narrator', text: 'Razzle stops. Dazzle does not even look up.' }, { who: 'Dazzle', text: '(...Keep walking.)' }, { who: 'Razzle', text: 'Good idea.' }
    ]}
  ]
});

defCampaign({
  id: 'qom_eclipse_connie', badge: 'qom_eclipse_connie',
  a: 'QOMEclipse', b: 'QOMConnie',
  recLevel: friendshipRecLevel('QOMEclipse', 'QOMConnie'),
  title: 'Queens of Mischief',
  stages: [
    { name: 'First Meeting', lines: [
      { who: 'Narrator', text: '*Eclipse bounces on her paws, her crescent-moon mark glowing faintly.*' },
      { who: 'Eclipse', text: 'Oh! You’re Connie, right? The ghost everyone talks about! I’m Eclipse. They said you used to run the Halloween show before I came along.' },
      { who: 'Narrator', text: '*Connie drifts a little closer, arms crossed.*' },
      { who: 'Connie', text: 'Yeah. That’s me. And you’re the replacement they brought in after I went year-round. Don’t look so nervous. I’m not gonna haunt you… unless you give me a reason.' },
      { who: 'Eclipse', text: 'I’d never try to take your place! I just want to make the nights fun. Maybe we could cause a little chaos together sometime?' },
      { who: 'Connie', text: 'Careful what you wish for, moon girl.' }
    ]},
    { name: 'Shared Trouble', lines: [
      { who: 'Connie', text: '*phases halfway through a wall, laughing.* You should’ve seen their faces when the lights flickered and I floated right past!' },
      { who: 'Eclipse', text: '*grins, tail swishing.* And then I howled just loud enough to make them jump! We make a pretty good team when the blackout hits.' },
      { who: 'Connie', text: 'Don’t get used to it. I usually work alone.' },
      { who: 'Eclipse', text: '*softly* Still… it was more fun with you there.' },
      { who: 'Narrator', text: '*Connie pauses, then shrugs.*' },
      { who: 'Connie', text: 'Yeah. It was.' }
    ]},
    { name: 'Late Night Talk', lines: [
      { who: 'Narrator', text: '*They sit beneath the garden’s fake moonlight.*' },
      { who: 'Eclipse', text: 'Do you ever miss being the Halloween queen?' },
      { who: 'Connie', text: '*hovering beside her, quieter than usual* Sometimes. But floating around all year has its perks. What about you? You only get one season.' },
      { who: 'Eclipse', text: 'I love the moon. And the dark. But it can feel lonely when everyone else is asleep.' },
      { who: 'Narrator', text: '*Connie nudges Eclipse’s shoulder with a translucent hand.*' },
      { who: 'Connie', text: 'You’re not alone right now, are you?' },
      { who: 'Eclipse', text: '*smiles* No. I’m not.' }
    ]},
    { name: 'Backup', lines: [
      { who: 'Narrator', text: '*A Twisted corners them.*' },
      { who: 'Connie', text: 'Go. I’ll distract it.' },
      { who: 'Eclipse', text: '*stands her ground, claws ready* Not a chance. We do this together or not at all.' },
      { who: 'Connie', text: '*blinks* You’re serious.' },
      { who: 'Eclipse', text: 'Queens of Mischief stick together. Even when it’s scary.' },
      { who: 'Narrator', text: '*Connie grins despite herself.*' },
      { who: 'Connie', text: 'Fine. On three… one, two—' },
      { who: 'Narrator', text: '*They move as one.*' }
    ]},
    { name: 'Quiet Moment', lines: [
      { who: 'Narrator', text: '*Eclipse plucks softly at an imaginary guitar string. Connie leans against a wall, her bass floating nearby.*' },
      { who: 'Eclipse', text: 'You ever think about how weird it is that they made me to replace you… and now we’re friends?' },
      { who: 'Connie', text: 'Weird doesn’t even cover it. But I like this version better. The one where we both get to stay.' },
      { who: 'Eclipse', text: 'Me too. You’re not just the old queen to me. You’re Connie.' },
      { who: 'Connie', text: '*laughs softly* And you’re not just the new one. You’re Eclipse. My partner in crime.' }
    ]},
    { name: 'Honest Words', lines: [
      { who: 'Connie', text: '*floats in a slow circle* I used to think if I let people get close, they’d get bored of the tricks and leave. Or worse… replace me again.' },
      { who: 'Eclipse', text: '*steps closer* I’m not going anywhere. And I’m not trying to take anything from you. I just want to stand next to you when the lights go out.' },
      { who: 'Connie', text: '*meets her eyes* Same. You’re the first one who didn’t flinch when I got loud… or quiet.' },
      { who: 'Eclipse', text: 'Then let’s keep being loud and quiet together.' }
    ]},
    { name: 'True Partners', lines: [
      { who: 'Narrator', text: '*Eclipse howls softly beneath the crescent moon.*' },
      { who: 'Eclipse', text: 'Ready to stir up some real trouble tonight?' },
      { who: 'Connie', text: '*grins wide, already half-transparent* Always. You bring the howl. I’ll bring the haunt.' },
      { who: 'Eclipse', text: 'Queens of Mischief?' },
      { who: 'Connie', text: 'Queens of Mischief.' },
      { who: 'Narrator', text: '*They bump fists—one solid, one glowing—and take off into the dark, laughing the whole way.*' }
    ]}
  ]
});

defCampaign({
  id: 'rodger_teagan', badge: 'rodger_teagan', a: 'Teagan', b: 'Rodger',
  recLevel: friendshipRecLevel('Teagan', 'Rodger'),
  title: 'The Quiet Table', guests: ['Cosmo', 'Ginger', 'Sprout'],
  intro: [
    { who: 'Narrator', text: 'Teagan sets out a small tea service after a long afternoon. Rodger pauses beside the table, notebook in hand.' },
    { who: 'Teagan', text: 'You can take your observations over tea, Rodger.' },
    { who: 'Rodger', text: 'Then I would be glad to stay.' },
    { who: 'Teagan', text: 'Good. There is always room for one more.' }
  ],
  stages: [
    { name: 'Formal Introductions', lines: [
      { who: 'Narrator', text: '*Rodger adjusts his jacket and steps closer.*' },
      { who: 'Rodger', text: 'Miss Teagan, a pleasure as always. I trust the afternoon finds you well?' },
      { who: 'Narrator', text: '*Teagan smiles warmly, her boa draped neatly.*' },
      { who: 'Teagan', text: 'It does, Rodger. You’re just in time. I’ve set out a pot of something light. You’re welcome to join us if you’d like.' },
      { who: 'Rodger', text: '*glances toward the others* I wouldn’t want to interrupt. Though… if you don’t mind a few quiet observations while I sit, I accept.' },
      { who: 'Teagan', text: 'Observations are always welcome here. Just try not to turn every conversation into an interrogation.' },
      { who: 'Rodger', text: '*almost smiles* I’ll do my best.' }
    ]},
    { name: 'The Baking Trio Arrives', lines: [
      { who: 'Cosmo', text: '*holding a plate of cookies* We brought extras! In case anyone gets hungry during tea.' },
      { who: 'Ginger', text: '*stands a little behind him, voice soft* I… decorated a few. Just simple ones.' },
      { who: 'Sprout', text: '*arms crossed, watching the room* Cosmo insisted. We’re only staying a little while.' },
      { who: 'Teagan', text: 'Perfect timing. Cosmo, your cookies always pair so well with this blend. Ginger, these look lovely. Sprout, there’s a seat for you too.' },
      { who: 'Sprout', text: '…I’ll stand. But thanks.' },
      { who: 'Narrator', text: '*Rodger quietly notes something in his notebook.*' },
      { who: 'Rodger', text: 'Interesting. The protective one stays close. The shy one stays quiet. And the kind one keeps offering food.' },
      { who: 'Narrator', text: '*Teagan leans closer to him.*' },
      { who: 'Teagan', text: 'They’re friends, Rodger. Not a case.' }
    ]},
    { name: 'Shared Table', lines: [
      { who: 'Narrator', text: '*Teagan pours carefully.*' },
      { who: 'Teagan', text: 'Cosmo, yours is the honey one. Ginger, I made yours a little milder. Sprout… plain, as usual.' },
      { who: 'Sprout', text: '*accepts the cup with a small nod* Appreciate it.' },
      { who: 'Cosmo', text: '*smiles* See? She always remembers.' },
      { who: 'Ginger', text: '*takes a tiny sip* It’s… really good. Thank you.' },
      { who: 'Rodger', text: '*sips his own* You memorize preferences for everyone. That takes real care.' },
      { who: 'Teagan', text: 'It’s the least I can do. Everyone deserves to feel welcome.' },
      { who: 'Rodger', text: '*softens* Even someone who asks too many questions?' },
      { who: 'Teagan', text: 'Especially them.' }
    ]},
    { name: 'A Quiet Corner', lines: [
      { who: 'Narrator', text: '*Rodger stands a little apart with Teagan.*' },
      { who: 'Rodger', text: 'You handle people so easily. I notice things… but I don’t always know how to make them feel at ease.' },
      { who: 'Narrator', text: '*Teagan watches Sprout quietly check on Cosmo and Ginger.*' },
      { who: 'Teagan', text: 'You’ve been kinder than you think. You checked if everyone had enough to drink without turning it into a report.' },
      { who: 'Rodger', text: 'Habit. Still. Watching you… it makes me want to try harder.' },
      { who: 'Teagan', text: 'Then stay. Keep trying. That’s all any of us can do.' }
    ]},
    { name: 'When Things Get Hard', lines: [
      { who: 'Sprout', text: '*voice low, protective* Cosmo’s tired. We’re heading back soon.' },
      { who: 'Cosmo', text: 'I’m fine, really—' },
      { who: 'Ginger', text: '*quietly* We can rest after. It’s okay.' },
      { who: 'Narrator', text: '*Teagan stands.*' },
      { who: 'Teagan', text: 'Of course. Take whatever you need with you. And if you ever want another quiet table… the door stays open.' },
      { who: 'Narrator', text: '*Rodger steps forward.*' },
      { who: 'Rodger', text: 'If anything feels off later… you know where to find me. No questions required.' },
      { who: 'Narrator', text: '*Sprout looks at them both for a long second.*' },
      { who: 'Sprout', text: '…Thanks. Means more than you think.' }
    ]},
    { name: 'Honest Exchange', lines: [
      { who: 'Narrator', text: '*After the others leave, Rodger stays behind.*' },
      { who: 'Rodger', text: 'I used to think every gathering was a chance to gather facts. Lately I’ve been realizing some things are better left as moments.' },
      { who: 'Narrator', text: '*Teagan pours a fresh cup for him.*' },
      { who: 'Teagan', text: 'And I’ve learned that even the quietest guests can become the ones you look forward to most.' },
      { who: 'Rodger', text: 'You make it easy to stay.' },
      { who: 'Teagan', text: 'You make it worth inviting you again.' }
    ]},
    { name: 'Found Family', lines: [
      { who: 'Narrator', text: '*Teagan sets the table once more.*' },
      { who: 'Teagan', text: 'Same seats?' },
      { who: 'Narrator', text: '*Rodger is already pulling out a chair.*' },
      { who: 'Rodger', text: 'Same seats.' },
      { who: 'Cosmo', text: '*arrives with a fresh plate* We brought tarts this time!' },
      { who: 'Ginger', text: '*smiling a little brighter* I tried a new design.' },
      { who: 'Sprout', text: '*following close* We’re staying longer today.' },
      { who: 'Teagan', text: 'Then it’s a proper gathering.' },
      { who: 'Narrator', text: '*Rodger looks around the table, softer than usual.*' },
      { who: 'Rodger', text: 'Yes. It is.' },
      { who: 'Narrator', text: 'They settle in together—tea poured, sweets shared, and for once, no one is keeping score.' }
    ]}
  ]
});

defCampaign({
  id: 'gigi_connie', badge: 'gigi_connie', a: 'Gigi', b: 'Connie',
  recLevel: friendshipRecLevel('Gigi', 'Connie'),
  title: 'Queens of Chaos', guests: ['Shrimpo', 'Brightney'],
  stages: [
    { name: 'Shared Chaos', lines: [
      { who: 'Narrator', text: 'Gigi leans against a wall, head open a little.' },
      { who: 'Gigi', text: 'Connie! Perfect timing. I found something shiny earlier and I need a lookout.' },
      { who: 'Connie', text: 'You’re “borrowing” again, aren’t you?' },
      { who: 'Gigi', text: 'Borrowing. Collecting. Same thing. You in or not?' },
      { who: 'Connie', text: '*grins* Always. Just don’t get us caught this time.' },
      { who: 'Gigi', text: 'No promises.' }
    ]},
    { name: 'The Loud Interruption', lines: [
      { who: 'Shrimpo', text: '*storms in* I HATE QUIET HALLWAYS!' },
      { who: 'Gigi', text: '*waves casually* Hey Lil’ Shrimpson.' },
      { who: 'Shrimpo', text: 'THAT’S NOT MY NAME! I HATE IT! I HATE YOU!' },
      { who: 'Connie', text: '*floats closer* Wow. Still at full volume, huh?' },
      { who: 'Shrimpo', text: 'I HATE GHOSTS WHO FLOAT AND JUDGE!' },
      { who: 'Connie', text: '*rolls her eyes* Then stop yelling at us and go yell at a wall.' },
      { who: 'Gigi', text: '*laughs* He’s just warming up. Come on, Shrimpo. You can hate us while we walk.' }
    ]},
    { name: 'Prank Partners', lines: [
      { who: 'Gigi', text: '*whispers* Okay, plan. We move every chair in the lounge three inches to the left. Brightney will lose her mind.' },
      { who: 'Connie', text: '*already half-invisible* And if anyone asks, we were nowhere near it.' },
      { who: 'Shrimpo', text: '*following them* I HATE THIS PLAN! IT’S STUPID!' },
      { who: 'Gigi', text: 'Then don’t help.' },
      { who: 'Shrimpo', text: '…FINE. BUT I HATE HELPING!' },
      { who: 'Connie', text: '*smirks* That’s the spirit.' }
    ]},
    { name: 'After the Mess', lines: [
      { who: 'Connie', text: '*laughing quietly as they hide around a corner* She noticed in under a minute. Classic.' },
      { who: 'Gigi', text: 'Best one yet. Worth the risk.' },
      { who: 'Shrimpo', text: '*arms crossed* I HATE THAT IT WORKED.' },
      { who: 'Gigi', text: 'You laughed. I saw it.' },
      { who: 'Shrimpo', text: 'I DID NOT! I HATE LAUGHING!' },
      { who: 'Connie', text: 'Sure you did. Keep telling yourself that.' }
    ]},
    { name: 'A Rare Quiet Moment', lines: [
      { who: 'Gigi', text: '*sitting on the floor, sorting through a pile of random items* You ever think it’s weird that we keep ending up in the same trouble?' },
      { who: 'Connie', text: '*hovering nearby* A little. But it’s better than floating around alone waiting for something interesting to happen.' },
      { who: 'Gigi', text: 'Yeah. Most Toons get mad when stuff goes missing. You just help move the furniture.' },
      { who: 'Connie', text: 'And you never tell me to stop being annoying. That’s rare.' },
      { who: 'Gigi', text: '*soft smile* You’re my kind of annoying.' }
    ]},
    { name: 'Standing Up Together', lines: [
      { who: 'Shrimpo', text: '*shouting at both of them* I HATE BOTH OF YOU EQUALLY!' },
      { who: 'Connie', text: '*snaps back* Then pick a new hobby, shrimp. We’re busy.' },
      { who: 'Gigi', text: '*steps between them, still casual* Easy. He’s just loud. Doesn’t mean we have to match him.' },
      { who: 'Connie', text: '*pauses, then nods* …Fine. But only because you’re here.' },
      { who: 'Shrimpo', text: 'I HATE BEING IGNORED!' },
      { who: 'Gigi', text: '*pats his head lightly* We know. You’ll live.' }
    ]},
    { name: 'Found Trouble', lines: [
      { who: 'Gigi', text: '*looking at both of them* Same time tomorrow? I’ve got a new idea involving the elevators.' },
      { who: 'Connie', text: 'I’m already in. Just say when.' },
      { who: 'Shrimpo', text: '*grumbling* I HATE THIS WHOLE THING… BUT I’LL BE THERE.' },
      { who: 'Gigi', text: 'Perfect.' },
      { who: 'Connie', text: '*fist-bumps Gigi’s sleeve* Queens of chaos and their angry mascot.' },
      { who: 'Gigi', text: 'Wouldn’t have it any other way.' },
      { who: 'Narrator', text: 'They head off together—one floating, one collecting, and one yelling the whole way—still somehow a team.' }
    ]}
  ]
});
