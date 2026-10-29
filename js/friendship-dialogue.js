/* Friendship badge dialogue pass. Keep scenes and rewards intact; only revise
   what the victory screen says. Each replacement is an authored scene, not a
   generated line assembled from character names. */
'use strict';

function friendshipScene(id, name, script) {
  const campaign = CAMPAIGNS[id];
  const stage = campaign && campaign.stages.find(part => part.name === name);
  if (!stage) throw new Error(`Missing friendship scene: ${id} / ${name}`);
  stage.lines = script.trim().split('\n').map(row => {
    const divider = row.indexOf('|');
    if (divider < 1) throw new Error(`Malformed friendship line: ${id} / ${row}`);
    return { who: row.slice(0, divider), text: row.slice(divider + 1) };
  });
}

/* Every badge plays after a victory. Repeating that fact costs a dialogue box
   without establishing the next action. Keep specific consequences and pauses. */
for (const campaign of Object.values(CAMPAIGNS)) {
  const scenes = [...(campaign.intro ? [campaign.intro] : []), ...campaign.stages.map(stage => stage.lines)];
  for (const lines of scenes) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.who !== 'Narrator') continue;
      if (/^(Another battle ends|The final battle ends|The battle ends|The final fight ends)\.$/.test(line.text)) {
        lines.splice(i, 1);
        continue;
      }
      const opener = /^(?:Another battle ends|After (?:the|another) (?:final )?(?:battle|fight)|The (?:final |last )?(?:battle|fight|Twisted) (?:ends|falls)|The Twisteds go down)\.\s+/.exec(line.text);
      if (opener) line.text = line.text.slice(opener[0].length);
      if (/^After (?:the|another) (?:final )?(?:battle|fight), /.test(line.text)) {
        line.text = line.text.replace(/^After (?:the|another) (?:final )?(?:battle|fight), /, '');
        line.text = line.text[0].toUpperCase() + line.text.slice(1);
      }
    }
  }
}

friendshipScene('waxwell_soulvester', 'The Worst Possible Ending', `
Narrator|Bassie and Shelly return, safe.
Bassie|Your hiding place kept us safe.
Waxwell|Dungeon.
Shelly|And the supplies helped!
Waxwell|Stolen supplies.
Bassie|Your traps caught the Twisteds too.
Waxwell|WHY IS EVERYONE THANKING ME?!
Soulvester|Thy traps were cruel. We shall discuss them.
Soulvester|But Bassie and Shelly survived because thou sheltered them.
Waxwell|I was trying to make YOU miserable!
Soulvester|I know. I am glad they are safe.
Narrator|Waxwell falls silent, then turns away.
Waxwell|I am going to do something horrible.
Soulvester|Do not wander into danger alone.
Waxwell|I hate you.
Soulvester|Until next time, then.
Shelly|I think they had fun.
Bassie|Do not tell Waxwell.
`);

friendshipScene('sora_dandy', 'The Door Below', `
Narrator|An elevator waits at the end of the corridor.
Dandy|This is where you should turn back.
Riku|So the answers are down there.
Dandy|You do not trust me.
Riku|No. But I trust that you care about this world.
Narrator|Dandy has no answer. The doors open on darkness.
Riku|There is something down there. It is not Ichor.
Narrator|Riku and Kairi summon their Keyblades.
Kairi|Then this goes deeper than we thought.
Narrator|Dandy catches Sora's arm. He is not smiling.
Dandy|I cannot promise you will like what you find.
Sora|Maybe I will not. But closing our eyes will not make it disappear.
Narrator|Sora gently frees his arm. Dandy steps into the elevator first.
Dandy|I am not letting three strangers go down alone.
Kairi|I thought you did not trust us.
Dandy|I do not.
Riku|Good. Trust should take time.
Sora|You will get used to us.
Dandy|Do not be so sure.
Narrator|The doors shut. The elevator descends.
`);

friendshipScene('cocoa_rudie', 'Later', `
Narrator|One item remains in the emergency bag.
Rudie|We never used it. See? Saving it worked.
Cocoa|And everyone we helped needed the other things.
Rudie|So we were both right.
Cocoa|That is boring.
Rudie|Terribly.
Eclipse|You are STILL arguing about that bag?
Looey|I think they like it.
Cocoa|We do not!
Rudie|I kinda do.
Narrator|Cocoa laughs and points to the last item.
Cocoa|What about this?
Rudie|Save it for Christmas?
Cocoa|Ask me in December.
Rudie|So tomorrow?
Cocoa|Rudie.
`);

friendshipScene('bobette_cocoa', 'Main Material', `
Narrator|Bobette finds Cocoa with Bassie.
Bobette|I have my conclusion. Cocoa, you are not a Main.
Cocoa|I know!
Bobette|I kept calling everything you do "Main material." I was wrong.
Bassie|Go on.
Bobette|You help because you want to. You are Cocoa.
Cocoa|I am! And I am glad we solved that.
Bobette|Being a Main is not a prize for acting more like you.
Narrator|Cocoa offers Bassie a Bonbon.
Bassie|What is that for?
Cocoa|I made too many again.
Bassie|Thank you. Do not push it.
Bobette|We would make a good trio of Holiday Mains.
Narrator|Bassie nearly drops the Bonbon.
Bobette|As a team! I meant as a team!
Cocoa|Bobette!
Bassie|You are terrible at this.
Bobette|I know!
`);

friendshipScene('ginger_scraps', 'On Display', `
Narrator|The finished piece stands on display, labeled "Scraps and Ginger."
Ginger|You really put my name on it.
Scraps|We made it together.
Ginger|And you left out "cookie artist."
Scraps|Thought you would prefer it.
Ginger|I do. Thank you.
Cosmo|It looks great! You did not tell everyone Scraps did most of it.
Ginger|Because she did not.
Scraps|Look at you.
Shelly|Could I help with the next one? I have a Late Cretaceous fabric pattern!
Ginger|I would like that.
Scraps|We need a bigger table.
`);

