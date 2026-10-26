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
Dyle [dots]: The nine-ten is not running. The ten-forty is not running. The twelve noon is not running. I have been awake for six hours and nothing is running.
@enter Tisha left
@enter Rodger right
@enter Vee farright
Tisha [dots]: Dyle?
Dyle [anger]: Yes? Is the train running?
Tisha [dots]: We were going to ask you the same thing.
Dyle [dots]: I have been standing here since dawn. The train is not in its berth. The track is blocked at the tunnel mouth. The switch is stuck on the siding. And somebody has been in my cab.
Rodger [dots]: How do you know?
Dyle [dots]: Because the DO NOT lever has been pulled. It has been pulled very hard.
> He lifts his pocket watch. The face is cracked from edge to edge. The hands are frozen at 11:52.
Dyle [dots]: And I do not have the faintest idea when I broke it.
Vee [?]: You don't remember?
Dyle [dots]: I remember Arthur's announcement. I logged the closure. I remember the lights going off. Then I remember waking up here, standing, at dawn. With a chain wrapped around the signal post.
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
Dyle [dots]: Veronica Hurley rode my train exactly once, to see how it worked. She said it was loud. She asked if I took the whistle off the schedule. I said I did not.
> Dyle takes the badge gently. His hands are very precise. They are very slightly shaking.
Dyle [dots]: If this was on my track, then the Handlers were on my train. And they were in a hurry. And I did not log it.
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
> He lays out a green ledger, a cash register and a row of small lacquered boxes. Several boxes are sealed with strips of paper. A hand-lettered sign swings from the counter. DANDY'S SHOP. NOW OPEN.
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
Dandy [dots]: You carry more than you think. It is in your boots. It is in your seams. The building has been generous this week.
Vee [dots]: That is the creepiest sales pitch I have ever heard.
Dandy [sparkle]: Thank you. I have been rehearsing.
Sprout [dots]: Dandy... can we afford flour?
Dandy [heart]: Flour, butter, honey, sugar. And for the heroes of the afternoon, bandages and candy. The rest will have to wait for those seals.
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
Connie [dots] (tremble): I can see in the dark. I don't like it when it's this dark.
@enter Brightney farright
@sfx sparkle
@fx light
> A bright, warm glow floods the corridor. Brightney steps into it as if she had been born inside it.
Brightney [sparkle] (jump): Somebody called for a lamp?
Tisha [heart]: Brightney! You are a very welcome sight.
Brightney [dots]: The breakers aren't broken. They've been thrown from underneath. Somebody's switching the staff wing off at night so nobody walks through it.
Rodger [dots]: Who knows the wiring?
Brightney [dots]: I do. And whoever did this knew it better.
Connie [dots]: Can we please go somewhere with a window?
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
Connie [dots]: Of course it does.
@sfx step
@music interesting
> Brightney lifts her light. The wall at the end of the corridor is covered in chalk marks, small and neat, in groups of five. Each group is crossed through.
Rodger [dots]: Tally marks.
Tisha [?]: How many?
Rodger [dots]: Eight groups of five. Plus one. Forty-one.
Connie [shock] (shake): Forty-one?
Rodger [dots]: Astro said something this week. He said somebody was counting in his dream. Slowly. He couldn't hear the number.
Brightney [dots]: It's forty-one.
Rodger [dots]: It's forty-one.
Tisha [dots]: There are forty-one Toons in Gardenview.
> Nobody likes the arithmetic. The tallies end exactly at the base of the wall. Below the last group is a handprint. It is too large and too black.
Connie [dots]: Can we go now? Please?
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
Rodger [dots]: You are Tisha. You woke up this morning on a reception desk. You scrubbed a floor you hadn't made dirty. You recruited two Toons who didn't know they could punch. Nobody built that.
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
Glisten [anger] (shake): Look at this! Look at it! Smeared! Fogged! Cracked! A mirror is a work of art, and somebody has treated it like a window!
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
Vee [dots]: I intend to broadcast the whole thing.
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
Astro [dots]: Under the floor. A kind of lullaby. It goes round and round and it's mine. It's the song I hum when I can't sleep.
Sprout [?]: I don't hear anything, sweetheart.
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
