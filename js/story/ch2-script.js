/* Consolidated scripts, in original load order. */
'use strict';

/* ===== js/story/ch2-script-a.js ===== */
/* ch2-script-a.js - Main Story · Chapter 2 "Business as Usual", scenes 1-6.
   July 6, 2002, a week after the Handlers fled. Same script grammar as
   story-script.js. Scene meta: date = the date stamp, time = the clock. */
'use strict';

Object.assign(ST_STORY, {

/* =================================================================== 1 */
c2s1: { title: 'The Last Train', time: '11:52 PM', date: 'JUNE 29, 2002', place: 'Platform Nine', script: `
@bg black
@stop
@card JUNE 29, 2002
@card 11:49 PM
@bg platform
@fx dark
@music unknown
> Gardenview's freight platform. The only way in that the chain on the front gate does not reach.
> At the end of the line, the last train of the night idles with its headlamp on. Nobody is supposed to be driving it.
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Veronica [dots]: Feel that? It's the third time tonight.
Sam [dots] (tremble): My badge is burning.
Shannon [dots]: So is mine. And Austin's. Every badge we own is awake at once.
Austin [anger]: Arthur told us to leave. The badges are telling us to go in.
Veronica [dots]: Then we go in. Quietly. We find Sprout, we find Pebble, we find Astro, and we bring them out.
Sam [dots]: And Devan?
Veronica [tears]: ...
Veronica [dots]: One door at a time.
@sfx step
> They climb the service steps. The corridor beyond is dark, and the dark is moving.
@exitall
@fx alarm
@sfx warn
@enter TwistedSprout left
@enter TwistedBoxten center
@enter TwistedTisha right
> Sprout's apron is stiff with black Ichor. Boxten's key turns by itself. Tisha drags her duster along the floor and it leaves a groove.
@music twisted
@enter Sam farleft
Sam [shock] (shake): Sprout? Sprout, it's me!
TwistedSprout [dots]: ...Stay... close...
@fx glitch
> The word comes out wrong. The oven glows behind him. Every Toon in the corridor turns at the same moment.
@exit TwistedSprout
@exit TwistedBoxten
@exit TwistedTisha
@fx calm
@enter Veronica left
@enter Shannon right
@enter Austin farright
Austin [!] (shake): They're all awake. The whole building is awake.
Veronica [anger]: Back to the platform! Run!
@fx shake
@sfx metal_hit
> They run. Behind them, something large knocks over a vending machine on purpose.
@bg platform
@fx alarm
@music boss
> The train is still idling. Its cab door hangs open.
@exitall
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Shannon [shock]: Who's driving this thing?
Veronica [dots]: Nobody. That's the point. There's a throttle, a brake, and a lever that says DO NOT.
Sam [dots]: I'll drive!
Veronica [?]: You can't drive.
Sam [anger]: Then I'll learn faster than anyone has ever learned anything!
@sfx tw_dyle_spot
> The headlamp swings. There is a figure standing in the light, in the middle of the track.
@exitall
@enter TwistedDyle center
@fx glitch
> A pocket watch the size of a clock face. A chain that has been dragged through every room in the building. One hand on the signal lever.
TwistedDyle [anger]: Platform nine. The eleven fifty-two. You are... LATE.
@enter Austin farright
Austin [dots]: Dyle? Dyle, it's Austin. We just want to get out.
TwistedDyle [anger] (shake): Nobody. Leaves. On. My. Schedule.
@fx shake
@sfx metal_hit
> He drags the lever down with both hands. The brakes scream. The train shudders and begins to slow.
@exit Austin
@enter Veronica left
Veronica [shock]: He's stopping the train!
Shannon [shock]: He's stopping all of us!
@fx flash
@sfx hero_vee_ability
> Veronica's badge flares green. She throws herself across the cab and shoves the throttle all the way forward.
Veronica [anger] (jump): GO! GO! GO!
@sfx earth_quake
@fx shake
> The coupler groans. The chain whips across the windscreen. For one long second, the train and Dyle push against each other.
TwistedDyle [dots]: ...Late...
> The headlamp reaches him. His watch cracks down the middle. The hands stop at 11:52.
@fx whiteout
@stop
@bg black
> Dyle is thrown clear. The train bursts into the tunnel.
@bg platform
@fx dark
@music emotional
@enter Sam left
@enter Shannon center
@enter Veronica right
@enter Austin farright
Sam [tears] (tremble): He was looking at me. When the lamp hit him, he was looking right at me.
Shannon [tears]: That was Dyle. That was all of them. Every Toon in that building.
Austin [tears]: They didn't know us.
Veronica [dots]: They knew exactly who we were. They just didn't care.
Sam [tears]: Sprout looked through the window. He mouthed something.
Veronica [dots]: What?
Sam [tears]: Stay close.
> Nobody speaks until the tunnel ends.
> Behind them, at the very end of the track, a small figure stands where the train used to be, holding a cracked watch toward the dark.
@exitall
@fx dark
@bg black
@card ONE WEEK PASSES
@card JULY 6, 2002
` },

/* =================================================================== 2 */
c2s2: { title: 'Rise and Shine', time: '8:02 AM', date: 'JULY 6, 2002', place: 'Gardenview Lobby', script: `
@bg black
@stop
> Tisha wakes up with her cheek on the reception desk and a stack of tissues for a pillow. This is not as comfortable as it sounds.
@bg lobby
@music bossa
@enter Tisha center
Tisha [dots]: Ugh. Hnn. What time...?
> The clock above the desk says eight. The clock above the desk has said eight, to be fair, since 1991.
Tisha [dots]: There is ink on the ceiling.
Tisha [?]: Why is there ink on the ceiling?
> Black streaks run across the lobby floor. A planter is on its side. The CLOSED sign hangs in the window by one string.
Tisha [anger]: And somebody has parked a pile of bubble wrap on my welcome mat.
@enter Poppy left
@sfx pop2
Poppy [sparkle] (jump): Good morning, Tisha!
Tisha [dots]: That is the bubble wrap, Poppy.
Poppy [blush]: Oh! It's very cozy.
@enter Toodles right
Toodles [note] (jump): Morning, morning, morning! Did anyone else wake up on the chandelier?
Tisha [?]: How did you get on the chandelier?
Toodles [dots]: I'm hoping somebody remembers.
@enter Boxten farright
@sfx sparkle
> A small, bright chime. Boxten winds himself and stretches until his key ticks.
Boxten [heart]: Good morning. Did I miss a party? I feel like I missed a party.
Tisha [dots]: Not a party. Look at it. It's a crime scene with streamers.
Poppy [?]: What was the last thing everybody remembers?
Boxten [dots]: Arthur on the intercom. Something about the center being closed.
Toodles [dots]: The lights going off.
Poppy [sparkle]: A very long nap!
Tisha [dots]: A very messy nap.
> A sheet of paper is taped to the front door. Delilah's handwriting. CLOSED UNTIL FURTHER NOTICE. MANAGEMENT.
Boxten [dots]: Oh. It closed.
Poppy [sparkle]: Oh, that's all! Just closed!
Toodles [note]: Nothing to worry about, then!
Tisha [dots]: Mm. Funny. I don't remember closing anything.
@fx shake
@sfx metal_hit
> Somewhere under the floor, the plumbing knocks. Four taps. A pause. Then four more.
Toodles [!]: ...Did you hear that?
Tisha [dots]: Pipes.
Toodles [dots]: I heard something last night. In the vents. It had Boxten's chime.
Boxten [?]: In the vents? I was asleep.
Toodles [dots]: I know. That's what I thought, too. Just sounded exactly like you.
Poppy [dots]: Toodles, you slept on a chandelier. I think you had a dream.
Toodles [sweat]: ...I think I had a dream. Yeah.
@sfx dandy_entrance
@fx petals
@music delilah
> A familiar, cheerful clatter from the shop door. A rainbow of petals drifts in ahead of him.
@enter Dandy center
Dandy [sparkle]: Good morning, everyone! What a beautiful, uneventful day.
Tisha [dots]: Dandy. The ceiling is covered in ink.
Dandy [dots]: Is it? How fresh.
Boxten [dots]: Dandy, did we close?
Dandy [sparkle]: We did! A temporary closure. Management's decision. A minor inconvenience, nothing more.
Poppy [?]: How long are we closed for?
Dandy [dots]: Oh. A while.
Tisha [?]: A day? A week?
Dandy [sparkle]: A while is a perfectly good unit of time.
@sfx dandy_text
Dandy [dots]: Back to your routines, everyone. Nothing makes a Toon happier than a morning with a purpose.
> His gloves are very clean. They are a slightly different colour than Tisha remembers.
Tisha [?]: Dandy, where are the Handlers?
Dandy [dots]: On leave, naturally. Staff are not required during a closure.
Poppy [tears]: Not even Sam?
Dandy [dots]: Not even Sam.
> Poppy's bubble wrap deflates by a few small pops.
Dandy [sparkle]: Chin up! The shop will be open soon. In the meantime, someone does need to see to the lobby.
@exit Dandy
@fx calm
Tisha [dots]: Someone.
Tisha [anger]: Of course someone.
@exit Poppy
@exit Boxten
@exit Toodles
> One by one, the others drift off to find something to do. They do not look back at the mess.
Tisha [dots]: Right. Duster. Bucket. Gloves.
> She finds a long black smear on the floor leading to the service door. It does not look like any spill she has ever mopped.
Tisha [dots]: ...Someone dragged something.
@sfx step
> The smear stops at a locked door. Tisha tests the handle. It does not budge.
Tisha [dots]: Not today. I'm cleaning the lobby first.
Tisha [sweat]: Then I'm cleaning the kitchen. Then I'm finding out who is paying for all of this.
` },

/* =================================================================== 3 */
c2s3: { title: 'Sunny Side Up', time: '9:30 AM', date: 'JULY 6, 2002', place: 'Diner', script: `
@bg diner
@music neutral
> The diner smells like toast. It is the first good smell all morning.
@enter Sprout left
@enter Cosmo right
Sprout [dots]: Breakfast in ten minutes. Cosmo, the oven's on its last third of flour.
Cosmo [dots]: I counted. We have a day and a half of flour, two days of butter and an extra muffin.
Sprout [?]: Why an extra muffin?
Cosmo [blush]: In case somebody needs it. Or, um, in case somebody just looks sad.
Sprout [dots]: Good reason. Keep it by the door.
> Behind them, the pantry shelves are mostly empty. Both bakers carefully do not look at them.
@enter Shrimpo farleft
Shrimpo [anger]: GOOD MORNING, and Shrimpo wants it on record: Shrimpo has never seen so much ink on a ceiling!
Cosmo [dots]: Good morning, Shrimpo.
Shrimpo [anger]: It's in my shell. It's in my antennae. It's on my toast! Somebody get a manager!
Sprout [sweat]: The managers are... closed.
Shrimpo [anger]: Then Shrimpo wants it on the record that he is UNHAPPY about it! Shrimpo deserves a better ceiling!
Sprout [anger]: Shrimpo. Eat your toast.
Shrimpo [sweat]: ...Shrimpo is eating his toast.
@enter Finn farright
Finn [note] (jump): Hey! The lights were off. Gigi saw it too, but nobody believes her. So I'm telling people.
Sprout [dots]: Finn. Sit. Eat.
Finn [note]: Did I tell you about the fish by the fountain? Well, not exactly a fish...
Shrimpo [anger]: Nobody asked.
Finn [sparkle]: Nobody ever does! That's why I'm so good at it.
@exit Shrimpo
@exit Finn
@enter Glisten left
Glisten [anger]: This is inexcusable. Not one mirror in this building has been polished.
Cosmo [dots]: There's been a lot going on, Glisten.
Glisten [anger]: A lot going on? I look like I've been through a washing machine! Look at this smudge!
Sprout [dots]: That's... the window, Glisten.
Glisten [sweat]: ...The window is also inexcusable.
@enter Teagan right
Teagan [note]: Everyone! A cup of tea? I have a full pot. Don't worry about the mess. Tea settles everything.
Glisten [dots]: Teagan, you make everything sound normal.
Teagan [heart]: That is the entire point of tea, dear.
@exit Glisten
@exit Teagan
@enter Astro right
@sfx hero_astro_talk
Astro [dots] (tremble): Mmn. Good morning.
Sprout [dots]: Astro. Sit. You look like you haven't slept in a month.
Astro [dots]: I slept all night. I think. It felt like more than a night.
Cosmo [?]: Bad dreams?
Astro [dots]: Just one. A kind of humming. And somebody counting. Slowly.
Sprout [dots]: Counting what?
Astro [dots]: I don't know. I couldn't hear the number. Only that it kept going up.
Sprout [dots]: Eat. It's only a dream. If it isn't, I'll deal with it.
Astro [dots]: Yes. Only a dream.
> Astro eats his muffin slowly, with the look of someone swallowing a thought.
@exitall
@bg sign
@sfx dandy_text
> In the lobby, between the broken sign and the spilled plants, Razzle and Dazzle are putting up a banner.
Razzle [note] (jump): Ladies, gentlemen, Toons of every shape! Gardenview is closed, and we have never had a better stage!
Dazzle [sparkle] (jump): A show! A show! For the kitchen, for the lobby, for the vending machines!
@enter Looey right
Looey [note]: I brought the tuba.
Dazzle [sweat]: Looey, there is no room for a tuba.
Looey [dots]: There is always room for a tuba.
@enter Yatta left
Yatta [note] (jump): And I'm the opening act! I'm very opening.
@enter Blot farright
Blot [sweat] (tremble): I'll... hold the lights. And not touch anything. I promise.
Razzle [note]: Blot, darling, you may touch the stage.
Blot [shock]: What if it gets on the stage?
Dazzle [dots]: The ink? It is the stage.
> Blot goes a little pale.
@enter Tisha center
@exit Razzle
@exit Dazzle
@exit Looey
@exit Yatta
@exit Blot
Tisha [dots]: Okay. Breakfast is in progress. The lobby is a disaster. I need volunteers.
@enter Scraps right
Scraps [sparkle] (jump): Volunteers! Volunteers! Ooh, is it scissors? I love scissors!
Tisha [dots]: It's cardboard boxes, Scraps. The maintenance wing is full of broken ones.
Scraps [note]: Even better! Boxes can be cut AND folded!
Scraps [sparkle]: And if I find any yarn in there, the yarn is mine. I'm just saying it now.
@enter Goob left
Goob [heart] (jump): Okay! I heard cleaning! I heard teamwork! I love teamwork! We've GOT this!
Tisha [dots]: Goob, nobody's even started yet.
Goob [sparkle]: And that's why it's going to be AMAZING!
Tisha [sweat]: I'll take it. I'll take all of it. Both of you with me, to the maintenance wing.
Scraps [note]: Can I bring the shears?
Tisha [dots]: Yes.
Goob [heart]: Can I bring snacks?
Tisha [dots]: Please.
@exit Goob
@exit Scraps
@enter Poppy left
@enter Toodles right
Poppy [sparkle]: Tisha! I made the bubble wrap into a little bed for the lobby. Everyone can nap on it!
Tisha [dots]: Poppy. Nobody is napping. We have been napping.
Poppy [blush]: Oh. Then it is a bed for later!
Toodles [note] (jump): Can I help? I can carry things! I can carry anything! Mostly while bouncing!
Tisha [dots]: Carry it while walking.
Toodles [sweat]: ...Walking. Okay. I can try walking.
Tisha [sweat]: Poppy, the bubble wrap goes in the bin. Toodles, the light bulbs go on the table. Gently.
Poppy [sparkle]: Aye aye!
@exit Poppy
@exit Toodles
@enter Connie center
Connie [dots] (jump): Tisha, I'm going to take a look around the parts nobody's using. Since we're closed and all.
Tisha [?]: Connie, the maintenance corridor is dark.
Connie [sparkle]: I'm a ghost! Dark is my best friend.
Tisha [dots]: Stay with someone.
Connie [blush]: Of course!
> She floats off before she answers anything else.
@enter Flutter right
> Flutter flaps twice and points at the exit Connie took. Then at Tisha. Then at the ceiling, where a new ink stain has begun to drip.
Tisha [dots]: Yes, Flutter. I'll get to that too.
@exit Flutter
@exit Connie
@music interesting
> It is a very ordinary Saturday morning. That is how nobody notices when it stops being one.
` },

/* =================================================================== 4 */
c2s4: { title: 'The Wrong Boxten', time: '11:20 AM', date: 'JULY 6, 2002', place: 'Maintenance Wing', script: `
@bg warehouse
@fx dark
@music unknown
> The maintenance wing is a dark maze of shelves, boxes and long grey corridors. Connie floats through it, humming.
@enter Connie center
Connie [sparkle]: Nobody home. Excellent. No one to prank. No one to scare. Just me and a thousand cardboard boxes.
@sfx sparkle
Connie [dots]: ...Though somebody's here.
> A soft chime from further down the corridor. A music-box note. Then another.
@exit Connie
@enter TwistedBoxten center
@fx alarm
> At the end of the aisle, with his back to her, Boxten is winding his own key. It takes much longer than it should.
@enter Connie left
Connie [shock]: Boxten? You're... a little far from the kitchen.
TwistedBoxten [dots]: ...One. Two. Three...
@fx glitch
> His key does not make a sound. His smile has too many teeth.
Connie [!]: Okay, no. That is not funny. That is NOT funny. He's twisted again!
@exit TwistedBoxten
@fx shake
@sfx metal_hit
> The shelf behind Connie collapses. She doesn't wait to see what comes next.
@exitall
@bg warehouse
@fx calm
@music interesting
@enter Tisha left
@enter Boxten center
@enter Scraps right
@enter Goob farright
Boxten [heart]: ...so I said, if everything's broken, let's make it a nice sort of broken.
Goob [heart] (jump): That's beautiful, Boxten!
Scraps [note]: Very beautiful! I'm going to cut it up and reuse it.
Tisha [dots]: We have three more boxes to carry. And a shelf that doesn't match the others.
@sfx pebble_talk
@enter Connie farleft
Connie [!] (shake): TISHA!
Tisha [shock]: Connie? What's the matter?
Connie [shock]: There's a Twisted. At the end of the corridor. It's Boxten! I know how that sounds, I'm the ghost here!
Boxten [?]: I'm... right here, Connie.
Connie [dots]: I know. That's the problem. Two of you, and I like the first one.
Goob [dots]: She means... there are two of him?
@fx alarm
@sfx tw_vee_spot
> The corridor lights go out one by one, from the far end toward them.
@enter TwistedBoxten right
@music twisted
> Under the last light, a wooden Toon with Boxten's face and Boxten's key stands in the middle of the aisle. He is smiling. He is not looking at anybody.
Boxten [shock] (tremble): That's... me. That's how I look when I... what did I do to my face?
Tisha [dots]: That isn't you, Boxten.
Boxten [tears]: It has my chime.
TwistedBoxten [dots]: ...One... Two... Three...
@fx glitch
@sfx metal_hit
> The key finally turns. The twisted Boxten lunges across the aisle.
Tisha [shock] (jump): Back! Everybody back!
@fx shake
> Boxten stumbles. The Twisted's slam lands where he was standing a second ago. A shelf splinters.
Goob [anger]: Hey! Hey, quit it! That's... that is NOT how you treat a friend!
Scraps [!] (jump): Goob, watch out!
@sfx hit_blunt
> The Twisted swings again. This time it isn't aimed at anybody. It is aimed at the shortest, loudest, friendliest Toon in the room.
Goob [shock]: Wait, wait, wait...
@fx flash
@sfx hit_blunt
> Goob puts both arms up. The blow lands. Something in his chest goes bright. The Twisted is the one who skids back.
Goob [shock] (jump): ...Did I do that?
Scraps [sparkle] (jump): He did that!
Tisha [shock]: Goob, you just shoved a Twisted across the room.
Goob [heart]: I hugged it really hard!
TwistedBoxten [anger]: ...Four...
> It gets up. Scraps cracks her knuckles. Something in her smile goes very sharp.
Scraps [note]: Ooh. Okay. Okay okay okay.
Scraps [anger]: Hssss! You scared my friend.
@sfx swing_light
> She does not so much run as unwind. Her arm stretches ten feet down the corridor and snaps back, dragging a splintered box lid with it.
Tisha [shock]: SCRAPS?
Scraps [sparkle] (jump): I'm doing a thing!
@fx flash
Connie [sparkle]: I'll be floating behind Tisha. Strategically. Not scared. Strategic.
Tisha [dots]: That is the smartest thing anyone's said all day.
> Nobody in Gardenview has ever thrown a punch in their life. They are about to start.
` },

/* =================================================================== 5 */
c2s5: { title: 'Not Boxten', time: '12:40 PM', date: 'JULY 6, 2002', place: 'Research Lab', script: `
@bg artist
@fx calm
@music interesting
> The thing that was Twisted Boxten lies across a work table in the Research lab. It has stopped moving. It has not stopped being unsettling.
@enter Tisha left
@enter Scraps center
@enter Goob right
@enter Boxten farright
Boxten [tears]: Is it... Is it dead?
Scraps [dots]: It's very flat.
Goob [dots]: I didn't know I could do that.
Scraps [dots]: Neither did I. My arm went out and it was just... there.
Goob [heart]: You were AMAZING, Scraps! Did everybody see that? That's my big sister!
Scraps [note]: ...I forgot what I was doing, and then I did it anyway. I think that's the trick.
Tisha [dots]: Neither did the rest of us. Nobody has ever hit anything in this building.
@enter Shelly farleft
@sfx hero_shelly_talk
Shelly [sparkle] (jump): Tisha! Tisha! Is it true? Did you really fight a Twisted?
Tisha [dots]: Where did you hear that?
Shelly [sparkle]: Everyone in the lobby is talking about it. And I am the best person to examine it. And I brought a hammer.
@enter Rodger right
Rodger [dots]: Shelly, put the hammer down.
Shelly [sweat]: It's a small hammer.
Rodger [dots]: It is a small hammer attached to a very large enthusiasm. Observation first. Hammering later.
Rodger [dots]: Tisha. May I?
Tisha [dots]: Be my guest.
> Rodger leans over the remains. He adjusts his lens and says nothing for a long time.
Rodger [dots]: Observation one. The body is pine, not walnut. Boxten is walnut.
Boxten [?]: ...I am walnut.
Rodger [dots]: Observation two. The key. Boxten's key has a notch on the third tooth, from the day he dropped it.
> He holds up the remains of the key. It is smooth.
Rodger [dots]: Observation three. There is no wear. No dents. No scratches. Not a single memory of being knocked around by Poppy.
Boxten [dots]: Poppy does not knock me around.
Rodger [dots]: Observation four. It is not carved. It is poured. These layers are cast. Like a candle.
Shelly [sparkle]: Layered! Like strata! Ooh, can I look?
Rodger [dots]: Observation five. It smells of fresh varnish. It is no more than a few days old.
Tisha [?]: It's what? A few days?
Rodger [dots]: This was not a Toon who got twisted. This was made. It was built to look like Boxten.
@fx shake
@sfx warn
Boxten [shock] (tremble): Made? By who? For what?
Rodger [dots]: I don't know. That's the next observation.
> Nobody speaks. The Research lab's lights hum.
Shelly [dots]: So it's a... clone?
Rodger [dots]: I don't like to use that word until I have to. A copy. A replica. A very good one.
Tisha [dots]: And it was in the maintenance wing while the real Boxten was helping me carry boxes.
Rodger [dots]: Which means somebody could be in two places at once.
@choice Tell everyone | Keep it quiet for now
1> Tisha [dots]: We tell everyone. They deserve to know there's one of these in the building.
1> Rodger [dots]: Agreed. Fear is cheaper than surprise.
2> Tisha [dots]: Let's keep it quiet. Nobody needs to panic on a Saturday.
2> Rodger [dots]: Reasonable. For now. But we do not keep secrets from people who might meet one.
Scraps [dots]: Can I say something?
Tisha [?]: Of course.
Scraps [dots]: I wasn't scared. I mean, I was. But then my arm just went. Like it already knew how.
Goob [dots]: Mine too. I didn't know I was strong. I just wanted it to stop.
Shelly [sparkle]: That's fascinating. Everybody here seems to have a talent nobody mentioned.
Rodger [dots]: Notice that nobody mentioned them because nobody had ever needed to use them.
Shelly [dots]: Do you think we're all like that? Every Toon?
Rodger [dots]: I think everybody can. I don't think everybody should have to.
Boxten [dots]: I don't want to hit anything. I'd like to hold the door and be encouraging.
Tisha [dots]: That is an excellent job. Somebody has to do it.
Boxten [heart]: Thank you. I'll be very encouraging.
@sfx dandy_entrance
@fx petals
@music delilah
@enter Dandy center
Dandy [dots]: What a lot of long faces. And what is that on the table?
Rodger [dots]: Evidence.
Dandy [sparkle]: Of what? A disagreement between friends? A bad craft project?
Rodger [dots]: Of somebody building a second Boxten. Dandy, where were you at eleven-twenty this morning?
Dandy [dots]: Dusting the shop. As I do every morning.
Rodger [dots]: The shop is closed. Why dust?
Dandy [sparkle]: A shop is never really closed, detective. Only waiting to open again.
> The word detective lingers in the air. Rodger does not correct him.
Shelly [dots]: Dandy, did you see anything strange? Any... duplicates?
Dandy [dots]: Duplicates. What an unusual word. Not for the first time today, I hear it with a slight echo.
Rodger [dots]: Echo?
Dandy [sparkle]: Nothing. Run along, everyone. Go and enjoy the lunch.
@exit Dandy
@fx calm
Rodger [dots]: He did not look at the body. Not once.
Tisha [dots]: Maybe he doesn't like looking at it.
Rodger [dots]: Maybe. Or maybe he already knows what it looks like.
Shelly [sparkle] (jump): Then we investigate! I love investigations! I'll bring the hammer.
Rodger [sweat]: Not the hammer.
Shelly [dots]: The small one?
Rodger [dots]: Fine. The small one.
Tisha [dots]: I'm not a detective. I'm a tissue box with a bucket.
Rodger [dots]: You were the first witness. That is more than enough.
@sfx ding
Rodger [dots]: And I need the building's security feed. Vee will have it. Or she will have what's left of it.
` },

/* =================================================================== 6 */
c2s6: { title: 'Two Places at Once', time: '2:10 PM', date: 'JULY 6, 2002', place: "Vee's Studio", script: `
@bg veeShow
@music interesting
> Vee's studio. The main camera is still cracked from whatever happened last week. A standby card glows on the one working screen: WE'LL BE RIGHT BACK.
@enter Vee center
Vee [dots]: You're late. I was about to start without you. I'm very good at that.
@enter Rodger left
@enter Shelly right
@enter Tisha farright
Rodger [dots]: Vee. We need to see the security recordings from this morning.
Vee [dots]: Let me guess. Boxten.
Shelly [?]: How did you know?
Vee [dots]: Because I've been checking the cameras since dawn and I have a problem I can't explain. Sit down.
@sfx hero_vee_talk
> She pulls two monitors together. On the left, Camera Three, the maintenance corridor. On the right, Camera Nine, the lobby.
Vee [dots]: Eleven nineteen. Watch the clock in the corner.
Tisha [?]: That's... Boxten. Carrying a box on the right. And a Boxten at the end of the aisle on the left.
Vee [dots]: Same minute. Same second. Two different cameras. Two different floors.
Rodger [dots]: That is physically impossible.
Vee [dots]: Not impossible. Documented.
Shelly [sparkle]: So the camera clocks agree? They're not off?
Vee [dots]: Oh, the clocks were off. By twelve minutes. I corrected for it. That's the other problem.
Rodger [?]: Who adjusted the camera clocks?
Vee [dots]: Nobody. The log says nobody. Which means someone with the right keys did it and removed their name.
@fx static
@sfx robot
Vee [dots]: Here's the second problem. Look at the system date.
> The corner of the monitor says SAT 07/06/2002.
Shelly [!]: That's...
Tisha [dots]: Saturday. That's today.
Vee [dots]: It's the sixth of July. We woke up thinking it was the next morning. It wasn't. Seven days went by.
@fx shake
@sfx warn
Tisha [shock]: A week?
Shelly [shock]: A WEEK? We lost a week?
Rodger [dots]: Not lost. Removed. The recordings stop at eleven fifty-two PM on the twenty-ninth. After that, nothing. Seven days of blank tape.
Vee [dots]: Somebody erased it. The deletion is clean. Careful. Professional.
Tisha [dots]: So we've been asleep for seven days.
Vee [dots]: Or awake and unrecorded.
> Nobody likes that. It sits in the room like a fifth guest.
Shelly [dots]: But why would anyone want to...
Rodger [dots]: Because whatever happened in that week, it is the reason the lobby is covered in ink.
@fx calm
Vee [dots]: There's more. Look at the Security Log.
@sfx ding
> A scanned page of handwriting fills the screen. The title reads CAMERA 6B. The offset reads +12.
Vee [dots]: Dead sector. Day of the surge. At six AM, someone offset a camera by twelve minutes.
Tisha [?]: The twenty-fourth. That's...
Rodger [dots]: The announcement we remember is dated June twenty-ninth. We woke on July sixth.
Vee [dots]: Whatever happened, it didn't start a week ago. It started on the twenty-fourth.
Shelly [dots]: And it's still happening.
@enter Gigi farleft
@sfx sparkle
Gigi [note] (jump): Hey hey! Did I miss it? Are we finding stuff?
Vee [dots]: Gigi, this is not the time for...
Gigi [idea]: Because I found stuff! By the train station! Behind the old schedule board!
> She holds up a cracked plastic ID badge on a lanyard. The photograph is a woman with sharp glasses. VERONICA HURLEY. BROADCAST HANDLER.
Vee [shock] (tremble): That's Veronica's.
Rodger [dots]: She was your Handler.
Vee [dots]: She was my friend. She would never leave this behind.
Vee [anger]: Don't look at me like that. I'm fine. I'm the host. Hosts are always fine.
Gigi [dots]: It was wedged in the track. Like she'd dropped it running.
Tisha [dots]: Running from what?
Vee [dots]: I don't know. But if her badge is here, then the Handlers didn't just go on leave.
@fx static
Rodger [dots]: They left in a hurry. Out of the only door still open.
Tisha [dots]: The train.
@sfx ding
Rodger [dots]: Then we need to talk to the man who runs it.
Vee [dots]: Dyle. I'll come with you. I want to know what's on that tape.
Shelly [sparkle]: And I get to see a real train station! This is the best closure ever!
Tisha [sweat]: Please stop saying that.
> Vee takes the badge from Gigi very gently. She stares at it for a long moment before putting it in her pocket.
Vee [dots]: Somebody wiped a week from my recordings. I want my week back.
` }

});

