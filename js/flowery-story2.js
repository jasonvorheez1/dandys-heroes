/* flowery-story2.js - "Flower Kingdom", segments 6-10 (appended to FL_STORY from flowery-story.js). */
'use strict';

FL_STORY.push(

/* ======================================================================= 6 */
{ id: 'king', title: 'The King of Flowers', sub: 'SEGMENT 6', place: 'Flower Castle · Foyer', script: String.raw`
@party Scraps,Ginger,Yatta
@room foyer 160 222 up
@music flFlowery
@fade in 0.8
@spawn Flowery 160 186 down
* The foyer. A wall of flowers, painted so carefully that you can't tell which ones are real.
Flowery.cheer: Ta-daaa! The heart of the castle. Every petal hand-placed. Every lantern hand-lit. Every—
@shake 3
@sfx step_metal 0.6
* CLANK. | CLANK. | CLANK.
@emote Flowery !
@wait 0.5
@emote Flowery off
Flowery.wide: Oh petals. That's him. That's HIM.
Flowery.yell: Into the bush! Into the bush, princesses, NOW!
@party off
@sfx grow 0.6
@walk Scraps 70 200 0.3
@walk Ginger 90 214 0.3
@walk Yatta 50 214 0.3
@spawn Bush 70 222 down
@frame Bush flowery_bush_0
@scale Bush 2.2
@hide Scraps
@hide Ginger
@hide Yatta
* Flowery throws a bush over you. It's a very good bush. It has a door-knocker for some reason.
@walk Flowery 160 186 0.2
@frame Flowery flowery_idle_0
@spawn Asgore 160 150 down
@music flAsgore
@frame Asgore asgore_armor_surprised_up_0
@walk Asgore 160 166 1.2
@frame Asgore asgore_armor_sad_down_0
* A huge figure in golden armor and a purple cape walks in. On his head, the armor has two little horn-shaped notches. He's holding a teacup.
Asgore: Flowery? | I heard shouting.
@voice my_king My king!
Flowery.cheer: Gorey! Ol' buddy! Goregore! There was no shouting. That was... | ...the castle. Settling. Into its foundations. Beautifully.
Asgore: Ah. Of course. | ...Is that bush new?
Flowery.smile: Brand new. Fresh this morning. Very rare breed. It's called the Do-Not-Look-At-Me.
@shakeA Bush 4
@sfx cloth 0.4
* The bush giggles.
Asgore: ...The bush giggled.
Flowery.sweat: That's how you know it's healthy.
@shakeA Bush 8
@sfx cloth 0.5
Yatta!: I CAN'T STAY STILL THIS LONG!!! IT'S PHYSICALLY ILLEGAL FOR ME!!!
@remove Bush
@show Scraps
@show Ginger
@show Yatta
@jump Yatta 260
@flash
* Yatta explodes out of the bush. Leaves everywhere. Ginger is still crouched with her hands over her face.
@frame Asgore asgore_armor_shock_right_0
@shake 4
Asgore: ...!
Asgore: Who... | Who are you three? How did you get into my kingdom?
* His voice is deep. It fills the room like a bell.
Asgore: Flowery. You told me nobody else would come. You promised me a day with no... | ...surprises.
Flowery.serious: I know, Gorey. I'm sorry. I didn't plan for these.
@frame Asgore asgore_armor_yell_0
Asgore: Are you sent by the one who made the fountain? | Answer me!
@shake 5
Ginger: W-we... we're not... | We're from a TV show!
@frame Asgore asgore_armor_sad_down_0
Asgore: ...
Asgore: A what?
Ginger: A TV show. For kids. Dandy's World. Saturdays at nine. | We teach kids about sharing and... colors. And how to tie your shoes, in season two.
Scraps: I taught crafts. I was on every third episode. Fourth, in winter.
Yatta: I DID THE INTRO JINGLE!!! WANNA HEAR IT?!
Asgore: ...
@frame Asgore asgore_kneel_0
@sfx step_metal 0.4
* Very slowly, with a sound like a cupboard full of pots settling, the king kneels down until his face is level with yours.
Asgore: ...You are children's entertainers.
Scraps: Yes.
Asgore: And you walked into my kingdom by accident. Through a door in a vent.
Yatta: THROUGH A DOOR IN A VENT!!!
@frame Asgore asgore_kneel_look_up_0
Asgore: ...
@frame Asgore asgore_kneel_look_up_1
Asgore: Ha. | Ha ha ha.
@frame Asgore asgore_kneel_0
Asgore: I am sorry I shouted. You must be very tired. | Would you like some tea?
@music flAsgore
@fade out 0.8
@card Tea With a King|A LITTLE LATER
@room foyer 160 222 up
@party off
@spawn Asgore 160 170 down
@frame Asgore asgore_kneel_0
@spawn Flowery 240 186 left
@lead 110 196 right
@walk Ginger 130 200 0.01
@walk Yatta 200 206 0.01
@walk Scraps 100 196 0.01
@face Ginger up
@face Yatta left
@face Scraps right
@fade in 0.8
* The king pours tea into four cups and one very small cup. The very small cup is for Yatta, because he can tell.
Asgore: So. Dandy's World. Tell me about it. | What is a Gardenview?
Scraps: It's where we live. It's a big building. There's a lobby, and floors for every holiday, and a library, and a big glass elevator that goes down forever.
Ginger: It's closed now.
Asgore: Closed?
Ginger: The people who made us went away. Something bad happened. Nobody watches the show anymore. | We're still there, though. We just... keep being there.
* The king is quiet for a while. He turns the teacup in his big hands.
Asgore: ...I know a little about that.
Asgore: About being kept. About things that were only supposed to last a day, and didn't.
@face Flowery up
@frame Flowery flowery_lookup_0
* Flowery looks up at the ceiling very hard.
Ginger: Can I ask something?
Asgore: Of course, little one.
Ginger: Do you ever give people things they didn't ask for? | And then worry they didn't want them?
Asgore: ...Every day. My whole life.
Ginger: Me too. | My power, back home, is I give people one of my hearts. And it heals them. It's the only thing I'm good at. | But I always think... what if they didn't want it from me? What if they wanted it from somebody better?
Asgore: Hm.
@frame Asgore asgore_kneel_sad_0
Asgore: I once gave a person seven flowers. I thought they would last one day. | They lasted twenty years.
Asgore: I don't think anybody wanted them to last that long except me. | But I am so glad they did.
* Flowery has stopped looking at the ceiling. He isn't looking at anybody now.
Ginger: ...Thank you.
@frame Asgore asgore_kneel_0
Yatta: KING!!! KING KING KING!!!
Asgore: Yes, small loud one?
Yatta: WANNA SEE A TRICK?!
Asgore: ...I would love to see a trick.
@party off
@walk Yatta 160 214 0.3
@spin Yatta 12
@jump Yatta 300
@wait 0.6
@spin Yatta 0
@sfx bomb 0.4
@flash #ffe066
* Yatta does a triple flip, lands on her face, and bounces up throwing two handfuls of candy into the air. They land in the king's tea.
Yatta: TA-DAAAAA!!!
@frame Asgore asgore_surprised_hand_0
Asgore: ...
@frame Asgore asgore_surprised_hand_1
Asgore: HA! HA HA HA HA!
@shake 3
* The king laughs so hard his armor rattles. It goes on for a long time. Flowery's mouth falls a little bit open.
Asgore: Oh... oh, I'm sorry, I haven't— | I haven't laughed like that since...
Asgore: ...since my son was small.
@walk Scraps 140 200 0.6
@face Scraps right
Scraps: Here.
* Scraps holds something up. It's a crown, folded out of a tea-shop menu, with seven little flowers cut along the top.
Scraps: I made it while you were talking. Everybody here's a king except you. You're just wearing a helmet.
@frame Asgore asgore_kneel_look_up_0
Asgore: ...
* He takes off the horned helmet. Under it, he's just an old goat with a beard. He puts the paper crown on. It's much too small. He wears it anyway.
Asgore: How do I look?
Scraps: Like a king. A real one. Not a costume one.
Asgore: ...Thank you, Scraps.
@frame Flowery flowery_sad_downleft_0
Flowery.soft: (very quietly) ...Goregore...
@fade out 1
@card The Same Night|THE BALCONY
@room foyer 160 222 up
@party off
@spawn Flowery 160 176 up
@frame Flowery flowery_lookdown_upright_0
@lead 130 214 up
@hide Ginger
@hide Yatta
@fade in 0.8
@music flWho
* The king has gone to bed wearing the crown. Flowery hasn't moved from the window.
@walk Scraps 150 200 0.8
Scraps: You're staring.
Flowery.calm: I'm thinking. It looks the same from the outside. It's a common mistake.
Scraps: What are you thinking?
@frame Flowery off
@face Flowery down
Flowery.serious: That you did something in one afternoon I couldn't do in a whole kingdom. | I built him a castle. I built him a garden and a diner and a sunset that never ends. | And he smiled at all of it. Politely. The way you smile at a gift you didn't ask for.
Flowery.serious: Then a paper cat folds him a hat out of a MENU, and he laughs like the world's ending.
Scraps: It was a crown.
Flowery.soft: I know what it was, Origami.
* He's quiet. When he speaks again, his voice has gone careful, like somebody stepping on ice.
Flowery.calm: ...Where do you go? When you leave here.
Scraps: Home.
Flowery.calm: And there's somebody there who'll laugh like that? | Who needs you to make their hats?
Scraps: ...There's Goob. My brother. He's... he's really small. He needs everybody.
Flowery.plain: Mm.
Flowery.side: Get some sleep, princess. Tomorrow I'll show you the bath. It's got a very good view.
Scraps: I don't do baths.
Flowery.grin: You will.
@walk Flowery 330 176 1.4
@remove Flowery
@spawn Locker 270 196 down
@frame Locker dw_ralseicupboard_0
@ghost Locker
@wait 0.8
@sfx knock 0.5
* Knock, knock. | The cupboard is in the foyer now. Somebody has been carrying it around all day.
@face Scraps right
Scraps: ...You again.
Locker: Hello again! I'm so sorry. I don't want to be a bother. | It's only that I've been in here since the day before yesterday, and I think my legs have forgotten they're legs.
Scraps: Flowery put you in there.
Locker: ...He did. He was very polite about it.
@walk Scraps 248 200 0.6
@face Scraps right
@choice Cut the lock|Cut the lock, but dramatically
@if choice=2 dramatic
@goto cut
# dramatic
@spin Scraps 14
@jump Scraps 220
@wait 0.4
@spin Scraps 0
Scraps: Hsssss— SNIP.
@goto cut
# cut
@sfx scissorbell 0.8
@anim Locker dw_ralseicupboard_ 6 12 once
@sfx locker 0.7
@spawn Ralsei 272 214 down
@shake 2
@frame Ralsei ralsei_walk_down_sad_0
* A fluffy white goat boy tumbles out of the cupboard, face-first, and lies on the floor for a moment.
Ralsei.tired: ...Floor. | Hello, floor.
@idle Ralsei
@face Ralsei left
Ralsei.happy: Oh! Oh, thank you! Thank you so much!
Ralsei.smile: I'm Ralsei. I'm, um, a prince. Of darkness. It's much less scary than it sounds.
Scraps: I'm Scraps. I'm a paper cat. I'm exactly as scary as I sound.
Ralsei.nervous: Ha! Ha ha. | ...You're not from here, are you? You're not even from Kris's town. You look... drawn differently.
Scraps: Everybody keeps saying that.
Ralsei.serious: My friends, Kris and Susie, came here to close this world's fountain. The king sent them away. | Flowery put me in there so the king wouldn't see me. He says I remind the king of somebody.
Ralsei.worry: If you came in through the back door... then that door's been open this whole time. That's... not good. | Things that aren't supposed to cross can cross.
Ralsei.determined: I'll help you get home. I know a little about doors. | Prince's honor.
Ralsei.nervous: But, um. Please don't tell Flowery I'm out yet. He'll just find a bigger cupboard.
Scraps: ...Deal.
@fade out 1
@end
` },

/* ======================================================================= 7 */
{ id: 'bouquet', title: 'Bouquet', sub: 'SEGMENT 7', place: 'Flower Castle · The Onsen', script: String.raw`
@party Yatta,Ginger,Scraps
@room onsen 60 210 right
@music flNight
@fade in 1
* The castle's bath. Steam, lanterns, and a pool so still it looks painted.
@party off
@walk Yatta 200 196 0.5
@jump Yatta 320
@spin Yatta 10
@wait 0.5
@spin Yatta 0
@hide Yatta
@sfx hit_water 0.7
@shake 3
* CANNONBALL.
Yatta: (from under the water) BLBLBLBLBL!!!
@show Yatta
@frame Yatta off
@walk Ginger 150 204 1
Ginger: ...It's warm. | It's really warm. I'm going to melt a little bit. I don't mind.
@walk Scraps 50 214 0.6
@face Scraps right
Scraps: I'm good here.
Ginger: Scraps, come on. Just your feet.
Scraps.!: I'm PAPER. I'm a paper CAT. Do you know what happens to paper cats in hot water?!
Ginger: ...They get soft?
Scraps: They get SOFT, Ginger!!
@spawn Pink 260 150 down
@alpha Pink 0
@wait 0.3
@alpha Pink 0.3
@wait 0.3
@alpha Pink 0.6
@wait 0.3
@alpha Pink 1
@sfx magiccircle 0.4
* A pink figure is standing on the far side of the water. Nobody saw her come in. Her outline flickers a little.
Pink: Oh! | Oh nooo, I'm interrupting! I'm so sorry! I'm always interrupting.
Ginger: You're not interrupting. Who... who are you?
Pink: Pink! | Well. I'm Pink when I'm here. When I'm not here I'm... sort of nobody.
Pink: I'm not one of the seven. I'm the eighth. | There isn't supposed to be an eighth, you see. I just... showed up one day, in the bottom of the pot.
@walk Ginger 200 196 0.8
Ginger: ...I know that feeling.
Pink: You do?
Ginger: I only show up at Christmas. The rest of the year, everybody does things without me. Bakes without me. | When I come back they're nice. They're so nice. But they had a whole year I wasn't in.
Pink: ...
@anim Pink pink_overjoyed_ 10 12 once
Pink: YOU'RE LIKE ME!!
@frame Pink pink_peace_sign_0
Pink: Okay! Okay! New rule! You and me, we're both the eighth! We'll be eighth together! That's a club! That's TWO people!
Ginger: ...That's two people.
* Ginger laughs. It's a small laugh, but it's the first one she's done since the cafe.
@idle Pink
Pink: Don't tell Flowery I said I was nobody, okay? He gets SO mad. | He says nobody in his kingdom gets to be nobody. It's like, his whole thing.
@npc Pink pinkTalk
@party on
@lead 50 214 right
* (Scraps leaves the bath. Somebody's on the balcony.)
@trigger 280 150 30 80 balcony
@roam
# pinkTalk
Pink: Eighth Club meetings are whenever. Bring snacks. Bring yourself. Mostly bring yourself.
Pink: Oh, and tell the goat boy behind the bush he can come out. I can see his ears.
* Behind the bush: a very small, very guilty "eep."
@end
# balcony
@fade out 0.8
@room roof 160 214 up
@party Scraps
@spawn Flowery 200 160 up
@frame Flowery flowery_lookdown_upright_1
@fade in 0.8
@music flWho
* The roof. The sunset still hasn't ended. Flowery is sitting on the edge with his cape around his knees.
@walk Scraps 170 176 1
Flowery.calm: Couldn't do the bath?
Scraps: It's water.
Flowery.smile: Ha. | Sit. The edge doesn't bite. I asked it.
@party off
@walk Scraps 180 166 0.5
@face Scraps up
@frame Scraps off
Scraps: ...Can I tell you something weird?
Flowery.calm: Princess, I'm a golden flower with a cape. "Weird" is my love language.
Scraps: Two days ago I died.
* Flowery doesn't move. He doesn't say anything clever.
Scraps: There was a machine. If we died, it brought us back. So I came back, and everybody cried, and I was still me. Same paws. Same everything.
Scraps: But we broke the machine. We had to. It was hurting people. | So next time, there's no next time.
Scraps: And Goob's really small. He doesn't sleep unless I'm in the next room. | If I'm gone for real... who makes his hats?
Flowery.soft: ...
Flowery.calm: Can I tell YOU something weird?
Scraps: Okay.
@frame Flowery flowery_lookdown_upright_0
Flowery.calm: I was a flower in a pot. Golden. One of seven. A man grew us to ask a woman to marry him.
Flowery.calm: We were supposed to be for one day. One smiling day. You get picked, you get carried somewhere nice, you make somebody cry happy tears, | and then you're compost.
Flowery.serious: He didn't let us go. Twenty years, he watered us. Talked to us. Sang to us, badly. | And the whole time, we couldn't do anything for him. Not one thing. His friend got sick. His money ran out. His family left.
Flowery.serious: We just sat in our little pots. Being pretty. Being kept.
Flowery.dark: Then one day I woke up in here. With legs. With a voice. With stats.
Flowery.darksmile: Level ninety-nine, Origami. I typed that number in myself. | Do you know how easy it is to type a number?
Scraps: ...So it's fake?
Flowery.calm: It's all fake, princess. The castle's fake. The sunset's fake. My Level's fake. | The only real thing here is him.
Flowery.soft: And maybe you three. I haven't decided.
* The wind blows the cape off his knees. He doesn't fix it.
Flowery.calm: So. You got one more chance, and you're scared you used it up.
Scraps: ...Yeah.
Flowery.serious: Here's the only thing twenty years in a pot taught me, Origami. | Nobody gets to be useful forever. You just get to be useful today.
Flowery.serious: So be careful tomorrow. | But make the hat today.
Scraps: ...That's actually really good advice.
Flowery.smile: I'm full of it. Ask anyone. They'll say "full of it," and I'll take it as a compliment.
* Scraps doesn't say anything for a while. Then she puts her paw on the roof tile, very close to his hand. Not on it. Close.
@music stop
Flowery.calm: ...Scraps.
Scraps: Yeah?
@frame Flowery off
@face Flowery left
Flowery.serious: Stay.
Scraps: ...What?
Flowery.serious: Stay here. All three of you. He laughed today, Scraps. He wore your crown to BED.
Flowery.serious: Your building's closed. Your show's over. Nobody's watching. | Here, somebody would be. Every single day. He'd make you tea until the sun went out.
Flowery.soft: I'm asking. I'm not... I'm not very good at asking. Usually I just do things and hope they're right.
Scraps: ...I...
@sfx earth_quake 0.4
@shake 2
* Something drips. Somewhere below them, in the bath. A sound like ink falling into a glass of water.
@fx ichor 0.2
Flowery.wide: ...What was that?
@sfx ui_alert 0.6
Ginger!: (from below) SCRAPS!! FLOWERY!! THE WATER— | THE WATER'S GONE BLACK!
@fx glitch 0.6
@flash #000
@fade out 0.6 #000
@finish
` },

/* ======================================================================= 8 */
{ id: 'ichor', title: 'Ichor in the Garden', sub: 'SEGMENT 8', place: 'The Courtyard', script: String.raw`
@party Scraps,Ginger,Yatta
@room courtyard 320 270 up
@fx ichor 0.6
@fx tint rgba(20,0,40,.25)
@music flTension
@cut ichorRise
@spawn Flowery 320 230 up
@frame Flowery flowery_powering_up_kneel_0
@fade in 0.6
* The courtyard. Black ichor is welling up between the paving stones, thick and slow, like the whole kingdom is bleeding.
* It has shapes in it. Shapes you know. A box with a crank. A balloon. A grin with too many teeth.
Yatta: ...those are OURS.
Ginger: Twisteds. That's... that's Gardenview ichor. That's from HOME.
Flowery.yell: What IS it?!
Scraps: It's what happens when something goes wrong at our place. It leaks. It fills the floors. It makes things... wrong.
Flowery.snarl: In MY garden?! On the KING'S stones?!
@frame Flowery flowery_fists_0
@cut flowersCall
@battle ichor
@fx ichor 0.3
@room courtyard 320 270 up
@spawn Flowery 360 230 left
@fade in 0.6
@music flTension
* The last of the shapes sinks back into the stones. For now.
Flowery.wide: ...You hit them. | You hit them, and they BROKE.
Scraps: Yeah.
Flowery.serious: You couldn't scratch a Floradinn yesterday. Today you tore through those like they were tissue.
Ginger: ...Because they're ours. | They came from the same place we did. Everything here is made of your world's stuff. We can't touch it. But that—
Flowery.calm: That's made of yours.
* Flowery looks at the black stain spreading out across the courtyard. His voice goes very flat.
Flowery.calm: It followed you. | Through the back door.
Scraps: ...We didn't know.
Flowery.calm: I know you didn't. That's almost worse.
@spawn Ralsei 200 300 up
@walk Ralsei 270 254 0.8 run
Ralsei.worry: Everyone! Are you all right?!
@face Flowery left
Flowery.squint: ...Raly. | Who let you out?
Scraps: Me.
Flowery.smirk: Of course. Cats and cupboards. I should've seen that coming.
Ralsei.serious: Flowery, please listen. That door isn't a fountain door. Fountains make Dark Worlds. | This is something else. A door somebody DREW, between two places that were never supposed to touch.
Ralsei.serious: While it stays open, their world's darkness leaks into yours. It won't stop by itself. It'll just... keep coming.
@party off
@spawn Seth 120 200 right
@spawn Aqua 100 220 right
@spawn Green 520 200 left
@spawn Orange 520 164 left
@ghost Orange
@spawn Blue 560 240 left
@spawn Yellow 540 260 left
@spawn Pink 320 160 down
@alpha Pink 0.8
@music flFlowers
* One by one, the flowers come out into the courtyard. Seth's book is splattered. Orange is still punching the air. Pink floats over the wall, looking scared.
Seth: It's in the road. It's in the garden. It's coming up through the bridge.
Yellow: Blue's bed is gone. All of it. | ...I couldn't even arrest it.
Blue: Oh, darling. | Nobody arrests the tide.
Orange!: I PUNCHED ELEVEN OF THEM!! THEY KEEP COMING BACK!!
* Green says nothing. Green is holding a pan with a hole melted through it.
Aqua: Is the world ending? | I've never seen a world end. Is it like this?
Seth: Aqua.
Aqua: ...Blue.
Seth: ...Okay. Today you can be Blue.
Flowery.serious: How long until it reaches the king's room?
Seth: ...An hour. Maybe less.
Scraps: Then we have to go.
Flowery.wide: What?
Scraps: It came through the door because the door's open. Because WE opened it.
Ralsei.determined: If they walk back through, I can seal it behind them. From this side. Then it's closed for good. Nothing gets through, either way.
Ginger: Our side has people who can help, too. Rodger knows about doors. Tisha knows about ichor.
Scraps: We'll close it. We'll make sure it stays closed.
Flowery.calm: ...And you'll be on the other side of it.
Scraps: Yeah.
Flowery.calm: And you'll be on your side.
Scraps: ...Yeah.
* Very slowly, the golden flower starts to laugh. It isn't the bright laugh.
Flowery.dark: Of course. Of COURSE.
Flowery.dark: Everybody leaves him. His wife. His son. His other kid, the one with the curtain hair, with their fountains and their secrets. | And now three cartoons who made him laugh ONCE.
Flowery.calm: And Raly closes the door. Again. | Funny. You never seem to close KRIS'S doors, little guy. Only other people's.
Ralsei.angry: That's... that's not fair!
Flowery.calm: No. It's true, though.
Flowery.snarl: You were supposed to be different! You were supposed to be KEPT, like us! You know what it's like!
Ginger: We DO know! That's why we have to go! | Somebody kept us too. They're waiting.
Flowery.hair2: ...
@frame Flowery flowery_idle3_0
Flowery.hair3: Then here's the other way.
Flowery.hair3: You stay. The door stays open. And I hold back the ichor. Myself. Every day. Forever.
Yatta: YOU CAN'T DO THAT!!!
Flowery.darkgrin: Confetti. | I'm Level Ninety-Nine.
Scraps: You TYPED that!
Flowery.darkcalm: And I'll type it again, as many times as it takes.
@frame Flowery flowery_pose_0
@voice show_you Huh! I'll show you!
Flowery.serious: Top of the castle. Come and stop me, if you want to go home so badly. | Bring everything you've got. I'll bring everything I've got.
Flowery.serious: Petals. | ...With me.
* The flowers look at each other. Seth closes the book. Aqua puts the knife in her sleeve. Green puts down the pan. Orange climbs onto Green's hat.
Blue: Darling. You can't land a pirouette.
Flowery.soft: Then catch me, Blue.
Blue: ...
Blue: I always do.
@walk Flowery 320 120 1.6
@remove Flowery
@walk Seth 320 120 1.6
@remove Seth
@walk Aqua 320 120 1.6
@remove Aqua
* They go one at a time. Yellow tips his hat at you on the way past. Pink stays a moment longer than the rest.
Pink: ...He's not mean, you know. He's scared. It's the same face, when you're him.
Pink: I'll be up there too. | I'm sorry. Eighth Club rules. You go where the seven go.
Ginger: ...I know.
@alpha Pink 0
@remove Pink
@remove Green
@remove Orange
@remove Blue
@remove Yellow
@party Scraps,Ginger,Yatta,Ralsei
@party on
@lead 320 260 up
@music stop
Yatta: ...I don't want to fight him.
Scraps: Me neither.
Ginger: ...Then we don't fight him. We just get past him. And we tell him the truth until he hears it.
Scraps: That's a fight, Ginger.
Ginger: ...Yeah. I know.
Ralsei.sad: He's not wrong about me. About the doors. | ...But he's not right about you. I'll be right beside you. All the way home.
@trigger 290 140 60 30 next
@roam
# next
@fade out 1
@finish
` },

/* ======================================================================= 9 */
{ id: 'flowery', title: 'Thank You For Watching', sub: 'SEGMENT 9', place: 'The Top of the Castle', script: String.raw`
@party Scraps,Ginger,Yatta,Ralsei
@room roof 160 222 up
@spawn Flowery 160 172 down
@frame Flowery flowery_idle3_0
@fx petals
@music stop
@fade in 1.5
* The top of the castle. The sunset that never ends is ending.
Flowery.calm: You came.
Scraps: We said we would.
Flowery.calm: People say a lot of things. | ...And you brought Raly. How thoughtful. Did you bring him a hat? He looks cold without a hat.
Ralsei.pout: I'm not cold.
Flowery.smile: You're a little cold.
@frame Flowery flowery_lookdown_upleft_0
Flowery.serious: Listen. Just for a minute. Then you can hit me as much as you want.
Flowery.serious: In the whole world, there were seven of us. One golden. One green. One orange, one aqua, one purple, one blue, one yellow.
Flowery.serious: We were a question. A man asked it with us. | Flowers that were meant to live for one smiling day.
Flowery.serious: And for twenty years, he never let us go.
Flowery.soft: His friend got sick, and we sat in our pots. | His money ran out, and we sat in our pots. | His family left him...
Flowery.hair1: ...and we sat in our pots. And smiled. Because it's all flowers know how to do.
Flowery.hair2: Do you know what that's like? To be loved by somebody, and be completely, perfectly USELESS to them?
* Ginger nods. She doesn't say anything. She doesn't have to.
@frame Flowery flowery_pose_0
Flowery.serious: So no. You don't get to come in here with your smooth little faces and your hundred thousand pixels and make him laugh, | and then LEAVE.
Flowery.yell: Not while I'm still standing. Not while I've got petals left!
Flowery.yell: Petals! Recruits! Everybody I've ever been nice to!
Flowery.yell: LEND ME YOUR POWER!!
@voice lend_power Lend me your power!
@cut powerUp
@battle flowery
@music stop
@fx petals off
@cut omegaChase
@room roof 160 222 up
@party off
@spawn Flowery 160 184 down
@frame Flowery flowery_crouch_left_0
@lead 110 210 right
@walk Ginger 130 214 0.01
@walk Yatta 190 214 0.01
@walk Ralsei 90 214 0.01
@face Yatta left
@face Ralsei right
@fade in 1
* He's on his knees. His cape is torn. There are petals everywhere, and some of them are his.
Flowery.hair4: ...Get up.
Scraps: You're the one on the floor.
Flowery.hair4: I know that. I'm talking to myself. | Get up, Flowery. Get UP. One more. You've got one more.
Ginger: You don't.
Flowery.hair2: ...
Ginger: You don't have one more. That's okay. | You did everything. You did more than everything.
@sfx step_metal 0.6
@shake 2
Asgore: ...That's enough, my friend.
@end
` },

/* ======================================================================= 10 */
{ id: 'feather', title: 'Petal Feather', sub: 'SEGMENT 10', place: 'Home', script: String.raw`
@party Scraps,Ginger,Yatta,Ralsei
@room roof 160 222 up
@party off
@spawn Flowery 160 184 down
@frame Flowery flowery_crouch_left_0
@lead 110 210 right
@walk Ginger 130 214 0.01
@walk Yatta 190 214 0.01
@walk Ralsei 90 214 0.01
@face Ralsei right
@spawn Asgore 160 110 down
@walk Asgore 160 150 1.6
* The king climbs up onto the roof. He's still wearing the paper crown. It has a tear in one of the flowers now.
@frame Flowery flowery_turn_shocked_more_0
Flowery.wide: G-Gorey— | You shouldn't be up here, the ichor— it's not safe—
Asgore: I know. | I saw it. From the window. And I saw these three run straight into it to keep it away from my room.
@frame Asgore asgore_kneel_0
Asgore: Flowery. | I'd like to tell you something. And I need you to let me finish.
@music flSad
@cut thatDay
@room roof 160 222 up
@party off
@spawn Flowery 160 184 down
@frame Flowery flowery_sad_downleft_0
@spawn Asgore 160 160 down
@frame Asgore asgore_kneel_0
@lead 110 210 right
@walk Ginger 130 214 0.01
@walk Yatta 190 214 0.01
@walk Ralsei 90 214 0.01
@face Ralsei right
@fade in 1
Asgore: I knew the garden wasn't real. I knew the sunset didn't end. I knew you hid things from me. | I played along.
Flowery.tear: ...You KNEW?
Asgore: Of course I knew. You're terrible at hiding things. You put a bush on three children and the bush GIGGLED.
@frame Asgore asgore_kneel_look_up_1
Asgore: But I let you. Because nobody had done anything for me without being asked in so very long. | It was strange. Being looked after. I'd forgotten how it felt.
Asgore: Thank you. | Truly. Thank you.
Flowery.weep: I didn't do ANYTHING. I typed numbers. I built a fake sunset.
Asgore: You built it for me. That's the part that was real.
@frame Asgore asgore_kneel_0
Asgore: And now these three need to go home. | Somebody is waiting for them. The way I used to wait for my children.
Asgore: Let them go, Flowery. And then let me go home too. My shop doesn't water itself. | ...And there's a very important pot by the window. Golden. It needs looking after.
* Flowery looks at the king for a long time. Then he laughs. A wet, broken, real laugh.
Flowery.sigh: ...You'd better use the good fertilizer.
Asgore: Only the best.
@walk Flowery 150 196 1
@face Flowery left
Flowery.calm: ...Raly.
Ralsei.nervous: Y-yes?
Flowery.calm: Take them home. Properly. All the way to their door. | If anything so much as SNIFFS at them on the way, I'm holding you personally responsible.
Ralsei.determined: ...I will. I promise.
Flowery.smirk: And put a hat on. You look cold.
Flowery.calm: ...Origami. Cupcake. Confetti.
Flowery.soft: Close your door. Close it tight. | And when you get home, give that little brother of yours a hat, Scraps. A good one.
Scraps: ...I will.
Flowery.calm: And Cupcake. | Your cookies were round. I saw. Don't let anybody tell you they weren't.
Ginger: ...Thank you, Flowery.
Flowery.smirk: And Confetti.
Yatta: YEAH?!
Flowery.grin: You're still slower than me.
Yatta!: I TOUCHED YOUR SHOULDER!!! I WON!!!
Flowery.beam: You touched my shoulder ONCE. In a SLOW-MOTION SHOT. That doesn't count.
Yatta!: IT COUNTS FOREVER!!!
@fade out 1
@card Goodbye, Flower Kingdom|THE GARDEN
@room garden 380 214 right
@party off
@lead 380 214 right
@walk Ginger 360 220 0.01
@walk Yatta 340 214 0.01
@walk Ralsei 320 220 0.01
@face Ralsei right
@spawn Seth 470 186 left
@spawn Aqua 495 200 left
@spawn Green 520 190 left
@spawn Orange 520 154 left
@ghost Orange
@spawn Blue 560 206 left
@spawn Yellow 590 196 left
@spawn Pink 440 170 left
@spawn Flowery 620 214 left
@fade in 1
@music flHome
* The flowers walk you to the back door. Nobody says much at first.
Seth: I wrote you a page. | It's a good page. Ginger decorated it.
Aqua: My name's Confetti now.
Seth: Aqua...
Aqua: Thank you for watching my dream, Confetti Number One.
Yatta: THANK YOU FOR BEING IN IT, CONFETTI NUMBER TWO!!!
Orange!: COME BACK AND BE LOUD AGAIN SOMETIME!!
* Green steps forward and hands Ginger something wrapped in a napkin. It's a cookie. It's perfectly round. Green has written "YOURS" on it in icing.
Ginger: ...I'll keep it forever.
* Green shakes their head, and mimes eating it.
Ginger: ...Okay. I'll eat it. Eventually. After forever.
Yellow: Ma'am. Ma'am. Sir. | It was an honor to wrongly accuse you.
Blue: Darling. All three of you. | Love is the only real thing here. You brought some. Thank you for that.
Pink: Eighth Club! Don't forget! You're a member now, that means you're a member everywhere!
Ginger: I won't forget.
@walk Flowery 400 214 1.2
@face Flowery left
* Flowery stops in front of you. He's put the cape back on. It's still torn. He's wearing it anyway.
Flowery.calm: Well, princesses. | Thank you for watching my dream.
Scraps: ...It was a good show.
Flowery.smile: Of course it was. I was in it.
@voice goodbye Goodbye!
@party off
@spawn Locker 300 200 down
@frame Locker dw_ralseicupboard_0
@ghost Locker
@walk Ralsei 300 214 0.8
@face Ralsei left
* Ralsei stands by the cupboard. Behind its doors, where the back of a cupboard should be, there's a long dark hallway. At the end of it, very small, there's a vent grate.
Ralsei.smile: The back door. Flowery kept it in the cupboard, with me. | I suppose he thought nobody would look in there twice.
Ralsei.determined: Follow me. Stay close. Don't look at the walls too long, they look back.
@sfx magiccircle 0.5
@flash
@cut doorHome
@room gardenview 160 200 down
@party on
@lead 160 200 down
@fade out 0.01
@fade in 1.5
@music flHome
@card JULY 11, 2002|6:02 AM
@party off
@spawn Ralsei 160 156 down
@walk Scraps 140 190 0.01
@walk Ginger 170 196 0.01
@walk Yatta 196 190 0.01
@face Scraps up
@face Ginger up
@face Yatta up
* The vent grate is open. A fluffy white prince is crouched just inside it, careful not to put even one foot into the lobby.
Ralsei.smile: This is where I stop. If I come any further, the door can't close.
Ralsei.calm: Scraps. You drew it open. | I think you're the one who can draw it closed.
Scraps: ...How?
Ralsei.smile: The same way you drew it in the first place. Without thinking too hard. Just... mean it.
@sfx scissorbell 0.6
* Scraps takes out her pen. On the inside of the grate, where the little flower is, she draws one neat line. Like closing a book.
Ralsei.happy: There. | Goodbye, Scraps. Goodbye, Ginger. Goodbye, Yatta.
Ralsei.content: Please tell your friends... somebody in another world is rooting for them. A whole kingdom of somebodies.
Yatta!: BYE RALSEI!!! YOU'RE THE BEST CUPBOARD WE EVER OPENED!!!
Ralsei.blush: ...That's the nicest thing anyone's said to me all week.
@sfx doorclose 0.6
@remove Ralsei
* The grate clicks shut. Behind it there's nothing but a vent, and a candy stash that is NOT a candy stash.
* The vents are quiet. There's a little door back there, behind a candy stash that is NOT a candy stash. It's closed. It's very, very closed.
@party off
@walk Yatta 120 196 0.6
@walk Ginger 200 206 0.6
@face Scraps up
Yatta: ...did that happen?
Ginger: I have a cookie that says "YOURS." | So I think it happened.
* Scraps walks over to the sign. The CLOSED sheet. The little sad flower somebody drew on it yesterday.
@walk Scraps 160 170 1
@face Scraps up
* She takes a pen out of her apron, very carefully, and adds one thing.
@wait 1
* A smile.
Scraps: There.
Ginger: ...It's smiling now.
Scraps: Yeah. | It's still a little sad. But it's smiling anyway.
@face Scraps down
Scraps: Come on. Goob's going to wake up soon. | I'm going to make him a hat.
@fade out 2
@cut credits
@end
` }
);
