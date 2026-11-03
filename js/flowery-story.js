/* flowery-story.js - "Flower Kingdom", the script. Ten segments, played in order on the overworld (js/flowery-world.js).
   Set the night after Main Story Chapter 3 (July 11, 2002): the reprinting machine is broken, so a Toon who dies now stays dead.
   Grammar: see the comment above `parse` in flowery-world.js. " | " breaks a line inside one textbox. */
'use strict';

const FL_STORY = [

/* ======================================================================= 1 */
{ id: 'door', title: 'Wrong Door', sub: 'SEGMENT 1', place: 'Gardenview Lobby', script: String.raw`
@party Scraps,Ginger,Yatta
@room gardenview 70 200 right
@fade out 0.01
@music flHome
@card Wrong Door|JULY 11, 2002 · 2:14 AM
* The night after the machine stopped.
* Somebody drew a little flower on the CLOSED sheet over the sign. It isn't smiling.
@fade in 1.2
@party off
@lead 70 200 right
@walk Ginger 120 196 1.2
@face Ginger left
Ginger: ...Scraps? You're still up.
@walk Scraps 90 204 0.8
@face Scraps right
Scraps: I'm making Goob a hat.
Ginger: At two in the morning?
Scraps: Bassie said he cried the whole time I was gone. The whole time. | So he's getting a hat. It's got ears. Hats with ears fix things.
Ginger: Oh. | ...I can't sleep either. It's July. I'm not... supposed to be awake in July.
Scraps: Do you get, like, holiday-lag?
Ginger: Something like that. Everything smells like sunscreen and nobody wants cookies.
Scraps: I'd want cookies.
Ginger: Mine are bad, Scraps.
Scraps: I'd still want them.
@shake 3
@sfx hit_light 0.3
* Something bangs inside the ceiling. Twice. Then it scrapes along the whole length of the room, excited about something.
Scraps.!: Hsss! | ...It's the vents.
Ginger: It's... always the vents.
@spawn Yatta 250 150 down
@jump Yatta 220
@walk Yatta 230 200 0.4
@shake 4
Yatta!: GUYS!!! GUYS GUYS GUYS!!!
Yatta: I FOUND A DOOR!!!
Scraps: Yatta, it's two in the morning.
Yatta: I KNOW!!! The BEST doors are at TWO IN THE MORNING!!!
Ginger: Yatta... what were you doing in the vents?
Yatta: Checking my WINTER STORAGE!! Which is NOT candy!! It's a STRATEGIC RESERVE!!
Yatta: And then behind the reserve there was a DOOR, and the door had a FLOWER on it!! | Like the one on the sign!! But in DOOR!!
@emote Scraps !
@wait 0.6
@emote Scraps off
Scraps: ...The sign flower?
Yatta: YES!!
Scraps: I drew that flower.
Ginger: You did?
Scraps: Yesterday. When everybody was crying about Shelly. I didn't know what to do with my paws, so I drew. | I drew it sad. It came out sad.
Yatta: WELL NOW IT'S A DOOR!!
* The building creaks somewhere upstairs. It's been doing that all week.
Ginger: We should tell Tisha. Or Rodger.
Scraps: Rodger's asleep on a filing cabinet. Tisha cried until three yesterday.
Scraps: ...We could just look.
Ginger: Scraps, nobody comes back anymore. If something happens...
Scraps: I know. | I'll be a little careful.
Yatta: SHE SAID THE CAREFUL THING!! We're GOING!!
@choice Follow Yatta|Follow Yatta (carefully)
@if choice=2 careful
@goto go
# careful
Ginger: ...Carefully. | Okay. Carefully.
@goto go
# go
@fade out 0.8
@card The Vents|2:31 AM
@cut door
@room cliffs 70 172 right
@party on
@lead 70 172 right
@fade out 0.01
@cut fall
` },

/* ======================================================================= 2 */
{ id: 'petals', title: 'Petals Mean Something', sub: 'SEGMENT 2', place: 'The Cliffs', script: String.raw`
@party Scraps,Ginger,Yatta
@room cliffs 70 172 right
@music flCliffs
@fade in 1.5
@party off
@frame Scraps off
* The sky is the color of a peach somebody bit into. Everything else is made of very small squares.
@walk Yatta 130 166 0.6
@jump Yatta 200
Yatta!: WHOAAAA!!! IT'S SUNSET!!! IT WAS NIGHT!!! I LOVE TIME ZONES!!
@walk Ginger 100 182 1.2
Ginger: Everything's so... sharp.
Scraps: Pointy. Everything's got corners.
@face Scraps down
Scraps: ...We don't, though. Look at us. We look like stickers somebody put on a placemat.
Ginger: Is that bad?
Scraps: I don't know. It feels rude. Like showing up to a costume party in a costume.
Yatta: I LOOK AMAZING!!!
@party on
@lead 130 170 right
* (You can walk now. Look around. The way forward is east.)
@sign 120 140 scare dw_scarecrow_not_enemy_sign_0
@trigger 600 120 40 90 toGarden
@roam Walk with the arrows · Z to talk
# scare
* "NOT AN ENEMY." The sign is very sure about that.
Yatta: I BELIEVE YOU, SIGN!!
# toGarden
@fade out 0.6
@room garden 40 214 right
@fade in 0.6
* A garden where the trees grow in tidy blocks. Every flower in it is turned toward you. You check behind you. Nope. You.
Ginger: ...They're watching us.
Scraps: Flowers do that. They watch the sun.
Ginger: It's not sunny, Scraps.
Scraps: ...I really wish you hadn't said that. Somebody said that to Veronica once and it went bad.
@sign 250 176 lockerKnock dw_ralseicupboard_0
@trigger 380 120 60 160 meet
@roam
# lockerKnock
@if metLocker lockerAgain
@sfx knock 0.6
* It's a cupboard. Somebody has planted it in the middle of the garden, like a tree.
@wait 0.4
@sfx knock 0.6
* ...Something inside knocks back. Politely.
Yatta!: HELLO?!
Locker: H-hello?! Oh, thank goodness! Could you possibly— | the handle's on your side—
* You try the handle. It's locked. There's a little golden flower painted over the keyhole.
Ginger: It's locked. We'll... we'll find somebody. We'll come back. I promise.
Locker: ...Okay. I'll, um. I'll be here. Obviously.
@flag metLocker
@end
# lockerAgain
@sfx knock 0.4
Locker: Still here! Don't worry about me! I'm very comfortable! | ...I'm not, actually. But don't worry about me!
@end
# meet
@party off
@spawn Floradinn 470 200 left
@spawn Floradinn2 500 222 left
@sfx ui_alert 0.4
@emote Floradinn !
@emote Floradinn2 !
@wait 0.5
@emote Floradinn off
@emote Floradinn2 off
* Two little sunflower knights hop out of a bush with swords that are much bigger than they need to be.
Floradinn: Halt, strange ones! You are not ON the list!
Yatta: There's a LIST?!
Floradinn: Everyone is on the list. The list is everyone. You are not everyone.
Scraps: I'm somebody, though.
Floradinn: That is precisely the problem!
Ginger: We're only lost. We'll go. We'll go right now.
Floradinn: Too late! The king must have a PERFECT day! There can be no stray anybodies on a perfect day!
Floradinn: En garde, smooth ones!
Scraps.!: Hsssss!
@battle floradinn
@remove Floradinn
@remove Floradinn2
@party off
@lead 360 206 right
@walk Ginger 340 196 0.01
@walk Yatta 336 218 0.01
@frame Scraps off
@spawn Flowery 420 196 left
@frame Flowery flowery_pose_point_cooler_0
@music flFlowery
* The Floradinns are somewhere far below the cliff now. Their swords are still up here.
Yatta: ...ow. | ow ow ow. Ow.
Scraps: Why didn't it HURT them. I hit it. I hit it SO hard.
Ginger: You did. It said "one."
Flowery.grin: ...and THAT'S how you treat a Floradinn, princesses.
@frame Flowery flowery_idle_0
Flowery.smirk: You were hitting them like you were afraid to dent them. | They're SUNFLOWERS. They have stems. Show the stem who's boss.
Scraps: ...Who are YOU?
@anim Flowery flowery_teethshine_ 6 12 once
@sfx magiccircle 0.3
@frame Flowery flowery_pose_0
Flowery.cheer: Who am I? WHO AM I?! | Petals, did you hear that? They don't know.
* (There are no petals around. He seems to be talking to himself.)
@frame Flowery flowery_idle_0
Flowery.smile: I'm Flowery. The Flower Kingdom's finest, freshest, most photogenic bloom. Level Ninety-Nine. Best friend to a king.
Flowery.smile: And you three are... | ...
@walk Flowery 400 200 0.6
@face Flowery left
@voice kris Kris!
@music flWho
Flowery.wide: ...
Flowery.look: Huh.
Flowery.side: You're not Kris.
Ginger: ...Who's Kris?
Flowery.calm: Nobody you'd know. Tall kid, hair like a curtain somebody gave up on. | They came in the front door yesterday, and I was SURE they'd come back through the back one.
Flowery.plain: Instead, the back door coughed up... you.
Yatta: WE CAME FROM THE VENTS!!!
Flowery.squint: The vents. | Of course you did.
@walk Flowery 380 200 0.8
Flowery.look: Hold still.
* He walks a slow circle around the three of you, the way somebody walks around a used car.
Flowery.side: You're... smooth.
Scraps: People keep saying that.
Flowery.side: Everything here is drawn with about four hundred little squares, princess. You're drawn with a hundred thousand. | You look like a commercial that wandered into the wrong show.
Scraps: We ARE a show! Were. We were a show.
Flowery.soft: ...Were, huh.
@frame Flowery flowery_pose_0
Flowery.beam: Well! A show! Then you'll need a tour guide. And it just so happens I'm the best tour guide in the history of tours, and of guides.
Ginger: We really just want to go home...
Flowery.smile: And you will, cupcake! After a little stroll. The back door doesn't open from this side until it's ready. Doors are like that. Sensitive.
Ginger: ...Cupcake?
Flowery.wink: You look like a cupcake. It's a compliment. Take it, it's free.
Flowery.smirk: You're "Origami," you're "Confetti," and the three of you together are "princesses."
Yatta: I'M CONFETTI!!!
Scraps: I'm a paper craft. Origami is folding. I CUT.
Flowery.grin: Then I'll be very careful around you, Origami.
Ginger: Um... Flowery? There's somebody in that cupboard.
Flowery.wide: That? | That's an art piece. It's called "Cupboard." It knocks. That's the art.
Scraps: It said "thank goodness."
Flowery.smile: Very interactive art piece. Ahead of its time. | Moving on!
@frame Flowery off
@face Flowery right
Flowery.smile: Follow me! Stay close, stay cute, and if anything else with a sword shows up, scream my name. | Two syllables. Flow-ery. Very easy to scream.
@walk Flowery 800 200 2.2
@remove Flowery
@party on
@lead 360 206 right
Scraps: ...I don't like him.
Yatta: I LOVE HIM!!!
Ginger: He saved us. | ...He also wanted somebody else to come through that door. Somebody named Kris.
Scraps: Yeah. | He looked at us like we were the wrong present.
@trigger 760 120 40 160 next
@roam
# next
@fade out 0.6
@finish
` },

/* ======================================================================= 3 */
{ id: 'tour', title: 'Tour Guide', sub: 'SEGMENT 3', place: 'The Cliff Road', script: String.raw`
@party Scraps,Ginger,Yatta
@room road 30 172 right
@music flCliffs
@spawn Flowery 130 160 right
@cut castle
@npc Flowery flTalk
* The road along the cliffs. Far off, a castle sits on a hill like a cake on a stand.
Flowery.cheer: Behold! Flower Castle! Ancestral home of beauty, built by me, decorated by me, | ...well, built by a dream, decorated by me.
Yatta: CAN WE GO IN?! CAN WE GO IN?!
Flowery.smile: You can go anywhere you like, Confetti. As long as I'm standing next to you.
@trigger 300 120 40 90 skate
@roam
# flTalk
Flowery.smile: Need something, princess? Directions? Compliments? I have both, and plenty of each.
@choice Ask about Kris|Ask about him|Never mind
@if choice=1 askKris
@if choice=2 askHim
Flowery.wink: Bold of you to talk to me and then say nothing. I respect it.
@end
# askKris
Flowery.calm: Kris? Quiet kid. Very likable. Very good at leaving a room without anybody noticing they're gone. | Their dad noticed. Every time.
@end
# askHim
Flowery.beam: Me? I'm a flower. A golden one. I was one-seventh of a very important question, once.
Flowery.smile: ...The answer was "yes," by the way. For a while.
@end
# skate
@party off
@unnpc Flowery
* The road ends at a row of stone switches in the dirt. Each one's a different color. None of them are pressed.
Scraps: A puzzle.
Ginger: I'm... bad at puzzles.
Yatta: I'M GREAT AT PUZZLES!! I JUST STAND ON ALL OF THEM!!
@walk Yatta 330 150 0.4
@jump Yatta
@walk Yatta 360 182 0.3
@jump Yatta
@sfx ui_cancel 0.4
* Nothing happens. The switches reset with a polite little "thup."
Yatta: ...I'M GREAT AT PUZZLES BUT DIFFERENTLY!!
@walk Flowery 300 170 0.8
Flowery.smirk: Step aside, Confetti. This calls for a professional.
@music flSkate
@frame Flowery flowery_skateboard_0
@sfx whoosh 0.5
@slide Flowery 640 170 0.7
@sfx ui_select 0.4
@shake 2
@sfx ui_select 0.4
* Every switch on the road clicks down at once. Somewhere a gate goes "GRAAANK."
@frame Flowery flowery_pose_point_cooler_0
@music flFlowery
Flowery.grin: Solved.
Scraps: That's not solving it. That's skateboarding on it.
Flowery.smile: The puzzle didn't say "no skateboards." I read the whole puzzle.
Yatta!: TEACH ME!!! TEACH ME TO DO THAT!!!
Flowery.wink: Can't. You need hair like this. It's load-bearing.
Flowery.smirk: But since you asked so nicely... | ...have you heard my voice lines?
Scraps: Your what?
Flowery.cheer: My VOICE LINES. Everybody important has them. Listen.
@frame Flowery flowery_pose_r_0
@voice sanfrandisco Here I come, Sanfrandisco!
@frame Flowery flowery_pose_point_cooler_0
@voice my_jarona My Jarona!
@frame Flowery flowery_kiss_2
@voice try_flavor Try my flavor!
@frame Flowery flowery_pose_0
@voice best_friend Your dad's my best friend!
@frame Flowery flowery_idle_0
Flowery.ugh: ...Wrong audience. That one's for somebody else. Forget you heard it.
@frame Flowery flowery_idle_0
* (Somewhere, faintly, a romantic-comedy saxophone plays and then stops, embarrassed.)
Ginger: ...Where is that sound coming from?
Flowery.smile: From me. I'm surrounded by it. It's a condition.
Scraps: Does anybody else here have voice lines?
Flowery.side: Seth tried once. It just said "um." For eleven minutes.
Yatta!: I WANT VOICE LINES!!!
Flowery.grin: You ARE a voice line, Confetti. You're all caps. All the time.
Yatta!: THANK YOU!!!
@frame Flowery off
@party on
@lead 330 170 right
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
* Somebody in a long purple hood is reading on the path. Beside them, a small girl in a big red bow is balancing a knife on her finger.
Aqua: Seth! Seth! Look! I'm balancing it!
Seth: Please don't balance it.
Aqua: I'm balancing it SO well.
Seth: I can see that. That's why I said please.
Flowery.cheer: Seth! Aqua! My brilliant buds!
@face Seth left
Seth: ...Flowery. | Who are the... | Who are they?
Aqua: My name's Blue, by the way.
Seth: Your name is Aqua.
Aqua: Today it's Blue.
Seth: Blue is a different person. Blue is a whole different person who exists.
Aqua: Then I'm Seth.
Seth: You can't be Seth, I'M Seth, we've talked about this every day since we were picked.
Yatta!: I'M CONFETTI!!!
Aqua: Ooh. Can I be Confetti?
Yatta: ...
Yatta: ...YES!!! WE'RE BOTH CONFETTI!!!
Seth: Oh no. There's two now.
Flowery.smile: Seth, these are my new friends. They came in the back door. | Isn't that interesting?
* Seth looks at Flowery, then at you, then at Flowery again, and pushes their glasses up.
Seth: The back door. | The back door you told us to watch.
Flowery.plain: Mm-hm.
Seth: For Kris.
Flowery.smile: For anybody, Seth. Anybody at all.
Seth: ...Right. Anybody.
Seth: (Under their breath) He was SO sure it would be Kris.
Scraps: What's in the book?
@face Seth down
Seth: Plans. Lists. Who's allowed in the garden, what the king had for breakfast, what he's allowed to see today. | You're not in it. Any of it.
Scraps: Everybody here keeps telling us we're not on lists.
Seth: Because you're not! I'd have to make a new page. I don't have a new page. | I'd have to make a new BOOK.
Ginger: ...We could help you. Write the page.
Seth: ...
Seth: You'd help me write the page about you?
Ginger: I'm good at decorating. I can't... do anything else very well. But I can make a page look nice.
* Seth stares at Ginger. Very slowly, they hold out a pen.
Aqua: Seth's blushing.
Seth: I am NOT, Aqua.
Aqua: Blue.
Seth: AQUA.
@anim Aqua aqua_laugh_ 8 10
@wait 1.4
@idle Aqua
Flowery.grin: Wonderful, wonderful! Everybody loves each other! Seth, Aqua, I'll take our guests to the castle. Make sure the king's breakfast is... perfect.
Seth: It's three in the afternoon.
Flowery.wink: Then make sure it's a perfect three in the afternoon.
@walk Flowery 900 170 1.4
@remove Flowery
@walk Seth 760 172 0.5
@face Seth left
Seth: Hey. | ...You. Paper one.
Scraps: Scraps.
Seth: Scraps. He's nice. He's really nice, okay? He's the nicest. He'd do anything for the king.
Seth: That's what I wanted to say. | He'd do anything.
@walk Seth 900 170 1.2
@remove Seth
@walk Aqua 900 190 0.9
@remove Aqua
@party on
@lead 700 170 right
Ginger: That felt like a warning.
Scraps: It felt like a warning wearing a nice hat.
Yatta: I HAVE A BEST FRIEND NOW!!! HER NAME IS SETH!!!
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
* A cafe inside the castle. It smells like butter.
* A tall green chef is standing behind the counter. A small orange rat is standing on the chef's hat.
@music flOrange
Flowery.cheer: Green! My partner in flavor! And Orange, my favorite little sister in the entire universe!
Orange!: I'M YOUR ONLY LITTLE SISTER!!!
Flowery.smile: And my favorite.
Orange!: WHO ARE THE SHINY ONES?! WHY ARE THEY SHINY?! I DON'T TRUST SHINY!!
Yatta!: WHO'S THE LOUD ONE?! WHY IS SHE LOUD?! I LOVE LOUD!!
Orange!: I'M ORANGE!!!
Yatta!: I'M CONFETTI!!!
Orange!: THAT'S NOT A COLOR!!!
Yatta!: IT'S EVERY COLOR!!!
* Orange opens her mouth, then closes it again.
Orange.: ...okay that's pretty good.
@music flShop
* Green waves at you. That's the whole conversation. It was a good one.
@npc Green greenTalk
@npc Orange orangeTalk
@npc Flowery flTalk
@sign 22 176 cafeLocker dw_ralseicupboard_0
@roam Talk to everyone
# cafeLocker
* It's the cupboard from the garden. Somebody has moved it here. Somebody has put a little doily on top.
@sfx knock 0.5
Locker: ...Is that the paper one? Hello again! I recognize your footsteps! They're very soft!
Orange!: DON'T OPEN THAT!! BIG BROTHER SAYS IT'S A "SURPRISE FOR LATER"!!
Orange.: ...he's been saying that for two days.
@end
# greenTalk
@if baked greenAfter
* Green nods at you. Green points at the oven. Green points at Ginger. Green tilts their head.
Ginger: ...Me? | Oh, no, I'm... my cookies are...
Ginger: Goob said they don't taste like Cosmo's. He was being nice about it. That's how I know they're really bad.
* Green walks to the counter. Green takes down a second apron. Green holds it out.
Ginger: ...
Ginger: Okay. | Okay, I'll try.
@party off
@walk Ginger 250 190 1
@face Ginger up
@walk Green 260 172 0.4
@fade out 0.6
* Time passes. It smells like vanilla. Then like smoke. Then like vanilla again, more carefully.
* Green never says a word. Green just moves Ginger's hands a little to the left, a little slower, and nods.
@fade in 0.6
@frame Green green_pleased_0
Ginger: ...They came out.
Ginger: They came out round. They're ROUND, Scraps. Cookies are supposed to be round!
@spawn Cake 250 200 down
@frame Cake green_cake_0
Scraps: You decorated them like...
Ginger: Like flowers. Seven colors. | ...I didn't plan that. My hands just did it.
* Green looks at the cookies, then pats Ginger on the head.
Flowery.soft: Green does that. You walk in bad at something and walk out a little less bad.
@flag baked
@party on
@idle Green
@lead 200 200 right
@end
# greenAfter
* Green gives you a thumbs up. A whole, entire thumbs up.
@end
# orangeTalk
Orange!: WHAT DO YOU WANT, SHINY.
@choice Ask about the shop|Ask about Flowery
@if choice=2 orangeFl
Orange!: OH! THE SHOP! IT'S GREEN'S SHOP! EVERYTHING COSTS ONE DOLLAR MORE THAN THE OTHER SHOP!
Scraps: Why?
Orange!: BECAUSE IT'S BETTER!!!
Scraps: Is it?
Orange.: ...it's the same stuff. | DON'T TELL GREEN I SAID THAT!!!
@end
# orangeFl
Orange!: MY BIG BROTHER IS THE BEST! HE'S THE TALLEST AND THE SHINIEST AND HE PUNCHES REALLY GOOD!!
Orange.: He doesn't sleep, though. He stays up looking at the castle door. In case somebody comes in.
Orange.: ...in case YOU came in, I guess.
@end
# flTalk
@if baked flAfter
Flowery.smile: Go on, try the cafe. Green doesn't talk, but Green LISTENS. It's terrifying. You'll love it.
@end
# flAfter
@party off
@walk Flowery 120 200 0.6
@face Flowery right
Flowery.calm: Cupcake. A word?
@walk Ginger 150 200 0.6
@face Ginger left
Flowery.calm: Your friends. The paper one and the loud one. Do they go everywhere you go?
Ginger: ...No. I'm only around at Christmas. I'm a Holiday Toon. | The rest of the year I'm in storage. Well, it's a room. But it has the same feeling as storage.
Flowery.serious: So somebody keeps you. On a shelf. Until you're useful.
Ginger: That's... not how Bobette would say it.
Flowery.serious: How would you say it?
Flowery.soft: Did somebody send you, Cupcake? A kid, maybe. Hair like a curtain. Told you to come through the back door and look around?
Ginger: ...No. Nobody sends us anywhere. That's the whole problem. Everybody who used to tell us what to do is gone.
* Flowery looks at her for a while. Then he laughs.
@frame Flowery flowery_pose_0
Flowery.beam: Ha! Of course not! Look at you, you couldn't spy on a sandwich. | Come on. The king wants to meet you.
Ginger: The king?
Flowery.smile: He doesn't know it yet. But he does.
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
{ id: 'trial', title: 'The Case of the Trampled Bed', sub: 'SEGMENT 5', place: 'Flower Castle · Left Wing', script: String.raw`
@party Scraps,Ginger,Yatta
@room hall 30 200 right
@music flAsgore
@fade in 0.8
@spawn Flowery 80 186 right
* The left wing. Three big doors: blue, yellow, orange. Somebody has trampled the little flowerbed outside the blue one.
@trigger 230 150 60 80 crime
@roam
# crime
@party off
@spawn Yellow 330 190 left
@sfx ui_alert 0.5
@frame Yellow yellow_point_left_0
@music flYellow
Yellow!: FREEZE.
@shake 3
* A tall flower in a cowboy hat steps out from behind the yellow door. He is pointing a very serious gun.
Yatta: I'M FROZEN!!! LOOK HOW FROZEN I AM!!!
@jump Yatta
Yellow: Somebody trampled Blue's flowerbed. And a man doesn't trample a flowerbed. Not in my town.
Scraps: It's a castle, not a town.
Yellow: Not in my castle-town.
@spawn Blue 180 150 down
@walk Blue 200 186 0.8
@anim Blue enemy_blue_spintopose_ 4 10 once
@frame Blue blue_poses_0
Blue: Oh, Yellow. You found the culprits. | How very... dramatic of you.
Blue: Three strangers. Shiny. Out of place. Standing right next to my poor, crushed bed. | I could just cry.
Flowery.squint: Blue.
Blue: Flowery. | You're blocking my light.
Flowery.smirk: I'm everybody's light, Blue. It's not my fault you're standing in me.
* Blue and Flowery look at each other the way two cats look at each other across a fence.
Yellow: Order! This court is now in session!
Ginger: Court?
Yellow: Every crime deserves a trial! A FAIR one! I'm the judge. And the sheriff. And the jury.
Scraps: That's not fair.
Yellow: ...I'm a very fair jury.
@frame Yellow yellow_cool_stance_0
@call trial
# trial
Yellow: The evidence! One: the bed is trampled. Two: the footprints are small. Three: the footprints... | ...are shaped like a tiny boot.
Yellow: Which of you wears tiny boots?
Yatta: NOT ME!!! I'M BAREFOOT!!! I'M ALWAYS BAREFOOT!!!
Scraps: Paws.
Ginger: ...I have tights. With stirrups.
Yellow: Hmmmm.
@choice Point at Blue|Point at Flowery|Point at Yellow
@if choice=2 blameFl
@if choice=3 blameYellow
Scraps: It was HER. The ballerina. | Ballerinas wear tiny shoes.
Blue.wide: How DARE you. These are SLIPPERS, darling.
Yellow: ...Slippers aren't boots. Objection overruled.
Yellow: Try again, citizen.
@goto trial
# blameYellow
Scraps: It was you. You're wearing boots.
Yellow: ...
Yellow: I... | I am wearing boots.
@frame Yellow yellow_depressed_0
* Yellow looks down at his own boots. His whole body droops.
Yellow: Then justice demands... | ...that I punish myself.
@frame Yellow yellow_kneelsad_0
Ginger: No! No, no, no, Yellow, they're cowboy boots, they're HUGE, they couldn't...
Yellow: ...they couldn't.
Yellow: Thank you, ma'am. | Objection... sustained. Self-objection.
@frame Yellow yellow_cool_stance_0
@goto trial
# blameFl
Scraps: It was Flowery.
Flowery.wide: Me?!
Scraps: You came in first. You walked right past the bed. And those are dancing shoes. Tiny dancing shoes.
Scraps: And you've got dirt on your heel. Blue dirt. From the blue bed.
* Everybody looks at Flowery's heel. There is, in fact, blue dirt on it.
Flowery.sweat: I— | That's— | That's from a PIROUETTE. A practice pirouette. In the morning. For art.
Blue.sly: You practiced a pirouette... on my flowers.
Flowery.ugh: I practiced a pirouette NEAR your flowers. The flowers came INTO the pirouette.
Blue.cross: You never could land it.
Flowery.snarl: I LAND IT EVERY TIME.
@anim Flowery flowery_pirouette_ 8 16 once
@frame Flowery flowery_hurt_0
@shake 2
@sfx hit_light 0.4
* Flowery pirouettes. He does not land it.
@frame Flowery off
Blue.sly: ...Mm-hm.
Yellow: The court finds Flowery... GUILTY. Of trampling. And of not landing it.
@frame Yellow yellow_shoot_0
@sfx bounce 0.5
* Yellow fires. A small blue flower pops out of the barrel and lands in Flowery's hair.
Yellow: ...it always does that.
Blue.soft: I put those in there, darling. Every morning. I'd rather you shot something pretty.
* Yellow goes red under his hat.
Yatta: THAT WAS THE BEST COURT I'VE EVER SEEN!!!
Ginger: It's the only court you've ever seen.
Yatta: AND IT WAS THE BEST ONE!!!
@frame Flowery off
@walk Flowery 120 196 0.5
@face Flowery right
Flowery.smirk: Origami. You're sharp.
Scraps: I'm paper. It's the edges.
Flowery.calm: I mean you watch people. You clocked which foot I walked in on.
Flowery.calm: Most people don't look that hard at me. They look at the hair and stop.
Scraps: Your hair's very loud.
Flowery.smile: Thank you. | ...Do you always look that hard at people?
Scraps: Since I got back.
Flowery.side: Back from where?
Scraps: ...Somewhere you don't get to come back from anymore. | So now I look at everybody really hard. In case it's the last time I get to.
* Flowery doesn't have a comeback for that one. He looks at his blue-dirt shoe instead.
@music flAsgore
@party on
@lead 160 200 right
@npc Blue blueTalk
@npc Yellow yellowTalk
@trigger 520 150 40 90 next
@roam
# blueTalk
Blue.soft: Everything in this castle is painted, darling. The walls, the sky, the grin on him. I've watched him do the touch-ups.
Blue.sly: Ask him how long he's been "fine." It's a fun number.
@end
# yellowTalk
Yellow: Ma'am. Sir. Small loud ma'am. | If you ever need justice, just holler. I'll be there. I'll probably shoot a flower at it.
@end
# next
@fade out 0.6
@finish
` }
];