friendshipScene('tisha_blot', 'Leave It', `
Narrator|The cart rolls, though one wheel still squeaks.
Tisha|That noise is bothering me.
Narrator|Blot reaches for the wheel. Tisha stops him.
Tisha|It works. We are leaving it.
Blot|.seY
Tisha|Do not look so impressed.
Blot|.gnihton dias I
Finn|Hey, you fixed it! Wheel done!
Narrator|Tisha and Blot start walking.
Finn|That was not even a fish pun!
Tisha|Somehow worse.
Narrator|Blot gives her a thumbs up.
`);

friendshipScene('cocoa_soulvester', 'Happily Ever After', `
Soulvester|Victory! The kingdom is safe, Princess Bassie.
Gourdy|The dragon helped fight this time!
Cocoa|Good dragon!
Bassie|You helped us fight.
Soulvester|Then return to thy castle, Your Highness.
Bassie|I do not have a castle.
Gourdy|You do now!
Narrator|He points to a cardboard castle at the end of the hall.
Bassie|When did you build that?
Gourdy|When you let me pretend to kidnap you!
Narrator|Bassie steps inside.
Bassie|Five minutes.
Cocoa|Your knights are here!
Bassie|Then I suppose I am safe.
Gourdy|What am I?
Bassie|Still the dragon.
Gourdy|YES!
`);

friendshipScene('cocoa_kairi', "The Light That's Left", `
Narrator|Nobody speaks as Kairi dismisses her Keyblade.
Cocoa|Kairi?
Kairi|I came here trying to understand the Twisteds. I was looking at the wrong thing.
Vee|And now?
Kairi|You remember who they were. You know what happened here, and you still fight for Gardenview.
Kairi|Cocoa, you smiled while you showed me around.
Cocoa|There is still plenty worth showing.
Kairi|I know that now. You see the darkness. You keep the light in view too.
Vee|Disgustingly sentimental.
Tisha|Vee.
Vee|I did not say she was wrong.
Goofy|Reminds me of our adventures. New place, monsters, friends... then Donald gets mad.
Narrator|Goofy's smile fades.
Goofy|Gawrsh. I miss him.
Kairi|We will see him again.
Goofy|You really think so?
Narrator|Kairi meets his eyes.
Kairi|I know.
Cocoa|Bring him here when you do!
Vee|One Goofy is enough.
Goofy|Hyuck! Hey!
Narrator|Kairi looks toward the hall and summons her Keyblade.
Kairi|You said there was more of Gardenview to see.
Cocoa|There is. Come on!
`);

friendshipScene('astro_pebble', 'Stars', `
Narrator|Pebble sniffs toward the hall where Dandy disappeared, then sits beside Astro.
Astro|You miss him too.
Narrator|Cocoa and Shelly find them looking up.
Cocoa|There you are!
Astro|Dandy and I used to watch the stars together.
Shelly|You still can. I know a few constellations.
Astro|I could show you the ones he taught me.
Cocoa|I am staying for that.
Narrator|Pebble settles against Astro. For a while, they watch in silence.
Cocoa|Maybe Dandy could come next time.
Narrator|Astro strokes Pebble's head.
Astro|I would like that.
Astro|Even if it is not like before.
Pebble|Arf.
`);

friendshipScene('blot_scraps', 'Finished', `
Narrator|Everyone gathers around Scraps and Blot's finished piece.
Cocoa|I love it!
Blot|.eceipretsaM
Brusha|Better.
Scraps|Just better?
Brusha|Would you prefer dishonesty?
Blot|.etsat doog sah enoemoS
Narrator|Brusha glances at Blot. She understood, but says nothing.
Shrimpo|I HATE ART! AND CATS!
Scraps|I am not a cat!
Shrimpo|I LIKE DOGS MORE!
Scraps|You do not even like dogs!
Blot|.uoy sekil enO oN
Shrimpo|I HATE THAT TOO!
Brusha|Our first negative review.
Scraps|I can live with that one.
Blot|.emaS
`);

friendshipScene('brightney_rnd', 'Next Chapter', `
Brightney|Same time next meeting?
Squirm|I am still invited?
Brightney|I asked, did I not?
Razzle|We will all be here!
Dazzle|(...If you stay awake.)
Vee|Seventeen minutes. His last record.
Razzle|You timed me?!
Vee|Brightney said it was a record.
Narrator|Squirm notices the book still beside him. Brightney has left it there.
Squirm|Chapter seven next time?
Brightney|Chapter seven.
Dazzle|(...I look forward to it.)
Razzle|Me too!
Vee|Riveting.
Brightney|You do not have to stay, Vee.
Vee|I know.
Narrator|She stays.
`);

friendshipScene('rodger_toodles', 'Case Closed', `
Narrator|Blot points to the missing tape. It holds a damaged decoration together.
Toodles|I knew it!
Rodger|You suspected it. There is a difference.
Cocoa|Oh! I gave someone that tape for a repair.
Toodles|Who?
Cocoa|I forgot. Sorry!
Rodger|The tape is found. No harm done.
Toodles|Case closed! And Rodger was wrong.
Rodger|Must that appear in every report?
Narrator|Teagan joins them as Toodles hands back the notebook.
Toodles|Can I come on your next case?
Rodger|If it is appropriate.
Toodles|A real yes?
Rodger|A conditional yes.
Toodles|Close enough! I am a real detective!
Rodger|Junior detective.
Teagan|You look pleased.
Rodger|She did well. Better than I expected.
Teagan|I would leave that last part out.
Rodger|I do possess some survival instinct.
`);

