/* Consolidated scripts, in original load order. */
'use strict';

/* ===== js/story/ch3-script-a.js ===== */
/* ch3-script-a.js - Main Story · Chapter 3 "Closed for Renovation", scenes 1-5.
   July 8-9, 2002. Same script grammar as story-script.js, plus
   `@image key` / `@imgoff` (ST3_IMAGES), `@horror key` (ST3_HORROR, painted at runtime)
   and `@fx flashback` / `@fx noflashback`. */
'use strict';

Object.assign(ST_STORY, {

/* =================================================================== 1 */
c3h1: { title: 'Closed for Renovation', time: '11:20 PM', date: 'JULY 8, 2002', place: 'Gardenview Park Gate', script: `
@bg black
@stop
@card JULY 8, 2002
@card NINE DAYS AFTER THE CLOSING
@bg renovation
@music journal
> The sign over the gate used to say WELCOME. Now a small green screen under it says CLOSED FOR RENOVATIONS.
> There are no trucks in the lot and no workers. Just a wooden barrier across the gate, knocked a little crooked.
@bg park
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Sam [dots]: Nine days.
Shannon [dots]: Nine days of hold music. The lawyer calls us "the staff," like furniture.
Austin [dots]: The officer said the building was "under review." I asked by who. He said he couldn't say.
Veronica [dots]: Has anyone seen the show?
Shannon [?]: The show?
Veronica [dots]: Dandy's World aired every Saturday of my childhood. Last week, Channel 7 ran a test pattern. No rerun.
Sam [dots]: Fifteen years, and it ends with a test pattern.
Veronica [dots]: That's what bothers me. Somebody's keeping the Toons out of sight on purpose.
@image news
> Sam takes a folded newspaper out of his jacket. It's soft from being read so many times.
Sam [dots]: "Gardenview Educational Center is to shut its doors on six twenty-nine due to recent allegations and lack of safety regulations."
Sam [dots]: "Arthur Walton was questioned on the matter. He chose to remain silent."
Austin [anger]: Arthur doesn't stay silent. The man narrates his own lunch.
Shannon [dots]: Look at the bottom. Somebody blacked out the other article. You can still read the word "silly."
Veronica [dots]: Put it away, Sam.
@imgoff
@fx dark
> Their badges are warm. They've been warm since sunset. Every few minutes one of them pulses, like somebody pressing on it from the other side.
Austin [dots]: Mine's pulsed for hours. There's a pattern. A count.
Veronica [dots]: Counting what?
Austin [dots]: Down. I don't know to what.
> The wind picks up along the park path. The flowers in the beds by the gate all turn the same direction, toward the four of them.
Shannon [?]: Did you see that?
Sam [dots]: They follow the sun. It's what they do.
Shannon [dots]: It's after eleven at night, Sam.
@sfx warn
@fx glitch
> Somebody has drawn a smile on every flower. Not painted. Grown into the petals, a little too wide, all at the same angle.
Veronica [shock]: Everybody back from the beds.
> Veronica steps back and bumps the barrier. It rocks on its legs, and she sees there's something written on the back.
@image barrier
> Chalk, in block capitals: SERVICE STAIRS PAST THE FLOWERBEDS. 11:52. DON'T GO IN ALONE.
@imgoff
Sam [?]: Who wrote that?
Veronica [dots]: I don't know. It's not a Handler's writing.
Austin [dots]: Could be a trap.
Shannon [dots]: Could be. Or somebody inside who can't sign it.
Veronica [dots]: Eleven twenty-four. We wait until eleven fifty-two. Then we go home.
Sam [dots]: You don't believe that.
Veronica [dots]: No.
@fx alarm
@sfx earth_quake
> Black ichor starts coming up through the soil. The flowers keep smiling.
Austin [shock]: They're coming up!
Shannon [anger]: We don't have Devan. We don't have anybody who can take a hit for us.
Veronica [anger]: Then we do it the way we did on the twenty-fourth. Stay close and don't get separated.
Sam [sweat]: They look really happy for something that's attacking us.
Veronica [dots]: Sam. If one of them starts picking petals, look at me. Not at it.
Sam [shock]: Why?
Veronica [dots]: Because I don't know. Look at me.
@music unknown
@fx shake
` },

/* =================================================================== 2 */
c3h2: { title: 'Platform Zero', time: '11:44 PM', date: 'JULY 8, 2002', place: 'The Freight Station', script: `
@bg black
@stop
@bg station
@fx dark
@music emotional
> The service door at the end of the path was already open. Behind it a flight of concrete stairs goes down to a train platform that isn't in any visitor's guide.
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Shannon [dots]: It's still running. I thought they'd shut off everything.
Sam [dots]: It's not running. The lights are on, though. Somebody's been here.
@image station
> On the wall by the crates, black letters have been dragged across the tile by something with a lot of fingers.
> FIND ME!
@sfx warn
Veronica [dots]: That's still wet.
Austin [dots]: Who's it for?
Sam [dots]: I don't know. It doesn't say who it's from.
Shannon [dots]: Devan?
Veronica [dots]: He'd sign it. He signs shopping lists.
Austin [dots]: Then who writes "find me" without a name?
Veronica [dots]: I don't know. That's the problem.
@imgoff
@fx glitch
> A line of small black footprints runs along the platform floor. They start at the rails and stop at the Handlers' feet.
Sam [dots]: They're tiny.
Shannon [dots]: Dog-sized?
Veronica [dots]: Pebble's been at the lower door for nine days. These are going the wrong way.
@fx calm
> Nobody talks for a bit. The station hums, very low, like a big crowd a long way off.
Austin [shock]: That's Astro's lullaby.
Veronica [dots]: The building's playing it.
Austin [tears]: He's been singing it since we left. Veronica, he's trying to say something.
Sam [dots]: Or it's a recording on a loop.
Austin [anger]: It gets faster when I look at it.
@horror corridor
> At the far end of the platform the tunnel opens. In the dark the black puddles on the floor start to rise, one drop at a time.
> They have faces. Small ones. Smiling.
Shannon [dots]: Those weren't there a minute ago.
Sam [sweat]: Okay. I don't like those.
Veronica [anger]: Don't pop them one at a time. Hit them together.
Austin [?]: Why?
Veronica [dots]: I just watched one split in two.
@imgoff
@fx alarm
@music twisted
> The drop in front of Sam bursts. It doesn't die. It turns into two.
Sam [shock] (shake): Yeah. I really don't like those.
` },

/* =================================================================== 3 */
c3r1: { title: 'Hiatus', time: '8:10 AM', date: 'JULY 9, 2002', place: 'Gardenview Lobby', script: `
@bg black
@stop
@card JULY 9, 2002
@bg lobby
@fx calm
@music neutral
> The lobby looks almost normal. Teagan's got a tray of cups on the reception desk. Somebody has taped a Dandy's World poster back up where it fell down.
> It's the Season Four poster. The one with everybody on the stairs.
@enter Poppy left
@enter Teagan right
Poppy [sparkle]: Good morning! Are we filming today?
Teagan [note]: Not today, dear. We're on hiatus. Arthur said so before he left.
Poppy [dots]: How long is a hiatus?
Teagan [dots]: Last year it was three months. Everyone slept in.
Poppy [sparkle]: That sounds nice. I like sleeping in.
@exitall
@enter Tisha left
@enter Rodger center
Tisha [dots]: They're all acting like it's the winter break.
Rodger [dots]: Most of them have never seen the Reserve. All they know is the sign says closed and Arthur told them to wait.
Tisha [dots]: And you can't tell people their friends are in a tank on sublevel three and then drink tea.
Rodger [dots]: I think you can. It's just not very convincing.
@enter Pebble farleft
@sfx pebble_talk
> Pebble comes in from the stairwell and lies down by the reception desk with his chin on his paws. He keeps one ear pointed at the stairs.
Tisha [dots]: He's been going back to that door every night.
Rodger [dots]: I know. He won't say why. He just listens.
@exit Pebble
@enter Glisten farright
Glisten [dots]: Tisha, you haven't polished the front windows.
Tisha [anger]: I'm a little busy, Glisten.
Glisten [dots]: Arthur's going to be furious when he comes back and the place looks like this.
Tisha [dots]: Arthur isn't coming back this week.
Glisten [dots]: He's coming back. He and Delilah. They always do. They just... take their time.
@exit Glisten
> Rodger watches her go. He doesn't say anything.
Rodger [dots]: That is the second person this morning who said "when Arthur comes back."
Tisha [dots]: It's what they've got. If it stops being true, they've got nothing.
Rodger [dots]: I know. I'm not blaming them.
@sfx step
@enter Toodles farleft
Toodles [note] (jump): Morning, everybody! I'm going up to see Gourdy! Does anyone want anything from the Halloween floor?
Poppy [sparkle]: Candy!
Toodles [note]: It's always candy! Okay! Bye!
@exit Toodles
> Connie drifts through a wall, too tired to scare anyone. Brightney's lamp flickers. Rudie sleeps on a bench with Coal in his lap. Nobody looks up.
@enter Brusha farleft
> Brusha comes in from the gallery with paint on both hands. She stops when she sees Tisha, and then she doesn't stop. She comes straight over.
Brusha [dots]: I need five minutes.
Tisha [dots]: I'm in the middle of something.
Brusha [dots]: You're always in the middle of something.
Tisha [dots]: Brusha.
Brusha [anger]: Somebody's been in my gallery. At night. I've found boot prints in the paint tray. Nobody on this floor wears boots.
Tisha [dots]: Maybe it was one of the Handlers. Before they left.
Brusha [dots]: They left ten days ago.
Tisha [dots]: Then I don't know. I really don't.
@enter Squirm farright
Squirm [dots]: Um. Sorry. I don't want to interrupt.
Tisha [dots]: Squirm. It's fine.
Squirm [dots]: Someone rearranges the library books each night. Same order, different shelves.
Rodger [?]: What order?
Squirm [tears]: I don't know. I tried to find the pattern and I started getting a headache.
Brusha [dots]: See? He feels it too. Something is wrong in here and everybody is walking around like it's July.
Tisha [anger]: It is July.
Brusha [anger]: You know what I mean!
@sfx pop2
> A few of the Toons nearby stop what they're doing. Poppy looks at her feet. Teagan looks at her tea.
Tisha [dots]: Not here. Please.
Brusha [dots]: Why not here? This is the one place everybody can hear.
Tisha [dots]: Tell sixty Toons there's a stranger here, and someone will get hurt hunting him.
Brusha [dots]: That's what you said about the Reserve.
Tisha [dots]: And I was right.
Brusha [dots]: You were right, and now they don't believe you either.
> That one lands. Tisha's jaw tightens. She doesn't say anything back.
Brusha [dots]: I'm not trying to fight with you.
Tisha [dots]: You said that last week too.
Brusha [dots]: And you told me our whole friendship was just something the cameras needed.
Tisha [dots]: I was angry.
Brusha [dots]: You said it, though.
@fx dark
> Neither of them moves. Rodger studies his notebook very hard. Squirm is looking at the floor like he's trying to hide in it.
Tisha [dots]: I'll come see the gallery tomorrow. Today I've got a floor full of people who think the building is on vacation.
Brusha [dots]: Fine.
@exit Brusha
@exit Squirm
@fx calm
Tisha [dots]: Don't say it.
Rodger [dots]: I wasn't going to.
Tisha [dots]: You were going to say I should go after her.
Rodger [dots]: I was going to say I have nothing to add. It's not my fight.
Tisha [dots]: Good.
@sfx dandy_text
@music delilah
@enter Dandy farright
> The front door opens. Dandy steps in with a crate of supplies under one arm. The room doesn't go quiet exactly. People just stop looking at him.
Dandy [dots]: Good morning. I have some bandages for the infirmary. I can leave them by the door.
> Nobody answers. Poppy takes a step back. Somebody puts a cup down a little too carefully.
Dandy [dots]: ...By the door, then.
@exit Dandy
Tisha [dots]: Everyone who was at the Reserve knows what we found. A lot of people haven't forgiven him for it.
Rodger [dots]: And the rest don't know yet, and they're being polite about it.
Tisha [dots]: Everybody's being polite. It's driving me up the wall.
@music unknown
@fx alarm
> In the planters by the window, every plant has turned toward the room. They're all smiling.
Rodger [dots]: Tisha.
Tisha [anger]: I see them. Pebble, up front. And somebody get everyone away from the windows.
` },

/* =================================================================== 4 */
c3r2: { title: 'Lost and Found', time: '10:30 AM', date: 'JULY 9, 2002', place: 'Platform Nine', script: `
@bg station2
@fx calm
@music neutral
> Dyle's cart waits at Platform Nine under a lantern and a hand-lettered sign: LOST AND FOUND. EVERYTHING HAS A TAG.
@enter Dyle left
@enter Tisha center
@enter Shelly right
Dyle [dots]: I'm not a shopkeeper. I want that clear.
Tisha [dots]: You've got a cart and a price list.
Dyle [dots]: I'm a conductor. I keep what passengers leave. If nobody claims it, I charge a fair price.
> The cart is full of small things, each one with a paper tag and a name. A feather duster. A train whistle. A dog's bone with a bite taken out of it.
Shelly [sparkle]: Is that Tisha's feather duster?
Tisha [dots]: It's not mine. Mine's in the lobby. That's... the other one.
Dyle [dots]: It was in lost property. I assumed somebody'd come for it.
Shelly [sparkle]: And this is Astro's pillow! And Pebble's bone!
Dyle [dots]: A named tag means it belongs to someone. No tag means it belongs to me.
Shelly [sweat]: How much is the whistle?
Dyle [dots]: It's mine. It's not for sale.
Shelly [dots]: ...The pillow, then.
Dyle [dots]: Thirty-eight hundred.
Tisha [dots]: Dyle, why now? Nobody's even riding the train.
Dyle [dots]: The train returned by itself on the eighth at eleven fifty-two. I never sent it. I'm putting it to work.
Tisha [dots]: Where did it go?
Dyle [dots]: It went beyond the freight tunnel. Came back empty, cab open, lever warm.
@fx dark
Tisha [dots]: Warm like somebody just let go of it?
Dyle [dots]: Warm like somebody was driving it.
> Tisha picks up a battered film can from the bottom shelf of the cart. The label is in marker, faded: DW · S2 · EP7 · BTS.
Tisha [?]: Is this what I think it is?
Dyle [dots]: Behind-the-scenes. Season Two. It was in the lost property from the Studio. Nobody's asked for it in nine years.
Tisha [dots]: I was in that season.
Dyle [dots]: I know. I played the tape once, to check it was a tape. I didn't watch.
Tisha [dots]: Can I borrow it?
Dyle [dots]: Everything has a tag.
Tisha [dots]: That's not a price.
Dyle [dots]: It's... no charge. Bring it back.
Tisha [heart]: Thanks, Dyle.
@exit Dyle
> A bit further up the platform, a light comes on. The shop sign in the lobby window flips from CLOSED to OPEN, with nobody touching it.
Shelly [!]: Is that the shop?
Tisha [dots]: It's Dandy's.
Shelly [dots]: Does anyone know he's open?
Tisha [dots]: Probably not. Nobody's looking at the window.
Shelly [dots]: I need bandages. I don't care who sells them.
Tisha [dots]: Me neither, honestly. They're the same bandages.
Shelly [dots]: Tisha, can I ask something?
Tisha [dots]: Sure.
Shelly [dots]: Why was Brusha so upset? She never comes out of the gallery.
Tisha [dots]: Because something's wrong, and I can't say she's wrong, and I'm too tired to be nice about it.
Shelly [dots]: You two used to be friends.
Tisha [dots]: We were. I thought. Then I saw the call sheets. Every hour together was scheduled.
Shelly [dots]: That doesn't mean it wasn't real.
Tisha [dots]: That's what Brusha said.
Shelly [dots]: Maybe she's right.
Tisha [dots]: Maybe. Eat your breakfast, Shelly.
@exitall
@music unknown
` },

/* =================================================================== 5 */
c3s1: { title: 'The Seasonal Floors', time: '2:15 PM', date: 'JULY 9, 2002', place: 'The Easter Floor', script: `
@bg easter
@fx calm
@music neutral
> The Seasonal floors are a long way from the lobby. Each holiday has its own wing, and in July none of them has anything to do.
@enter Toodles left
@enter Gourdy center
Toodles [note] (jump): Morning, morning, morning! Gourdy! You didn't tell me the Easter floor had a chandelier.
Gourdy [dots]: It's two in the afternoon, Toodles.
Toodles [note]: Still morning somewhere!
Gourdy [dots]: Please don't climb it.
Toodles [sweat]: I wasn't going to. I was going to look at it.
Gourdy [dots]: From the top.
Toodles [dots]: ...From near the top.
Gourdy [heart]: I'm glad you came up. It's been quiet.
Toodles [dots]: It's quiet downstairs too. Everybody just keeps saying "hiatus." I think they're scared and don't want to say so.
Gourdy [dots]: Are you?
Toodles [dots]: Me? No. I've got bad luck. I'm used to it.
Gourdy [dots]: That's not what I asked.
Toodles [dots]: ...A bit. Yeah.
@enter Bobette right
Bobette [dots]: Gourdy, have you got a second? It's Bassie.
Gourdy [dots]: Is she okay?
Bobette [dots]: She's been in the basket room for an hour. I brought her cocoa and she didn't touch it.
Toodles [dots]: Bassie always touches cocoa.
Bobette [dots]: That's what I said.
@exitall
@enter Bassie center
> Bassie sits against the basket room shelves, a page crushed in her paws. Cocoa waits beside her with an untouched cup.
@enter Cocoa left
@enter Gourdy right
@enter Bobette farright
Cocoa [dots]: She found something. She won't let go of it.
Bassie [tears]: Don't come too close.
@image note1
> She smooths the paper out. The first page is tidy. A neat, slanted hand, writing the same two words over and over.
Gourdy [dots]: "Get her. Get her. Get her."
Bobette [?]: Who's "her"?
Bassie [tears]: Turn it over.
@image note2
@fx glitch
> The back is a mess. The words are bigger, and the pen has gone through the paper twice. The middle is scribbled out.
Cocoa [dots]: Whoever wrote that couldn't stop.
Bassie [tears]: Look at the S in "Her." The little tail.
> There's a small curl on the end of every capital letter. A tiny ear.
Bassie [tears]: That bunny curl is mine. I've written it since I was a basket. This was under the good eggs.
Gourdy [dots]: Could somebody have copied it?
Bassie [tears]: Nobody's seen my handwriting. I only do it when I'm on my own.
@imgoff
> Cocoa takes a long breath. She looks at her cup, and she doesn't look at anybody.
Cocoa [dots]: Can I say something stupid?
Bobette [dots]: It's not going to be stupid.
Cocoa [dots]: Ginger saw two of me last week. One carried the other to the Christmas lift. That one wasn't moving.
Cocoa [dots]: I woke in the Reserve. Everyone said, "It's really you." But was I the one who walked—or the one they carried?
Gourdy [dots]: Cocoa...
Cocoa [dots]: I'm not asking you to fix it. I just needed to say it out loud somewhere that isn't the Reserve.
Bassie [tears]: Now you know how I feel. It's my handwriting, and I didn't write it.
Cocoa [dots]: Yeah. Yeah, I do.
> Bassie puts her paw on Cocoa's. Neither of them says anything. For a moment the room is a little less cold.
@sfx tw_vee_spot
@fx alarm
> The ribbons on the ceiling rustle. Every black egg on its string has turned to face the same way. Toward Bassie.
Gourdy [dots]: Toodles. Go downstairs. Get Pebble.
Toodles [shock]: I'm not leaving you.
Gourdy [dots]: I need you to get help. Please.
Toodles [dots]: ...Okay. Okay! I'll be fast. I'm very fast when I'm scared.
> Toodles runs for the stairs. Gourdy watches him go.
@horror eggs
> Something has been standing behind Bassie the whole time. A small pink shape, in the same dress, with the same ears.
@imgoff
@exitall
@enter Bassie farright
@enter TwistedBassie left
@music twisted
TwistedBassie [anger]: Get her.
Bassie [shock] (tremble): That's me.
Gourdy [anger]: It's not you. Stay behind me.
TwistedBassie [anger]: Get her. Get her. GET HER.
Bobette [dots]: It's reading off the page. It can't stop.
Bassie [tears]: Then I'll make it stop.
Gourdy [dots]: No. You're not going anywhere. Cocoa, Bobette, stay close.
Cocoa [dots]: We've got you, Bassie.
@fx shake
` }

});

