/* flowery-story.js - "Flower Kingdom", the script. Ten segments, played in order on the overworld (js/flowery-world.js).
   Set the night after Main Story Chapter 3 (July 11, 2002): the reprinting machine is broken, so a Toon who dies now stays dead.
   Grammar: see the comment above `parse` in flowery-world.js. " | " breaks a line inside one textbox.
   Voices follow Chapter 5's own text: Flowery (puns, "Princess", "Gorey"), Aqua ("Uuu"), Seth (nervous rule-keeper),
   Orange (trying very hard to be brave), Yellow (cowboy), Blue (love, "dear", "adieu"), Green (never speaks; narrated). */
'use strict';

const FL_STORY = [

/* ======================================================================= 1 */
{ id: 'door', title: 'Wrong Door', sub: 'SEGMENT 1', place: 'Gardenview Lobby', script: String.raw`
@party Scraps,Ginger,Yatta
@room gardenview 70 200 right
@fade out 0.01
@music flHome
@card Wrong Door|JULY 11, 2002 · 2:14 AM
* (The night after the machine stopped.)
* (Somebody drew a little flower on the CLOSED sheet over the sign. It isn't smiling.)
@fade in 1.2
@party off
@lead 70 200 right
@walk Ginger 120 196 1.2
@face Ginger left
Ginger: ...Scraps? You're still up?
@walk Scraps 90 204 0.8
@face Scraps right
Scraps: I'm making Goob a hat.
Ginger: Now?
Scraps: Bassie said he cried the whole time I was gone. | So he's getting a hat. With ears.
Ginger: ...That's nice.
Ginger: I can't sleep either. It's July. | I'm not supposed to be awake in July.
Scraps: Want to help? You're good at decorating.
Ginger: I... sure.
@shake 3
@sfx hit_light 0.3
* (Something bangs inside the ceiling.)
Scraps.!: Hsss!
Ginger: ...The vents.
@spawn Yatta 250 150 down
@jump Yatta 220
@walk Yatta 230 200 0.4
@shake 4
Yatta!: GUYS!!!
Yatta!: GUYS GUYS GUYS GUYS!!!
Scraps: Yatta, it's two in the morning.
Yatta: I FOUND A DOOR!!!
Ginger: In the vents?
Yatta: BEHIND MY WINTER STORAGE!! | WHICH IS NOT CANDY!!!
Yatta: AND IT'S GOT A FLOWER ON IT!! THE SAME ONE AS THE SIGN!!
@emote Scraps !
@wait 0.6
@emote Scraps off
Scraps: ...I drew that flower.
Ginger: You did?
Scraps: Yesterday. Everybody was crying about Shelly, and I didn't know what to do, so I drew.
Scraps: It came out sad.
Yatta: WELL NOW IT'S A DOOR!!
Ginger: We should wake up Tisha. Or Rodger.
Scraps: ...
Scraps: Let's just look first.
Ginger: Scraps, nobody comes back anymore.
Scraps: I know. I'll be careful.
Yatta: SHE SAID CAREFUL!! WE'RE GOING!!
@choice Follow Yatta|Follow Yatta carefully
@if choice=2 careful
@goto go
# careful
Ginger: ...Carefully. Okay.
@goto go
# go
@fade out 0.8
@card The Vents|2:31 AM
@cut door
@room cliffs 70 172 right
@party on
@lead 70 172 right
@cut fall
` },

/* ======================================================================= 2 */
{ id: 'petals', title: 'Petals Mean Something', sub: 'SEGMENT 2', place: 'The Cliffs', script: String.raw`
@party Scraps,Ginger,Yatta
@room cliffs 70 172 right
@music flCliffs
@fade in 1.5
@party off
* (The sky is the color of a peach somebody bit into.)
@walk Yatta 130 166 0.6
@jump Yatta 200
Yatta!: IT'S SUNSET!!! IT WAS NIGHT!!!
@walk Ginger 100 182 1.2
Ginger: Where... are we?
Scraps: Not Gardenview.
Yatta: I LOVE IT!!!
@party on
@lead 130 170 right
@sign 120 140 scare dw_scarecrow_not_enemy_sign_0
@sign 300 160 savept savepoint
@trigger 600 120 40 90 toGarden
@roam [Z] Talk
# savept
@call save
@end
# scare
* (A sign. It says "NOT AN ENEMY.")
Yatta: OKAY!!
@end
# toGarden
@fade out 0.6
@room garden 60 200 right
@fade in 0.6
* (Every flower in the garden turns to look at you.)
Ginger: ...They're watching us.
Scraps: Flowers do that. They follow the sun.
Ginger: There's no sun, Scraps.
Scraps: ...
@sign 250 176 lockerKnock dw_ralseicupboard_0
@trigger 380 120 60 160 meet
@roam
# lockerKnock
@if metLocker lockerAgain
@sfx knock 0.6
* (It's a cupboard. Somebody put it in the middle of the garden.)
@sfx knock 0.6
* (Something inside knocks back.)
Yatta!: HELLO?!
Locker: Oh! Oh, thank goodness! | Um, could you open the door? The handle's on your side.
* (It's locked. There's a golden flower painted over the keyhole.)
Ginger: It's locked... We'll come back. I promise.
Locker: That's okay! I'll... be here!
@flag metLocker
@end
# lockerAgain
@sfx knock 0.4
Locker: Still here!
@end
# meet
@party off
@spawn Floradinn 470 200 left
@spawn Floradinn2 500 222 left
@sfx b 0.5
@emote Floradinn !
@emote Floradinn2 !
@wait 0.5
@emote Floradinn off
@emote Floradinn2 off
* (Two sunflowers with big swords jump out of a bush.)
Floradinn: HALT! Who goes there!?
Yatta: YATTA GOES THERE!!!
Floradinn: You're not on the list!
Floradinn: Today is the king's perfect day! There's no room for strangers on a perfect day!
Ginger: We're just lost...
Floradinn: Then get MORE lost! En garde!
Scraps.!: Hsssss!
@battle floradinn
@remove Floradinn
@remove Floradinn2
@party off
@lead 360 206 right
@walk Ginger 340 196 0.01
@walk Yatta 336 218 0.01
@spawn Flowery 420 196 left
@frame Flowery flowery_pose_point_cooler_0
@music flFlowery
* (The Floradinns are somewhere at the bottom of the cliff now.)
Yatta: ...ow.
Scraps: I hit it SO hard. It said "one."
Flowery.grin[hah]: Heh. Sunflowers. All stem, no style.
@frame Flowery flowery_idle_0
Scraps: ...Who are YOU?
@anim Flowery flowery_teethshine_ 6 12 once
@sfx great_shine 0.3
@frame Flowery flowery_pose_0
Flowery.cheer[itsme]: Howdy. | The name's Flowery.
Flowery.smile[none]: Star sign: the Flower. Golden eyes. Best friend to a king.
Flowery.smile[none]: And you three must be...
@walk Flowery 400 200 0.6
@face Flowery left
@voice kris Kris!
@music flWho
Flowery.wide[none]: ...
Flowery.look[huh]: Huh.
Flowery.side[none]: You're not Kris.
Ginger: ...Who's Kris?
Flowery.calm[none]: The king's kid. | I left the back door open for them.
Flowery.plain[none]: And instead I got... you.
Yatta: WE CAME FROM THE VENTS!!!
Flowery.squint[none]: The vents.
@walk Flowery 380 200 0.8
* (He walks a slow circle around you.)
Flowery.side[hoo]: Well, aren't you three a strange bouquet.
Flowery.side[none]: Everything in this kingdom is made of little squares. You three are... not.
Scraps: ...Thanks?
Ginger: We're from a TV show.
Flowery.soft[none]: A show, huh.
@frame Flowery flowery_pose_0
@anim Flowery flowery_clap_ 4 10 once
Flowery.beam[thats_great]: Well! Any friend of the vents is a friend of mine.
Flowery.smile[none]: Don't worry, Princesses. I'll get you home. | The back door just needs a little time.
Ginger: ...Princesses?
Flowery.wink[none]: It suits you.
@anim Flowery flowery_condescend_ 7 10 once
Flowery.smirk[none]: You're Cupcake. You're Origami. And you're Confetti.
Yatta: I'M CONFETTI!!!
Scraps: I'm paper. I CUT. Origami is folding.
Flowery.grin[none]: Then I'll keep my petals away from you, Origami.
Ginger: Um... there's somebody in that cupboard.
Flowery.wide[none]: That? | That's art. It knocks.
Scraps: It said "thank goodness."
@anim Flowery flowery_shrug_spin_ 4 10 once
Flowery.smile[none]: Very interactive art. | Now, let's make like a tree and have some fun!
@frame Flowery off
@face Flowery right
@walk Flowery 800 200 2.2
@remove Flowery
@party on
@lead 360 206 right
Scraps: ...I don't like him.
Yatta: I LOVE HIM!!!
Ginger: He was waiting for somebody else.
Scraps: Yeah. | He looked at us like we were the wrong present.
@trigger 760 120 40 160 next
@roam
# next
@fade out 0.6
@finish
# save
@sfx save 0.6
* (Every flower in sight turns to look at you.)
* (The power of being looked at shines within you.)
* (HP fully restored. Progress saved.)
@saved
` },

/* ======================================================================= 3 */
{ id: 'tour', title: 'Tour Guide', sub: 'SEGMENT 3', place: 'The Cliff Road', script: String.raw`
@party Scraps,Ginger,Yatta
@room road 30 172 right
@music flCliffs
@spawn Flowery 130 160 right
@cut castle
@npc Flowery flTalk
@anim Flowery flowery_jacket_flutter_ 5 8 once
Flowery.cheer[hey_guys]: Behold! Flower Castle!
Flowery.smile[none]: Built by a dream. Decorated by me.
Yatta: CAN WE GO IN?!
Flowery.smile[none]: Of course, Confetti. Right behind me.
@trigger 260 120 40 90 puzzle
@roam
# flTalk
Flowery.smile: Need something, Princess?
@choice Ask about Kris|Ask about him|Nothing
@if choice=1 askKris
@if choice=2 askHim
Flowery.wink: Just wanted to look at me? Understandable.
@end
# askKris
Flowery.calm: Kris? | They grew up like a turnip. I watched the whole thing from a pot.
Flowery.calm[none]: Good kid. Quiet. | Their dad worries about them more than they know.
@end
# askHim
Flowery.beam: Me? I'm one of seven flowers. | We were part of a very important question, once.
Flowery.smile[none]: The answer was "yes." For a while.
@end
# puzzle
@party off
@unnpc Flowery
@switches 330 176 26 #ffd23a,#ff7ab0,#7ff07f,#7f9bff,#c49bff 1,3,0,4,2 solved fumble
@sign 300 140 hint npc_sign_0
* (Five colored plates are set into the road. A gate blocks the way.)
Scraps: A puzzle.
Ginger: I'm bad at puzzles...
Yatta: I'M GREAT AT PUZZLES!! I JUST STAND ON ALL OF THEM!!
@walk Flowery 280 186 0.6
@face Flowery right
Flowery.smirk[hah]: Go on, then. I'll supervise.
@party on
@lead 300 186 right
@npc Flowery flPuzzle
@roam Step on the plates in order
# hint
* (A sign.)
* ("Pink sun rises. The sky goes blue. The gold petals fall. The purple dusk comes. Green grass grows over everything.")
@end
# flPuzzle
Flowery.smile: Read the sign, Princess. Signs are very polite. They tell you things.
@end
# fumble
@party off
@walk Flowery 300 176 0.5
Flowery.smirk[hah]: Okay, okay. Step aside. | This calls for a professional.
@music flSkate
@frame Flowery flowery_skateboard_0
@sfx wing 0.5
@slide Flowery 470 176 0.6
@sfx select 0.5
@sfx great_shine 0.5
@frame Flowery flowery_pose_point_cooler_0
@music flFlowery
* (Every plate lights up at once.)
Flowery.grin[yes]: Solved.
Scraps: That's not solving it. You just skated over it.
Flowery.smile[none]: The puzzle never said "no skateboards."
@goto after
# solved
@party off
@walk Flowery 300 176 0.5
Flowery.wide[wow]: Oh! You solved it.
Flowery.ugh[none]: I was going to skateboard on it. I brought the board and everything.
@frame Flowery flowery_skateboard_0
Flowery.sweat[none]: ...I'm skating to the gate anyway.
@music flSkate
@slide Flowery 470 176 0.6
@music flFlowery
@frame Flowery flowery_pose_point_cooler_0
@goto after
# after
@sfx impact 0.5
* (Somewhere ahead, a gate opens.)
Yatta!: TEACH ME TO DO THAT!!!
Flowery.wink[none]: Can't. You need hair like this.
Flowery.smirk[none]: But I CAN show you my voice lines.
Scraps: Your what?
@frame Flowery flowery_pose_r_0
@voice sanfrandisco Here I come, Sanfrandisco!
@wait 0.4
@frame Flowery flowery_pose_point_cooler_0
@voice my_jarona My Jarona!
@wait 0.4
@frame Flowery flowery_kiss_2
@voice try_flavor Try my flavor!
@wait 0.4
@frame Flowery flowery_pose_0
@voice best_friend Your dad's my best friend!
@frame Flowery flowery_idle_0
Flowery.ugh[none]: ...Wrong audience for that one.
Ginger: Where is that coming from?
Flowery.smile[none]: Me. I'm just like this.
Yatta!: I WANT VOICE LINES!!!
Flowery.grin[none]: Confetti, you ARE a voice line.
@frame Flowery off
@party on
@lead 470 180 right
@trigger 700 120 40 90 sethaqua
@npc Flowery flTalk
@roam
# sethaqua
@party off
@unnpc Flowery
@spawn Seth 800 165 left
@spawn Aqua 830 180 left
@walk Flowery 690 170 0.6
@face Flowery right
* (Somebody in a purple hood is reading on the road. Next to them, a girl with a red bow is spinning a knife.)
@anim Aqua aqua_spin_ 4 10
Aqua: Uuu, Seth! Look how fast it goes!
@idle Aqua
Seth: Aqua, please, not near the edge!
Flowery.cheer[hey_guys]: Seth! Aqua! My little buds!
@face Seth left
Seth: Flowery! Who are— | Who are THEY?
Flowery.smile[none]: New friends. They came in through the back door.
Seth: ...The back door. | The one we were supposed to watch. For Kris.
Flowery.smile[none]: For anybody, Seth.
Seth: ...Right. Anybody.
@anim Aqua aqua_wave_ 4 8 once
Aqua: Uuu, new friends! I'm Blue!
Seth: You're Aqua.
Aqua: Blue's a better name.
Seth: Blue is a different PERSON.
Aqua: Then I'm Seth!
Seth: You can't be Seth! I'M Seth!
Yatta!: I'M CONFETTI!!!
Aqua: Uuu! Can I be Confetti too?
Yatta!: YES!!! WE'RE BOTH CONFETTI!!!
@anim Seth seth_facepalm_down_ 2 4 once
Seth: No... no, no, no. You can't just make friends with them! | They're not on the list!
Scraps: What list?
Seth: The list! Who gets to be in the garden. What the king eats. What he's allowed to see today. | You're not in it! Any of it!
Ginger: ...We could write ourselves in? | I'm good at making things look nice.
Seth: ...
Seth: ...You'd do that?
* (Seth hands Ginger a pen. Very slowly.)
@anim Aqua aqua_clapping_ 4 10 once
Aqua: Uuu, Seth's face is red!
@anim Seth seth_glasses_shiny_ 8 12 once
Seth: It is NOT!
@anim Flowery flowery_clap_ 4 10 once
Flowery.grin[hah]: Wonderful! Everybody's friends! | Seth, make sure Gorey's breakfast is perfect.
Seth: It's three in the afternoon.
Flowery.wink[none]: Then make it a perfect three in the afternoon. Adieu!
@walk Flowery 900 170 1.4
@remove Flowery
@walk Seth 760 172 0.5
@face Seth left
Seth: H-hey. Paper one.
Scraps: Scraps.
Seth: Scraps. | Flowery's nice. He's really nice. He'd do anything for the king.
Seth: ...Anything.
@walk Seth 900 170 1.2
@remove Seth
@walk Aqua 900 190 0.9
@remove Aqua
@party on
@lead 700 170 right
Ginger: That sounded like a warning.
Scraps: It was a warning in a nice hat.
@trigger 860 120 40 90 next
@roam
# next
@fade out 0.6
@finish
` },

/* ======================================================================= 4 */
{ id: 'cafe', title: 'One Dollar More', sub: 'SEGMENT 4', place: 'Flower Castle · Cafe', script: String.raw`
@party Scraps,Ginger,Yatta
@room cafe 40 210 right
@music flShop
@fade in 0.8
@spawn Green 270 168 down
@spawn Orange 270 132 down
@ghost Orange
@spawn Flowery 90 165 right
* (A cafe inside the castle. It smells like butter.)
* (A tall green chef stands behind the counter. A small orange mouse stands on the chef's hat.)
@music flOrange
Flowery.cheer[hey_guys]: Green! Orange! Meet my new friends!
Orange: Wh-who are THEY!?
Orange: I-I'm not scared of them! I'm EXTRA now! I'm SUPER!
Yatta!: HI!!! I'M CONFETTI!!!
Orange.!: AAAH!!
* (Orange hides behind the chef's hat.)
Flowery.smile[none]: My little sister. She's very brave.
Orange: I AM very brave!!
@music flShop
@anim Green enemy_green_wave_ 4 8 once
* (Green waves at you.)
@npc Green greenTalk
@npc Orange orangeTalk
@npc Flowery flTalk
@sign 22 176 cafeLocker dw_ralseicupboard_0
@roam
# cafeLocker
* (It's the cupboard from the garden. Somebody moved it here and put a doily on it.)
@sfx knock 0.5
Locker: Hello again!
Orange: D-don't open that! Big brother says it's a "surprise for later"!
@end
# greenTalk
@if baked greenAfter
* (Green points at the oven. Then at Ginger.)
Ginger: Me? | Oh, no... my cookies are...
Ginger: Goob said they don't taste like Cosmo's. He was being nice about it.
* (Green holds out a second apron.)
Ginger: ...Okay. I'll try.
@party off
@walk Ginger 250 190 1
@face Ginger up
@walk Green 260 172 0.4
@fade out 0.6
* (Time passes. It smells like vanilla. Then like smoke. Then like vanilla again.)
* (Green never says anything. Green just moves Ginger's hands a little slower, and nods.)
@fade in 0.6
@frame Green green_pleased_0
Ginger: They came out... round!
Ginger: Scraps! They're ROUND!
@spawn Cake 250 200 down
@frame Cake green_cake_0
Scraps: You decorated them like flowers.
Ginger: Seven colors. | I didn't even mean to.
@anim Green green_gesture_ 2 4 once
* (Green pats Ginger on the head.)
* (Green wanted to be a chef, and know the flavor of many things.)
@flag baked
@party on
@idle Green
@lead 200 200 right
@end
# greenAfter
* (Green gives you a thumbs up.)
@end
# orangeTalk
Orange: Wh-what do you want!?
@choice Ask about the shop|Ask about Flowery
@if choice=2 orangeFl
Orange: It's Green's shop! Everything costs one dollar more than the other shop!
Scraps: Why?
Orange: B-because... because it's BETTER!
Orange: ...It's the same stuff. | Don't tell Green!
@end
# orangeFl
Orange: Big brother is the strongest! He protects everybody!
Orange: ...I want to be strong like him. | Then I can protect him too.
@end
# flTalk
@if baked flAfter
Flowery.smile: Try Green's cooking, Princess. | Green doesn't talk. Green listens.
@end
# flAfter
@party off
@walk Flowery 120 200 0.6
@face Flowery right
Flowery.calm[none]: Cupcake. Got a minute?
@walk Ginger 150 200 0.6
@face Ginger left
Flowery.calm[none]: The other two. Do they go everywhere you go?
Ginger: ...No. I'm a Holiday Toon. I'm only around at Christmas.
Ginger: The rest of the year I'm just... put away.
Flowery.serious[none]: Put away until you're useful.
Ginger: That's... not how Bobette would say it.
Flowery.soft[none]: Did somebody send you, Cupcake? | Through the back door?
Ginger: No. | Nobody tells us where to go anymore.
* (Flowery looks at her for a while.)
@frame Flowery flowery_pose_0
Flowery.beam[hah]: Ha! Of course not. You couldn't spy on a sandwich.
Flowery.smile[none]: C'mon. There's someone you should meet.
Ginger: Who?
Flowery.smile[none]: The king. | He doesn't know it yet.
@frame Flowery off
@party on
@lead 150 200 right
@trigger 360 140 40 90 next
@roam
# next
@fade out 0.6
@finish
` },

/* ======================================================================= 5 */
{ id: 'trial', title: 'The Case of the Trampled Bed', sub: 'SEGMENT 5', place: 'Flower Castle · West Wing', script: String.raw`
@party Scraps,Ginger,Yatta
@room hall 30 200 right
@music flAsgore
@fade in 0.8
@spawn Flowery 80 186 right
* (The west wing. Three doors: blue, yellow, orange.)
* (The little flowerbed by the blue door has been stepped on.)
@trigger 230 150 60 80 crime
@roam
# crime
@party off
@spawn Yellow 330 190 left
@sfx b 0.5
@frame Yellow yellow_point_left_0
@music flYellow
@anim Yellow yellow_cool_point_raise_ 5 10 once
Yellow!: FREEZE, varmints!
@shake 3
* (A flower in a cowboy hat steps out of the yellow door, pointing a gun.)
Yatta!: I'M FROZEN!!!
Yellow: Somebody trampled Blue's flowerbed. | And there ain't no trampling in my town.
Scraps: It's a castle.
Yellow: ...Castle-town.
@spawn Blue 180 150 down
@walk Blue 200 186 0.8
@anim Blue enemy_blue_ballet_ 8 12 once
@frame Blue blue_poses_0
Blue: Oh, Yellow, dear. You found them.
Blue: Three strangers, right next to my poor flowers. | How tragic.
Flowery.squint[none]: Blue.
Blue: Flowery. | You're standing in my light.
@anim Flowery flowery_teethshine_ 6 12 once
Flowery.smirk[hoo]: I AM the light, Blue.
* (They stare at each other like two cats on a fence.)
Yellow: Order! This here court is now in session!
Ginger: Court?
Yellow: Every crime gets a fair trial! I'm the judge, the sheriff, and the jury.
Scraps: That's not fair.
Yellow: ...It's a little fair.
@frame Yellow yellow_cool_stance_0
@call trial
# trial
Yellow: Here's the evidence, y'all. The footprints are small. | And they're shaped like a little shoe.
Yellow: So who wears little shoes?
Yatta: I'M BAREFOOT!!!
Scraps: Paws.
Ginger: ...Tights.
Yellow: Hmmmm.
@choice Point at Blue|Point at Flowery|Point at Yellow
@if choice=2 blameFl
@if choice=3 blameYellow
Scraps: Her. Dancers wear little shoes.
Blue.wide: How DARE you. These are slippers, dear.
Yellow: Slippers ain't shoes. Objection overruled. | Try again, partner.
@goto trial
# blameYellow
Scraps: You. You're wearing boots.
Yellow: ...
@frame Yellow yellow_depressed_0
Yellow: Then justice says... | I gotta punish myself.
@frame Yellow yellow_kneelsad_0
Ginger: No, no! They're cowboy boots! They're too big!
Yellow: ...They are too big.
Yellow: Thank ya kindly, ma'am. | Objection... sustained.
@frame Yellow yellow_cool_stance_0
@goto trial
# blameFl
Scraps: Flowery.
Flowery.wide[huh]: Me?!
Scraps: You walked right past the bed. You've got dancing shoes. | And there's blue dirt on your heel.
* (Everybody looks at Flowery's heel. There's blue dirt on it.)
Flowery.sweat[nonono]: That's— | That's from a PIROUETTE. For practice.
Blue.sly: On my flowers.
Flowery.ugh[none]: NEAR your flowers.
Blue.cross: You never could land it.
Flowery.snarl[show_you]: I land it EVERY time!
@anim Flowery flowery_pirouette_ 8 16 once
@frame Flowery flowery_hurt_0
@shake 2
@sfx pirouette 0.5
* (Flowery pirouettes. He doesn't land it.)
@frame Flowery off
Yellow: This court finds Flowery GUILTY. | Of tramplin'. And of not landin' it.
@frame Yellow yellow_shoot_0
@sfx bump 0.5
* (Yellow fires. A blue flower pops out of the barrel and lands in Flowery's hair.)
Yellow: ...It always does that.
@anim Blue blue_laugh_ 2 4 once
Blue.soft: I fill it every morning, dear. | I'd rather you shoot something pretty.
* (Yellow's face goes red under his hat.)
Yatta: THAT WAS THE BEST COURT EVER!!!
@frame Flowery off
@walk Flowery 120 196 0.5
@face Flowery right
Flowery.smirk[hoo]: Origami. You've got sharp eyes.
Scraps: I'm paper. It's the edges.
Flowery.calm[none]: Most people look at the hair and stop.
Flowery.smile[none]: You don't.
Scraps: ...Since I got back, I look at everybody.
Flowery.side[none]: Got back from where?
Scraps: Somewhere you don't come back from anymore. | So I look. In case it's the last time.
* (Flowery doesn't say anything. He looks at his blue-dirt shoe.)
@music flAsgore
@party on
@lead 160 200 right
@npc Blue blueTalk
@npc Yellow yellowTalk
@trigger 520 150 40 90 next
@roam
# blueTalk
Blue.soft: Flowers are messengers of love, dear.
Blue.sly: Ask Flowery how long he's been "fine." It's a fun number.
@end
# yellowTalk
Yellow: If y'all ever need justice, just holler. | I'll probably shoot a flower at it.
@end
# next
@fade out 0.6
@finish
` }
];
