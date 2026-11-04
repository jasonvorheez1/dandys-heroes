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
Flowery.cheer[hey_guys]: Ta-daaa! The heart of the castle! | Every petal, placed by hand. Every lantern, lit by—
@shake 3
@sfx impact 0.6
* (CLANK.) | (CLANK.) | (CLANK.)
@emote Flowery !
@wait 0.5
@emote Flowery off
@anim Flowery flowery_shake_head_ 5 12 once
Flowery.wide[nonono]: That's him!
Flowery.yell[none]: Into the bush, Princesses! NOW!
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
* (Flowery throws a bush over you.)
@walk Flowery 160 186 0.2
@frame Flowery flowery_idle_0
@spawn Asgore 160 150 down
@music flAsgore
@frame Asgore asgore_armor_surprised_up_0
@walk Asgore 160 166 1.2
@frame Asgore asgore_armor_sad_down_0
* (A huge figure in golden armor walks in, holding a teacup.)
Asgore: Flowery? | I thought I heard voices.
Flowery.cheer[my_king]: Gorey! Ol' buddy! | Just the transient winds.
Asgore: Ah. | ...Is that bush new?
Flowery.smile[none]: Fresh this morning. Very rare.
@shakeA Bush 4
@sfx wing 0.4
* (The bush giggles.)
Asgore: ...The bush giggled.
Flowery.sweat[none]: It's a happy bush.
@shakeA Bush 8
Yatta!: I CAN'T STAY STILL THIS LONG!!!
@remove Bush
@show Scraps
@show Ginger
@show Yatta
@jump Yatta 260
@flash
* (Yatta bursts out of the bush. Ginger is still crouched with her hands over her face.)
@flip Asgore on
@frame Asgore asgore_armor_shock_right_0
@shake 4
Asgore: ...!
Asgore: Who... who are you? | How did you get into this kingdom?
Asgore: Flowery, you said nobody else would come.
Flowery.serious[none]: I know, Gorey. I didn't plan for these.
@frame Asgore asgore_armor_yell_0
Asgore: Were you sent by whoever made the Fountain!? | Answer me!
@shake 5
Ginger: W-we're from a TV show!
@frame Asgore asgore_armor_sad_down_0
Asgore: ...
Asgore: A what?
Ginger: For kids. Dandy's World. Saturday mornings. | We teach sharing. And colors.
Scraps: I did crafts.
Yatta: I DID THE INTRO SONG!!! WANNA HEAR IT!?
Asgore: ...
@flip Asgore off
@frame Asgore asgore_kneel_0
@sfx impact 0.4
* (The king kneels down until he's at eye level with you.)
Asgore: ...You're children's entertainers.
Scraps: Yes.
Asgore: And you came in by accident. | Through a door in a vent.
Yatta: THROUGH A DOOR IN A VENT!!!
@frame Asgore asgore_kneel_look_up_1
Asgore: ...Ha. | Ha ha ha.
@frame Asgore asgore_kneel_0
Asgore: I'm sorry I shouted. | Would you like some tea?
@fade out 0.8
@card Tea with the King|A LITTLE LATER
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
* (The king pours four cups of tea, and one very small cup for Yatta.)
Asgore: So. Tell me about this... Gardenview.
Scraps: It's where we live. There's a floor for every holiday. | And an elevator that goes down forever.
Ginger: It's closed now.
Asgore: Closed?
Ginger: The people who made us went away. Nobody watches the show anymore. | We're still there, though.
Asgore: ...I see.
Asgore: I have a few things in my shop that were only supposed to last a day, too.
@face Flowery up
@frame Flowery flowery_lookup_0
* (Flowery looks up at the ceiling.)
Ginger: Can I ask you something?
Asgore: Of course.
Ginger: Do you ever give people things they didn't ask for? | And then worry they didn't want them?
Asgore: ...All the time.
Ginger: Back home, I heal people by giving them one of my hearts. It's the only thing I'm good at.
Ginger: But I always wonder if they wanted it from somebody else.
@frame Asgore asgore_kneel_sad_0
Asgore: I once gave someone seven flowers. I thought they would last one day.
Asgore: They lasted twenty years. | I don't know if anyone wanted that but me.
Asgore: But I'm glad they did.
* (Flowery is looking at the floor now.)
Ginger: ...Thank you.
@frame Asgore asgore_kneel_0
Yatta: KING!!! WANNA SEE A TRICK!?
Asgore: I would love to see a trick.
@walk Yatta 160 214 0.3
@spin Yatta 12
@jump Yatta 300
@wait 0.6
@spin Yatta 0
@sfx bomb 0.4
@flash #ffe066
* (Yatta does a triple flip, lands on her face, and throws candy everywhere. Some of it lands in the king's tea.)
Yatta: TA-DAAAA!!!
@frame Asgore asgore_surprised_hand_1
Asgore: HA! HA HA HA HA!
@shake 3
* (The king laughs so hard his armor rattles.)
Asgore: Oh... I'm sorry. | I haven't laughed like that since my son was small.
@walk Scraps 140 200 0.6
@face Scraps right
Scraps: Here.
* (Scraps holds up a crown folded out of a menu. Seven little flowers are cut along the top.)
Scraps: Everybody else here is a king. You just have a helmet.
@frame Asgore asgore_kneel_look_up_0
* (The king takes off his helmet and puts the paper crown on. It's much too small.)
@crown Asgore on
Asgore: How do I look?
Scraps: Like a king having a good day.
Asgore: ...Thank you, Scraps.
@frame Flowery flowery_sad_downleft_0
Flowery.soft[none]: ...Gorey...
@fade out 1
@card The Same Night|THE FOYER
@room foyer 160 222 up
@party off
@spawn Flowery 160 176 up
@frame Flowery flowery_lookdown_upright_0
@lead 130 214 up
@hide Ginger
@hide Yatta
@fade in 0.8
@music flWho
* (The king went to bed wearing the crown. Flowery hasn't moved.)
@walk Scraps 150 200 0.8
Scraps: You're staring.
Flowery.calm[none]: I'm thinking. | It looks the same.
@frame Flowery off
@face Flowery down
Flowery.serious[none]: I built him a castle. A garden. A diner. A sunset that never ends.
Flowery.serious[none]: He smiled at all of it. | Politely.
Flowery.serious[none]: You fold him a hat out of a menu and he laughs until his armor shakes.
Scraps: It was a crown.
Flowery.soft[none]: I know, Origami.
Flowery.calm[none]: ...Who's waiting for you? Back home.
Scraps: Goob. My little brother.
Flowery.plain[none]: Mm.
Flowery.side[hoo]: Get some sleep, Princess. | Tomorrow, the bath.
Scraps: I don't do baths.
Flowery.grin[hah]: You will.
@walk Flowery 330 176 1.4
@remove Flowery
@spawn Locker 270 196 down
@frame Locker dw_ralseicupboard_0
@ghost Locker
@wait 0.8
@sfx knock 0.5
* (Knock knock.) | (The cupboard is in the foyer now.)
@face Scraps right
Scraps: ...You again.
Locker: Hello! Sorry! | I've been in here since the day before yesterday. I think my legs forgot they're legs.
Scraps: Flowery put you in there?
Locker: ...He was very polite about it.
@walk Scraps 248 200 0.6
@face Scraps right
@choice Cut the lock|Cut the lock dramatically
@if choice=2 dramatic
@goto cut
# dramatic
@spin Scraps 14
@jump Scraps 220
@wait 0.4
@spin Scraps 0
Scraps: Hsss— SNIP!
@goto cut
# cut
@sfx scissorbell 0.8
@anim Locker dw_ralseicupboard_ 6 12 once
@sfx locker 0.7
@spawn Ralsei 272 214 down
@shake 2
@frame Ralsei ralsei_walk_down_sad_0
* (A fluffy white goat boy falls out of the cupboard, face first.)
Ralsei.tired: ...Floor. | Hello, floor.
@idle Ralsei
@face Ralsei left
Ralsei.happy: Oh! Thank you! Thank you so much!
Ralsei.smile: I'm Ralsei! I'm a prince. | ...Of darkness. Hello!
Scraps: Scraps. You've got dust on your face.
Ralsei.nervous: You're not from here, are you? | You're not even from Kris's town.
Scraps: We're from Gardenview.
Ralsei.wow: I've never heard of it!
Ralsei.serious: My friends, Kris and Susie, came here to seal this world's Fountain. The king sent them away.
Ralsei.serious: Flowery put me in there so the king wouldn't see me. | He says I remind him of someone.
Ralsei.worry: If you came through the back door, it's been open this whole time. | Anything could come through it.
Ralsei.determined: I'll help you get home. I promise.
Ralsei.nervous: But... please don't tell Flowery I'm out yet.
Scraps: Deal.
@fade out 1
@end
` },

/* ======================================================================= 7 */
{ id: 'bouquet', title: 'Bouquet', sub: 'SEGMENT 7', place: 'Flower Castle · Onsen', script: String.raw`
@party Yatta,Ginger,Scraps
@room onsen 60 210 right
@music flNight
@fade in 1
* (The castle bath. Steam, lanterns, and very still water.)
@party off
@walk Yatta 200 196 0.5
@jump Yatta 320
@spin Yatta 10
@wait 0.5
@spin Yatta 0
@hide Yatta
@sfx bump 0.7
@shake 3
* (CANNONBALL.)
Yatta: (underwater) BLBLBLBLBL!!!
@show Yatta
@walk Ginger 150 204 1
Ginger: It's warm... | I might melt a little. That's okay.
@walk Scraps 50 214 0.6
@face Scraps right
Scraps: I'll stay here.
Ginger: Just your feet, Scraps.
Scraps.!: I'm PAPER. | Do you know what happens to paper in hot water!?
Ginger: ...It gets soft?
Scraps: It gets SOFT, Ginger!!
@spawn Pink 260 150 down
@alpha Pink 0
@wait 0.3
@alpha Pink 0.5
@wait 0.3
@alpha Pink 1
@sfx magicsprinkle 0.4
* (Someone pink is standing on the other side of the water.)
Pink: Oh! Sorry! I'm interrupting!
Ginger: You're not. | Who are you?
Pink: Pink! | I'm not one of the seven. I'm the eighth.
Pink: There's not supposed to be an eighth. I just showed up one day at the bottom of the pot.
@walk Ginger 200 196 0.8
Ginger: ...I know what that's like.
Pink: You do?
Ginger: I only come out at Christmas. Everybody does things without me the rest of the year.
Ginger: When I come back, they're really nice to me. | But they had a whole year I wasn't in.
Pink: ...
@anim Pink pink_overjoyed_ 10 12 once
Pink: You're like me!!
@frame Pink pink_peace_sign_0
Pink: Okay! New club! We're both the eighth! | That's two people!
Ginger: ...That's two people.
* (Ginger laughs.)
@idle Pink
Pink: Don't tell Flowery I said I'm not supposed to be here. He gets SO mad. | He says nobody here is extra.
@npc Pink pinkTalk
@party on
@lead 50 214 right
* (Somebody's up on the roof.)
@trigger 280 150 30 80 balcony
@roam
# pinkTalk
Pink: Eighth Club meets whenever! Bring snacks! | I can't eat them, but I like looking at them.
Pink: Oh, and the goat boy behind the bush can come out. I can see his ears.
* (Behind the bush, a small voice says "eep.")
@end
# balcony
@sfx noise 0.4
* (Behind you, the bathwater goes black. Something's coming up out of it.)
Yatta: HEY!! THAT'S MY BATH!!!
@battle ichorSmall bath
@music flNight
Ginger: It's following us.
Scraps: ...Roof. Now.
@fade out 0.8
@room roof 160 214 up
@party Scraps
@spawn Flowery 200 160 up
@frame Flowery flowery_lookdown_upright_1
@fade in 0.8
@music flWho
* (The roof. The sunset still hasn't ended. Flowery is sitting at the edge.)
@walk Scraps 170 176 1
Flowery.calm[none]: Couldn't do the bath?
Scraps: It's water.
Flowery.smile[hah]: Ha. | Sit down. The edge doesn't bite.
@party off
@walk Scraps 180 166 0.5
@face Scraps up
Scraps: ...Can I tell you something weird?
Flowery.calm[none]: Princess, I'm a flower in a cape. Go ahead.
Scraps: Two days ago, I died.
Flowery.wide[huh]: ...You what?
Scraps: There was a machine. If we died, it brought us back. | So I came back. I counted my claws. All there.
Scraps: But we broke the machine. We had to. | So next time, there's no next time.
Scraps: And Goob's really little. He doesn't sleep unless I'm in the next room.
Scraps: If I'm gone for real... who makes his hats?
Flowery.soft[none]: ...
@frame Flowery flowery_lookdown_upright_0
Flowery.calm[none]: Before all this, I was a flower in a pot. By the shop window.
Flowery.calm[none]: I watched a kid grow up through that window. | Grew like a turnip.
Flowery.calm[none]: Then one day I woke up in here with legs. | First thing I did was run around the castle. Second thing, I fell down the stairs.
Scraps: Did it hurt?
@anim Flowery flowery_shrug_upright_shakehead_ 4 8 once
Flowery.smirk[hah]: Everything hurts when you've never had a body. | I loved it.
Flowery.calm[none]: I don't know anything about coming back, Origami.
Flowery.serious[none]: But don't go spending your next one. Look both ways. | Stop running in front of canes.
Scraps: How do you know about the cane?
Flowery.smirk[none]: I didn't. Lucky guess.
Flowery.calm[none]: And make the kid his hat.
* (Scraps scoots a little closer.)
@music stop
Flowery.calm[none]: ...Scraps.
Scraps: Yeah?
@face Flowery left
Flowery.serious[none]: Stay.
Scraps: ...What?
Flowery.serious[none]: All three of you. Stay here. | He laughed today. He wore your crown to BED.
Flowery.serious[none]: Your building's closed. Nobody's watching your show. | Here, he'd make you tea every day. And the sun never goes down. I made sure of it.
Flowery.soft[none]: I'm asking. | I'm not good at asking.
Scraps: I...
@sfx rumble 0.4
@shake 2
* (Down in the bath, something goes "plip.")
@fx ichor 0.2
Flowery.wide[huh]: ...What was that?
@sfx b 0.6
Ginger!: (from below) SCRAPS!! FLOWERY!! | THE WATER'S GONE BLACK!
@fx glitch 0.6
@flash #000
@fade out 0.6 #000
@finish
` },

/* ======================================================================= 8 */
{ id: 'ichor', title: 'Ichor in the Garden', sub: 'SEGMENT 8', place: 'The Courtyard', script: String.raw`
@party Scraps,Ginger,Yatta
@room courtyard 300 214 right
@fx ichor 0.6
@fx tint rgba(20,0,40,.25)
@music flTension
@cut ichorRise
@spawn Flowery 350 200 right
@frame Flowery flowery_powering_up_kneel_0
@fade in 0.6
* (Black ichor is coming up between the stones.)
* (There are shapes in it. Boxten's crank. Brightney's bulb. Dandy's grin.)
Yatta: ...Those are OURS.
Ginger: Same as the hall. Same as the bath. | It's from home.
Flowery.yell[huh]: What IS that!?
Scraps: When something goes wrong at our place, it leaks. | It fills up the floors.
Flowery.snarl[show_you]: In MY garden!? On the KING'S stones!?
@frame Flowery flowery_fists_0
@spawn Ink1 420 192 left
@spawn Ink2 466 212 left
@tint Ink1 #1a0828
@tint Ink2 #1a0828
@sfx noise 0.4
@shake 3
* (Two of them pull themselves up out of the black.)
@face Flowery left
Flowery.grin[take_that]: Princesses. | You take the left one. I'll take the one on the left.
Yatta: That's the SAME one!
Flowery.wink[none]: Then we'll get there faster.
@battle ichor1
@remove Ink1
@remove Ink2
@idle Flowery
@spawn Flowery 350 200 right
@spawn Ink1 410 186 left
@spawn Ink2 452 208 left
@spawn Ink3 494 190 left
@spawn Ink4 536 210 left
@tint Ink1 #1a0828
@tint Ink2 #1a0828
@tint Ink3 #1a0828
@tint Ink4 #1a0828
@fx ichor 0.75
@shake 5
* (More of them. Bigger ones.)
Ginger: There's too many...
@frame Flowery flowery_crouch_left_0
Flowery.sweat[none]: Okay. | Okay, that's a lot.
@music stop
@sfx rumble 0.7
@shake 8
Asgore: NOT IN MY GARDEN!
@spawn Asgore 150 204 right
@crown Asgore on
@anim Asgore asgore_armor_charge_verymad_ 6 14
@slide Asgore 470 204 0.55
@sfx impact 0.8
@flash #fff
@shake 10
&@jump Ink1 260
&@spin Ink1 14
&@slide Ink1 700 150 0.6
&@jump Ink2 220
&@spin Ink2 -12
&@slide Ink2 720 200 0.6
@jump Ink3 240
@remove Ink1
@remove Ink2
@remove Ink3
@flip Asgore on
@frame Asgore asgore_armor_shock_right_0
@music flAsgore
@wait 0.4
@flip Asgore off
@face Asgore left
Asgore: ...Oh! Hello again, little ones.
@frame Flowery flowery_pose_point_cooler_right_0
Flowery.beam[my_king]: MY KING!
Asgore: Flowery. I'll hold the gate. | You take care of the big one.
@face Ink4 left
@battle ichor2
@fx ichor 0.3
@remove Ink4
@room courtyard 300 214 right
@spawn Flowery 360 200 left
@spawn Asgore 470 200 left
@crown Asgore on
@fade in 0.6
@music flTension
* (The last of the shapes sinks back into the stones.)
Asgore: Is everyone all right? | Good. Good.
@frame Asgore asgore_armor_sad_down_0
Flowery.wide[wow]: You hit them. | And they BROKE.
Flowery.serious[none]: You couldn't scratch a Floradinn yesterday.
Ginger: Because that stuff's from our world. | We can't hurt things from yours.
Flowery.calm[none]: But you can hurt things from yours.
* (Flowery looks at the black stain spreading across the courtyard.)
Flowery.calm[none]: It followed you here. | Through the back door.
Scraps: We didn't know.
Flowery.calm[none]: I know you didn't.
@spawn Ralsei 160 230 right
@walk Ralsei 250 214 0.8 run
Ralsei.worry: Everyone! Are you okay!?
@face Flowery left
Flowery.squint[huh]: ...Raly. | Who let you out?
Scraps: Me.
Flowery.smirk[none]: Of course. Cats and cupboards.
Ralsei.serious: Flowery, listen. That door isn't a Fountain. | Somebody DREW it. Between two places that were never supposed to touch.
Ralsei.serious: As long as it's open, their darkness will keep coming in.
@party off
@spawn Seth 196 178 right
@spawn Aqua 172 200 right
@spawn Green 452 176 left
@spawn Orange 424 160 left
@ghost Orange
@spawn Blue 418 214 left
@spawn Yellow 470 212 left
@spawn Pink 320 158 down
@alpha Pink 0.8
@music flFlowers
* (The flowers come out into the courtyard, one by one.)
@anim Seth seth_point_ 3 8 once
Seth: It's in the road! It's in the garden! It's not on ANY list!
Yellow: Blue's flowerbed's gone. | I tried to arrest it.
@anim Blue enemy_blue_ballet_ 8 12 once
Blue: He read it its rights, dear. I watched.
@anim Aqua aqua_confused_ 2 4
Orange: I-I punched eleven of them!! | They keep coming back...
* (Green is holding a pan with a hole melted through it.)
@idle Aqua
Aqua: Uuu... is the world ending?
Seth: Aqua...
Aqua: ...Blue.
Seth: ...Okay. Today you can be Blue.
Flowery.serious[none]: How long until it reaches Gorey's room?
Seth: An hour. Maybe less.
Scraps: Then we have to go.
Flowery.wide[huh]: What?
Scraps: It came through because the door's open. Because we opened it.
Ralsei.determined: If they go back through, I can seal it behind them. | Then it's closed for good.
Flowery.calm[none]: ...And you'll be on the other side.
Scraps: ...Yeah.
* (Flowery laughs.)
Flowery.dark[none]: Of course.
Flowery.dark[none]: Everyone leaves him. His wife. His son. His other kid, with their Fountains and their secrets.
Flowery.dark[none]: And now three cartoons who made him laugh ONCE.
Flowery.calm[none]: And Raly closes the door. | Funny. You never close KRIS'S doors, little guy.
Ralsei.angry: That's not fair!
Flowery.calm[none]: No. | But it's true.
Flowery.snarl[none]: You were supposed to understand! You were KEPT, just like us!
Ginger: That's why we have to go! | Somebody's waiting for us too.
Flowery.hair2[none]: ...
@frame Flowery flowery_idle3_0
Flowery.hair3[none]: Then here's another idea.
Flowery.hair3[none]: You stay. The door stays open. | I'll hold back the ichor myself.
Yatta!: YOU CAN'T DO THAT!!!
Flowery.darkgrin[none]: Watch me, Confetti.
@frame Flowery flowery_pose_0
Flowery.serious[show_you]: Top of the castle. | If you really want to go home, come and stop me.
Flowery.serious[none]: Petals. | With me.
* (Seth closes the book. Aqua hides her knife in her sleeve. Green puts down the pan. Orange climbs up onto Green's hat.)
Blue: You can't even land a pirouette, dear.
@anim Flowery flowery_pirouette_ 8 14 once
Flowery.soft[none]: Then catch me, Blue.
Blue: ...If you fall on my flowers again, I'm letting you.
@walk Flowery 320 120 1.6
@remove Flowery
@walk Seth 320 120 1.6
@remove Seth
@walk Aqua 320 120 1.6
@remove Aqua
* (The flowers leave one at a time. Yellow tips his hat on the way past.)
Pink: ...He's not mean. He's scared. | I'll be up there too. We go where the seven go.
Ginger: I know.
@alpha Pink 0
@remove Pink
@remove Green
@remove Orange
@remove Blue
@remove Yellow
@party Scraps,Ginger,Yatta,Ralsei
@party on
@lead 320 222 up
@music stop
Yatta: ...I don't wanna fight him.
Scraps: Me neither.
Ginger: Then we don't win. | We just don't lose until he's done.
Scraps: That's still a fight, Ginger.
Ginger: I know. I'm trying to make it sound nicer.
Ralsei.sad: What he said about me and Kris's doors... | We can talk about it later. Let's get you home first.
@trigger 290 140 60 30 next
@roam
# next
@fade out 1
@finish
` },

/* ======================================================================= 9 */
{ id: 'flowery', title: 'Thank You For Watching', sub: 'SEGMENT 9', place: 'Top of Castle', script: String.raw`
@party Scraps,Ginger,Yatta,Ralsei
@room roof 160 222 up
@spawn Flowery 160 172 down
@frame Flowery flowery_idle3_0
@fx petals
@music stop
@fade in 1.5
* (The top of the castle. The sunset that never ends is ending.)
Flowery.calm[none]: So you made up your minds.
Flowery.smile[none]: And you brought Raly. | Did you bring him a hat? He looks cold.
Ralsei.pout: I'm not cold.
Flowery.smile[none]: You're a little cold.
@frame Flowery flowery_lookdown_upleft_0
Flowery.serious[none]: Listen.
Flowery.serious[none]: There were seven of us. Gold, green, orange, aqua, purple, blue, and yellow.
Flowery.serious[none]: A man grew us to ask a question. | Flowers that were only supposed to live for one smiling day.
Flowery.serious[none]: And he never let us go.
Flowery.soft[none]: His friend got sick, and we did nothing. | His money ran out, and we did nothing.
Flowery.hair1[none]: His family left him... and we did nothing.
Flowery.hair2[none]: We just sat in our pots and smiled. | Useless, pretty flowers.
* (Ginger nods.)
@frame Flowery flowery_pose_0
Flowery.serious[none]: So no. | You don't get to come in here, make him laugh, and LEAVE.
Flowery.yell[none]: Not while I've got petals left!
Flowery.yell[none]: Petals! Everybody! | Every Darkner in this kingdom!
@cut lendPower
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
* (Flowery is on his knees. His cape is torn. There are petals everywhere.)
Flowery.hair4[none]: Get up.
Scraps: You're the one on the floor.
Flowery.hair4[none]: I'm talking to myself. | Get up, Flowery. One more. You've got one more.
Ginger: You don't.
Flowery.hair2[none]: ...
Ginger: It's okay. | You did everything. We saw.
@sfx impact 0.6
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
@crown Asgore on
@walk Asgore 160 150 1.6
* (The king climbs onto the roof. He's still wearing the paper crown.)
@frame Flowery flowery_turn_shocked_more_0
Flowery.wide[nonono]: G-Gorey! | You shouldn't be up here, it's not safe—
Asgore: I saw them. | They were trying to keep it away from my room.
@frame Asgore asgore_kneel_look_up_0
Asgore: Flowery. | Look at me a moment.
@music flSad
@cut thatDay
@room roof 160 222 up
@party off
@spawn Flowery 160 184 down
@frame Flowery flowery_sad_downleft_0
@spawn Asgore 192 160 left
@crown Asgore on
@frame Asgore asgore_kneel_look_up_0
@lead 110 210 right
@walk Ginger 130 214 0.01
@walk Yatta 190 214 0.01
@walk Ralsei 90 214 0.01
@face Ralsei right
@fade in 1
Asgore: The sun hasn't moved in days. | I do own a clock, Flowery.
Flowery.tear[none]: ...You knew?
@frame Asgore asgore_kneel_0
Asgore: Mm. | The bush giggled, remember?
Flowery.weep[none]: I kept you here. | I made you watch the same sunset every day.
@frame Asgore asgore_kneel_look_up_1
Asgore: Yes. | But I stayed for the company.
@frame Asgore asgore_kneel_sad_lookdown_0
Asgore: These children need to go home. | Open the way for them, will you?
Asgore: And then... I'd like my shop back. | That pot by the window must be bone dry.
* (Flowery laughs. It comes out wet.)
Flowery.sigh[none]: ...Use the good fertilizer.
@frame Asgore asgore_kneel_look_up_0
Asgore: The blue bag. I know.
@hide Flowery
@hide Asgore
@spawn Bump 160 184 down
@anim Bump asgore_flowery_fistbump_ 3 5 once
@sfx impact 0.4
@wait 1.2
@remove Bump
@show Flowery
@show Asgore
@walk Flowery 150 196 1
@face Flowery left
Flowery.calm[none]: ...Raly.
Ralsei.nervous: Y-yes?
Flowery.calm[none]: Take them home. All the way to their door.
Ralsei.determined: I will. I promise.
Flowery.smirk[none]: And wear a hat.
Flowery.calm[none]: Origami. Cupcake. Confetti.
Flowery.soft[none]: Close your door tight. | And make your little brother that hat, Scraps.
Scraps: I will.
Flowery.calm[none]: Cupcake. | Your cookies were round. I saw.
Ginger: ...Thank you, Flowery.
Flowery.smirk[none]: And Confetti.
Yatta: YEAH!?
Flowery.grin[hah]: You're still slower than me.
Yatta!: I TOUCHED YOUR SHOULDER!!! I WON!!!
Flowery.beam[nonono]: That doesn't count!
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
* (The flowers walk you to the back door.)
Seth: I wrote you a page. Ginger decorated it. | It's the best page in the book.
Aqua: Uuu, I'm Confetti now!
Seth: Aqua...
@anim Aqua aqua_wave_ 4 8 once
Aqua: Thanks for watching my dream, Confetti Number One!
Yatta: THANKS FOR BEING IN IT, CONFETTI NUMBER TWO!!!
Orange: W-was I brave? | You'll say I was brave, right?
Ginger: You were very brave.
Orange: Th-thanks for watching my dream.
* (Green hands Ginger a perfectly round cookie with "YOURS" written on it in icing.)
* (Thank you for watching their dream.)
@anim Yellow yellow_cool_point_raise_ 5 10 once
Yellow: Thanks fer watchin' my dream. | It was an honor to wrongly accuse y'all.
@anim Blue enemy_blue_ballet_ 8 12 once
Blue: Come back when you can dance, dears. | Or don't, and come back anyway. Adieu!
@anim Pink pink_overjoyed_ 6 10 once
Pink: Eighth Club forever!
Ginger: Eighth Club forever.
@walk Flowery 400 214 1.2
@face Flowery left
* (Flowery has his torn cape back on. He's standing so the rip doesn't show.)
Flowery.calm[none]: Well, Princesses. | Thank you for watching my dream.
Scraps: It was a good show.
Flowery.smile[hah]: Of course it was. I was in it.
@voice goodbye Goodbye!
@spawn Locker 300 200 down
@frame Locker dw_ralseicupboard_0
@ghost Locker
@walk Ralsei 300 214 0.8
@face Ralsei left
* (Behind the cupboard doors is a long dark hallway. At the end, there's a vent grate.)
Ralsei.smile: The back door. Flowery kept it in the cupboard. With me.
Ralsei.determined: Stay close. Don't look at the walls too long.
@sfx magicsprinkle 0.5
@flash
@cut doorHome
@room gardenview 160 200 down
@party on
@lead 160 200 down
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
* (The vent grate is open. Ralsei is crouched just inside it.)
Ralsei.smile: This is as far as I go. | If I come out, the door can't close.
Ralsei.calm: Scraps. You drew it open. | I think you can draw it closed.
Scraps: How?
Ralsei.smile: The same way you drew it the first time. Don't think about it too hard.
@sfx scissorbell 0.6
* (Scraps draws one line across the little flower on the grate.)
Ralsei.happy: There. | Goodbye, everyone!
Ralsei.content: Tell your friends somebody in another world is rooting for them.
Yatta!: BYE RALSEI!!! YOU'RE THE BEST CUPBOARD WE EVER OPENED!!!
Ralsei.blush: ...Thank you?
@sfx doorclose 0.6
@remove Ralsei
* (The grate clicks shut. Behind it, there's just a vent. And a candy stash that is NOT a candy stash.)
@walk Yatta 120 196 0.6
@walk Ginger 200 206 0.6
Yatta: ...Did that happen?
Ginger: I have a cookie that says "YOURS." | So I think it did.
@walk Scraps 160 170 1
@face Scraps up
* (Scraps walks over to the CLOSED sheet. She gives the little flower a smile.)
* (Then she gives it a hat with ears.)
Ginger: ...You gave it a hat.
Scraps: Hats with ears fix things.
@face Scraps down
Scraps: C'mon. Goob's gonna wake up soon.
@fade out 2
@cut credits
@end
` }
);