friendshipScene('goob_waxwell', 'Found', `
Narrator|Waxwell clears the debris and retrieves the belonging he lost.
Rodger|I see.
Waxwell|Then say nothing.
Goob|We found it!
Waxwell|I found it. You helped, unfortunately.
Finn|Went swimmingly, I would say.
Rodger|We were nearly caught by Twisteds.
Finn|But we were not!
Narrator|Goob watches Waxwell turn the object in his hands.
Goob|You look better.
Waxwell|You notice everything, do you not?
Goob|Nope. Just people.
Narrator|Waxwell starts down the hall.
Goob|Can I hug you now?
Waxwell|No.
Goob|Okay!
Narrator|Waxwell slows so Goob can catch up.
`);

friendshipScene('gourdy_connie', 'Enough', `
Narrator|Gourdy starts counting the group, then stops. He can see they are safe.
Connie|Progress.
Gourdy|Do not make fun of me.
Connie|I am a ghost. It is practically contractual.
Gourdy|I still feel like I should be doing something.
Connie|You fought. You checked on everyone. Now take the win.
Gourdy|Ms. Connie... am I good at this?
Connie|Sometimes.
Gourdy|Only sometimes?
Connie|You overthink. You try too hard. But when it gets ugly, you stay.
Narrator|Gourdy considers that, then nods.
Gourdy|I will take it.
Gourdy|Where were you during the first battle, anyway?
Connie|Not telling.
Gourdy|Ms. Connie!
Narrator|Connie vanishes. Gourdy smiles and lets her go.
`);

friendshipScene('rnd_rudie', 'Curtain', `
Narrator|The delayed performance finally reaches its last cue.
Razzle|"The answer was here all along!"
Dazzle|(...Hidden where nobody thought to look.)
Narrator|Dazzle gives Rudie the cue.
Rudie|MERRY CHRISTMAS!
Narrator|Yatta leaps across the stage. Boxten strikes the final note. The audience applauds.
Razzle|We did it!
Dazzle|(...Somehow.)
Rudie|You liked my scene, right?
Dazzle|(...It was tolerable.)
Rudie|I will take it!
Yatta|AGAIN!
Boxten|Could we rest first?
Razzle|New play tomorrow? Comedy?
Dazzle|(...Tragedy.)
Razzle|Both!
Dazzle|(...Obviously.)
Rudie|CHRISTMAS COMEDY!
Dazzle|(...Keep walking.)
`);

friendshipScene('shelly_ribecca', 'Keep It', `
Narrator|Ribecca finds Shelly wearing the Cheer Bear costume again.
Ribecca|Still wearing it?
CheerbearShelly|It is cute, comfortable, and I helped make it!
Ribecca|You like that people notice.
CheerbearShelly|It is nice when they do.
Ribecca|I noticed.
Narrator|Shelly looks up, then smiles.
CheerbearShelly|You did.
Narrator|Ribecca picks up Shelly's sketch.
Ribecca|Now, shall we fix this disaster?
CheerbearShelly|It is not a disaster!
Ribecca|This seam says otherwise.
CheerbearShelly|Okay. Show me.
`);

friendshipScene('ribecca_scraps', 'Finished', `
Narrator|Shelly steps out in the finished costume.
Scraps|Oh, I like it.
Ribecca|Turn around. Again.
Shelly|Am I modeling now?
Ribecca|Obviously.
Scraps|The back needs one little thing.
Ribecca|Do not start.
Shelly|You kept my scale pattern! And the shoulder pieces.
Scraps|Those were mine.
Shelly|I did this stitching. It is all three of ours.
Ribecca|As it should be. You are wearing it.
Scraps|Can we make another?
Ribecca|Already? All right.
Shelly|Can I pick the theme?
Ribecca|Go on.
Shelly|Cambrian!
Scraps|What is Cambrian?
Shelly|You do not know? The Cambrian Explosion was about 538 million years ago—
Narrator|Ribecca gathers supplies. Scraps settles beside Shelly.
Scraps|I am listening.
Narrator|Shelly beams and keeps going.
`);

friendshipScene('flutter_flyte', 'For the Record', `
Narrator|Everyone gathers around Flutter and Flyte's finished scrapbook.
Cocoa|You kept both versions!
Cocoa|"Flyte distracted the Twisted." And Flutter says he screamed.
Flyte|I was distracting it!
Flutter|...!!!
Bassie|She disagrees.
Eggson|I believe her account.
Flyte|Nobody asked you.
Narrator|Flutter turns to a blank final page.
Flyte|That is for whatever happens next.
Flutter|...!
Flyte|Just do not make me look stupid.
Narrator|Flutter gives him a slow look.
Flyte|Do not.
Flutter|...!!!
Cocoa|I think she has a plan!
Flyte|That is what worries me.
`);