;

/* ===== js/story/ch2-script-b.js ===== */
/* ch2-script-b.js - Main Story · Chapter 2 "Business as Usual", scenes 7-12. */
'use strict';

Object.assign(ST_STORY, {

/* =================================================================== 7 */
c2s7: { title: 'Out of Service', time: '4:00 PM', date: 'JULY 6, 2002', place: 'Platform Nine', script: `
@bg platform
@music neutral
> Platform Nine. The station board still reads 11:52 PM. Every other light is off.
@enter Dyle center
> Dyle stands in front of the empty berth, straightening his chain a link at a time.
Dyle [dots]: No nine-ten. No ten-forty. No noon service. Six hours awake, and not one train.
@enter Tisha left
@enter Rodger right
@enter Vee farright
Tisha [dots]: Dyle?
Dyle [anger]: Yes? Is the train running?
Tisha [dots]: We were going to ask you the same thing.
Dyle [dots]: Since dawn: no train in the berth, a blocked tunnel, a stuck switch—and someone in my cab.
Rodger [dots]: How do you know?
Dyle [dots]: Because the DO NOT lever has been pulled. It has been pulled very hard.
> He lifts his pocket watch. The face is cracked from edge to edge. The hands are frozen at 11:52.
Dyle [dots]: And I do not have the faintest idea when I broke it.
Vee [?]: You don't remember?
Dyle [dots]: I logged Arthur's closure. The lights went out. Then it was dawn, and my chain was around the signal post.
Rodger [dots]: May I look at the post?
Dyle [dots]: It is at the end of the platform. Do not touch the chain.
@sfx step
@exit Dyle
@move Tisha left
> The signal post is bent as if someone had hung from it. Chain-link marks are pressed into the metal in a pattern that matches Dyle's own.
Rodger [dots]: These marks were made by your chain, Dyle.
@enter Dyle right
Dyle [shock]: That is not possible.
Rodger [dots]: It is documented. Something heavy braked hard on this track. Something with your chain stood in the way of it.
Dyle [dots]: ...A train. Stopping.
Dyle [dots]: Nothing stops my train. I would have remembered.
@enter Gigi farleft
Gigi [dots]: Hey, Dyle? I found this by the schedule board.
> She holds up the cracked ID badge. VERONICA HURLEY.
Dyle [dots]: ...That is a staff pass. A Handler's.
Vee [dots]: Veronica's.
Dyle [dots]: Veronica Hurley rode once. Too loud, she said. Asked if I could cancel the whistle. I said no.
> Dyle takes the badge gently. His hands are very precise. They are very slightly shaking.
Dyle [dots]: If this is my track, the Handlers took my train in a hurry. I never logged it.
Tisha [dots]: Dyle... What if the thing that stopped the train... was you?
Dyle [anger]: I would never.
Rodger [dots]: Not you, perhaps. But something that looks very much like you.
@sfx tw_dyle_spot
@fx glitch
> At the far end of the platform, a pair of headlamps flick on. They are the colour of old brass.
@fx alarm
@music twisted
> A figure steps out of the tunnel with a chain trailing behind it. A pocket watch swings on its chest. The watch is whole.
@enter TwistedDyle farright
TwistedDyle [dots]: ...Platform nine.
Dyle [shock] (tremble): That is... my chain. That is my watch.
TwistedDyle [dots]: ...The eleven fifty-two. You are late.
Dyle [anger] (shake): That is MY line.
@fx shake
@sfx tw_dyle_attack
> The tunnel lights burst one after another. The figure starts to run.
Tisha [shock] (jump): It's coming!
Dyle [anger]: Then it will be on time for the last time. Everyone off the tracks!
` },

/* =================================================================== 8 */
c2s8: { title: "Dandy's Shop", time: '6:00 PM', date: 'JULY 6, 2002', place: 'Gardenview Lobby', script: `
@bg sign
@fx calm
@music shop
> Evening. The lobby is quieter than it has been all day. Someone has dragged the front counter into the middle of the room.
@enter Sprout left
@enter Cosmo right
Sprout [sweat]: That's the last of the flour.
Cosmo [dots]: And the last of the butter. We can make one more tray.
Sprout [dots]: One tray for forty Toons.
Cosmo [dots]: Sixty if Shrimpo takes his usual two.
Sprout [tears]: Cosmo, we don't have anything to feed anyone tomorrow.
@sfx dandy_entrance
@fx petals
@enter Dandy center
Dandy [sparkle]: Fear not, bakers! The shop opens in precisely ninety seconds.
Cosmo [?]: The shop?
Dandy [sparkle]: My shop! The finest selection of everything. Prices are fair. Rules are simple.
> Dandy sets out a ledger, register and lacquered boxes sealed with paper. His hand-lettered sign swings: DANDY'S SHOP. NOW OPEN.
Rodger [dots]: You have supplies?
Dandy [dots]: The shelves were full when I came to. Bandages, candy. More in the sealed boxes. I did not stock any of it.
Vee [?]: You didn't?
Dandy [dots]: I woke up to a restocked shop. Isn't that nice? It is almost as if someone had been looking after me.
> Rodger looks at the price tags. Every seven has a small crossbar through it.
Rodger [dots]: Dandy. Do you cross your sevens?
Dandy [dots]: I do not.
Rodger [dots]: These are crossed.
Dandy [dots]: Then somebody else has been writing in my shop.
> Neither of them says what that means.
@enter Tisha farright
Tisha [?]: Why are those boxes sealed?
Dandy [dots]: The register won't let me sell what's inside. Each seal names a room downstairs. One even says HARD, in very stern letters.
Rodger [dots]: A shop with a map of our route. Convenient.
Dandy [dots]: I didn't say I liked it.
Tisha [dots]: And what do we pay with?
Dandy [sparkle]: Ichor, naturally! Black Ichor. The only currency a Toon can truly spend.
Shelly [?]: We don't have any Ichor.
Dandy [dots]: Your boots and seams are full of Ichor. The building's been generous this week.
Vee [dots]: That is the creepiest sales pitch I have ever heard.
Dandy [sparkle]: Thank you. I have been rehearsing.
Sprout [dots]: Dandy... can we afford flour?
Dandy [heart]: Flour, butter, honey, sugar. For our heroes, bandages and candy. The sealed stock must wait.
Cosmo [dots]: And... if we need it?
Dandy [sparkle]: Then I will find a way to have it. I always do.
> He taps the register. It makes a very cheerful sound. A thin strip of paper curls out.
Rodger [?]: What's that?
Dandy [dots]: A receipt. It says I sold forty-one things this week.
Rodger [dots]: To whom?
Dandy [dots]: It does not say. Isn't that odd?
> Rodger reads the strip twice and tucks it into his notebook.
@enter Goob left
Goob [heart]: Do we get free samples?
Dandy [sparkle]: Of course! Two tapes. Found in the till when I woke. I am told they are educational.
@sfx ding
> He hands Rodger two cassette tapes labeled in crossed-seven handwriting. OPENING DAY, 1987. HANDLER ORIENTATION.
Shelly [sparkle]: Ooh! Archives!
Dandy [sparkle]: The shop also takes requests, within reason. If you need something, ask. If you need something very specific, ask quietly.
Cosmo [dots]: We'll take flour. And whatever you can spare for Sprout's kitchen.
Sprout [heart]: Cosmo!
Cosmo [blush]: I'll help you carry it. I'm good at carrying.
Sprout [heart]: I know you are.
Dandy [dots]: The register is open. Spend freely. Spend wisely. Spend before the shelves change their minds.
@exit Dandy
@exit Sprout
@exit Cosmo
Rodger [dots]: Tisha. Did you notice?
Tisha [dots]: He didn't look at the Ichor on his gloves once.
Rodger [dots]: Neither did he look away from it. As if it were part of his hands.
Vee [dots]: He's hiding something.
Rodger [dots]: Or he's forgotten it. I have not decided which is worse.
> The register chimes again. It has not been touched.
` },

/* =================================================================== 9 */
c2s9: { title: 'Lights Out', time: '6:30 AM', date: 'JULY 7, 2002', place: 'Staff Wing', script: `
@bg library
@fx dark
@music unknown
> Sunday. The staff wing has no windows and, this morning, no lights.
@enter Tisha left
@enter Connie center
@enter Rodger right
Tisha [dots]: Third circuit breaker this morning. The lights go out in the staff wing every night and come back on at dawn.
Rodger [dots]: Every night.
Connie [dots]: I can see in the dark, you know. Perks of being dead. This dark is just rude.
@enter Brightney farright
@sfx sparkle
@fx light
> A bright, warm glow floods the corridor. Brightney steps into it as if she had been born inside it.
Brightney [sparkle] (jump): Somebody called for a lamp?
Tisha [heart]: Brightney! You are a very welcome sight.
Brightney [dots]: The breakers aren't broken. They've been thrown from underneath. Somebody's switching the staff wing off at night so nobody walks through it.
Rodger [dots]: Who knows the wiring?
Brightney [dots]: I do. And whoever did this knew it better.
Connie [sweat]: Brightney, you're a lifesaver. Figure of speech. Obviously. Can we go somewhere with a window? For, uh, the ambience.
Brightney [dots]: I'll walk in front. You walk behind. Anything that moves in the dark moves in my light.
@sfx pebble_talk
@enter Pebble farleft
Pebble [!] (jump): Bark!
Brightney [?]: Pebble?
Pebble [dots]: Bark.
> He sniffs the carpet, then the wall, then the vent. He pulls Tisha's cuff toward the end of the corridor.
Tisha [dots]: He has a scent.
Rodger [dots]: What does it smell like?
Pebble [dots]: ...Bark.
Rodger [dots]: I think that means varnish. I think it also means wax. I think it means Boxten.
Connie [dots]: Of course it does. Why would it be anything cheerful.
@sfx step
@music interesting
> Brightney lifts her light. The wall at the end of the corridor is covered in chalk marks, small and neat, in groups of five. Each group is crossed through.
Rodger [dots]: Tally marks.
Tisha [?]: How many?
Rodger [dots]: Eight groups of five. Plus one. Forty-one.
Connie [shock]: Forty-one? That's us. That is every single one of us. Great. Love that.
Rodger [dots]: Astro said something this week. He said somebody was counting in his dream. Slowly. He couldn't hear the number.
Brightney [dots]: It's forty-one.
Rodger [dots]: It's forty-one.
Tisha [dots]: There are forty-one Toons in Gardenview.
> Nobody likes the arithmetic. The tallies end exactly at the base of the wall. Below the last group is a handprint. It is too large and too black.
Connie [sweat]: Okay, I pull pranks, I don't sit in them. Can we go now?
@fx alarm
@sfx warn
@music twisted
> Down the corridor, the lights flicker out again. Two pairs of eyes open in the dark where there were none before.
Brightney [anger] (shake): Stay behind me. All of you.
Rodger [dots]: Brightney...
Brightney [anger]: They don't get to switch me off.
@fx flash
` },

/* ================================================================== 10 */
c2s10: { title: 'Dig Site', time: '10:20 AM', date: 'JULY 7, 2002', place: 'The Annex', script: `
@bg artist
@fx calm
@music interesting
> The Annex used to be a storage wing. Somebody has knocked a hole in the back wall. Behind it, the corridor goes down.
@enter Shelly center
Shelly [sparkle] (jump): Dig site! A genuine dig site! I have never been so happy to be in a basement.
@enter Rodger left
@enter Tisha right
@enter Brightney farright
Rodger [dots]: Shelly. Slowly.
Shelly [dots]: I am being slow. I am being so careful that I'm vibrating.
Brightney [dots]: What are we looking at?
Shelly [idea]: Strata. Look. The Ichor on the floor is laid down in layers, like rock. Each one is a thin black line.
> She runs a claw along the wall. The black residue peels in thin sheets. She counts them.
Shelly [dots]: One, two, three, four, five. Five layers.
Rodger [dots]: Five days.
Shelly [dots]: One layer per day. Something was growing here for five days. Drying a little every night. Like a coat of varnish.
Tisha [dots]: Growing.
Shelly [sparkle]: That's my professional opinion! It's not a spill. It's a cast!
> She points deeper into the Annex. A row of upright, empty shells stands against the wall, each the size and shape of a Toon. Their insides are glossy and black.
Rodger [dots]: Husks.
Brightney [dots]: Like pupae.
Shelly [dots]: Like moulds. They poured something into them. Something that had a lot of Ichor in it.
@sfx step
> Each husk has a paper tag wired to its shoulder. Rodger reads the nearest.
Rodger [dots]: BOXTEN. CAST UNIT TWO. RELEASED 07/01. LOBBY.
Tisha [dots]: That's the one we fought.
Rodger [dots]: Unit Two. Not Unit One. So there is a Unit One. Or there was.
Brightney [dots]: And these?
> She tilts her lamp. The shells go back in rows, further than the light reaches.
Rodger [dots]: DYLE. UNIT TWO. RELEASED 07/05. PLATFORM. GLISTEN. UNIT TWO. RELEASED 07/05. ART FLOOR.
Shelly [dots]: There are a lot of these.
Tisha [dots]: There is one with a very familiar ribbon.
> Tisha stops in front of a shell near the end of the row. A tissue-box shape. A small, careful frill.
Tisha [shock] (tremble): TISHA. CAST UNIT TWO. RELEASED 07/01. ...
Tisha [dots]: That's me.
Brightney [dots]: No. That's the husk. It's empty.
Tisha [dots]: Which means it left. Which means there's another me out there somewhere. Walking around. Wearing my ribbon.
Shelly [dots]: Or there was.
Tisha [dots]: Is that supposed to help?
Shelly [sweat]: ...Probably not.
Rodger [dots]: Tisha. I want you to look at me.
Tisha [dots]: I'm looking.
Rodger [dots]: You're Tisha. You woke on a desk, cleaned someone else's mess, and taught two Toons to fight. Nobody scripted that.
Tisha [dots]: ...Thank you.
Rodger [dots]: It's not kindness. It's observation.
Tisha [dots]: It sounded like kindness.
Rodger [blush]: I will log it as both.
> In the dust at the foot of the last husk, a metal sign leans against the wall. Brightney’s light catches on its enamel.
Brightney [dots]: Here's a sign. RESERVE. SUBLEVEL THREE. SEE D.K. FOR ACCESS.
Rodger [dots]: D.K.
Shelly [?]: Dandy... something K?
Rodger [dots]: Dandy has no surname. At least, none anyone has ever heard.
Tisha [dots]: Delilah Keen.
@sfx warn
Rodger [dots]: Delilah. The co-founder. Who supposedly knew about none of this.
Tisha [dots]: Who said, in her statement, the pressure failed by accident.
Shelly [dots]: And who has been entirely absent for a week.
@music twisted
@fx shake
> A grating sound from the far end of the Annex. Something is dragging a very heavy crate toward them.
Brightney [dots]: Company.
Rodger [dots]: Of course. They always arrive just after the interesting part.
` },

/* ================================================================== 11 */
c2s11: { title: 'Mirror, Mirror', time: '3:15 PM', date: 'JULY 7, 2002', place: 'The Art Floor', script: `
@bg art
@fx calm
@music neutral
> The art floor. A circular stage of red felt sits under a broken skylight. A long wall of mirrors surrounds it.
@enter Glisten left
Glisten [anger] (shake): Smeared. Fogged. Cracked! This mirror is art, and someone treated it like a window!
@enter Teagan right
Teagan [note]: Glisten, dear. Tea?
Glisten [anger]: I am too furious to drink.
Teagan [heart]: Then it is exactly the right time. Chamomile.
Glisten [sweat]: ...Fine. One cup.
@enter Flutter farright
> Flutter flaps its wings once and points to the mirror. Then to Glisten. Then to the mirror again. It does the same thing twice, faster.
Glisten [?]: What? What is it?
@enter Rodger center
Rodger [dots]: Flutter noticed something. May I?
Glisten [dots]: By all means. Be thorough. Be gentle. These are family heirlooms.
@enter Vee farleft
@sfx hero_vee_talk
Vee [dots]: I've been reviewing the art floor footage. There's something in the mirror delay.
Rodger [dots]: Show me.
> Vee holds up a small camera. On its monitor, the mirror wall plays back the room with a faint tremble.
Vee [dots]: Watch Teagan's teacup. Watch her hand.
Teagan [?]: Mine?
> Teagan lifts her cup. In the mirror, the reflection lifts hers. A quarter of a second later.
Teagan [shock]: Oh my.
Glisten [shock] (tremble): That is... that is not how mirrors behave.
Rodger [dots]: Observation. The reflection is a quarter-second behind. That is not light. That is someone watching and copying.
@fx glitch
@sfx spectral
> In the mirror, Glisten's reflection smiles. The real Glisten is not smiling.
Glisten [shock] (tremble): That's not me.
Flutter [!]: ...!
> Flutter flaps frantically at the glass. The reflection of Flutter does not flap.
Vee [dots]: Everybody away from the wall.
Rodger [dots]: Away from the glass. Slowly.
@fx alarm
@music boss
@sfx shatter
> The glass cracks. One long split runs from corner to corner. The reflection of Glisten steps out of it, carrying its own mirror like a shield.
@enter TwistedGlisten center
TwistedGlisten [dots]: ...Seven... Years...
Glisten [shock]: I am not a seven-year anything!
TwistedGlisten [anger]: ...Bad luck...
@fx flash
@sfx shatter
Teagan [dots]: Oh, dear. I think the tea has gone cold.
Rodger [dots]: Vee. Keep the camera on. I want every frame.
Vee [dots]: Camera's rolling. Try to look like you meant it, everybody. This is going to be my best episode.
Vee [anger]: Let's go live.
` },

/* ================================================================== 12 */
c2s12: { title: 'The Humming', time: '11:50 PM', date: 'JULY 7, 2002', place: 'The Planetarium', script: `
@bg astro
@fx dark
@music emotional
> Sunday night. The lobby is quiet. Most of Gardenview is asleep. Astro is not.
@enter Astro center
Astro [dots] (tremble): It's the humming again.
@enter Sprout left
Sprout [dots]: Astro? You should be in bed.
Astro [dots]: I can't sleep. Do you hear it?
Sprout [dots]: Hear what?
Astro [dots]: A lullaby under the floor. Mine. I hum it when I can't sleep.
Sprout [?]: I don't hear anything, kid. Come on, bed. I'll walk you.
Astro [dots]: I know. That's what's wrong. It's inside my head. And inside the walls.
@exit Sprout
@enter Tisha right
Tisha [dots]: I'm up for a glass of water. I'm also up because I stopped believing in sleep a day ago.
Astro [dots]: Tisha. Can I show you something?
> He leads her through the dark. The lobby, the stairwell, the arched door. The Planetarium.
@sfx step
@enter Rodger left
Rodger [dots]: I was already on my way. The humming is on Vee's recording. It's coming from beneath the dome.
Astro [dots]: I think I know why.
> The great projector at the center of the dome is dark. Beneath it, a cabinet door hangs open. Inside, a small reel-to-reel recorder turns by itself.
Astro [dots]: That's... my voice.
@sfx hero_astro_talk
> The tape hisses. A slow lullaby hums out of the speaker. It is exactly Astro's lullaby.
Astro [tears]: I didn't sing it. I was asleep.
Rodger [dots]: Somebody recorded you. While you slept.
Tisha [dots]: Why would they do that?
Rodger [dots]: To calm you. To put a Twisted back to sleep. Or to wake one up.
@fx static
> The reel clicks. A new voice comes through the speaker. A familiar voice.
@music delilah
Dandy~: ...Boxten. Astro. Pebble. Devan. If any of you can hear me, stay where you are.
Tisha [shock]: That's Dandy.
Dandy~: I can still move the Ichor through these lines. There may be a way to reach you.
Rodger [dots]: Listen.
Dandy~: All right. Let's see what this one does.
> A mechanical clunk. A low, gentle hum begins beneath the recording. Under it, another voice speaks, calmer than the first.
Dandy~: Counting begins.
@stop
Rodger [dots]: Two voices.
Tisha [?]: Two?
Rodger [dots]: Same throat. Slightly different pitch. One spoke before the machine started. The other afterwards.
Astro [dots]: I remember that voice. In my dream. It counted, slowly, all the way to forty-one.
Tisha [dots]: Forty-one. Again.
Astro [dots]: I think... it was counting us. As we woke.
@fx shake
@sfx metal_hit
@music twisted
> Above them, the dome lights go out. One by one, the stars on the ceiling blink off.
Astro [shock] (tremble): It knows I'm here.
Rodger [dots]: Astro. Stay behind us.
Astro [dots] (nod): No.
Astro [dots]: It's my lullaby. It doesn't get to use it against me.
> His eyes open all the way. He looks entirely awake for the first time in a week.
@fx flash
` }

});

