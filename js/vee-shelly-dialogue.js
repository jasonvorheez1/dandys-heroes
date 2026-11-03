/* Vee and Shelly voice pass. Loads after friendship-dialogue.js, whose earlier
   pass flattened both of them. Beats and rewards are unchanged.
   Shelly: warm and bubbly, "Okay! So...", capitals for the exciting word,
   fossil and dinosaur facts, knows people tune her out when she gets into
   something. Vee: precise quiz-show host, deadpan, sounds superior without
   meaning to, keeps records of everything, quietly protective. */
'use strict';

friendshipScene('shelly_vee', 'Loose Wire', `
Vee|Shelly. Your tracker is showing an old floor layout.
Shelly|Old? I thought the floors were always like this!
Vee|They were not. This corridor used to bend left.
Shelly|You remember that?!
Vee|I keep records. Every layout, every change. It is a very full archive.
Shelly|Of EVERYTHING?
Vee|Everything useful.
Shelly|Hehe. I think that's nice.
Vee|Mostly useful.
`);

friendshipScene('shelly_vee', 'Field Notes', `
Shelly|Okay! So, I've been comparing the fossils we found down here.
Vee|You brought your notes into a Twisted floor.
Shelly|Of course! I want to know where they came from!
Vee|Two of them do not belong together. Different layers, different ages.
Shelly|Wait, you noticed that too?!
Vee|I notice a great deal. It is most of my job.
Shelly|Then help me sort them! Please?
Vee|I had already cleared a table.
`);

friendshipScene('shelly_vee', 'Diagnostics', `
Vee|You should rest.
Shelly|I'm okay! Rodger needed help with the door.
Vee|And then you carried his tools, and then you carried mine.
Shelly|Hehe, you counted?
Vee|I count everything. You have been running for eleven hours.
Shelly|I'll be fine, really!
Vee|You said that before you helped him, too.
Shelly|Are you worried about me?
Vee|I am keeping track of you.
Shelly|That's not what I asked.
Vee|I know.
`);

friendshipScene('shelly_vee', "You're a Fan?", `
Vee|You have seen that episode before. Several times.
Shelly|I like the old ones! Everybody's so excited when someone wins.
Vee|You already know who wins.
Shelly|That's the best part! I watch for the other stuff, like how happy everyone looks. You seemed happier in them, too.
Vee|...Did I?
Shelly|A little! Sorry, was that weird to say?
Vee|No. I did not expect anyone to be watching me and not the contestants.
Shelly|I was watching both!
Vee|That is the most accurate thing anyone has said about the show.
`);

friendshipScene('shelly_vee', 'Upgrade', `
Shelly|Vee, you're getting another upgrade?
Vee|Probably. The Management does not ask first.
Shelly|Do you know what it'll change?
Vee|No.
Shelly|Do you get to say no?
Vee|Sometimes.
Shelly|That's a scary answer!
Vee|It is the honest one.
Shelly|Are you scared?
Vee|I do not know. I cannot measure what I might lose, so I cannot tell if the fear is accurate.
Shelly|I'd be scared.
Vee|Then I will remember that you said so.
`);

friendshipScene('shelly_vee', 'The Choice', `
Shelly|You keep saying you don't know how you feel about it.
Vee|It is difficult to measure.
Shelly|Okay, so tell me the part you DO know.
Vee|I do not want to lose what I remember.
Shelly|Then we protect it!
Vee|We?
Shelly|You helped me sort my fossils. Let me help with your records!
Vee|...That is a fair trade.
`);

friendshipScene('shelly_vee', 'Field Update', `
Narrator|Vee holds out a small backup chip.
Vee|I made a copy.
Shelly|Of your records?
Vee|Of the ones that matter.
Shelly|Can I add something?
Vee|What?
Shelly|Us! So you'll always remember we were here.
Vee|...Already saved.
`);

/* Glisten + Vee: keep the plot, return Vee and Shelly to their own voices. */
friendshipScene('glisten_vee', 'Studio Lighting', `
Narrator|The team rests in an abandoned television studio. Glisten tries the dead camera's old mark.
Glisten|This light makes me look like a scratched window.
Vee|You are on the wrong mark. One step left.
Glisten|You could have said that without insulting the window.
Vee|I did not insult the window.
Glisten|You were thinking it.
Vee|That was a different thought. It was about the lamp.
`);

friendshipScene('glisten_vee', 'Glaring Error', `
Narrator|Twisteds enter from stage left. Glisten turns toward them, and his reflection flashes across Vee's screen.
Vee|I lost the feed. Glisten, angle away from me.
Glisten|I was drawing them off Rodger.
Rodger|Both observations are correct. The glare worked on them and on us.
Vee|Then we need a mark that puts the glare on the far side of the room.
Glisten|Show me where to stand.
`);

friendshipScene('glisten_vee', 'Broadcast Calibration', `
Narrator|Vee marks two spots on the studio floor with tape.
Vee|From the first mark I can see the doorway. From the second, you reflect the overhead light into it.
Glisten|And neither of us blocks the other.
Vee|Correct. One rehearsal before the next fight.
Glisten|Count me in. I like a rehearsal.
Vee|I know. I have you down for three.
`);