;

/* ===== js/story/ch3-script-b.js ===== */
/* ch3-script-b.js - Main Story · Chapter 3 "Closed for Renovation", scenes 6-10.
   July 9, 2002: the Art Floor, Camera 6B, the first death, the Season Two tape, the Halloween floor. */
'use strict';

Object.assign(ST_STORY, {

/* =================================================================== 6 */
c3r3: { title: 'The Gallery', time: '1:00 PM', date: 'JULY 9, 2002', place: 'The Art Floor', script: `
@bg art
@fx calm
@music interesting
> The Art Floor smells like paint and fruit. In July it smells like both of those and something cold underneath.
@enter Tisha left
@enter Rodger center
@enter Vee right
Rodger [dots]: Vee, you said the camera trouble is in this wing?
Vee [dots]: Four feeds: ten seconds of the same hallway, then static.
Tisha [dots]: Which hallway?
Vee [dots]: This one.
@sfx step
@enter Brusha farleft
Brusha [dots]: You came.
Tisha [dots]: I said I would.
Brusha [dots]: You said tomorrow.
Tisha [dots]: It's tomorrow in about eleven hours. I got bored.
> Brusha almost smiles. It doesn't last.
Brusha [dots]: Squirm's in the back. He's been hiding in the storage room since last night. Go easy on him.
@enter Squirm right
Squirm [tears]: I'm not hiding. I'm... staying out of the way.
Tisha [dots]: That's called hiding, Squirm.
Squirm [dots]: ...Yes. It is.
Rodger [dots]: Brusha. Start from the beginning, please. What have you seen?
Brusha [dots]: I never see him. Just boot prints, a tipped paint tray, portraits turned around. Only when I'm gone.
Rodger [dots]: Could it be a Twisted?
Brusha [dots]: Twisteds don't wear boots.
Vee [dots]: Nobody wears boots here.
Brusha [dots]: That's what I'm saying.
Tisha [dots]: What about the eyes on the paintings?
Brusha [dots]: I turned the portraits with eyes. I couldn't bear them watching me.
> She finally looks at Tisha properly.
Brusha [dots]: Two nights ago I was working late. I felt somebody standing behind me. Close enough to touch. I didn't turn around.
Brusha [dots]: Somebody said "Zorry." Like that. A Z where the S goes. "Zorry, am I in the way?"
Tisha [dots]: Brusha...
Brusha [dots]: I turned, and he was gone. He started to say his name. D... I can't remember the rest.
Squirm [dots]: I heard it too, I think. From the library. Through the wall.
Rodger [dots]: You heard a voice through a wall.
Squirm [dots]: I heard something pleased to meet me.
@fx dark
> Nobody says anything. Rodger writes it down. His pen isn't steady.
Tisha [dots]: Why didn't you tell me this yesterday?
Brusha [anger]: I tried! You said "not here."
Tisha [dots]: ...I did. I know.
Brusha [dots]: And I said some things in the lobby I didn't mean.
Tisha [dots]: So did I.
Brusha [dots]: You meant yours.
Tisha [dots]: I meant it when I said it. I didn't mean it later. That's not the same, is it?
Brusha [dots]: No.
@horror corridor
> At the end of the corridor, the gallery portraits hang in the half dark. Every one of them has had its eyes scratched out of the paint.
> The scratches are fresh.
@imgoff
Tisha [dots]: Brusha. Did you do that?
Brusha [shock]: No. No, I'd never.
@sfx warn
@fx alarm
> A soft wet click, down the corridor. All the scratched-out portraits open at once.
> They don't have eyes now. They have lenses.
Rodger [dots]: Those aren't paintings. They're cameras that have learned to stay still.
Vee [anger]: I hate it when I'm right about cameras.
Tisha [dots]: Brusha, Squirm, behind me.
@exit Brusha
@exit Squirm
@music unknown
@fx shake
` },

/* =================================================================== 7 */
c3r4: { title: 'Camera 6B', time: '3:10 PM', date: 'JULY 9, 2002', place: 'Security Room', script: `
@bg library
@fx dark
@music interesting
> The Security Room has one door, six chairs and a wall of monitors. Eleven are dead. One is still on.
@enter Rodger left
@enter Tisha center
@enter Vee right
Vee [dots]: That's the live feed. Camera 6B, outside the core. It's the only one that's been working all week.
Tisha [dots]: Why does it look like it's pointing at us?
Rodger [dots]: Because it is.
@horror monitors
> One by one the dead monitors flicker on. Each one shows the same picture. It's this room. It's the three of them, standing exactly where they're standing now.
@imgoff
Vee [dots]: That's us.
Rodger [dots]: It's slightly ahead of us. Look at the clock in the corner. It's four minutes in the future.
Vee [shock]: It's recording something that hasn't happened yet?
Rodger [dots]: Or deciding how it's going to happen.
@fx glitch
> On the monitors, the Rodger in the footage turns toward the real one. He opens a notebook. He writes one word on the page and holds it up to the lens.
Tisha [dots]: What does it say?
Vee [dots]: I can't read it. The resolution's bad.
Tisha [dots]: It says RUN.
@sfx warn
@fx alarm
> Every monitor flashes REC. A small red light blinks in the corner of each frame.
Rodger [dots]: Tisha, come here.
Tisha [?]: Why?
Rodger [dots]: Because according to that footage only one of us is in the frame at the end. I'd prefer it wasn't you.
Tisha [shock]: Rodger, don't. You don't know that's real.
Rodger [dots]: No. But it's very specific.
Tisha [dots]: Then we all leave. Right now.
Rodger [dots]: The door's already closed.
@sfx ding
> On the screens, the Rodger in the footage looks up at the real one. He gives a small nod. It's almost an apology.
Vee [shock]: It's turning! The camera's turning toward Tisha!
@fx shake
@sfx hit_blunt
> Rodger shoves Tisha out of the way with both hands. She goes into Vee. The lens swings round. The red light turns white.
Tisha [shock] (fall): RODGER!
@fx flash
@fx whiteout
@stop
@bg black
@card REC
> It's very quiet. A small pair of round glasses lies on the floor with a hairline crack across the left lens. It's been there since 1991.
@fx bleed
Vee [tears] (fall): No. No, no, no.
Tisha [tears] (tremble): He pushed me. He pushed me out.
Vee [tears]: He said, "observation, not kindness." He said it, and then...
@sfx toon_death
> The monitors fade out one at a time. The last to go dark is 6B. It stays on the empty chair for a long while.
> Then, from every speaker in the room, a single music-box chime. It isn't Boxten's.
@enter Tisha left
@music emotional
Tisha [tears]: Vee.
Vee [dots]: Yeah.
Tisha [anger]: Help me get him out of here.
Vee [tears]: Tisha, there's nothing left to...
Tisha [anger]: Then help me carry the glasses.
@fx unbleed
@fx dark
> Behind them the monitor wall hums back on. Every screen, all at once, turns to look at them.
@music boss
` },

/* =================================================================== 8 */
c3r5: { title: 'Back From the Lobby', time: '5:22 PM', date: 'JULY 9, 2002', place: 'Gardenview Lobby', script: `
@bg lobby
@fx calm
@music emotional
> They carry the glasses back to the lobby. Nobody says anything on the way. There isn't anything to say.
@enter Tisha left
@enter Vee right
@enter Bobette center
Bobette [dots]: I'm so sorry. I heard.
Tisha [tears]: It happened an hour ago. How did you...
Bobette [dots]: I don't know. I've been standing here with this since lunch.
> She holds out a small wrapped box with a tag on it. In neat handwriting: FOR RODGER. WELCOME BACK.
Vee [dots]: Bobette. Why would you write that?
Bobette [dots]: I wrote it before anyone came. I had a feeling. I'm sorry.
@sfx pop2
@fx dark
> A soft ding from the front door. The kind a shop bell makes when somebody comes in.
@enter Rodger farright
> A small round figure stands in the doorway with his hand on the door. In the other hand, a notebook.
Bobette [dots]: ...Welcome back, Rodger.
@exitall
@enter Bobette left
@enter Rodger center
@enter Tisha right
@enter Vee farright
Rodger [dots]: Hello, Bobette. Tisha. Vee.
Tisha [shock]: Rodger?
Rodger [dots]: I seem to be in the lobby. It's twenty-two past five.
Vee [shock]: How...
Rodger [dots]: I pushed Tisha away from the lens. Then I was at the front door. Bobette had a box.
@sfx heal
Tisha [tears]: You're okay?
Rodger [dots]: I remember the ledger, Boxten's notched key, and you insisting you weren't a detective.
> She crosses the room in three quick steps and hugs him so hard his notebook hits the floor. For a second he doesn't move. Then he puts one arm around her.
Rodger [blush]: This is unusual.
Tisha [tears]: Shut up. Just shut up for a second.
@exitall
@enter Rodger left
@enter Tisha center
> After a while Rodger asks for his glasses. Tisha hands over the cracked pair. He looks at them, then at the lenses he's already wearing.
Rodger [dots]: Hm.
Tisha [?]: What?
Rodger [dots]: I died wearing these. The left lens has had that crack since 1991.
Rodger [dots]: The pair I'm wearing doesn't.
@fx dark
Tisha [dots]: Maybe you switched them.
Rodger [dots]: I didn't.
Tisha [dots]: Maybe you did and forgot.
Rodger [dots]: I remember dying. Yet my lens is clean. The pair you carried still has its crack.
Rodger [dots]: Either the lens repaired itself, or I was given his memories. Where did he go?
@horror lobby
> Bobette puts her box down on the desk. She's very still. She isn't looking at either of them.
@imgoff
Rodger [dots]: I need evidence that I'm continuous. That I'm the same person.
Tisha [dots]: Evidence of what?
Rodger [dots]: That I'm Rodger.
Tisha [dots]: What would count?
Rodger [dots]: I don't know. Nothing I can think of. Everything I think of, a copy could say too.
> He writes it down. Crosses it out. Writes it again.
Tisha [dots]: Stop.
Rodger [dots]: I can't. I have to know.
Tisha [dots]: You can't. Nobody can.
Rodger [dots]: That is not a satisfying answer.
Tisha [dots]: I've mopped this lobby for fifteen years. New mop, new bucket, half the tiles replaced. I'm not the Tisha who started.
Tisha [dots]: But someone says, "Morning, Tisha," and I answer. That has to count for something.
Rodger [dots]: That's not a scientific position.
Tisha [dots]: No. It's the only one I know anybody has lived on.
@enter Brusha farleft
> Brusha has been standing at the edge of the lobby for a while. She doesn't say anything yet.
Rodger [dots]: I'm afraid.
Tisha [dots]: Good. That's honest.
Rodger [tears]: I'm afraid I'm not him.
Tisha [dots]: Then we're afraid together. Some days I'm afraid I'm not me.
> Rodger laughs once. It's short, and not entirely steady, but it's his own.
Brusha [dots]: I told you something was wrong.
Tisha [dots]: Brusha.
Brusha [dots]: I'm not saying it to win. I'm saying it because you needed to hear it from somebody.
Tisha [tears]: ...I know. I should have listened yesterday.
Brusha [dots]: Yes. You should have.
> She comes the rest of the way into the room and stands beside Tisha, not quite touching. Neither of them mentions the lobby.
@exitall
@music silentnight
> A cold draught slides under the doors. The bedsheet over the CLOSED sign stirs. Somewhere in the walls, a camera turns.
` },

/* =================================================================== 9 */
c3f1: { title: 'Season Two', time: '8:00 PM', date: 'JULY 9, 2002', place: 'The Studio Archive', script: `
@bg veeShow
@fx calm
@music interesting
> Vee's old projector is in the Studio Archive. It still works. It makes a noise like somebody tapping a pencil on a table.
@enter Tisha left
@enter Brusha right
Tisha [dots]: This is the tape from Dyle's cart.
Brusha [dots]: I remember Season Two. I don't remember this day.
Tisha [dots]: That's why I want to see it.
Brusha [dots]: You don't have to watch it with me.
Tisha [dots]: I know. Hit the lights.
@exitall
@fx dark
@fx flashback
@card DANDY'S WORLD · SEASON TWO · 1993
@bg sign
@music delilah
> The tape starts mid-shot. It's the lobby set, with the big sign hung on the wall and lights on stands. A camera dolly crosses the frame.
@enter Tisha left
@enter Brusha center
Tisha [note]: Okay, say it again. "Welcome to the museum." Brusha, you're laughing.
Brusha [note]: I'm not laughing.
Tisha [note]: You are! You're doing the thing with your eyebrows!
Brusha [note]: Your sign is crooked.
Tisha [note]: It's not my sign, it's... okay, it is a little crooked.
> They laugh. It's the kind of laugh people only have when they've been in the same room for a long time.
@enter Arthur right
Arthur [heart]: Lovely, lovely. You two are my favourite part of this show.
Tisha [sparkle]: We know.
Arthur [dots]: Take a break. Ten minutes. Get some water.
@exit Tisha
@exit Brusha
> The camera keeps rolling. Nobody turns it off. Off to one side of the set, two people have stepped out of the lights.
@enter Delilah left
Delilah [dots]: Arthur, a minute.
Arthur [dots]: Of course.
Delilah [dots]: We lost two days last month. Three Toons were out at once. A fever, a glitch, and Poppy's bubble wrap incident.
Arthur [dots]: I remember.
Delilah [dots]: We can't keep rewriting the schedule every time one of them is unavailable. I'm proposing standbys.
Arthur [dots]: Standbys.
Delilah [dots]: Understudies. A substitute Toon for one scene, then back to the tanks. Practical.
Arthur [anger]: They aren't props, Delilah.
Delilah [dots]: I'm not saying they are.
Arthur [dots]: You're saying we should build a second Poppy because the first one has a cold.
Delilah [dots]: I'm saying the show is fifteen episodes a season and the network doesn't wait.
Arthur [dots]: Then the network can wait.
Delilah [dots]: The network is the reason we have a building.
> Arthur doesn't answer right away. He looks across the set at where Tisha and Brusha are sharing a bottle of water.
Arthur [dots]: Every Toon here chose to be here. I need to keep believing that.
Delilah [dots]: And they did. Nobody is forcing anyone. The Understudy Program is just a safeguard.
Arthur [dots]: Show me the form.
> Delilah hands him a single sheet. He reads it for a while. He takes a pencil from behind his ear.
Arthur [dots]: This line. "For all practical purposes, the same Toon." Who decided that?
Delilah [dots]: It's a legal phrase.
Arthur [dots]: It's a phrase.
> He writes something in the margin, small, in pencil. Delilah doesn't look at it.
Delilah [dots]: I'll sign it, then.
Arthur [dots]: I didn't say yes.
Delilah [dots]: You didn't say no.
@exit Arthur
@exit Delilah
> The tape runs on for a bit. A stagehand walks through the shot. Then somebody turns off the camera.
@fx noflashback
@fx dark
@bg veeShow
@enter Tisha left
@enter Brusha right
Brusha [dots]: What was he writing?
Tisha [dots]: I couldn't see.
Brusha [dots]: It looked like a question.
Tisha [dots]: Yeah.
Brusha [dots]: We were happy in that one.
Tisha [dots]: We were.
Brusha [dots]: Tish. Was that fake? Because of the schedule?
Tisha [dots]: ...No. It was real. The schedule just put us in the same room. The rest was us.
Brusha [dots]: Then why did you say it?
Tisha [dots]: Because I was scared and I wanted something to be somebody's fault.
Brusha [dots]: And it was mine.
Tisha [dots]: It was convenient. It wasn't fair.
> Brusha looks at the blank screen for a while.
Brusha [dots]: I'm not ready to say it's fine.
Tisha [dots]: I'm not asking you to.
Brusha [dots]: Okay.
@exitall
@fx calm
@music silentnight
` },

/* ================================================================== 9b */
c3e1: { title: 'Between Floors', time: '9:20 PM', date: 'JULY 9, 2002', place: 'The Service Elevator', script: `
@bg library
@fx calm
@music interesting
> The service elevator is small and slow. It has a mirror, a camera in the corner of the ceiling and a button for every floor. It smells of floor polish and old rain.
@enter Tisha left
@enter Brusha right
Tisha [dots]: You're sure you want to show me?
Brusha [dots]: The boot prints are still in the tray. I'd like somebody else to see them before I wash them off.
Tisha [dots]: Okay.
Brusha [dots]: And I wanted to say I'm sorry I snapped at you in the lobby.
Tisha [dots]: You were right to.
Brusha [dots]: I was right and I was rude. I can be both.
Tisha [dots]: So can I.
> The elevator hums. It passes the second floor. The numbers above the door go from 2 to 3 and then stay on 3.
@sfx machine_fail
@fx dark
> The lights flicker. The cab shudders, and stops.
Brusha [dots]: No.
Tisha [dots]: It's fine. They stick sometimes.
Brusha [dots]: Not on camera.
> The camera in the corner of the ceiling turns, very slowly, until the lens is pointed at the two of them.
Tisha [dots]: Don't look at it.
Brusha [dots]: I'm not looking at it. I'm looking at you.
Tisha [dots]: That's worse.
Brusha [dots]: I'd say that was funny but I'm too scared.
> They stand in silence for a bit. The elevator creaks.
Tisha [dots]: Do you remember the elevator episode?
Brusha [dots]: Season Three. Episode nine.
Tisha [dots]: We got stuck for real. They kept the cameras rolling because Arthur said it was the best take they'd had all year.
Brusha [dots]: We were stuck for forty minutes.
Tisha [dots]: And we talked the whole time. I don't remember about what.
Brusha [dots]: I do. You told me you thought nobody would remember the show after it ended.
Tisha [dots]: I said that?
Brusha [dots]: And I said I would.
> Tisha doesn't answer. She looks at her hands.
Tisha [dots]: I said it wasn't real, last week. The friendship. I said it was a schedule.
Brusha [dots]: You did.
Tisha [dots]: I was wrong. I remembered what I told you then—and I meant it.
Brusha [dots]: ...Okay.
Tisha [dots]: Okay?
Brusha [dots]: I'm still angry. But okay.
@sfx warn
@fx alarm
> There's a scratching in the roof of the cab. A hatch drops open. Black drips through it, one drop at a time. Each drop has a face.
Tisha [shock]: Oh, come on.
Brusha [anger]: Behind me.
Tisha [dots]: No. Next to you.
Brusha [dots]: ...Next to me, then.
@music twisted
@fx shake
` },

/* ================================================================== 10 */
c3s2: { title: 'Costume Hall', time: '10:30 PM', date: 'JULY 9, 2002', place: 'The Halloween Floor', script: `
@bg halloween
@fx dark
@music neutral
> The Halloween floor smells like wet leaves in every season. Nobody's turned on the strings of lights. Gourdy is carrying a single lantern.
@enter Gourdy left
@enter Bobette center
@enter Cocoa right
@enter Bassie farright
Bobette [dots]: Why the Halloween floor?
Gourdy [dots]: The note matches the costume tags. Soulvester said the racks moved to sublevel three in May—without our consent.
Cocoa [dots]: Is that what the other copies were wearing?
Gourdy [dots]: I don't know yet. That's why I want to talk to him.
@enter Soulvester farleft
Soulvester [dots]: My liege.
Gourdy [dots]: Soulvester. Hi. Are you all right?
Soulvester [dots]: I'm well. I've been keeping watch on the stairs.
Gourdy [dots]: Every night. I told you to get some sleep.
Soulvester [dots]: A knight rests when his watch is done.
Gourdy [dots]: Your watch is never done.
Soulvester [dots]: Then I'll rest when you're safe.
@enter Toodles farright
Toodles [note] (jump): Gourdy! I brought snacks! Pebble can't leave the stairs but he says hi. He didn't say it. He looked it.
Gourdy [heart]: Toodles. You didn't have to come all the way up.
Toodles [dots]: I told you I'd be fast. I just didn't say I'd be back.
Gourdy [dots]: ...Thanks.
@enter Eclipse right
Eclipse [dots]: Gourdy, I need to tell you something. I should have said it last week.
Gourdy [dots]: Go ahead.
Eclipse [dots]: Last Wednesday: boot leather, pencil shavings, floor wax on the stairs. Someone stood there a long time.
Eclipse [dots]: I called out. Someone said, "Zorry. Zo zorry." When I turned, only the smell remained.
Bobette [dots]: Did he say his name?
Eclipse [dots]: He started to. It began with a D. Then it just stopped, like somebody had lifted the needle.
Toodles [?]: A D what?
Eclipse [dots]: I don't know. I've been trying not to think about it.
Gourdy [dots]: Why didn't you say anything?
Eclipse [dots]: I did. You said I was tired.
Gourdy [heart]: I'm sorry. I should have listened.
Eclipse [dots]: It's fine. It might not mean anything. But it's been bothering my nose for a week.
> Bobette takes a folded yellow sheet off a rack by the wall. A typed memo, creased.
Bobette [dots]: This is the Seasonal Hall minutes. May.
@sfx ding
Bobette [dots]: "Item four. Costume storage. The Understudy racks were moved to Sublevel Three without our sign-off."
Bobette [dots]: "Item five. Soulvester asks that the racks not be labelled with the names of Seasonals."
Bobette [dots]: "Motion to ask Delilah why. Seconded by Gourdy. Not carried."
Gourdy [dots]: I forgot I seconded that.
Soulvester [dots]: You were the only one who did.
Cocoa [dots]: Soulvester. Why didn't you want our names on the racks?
Soulvester [dots]: I didn't want any of you to look at a rack and see a name you knew.
> Nobody answers. Toodles puts a hand on Gourdy's arm.
Toodles [dots]: You okay?
Gourdy [dots]: Yeah. I just wish somebody had asked. Before any of this.
@fx alarm
@sfx earth_quake
> At the top of the stairs, something large unfolds. It's the same size as Soulvester and exactly the same colour. It doesn't blink.
@enter TwistedSoulvester farright
Gourdy [shock]: Soulvester? That's...
Soulvester [dots]: That is not me, my liege.
Gourdy [dots]: Soulvester. I need you with us.
Soulvester [dots]: I was about to say the same. I won't stand aside while a copy of me wears my armour at you.
> The copy lowers its fist. The stairs groan. It's looking straight at Gourdy.
Gourdy [dots]: It's got your armour on.
Soulvester [dots]: It has everything but the watch.
Toodles [dots]: Gourdy. I'm not going anywhere.
Gourdy [dots]: I know. But I need you to go find Pebble and the others. Please. If this goes wrong, somebody should know.
Toodles [dots]: ...Okay. I'll be back. I mean it.
@exit Toodles
Eclipse [dots]: Pack. Behind Gourdy and Soulvester.
Gourdy [anger]: We're not letting it hurt anyone.
@music boss
` }

});