/* Shelly keeps asking what the records mean to Vee; the backup pays that off. */
friendshipScene('shelly_vee', 'Loose Wire', `
Vee|Shelly, your tracker shows an old floor layout.
Shelly|Old? I thought the floors were always like this.
Vee|They changed.
Shelly|You remember them?
Vee|I kept records.
Shelly|Of everything?
Vee|Everything useful.
Shelly|I think it is nice.
Vee|Mostly useful.
`);
friendshipScene('shelly_vee', 'Field Notes', `
Shelly|I have been comparing the fossils we found.
Vee|You brought notes down here?
Shelly|Of course. I want to know where they came from.
Vee|Some of them do not belong together.
Shelly|You noticed too?
Vee|I notice a lot.
Shelly|Then help me sort them.
Vee|I thought you would ask.
`);
friendshipScene('shelly_vee', 'Diagnostics', `
Vee|You should rest.
Shelly|Rodger needed help.
Vee|And now you do.
Shelly|I will be fine.
Vee|You said that before you helped him.
Shelly|You are worried about me.
Vee|I am keeping track of you.
Shelly|That is not what I asked.
Vee|I know.
`);
friendshipScene('shelly_vee', "You're a Fan?", `
Vee|You have seen that episode before.
Shelly|I like the old ones. Everyone gets so excited.
Vee|You already know who wins.
Shelly|I know. You seemed happier in them.
Vee|Did I?
Shelly|A little. Sorry, was that strange?
Vee|No. I did not expect you to notice.
`);
friendshipScene('shelly_vee', 'Upgrade', `
Shelly|Another upgrade? Do you know what it will change?
Vee|No.
Shelly|Do you get to refuse?
Vee|Sometimes.
Shelly|That is a frightening answer.
Vee|It is the honest one.
Shelly|Are you scared?
Vee|I do not know. I cannot measure what I might lose.
Shelly|I would be.
Vee|Then I will remember you said that.
`);
friendshipScene('shelly_vee', 'The Choice', `
Shelly|You do not have to measure it. Tell me what you know.
Vee|I do not want to lose my memories.
Shelly|Then we protect them.
Vee|We?
Shelly|You helped with my notes. Let me help with yours.
`);
friendshipScene('shelly_vee', 'Field Update', `
Narrator|Vee holds out a small backup chip.
Shelly|Your records?
Vee|The ones that matter.
Shelly|Can we add us? So you remember we were here.
Vee|Already saved.
`);

/* Keep Sprout's protectiveness and Cosmo's choice in the kitchen. */
friendshipScene('sprout_cosmo', 'Measuring Wrong', `
Cosmo|Sprout, the flour? I measured this wrong.
Sprout|Again? Here. Add a spoonful at a time.
Cosmo|I know how to fix it.
Sprout|I know. I just do not want you wearing the bowl.
`);
friendshipScene('sprout_cosmo', 'Your Kitchen', `
Ginger|Can I help decorate?
Cocoa|I brought Bonbons for everyone!
Toodles|I can stir!
Sprout|It is Cosmo's kitchen. Ask him.
Cosmo|Come in. Just mind the bowls.
`);
friendshipScene('sprout_cosmo', 'Helping Out', `
Ginger|Is this icing all right?
Cosmo|It is lovely, Ginger.
Cocoa|Bonbons on top?
Cosmo|One on each.
Toodles|Look how fast I can stir!
Sprout|Slow down. The batter is climbing out.
Toodles|Oops. Sorry!
`);
friendshipScene('sprout_cosmo', 'Sit Down', `
Narrator|Cosmo rubs his wrist as he reaches for the next tray.
Sprout|Sit. I will finish this one.
Cosmo|I am nearly done.
Sprout|And your wrist hurts.
Narrator|Cosmo sits. Sprout takes the tray.
Ginger|He notices everything you do.
Cosmo|I know. I wish he would ask first.
`);
friendshipScene('sprout_cosmo', 'Kind of Strict', `
Cocoa|I can wash the dishes if you like.
Sprout|We are fine.
Cosmo|Cocoa, could you dry them? I could use the help.
Cocoa|Sure!
Toodles|I thought Sprout was in charge.
Sprout|So did I.
Cosmo|My kitchen, remember?
`);
friendshipScene('sprout_cosmo', 'Checking In', `
Cosmo|You can check on me. Just ask before taking over.
Sprout|I thought you needed a break.
Cosmo|I did. I could have told you.
Sprout|All right. How is your wrist now?
Cosmo|Better. Thanks.
Sprout|Good. Want me on the next tray?
Cosmo|Yes, please.
`);
friendshipScene('sprout_cosmo', 'One Each', `
Ginger|Finished!
Cocoa|They look so good. May we try one?
Toodles|Please?
Sprout|Your call, Cosmo.
Cosmo|One each. Then we clean up together.
`);

function friendshipEdit(id, stageName, original, replacement) {
  const campaign = CAMPAIGNS[id];
  const stage = campaign && campaign.stages.find(part => part.name === stageName);
  if (!stage) throw new Error(`Missing friendship scene: ${id} / ${stageName}`);
  const index = stage.lines.findIndex(line => line.text === original);
  if (index < 0) throw new Error(`Missing friendship line: ${id} / ${stageName} / ${original}`);
  if (replacement === null) stage.lines.splice(index, 1);
  else stage.lines[index].text = replacement;
}

