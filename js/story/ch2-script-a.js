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
Sprout [heart] (jump): Breakfast in ten minutes! Cosmo, the oven's on its last third of flour.
Cosmo [dots]: I counted. We have a day and a half of flour, two days of butter and an extra muffin.
Sprout [?]: Why an extra muffin?
Cosmo [blush]: In case somebody needs it.
Sprout [heart]: That's the best reason I've ever heard.
> Behind them, the pantry shelves are mostly empty. Both bakers carefully do not look at them.
@enter Shrimpo farleft
Shrimpo [anger]: Good morning, and I want it on record: I have never seen so much ink on a ceiling.
Cosmo [dots]: Good morning, Shrimpo.
Shrimpo [anger]: It's in my shell. It's in my antennae. It's on my toast! Somebody get a manager!
Sprout [sweat]: The managers are... closed.
Shrimpo [anger]: Then I want it on the record that I'm unhappy about it!
@enter Finn farright
Finn [note] (jump): Hey hey! Did anybody else notice the lights weren't on at all? I was telling Gigi. She said nobody believes her about anything, so I figured I'd start telling people.
Sprout [dots]: Finn, sit down. Eat something.
Finn [note]: Oh! Don't mind if I do. Did I tell you about the fish I saw by the fountain? Okay, so, it wasn't a fish exactly...
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
Sprout [heart]: Astro! Sit. You look like you haven't slept in a month.
Astro [dots]: I slept all night. I think. It felt like more than a night.
Cosmo [?]: Bad dreams?
Astro [dots]: Just one. A kind of humming. And somebody counting. Slowly.
Sprout [dots]: Counting what?
Astro [dots]: I don't know. I couldn't hear the number. Only that it kept going up.
Sprout [heart]: Eat. It's only a dream.
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
Connie [shock] (tremble): B... Boxten?
TwistedBoxten [dots]: ...One. Two. Three...
@fx glitch
> His key does not make a sound. His smile has too many teeth.
Connie [!] (shake): No. No no no. He's twisted again!
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
Boxten [heart]: ...and then I said, if everything is going to be a little bit broken, we might as well make it a nice sort of broken.
Goob [heart] (jump): That's beautiful, Boxten!
Scraps [note]: Very beautiful! I'm going to cut it up and reuse it.
Tisha [dots]: We have three more boxes to carry. And a shelf that doesn't match the others.
@sfx pebble_talk
@enter Connie farleft
Connie [!] (shake): TISHA!
Tisha [shock]: Connie? What's the matter?
Connie [shock] (tremble): There's a Twisted. At the end of the corridor. It's Boxten!
Boxten [?]: I'm... right here, Connie.
Connie [dots] (tremble): I know. That's what's wrong.
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
Scraps [anger]: You scared my friend.
@sfx swing_light
> She does not so much run as unwind. Her arm stretches ten feet down the corridor and snaps back, dragging a splintered box lid with it.
Tisha [shock]: SCRAPS?
Scraps [sparkle] (jump): I'm doing a thing!
@fx flash
Connie [dots]: I'm... going to float behind Tisha. If that's okay.
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
Vee [dots]: You're late.
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
Vee [dots]: I found it in the hard drive's dead sector. It's old. It's from the day of the surge, the twenty-fourth. Somebody adjusted a camera by twelve minutes at six o'clock that morning.
Tisha [?]: The twenty-fourth. That's...
Rodger [dots]: The day before the center closed, apparently. We woke up on the sixth. We remember Arthur's announcement. That announcement is also dated the twenty-ninth.
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