;

/* ===== js/story/ch3-script-c.js ===== */
/* ch3-script-c.js - Main Story · Chapter 3 "Closed for Renovation", scenes 11-15.
   July 9-10, 2002: Scraps, Eclipse alone on the trail, the Return Queue, the Handlers underground. */
'use strict';

Object.assign(ST_STORY, {

/* ================================================================== 11 */
c3r6: { title: 'I’m Doing a Thing', time: '11:31 PM', date: 'JULY 9, 2002', place: 'Gardenview Lobby', script: `
@bg lobby
@fx dark
@music emotional
> It's late. Most of the Residents have gone to bed. Bassie came down from the Easter floor an hour ago with the others, and she hasn't let go of the note.
@enter Tisha left
@enter Scraps center
@enter Bassie right
@enter Pebble farright
Bassie [tears]: I shouldn't have come here. I brought it with me.
Tisha [dots]: You shouldn't be on your own. That's all.
Scraps [note]: You can sit with us! We've got blankets. Pebble's very warm.
Pebble [dots]: Bark.
Bassie [tears]: The one saying "get her" had my face. It looked sorry.
Scraps [dots]: That's the worst part, honestly.
Bassie [dots]: Yeah.
@fx alarm
@sfx tw_vee_spot
@enter TwistedEggson farleft
> The lobby doors open without anybody touching them. A copy of Eggson walks in with his cane raised. He isn't looking at Tisha or Pebble. He's looking at Bassie.
TwistedEggson [anger]: Get her.
Tisha [dots]: Pebble. Front. Now.
Pebble [anger]: Bark!
> Pebble charges. The cane comes down. It isn't aimed at Pebble.
Scraps [shock]: Bassie, MOVE!
> Scraps gets there first. Her arm unrolls across the room. She shoves Bassie sideways with the flat of her hand.
@sfx swing_light
@fx flash
> The cane comes down where Bassie was standing. And on whoever's standing there now.
@sfx hit_blunt
@fx bleed
Scraps [dots]: ...Oh.
Tisha [shock] (fall): SCRAPS!
Scraps [dots]: Huh. That's... weird.
@sfx toon_death
> Scraps looks down at herself. Something has gone out of her, quietly, like a light being turned off in another room.
Scraps [sparkle]: I'm doing a thing.
> She smiles. It's the same one she had in the maintenance wing on the sixth. Then it goes out too.
@stop
> The lobby is silent.
@enter Pebble left
> Pebble makes a very small noise. It isn't a bark. He presses against the spot where Scraps fell, and stays there.
Bassie [tears] (fall): That was for me. That was meant for me.
Tisha [tears]: It's not your fault, Bassie.
Bassie [tears]: She pushed me out of the way. She just did it. She didn't even think.
@enter Bobette farleft
Bobette [dots]: Bassie. Look at me.
> Bobette kneels. She puts her hands over Bassie's.
Bobette [dots]: She'll be back. They come back, all of them. We've seen it twice today.
Bassie [tears]: You don't know that.
Bobette [dots]: No. I don't. But I'll be standing at that door when she does.
> On the floor, Scraps's scissors lie open. Bassie picks them up with both paws.
Bassie [tears]: I'll give them back.
Tisha [dots]: Hold on to them.
@fx unbleed
@fx dark
> The copy of Eggson lowers his cane and walks out through the open doors. He doesn't look back. He moves like somebody who's been told where to go.
@music silentnight
` },

/* ================================================================== 12 */
c3s3: { title: 'Scent Trail', time: '12:40 AM', date: 'JULY 10, 2002', place: 'The Halloween Stairs', script: `
@bg black
@stop
@card JULY 10, 2002
@card ECLIPSE, ALONE
@bg halloween
@fx dark
@music unknown
> The copy of Soulvester is gone. It walked back down into the dark when the fight ended, and the others went to check on Gourdy. Eclipse stayed on the stairs.
@enter Eclipse center
Eclipse [dots]: Okay. Nobody's watching. Just me and the smell.
> Under the leaves and the varnish there's something else. Warm metal. Ink. A faint sweetness, like fresh paint. It goes down the stairs.
Eclipse [dots]: Pack would say wait for the others. But the pack is asleep. And this trail is going cold.
@horror vent
> The stairs go down past the Halloween floor, past the freight lift, past a door marked STAFF ONLY that's been left open. It gets warmer the further he goes.
@imgoff
@sfx warn
> A chime, very soft. A music-box note. It's somewhere ahead and a little to the left.
Eclipse [!]: Boxten?
@enter TwistedBoxten right
> At the bottom of the stairs a small wooden figure is crouched in the dark, winding a key. It winds for a long time. Stops. Starts again.
Eclipse [dots]: You smell like him. But newer. Like the varnish hasn't dried.
> The figure goes completely still. It turns its head. It has Boxten's face and Boxten's key. Its eyes are wider than they should be.
@exit TwistedBoxten
@enter Boxten right
Boxten [tears] (tremble): Please don't hurt me.
Eclipse [dots]: I won't. I'm Eclipse. I just wanted to know who was following the trail.
Boxten [tears]: It's me. I'm Unit Four. I walked it. I didn't know anyone else was coming.
Eclipse [dots]: You wind your own key?
Boxten [dots]: It helps me think. Is that allowed?
Eclipse [dots]: Sure. I howl at the moon. We all have something.
> A small, frightened smile, the first in three days.
Boxten [dots]: They sent me to the lobby. I heard everyone laughing. They already had a Boxten. Where would I fit?
Eclipse [dots]: There's always room in a pack.
Boxten [tears]: If I go in, there'll be two of us. I'm afraid I'm the one who isn't real.
@exit Boxten
> He bolts. His key ticks away into the dark. Eclipse starts after him, and the tunnel answers with a voice he doesn't recognise.
@sfx warn
Voice~: Get her.
@fx alarm
Eclipse [shock]: Not again.
@music twisted
> Black drips from the ceiling. Slow. Smiling.
@fx shake
` },

/* ================================================================== 13 */
c3s4: { title: 'The Return Queue', time: '1:30 AM', date: 'JULY 10, 2002', place: 'The Press Annex', script: `
@bg greenhouse
@fx dark
@music emotional
> The passage ends in a hall Eclipse has never smelled before. It's long and low, and the walls are lined to the ceiling with brass drawers. Each one has a label.
@enter Eclipse center
@horror tanks
Eclipse [dots] (tremble): This isn't on any map.
@imgoff
> A conveyor belt runs down the middle. At the far end a small brass door opens and shuts at intervals. Each time it opens, a Toon-shaped shape slides out onto the belt.
Eclipse [dots]: That's where they go. Down the belt. To the lobby.
> The labels are in the same neat handwriting as the ledger. The sevens are crossed.
Eclipse [dots]: "TOODLES. ACTIVE." "POPPY. ACTIVE." "GLISTEN. RESERVE." "BOXTEN. UNIT FOUR. LEFT."
> He stops at a drawer halfway down the wall. The ink on the label is still wet.
Eclipse [shock]: "RODGER. RETURNED 5:22 PM."
@sfx warn
Eclipse [dots]: He didn't walk back in. He was sent.
> Next to it, a drawer with a brighter lamp.
Eclipse [tears]: "SCRAPS. LOBBY RETURN. SYNCED 11:31 PM. RETURN IN 04:42."
> The numbers tick down. 04:41. 04:40.
Eclipse [dots]: She died an hour ago, and this already has her on a clock.
@fx glitch
> Two drawers further along, a pair of labels side by side. He reads them twice before he lets himself understand.
Eclipse [shock]: "COCOA. UNIT ONE. LEFT." And under it: "COCOA. UNIT TWO. ACTIVE."
> His nose says there's no real difference between the two of them. They smell exactly the same.
Eclipse [dots]: Oh no. Oh, Cocoa.
> On the wall beside the belt, an old form is pinned under glass. He reads it out loud in a small voice.
@image note1
Eclipse [dots]: "Understudy Program. Form Zero-Three. Lobby Return."
@imgoff
Eclipse [dots]: "A Toon that is destroyed, unrecoverable or surplus to requirements is re-printed from its last memory sync and delivered to the Lobby."
Eclipse [dots]: "Cameras record memory syncs. The Toon wakes knowing everything. For all practical purposes, the same Toon."
Eclipse [anger]: For all practical purposes?
> Under the text, a signature. Approved: D.K. And in pencil, in the margin, a small note.
Eclipse [dots]: "Practical for who?"
> The belt hums. Another small shape slides out onto the track.
@sfx ding
Eclipse [dots] (tremble): We don't come back. The Press prints another, then gives them our memories.
Eclipse [dots]: I have to tell the others. And I have to tell Cocoa, and I don't know how.
@sfx step
@fx calm
> A knock from below. Three slow taps. A pause. Three more. It's faint, and patient.
Eclipse [dots]: Somebody down there's alive. I can smell soap, and old paper. A person.
> He puts his nose to the floor. Under the metal there's a cough, and a man's sweat.
Eclipse [dots]: ...I'm going back up. They need to hear this from me, not from a lobby.
@exit Eclipse
> He goes back up the way he came. Behind him the lamp on Scraps's drawer goes from green to amber. 04:12.
@music silentnight
` },

/* ================================================================== 14 */
c3r9: { title: 'Scraps Comes Back', time: '6:05 AM', date: 'JULY 10, 2002', place: 'Gardenview Lobby', script: `
@bg lobby
@fx calm
@music neutral
> It's very early. The sheet over the CLOSED sign has been folded and put on the desk. Bassie is sitting beside it, holding a pair of scissors in her lap like an egg.
@enter Bassie left
@enter Bobette center
Bobette [dots]: You didn't sleep.
Bassie [dots]: I'm waiting.
Bobette [dots]: I know. So am I.
@sfx pop2
> A soft ding from the front door.
@enter Scraps farright
Bobette [dots]: Welcome back, Scraps.
Scraps [sparkle] (jump): Hi! Hi! Did it work? Did I do the thing?
@exitall
@enter Bassie left
@enter Scraps center
Bassie [tears]: You did the thing.
Scraps [note]: Ooh, I knew it. I felt it, it was a lot of stretching.
> Bassie holds out the scissors in both paws. Scraps looks at them.
Scraps [dots]: Those are mine.
Bassie [tears]: I kept them for you.
> Scraps takes them. She holds them up to the light. She turns them over once.
Scraps [dots]: ...Huh.
Bassie [?]: What?
Scraps [dots]: Poppy sat on these in ninety-five. The left blade got a notch. It made such a pop.
Scraps [dots]: There's no notch.
> She runs her thumb along the edge. It's perfectly smooth. It's a beautiful pair of scissors.
Scraps [dots]: I remember the notch. I remember how it felt. I'm holding them and they feel exactly right, and it isn't there.
@fx dark
Bassie [tears]: Maybe they replaced the scissors.
Scraps [dots]: Maybe. Or maybe me.
> She puts them down on the desk. She's very calm. She isn't smiling.
@enter Eclipse farleft
@enter Cocoa farright
Eclipse [dots]: I need everybody. Now.
> Eclipse tells them. He keeps it short and doesn't skip anything. Cocoa stands very still beside Bobette. By the end, the lobby has gone quiet.
@enter Rodger right
@enter Tisha farright
Rodger [dots]: Form zero-three.
Eclipse [dots]: "Memory syncs recorded by the building's cameras." Rodger, I'm sorry.
Rodger [dots]: Don't apologise. It's the most useful thing anybody's said in two days.
Tisha [dots]: Is it?
Rodger [dots]: I wanted an explanation. It isn't a comforting one. But it's something I can read.
Scraps [dots]: So we all come back.
Eclipse [dots]: We get printed back, if somebody put us in a drawer in time.
Scraps [dots]: And if they didn't?
> Nobody answers. Cocoa clears her throat.
Cocoa [dots]: Eclipse. There were two drawers with my name.
Eclipse [dots]: ...Yes.
Cocoa [dots]: One said "left." One said "active."
Eclipse [dots]: Yes.
Cocoa [dots]: Okay. Thank you for not lying.
Bobette [dots]: Cocoa...
Cocoa [dots]: I'm okay. I think. I just needed to know it was real before I started pretending it wasn't.
> Bobette takes her hand. Nobody says it's fine.
Tisha [dots]: Then we shut the machine off.
Rodger [dots]: If we do, Scraps doesn't come back next time.
Scraps [dots]: I wasn't planning on dying again.
Rodger [dots]: Nobody plans it. That's the whole point.
Scraps [dots]: Then I'll be a little careful.
Rodger [dots]: Scraps, you ran in front of a cane.
Scraps [sparkle]: A little careful!
> A tiny, almost-laugh from the lobby. It doesn't last.
@sfx dandy_text
@music delilah
@enter Dandy farright
> The front door opens. Dandy stands in it with a brass key in his hand. The room goes quiet in the way it's been going quiet all week.
Dandy [dots]: I don't want to interrupt.
Tisha [dots]: Then say it quick.
Dandy [dots]: There's a way into the Annex from the Reserve office. This opens it.
> He puts the key on the reception desk. Nobody picks it up.
Dandy [dots]: I don't expect any of you to trust it. I'm only saying it's there.
Brusha [anger]: You built the place.
Dandy [dots]: I don't know that I did. I'd rather not say it was somebody else and be wrong.
Brusha [dots]: That's not a defence.
Dandy [dots]: No. It's all I've got.
> Tisha looks at the key. She looks at Dandy, who's keeping very still, like somebody who expects to be told to leave.
Tisha [dots]: Leave it on the desk. We'll pick it up if we need it.
Dandy [dots]: That's more than I expected. Thank you.
@exit Dandy
@enter Pebble farleft
@sfx pebble_talk
Pebble [!] (jump): Bark!
> Pebble's been at the stairs all night. He's trotted back in and he won't stop looking toward the lower door.
Rodger [dots]: He hears something down there.
Eclipse [dots]: I smelled somebody. A man, alive, in the dark. He's been down there a long time.
Tisha [dots]: Then Devan's alive. And somebody's knocking back on the other side.
Rodger [dots]: We find out who. And we find that machine.
@music unknown
` },

/* ================================================================== 15 */
c3h3: { title: 'The Service Tunnel', time: '2:10 AM', date: 'JULY 10, 2002', place: 'Beneath the Freight Station', script: `
@bg black
@stop
@card JULY 10, 2002
@card THE HANDLERS
@bg station
@fx dark
@music emotional
> The train didn't stop at a platform. It kept going down a long grade and let them off in the dark at the end of the line.
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Shannon [dots]: Everybody okay?
Sam [dots]: I think so. My ears popped.
Veronica [dots]: How far down do you think we are?
Austin [dots]: A long way. The air's warm.
> A service tunnel runs off to the left, lined with pipes. They're warm to the touch. Some of them hum.
@sfx robot
Intercom~: Attention, Gardenview staff. The lower levels are closed for renovation. Please do not enter. Thank you for your patience.
Shannon [dots]: That's Delilah's voice.
Sam [dots]: It's a recording. It's slightly slow.
Veronica [dots]: She doesn't say "patience." She says "cooperation."
Austin [dots]: Somebody wrote this. Somebody who's heard her say it a lot.
@fx glitch
> The tunnel lights go out ahead of them and come back on behind, like something is walking down the middle, switching them as it goes.
Sam [dots]: I don't love this.
Veronica [dots]: Nobody loves it. Keep moving.
@sfx metal_hit
> From somewhere ahead, in the pipes, three slow taps. A pause. Three more.
Shannon [!]: Did you hear that?
Austin [dots]: It's a knock. It's on the pipe.
Veronica [dots]: That's somebody who wants us to find them.
@horror door
> The tunnel opens onto a concrete landing. A yellow-striped blast door fills the far wall. Three small handprints mark the dust beneath it.
@imgoff
Sam [dots]: That's the lower blast door.
Veronica [dots]: That's where Devan went.
Austin [dots]: It's closed.
Veronica [dots]: There's a service door next to it. Let's try that.
> A narrow door beside the blast door is ajar. Behind it, a stairwell going down, and a faint light.
Shannon [dots]: Why's it open?
Veronica [dots]: Because somebody wants us to go in.
Sam [dots]: That's what I'm scared of.
Veronica [dots]: Me too. Go in anyway.
@fx shake
` }

});