friendshipScene('glisten_vee', 'Live On Air', `
Narrator|Another wave pushes through the studio doors. Shelly spots a weak hinge on the rear gate.
Shelly|Hey! If we pull them under that light, the gate can swing shut behind them!
Vee|Glisten, second mark. I will watch the rear camera.
Glisten|On my way.
Narrator|The reflected light pulls the Twisteds toward him. Vee shuts the gate when the last one crosses.
Shelly|That bought us a clear route! Okay, move, move, move!
`);

friendshipScene('glisten_vee', 'Prime Time Close-Up', `
Narrator|A Twisted slips through the side entrance while Vee checks the gate.
Glisten|Vee. Your left.
Vee|I see it. Hold the light there.
Narrator|Glisten keeps the Twisted in the spotlight. Vee's screen marks its position for the team.
Glisten|Did the camera get that angle?
Vee|Yes. It also got you warning me.
Glisten|Keep both clips.
`);

friendshipScene('glisten_vee', 'The Critic', `
Narrator|Rodger reviews the footage with them.
Rodger|The side entrance was outside the planned view.
Vee|My camera missed it. That is not a sentence I enjoy.
Glisten|I caught the movement in my reflection.
Rodger|Then the plan needs both of you. The camera covers the gate, the mirror covers the blind spot.
Vee|I will put a mark on the wall for that turn.
Glisten|And make sure it is flattering.
`);

friendshipScene('glisten_vee', 'Season Finale', `
Narrator|The final Twisted breaks the floor marks. Vee's camera flickers.
Vee|I cannot see the rear gate. Tell me when it reaches the light.
Glisten|Two steps. One. Now!
Narrator|Vee closes the gate. Glisten turns the remaining light onto the Twisted so the team can finish the fight.
Vee|Clear. Camera is back.
Glisten|Then cut to our good side.
`);

friendshipScene('glisten_vee', 'Sign-Off', `
Narrator|The studio is quiet. Vee saves the footage while Glisten straightens a bent lamp.
Glisten|You are keeping the recording?
Vee|It shows how we covered each other's blind spots.
Glisten|That sounds like a compliment.
Vee|It is a useful record.
Glisten|I will take it.
Vee|You always do.
`);

/* Shelly in the costume scenes: the earlier pass made her stiff. */
friendshipScene('shelly_ribecca', 'Cheer Bear Shelly', `
Narrator|Shelly steps out in the finished base costume. Ribecca checks the fit.
Shelly|You're being really quiet. Is something wrong?
Ribecca|Turn around.
Narrator|Ribecca adjusts a seam. Shelly looks in the mirror.
Shelly|Whoa. I look completely different!
Ribecca|Do you like it?
Shelly|I do! I just didn't expect it to look this good on me.
Ribecca|I did.
Narrator|Shelly catches Ribecca's eye in the mirror and smiles.
`);

friendshipScene('shelly_ribecca', 'Keep It', `
Narrator|Ribecca finds Shelly wearing the Cheer Bear costume again.
Ribecca|Still wearing it?
CheerbearShelly|It's cute, it's comfortable, and I helped make it!
Ribecca|You like that people notice.
CheerbearShelly|It's nice when they do!
Ribecca|I noticed.
Narrator|Shelly looks up, then smiles.
CheerbearShelly|You did.
Narrator|Ribecca picks up Shelly's sketch.
Ribecca|Now, shall we fix this disaster?
CheerbearShelly|It's not a disaster!
Ribecca|This seam says otherwise.
CheerbearShelly|Okay, okay. Show me.
`);

friendshipScene('ribecca_scraps', 'Shelly', `
Narrator|Shelly finds Ribecca working alone. Scraps is out looking for supplies.
Shelly|You took off Scraps's shoulder pieces. I liked those!
Ribecca|I said they were too much.
Shelly|It's your costume. Sorry!
Ribecca|That is the problem. I asked her to work with me, then treated it as mine.
Narrator|Ribecca picks up one of the discarded pieces.
Ribecca|Could we make this work?
Shelly|Both your styles? Definitely! Hand me a needle.
`);

friendshipScene('ribecca_scraps', 'Finished', `
Narrator|Shelly steps out in the finished costume.
Scraps|Oh, I like it.
Ribecca|Turn around. Again.
Shelly|Am I modeling now?
Ribecca|Obviously.
Scraps|The back needs one little thing.
Ribecca|Do not start.
Shelly|You kept my scale pattern! And the shoulder pieces!
Scraps|Those were mine.
Shelly|I did the stitching, so it's all three of ours!
Ribecca|As it should be. You are wearing it.
Scraps|Can we make another?
Ribecca|Already? All right.
Shelly|Can I pick the theme?
Ribecca|Go on.
Shelly|Cambrian!
Scraps|What is Cambrian?
Shelly|You don't know?! Okay! So, the Cambrian Explosion was about 538 million years ago, and suddenly there were eyes, and shells, and—
Narrator|Ribecca gathers supplies. Scraps settles beside Shelly.
Scraps|I am listening.
Narrator|Shelly beams and keeps going.
`);