[
  ['waxwell_soulvester', 'Weakness', `Monsters appear, you step in. Someone needs help, you step in. Someone screams—`, `Monster, crisis, scream—you charge in every time.`],
  ['poppy_boxten', 'The Game', `Poppy catches Boxten waiting out a fight beside an old prop table.`, `Poppy finds Boxten sheltering beside an old prop table.`],
  ['dyle_shrimpo', 'The Box', `Shrimpo, would you help me move this? The west platform is blocked.`, `Shrimpo, please help move this. The west platform is blocked.`],
  ['poppy_toodles', 'Missing Ribbon', `Start with where you stood, not every shelf in the room.`, `Start where you stood.`],
  ['squirm_cocoa', 'A Bite Missing', `I know. I was hungry and I bit it. I am sorry.`, `I... bit it. I was hungry. I'm sorry.`],
  ['bassie_shelly', 'Basket', `What do you think is in there?`, `Guess.`],
  ['eclipse_pebble', 'New Friend', `*crouches down in front of Pebble* Heeey, Pebble!`, `*crouches to Pebble's level* There you are!`],
  ['finn_shelly', 'The Find', `Part of one! I'm not sure what yet.`, `Part of one! Can't tell what yet.`],
  ['sora_dandy', 'A World Gone Quiet', `No. *he examines the Ichor* There's darkness here... but it didn't come from that creature.`, `No. There's darkness in the Ichor, but it didn't come from that creature.`],
  ['scraps_yatta', 'Old Poster', `Mhm. Me, Looey and Blot. Haven't seen this in forever.`, `Me, Looey, and Blot. Haven't seen it in forever.`],
  ['goofy_rodger', 'Missing Friend', `Gawrsh... guess it's pretty obvious, huh?`, `Gawrsh. Was I that obvious?`],
  ['rudie_eggson', 'Wrong Season', `Aren't you gonna say it back?!`, `Say it back!`],
  ['shrimpo_waxwell', 'An Expert', `You're remarkably good at making yourself unpleasant.`, `You're an expert at being unpleasant.`],
  ['yatta_looey', 'Gone', `Our banner! The big one with the three of us!`, `Our banner! The one with all three of us!`],
  ['wishbeargigi_gourdy', 'One More Treat', `That sounds manageable. Hold it steady.`, `Manageable. Hold it steady.`],
  ['toodles_shelly', 'The Find', `Then I call this a case. I am your junior detective.`, `Then it's a case! I'm your junior detective.`],
  ['phantasia_dandy', 'A Wish in the Window', `I wished for a light to follow. Then I smelled peppermint and forgot about the light.`, `I wished for a guiding light. Then I smelled peppermint and forgot it.`],
  ['brusha_tisha', 'The Mess', `That is called composition.`, `That is composition.`],
  ['qom_soulvester_gourdy', 'An Old Cue Sheet', `The old songs are still here. Could we play one?`, `The old songs are here. Could we play one?`],
  ['qom_eclipse_connie', 'Two Names on the Poster', `They put both our names on the Halloween show poster!`, `We're both on the Halloween poster!`],
  ['rodger_teagan', 'One Cup Short', `The kitchen shelf had spares this morning. I will fetch one.`, `The kitchen had spare cups this morning. I will fetch one.`],
  ['gigi_connie', 'The Empty Hook', `I saw it in the lounge this morning. I did not take it, before you ask.`, `Saw it in the lounge this morning. Didn't take it, before you ask.`],
  ['mrsholloway_gourdy', 'A Scent in the Dust', `I know. I am sorry I could not get back sooner.`, `I know. I'm sorry I could not come sooner.`],
  ['mrholloway_gourdy', 'Deep Soil', `I saw it from the old tracks. Clever plan.`, `Saw it from the old tracks. Clever plan, son.`],
  ['mrsholloway_eclipse', 'Night Patrol', `First, stop shouting where we are.`, `First, stop telling the garden where we are.`],
  ['mrholloway_connie', 'Boo in the Patch', `*chuckles deeply* I’ve weathered autumn frosts, girl. A friendly ghost is a walk in the park.`, `*chuckles* I've weathered autumn frosts. A friendly ghost won't shake me.`],
  ['delilah_bassie', 'Laboratory Clutter', `Then I should give you the key.`, `Then you need the key.`],
  ['delilah_dandy', 'The Old Office', `You signed it. Surely you kept a copy.`, `You signed it. Where is your copy?`],
  ['connie_waxwell', 'Midnight Monologues', `You could have waited for the cue.`, `You could have waited for my cue.`],
  ['glisten_goob', 'Mind the Glass', `And I like to know what is about to touch me.`, `And I like to know before anyone touches me.`],
  ['glisten_vee', 'Studio Lighting', `It is pointed at the wrong mark. Move one step left.`, `You're on the wrong mark. One step left.`],
  ['dandy_brusha', 'In the Frame', `There is a lot of empty space around me.`, `Why so much space around me?`],
  ['dandy_pebble', 'The Lookout', `All right. But if it rings, I am counting on you to show me where to go.`, `All right. When it rings, show me who needs us.`],
  ['scraps_poppy', 'The Leak', `Then we lose the display. I can make another. I cannot make another you.`, `Then we lose the display. I can make another. I can't make another you.`],
  ['rudie_scraps', 'Names on the Back', `I thought the stars were for everyone. I did not know each one was for someone.`, `I thought they were for everyone. I didn't know each had a name.`],
  ['flyte_brightney', 'The Dark Turn', `I can light the right one. How long until you need me there?`, `I can light the right door. How long do you need?`],
  ['bobette_cocoa', "That's Strange", `You always bring enough for everyone?`, `You brought enough for everyone?`],
  ['ginger_scraps', 'Craft Class', `That's... a lot.`, `That's a lot.`],
  ['tisha_blot', 'A Little Problem', `Oh. That's not too bad!`, `A broken wheel? I can fix that.`],
  ['cocoa_soulvester', "A Knight's Duty", `Further danger. We may have bested these creatures, but our quest is not yet complete.`, `Further danger. Our quest is not complete.`],
  ['cocoa_soulvester', 'The Rescue', `Another battle ends with Bassie separated from the others.`, `Bassie is separated from the others.`],
  ['cocoa_kairi', 'A Different World', `Cocoa... those creatures.`, `Cocoa... what were those creatures?`],
  ['astro_pebble', 'Looking', `What are you looking for?`, `Who are you looking for?`],
  ['blot_scraps', 'Ink', `How hard is this to get out of paper?`, `Will this come out of paper?`],
  ['brightney_rnd', 'Catching Up', `You could always come talk to us!`, `Come talk to us sometime!`],
  ['rodger_toodles', 'Next Time', `Perhaps.`, `Possibly. Do not touch it yet.`],
  ['goob_waxwell', "Something's Wrong", `And you don't look particularly observant.`, `And you are hardly observant.`],
  ['goob_waxwell', 'The Room', `Another battle ends outside a damaged room.`, `The group reaches a damaged room.`],
  ['gourdy_connie', 'Again', `Everyone's here?`, `Everyone made it?`],
  ['rnd_rudie', 'Rehearsal', `Rehearsing something?!`, `A rehearsal?!`],
  ['shelly_ribecca', 'Pink', `Sorry, I just didn't think you were asking me!`, `Sorry! I didn't think you meant me.`],
  ['ribecca_scraps', 'Materials', `Hey, I saw that first.`, `Hey, I spotted that fabric first.`],
  ['flutter_flyte', 'Her Version', `Hey, what's Gigi been writing in there for you?`, `What has Gigi been writing in your diary?`]
].forEach(args => friendshipEdit(...args));