;

/* ===== js/story/ch3-script-d.js ===== */
/* ch3-script-d.js - Main Story · Chapter 3 "Closed for Renovation", scenes 16-21.
   July 10, 2002: Retained, the other side of the door, Unit Four, the last petal, the Press, memories intact. */
'use strict';

Object.assign(ST_STORY, {

/* ================================================================== 16 */
c3h4: { title: 'Retained', time: '2:40 AM', date: 'JULY 10, 2002', place: 'Sublevel Four', script: `
@bg greenhouse
@fx dark
@music emotional
> The stairs end at a cell corridor. Most doors stand open. The timer lights have come on.
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Sam [dots]: There's a light at the end.
@enter Devan farleft
> A man is sitting on the floor in the last cell with his back against the wall, a small notebook open on one knee. He's thin. His uniform has been mended with tape.
Veronica [shock]: Devan.
Devan [dots]: Hi.
Veronica [tears]: Devan!
> She's across the corridor before anyone else moves. She stops short of touching him, like she's afraid he'll turn out to be a picture.
Devan [dots]: It's okay. I'm real. I think. Sit down for a second, I can't stand up too fast.
Sam [tears]: We thought you were dead.
Devan [dots]: I've been counting days. This is sixteen.
Shannon [tears]: Are you hurt?
Devan [dots]: Not really. They fed me. Somebody brought a tray every morning.
Austin [dots]: Who?
@fx alarm
@sfx tw_dyle_spot
@enter TwistedDandy right
> Behind the Handlers, at the end of the corridor, a tall figure steps out of the dark. A long coat of black petals. A clipboard. Both gloves on.
Devan [dots]: Him.
Veronica [shock]: That's Dandy.
Devan [dots]: It looks like him. I asked once which one he was. He said, "the one who stayed."
TwistedDandy [dots]: Unit One. First on the list. Last to be told.
Austin [anger]: You've kept him down here for two weeks.
TwistedDandy [dots]: I kept him alive. Nobody told me what to do with him after that. So I kept bringing the tray.
Devan [dots]: He did. Every day.
TwistedDandy [sparkle]: I was made to keep order. I kept it. Does anyone here intend to say thank you?
> Nobody says anything. He lifts the clipboard like a shield.
TwistedDandy [anger]: No. Of course not.
Sam [dots]: You can't keep a person in a cell and expect a thank-you.
TwistedDandy [dots]: It was the only room with a lock that worked. I didn't choose it.
Veronica [dots]: Let him go.
TwistedDandy [dots]: I can't.
Veronica [?]: Why not?
TwistedDandy [dots]: Because it says RETAINED. And nobody ever told me what it says if I stop.
> He lifts a brass stamp. It reads TERMINATE. His hand isn't steady.
Devan [dots]: He doesn't want to do it. Watch him.
Veronica [dots]: I'm watching.
Devan [dots]: Give me a second.
> Devan gets up. It takes him a long time. He puts himself in front of the Handlers with one arm out.
Austin [shock]: Devan, you can barely stand.
Devan [dots]: I've been sitting for sixteen days. I'd like to do something.
Shannon [dots]: You're not a fighter.
Devan [dots]: I'm a janitor with a dog. I can take a hit. Let me take the first one.
Veronica [dots]: ...Stay in front, then. We'll work around you.
Devan [dots]: Good. Aim at his guard. He keeps it up all the time.
@music boss
@fx alarm
` },

/* ================================================================== 17 */
c3h5: { title: 'The Other Side of the Door', time: '4:15 AM', date: 'JULY 10, 2002', place: 'The Lower Blast Door', script: `
@bg greenhouse
@fx dark
@music emotional
> The replica of Dandy lies on the stairs with the clipboard in two pieces beside him. He isn't hurt. He's just stopped.
@enter Veronica left
@enter Devan center
@enter Sam right
TwistedDandy [dots]: ...I had a list. I can't remember who was on it.
Devan [dots]: It's all right.
TwistedDandy [dots]: It isn't. I fed you for sixteen days and I don't know why.
Devan [dots]: Because you didn't want me hungry. That's a good reason.
> The copy doesn't answer. He sits on the bottom step, with his elbows on his knees, and looks at his gloves.
@exit TwistedDandy
@enter Shannon farright
@enter Austin farleft
Austin [dots]: What happens to him?
Devan [dots]: I don't know. I'd like to find out before somebody decides for him.
Sam [dots]: Devan. The door.
> They've all stopped at the foot of the lower blast door. It's closed. It's big and quiet and the handles are on the wrong side.
@horror door
Veronica [dots]: This is the one you closed.
Devan [dots]: I pulled the lever from this side. The lever's still here. I can't put it back. Somebody welded the bracket.
@imgoff
Shannon [dots]: So we can't go up.
Devan [dots]: Not through here.
@sfx metal_hit
> From the other side of the door, three slow taps.
Austin [!]: Someone's up there.
Devan [dots]: That's Pebble. He's been tapping since the day I shut it.
> Devan puts his hand flat on the metal. After a moment, he knocks back. Three taps. A pause. Three more.
@sfx metal_hit
> Above them there's a very faint scrabble, and then a bark that comes through the steel like it's under water.
Devan [tears]: Hey, buddy. Yeah. I'm here.
Sam [dots]: Is anybody with him?
Devan [dots]: I can't tell. I can hear him. I can't hear anyone else.
Veronica [dots]: If there's somebody up there, they can hear us.
Devan [dots]: Then they know I'm alive.
Veronica [dots]: That's something.
> She lays her hand on the door next to his. They stand there for a while.
Austin [dots]: Devan. Who wrote FIND ME on the wall of the station?
Devan [dots]: I didn't.
Austin [?]: You didn't?
Devan [dots]: I was down here the whole time. I don't know who that was. I never wrote it. Somebody did.
Shannon [dots]: Then we've got no idea who it was.
Devan [dots]: No. And I'd like not to find out in the dark.
Sam [dots]: There's another way up. The pipes in the sublevel run to somewhere. The knocking came from a pipe, too.
Veronica [dots]: The humming. It gets louder to the east. Whatever's making it, it's the biggest thing in the building.
Devan [dots]: Then we follow the sound.
> Pebble barks again, once, behind the steel. Devan doesn't answer this time. He doesn't need to.
@exitall
@music unknown
` },

/* ================================================================== 18 */
c3r10: { title: 'Unit Four', time: '11:00 AM', date: 'JULY 10, 2002', place: 'Gardenview Lobby', script: `
@bg lobby
@fx calm
@music neutral
> The lobby is quieter than it's been all week. Tisha has propped the front doors open for the air. Pebble sleeps against the desk with one ear up.
@enter Tisha left
@enter Rodger center
@enter Brusha right
@sfx pop2
> A soft chime, the music-box kind, from behind a potted plant. Everybody stops.
@enter Boxten farleft
> A small wooden figure is standing between the planters, holding a key. He hasn't come in. He hasn't left.
Tisha [dots]: Don't startle him.
Boxten [tears]: I'm sorry. I didn't want to come in. I only wanted to see.
Rodger [dots]: Unit Four?
Boxten [tears]: That's what the label says.
Rodger [dots]: What would you prefer?
Boxten [dots]: Boxten.
@enter Boxten right
Boxten [heart]: ...Hi.
> The other Boxten steps out of the crowd. They stand ten feet apart. Same height, same smile. One of them has a notch on the third tooth of his key.
Boxten [dots]: Hi. I'm Boxten. Do you want some tea?
Boxten [tears]: Am I allowed?
Boxten [heart]: Nobody told me you couldn't be.
@exitall
@enter Rodger left
@enter Boxten center
@enter Tisha right
> The new Boxten sits at the reception desk. Somebody puts a cup in his hands. He holds it like it might disappear.
Boxten [tears]: Can I ask something?
Rodger [dots]: Of course.
Boxten [tears]: Am I real?
> Nobody laughs. Nobody tells him not to ask.
Rodger [dots]: I'd like to answer that honestly.
Boxten [tears]: I'd like that.
Rodger [dots]: I don't know. I've been asking myself the same thing for a day.
Boxten [dots]: You have?
Rodger [dots]: I died yesterday. Came back at 5:22 with new glasses. I don't know if I'm the same Rodger.
Boxten [tears]: Oh.
Rodger [dots]: I can't tell you the answer. I can tell you what's helped me.
Boxten [dots]: Okay.
Rodger [dots]: It's an existential crisis. When something certain breaks, you start asking what you are—and whether it matters.
Rodger [dots]: Even the room can feel unreal. That doesn't mean you're broken. It means the question is too big to hold alone.
Boxten [dots]: That's exactly what it feels like.
Rodger [dots]: Three things have helped me. They're not clever. I'm a bit embarrassed by how simple they are.
Boxten [dots]: Tell me.
Rodger [dots]: One: do the next small thing. Hold the tea. Wind the key. The big question can wait until after lunch.
Rodger [dots]: Two: stay with someone. Tisha doesn't have an answer. She sits with me anyway.
Tisha [dots]: I do. I just don't say it.
Rodger [dots]: Three: you're allowed not to know. You learn to carry the question.
> Boxten holds the cup with both hands. He's crying a little. He doesn't seem to mind.
Boxten [tears]: And if I'm not him?
Rodger [dots]: Then you're you. I don't think that's worse.
@enter Brusha right
Brusha [dots]: Can I say something?
Rodger [dots]: Please.
Brusha [dots]: Two portraits of one person are different paintings. Neither is fake.
Boxten [dots]: ...That's nice.
Brusha [dots]: I'm not good at nice. It's just true.
Tisha [dots]: She's better at it than she thinks.
Brusha [dots]: Don't push it.
@enter Cocoa farleft
Cocoa [dots]: Boxten? Can I sit with you?
Boxten [tears]: ...Yes. Please.
> Cocoa pulls a stool over and sits down. She doesn't say who she is or what happened to her. She doesn't need to.
Cocoa [dots]: There were two of me, too. I don't know which one I am. It's been a bad week for that.
Boxten [dots]: What do you do about it?
Cocoa [dots]: Make cocoa. It's not an answer. But my hands know how to do it, so that's something that's still mine.
Boxten [heart]: That's a good one. I'll wind my key.
Cocoa [heart]: You do that. I'll do the cups.
@exitall
@enter Rodger left
@enter Boxten center
@enter Tisha right
Boxten [dots]: I know the way to the Press.
Tisha [?]: You do?
Boxten [dots]: I was printed there. I crossed the Return Queue to reach the lobby. The doors watch you.
Rodger [dots]: What kind of things?
Boxten [dots]: Flowers. Eyes. Little drops that smile. I stayed very quiet.
Tisha [dots]: Would you show us?
Boxten [tears]: I'm so scared of it.
Rodger [dots]: Me too. So let's use the method. One. The next small thing.
Boxten [dots]: Wind the key.
Rodger [dots]: Two.
Boxten [dots]: Not alone.
Rodger [dots]: Three.
Boxten [dots]: I'm allowed not to know.
Rodger [dots]: Good. Wind the key.
> Unit Four winds his key. It ticks slowly and steadily across the lobby.
@music twisted
` },

/* ================================================================== 19 */
c3r11: { title: 'Loves Me Not', time: '3:10 PM', date: 'JULY 10, 2002', place: 'The Return Queue', script: `
@bg library
@fx dark
@music unknown
> The Return Queue is a long dim corridor lined with brass drawers. Every drawer has a small green lamp. It smells like fresh varnish and warm paper.
@enter Tisha left
@enter Rodger center
@enter Shelly right
@enter Boxten farright
Shelly [sparkle] (jump): I've never been this happy in a creepy corridor!
Tisha [dots]: Shelly, please be a little scared.
Shelly [sparkle]: I am! Mostly! I just can't help being curious.
@horror tanks
> Along the walls, brass-plated drawers hold sleeping shapes in green light. Names the Toons know. Names they don't.
@imgoff
Boxten [dots]: This is where it gets quiet. These are the ones that finished.
Rodger [dots]: There are forty-one drawers on this wall. Twenty-six are lit. Fifteen are dark.
Tisha [dots]: What are the dark ones?
Rodger [dots]: Unused, or used up. I can't tell which.
@fx glitch
> At the far end of the corridor, between two drawers, a small bud has pushed up through a crack in the floor. It opens while they watch.
Shelly [sparkle]: Ooh! A flower!
Tisha [dots]: Shelly.
Shelly [dots]: I'm just going to look at it.
Rodger [dots]: It's smiling.
Shelly [dots]: Flowers smile. That's what they do.
@sfx warn
> A pink flower sways between the drawers. Every petal is perfectly arranged. A small, gentle smile is drawn on the yellow disc in the middle.
Tisha [shock]: Nobody go near it. Pebble went back to the lower door. We don't have anybody in front.
Shelly [?]: What's it doing?
> The flower reaches down with one leaf. It plucks a petal and lets it fall. It plucks another.
Boxten [tears]: Please don't go closer.
Rodger [dots]: Shelly, come back.
Shelly [sparkle]: In a second. I want to see what it's counting.
> Pluck. Pluck. The petals drift down. The smile doesn't change.
Rodger [shock] (shake): Shelly, step back, now!
@sfx tw_vee_spot
> One petal left. The flower lifts its face and looks, not at Tisha or Rodger, but at the yellow hard hat on the smallest Toon in the corridor.
Shelly [dots]: ...Oh.
Flower~: Loves me not.
@fx flash
@sfx hit_blunt
@fx bleed
@sfx toon_death
Shelly [sparkle]: Fascinating.
@stop
> She says it sincerely. It's the only word she has time for.
@fx unbleed
> The hard hat rolls across the floor and stops against Tisha's foot. It's perfectly clean.
Tisha [tears] (fall): SHELLY!
Rodger [tears]: No. No, no.
Boxten [tears] (tremble): It was smiling. The whole time it was smiling.
> Rodger kneels. He puts his hand on the hard hat. His hand's shaking so hard he drops it twice.
Rodger [dots]: She's not here. She was here and then she wasn't. It didn't hurry. It didn't hesitate. It just picked a petal.
Rodger [dots]: That's how it happened to me.
@fx dark
> At the end of the corridor a drawer clicks. A lamp comes on. The label on the glass reads SHELLY. RETURN IN 06:00:00.
Tisha [dots]: Six hours.
Rodger [dots]: She'll be back in the lobby by nine tonight.
Tisha [dots]: If the Press is still running.
Rodger [dots]: Yes. If it's still running.
@music emotional
Tisha [dots]: So we have to decide.
@choice Wait for Shelly | Go now
1> Rodger [dots]: We wait. I won't switch off the thing that's holding her.
1> Tisha [dots]: And the Press keeps printing hunters while we wait.
1> Rodger [dots]: ...Yes. And somebody else is on another clock.
1> Tisha [dots]: There's always another clock.
2> Rodger [dots]: We go. She'd tell us to go.
2> Tisha [dots]: And if she doesn't come back?
2> Rodger [dots]: Then we carry her the way we carried everyone else.
Tisha [tears]: That's the worst thing anybody's said to me all week.
Rodger [dots]: I know. I'm sorry.
Tisha [dots]: It's also the most accurate.
> She picks up the hard hat. She puts it on. It's much too small. She doesn't take it off.
@fx calm
@music silentnight
` },

/* ================================================================== 20 */
c3r12: { title: 'Counting Down', time: '6:30 PM', date: 'JULY 10, 2002', place: 'The Press', script: `
@bg black
@stop
@card THREE DOORS
@card ONE MACHINE
@bg greenhouse
@fx dark
@music emotional
@card THE HANDLERS
> Below the lower landing, the pipes all run the same way. The Handlers have followed them for hours. Now the pipes end in a steel hatch with a counter on it.
@enter Veronica left
@enter Devan center
@enter Sam right
@enter Shannon farleft
@enter Austin farright
Devan [dots]: It's coming from behind that. It's been counting the whole time.
Veronica [dots]: Counting what?
Devan [dots]: I couldn't tell you. I've been hearing it for two weeks.
> The counter above the hatch reads 41. While they look, it clicks over to 42.
@exitall
@card THE RESIDENTS
> Up in the building, the Residents have followed Boxten along the whole length of the Return Queue. The corridor ends in a large door.
@enter Tisha left
@enter Rodger center
@enter Toodles right
@enter Boxten farright
Boxten [dots]: That's it. That's the room.
Tisha [dots]: Did you hear a click?
Rodger [dots]: Somebody just changed a number.
Toodles [dots]: Somebody's somewhere else, too. I can hear them.
@exitall
@card THE SEASONALS
> On the holiday floors, a freight lift that has never been used comes down to a gallery of pipes. Bobette's lantern gives just enough light to see.
@enter Bobette left
@enter Gourdy center
@enter Eclipse right
@enter Cocoa farright
@enter Bassie farleft
Bobette [dots]: This is where the sleigh gets loaded.
Gourdy [dots]: And where everything else gets out, I guess.
Eclipse [dots]: Smell that? Ink and paper and warm metal. It's all the same smell. It's all one machine.
> Rows of drawers line the wall. A few of them have labels they recognise.
Bassie [tears]: That one says BASSIE.
Cocoa [dots]: That one says COCOA. Both of them do.
Gourdy [dots]: Don't read them. Just keep walking.
@sfx metal_hit
> Through the pipes, faintly, from a long way off, someone calls.
Toodles~: Gourdy? GOURDY!
Gourdy [shock]: Toodles?
Toodles~: I can hear you! Where are you?
Gourdy [dots]: I can't tell! The pipes! Stay where you are!
Toodles~: I'm not going anywhere! Remember what I said!
Gourdy [heart]: I'll be there. I promise.
@exitall
@card THE PRESS
@horror press
> Three doors, three squads, and none of them can see the other two. They open their doors in the same second.
@imgoff
> Behind all three is the same room. A cavernous chamber. One enormous machine fills the whole of it. Black pipes, brass rollers, a conveyor running into a slot like a printing mouth.
@sfx warn
> Above the slot, a red counter. It reads 42. As they watch, it ticks to 43.
@enter Tisha left
Tisha [dots]: Forty-three. Forty-one Toons, and two more.
@exit Tisha
@enter Veronica left
Veronica [dots]: It's adding us.
@exit Veronica
@enter Bobette left
Bobette [dots]: It's counting people who aren't even here.
@exitall
@fx alarm
@music twisted
> The Press hums. A grille opens in its side and a voice comes out of it. It's tinny, and kind, and perfectly even.
Press~: If any of you can hear me, stay where you are.
> It's Dandy's voice. The first half of the recording. The half that was his.
Press~: Counting begins.
@fx glitch
> It stops. The grille clicks. A second voice carries on in the gap. Not Dandy's. Something near it.
Press~: Forty-one. Forty-two. Forty-three.
Press~: Veronica Hurley. Present. Devan Reed. Present. Tisha. Present. Rodger. Present.
Press~: Bobette. Present. Gourdy. Present. Toodles. Present. Bassie. Present. Eclipse. Present. Cocoa. Present. Cocoa. Present.
Press~: Boxten. Present. Boxten. Present.
@enter Tisha left
Tisha [dots]: It said him twice.
@exit Tisha
@enter Devan left
Devan [dots]: That means we're all on the list.
@exit Devan
@enter Gourdy left
Gourdy [dots]: Then we get ourselves off it.
@exitall
@fx shake
> The counter ticks up. A row of drawers along the wall that were dark all this time start to light, one by one.
Press~: Everything must be returned. Everyone must be synced.
@music colossus
@fx alarm
` },

/* ================================================================== 21 */
c3r13: { title: 'Memories Intact', time: '11:52 PM', date: 'JULY 10, 2002', place: 'Gardenview Lobby', script: `
@bg black
@stop
> The humming stops. It doesn't fade. It just ends, like somebody lifted a needle.
@bg lobby
@fx calm
@music emotional
> The lobby, at night. The sheet is back over the CLOSED sign. Somebody has drawn a small flower on it in marker. It isn't smiling.
@enter Tisha left
@enter Rodger right
@enter Bobette center
@enter Brusha farright
Tisha [dots]: We broke it.
Bobette [dots]: I felt it. The whole building got lighter.
Rodger [dots]: The belt has stopped. The counter reads zero. Every lamp in the Return Queue is dark.
Tisha [dots]: Shelly's drawer too?
Rodger [dots]: Shelly's too.
> Nobody speaks. Tisha takes off the little yellow hard hat and holds it against her chest.
Tisha [tears]: She was on a clock. We broke the clock.
Rodger [dots]: I know.
Tisha [dots]: I knew the price. I just wanted to say it out loud.
@sfx pop2
> A soft ding from the front door, the kind a shop bell makes.
Bobette [dots]: Oh.
Tisha [?]: Bobette?
Bobette [dots]: I didn't write a tag. I didn't write anything. I don't know why I came to the door.
@enter Shelly farleft
@fx petals
Shelly [sparkle] (jump): Oh! Was I gone? How long was I gone?
> A very small figure in a yellow hard hat is standing in the doorway. She's clean. She's smiling. She's holding a small hammer.
Tisha [shock]: Shelly...
Shelly [sparkle]: I had the weirdest dream. There was a flower, and a corridor, and I said "fascinating."
Rodger [dots]: You did.
Shelly [dots]: Oh. So I was gone.
Tisha [tears]: You were gone.
Shelly [sparkle]: For how long?
Rodger [dots]: About eight hours.
Shelly [dots]: That's the longest I've ever been quiet.
> Tisha hugs her. She doesn't say anything. She holds her until Shelly says, a bit muffled, "you're squashing my hat."
@exitall
@enter Shelly left
@enter Rodger center
Shelly [dots]: Rodger. Can I ask you something scientific?
Rodger [dots]: Always.
Shelly [dots]: I remember everything. My hammer has a new scratch. And there's something wrong in my chest.
Rodger [dots]: What kind of feeling?
Shelly [dots]: Like when you find a fossil and you can't tell if it's the animal or just the shape it left behind.
Rodger [dots]: Ah.
Shelly [dots]: I'm sure it's nothing.
Rodger [dots]: It's not nothing. It's a very good question.
Shelly [dots]: I know. I just don't know what to do with it.
Rodger [dots]: There's a method. It has three steps. The first one's soup.
Shelly [sparkle]: I love soup!
@fx calm
@exitall
@enter Brusha left
@enter Tisha right
Brusha [dots]: I'm not saying "I told you so."
Tisha [dots]: You just did.
Brusha [dots]: I said I wasn't going to.
Tisha [dots]: Thank you. For telling me yesterday. And for the day before.
Brusha [dots]: It took a lot of dying.
Tisha [dots]: I know.
Brusha [dots]: I'm still angry about the other thing.
Tisha [dots]: That's fair.
Brusha [dots]: But I'm here.
Tisha [dots]: I know that, too.
@exitall
@music silentnight
@bg black
> Later. The lights have gone down. The last Toon has gone to bed. In the Security Room, the monitors hum.
@bg library
@fx tv
@horror boots
@enter Vee center
Vee [dots]: I'm just checking 6B. Hosts check the cameras. It's a thing.
> The monitor flickers. A corridor. Empty. Empty. Empty.
@imgoff
@fx static
@sfx robot
> On the left edge of the frame, very slowly, a boot comes in. It's dark. It's Toon-sized. It stops.
Vee [dots]: ...That's not...
> A voice comes out of the speaker, very soft, very polite, with the S the wrong way round.
Voice~: Zorry. Zo zorry. Am I in the way?
@fx glitch
> Vee doesn't scream. She reaches out, very slowly, and presses the power switch. The monitor goes black.
Vee [dots] (tremble): No.
> She stands there for a long time. Then she picks up a chair, wedges it under the door handle, and sits down with her back against it.
Vee [dots]: Hosts are always fine. Hosts are always fine.
@fx notv
@stop
> In the corner of the room the little red light on Camera 6B comes on by itself. The offset says +12. Somebody is still adjusting it by hand.
@bg black
@card BELOW THE BUILDING
> Far down, on a service stair that goes up and doesn't reach the top, five people stand around a door that won't open. Behind it a dog is asleep. They don't know that.
@enter Devan left
@enter Veronica center
@enter Sam right
Devan [dots]: Somebody up there got the machine.
Veronica [dots]: How can you tell?
Devan [dots]: The humming stopped.
Sam [dots]: So we're still stuck down here.
Devan [dots]: Not for long. There's another stair.
> Somewhere far above them, three slow taps come down through the steel. Devan lifts his head. He doesn't answer. He just smiles.
@exitall
@bg renovation
@music journal
> Outside, in the park, the green screen under the sign flickers. The letters rearrange themselves.
> CLOSED FOR RENOVATIONS. REOPENING SOON.
@card END OF CHAPTER 3 · CLOSED FOR RENOVATION
` }

});