;

/* ===== js/story/ch2-script-c.js ===== */
/* ch2-script-c.js - Main Story · Chapter 2 "Business as Usual", scenes 13-18. */
'use strict';

Object.assign(ST_STORY, {

/* ================================================================== 13 */
c2s13: { title: 'Off the Record', time: '1:10 AM', date: 'JULY 8, 2002', place: "Dandy's Shop", script: `
@bg sign
@fx calm
@music shop
> The shop closed hours ago. The register still glows. Dandy sits behind it, counting something under his breath.
@enter Dandy center
Dandy [dots]: ...thirty-nine. Forty. Forty-one. Forty... no. Forty-one. Always forty-one.
@enter Rodger left
@enter Vee right
@enter Shelly farleft
@enter Tisha farright
Rodger [dots]: Dandy.
Dandy [sparkle]: Detective. A late customer. What can the shop do for you?
Rodger [dots]: We need to talk. Off the record.
Dandy [dots]: I have only ever been on the record. It is the sort of Toon I am.
> Vee sets a small tape recorder on the counter. She presses play.
@sfx hero_vee_talk
> The tape hisses. Dandy's own voice comes out of it. "If any of you can hear me, stay where you are." Then a pause. Then: "Counting begins."
> Dandy listens without moving. When it ends, his gloved hand rests flat on the counter.
Dandy [dots]: That is my voice.
Rodger [dots]: Yes.
Dandy [dots]: The first part is mine. I know how I say Pebble. The second has my voice, but not me.
Vee [dots]: Not the same man?
Dandy [dots]: I've hardly spoken this week. That voice has spoken plenty.
Shelly [?]: What do you remember?
Dandy [dots]: The valve. I held it until my gloves came off. Then the doors shut. I was so sorry.
Rodger [dots]: And then?
Dandy [dots]: Then full shop shelves and a quiet morning. Between them, a blank wall.
> His voice is level. His hand is not.
Dandy [dots]: They say a week passed. It feels like someone held my place.
Tisha [dots]: Dandy, did you build the copies?
Dandy [shock]: Copies.
Tisha [dots]: Replicas. There are Twisteds in the building, and they look like us. We found the moulds in the Annex.
Dandy [dots]: I did not build them.
Rodger [dots]: You cross your sevens.
Dandy [dots]: I do not.
@sfx ding
> He takes a pen from the counter and writes a seven. A plain, uncrossed seven. He turns the page toward Rodger.
Dandy [dots]: There. Is that the hand of a man who stocks shelves in his sleep?
Vee [dots]: It's very clear.
Rodger [dots]: It is also not the hand on the price tags.
Dandy [dots]: Then I suspect we have two different hands. And I suspect only one of them is mine.
> Silence.
Rodger [dots]: Dandy. Do you think you're the one doing this?
Dandy [dots]: ...I have asked myself that for two days. I have not yet found a reason to say no.
Shelly [tears]: That's the saddest thing I've ever heard.
Dandy [sparkle]: Thank you, dear. I'll put it on the shelf with the other sad things.
Rodger [dots]: I think you don't know.
Dandy [dots]: That is the most generous thing anyone has said to me this week.
> He opens a drawer and takes out a brass key on a red cord. A paper tag reads X-MAS.
Dandy [dots]: This was in the register. I did not put it there. It opens the freight lift in the Toy Workshop.
Tisha [?]: The Christmas floor?
Dandy [dots]: Below sublevel two? Sealed service stairs, or the old lift the Christmas Toons use for their sleigh.
Rodger [dots]: You think the Reserve is down there.
Dandy [dots]: A secret belongs where nobody asks questions. Nobody asks the Christmas floor.
Vee [dots]: Why are you helping us?
Dandy [dots]: Because I sell things. And I have noticed that something has been selling me.
@exit Dandy
@fx calm
Tisha [dots]: Do we trust him?
Rodger [dots]: I trust his hands. I trust the way they shook. I do not trust the register.
Vee [dots]: The register chimed on its own twice today.
Rodger [dots]: Then the register is the most honest thing in the building.
@sfx ding
` },

/* ================================================================== 14 */
c2s14: { title: 'Costume Floors', time: '9:30 AM', date: 'JULY 8, 2002', place: 'The Seasonal Floors', script: `
@bg easter
@fx calm
@music neutral
> The Seasonal floors are the quietest in Gardenview. Each holiday has its own wing. In July, none of them is expecting company.
@enter Bassie left
@enter Eggson right
Bassie [note] (jump): Visitors! In July! Eggson, put the cane down. It's company.
Eggson [dots]: I have been holding it since 1974. It can wait.
Bassie [heart]: Come in, come in. We have jelly beans, the good ones.
@enter Rodger center
Rodger [dots]: Thank you, but we're looking for the Christmas floor.
Bassie [dots]: Oh, the freight lift. Of course. Nobody ever asks about the freight lift.
Eggson [dots]: Nobody has been up there for a week. The elevator won't answer.
Bassie [dots]: It rings. And then it just... thinks about it.
@enter Bobette farleft
Bobette [!] (jump): Rodger! Thank goodness. Ginger, Rudie, and Coal are hiding upstairs. Cocoa and Flyte went out for food and never came back.
Bassie [dots]: Bobette's been looking for help all morning.
Bobette [dots]: I should've found someone sooner. Here, take this. The lift gets awfully dark.
> Bobette puts a small gift-wrapped lantern into Rodger's hands. A tag on it reads FOR WHEN IT GETS DARK.
Rodger [dots]: Thank you. This is... unexpectedly thoughtful.
Bobette [heart]: I even put a bow on it. Habit. Please bring them home.
@exitall
@bg halloween
@music twisted
> The stairs up to the Halloween floor smell of wet leaves. A large steel Toon is standing at the landing, looking at them over his shoulder.
@enter Soulvester center
Soulvester [dots]: Halt. Who goes there?
@enter Gourdy left
Gourdy [heart] (jump): Rodger! You're here! It's okay, Soulvester, they're friends!
@enter Eclipse right
Eclipse [sparkle]: More friends for the pack! Hi! Are you all okay? This floor's been weird all week.
Rodger [dots]: We're all right. We're looking for the freight lift. Has anyone come through here?
Eclipse [dots]: I've caught a strange scent on the stairs, but I can't tell where it goes.
@enter Ribecca farright
Ribecca [dots]: Something is unfinished on the stair. The bones have been telling me all week.
Rodger [?]: Telling you what?
Ribecca [dots]: That the stair is not empty. It is just waiting.
> She hands Rodger a folded yellow sheet. It is a typed memo, creased and very old. SEASONAL HALL MINUTES.
Ribecca [dots]: It was in my case. Under the rattle. I think somebody wanted me to find it.
@sfx ding
Rodger [dots]: This says the Seasonals hide in the off-months. The Christmas Toons especially.
Ribecca [dots]: Usually their silence means nothing. In July, it means something.
Gourdy [dots]: Soulvester's been guarding the stairs every night. I told him he should get some rest!
Soulvester [dots]: My liege, a knight does not abandon his post. Not while you are in danger.
Gourdy [dots]: But you matter too, Soulvester.
Soulvester [dots]: Your concern is noted. I shall rest when my watch is done.
@fx alarm
@sfx earth_quake
> At the top of the stairs, a shape unfolds. It is as broad as Soulvester and exactly the same colour. It does not blink.
@enter TwistedSoulvester farright
Gourdy [shock] (shake): Soulvester? That's not you, right?!
Soulvester [dots]: Nay. Stay behind me, my liege.
Eclipse [!] (shake): I've got you, Gourdy! Nobody gets past our pack!
> Soulvester does not move. He does not need to. His twin lowers its fist, and the staircase groans.
Ribecca [dots]: Rodger. The Christmas floor is above this landing.
Rodger [dots]: Then we go through it.
@music colossus
` },

/* ================================================================== 15 */
c2s15: { title: 'Cold Floor', time: '12:05 PM', date: 'JULY 8, 2002', place: 'The Christmas Floor', script: `
@bg christmas
@fx dark
@music silentnight
> The Christmas floor is freezing. A white drift of artificial snow covers every surface. The tree in the middle of the room is still lit, though nobody has plugged it in.
@enter Rodger left
@enter Tisha center
@enter Brightney right
Tisha [dots] (tremble): Why is it so cold? This is July.
Brightney [dots]: Seasonal climate. Their snow keeps the floor in the right mood, even when nobody's using it.
Rodger [dots]: Something has been here. The snow is trampled. By small feet.
@sfx step
> Behind the tree, a gift box the size of a stool wobbles. Its lid lifts one inch. Two bright eyes look out.
Tisha [?]: ...Hello?
@enter Rudie farleft
Rudie [!] (jump): Are you them?
Tisha [dots]: Who?
Rudie [shock]: The DANDY ones!
Rodger [dots]: No. Bobette sent us. We're here to help.
Rudie [sparkle] (jump): BOBETTE FOUND HELP! Ginger! Coal! Come out! Merry Christmas!
@enter Ginger right
Ginger [dots]: Rudie, please... could you keep your voice down?
Rudie [dots]: I am! This is my quiet Christmas voice.
@enter Coal farright
> A small, heavy, grey shape shuffles out from behind the tree. Coal sniffs Tisha's shoe, then sits on her foot and stares.
Coal [dots]: Grr...
Tisha [dots]: Hello. Is she okay?
Ginger [dots]: She's checking your scent. I think she's decided you're safe.
Tisha [dots]: I'm real.
> Coal considers this. She remains on Tisha's foot, which is clearly the verdict.
Rodger [dots]: How long have the three of you been hiding?
Ginger [dots]: Since Tuesday night. Bobette went for help this morning. We stayed here when the snow turned black.
Rudie [dots]: Black snow! That's not how Christmas snow is supposed to look!
Brightney [?]: What did you see?
Ginger [dots]: Toons filed past our window all night, toward the freight lift. Their eyes were wrong. We stayed quiet.
Rudie [dots]: And then there was a Dandy.
Rodger [dots]: A Dandy.
Rudie [dots]: Two Dandies! One of them had a clipboard. The other had a mop.
Tisha [shock]: Two?
Ginger [dots]: Yes. One had both gloves on. One had only one.
> Rodger writes the sentence on his notebook slowly. It is not the sentence he expected.
Rodger [dots]: Which one had the clipboard?
Ginger [dots]: The one with both gloves.
Rodger [dots]: And the one with the mop?
Ginger [dots]: He cleaned up after the clipboard one. He was crying.
@fx calm
> Even Rudie is quiet for a moment.
Tisha [dots]: And Cocoa and Flyte?
Ginger [tears]: We were nearly out of food. Cocoa and Flyte went to the diner Sunday night. They promised dawn.
Rudie [tears]: They haven't come back.
Ginger [dots]: I think... I saw two Cocoas. One carried the other toward the lift. The one being carried wasn't moving.
Brightney [dots]: Which one was the real one?
Ginger [dots]: I don't know. I never got a good look.
Coal [dots]: Bwoof...
> Coal stares up at Rodger. She is not speaking. She is very clearly asking.
Rodger [dots]: We're going to the Reserve. Below the freight lift. We're going to find them.
Rudie [sparkle] (jump): I'm coming! I'm very fast. And very brave. And not very quiet!
Ginger [dots]: Rudie.
Rudie [dots]: I am being quiet about it now.
Coal [dots]: Grr... bork.
> She steps off Tisha's foot and positions herself in front of Ginger. It is not a request.
Ginger [heart]: I'll be fine, Coal. You go. Bring them home.
> Coal looks between Ginger and the freight lift for a long moment. Then she marches toward the stairs.
@sfx metal_hit
@music carol
> A grinding sound from the far end of the workshop. The door to the freight lift swings open. Two shapes, one in a scarf and one with wings, step out of the dark.
@enter TwistedCocoa left
@enter TwistedFlyte right
Ginger [shock] (tremble): That's... that's them.
Rodger [dots]: That's not them.
Ginger [tears]: Rodger... that's Cocoa's scarf.
Rodger [dots]: It's the right scarf. It is the wrong Cocoa.
Rudie [anger]: That's Cocoa's scarf! We're getting our friends back!
@fx flash
` },

/* ================================================================== 16 */
c2s16: { title: 'The Reserve', time: '2:40 PM', date: 'JULY 8, 2002', place: 'Sublevel Three', script: `
@bg greenhouse
@fx dark
@music unknown
> The freight lift goes down for a very long time. Then it goes down some more. Then the doors open on a low, wide room that has never been on a floor plan.
@enter Rodger left
@enter Tisha center
@enter Coal right
@enter Rudie farright
Rudie [shock] (tremble): It's so quiet.
Tisha [dots]: It is not quiet. Listen.
> A low, even hum, as if from a thousand throats. It seems to come from below the floor.
Rodger [dots]: Astro's lullaby. It's on loop. It's being played through the walls.
@sfx machine_start
> The room opens out. Row after row of tall cylindrical tanks stand under flickering lamps. Each tank holds a dim black fluid and, in the fluid, the shape of a Toon.
Tisha [shock]: Rodger. They're all... in there.
Rodger [dots]: Not all. Look at the labels.
> A brass plate on the nearest tank reads: UNIT 3 · BOXTEN · DAY 5/5 · EMPTY.
> Another: UNIT 2 · POPPY · DAY 4/5. Another: UNIT 3 · GLISTEN · DAY 2/5.
Tisha [dots]: They're... growing.
Rodger [dots]: These are the Development Tanks. The ones from the old plans. Delilah's tanks.
@fx calm
> A paper pinned to the nearest pillar. It has the heading UNDERSTUDY PROGRAM · FORM 02.
Rodger [dots]: I've heard of this. Understudies. Standby Toons to cover for the real ones during filming.
Tisha [dots]: Filming. Of the show.
Rodger [dots]: Of Dandy's World. Which ran for fifteen years. An actual television show. They needed replacements who didn't tire, didn't glitch, didn't...
Rodger [dots]: ...didn't have personalities.
Rudie [anger]: That's horrible.
Rodger [dots]: It's also on this form. Approved: D.K.
> Rodger turns the paper over. In pencil, on the back, in a small tight hand: "What happens to the ones we don't return?"
Coal [dots]: Grr...
> Coal's growl is so low it sounds like a rock setting down.
Tisha [dots]: Who wrote that?
Rodger [dots]: Somebody who worked here. Somebody who asked a question nobody wanted to answer.
@sfx warn
@fx alarm
@music twisted
> At the end of the row, a lamp comes on. Then another. Then another. A line of dark figures stands between the tanks, perfectly still, perfectly aligned.
@enter TwistedToodles left
@enter TwistedGigi center
@enter TwistedLooey right
Tisha [dots]: Those are the Replicas.
Rodger [dots]: Those are the ones that finished early.
Rudie [dots]: Do we run?
Rodger [dots]: We cannot run. This is the only way down.
Tisha [dots]: Then we walk forward. Together. Eyes on the lamps.
Coal [dots]: Bork!
> Coal plants herself at the front of the party. Nobody argues.
@fx shake
` },

/* ================================================================== 17 */
c2s17: { title: 'The Count', time: '4:15 PM', date: 'JULY 8, 2002', place: 'Reserve Office', script: `
@bg greenhouse
@fx calm
@music emotional
> The Reserve office is a glass booth at the far end of the room. A long desk stands in the middle, covered in papers. Two cots are pushed against the wall.
@enter Tisha left
@enter Rudie center
@enter Coal right
Rudie [shock] (jump): COCOA! FLYTE!
> Two small shapes sleep on the cots under grey blankets. A scarf. A pair of folded wings.
@sfx heal
@enter Cocoa farleft
@enter Flyte farright
> Rudie shakes them gently. Cocoa blinks first. Flyte follows, wide-eyed.
Cocoa [dots]: ...Rudie? Is it still Sunday?
Flyte [dots]: I've got a headache like a bag of snow.
Rudie [tears]: I missed you both so much! Merry Christmas! Sorry, I'm crying.
Cocoa [heart]: Oh, Rudie. Come here.
Coal [dots]: Bwoof.
> Coal climbs onto Cocoa's lap and nudges her hand until Cocoa pets her.
Tisha [heart]: Bobette and Ginger are waiting upstairs. Let's get you both back to them.
Rudie [sparkle]: The whole Christmas crew together again!
@exit Rudie
@exit Coal
@exit Cocoa
@exit Flyte
@enter Rodger center
> Rodger sits at the desk. The papers are laid out in neat stacks. At the top is a green ledger, open to a table of names.
Rodger [dots]: Tisha. Come here. I want a second pair of eyes.
@enter Tisha right
Tisha [dots]: What is it?
Rodger [dots]: A ledger. It lists every Toon in Gardenview. Forty-one names. Each name has a number of Units.
Tisha [dots]: How many?
Rodger [dots]: Boxten has four.
Tisha [shock]: Four?
Rodger [dots]: Unit One, the original. Unit Two: recovered, maintenance wing. That's the one we fought. Unit Three: recovered, this afternoon. Unit Four.
> He puts a finger on the last line. The handwriting is neat. The sevens are crossed.
Rodger [dots]: Unit Four. Released 07/07, six AM. Destination: lobby.
Tisha [shock] (tremble): The lobby. Rodger, that's where Boxten is right now.
Rodger [dots]: Yes.
Tisha [dots]: Which Boxten?
Rodger [dots]: I don't know. The ledger doesn't say.
Tisha [anger]: Then we warn him. We warn everyone in the lobby.
Rodger [dots]: Vee's signal dies between the tanks. We have to get back upstairs.
> He turns the page. A second table. TISHA. UNIT THREE. POD 22. A circled note: GROWING. DAY 3/5.
Tisha [shock]: That's...
Rodger [dots]: A third you. Currently under construction.
Tisha [tears]: I'm being made?
Rodger [dots]: Someone is making another Tisha. That is all the ledger can tell us about you.
@fx shake
> Behind the desk, a pod hums. Inside it, a smear of dark liquid takes the vague shape of a tissue box.
Tisha [dots]: I'm sorry. I'm... I need a moment.
Rodger [dots]: Take it. I'll keep reading.
Tisha [dots]: And if she wakes up, we don't leave her here. She didn't ask for this either.
Rodger [dots]: Agreed.
> He reads. He reads for a long time. The corners of his mouth do not move.
Rodger [dots]: Forty-one Toons. Sixty-three entries. Twenty-seven released. Four recovered. The rest are in the tanks, waiting.
Tisha [dots]: Sixty-three.
Rodger [dots]: And one more name. Not a Toon. Last line of the last page.
> He turns the ledger toward Tisha. The line reads: DEVAN REED. HANDLER. RETAINED. SUBLEVEL FOUR.
Tisha [shock]: Devan. Devan Reed. The Handler who went missing.
Rodger [dots]: Retained. Not lost. Retained.
Tisha [dots]: He's alive.
Rodger [dots]: Somebody wrote him into the ledger. In the same hand. That's all I know.
@sfx ding
@music twisted
> Behind them, the glass booth rattles. A tall figure steps out of the shadow between the tanks, a long coat of black petals trailing behind it.
@enter TwistedDandy center
@fx alarm
TwistedDandy [dots]: Dandy. Unit One. First on the list. Last to be told.
Rodger [dots]: Dandy.
TwistedDandy [sparkle]: Dandy. Yes. That's the name on the label. I wasn't sure it would fit.
Tisha [dots]: You're not the one from the shop.
TwistedDandy [dots]: Nobody is. That's the joke.
> He lifts a brass stamp. It reads, in crossed-seven handwriting, EVERYTHING MUST GO.
TwistedDandy [anger]: A week counting. Forty-one names, sixty-three places. Each one I put to sleep left another awake.
Rodger [dots]: Why?
TwistedDandy [dots]: Because that is what you're for.
@fx shake
Rodger [dots]: Tisha. Get behind me.
Tisha [dots]: No.
Tisha [anger]: This is my building. And somebody keeps tracking ink on my floor.
@fx flash
` },

/* ================================================================== 18 */
c2s18: { title: 'Knock Knock', time: '9:30 PM', date: 'JULY 8, 2002', place: 'Gardenview Lobby', script: `
@bg black
@stop
> The humming stops. It does not fade. It simply ends, as if someone had lifted a needle.
@bg lobby
@fx calm
@music emotional
> The lobby. Evening. The CLOSED sign is still on the door. The ink on the ceiling has stopped dripping.
@enter Tisha left
@enter Rodger right
Tisha [dots]: The tanks drained. All of them.
Rodger [dots]: Not all. The Press is off. The ones that finished are still out there. The ones that were not finished are not.
Tisha [dots]: And me? Pod twenty-two?
Rodger [dots]: Empty. The sample was still wet. I watched it dry.
Tisha [heart]: Thank you.
Rodger [dots]: Observation, not kindness.
Tisha [dots]: It sounded like both again.
Rodger [blush]: I am working on it.
@enter Boxten farright
Boxten [heart]: Oh! You're back. I, um, made some tea. Teagan showed me how. I hope it isn't too hot. Or too weak.
> Rodger turns very slowly. He looks at Boxten for a long time.
Rodger [dots]: Boxten. May I see your key?
Boxten [?]: My key?
Rodger [dots]: Please.
> Boxten turns around and holds out the key. Rodger runs a finger down the teeth. The third one has a notch.
Rodger [dots]: ...It's notched.
Boxten [?]: Is that good?
Rodger [dots]: It is very good.
Tisha [dots]: The copy in the maintenance wing had a smooth key. Yours still has the little mark from when you dropped it.
Boxten [heart]: Oh. Then... I'm glad. I was a little worried it might have been me.
Tisha [tears]: Thank you for being you.
Boxten [blush]: I try. Mostly I try not to break anything.
@exit Boxten
Rodger [dots]: Unit Four is still unaccounted for. We tell Vee, then we tell everyone.
Tisha [dots]: And if we find him, we listen before we fight. He may be as frightened as we were.
@enter Dandy center
@sfx dandy_text
Dandy [dots]: There you are. You were gone a long while.
Rodger [dots]: We found the Reserve.
Dandy [dots]: I thought you might. The register told me.
Tisha [?]: The register?
Dandy [dots]: It chimed. Four times. Just before you came back up.
@enter Vee left
Vee [dots]: Dandy... we met a Dandy down there.
Dandy [dots]: I would have been surprised if you hadn't.
Rodger [dots]: Which one are you?
> Dandy takes off one glove. The hand under it is clean and pale. He turns it palm up on the counter.
Dandy [dots]: I am the one who runs a shop. That is all I know how to answer.
Rodger [dots]: ...That's not enough.
Dandy [sparkle]: No. But it is honest. And that, I think, is the best offer you will get from anyone tonight.
@exit Dandy
@sfx pebble_talk
@enter Pebble farleft
Pebble [!] (jump): Bark! BARK!
Tisha [?]: Pebble?
> He tugs her sleeve toward the lower stair. He does it again. He does not stop.
@sfx step
@bg greenhouse
@fx dark
> The lower blast door. The old one that closed on June twenty-fourth. Pebble has been sleeping in front of it all week.
@enter Tisha left
@enter Rodger center
@enter Pebble right
Tisha [dots]: What's he doing?
Rodger [dots]: He's listening.
@sfx metal_hit
> From the other side of the door, three slow taps.
Tisha [shock]: ...Did you hear that?
Rodger [dots]: Again.
@sfx metal_hit
> Three taps. A pause. Three more.
Pebble [!] (jump): BARK!
> Pebble throws himself against the door. It does not move. He bays at it until his voice cracks.
Tisha [dots]: Someone's alive down there.
Rodger [dots]: "Retained." Not lost.
@fx calm
@music silentnight
@sfx tw_dyle_spot
> Far above them, through the whole thick weight of the building, a long clear whistle sounds. It is a very specific whistle. The eleven fifty-two.
@enter Dyle farright
Dyle [shock]: That is my train.
Rodger [dots]: It's coming back.
Dyle [dots]: I did not authorise a return.
Tisha [dots]: Dyle.
Dyle [dots]: Yes?
Tisha [dots]: I think it's on time.
@fx whiteout
@stop
@card END OF CHAPTER 2 · BUSINESS AS USUAL
` }

});