/* The hub introductions play before the first stage. Give the longer ones a
   quick hook so the first scene can move the relationship forward. */
function friendshipGreetingScene(id, script) {
  if (!FRIENDSHIP_GREETING_LINES[id]) throw new Error(`Missing friendship greeting: ${id}`);
  FRIENDSHIP_GREETING_LINES[id] = script.trim().split('\n').map(row => {
    const divider = row.indexOf('|');
    return { who: row.slice(0, divider), text: row.slice(divider + 1) };
  });
}

friendshipGreetingScene('shelly_ribecca', `
Narrator|Ribecca measures pink fabric against Shelly.
CheerbearShelly|Is that for me?
Ribecca|If you can stand still.
Narrator|Shelly immediately starts swaying.
CheerbearShelly|I can try!
Ribecca|That will do.
`);
friendshipGreetingScene('cocoa_rudie', `
Narrator|Rudie checks the emergency bag for the third time.
Cocoa|Looking will not make more supplies appear.
Rudie|I am making sure we still have some.
Cocoa|Come help me. People need what is inside.
Rudie|And we save something for later?
Cocoa|We will see.
`);
friendshipGreetingScene('brusha_tisha', `
Narrator|Brusha paints a bright line across the hallway.
Tisha|That is not where the route goes.
Brusha|Then show me where it does.
Tisha|You are going to help?
Brusha|Obviously. Your map needs color.
`);
friendshipGreetingScene('shelly_vee', `
Narrator|Shelly labels a fossil fragment. Vee reads over her shoulder.
Vee|Four theories for one rock?
Shelly|The fourth is my favorite. Help me test it?
Vee|I did not agree to that.
Shelly|You stayed.
`);
friendshipGreetingScene('poppy_boxten', `
Narrator|Poppy follows a soft melody down the hall to Boxten.
Poppy|Your key sounds nice.
Boxten|You can hear it over everything?
Poppy|I was listening for it.
Boxten|Oh.
`);
friendshipGreetingScene('dyle_shrimpo', `
Narrator|A signal box blocks the platform. Shrimpo kicks it; it does not move.
Dyle|Lift the far end, please. We need the passage clear.
Shrimpo|I HATE BEING ASKED NICELY.
Dyle|And yet?
Shrimpo|...FINE.
`);
friendshipGreetingScene('poppy_toodles', `
Narrator|Poppy searches under a bench. Toodles studies the trail beside it.
Poppy|My ribbon was right here!
Toodles|Then start where you last saw it.
Poppy|You make it sound easy.
Toodles|It is easier than searching everywhere.
Poppy|I will try. No promises!
`);
friendshipGreetingScene('squirm_cocoa', `
Narrator|Squirm peers into Cocoa's tin of Bonbons.
Squirm|I-is that a snack?
Cocoa|I made extras. You looked hungry.
Squirm|I always look hungry when I am nervous.
Cocoa|Then I will keep extras.
Squirm|That is... a lot of pressure.
`);
friendshipGreetingScene('goofy_rodger', `
Narrator|Goofy shows Rodger a key found in the hall.
Goofy|Gawrsh, any idea what it opens?
Rodger|Not until we find its lock. Where did you find it?
Goofy|Right where you are standing.
Rodger|Then let us begin there.
`);
friendshipGreetingScene('rudie_eggson', `
Rudie|Eggson! Race you to the elevator!
Eggson|No.
Rudie|You did not even think about it!
Eggson|I have. Many times.
Rudie|I will race you anyway!
Eggson|That is not how a race works.
`);
friendshipGreetingScene('shrimpo_waxwell', `
Narrator|Shrimpo yells at a fallen Twisted. Waxwell watches, fascinated.
Waxwell|You are a remarkably committed nuisance.
Shrimpo|I'M THE BEST AT IT!
Waxwell|Excellent. You might be useful.
Shrimpo|I'M NOT HELPING YOU!
Waxwell|You already are.
`);
friendshipGreetingScene('yatta_looey', `
Narrator|Looey hurries after Yatta down the hall.
Looey|Wait up!
Yatta|Float faster.
Looey|That is not how balloons work!
Yatta|Keep up and prove me wrong.
`);

CAMPAIGNS.scraps_poppy.intro = [
  { who: 'Narrator', text: 'Poppy finds Scraps sorting yarn and bent paper outside the old craft room.' },
  { who: 'Poppy', text: 'Your claws are shiny! Could we decorate them?' },
  { who: 'Scraps', text: 'Wet paint would turn me into a soggy project.' },
  { who: 'Poppy', text: 'Then we find a dry way. You are the craft expert.' },
  { who: 'Scraps', text: 'And you are reaching for my supplies.' },
  { who: 'Poppy', text: 'Only the pretty ones!' },
  { who: 'Narrator', text: 'Scraps moves the box closer.' }
];
CAMPAIGNS.rudie_scraps.intro = [
  { who: 'Narrator', text: 'Rudie skids to Scraps’s worktable. She is cutting a yellow paper star.' },
  { who: 'Rudie', text: 'Happy holidays! Can you make enough to mark the dark hall?' },
  { who: 'Scraps', text: 'I have made one. You nearly blew it off the table.' },
  { who: 'Rudie', text: 'One is a start. I want everyone to find their way back.' },
  { who: 'Scraps', text: 'Then hold this one carefully.' },
  { who: 'Narrator', text: 'Rudie cups it between his hooves and, for once, stays still.' }
];

