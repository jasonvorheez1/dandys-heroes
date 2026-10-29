/* story-script.js - Main Story · Chapter 1 "The Malfunction".
   June 24, 2002. The day Gardenview broke.
   Script lines (one per line):
     @bg key            @music key / @stop      @sfx cue
     @enter Who slot    @exit Who / @exitall    @move Who slot
     @fx shake|flash|alarm|calm|ink|dry|dark|light|glitch|static|heartbeat|nobeat|petals|tv|notv|blackout|whiteout
     @card TEXT         a line of text alone on black
     @wait ms           @choice A | B   (following "1>" / "2>" lines belong to that option)
     > narration        Who [emote] (anim): dialogue
   Slots: farleft left center right farright. Twisted Toons are "TwistedName". */
'use strict';

const ST_STORY = {

/* =================================================================== 1 */
s1: { title: 'Opening Bell', time: '7:58 AM', place: 'Gardenview Lobby', script: `
@bg lobby
@music bossa
> Gardenview Educational Center and Museum. June 24, 2002. The first summer group arrives at ten.
> A pipe knocks behind the lobby wall. Devan glances at the damp patch beneath the Research door.
@enter Devan left
Devan [note] (jump): Morning. If anybody asks, I've been here since seven.
@enter Veronica right
Veronica [dots]: The time clock says seven fifty-eight.
Devan [sweat]: Then the clock and I have different opinions.
Veronica [dots]: Arthur asked for you twice. Dandy's already changed the shop display.
Devan [dots]: Of course he has.
@enter Pebble farleft
@sfx pebble_talk
> Pebble skids across the lobby and bumps Devan's boot.
Devan [heart] (jump): There you are. Did Dandy send you to fetch me?
Pebble [heart] (jump): Bark!
Veronica [sweat]: He's eating your lace.
Devan [heart]: Better my boot than the gift shop again.
@enter Vee center
@sfx hero_vee_talk
Vee [note] (nod): Morning, Veronica. My studio camera is still pointed at the wall.
Veronica [dots]: I'll call maintenance.
Vee [anger]: You said that yesterday.
Veronica [sweat]: I know.
@exit Vee
@exit Pebble
@enter Sam farright
Sam [sweat] (tremble): The kitchen extinguisher's empty. Again.
Devan [?]: Sam? You're covered in flour.
Sam [dots]: Sprout and Cosmo made welcome muffins. Sprout counted twenty-three. Cosmo made an extra, just in case.
Veronica [?]: And?
Sam [dots]: I shut the oven off. The knocking kept going behind it.
Devan [dots]: I heard it in the lobby, too.
Sam [dots]: Then it isn't the oven.
@enter Sprout center
Sprout [heart] (jump): Sam. Eat this before the children get here. You skipped breakfast.
Sam [dots]: You were supposed to keep one for yourself.
Sprout [dots]: I did. Cosmo can watch the oven. What's making that noise?
@exit Sprout
> Arthur and Delilah come down from the offices. Delilah is reading from a clipboard as she walks.
@exitall
@music delilah
@enter Arthur left
@enter Delilah right
Arthur [note] (nod): Morning, everyone. Twenty-three children today. Let's give them a good visit.
Devan [sparkle]: Morning, Mr. Walton!
Arthur [note]: Arthur, please.
Delilah [dots]: The schedule, Arthur.
Arthur [sweat]: Right. Go on.
<<<<<<< HEAD
Delilah [dots]: Handlers: guests at ten, Main Stage at eleven-thirty, lunch at noon, departure at three.
=======
Delilah [dots]: Handlers. The children arrive at ten. Toons on the Main Stage by eleven-thirty. Lunch at twelve. They leave by three.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Delilah [dots]: Research has a pressure test scheduled for eleven. Sublevels only. Keep guests out of the service lifts.
Arthur [dots] (shake): We can move it until the building closes.
Delilah [dots]: We moved it twice. The pressure readings have been unstable all week.
Arthur [anger]: Then that's a reason to stop.
Delilah [dots]: It's a reason to find out why. I'll be downstairs before it starts.
> Delilah marks something on her clipboard.
Delilah [note]: Stay on schedule, please.
@exit Delilah
Arthur [dots]: I'll speak to her again. Keep the children away from Research in the meantime.
@exit Arthur
@music bossa
@enter Devan left
@enter Veronica right
Veronica [dots]: Are they actually testing Ichor with visitors upstairs?
Devan [dots]: Arthur will keep at her. He always does.
@enter Dandy center
@sfx dandy_entrance
Dandy [note] (bow): There you are, Devan. I need help moving the new stock. Pebble keeps claiming the boxes.
Devan [sweat]: I'm on the visitor rota until lunch.
Dandy [dots]: Arthur said the same thing. Everybody needs you today, apparently.
Veronica [?]: Were you just downstairs?
> Dandy looks toward the Research door.
Dandy [dots]: Delilah wanted a word. Nothing for the morning show.
Veronica [dots]: I didn't ask about the show.
Dandy [note] (nod): Good. I've got enough critics already.
@exit Dandy
Devan [dots]: He's been touchy about the shop all week.
Veronica [dots]: That was about Research.
@fx ink
@sfx whisper
> A black drop lands on the rainbow carpet behind them. It sinks in before either Handler turns around.
` },

/* =================================================================== 2 */
s2: { title: 'Hall C', time: '9:12 AM', place: 'The Rainbow Rooms', script: `
@bg rainbow
@music neutral
@fx dry
> Hall C. The Rainbow Rooms are empty before the first tour. A leak has spread beneath the mural wall.
@enter Devan left
@enter Veronica right
Veronica [dots]: Maintenance left before they could inspect the leak. Arthur asked us to block this hall.
Devan [dots]: There's a cart by the door. I'll get the mop.
> The liquid below the vent is too thick to be water. It moves against the slope of the floor.
Veronica [!]: Don't step in it.
Devan [?]: Is that Ichor?
Veronica [dots]: I think so. Don't touch it.
Devan [dots]: The service lift goes down to Research. I'll call Arthur.
@sfx glass_break
@fx shake
> Somewhere down the hall, a jar breaks. Then another.
Veronica [!]: Who's in there?
@enter Pebble farleft
Pebble [!] (shake): Grrrr...
Devan [?]: Pebble? Stay back.
> Pebble growls at the spill. The Ichor gathers around a broken glass bottle.
@music interesting
@fx glitch
@sfx tw_blot_skill
> The bottle pulls itself upright. A face opens on its side.
Devan [shock] (fall): That's moving on its own.
Veronica [!] (shake): So is the one behind it.
@sfx tw_blot_attack
> A rubber ball rolls out of the vent and rises beside the bottle.
Devan [sweat]: Pebble, find Sam. Go on.
Pebble [dots]: ...
Devan [anger]: Go!
@sfx pebble_speak
@exit Pebble
Veronica [dots]: We can shut the door and get help.
Devan [dots]: The latch is broken. The children arrive in less than an hour.
Veronica [dots]: Then we keep these things here.
> Devan grabs the maintenance mop. Veronica tears the fire extinguisher off the wall.
Devan [sweat]: This mop weighs about as much as Pebble.
Veronica [dots]: Aim for the bottle. I'll take the ball.
Devan [!] (jump): Right. Now.
` },

/* =================================================================== 3 */
s3: { title: 'Name Badges', time: '9:40 AM', place: 'The Rainbow Rooms', script: `
@bg rainbow
@music neutral
> The last shape strikes the wall and falls apart. The Ichor begins creeping back toward the vent.
@enter Devan left
@enter Veronica right
Devan [sweat] (tremble): That was the last one.
Veronica [dots]: The pieces are still moving. Keep the door shut.
@enter Sam farright
Sam [!] (shake): Pebble found me. Are you both hurt?
Sam [shock]: What happened to the wall?
Devan [dots]: The spill came out of the vent. It took shapes. We stopped it for now.
@sfx step
@enter Arthur center
Arthur [shock] (shake): How far did it spread?
Veronica [!]: Mr. Walton, you knew?
Arthur [dots]: Delilah reported a pressure leak below us. I didn't know it had reached the vents.
Arthur [dots]: Your badges. Take them out.
Devan [?]: Our... badges?
> Each badge bears the Gardenview flower and a Toon portrait: Pebble, Vee, Sprout.
<<<<<<< HEAD
Arthur [dots]: Delilah put Ichor in the badges to track Toons out of sight.
=======
Arthur [dots]: Delilah put a trace of Ichor in the badges. She said it would help us monitor the Toons when they were out of sight.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Arthur [dots]: I've never asked you to use that connection. I don't know what it will do under this much pressure.
Sam [?]: Connects us how?
Arthur [dots] (nod): Hold the badge. Think of the Toon you care for. Devan, start with Pebble.
> Devan closes his eyes and hears Pebble's bark from three floors above.
@fx flash
@sfx beam_charge
> The badge warms in Devan's hand. He knows where Pebble is before the bark comes again.
Devan [shock] (jump): He's upstairs. By the kitchen. How did I know that?
@fx flash
@sfx sparkle
Veronica [sparkle]: Vee's in the green room. She's watching the hall cameras.
@fx flash
@sfx heal
Sam [dots]: Sprout's checking the doors. He knows something's wrong.
Arthur [dots]: The link is stronger than Delilah expected. You may be able to draw on it, briefly.
Veronica [dots]: You sound like you knew this could happen.
Arthur [dots]: I knew the pressure was unsafe. I should have stopped the test before this morning.
@sfx warn
@fx alarm
> A siren yelps once, cuts out, and then the intercom chimes, bright and cheerful.
@sfx ding
Intercom: Good morning, Gardenview! Our summer friends have arrived! Please welcome them with your biggest smiles!
@fx calm
Sam [shock]: They're early. I need to move them out of this wing.
Arthur [!]: Take them to the Main Stage. I'll shut down the test in Research.
Veronica [!]: What if more come through the vents?
Arthur [dots]: Block the doors. Use the badges if you have to. I'll get help to you.
@exit Arthur
@sfx tw_blot_skill
> Black shapes fall from the vent between them and the exit.
Sam [sweat] (tremble): I have the children on the other side of that door.
Devan [dots]: Then we clear a path.
Veronica [dots]: Stay close. I can't tell how long this will last.
` },

/* =================================================================== 4 */
s4: { title: 'Showtime', time: '11:52 AM', place: 'The Main Stage', script: `
@bg sign
@music qom
> The Main Stage. Twenty-three children sit on the carpet. The doors to the lower floors have been locked.
> Under the painted tree, the Toons carry on with the morning show.
@enter Devan farleft
@enter Sam farright
Sam [dots]: Sprout's keeping them busy. The little girl in pink shoes hasn't stopped waving at him.
Devan [note]: Lily. She asked if Pebble could sign her program with a paw print.
@enter Boxten center
@sfx toodles_gamble
Boxten [sweat] (nod): Um. I can play the closing song now, if everyone's ready.
> The children clap. Boxten looks relieved and turns his key. The waltz begins.
@enter Veronica left
Veronica [dots]: Devan. Look at the stage floor.
> Ichor seeps between the boards beneath Boxten's feet.
Devan [dots]: Sam, get the children up.
@stop
@sfx machine_fail
@fx shake
> A deep metallic bang carries up through the stage. The lights dim.
@fx dark
@music clair
> Boxten's tune slows as the Ichor reaches his shoes.
Boxten [?]: Devan? Something's caught my key.
> He tries to step away. His feet will not move.
Boxten [dots] (tremble): Please get it off.
> Devan reaches the stage, but the Ichor rises between them.
@fx glitch
@sfx tw_rnd_spot
Boxten [tears] (tremble): I can't move.
> Some of the children are still clapping. Then Boxten's key stops turning.
@exit Boxten
@enter TwistedBoxten center
@sfx twisted_found
@fx alarm
> Boxten rises again, his casing split and dark Ichor running through its seams. The tune starts over, low and uneven.
> The room goes quiet.
@music twisted
@sfx male_scream
Sam [shock] (shake): Children, with me. Leave your things. Side door, now.
Veronica [anger] (shake): Vee, help Sam count them. I'll keep Boxten off the aisle.
@enter Vee farright
Vee [!] (nod): Eyes on me. Twenty-three guests, one exit. Nobody gets left behind.
@exit Vee
Devan [dots]: Boxten? It's Devan. Can you hear me?
TwistedBoxten [dots]: ...
> Boxten's key jerks once. He reaches toward Devan, then strikes the floor beside him.
Devan [dots]: That's enough. Back up.
@enter Arthur farleft
Arthur [shock] (shake): The core pressure jumped. I cut the test, but the valve wouldn't close.
Arthur [anger] (shake): Keep Boxten away from the children. He's still in there somewhere, but he can't control his body.
Sam [tears]: If we hit him, will he survive it?
Arthur [dots]: I don't know. We have to keep him from reaching the door.
@exit Arthur
Veronica [dots]: Sam has the children moving. We hold this room until they're clear.
Devan [anger] (nod): Boxten, I'm sorry. We'll try not to hurt you.
` },

/* =================================================================== 5 */
s5: { title: 'Headcount', time: '12:20 PM', place: 'East Hall', script: `
@bg easter
@music emotional
> Boxten lies at the foot of the stage. His key has stopped, but his chest still rises.
@enter Devan left
@enter Sam right
Sam [dots] (tremble): He's breathing. We should leave someone with him.
Devan [dots]: Arthur's getting a stretcher. We need to check the children.
> Devan drapes his jacket over Boxten before they go.
@exit Devan
@exit Sam
@bg easter
> In East Hall, Vee checks names against the visitor list while Sprout hands out water.
@enter Veronica left
@enter Vee center
Vee [sweat]: Twenty-two. I checked the stage exit and the hall camera.
Veronica [dots]: There were twenty-three.
Vee [dots]: I know. I'm going through the names again.
@enter Shannon right
@sfx hero_shelly_talk
Shannon [!] (jump): I have the sign-in sheet. We can compare it with Vee's count.
@enter Shelly farright
Shelly [sparkle]: Lily asked me about dinosaur birthdays. She's wearing pink shoes.
Shannon [dots]: Lily Carver. She's missing from the line.
@enter Devan farleft
Devan [shock]: Lily? Lily's the one who loves Pebble. She was in the front row.
Shannon [dots]: I checked the seats. She isn't there.
Devan [dots]: Then she left by another door.
Shelly [?]: The gift shop's lights are still on. She wanted to see the plush dinosaurs there.
Shannon [heart]: Good catch, Shells.
Veronica [dots]: The Gift Floor.
Devan [dots]: Dandy's floor.
> Nobody says anything for a moment.
Shannon [?]: Dandy may have found her. Devan, have you heard from him?
Veronica [dots]: He was in Research before the test. I want to know why.
@exit Vee
@exit Shelly
Shannon [dots]: Shelly, stay with Vee and keep everyone together. I'm going to the shop.
Devan [?]: Did Arthur give you a badge?
Shannon [sparkle]: Yes. It warmed up when Shelly called to me from the stairs.
@fx flash
@sfx shelly_rainbow_pulse
Shannon [dots] (nod): I can help. We'll find Lily first; then Arthur can explain the badge.
@exit Veronica
@exit Sam
@exit Shannon
@exit Devan
> Shelly sits with the children and opens the fossil book Lily had been carrying. Before long, three of them move closer to see the pictures.
` },

/* =================================================================== 6 */
s6: { title: 'Dandy’s Shop', time: '1:05 PM', place: 'The Gift Floor', script: `
@bg gift
@music shop
> The Gift Floor. Shelves of plush, snow globes and rubber flowers. The fairy lights are still on. The cheerful music is still playing.
> Ichor trails lead past the shelves. Toodles and Gigi lie motionless near the service door, still breathing.
@enter Devan left
@enter Veronica right
@enter Shannon farright
@enter Sam farleft
Shannon [dots]: Toodles and Gigi were both here. We should look for them after Lily.
Veronica [dots]: Check the counter. Someone's back there.
> At the back of the floor, behind the counter of the little shop, someone is humming.
@stop
@sfx dandy_text
> Several sealed Ichor canisters are stacked behind the counter. Dandy has covered them with a cloth.
@enter Dandy center
@music delilah
Dandy [note]: Devan! Shop's closed, I'm afraid. There's a child back here. I was about to call you.
Devan [anger]: Lily? Where is she?
> Dandy steps aside. Lily is asleep on a pile of plush toys, a wrapped lollipop in one hand.
Sam [shock] (shake): LILY!
Dandy [dots]: She was shaking. She asked for a place to hide. Then she fell asleep.
Veronica [anger]: Sam, check her hands. Make sure she hasn't touched the spill.
Shannon [dots] (tremble): And those canisters?
Dandy [dots]: Sealed samples. Delilah asked me to keep them out of the public rooms.
> Sam lifts Lily. She wakes for a moment and holds on to their vest.
Sam [dots]: No stains on her. Lily, can you hear me?
Dandy [dots]: I kept the shutter down. Nothing got to her.
Devan [anger] (shake): Why are Research samples in your shop? You were with Delilah this morning.
Dandy [dots]: I was. She wanted stockroom space. I said no. She left the canisters anyway.
Veronica [dots]: Then why cover them?
Dandy [dots]: Because I didn't want a child asking what they were.
Devan [dots]: Arthur went down to stop the test. Have you seen him?
Dandy [dots]: Alone? No. He shouldn't have gone alone.
@choice Demand the truth | Ask him to help
1> Devan [anger]: Tell me exactly what happened downstairs.
1> Dandy [dots]: Delilah asked me to move samples. I saw the pressure readout. It was already too high before the test began.
1> Dandy [dots]: I went back to warn her. She wasn't at the console.
2> Shannon [dots]: Can you help us reach Arthur? We have Lily, but the lower halls are blocked.
2> Dandy [dots]: The Aquarium Walk stairs were clear when I came up. Take the child that way.
2> Dandy [dots]: I'll look for Arthur on the service side.
@sfx shatter
@fx shake
> Dandy lowers the shop shutter between the samples and the public floor.
Dandy [dots]: Get Lily to the loading dock. Aquarium stairs, then left. Devan, one more thing.
Devan [dots]: What?
Dandy [dots]: The camera clocks in Research run ahead. Delilah knows. Check the time if anyone shows you footage.
Devan [?]: Why would anyone show me footage?
@exit Dandy
> Dandy carries the first canister toward the service lift. The shutter blocks the rest from view.
@music emotional
Veronica [dots]: I don't like the samples being here. Or his story about Delilah.
Shannon [dots]: We can ask her. We can't decide from one locked shutter.
Sam [dots]: Lily's awake.
Lily: Mr. Dandy said I could wait with the plush bunnies until you came back. Is Boxten all right?
Devan [dots]: He's being looked after. Let's get you outside.
` },

/* =================================================================== 7 */
s7: { title: 'Five More Minutes', time: '2:10 PM', place: 'The Planetarium', script: `
@bg astro
@music journal
> At the loading dock, the Handlers give Lily to the paramedics. Vee checks the list once more: all twenty-three children are outside.
> The doors close behind them. The Handlers stay inside.
> The Planetarium is dark except for the star projector. Austin has pushed a cabinet against the door.
@enter Austin center
Austin [anger] (shake): Who's there? Say your name before I open this.
@enter Devan left
Devan [dots]: Devan. Sam, Veronica, Shanon. We're looking for you.
Austin [dots]: Come in, then. Quietly.
@enter Sam right
@enter Veronica farleft
@enter Shannon farright
Sam [?]: Why quietly?
> Astro is asleep beneath his moon blanket.
Austin [dots]: He kept hearing the alarms. I got him settled an hour ago. Nothing's getting through that door.
Veronica [dots]: Austin, there's Ichor in the halls. Toons are twisting. Boxten...
Austin [dots]: I heard the stage over the intercom. Then the line went dead.
@enter Astro left
Astro [dots]: Austin? Is everyone safe?
Austin [heart]: The children are outside. Go back to sleep.
Astro [dots]: I dreamed about the lower floors. There was Ichor in the halls. I don't think it was only a dream.
Shannon [dots]: We saw it, too.
Austin [dots]: The doors are locked. I'll stay here.
Astro [dots]: Don't stay because of me. The others need help.
Austin [heart]: Five more minutes. Then we'll see.
@exit Astro
> Austin draws the blanket up to Astro's shoulders.
Devan [dots]: Arthur's missing in Research. We need to find him before the pressure climbs again.
Austin [dots]: I can't leave Astro unguarded.
Sam [dots]: Vee can watch the studio cameras from here. She'll tell us if anything comes near the door.
Austin [dots]: The cameras still work?
Veronica [dots]: Some of them. I'll ask her.
Austin [dots]: Then I'll come as far as Research. If this door is breached, I come straight back.
> He unclips his badge. Astro has drawn a small moon on the back.
Austin [dots]: He did this on my first day.
@fx flash
@sfx hero_astro_ability
Austin [dots]: It's warm. Yours did this too?
@sfx tw_blot_attack
@fx shake
> Something strikes the Planetarium door. The cabinet shifts.
@music unknown
Austin [anger] (shake): Everyone back. I'll hold the door while you move the cabinet.
Devan [dots]: On three.
` },

/* =================================================================== 8 */
s8: { title: 'The Woman With the Clipboard', time: '3:00 PM', place: 'Executive Offices', script: `
@bg launcher
@music delilah
> Delilah's office runs on a separate generator. The emergency radios and an old security monitor are still working.
@enter Delilah center
Delilah [dots]: You got the children out. How many?
@enter Veronica left
@enter Devan right
Veronica [dots]: Twenty-three. All accounted for.
Delilah [dots]: Good. Close the door. The vent in the corridor isn't sealed.
> Delilah sets her clipboard beside the radio. Pressure readings cover the top page.
@enter Shannon farleft
@enter Sam farright
Shannon [!]: Have you heard from Arthur? He went into Research hours ago.
<<<<<<< HEAD
Delilah [dots]: His radio died on sublevel two. The crew can't get past the lift; you can.
Delilah [dots]: At eleven-fifty-two, the core overpressurized. Someone opened the main valve by hand. I can't tell why.
=======
Delilah [dots]: His radio cut out on sublevel two. I'm sending you there because the emergency crew can't get past the lift.
Delilah [dots]: At eleven-fifty-two, the core exceeded its pressure limit. The main valve opened by hand. I don't know whether it was deliberate or an attempt to vent the system.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Devan [?]: Who has a key?
Delilah [dots]: Arthur, Dandy, and I can all reach the valve. Arthur went down after the alarm. Dandy was there before it.
Veronica [dots]: He said you left samples in his shop.
Delilah [dots]: I asked him to secure them. I didn't authorize him to move them back toward the core.
Shannon [dots]: He found Lily and kept her safe.
Delilah [dots]: I'm glad he did. I still need to know what he was doing with those canisters.
Sam [dots]: So do we. Lily's fine, for what it's worth.
Delilah [dots]: Here.
@sfx lock
> She offers them a white access card.
Delilah [dots]: Find Arthur. The card opens the lower labs. If you can reach the core, read the pressure panel before touching the valve.
Devan [?]: Are you coming?
Delilah [dots]: I'm coordinating the evacuation and keeping the emergency line open. If I lose contact, use the service radio in Research.
@exit Shannon
@enter Austin farleft
Austin [dots]: What about the Toons who changed?
Delilah [dots]: Keep them in separate rooms if you can. Don't move them through the public halls.
Austin [anger]: Astro's still up there. I need more than that.
Delilah [dots]: So do I. I made their bodies, Austin. I haven't found a way to reverse this.
@exit Delilah
@music emotional
> The office door closes behind them. Devan checks the hall clock against his watch.
Devan [dots]: That clock's three minutes fast. Dandy told me to check the cameras, too.
Shannon [?]: We can compare their timestamps with the pressure logs downstairs.
Veronica [dots]: After we find Arthur.
` },

/* =================================================================== 9 */
s9: { title: 'Research & Development', time: '3:45 PM', place: 'Research Wing, Sublevel 2', script: `
@bg artist
@music interesting
> Sublevel two. Ichor runs beneath the lab doors. Broken panels and loose papers cover the corridor.
> The Twisted they fought outside Research has stopped moving. Its screen flickers once, then goes dark.
@enter Devan left
@enter Veronica right
@enter Sam farright
Sam [!]: There! Under the desk!
@enter Arthur center
Arthur [dots] (tremble): Over here. My leg's caught under the cabinet.
> Arthur's leg is pinned. Ichor stains his shirt where he brushed the wall.
Sam [shock] (shake): Don't pull it. Shanon, help me lift this side.
Arthur [dots]: I shut down the test. The valve opened anyway, and the manual control locked me out.
Veronica [dots]: Delilah says Dandy was down here before the alarm.
Arthur [?]: He was. I asked him to bring the sample canisters to storage.
Devan [dots]: He said she asked him.
Arthur [dots]: They were both working on the samples. Ask them both. I can't tell you what either did after I left the lab.
<<<<<<< HEAD
Arthur [dots]: The badges share the Toons' Ichor. They were monitors. We never tested this link.
=======
Arthur [dots]: The badges respond to the Toons because they contain the same Ichor. Delilah designed them as monitors; neither of us tested them like this.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Shannon [dots]: You should have told us what was in them.
Arthur [dots]: Yes. I should have.
@sfx machine_start
@fx shake
@fx alarm
> The pipes in the ceiling bang like gunshots. One after another, down the corridor, getting closer.
@music boss
Arthur [shock]: The core's venting into this wing. Get away from the grates!
@enter Vee farleft
Vee [!] (shake): Veronica! The Planetarium camera just went out. I came to find you.
Veronica [shock]: Vee, get off that grate!
@sfx male_scream
@fx glitch
> The grate under Vee's feet bursts upward in a geyser of black.
Veronica [!] (shake): VEE!
> Veronica pushes Vee clear. Devan catches her as the Ichor climbs Veronica's legs.
> The Ichor closes over Veronica's shoulders. Her arm. Her face.
Veronica [shock] (tremble): Pull me out!
Devan [shock] (shake): I've got you. Sam, help!
> Veronica's badge flashes green. The vent cover gives way beneath her.
@fx flash
@sfx glass_break
> And then the vent swallows her whole and the grate slams shut and she is gone.
@exit Veronica
@stop
@fx calm
> Silence.
> Vee is staring at the grate.
Vee [dots]: Veronica? Answer me. I can hear the service radios. Answer me.
@music clair
Vee [tears] (tremble): I'll search every camera. She has to come out somewhere.
Sam [dots]: Vee, stay with us. Devan, stop pulling; the grate's bolted below.
> Devan gets to his feet. His hand is stained with Ichor.
Devan [dots]: Which way do the vents run?
Arthur [dots]: Through the studio shaft and down toward the core. There are access panels on each floor.
@enter Austin farright
Austin [anger] (shake): The Planetarium camera went out. Astro's alone.
> The lights flicker again.
Austin [shock]: I'm going back.
Arthur [!]: Go. Shanon and Sam can get me out.
Shannon [dots]: Sam, get Arthur behind the lab door, then meet us at the stairs.
Devan [anger] (nod): Vee, keep searching for Veronica. Call us the moment you see anything.
` },

/* =================================================================== 10 */
s10: { title: 'Lullaby', time: '4:30 PM', place: 'The Planetarium', script: `
@bg astro
@fx dark
@music clair
> The Planetarium door is open. The star projector turns over an empty bed. Ichor stains Astro's blanket.
@enter Austin center
Austin [shock] (tremble): The cabinet was against this door. Who moved it?
@enter Devan left
@enter Sam right
@enter Shannon farleft
Shannon [dots]: Check behind the projector.
Austin [anger] (shake): Astro? It's me. You can come out.
> From the ceiling, between the painted stars, something answers.
@sfx hero_astro_talk
Voice: ...Austin...
@fx glitch
@enter TwistedAstro farright
@sfx twisted_found
> Astro uncurls from above the projector. Ichor runs down his cap. He sees Austin and hesitates.
TwistedAstro [dots]: Austin... it hurts.
Austin [tears] (tremble): I know. I'm here.
TwistedAstro [dots]: I tried to stay asleep. It came in through the door.
Sam [shock] (shake): Austin, move away. He doesn't know where he is.
TwistedAstro [anger] (shake): Stay back.
@fx shake
@sfx tw_rnd_attack
> A pulse rolls across the room. Devan drops to one knee; Shanon catches the railing.
Devan [sweat] (tremble): We need to stop him before he does that again.
> Austin stands between Astro and the others. His badge rattles against his vest.
Austin [tears]: You can hear me. I saw you stop.
Austin [dots]: I'm going to help, but you have to let us close the distance.
Austin [anger] (nod): Everyone, be careful. He won't mean to hurt you.
TwistedAstro [dots]: ...Austin...?
@music emotional
Austin [anger]: Astro. Look at me.
` },

/* =================================================================== 11 */
s11: { title: 'Tape 11:47', time: '5:15 PM', place: 'Security Room', script: `
@bg library
@music journal
> Astro is asleep beneath what remains of his blanket. Austin closes the Planetarium door and tapes a note to it: DO NOT ENTER. ASK AUSTIN.
@bg warehouse
> The Security Room has one working row of monitors. One shows Pebble beside the grate where Veronica disappeared.
@enter Devan left
@enter Sam right
@enter Shannon center
@enter Austin farright
Devan [dots]: Pebble's still there. Dandy hasn't found him.
Sam [dots]: We'll get him before we go down.
Shannon [dots]: The core corridor has a separate camera loop. We can check who used the valve.
> Shanon rewinds past noon to the minutes before the pressure alarm.
Shannon [dots]: There. Hold it.
@fx static
@music delilah
> The screen reads 11:47 AM. Dandy enters the core corridor carrying two sample canisters. He opens the valve room with a key.
@sfx lock
> Dandy goes inside.
@fx calm
Sam [dots]: He said he was moving those to storage.
Shannon [dots]: Storage isn't in that room.
Austin [anger] (shake): He was there before the surge. We need to ask him what he did.
Devan [dots]: Rewind to the clock.
@fx static
> The image skips. Dandy enters the room again; the timestamp is clear.
@fx calm
Devan [dots]: The clock on the camera.
Shannon [?]: What about it?
Devan [dots]: Dandy warned me this camera runs ahead. Is there a calibration log?
> Shanon opens the camera settings.
Shannon [dots]: Twelve minutes fast. It was adjusted at six this morning.
Shannon [?]: So this is 11:35. We still don't see what happened inside the room.
Devan [dots]: Or who adjusted the clock.
Austin [dots]: We have enough to ask Dandy. We don't have enough to say he opened the valve.
@music emotional
> Later, Sam sits by the door. Sprout has come from the kitchen with the last of the food he and Cosmo packed.
@exitall
@enter Sam left
@enter Sprout right
Sprout [dots]: You haven't eaten. Take this.
Sam [dots]: You need it more than I do.
Sprout [dots]: Sam. Please.
Sam [dots]: All right. Sit with me a minute.
Sprout [dots]: Boxten and Astro are still in there, aren't they?
Sam [dots]: We heard Astro speak. Austin thinks he can recover.
Sprout [dots]: Then we keep them safe until he does. I can stay with them.
Sam [dots]: Stay with Vee, where there are cameras. Don't go alone.
Sprout [heart]: I won't. Cosmo's with me.
@exit Sprout
@enter Devan right
Devan [dots]: Sam, we're taking the staff stairs to the core.
Sam [dots] (nod): I'll be there.
` },

/* =================================================================== 12 */
s12: { title: 'What the Pipes Said', time: '6:40 PM', place: 'Vee’s Studio', script: `
@bg veeShow
@music interesting
> Vee's studio. The main camera is down. A frozen standby card fills the monitor: WE'LL BE RIGHT BACK.
@enter Devan left
@enter Austin right
@enter Shannon farleft
@enter Sam farright
Austin [dots]: The core stairs are behind us.
Devan [dots]: Pebble left the Research grate and ran here. He's found something.
@sfx pebble_speak
@enter Pebble center
Pebble [!] (jump): Bark! BARK!
> Pebble scratches at the vent behind the monitor. Three taps answer from inside.
Devan [shock]: That's Veronica's cue. She knocks three times before Vee goes live.
@sfx metal_hit
@fx shake
> Devan pries the vent cover loose. Veronica crawls out, soaked in Ichor and coughing.
@exit Pebble
@enter Veronica center
@fx flash
@sfx heal
Devan [tears] (jump): Veronica. Can you stand?
Veronica [dots] (tremble): Give me a second. There's a drop in the floor.
> Sam helps her onto a chair. Shanon finds a clean towel.
@music emotional
Sam [dots]: We checked every access panel on the way down.
Veronica [dots]: I couldn't get the grates loose from inside. Pebble heard me.
@enter Vee farright
Vee [tears] (jump): You're here. I checked every camera. None of them showed the vent.
Veronica [heart]: You found me anyway.
Vee [dots]: Pebble did. I was still checking cameras.
> A thin line of Ichor has stained Veronica's neck. She rubs it; it does not come off.
Shannon [dots]: We need Sam to look at that.
<<<<<<< HEAD
Veronica [dots]: Later. Voices came through the pipes. Some led to rooms. Some led nowhere.
=======
Veronica [dots]: Later. I could hear voices through the pipes. Sometimes the vents carried sound from rooms. Sometimes there was no room at the end of it.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Austin [dots]: Did you hear Astro?
Veronica [dots]: I heard him call your name. I can't tell whether it came from the Planetarium or the Ichor around me.
Veronica [dots]: Near the core, I heard a woman reading pressure numbers over a radio.
Devan [?]: Delilah?
Veronica [dots]: Maybe. She said the purge was ready. Then, "Put his name in the report." I couldn't hear whose name.
Shannon [dots]: We can check the radio log.
Veronica [dots]: After we stop the pressure. I don't want anyone else inside those pipes.
@fx flash
@sfx hero_vee_ability
> Her badge lights green. Static crawls along its edge.
Veronica [dots]: It reacted when the vent opened. I can still feel it.
Vee [?]: Is it hurting you?
Veronica [dots]: No. But stay on the cameras while we go down. If the signal changes, tell me.
` },

/* =================================================================== 13 */
s13: { title: 'The Core', time: '8:00 PM', place: 'The Ichor Core', script: `
@bg greenhouse
@music unknown
> The last access door opens below Research. Old greenhouse tables surround the Ichor core. Its pipes run up into every wing of Gardenview.
@enter Devan left
@enter Veronica right
@enter Sam farleft
@enter Shannon farright
@enter Austin center
Shannon [shock]: Those are the old development tanks. They were meant to be empty.
Austin [dots]: There's something moving in them.
> Shapes press against the dark glass. Nobody goes close enough to identify them.
@exitall
@stop
@sfx dandy_text
> Dandy is braced against the master valve. Ichor has reached the cuffs of his gloves.
@enter Dandy center
@music delilah
Dandy [dots]: Devan. I hoped you'd take the others upstairs.
@enter Devan left
@enter Veronica right
Devan [anger]: Tell me what you're doing with the valve.
Dandy [dots]: Holding it where the pressure levels off. If I let go, the automatic purge starts.
Veronica [anger] (shake): We saw you enter this room before the surge. What happened inside?
<<<<<<< HEAD
Dandy [dots]: I brought the samples down. The alarm was sounding. I opened the bypass to spare the public floors.
=======
Dandy [dots]: I brought the samples down. The pressure alarm was already on. I opened the bypass to keep it out of the public floors.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Veronica [dots]: The public floors filled with Ichor.
Dandy [dots]: I know. The bypass failed.
@enter Austin farright
Austin [anger] (shake): Astro was hurt. So was Boxten. Do you understand that?
Dandy [dots]: I saw Boxten. Devan, you know I wouldn't choose this.
Devan [dots]: I know you're scared for them. I still need the whole story.
@enter Shannon farleft
<<<<<<< HEAD
Shannon [?]: Closing the main line stops the flow. Why won't you let us?
Dandy [dots]: The affected Toon tanks need that line. Delilah never separated them from the core.
=======
Shannon [?]: The control panel says closing the main line will stop the flow. Why won't you let us do it?
Dandy [dots]: The same panel says the affected Toon tanks depend on that line. Delilah never separated them from the core.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Shannon [dots]: The tanks aren't the Toons upstairs. We don't know what closing it would do to them.
Dandy [dots]: Exactly. I won't gamble on their lives to make the gauge look better.
Sam [dots]: What does the purge do?
Dandy [dots]: It empties the lower lines. Everything in them goes to waste storage. I found the instructions in Research.
Devan [?]: Show us.
Dandy [dots]: The folder's beside the panel. Read it before you touch anything.
@choice Believe him | Close the valve
1> Devan [dots]: We'll read it. Hold the valve while Shanon checks the panel.
1> Dandy [dots]: Fine. Keep back from the open line. It's climbing toward my arm.
2> Veronica [anger]: The pressure's still rising. Shanon, get to the cutoff switch.
2> Dandy [dots]: Wait. That switch starts the purge. Look at the label.
@sfx dandy_entrance
@fx petals
> Ichor climbs Dandy's arm. He tries to release the wheel and cannot. His petals darken at the edges.
Dandy [shock]: Devan, move them back. I can't hold it.
@music colossus
Devan [anger] (nod): Everyone back from the line. We stop him without letting the purge start.
Dandy [dots]: Devan? Please don't let me hurt Pebble.
` },

/* =================================================================== 14 */
s14: { title: 'The Door', time: '8:24 PM', place: 'The Ichor Core', script: `
@bg greenhouse
@fx alarm
@music boss
> Dandy sinks to his knees beside the valve. The Ichor has spread across half his petals. His hand is still caught against the wheel.
@enter Dandy center
Dandy [dots] (tremble): Devan. Is everyone still here?
@enter Devan left
@enter Veronica right
@enter Sam farleft
@enter Shannon farright
@sfx machine_fail
@fx shake
> The valve slips. The core pressure rises toward the red mark.
Shannon [shock] (shake): Purge threshold. We have seconds.
@sfx warn
@sfx ding
Intercom: Attention, Gardenview staff. Containment purge will begin in sixty seconds. Evacuate sublevel four.
Austin [shock]: It started automatically.
Dandy [dots]: That's what the panel said. Go.
@exit Dandy
> Dandy loses his grip. The core spills over him, and he vanishes beneath it.
Dandy~: Devan. Get Pebble out.
@fx flash
@music clair
Veronica [!] (shake): The blast door is closing. Move!
> They climb as the Ichor rises behind them.
@sfx earth_quake
@fx shake
> A planter jams the blast door at waist height. Ichor is already entering the stairwell.
Sam [shock]: If the door stays open, the purge goes through the upper vents.
Devan [dots]: There's a release lever on the lower side. I can reach it.
Veronica [?]: We'll pull you back through.
Devan [dots]: You won't have time. Get Pebble away from the stairs.
Veronica [shock]: Devan, wait.
Devan [dots]: Go. That's an order from the guy who's never in charge.
> The others crawl beneath the door. Devan pulls the release lever and kicks the planter clear.
@sfx shatter
@fx shake
> The door comes down.
@stop
> As the door shuts, Veronica sees Devan backing up the lower stairs. His badge flashes once, then disappears from view.
@enter Pebble center
@sfx pebble_speak
Pebble [!] (jump): BARK! BARK! BARK!
> Pebble reaches the door and throws himself against it. It does not move.
Pebble [tears] (shake): Bark? Bark!
> He stays beside it, listening.
@music emotional
Veronica [tears] (fall): Devan? If you can hear me, knock on the door.
Sam [dots]: The vent alarms stopped. He closed it.
Shannon [tears]: There's another access route. We can try it when the pressure drops.
@exit Pebble
@sfx step
@enter Delilah center
@music delilah
> Delilah comes up the stairs with Arthur leaning on her shoulder. His leg is splinted.
Delilah [dots]: The upper vents are clear. Who's below the door?
Austin [anger]: Devan. He freed the track.
Delilah [dots]: The pressure has to settle before we open it. I'll send a crew as soon as it does.
Shannon [tears]: Dandy went into the core.
Arthur [dots] (tremble): We need to check the tanks, Delilah. And find Devan.
Delilah [dots]: We will. First we get you all out of this stairwell.
Veronica [dots]: I heard someone order a purge over the radio. Who gave that order?
Delilah [dots]: The system triggered at the pressure limit. I'll show you the log when we reach the office.
> Veronica watches her. Delilah has not looked toward the blast door.
` },

/* =================================================================== 15 */
s15: { title: 'Five Days', time: 'June 29, 2002', place: 'Outside the Gates', script: `
@bg black
@stop
@card JUNE 29, 2002
@card FIVE DAYS LATER
@bg sign
@fx tv
@music journal
<<<<<<< HEAD
Reporter: All twenty-three visiting children are safe. One Gardenview staff member remains missing.
=======
Reporter: All twenty-three children who visited Gardenview on Monday have been accounted for. One staff member remains missing after the incident.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Reporter: Questions remain about safety procedures and an Ichor test conducted while guests were in the building.
Reporter: Co-founder Delilah Keen spoke outside the gates this morning.
@enter Delilah center
Delilah [dots]: We have not determined what caused the pressure failure. We are preserving the records for investigators.
<<<<<<< HEAD
Delilah [dots]: All visiting children are safe. Devan Reed is missing. Search crews will enter when the lower level is safe.
=======
Delilah [dots]: Our Handlers brought every visiting child out safely. Devan Reed is still missing. Search crews will continue as soon as the lower level is safe.
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
Delilah [dots]: Gardenview Educational Center and Museum is closing today. The Toons will remain inside while we assess their condition.
Reporter: And co-founder Arthur Walton? We understand he was injured in the incident.
Delilah [dots]: Arthur is recovering. He has asked us to keep the Toons together.
@exit Delilah
@fx notv
@music emotional
@bg lobby
> Outside the gates, a chain runs through the handles. Four Handlers stand beside the CLOSED notice.
@enter Veronica left
@enter Sam right
@enter Shannon farleft
@enter Austin farright
Shannon [dots]: Arthur told us to leave. I left Shelly a note where she keeps her fossil book.
Sam [dots]: Sprout saw me through the kitchen window. I couldn't get near him.
Austin [dots]: They say Astro's stable. I need to see him myself.
Shannon [dots]: Shelly will make sure he's not alone until we get back.
Veronica [dots]: ...
> The Ichor mark on Veronica's neck has not faded. Her badge clicks faintly when she holds it near the gate.
Veronica [dots]: The last camera feed showed Pebble beside the blast door.
Sam [dots]: Still waiting for Devan?
Veronica [dots]: He wouldn't be there if he couldn't hear something.
Austin [dots]: Or he won't leave because he doesn't know where else to go.
Veronica [dots]: Then someone needs to bring him out. And check that door again.
> The badge in her hand warms for a moment. She does not tell the others until it happens a second time.
Veronica [?]: Wait. Feel this.
Shannon [?]: It's warm.
@exitall
@fx blackout
@music delilah
> In the fourth-floor office, Delilah files the pressure log beside a sealed incident report. She removes one page before locking the drawer.
> It lists a manual valve adjustment at 11:35 AM. The operator field is blank.
@card . . .
@bg greenhouse
@fx ink
@stop
> At the core, the Ichor has settled. A darkened crown of petals rises above its surface.
@enter Dandy center
@music unknown
Dandy [dots]: They closed the doors.
Dandy [dots]: Boxten. Astro. Pebble. Devan. If any of you can hear me, stay where you are.
Dandy [dots]: I can still move the Ichor through these lines. There may be a way to reach you.
@sfx machine_start
@fx shake
> A machine turns on in the dark.
Dandy [dots]: All right. Let's see what this one does.
@card END OF CHAPTER 1 · THE MALFUNCTION
` }
};
