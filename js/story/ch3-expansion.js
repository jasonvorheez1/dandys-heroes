/* Additional Chapter 3 scenes. Each sits between existing beats, so the
   original revelations and the three-squad finale keep their order. */
'use strict';

Object.assign(ST_STORY, {
  c3x1: { title: 'The Signal Cabin', time: '12:03 AM', date: 'JULY 9, 2002', place: 'Platform Zero', script: `
@bg station
@fx dark
@music unknown
> The last drop bursts. In the quiet afterward, a green lamp lights above the disused signal cabin.
@enter Veronica left
@enter Sam center
@enter Shannon right
@enter Austin farright
Sam [sweat]: That lamp was out when we came in.
Shannon [dots]: So was the camera under it.
@fx static
> On the cabin monitor, four figures stand at the platform edge. The picture is twelve minutes ahead. One figure is missing.
Austin [shock]: That's us. Where's Sam?
Sam [dots]: I'm standing right here.
Veronica [dots]: The recording hasn't happened. We can change it.
> A pen rolls across the cabin desk. Nobody touched it. It stops against an open timetable: 11:52, circled twice.
Shannon [dots]: The train arrived at eleven fifty-two. The warning at the gate said eleven fifty-two.
Austin [dots]: This screen is twelve minutes ahead of my watch.
Veronica [dots]: Somebody wants us looking at the wrong time.
@horror monitors
> The monitor clicks. Sam reappears in the picture, looking straight into its lens. The real Sam has not moved.
Sam [tears]: I don't like what he's about to say.
Sam~: Don't follow the light.
@imgoff
@sfx warn
> The green lamp swings toward the stairs. Its beam settles on Sam's badge. A red recording light comes on.
Veronica [!]: Away from the lens. Keep the cabin between you and it.
Sam [dots]: Finally, an instruction I understand.
@music twisted
` },

  c3x2: { title: 'The Blind Spot', time: '2:05 PM', date: 'JULY 9, 2002', place: 'The Art Floor', script: `
@bg art
@fx dark
@music interesting
> The gallery is clear. Brusha pulls a canvas off the wall. Behind it, a camera cable runs through fresh paint.
@enter Brusha left
@enter Tisha center
@enter Vee right
Brusha [anger]: Someone drilled through my painting.
Vee [dots]: The cable goes to Camera 6B. It shouldn't reach this floor.
Tisha [dots]: And the boot prints?
> Brusha holds the canvas sideways. A print crosses the painted floor and continues across the wooden frame.
Brusha [dots]: He stepped here before the paint dried. The camera watched him do it.
Tisha [dots]: You told me. I should have looked.
Brusha [dots]: You can look now.
@fx static
> All the ceiling lights shut off except one. In it, the canvas shows a fourth shadow behind the three Toons.
Vee [shock]: Don't turn around. There's nobody there on the live feed.
Tisha [dots]: Then why's the shadow moving?
Brusha [dots]: Because whoever painted it knew we'd stand here.
> The shadow raises one hand. In the hall, a real hand scrapes along the wall at the same speed.
Tisha [!]: Back to the service door. Together.
Brusha [anger]: Take the canvas. I'm not letting him keep the evidence.
@sfx machine_fail
@fx blackout
> The lone light dies. Something in the dark takes one careful step toward them.
@music unknown
` },

  c3x3: { title: 'Names on the Racks', time: '11:06 PM', date: 'JULY 9, 2002', place: 'Halloween Costume Storage', script: `
@bg halloween
@fx dark
@music unknown
> The copy of Soulvester retreats down the stairwell. Its armour strikes the wall once, then the sound stops. An open storage door rocks on its hinge.
@enter Gourdy left
@enter Soulvester center
@enter Bobette right
@enter Cocoa farright
@enter Bassie farleft
Gourdy [dots]: Everyone here? Good. Don't follow it alone.
Soulvester [anger]: That armour came from my rack. I intend to find out who opened it.
> Inside, the holiday costumes hang in rows. Each rack has two hooks and one name. Some hooks are empty. Some have a second costume, still damp.
Bobette [dots]: There are two bells under my tag.
Cocoa [dots]: Two aprons under mine.
Bassie [tears]: Don't tell me what's under BASSIE.
Gourdy [dots]: You don't have to look.
> A tag swings on the last rack. SOULVESTER · UNIT TWO · READY. Its ink is fresh.
Soulvester [dots]: I asked them to remove our names. They made another list instead.
@fx glitch
> A second bell rings behind the racks. Bobette's own bell answers from her sleeve.
Bobette [shock]: Mine wasn't the first one.
Gourdy [!]: Out. Now.
> The damp costumes lift, slowly, as if someone has stepped into each one. The aisle between them narrows.
Soulvester [anger]: Behind me, all of you. My name is on that tag. My word isn't.
@music twisted
` },

  c3x4: { title: 'The Sorting Line', time: '12:15 PM', date: 'JULY 10, 2002', place: 'The Return Queue', script: `
@bg library
@fx dark
@music emotional
> Unit Four leads them down the corridor he escaped. Every door has a number; none has a handle on this side. A bell rings from somewhere beneath the floor.
@enter Boxten left
@enter Tisha center
@enter Rodger right
@enter Brusha farright
Boxten [sweat]: After the bell, the things in the doors came out. I hid until it stopped.
Rodger [dots]: How often does it ring?
Boxten [dots]: I counted four steps between each one. I wasn't counting time. I was counting my steps.
Brusha [dots]: That's still useful. Keep counting.
> Along the wall, little brass windows show names as paper strips pass beneath them. SCRAPS. RODGER. SHELLY. Each has a matching photograph taken by a camera.
Tisha [dots]: Those aren't records. They're instructions.
Rodger [dots]: The machine keeps a pattern of us. The cameras feed it changes.
Boxten [tears]: So it can make another me.
Tisha [dots]: Yes. We need to stop it choosing for us.
> Boxten's key catches. He works it loose with shaking fingers and winds it himself.
Boxten [dots]: Next small thing. The bell. We get past the bell.
Brusha [dots]: I'll mark the safe doors. You'll know where to run.
@sfx ding
@fx alarm
> The brass windows turn red. Every name on the wall stops moving, except BOXTEN. It advances one space.
Boxten [shock]: It knows I'm here.
Tisha [anger]: Then it knows we're with you.
@music twisted
` },

  c3x5: { title: 'The Pressure Shaft', time: '6:08 PM', date: 'JULY 10, 2002', place: 'Below the Holiday Floors', script: `
@bg greenhouse
@fx dark
@music emotional
> The freight lift stops below its lowest marked floor. A pipe crosses the exit, trembling with heat. Past it, the Press hums like a choir holding one note.
@enter Gourdy left
@enter Bobette center
@enter Bassie right
@enter Cocoa farright
@enter Eclipse farleft
Bassie [tears]: Shelly went in before us. She didn't come back out.
Bobette [dots]: The Lobby door is watched. If she returns, we'll know.
Gourdy [dots]: And if she doesn't, we find her. Either way, we keep moving.
Eclipse [dots]: Three paths meet beyond this shaft. I can smell the Handlers through the pipe.
Cocoa [dots]: Can they hear us?
> Eclipse taps three times. After a pause, three taps answer from far below. Another three answer from above.
Eclipse [sparkle]: Both paths heard. We're all close.
@sfx machine_fail
> A valve turns without a hand. Steam spills across the floor. On the glass above it, five names appear in fog. A sixth space stays blank.
Bassie [dots]: It's leaving room for someone.
Gourdy [anger]: It doesn't get to choose who.
Soulvester~: My liege! The pipe is opening!
Gourdy [!]: Behind the shield. When it vents, run for the next door.
> The pipe swells. A low, human voice counts to four inside it. At four, the seam splits.
@fx shake
@music boss
` }
});