friendshipScene('eclipse_pebble', 'Pack Call', `
Eclipse|Peeeeebble!
Narrator|No answer.
Gourdy|Maybe Mr. Pebble went back to Dandy?
Soulvester|Shall we search for thy companion?
Eclipse|Wait. AWOOOOOO!
Narrator|A distant bark answers. Pebble races around the corner.
Pebble|BARK! BARK!
Eclipse|You heard me! That is our pack call.
Dandy|There you are. I have been looking for him.
Eclipse|Watch this! AWOOOO!
Pebble|BARK! BARK!
Gourdy|Awoooo!
Soulvester|Awo—
Dandy|Please, neither of you.
Eclipse|Your turn, Dandy!
Dandy|Absolutely not.
Pebble|Bworff!
Eclipse|Pebble says you have to.
Dandy|He is my dog. I know what he said.
Pebble|BARK!
Dandy|...I preferred it when you two just stared at each other.
`);

friendshipScene('rudie_eggson', 'Christmas Egg Hunt', `
Narrator|Bobette hands Rudie the recovered package. He opens it.
Rudie|Eggs?
Bobette|Ginger's idea.
Eggson|Excellent taste.
Rudie|Wait. CHRISTMAS EGG HUNT!
Eggson|Rudie, no.
Bobette|I would play. We are mixing holidays already.
Rudie|BOBETTE GETS IT!
Eggson|I appear to be outnumbered.
Bobette|You hide them. I will keep Rudie from peeking.
Rudie|I DO NOT PEEK!
Bobette|You absolutely do.
Rudie|Only sometimes.
Eggson|Then I finally have proper competition.
Rudie|You are ON!
`);

friendshipScene('shrimpo_waxwell', 'Success?', `
Narrator|Toodles runs up to Waxwell.
Toodles|What you did to the machine helped us!
Waxwell|It was sabotage.
Toodles|Then you are helpful at sabotage!
Shrimpo|HA! EVERYONE LIKES YOU!
Waxwell|Do not start.
Shrimpo|YOU ARE TERRIBLE AT BEING TERRIBLE!
Waxwell|I HATE YOU!
Narrator|They both stop. Waxwell hears himself.
Waxwell|...Oh no.
Shrimpo|NOW YOU GET IT!
Waxwell|You are still an obnoxious jerk.
Shrimpo|AND YOU ARE STILL A TERRIBLE VILLAIN!
Waxwell|Same time tomorrow?
Shrimpo|NO! ...MAYBE.
`);

friendshipScene('bobette_cocoa', 'The Wrong Question', `
Narrator|Bassie struggles with a supply crate. Cocoa starts toward her, then stops.
Bassie|You were going to offer help.
Cocoa|You usually say no. I did not want to bother you.
Bassie|You do not. Well, sometimes you do.
Narrator|Cocoa steps back. Bassie closes her eyes.
Bassie|That came out wrong. Could you help me with this?
Cocoa|Yeah!
Bassie|Quietly, please.
Cocoa|Quietly. Got it.
Cocoa|Thank you.
`);

friendshipScene('cocoa_soulvester', 'Knight Cocoa', `
Narrator|Cocoa stands beside Soulvester after the fight.
Cocoa|Sir Soulvester! I fought Twisteds, protected Bassie, survived Gourdy's dragon—
Gourdy|RAAAH!
Cocoa|—and delivered emergency Bonbons. Am I a knight?
Soulvester|There is more to knighthood than battle.
Narrator|Cocoa's ears droop.
Soulvester|A knight aids those in need, stands firm, and shares without reward.
Bassie|That sounds like Cocoa.
Soulvester|Then arise, Dame Cocoa.
Cocoa|Really?!
Soulvester|Indeed.
Narrator|She hugs him before he can stand.
Soulvester|Cocoa! Thy enthusiasm is formidable.
`);

friendshipScene('cocoa_kairi', 'Familiar', `
Cocoa|I have barely shown you any of the fun parts of Gardenview.
Kairi|You introduced me to Sprout. Tisha lets me touch what she is cleaning.
Cocoa|She still will not let me!
Kairi|Vee insulted me.
Cocoa|That's normal!
Kairi|And you showed me why this place matters to you.
Cocoa|I did?
Kairi|A world is more than its halls. It is the people who make you want to return.
Cocoa|Then Gardenview is pretty big.
Kairi|Even if its halls are not.
`);

friendshipScene('brightney_rnd', 'Brightney', `
Narrator|Vee finds Brightney after book club.
Vee|How did your "one meeting" go?
Brightney|Badly.
Vee|Did Squirm eat a book? Cause trouble?
Brightney|No. I think I made him feel like I expected him to.
Vee|Ah.
Brightney|Do not "ah" me.
Vee|Then talk to him.
Brightney|That was disappointingly reasonable.
Vee|I manage it occasionally.
`);

friendshipScene('brightney_rnd', 'Trust', `
Brightney|You left quickly last time.
Squirm|Sorry.
Brightney|I am sorry too. I was nervous about inviting you back.
Squirm|Because you do not trust me.
Brightney|Not completely. Yet.
Narrator|Squirm looks up.
Brightney|I wanted the meeting to work. Pretending I trust you already would not help either of us.
Squirm|No... I guess not.
Brightney|I trusted you enough to ask once. I would like to ask again.
Squirm|I-I would like that.
`);

friendshipScene('goob_waxwell', 'Cornered', `
Narrator|The group survives a close fight.
Finn|Too close for com-fort!
Narrator|No one laughs. Rodger turns to Waxwell.
Rodger|You knew more Twisteds were here.
Waxwell|I suspected.
Rodger|You could have warned us.
Waxwell|Would you have listened?
Rodger|Yes. What are you searching for?
Waxwell|None of your concern.
Goob|Rodger, stop. He is scared.
Waxwell|I am NOT scared.
Goob|Okay.
Waxwell|Stop saying it like that!
`);

friendshipScene('goob_waxwell', 'Going Back', `
Finn|Are we close?
Waxwell|Yes.
Rodger|You said that ten minutes ago. You keep checking that we are following.
Waxwell|I did not ask you to come.
Narrator|Goob notices Waxwell's hands shaking. He reaches out; Waxwell pulls away.
Waxwell|Do not.
Goob|Okay. Want me to stay close instead?
Waxwell|I suppose I cannot stop you.
Goob|No hug. I promise.
Waxwell|How generous.
Goob|Thanks!
Waxwell|That was sarcasm.
Goob|Oh. I am still staying.
Narrator|Waxwell does not object.
`);

friendshipScene('gourdy_connie', 'Connie', `
Connie|You are avoiding me.
Gourdy|I am checking on everyone.
Connie|You are exhausting.
Narrator|Gourdy falls quiet. Connie catches herself.
Connie|I meant you are trying to do five people's jobs alone.
Gourdy|I am supposed to look after them. And you.
Connie|I am older than you, kid.
Gourdy|What if something happens?
Connie|Then we handle it. I do not blame myself for everything that goes wrong.
Narrator|Gourdy has no answer.
`);

friendshipScene('shelly_ribecca', 'Cheer Bear Shelly', `
Narrator|Shelly steps out in the finished base costume. Ribecca checks the fit.
Shelly|You are quiet. Is something wrong?
Ribecca|Turn around.
Narrator|Ribecca adjusts a seam. Shelly looks in the mirror.
Shelly|Whoa. I look completely different.
Ribecca|Do you like it?
Shelly|I do. I just did not expect it to look this good on me.
Ribecca|I did.
Narrator|Shelly catches Ribecca's eye in the mirror and smiles.
`);

friendshipScene('ribecca_scraps', 'Shelly', `
Narrator|Shelly finds Ribecca working alone. Scraps is out looking for supplies.
Shelly|You took off Scraps's shoulder pieces. I liked them.
Ribecca|I said they were too much.
Shelly|It is your costume. Sorry.
Ribecca|That is the problem. I asked her to work with me, then treated it as mine.
Narrator|Ribecca picks up one of the discarded pieces.
Ribecca|Could we make this work?
Shelly|Both your styles? Definitely.
`);

friendshipScene('ribecca_scraps', 'Try That Again', `
Narrator|Scraps returns with fabric and sees her shoulder pieces back on the costume.
Scraps|You put them back.
Ribecca|Shelly tightened the stitching.
Shelly|You can tell?
Scraps|Yours are neater than mine.
Ribecca|I still do not want every piece on it. And I will say when something does not work.
Scraps|Same here. That part does not work.
Ribecca|Seriously?
Narrator|Ribecca studies it, then removes it.
Ribecca|Better?
Scraps|Better.
`);

friendshipScene('rodger_toodles', 'Next Time', `
Narrator|Rodger examines a damaged sign. Toodles crouches beside him.
Toodles|A clue? Can I help?
Rodger|Perhaps.
Toodles|Do not say "next time."
Rodger|I had not said anything.
Toodles|You were going to.
Rodger|Very well. You may assist, if you listen.
Toodles|Junior Detective Toodles is on the case!
Rodger|I have not explained the case.
Toodles|Then explain it!
`);

friendshipScene('rodger_toodles', 'Prime Suspect', `
Narrator|They find Blot and ask about the missing crayons.
Rodger|We are looking for the crayons. Have you seen them?
Blot|.meht was I
Narrator|Blot mimes drawing, then points toward the next room.
Toodles|He used them and left them there. He did not steal them!
Rodger|One item accounted for.
Toodles|Two down!
Rodger|One confirmed.
Toodles|You are going to make me say that every time, are you?
Rodger|Yes.
`);

friendshipScene('rodger_toodles', 'Solved', `
Narrator|Rodger closes his notebook.
Rodger|Scraps borrowed supplies. She probably has the missing tape.
Toodles|Probably? Did you ask her?
Rodger|No, but it is a reasonable conclusion.
Toodles|You said not to decide before checking.
Rodger|I chose this case because I thought I knew the answer.
Narrator|Toodles' excitement fades.
Toodles|You gave me a pretend case.
Rodger|That is not what I meant.
Toodles|It is what you did.
Narrator|She walks away before he can answer.
`);

friendshipScene('rodger_toodles', 'Tea', `
Narrator|Rodger finds Teagan pouring tea.
Rodger|Have you seen Toodles?
Teagan|With Cocoa. What happened?
Rodger|I gave her a case I thought I had solved.
Teagan|And now?
Rodger|She thinks I did not trust her with a real one.
Teagan|Did you?
Narrator|Rodger takes the cup but says nothing.
Teagan|You know where she is. Go talk to her.
`);

friendshipScene('rodger_toodles', 'Wrong', `
Narrator|Rodger finds Toodles and Cocoa. He opens Scraps's supply log.
Rodger|You were right. Scraps did not borrow tape.
Toodles|So you were wrong?
Rodger|Yes. The case is still open.
Narrator|Rodger hands her the notebook.
Rodger|It is your case too. What do you see?
Toodles|Blot used the crayons. Cocoa moved the candy. Maybe someone needed the tape.
Rodger|For a repair?
Toodles|We should look where things broke.
Rodger|That is a sound lead.
Narrator|This time, Rodger follows her.
`);
