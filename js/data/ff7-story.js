/* ff7-story.js - Gold Saucer story scenes between event battles.
   Script DSL (one line each):
     @bg key | @music key | @enter Who slot | @exit Who | @exitall
     @fx flash|shake|fireworks|sand|fall|night|day|glitch|door|confetti
     @title Big card text | @wait ms | @sfx name
     > narration
     Who [emote] (anim): dialogue         (emote/anim optional)
   The FF7 party has never met Sora or the other Keyblade wielders. */
'use strict';

const FF7_STORY = {};
function ff7Scene(id, title, script) { FF7_STORY[id] = { id, title, script: script.trim().split('\n').map(s => s.trim()).filter(Boolean) }; }

ff7Scene('s1', 'The Gold Door', `
@bg station
@music goldsaucer
@title CHAPTER 1 · THE GOLD DOOR
> A door appears behind the Gardenview elevator. Through it: a crowded station beneath the lights of the Gold Saucer.
@fx door
@enter Vee center
Vee [!] (hop): Well. This wasn't on the schedule.
@enter Shelly left
Shelly [sparkle]: Is that entire place built on one pillar?
@enter Bassie farleft
Bassie [sweat]: Can we go back before anyone notices us?
@enter Gigi right
Gigi [sparkle] (bounce): They have prize machines. I can hear them from here.
@enter Dandy farright
Dandy [idea]: Keep your money where I can see it, Gigi. That includes mine.
@fx shake
@sfx surprise
> A shout cuts through the station music. Bandits have cornered the ticket staff.
Bandit: Bags on the floor. Tickets too.
Vee [anger]: All right. That's enough.
@exit Bassie
@exit Shelly
@exit Gigi
@exit Dandy
@enter Cloud left
Cloud [dots]: Move.
@enter Tifa right
Tifa [!]: Cloud, wait. They aren't with the bandits.
Cloud [?]: You know them?
Tifa: No. But they're looking at us the same way we look at them.
Bandit: Hey, sword boy. Drop it.
Cloud [dots]: Bad idea.
Tifa (nod): Get the staff clear. We'll handle these guys.
Vee [note]: You heard her. Move!
`);

ff7Scene('s2', 'Thirty-Hour Passes', `
@bg station
@music goldsaucer
@title CHAPTER 2 · THIRTY-HOUR PASSES
@enter Tifa center
@enter Bassie left
Tifa: Is anyone hurt?
Bassie [sweat]: Just shaken. Bobette's checking the ticket booth.
Tifa (nod): Thanks for helping. I'm Tifa. The swordsman is Cloud.
@enter Cloud right
Cloud [dots]: We should keep moving.
@enter Shelly farleft
Shelly [idea]: We're from Gardenview. A door brought us here. It's happened before, but we don't know why.
Cloud [?]: A door.
Shelly: Sora called them paths between worlds. He had a Keyblade, so I took his word for it.
Cloud: Never heard of him.
@enter Aerith farright
Aerith [note] (hop): Found you. And I bought the passes before the line got any worse.
Aerith [?]: Oh. We have company.
@exit Shelly
@exit Cloud
@enter Dandy right
Dandy (sway): Dandy. Pleased to meet you.
Aerith [heart]: A talking flower. I sell flowers in Midgar. Usually they don't introduce themselves.
Dandy [note]: Usually I charge for it.
Tifa: Aerith, did you find Barret?
Aerith [dots]: An attendant saw a man with a gun-arm head toward Wonder Square. He wouldn't stop to talk.
Tifa [sweat]: He heard something about another man with a gun-arm near Corel. Then he took off.
Tifa: We need to know what he heard.
@enter Bobette farleft
Bobette: We can help look. There are enough of us to cover the Square.
Aerith (nod): Good. Stay in pairs. This place is easy to get lost in.
Bassie [shock]: Gigi isn't here.
@sfx slots
> Bells ring somewhere up the tube to Wonder Square.
Dandy [dots]: I think we know where to start.
@fx shake
> Playing cards scatter down the tube. Something laughs above them.
Tifa [!]: Stay close.
`);

ff7Scene('s3', 'The Fortune Teller', `
@bg wonder
@music caitsith
@title CHAPTER 3 · THE FORTUNE TELLER
> Gigi follows the machines through Wonder Square until the station is well out of sight.
@enter Gigi center
Gigi [sparkle]: Three bells. Finally.
Gigi [dots]: ...Where did everybody go?
@enter CaitSith right
CaitSith [note] (hop): You looking for your friends, or your next win?
Gigi [!]: A cat on a Moogle!
CaitSith: Cait Sith. And this is a very fine Moogle, thank you.
Gigi [?]: Can you help me find them?
CaitSith (sway): I tell fortunes. Finding people costs extra.
Gigi [sweat]: How much?
CaitSith [note]: I'm joking. Hold still.
> Cait Sith studies her palm, then glances toward the station.
CaitSith: Your friends are on their way. One of them's worried sick.
Gigi [dots]: Bassie. I should've told her where I was going.
CaitSith: You can tell her when she gets here.
Gigi (nod): Right. No more machines until then.
@sfx slots
Gigi [sweat]: ...That one doesn't count. I didn't touch it.
@fx shake
> Three Jokers step out from behind the cabinets. A Cactuar follows them into the light.
CaitSith [!]: Bad timing. Get behind the Moogle.
Gigi [anger]: I can fight too.
CaitSith [note]: Even better. Let's give your friends something to follow.
`);

ff7Scene('s4', 'What You Seek', `
@bg wonder
@music goldsaucer
@title CHAPTER 4 · WHAT YOU SEEK
@enter Bassie left
@enter Gigi center
Bassie [tears] (hop): Gigi!
Gigi [sweat]: I'm sorry. I followed the bells and lost track of everything.
Bassie: Next time, tell me first.
Gigi (nod): I will.
@enter CaitSith right
CaitSith [note]: She helped me with those Jokers. Name's Cait Sith.
@enter Cloud farleft
Cloud [dots]: A fortune teller.
CaitSith: Want one?
Cloud: No.
@enter Tifa farright
Tifa [note]: I do. Tell his.
CaitSith (sway): All right. What you seek, you will obtain. But you will lose something dear.
> Cloud looks at the machine in Cait Sith's hands. Its lights keep blinking.
Cloud [?]: That's the whole fortune?
CaitSith [sweat]: Afraid so.
Tifa: We should go. Barret's still out there.
@exitall
@enter Shelly left
@enter Aerith right
Shelly [idea]: Aerith, there are fossils in the stone under the Square. They built all this right over them.
Aerith: Midgar's built over older ground too. Hard to see any of it under the plates.
Shelly: You said you can hear the Planet. Can you hear it here?
Aerith [dots]: A little. Too much noise up top.
Shelly: I could show you where the old rock is exposed.
Aerith [note]: After we find Barret, I'd like that.
@enter Dandy center
Dandy: The Ghost Hotel has a room to spare. The staff say something's been living in their basement.
Aerith [?]: And they offered you the room if we deal with it?
Dandy [blush]: I may have mentioned that I know capable people.
Tifa (nod): We need somewhere to sleep. Let's see what's down there.
`);

ff7Scene('s5', 'Fireworks', `
@bg ghost
@music caitsith
@fx night
@title CHAPTER 5 · FIREWORKS
> The Ghost Hotel is quiet again. Outside, fireworks rise over the Saucer.
@enter Tifa left
@enter Bassie right
Bassie [sweat]: Do the beds have to look like coffins?
Tifa [note]: You can take the chair. I'll stay up a while.
Bassie: Because of Barret?
Tifa (nod): He ran off before we could ask what was wrong. I keep thinking I should've followed him.
Bassie: Maybe he needed time alone.
Tifa: Maybe. He still shouldn't have to face it alone.
Bassie [dots]: Gigi does that sometimes. Runs ahead without thinking.
Tifa: And you go after her.
Bassie: Every time.
Tifa [note]: Then you know what we're doing tomorrow.
@exitall
@enter Cloud left
@enter Vee right
Vee: Found you. The others are inside.
Cloud: Couldn't sleep.
Vee [note]: Neither could I. The fireworks are better from here.
> They watch the next volley in silence.
Vee: Tifa's worried about you too, you know.
Cloud [dots]: I know.
Vee: She'll be up for a while. You could talk to her.
Cloud: Maybe I will.
@exitall
@enter Aerith left
@enter Dandy right
> A gondola crosses above the park. Aerith leans against the glass; Dandy keeps an eye on the flower tucked behind her ear.
Aerith [sparkle]: Look at Speed Square. From up here it almost looks peaceful.
Dandy: Almost.
Aerith: You're thinking about the shop.
Dandy [dots]: I'm thinking about how quickly everyone left it behind.
Aerith: They'll come back. Bassie asked if you'd saved her a seat.
Dandy [?]: She did?
Aerith (nod): She did.
@fx fireworks
@sfx happy
> A burst of gold fills the gondola window.
Dandy [note]: That one was worth the ticket.
Aerith [note]: I thought so.
> A crash from Speed Square cuts through the fireworks. Below, riders scatter as Cactuars spill onto the track.
Aerith [!]: We need to get down there.
`);

ff7Scene('s6', 'Gun-Arm', `
@bg battle
@music drama
@fx day
@title CHAPTER 6 · GUN-ARM
> Morning. The party reaches Battle Square as a siren begins to sound.
@enter Cloud center
@enter Tifa right
> Two guards lie dead on the stairs. A third is wounded. The wall behind them is riddled with bullets.
Tifa [shock]: Barret was here.
Cloud: Someone with a gun-arm was.
@enter Shelly left
Shelly [sweat]: The one by the wall needs help.
Dio: My staff are on their way. You aren't leaving.
> Dio enters with a line of guards behind him.
Dio: Two of my staff are dead. A witness saw a gun-armed man with your group. Tell me where he is.
Tifa [anger]: We don't know. We're looking for him too.
Dio: Then you can wait while we find out.
Cloud: Lower the weapons. No one here fired those shots.
@enter Vee farright
Vee: There's a survivor on the stairs. Help him first.
Dio: Guards. Take them.
@enter CaitSith farleft
CaitSith [!]: Uh, Dio? The arena gate's open.
> Chains scrape inside the arena. A Death Claw pushes against the bars.
Cloud [dots]: Back from the gate. Now.
`);

ff7Scene('s7', 'Corel Prison', `
@bg outside
@music drama
@fx fall
@title CHAPTER 7 · COREL PRISON
> After the arena fight, Dio sends the party through a floor hatch into the desert below the Saucer.
@fx shake
@sfx surprise
@enter Gigi center
Gigi [shock]: Ow. Is everyone here?
@enter Bassie left
Bassie [sweat]: I think so. Where are we?
@enter Shelly right
Shelly: The sign by the gate says Corel Prison.
@enter Tifa farright
Tifa [dots]: Dio put us down here until he decides what to do with us.
@enter Cloud farleft
Cloud: We have to find Barret first.
Tifa: You still think he shot those guards.
Cloud: I didn't say that. But he was there, and he left.
Tifa: Then let's ask him why.
@exit Gigi
@exit Bassie
@enter Aerith center
Aerith: The tracks lead west. One set of boots, heavy on the right side.
Shelly [idea]: And fresh shell casings. He came this way.
@enter Bobette left
Bobette: I found water in the guard shack. Fill up before we go.
> An older prisoner watches them from the doorway.
Prisoner: Gun-arm went past the bandit camp before sunrise. Still heading west.
Tifa [?]: Was he alone?
Prisoner: Far as I saw.
Cloud (nod): We leave now. The tracks won't last in this wind.
`);

ff7Scene('s8', 'Sandstorm', `
@bg outside
@music caitsith
@fx sand
@title CHAPTER 8 · SANDSTORM
> The wind erases the path. When it settles, Bassie is missing.
@enter Gigi center
@enter CaitSith right
Gigi [shock]: Bassie? Bassie!
CaitSith [dots]: She was beside me. I lost her when the sand hit.
Gigi [sweat]: We need to spread out.
CaitSith: Not in this wind. Stay with me. We'll search the tanks first.
@exitall
@enter Bassie center
> Bassie crouches behind a rusted water tank, shielding her eyes from the sand.
Bassie [sweat]: Hello? Can anyone hear me?
@enter Tifa right
Tifa [!]: Bassie! Over here.
Bassie [tears]: I couldn't see the path.
Tifa (nod): Neither could we. Come on. The others are close.
@enter Gigi left
Gigi [tears] (hop): There you are. I was looking everywhere.
Bassie: I'm okay. Just cold.
Gigi [note]: I'm staying right here until we get out of this.
@enter Shelly farright
Shelly [idea]: I've got the tracks again. Metal heel, same as before.
@enter Aerith farleft
Aerith: Where do they go?
Shelly: Past that ridge. The crossing goes through a Death Claw nest.
`);

ff7Scene('s9', 'Marlene', `
@bg outside
@music drama
@fx night
@title CHAPTER 9 · MARLENE
> Beyond the nest, the tracks end at a wrecked rail car. Someone has scratched a message into its side.
@enter Tifa center
Tifa [dots]: "Marlene. Daddy's comin' home. Just gotta finish somethin' first."
@enter Cloud right
Cloud: Barret.
Tifa: He's going after the man from Corel. Whatever happened there, he's never told us.
Cloud (nod): We find him before he reaches that man.
@enter Dandy left
Dandy [sweat]: We have company.
@fx shake
@sfx surprise
> Lanterns appear along the ridge. Bandits block the route back; a Joker waits behind them with two leashed Death Claws.
Bandit: Swords and supplies on the ground. Then maybe you walk away.
@exit Dandy
@enter Vee farright
Vee [anger]: Maybe?
Bandit: Your choice.
@enter CaitSith farleft
CaitSith: There's a gap by the rail car. If we can get through, the trail's still there.
@enter Gigi left
Gigi (nod): Then we get through.
Tifa: Stay together.
Cloud [dots]: Let's mosey.
`);

ff7Scene('s10', 'The Way Back', `
@bg outside
@music goldsaucer
@fx day
@title CHAPTER 10 · THE WAY BACK
> The bandit camp is empty. Gunfire sounds once beyond the ridge, then stops.
@enter Tifa center
Tifa [dots]: Someone's ahead of us.
@fx door
> The gold door appears against the dune. Beyond it is the Gardenview elevator.
@enter Bassie left
Bassie: That's ours.
@enter Waxwell right
> Waxwell steps out carrying a bag of machine parts. Sand has worn the paint from his coat.
Waxwell: Don't close it. Your friend is still out here.
Tifa [!]: Barret? Where?
Waxwell: Under the old rail line. I found him yesterday.
@enter Cloud farleft
Cloud: Why didn't you bring him back?
Waxwell [dots]: The men looking for him had guns. He was in no shape to run.
Bassie: You've been here since before we arrived?
Waxwell: Long enough to learn where the door leads. I had other plans for it.
Tifa: Show us the rail line. You can explain on the way.
`);

ff7Scene('s11', 'What Waxwell Found', `
@bg outside
@music drama
@title CHAPTER 11 · WHAT WAXWELL FOUND
> Waxwell leads the party along a service trench beneath the old tracks. He knows every turn.
@enter Waxwell center
@enter Vee left
Vee: You mapped this place.
Waxwell: I needed a route between worlds that no one else knew about.
Vee: For what?
Waxwell: A stolen power unit. I meant to black out Gardenview and lock the exits.
Vee: People could have been hurt.
Waxwell [dots]: I know.
@enter Tifa right
Tifa: You said Barret was hurt.
Waxwell: His arm was damaged. He told me the guards were shot by another man with a gun-arm.
Tifa: Did you believe him?
Waxwell: I found two kinds of shell casings at Battle Square. His story fits.
@enter Shelly farleft
Shelly: You kept them?
Waxwell: I keep anything that might be useful.
@fx shake
> Something heavy moves through the dust ahead. A Grangalan blocks the trench; two more crawl out behind it.
@enter Cloud farright
Cloud: We go through them. Barret can't wait.
Waxwell [dots]: I was afraid you'd say that.
`);

ff7Scene('s12', 'The Other Gun-Arm', `
@bg outside
@music drama
@title CHAPTER 12 · THE OTHER GUN-ARM
> Beneath a collapsed section of rail, Barret sits beside a low fire. His gun-arm is open for repairs.
@enter Barret center
@enter Tifa left
Barret: Tifa? How'd you get down here?
Tifa: We've been looking everywhere. Dio thinks you killed his guards.
Barret [anger]: I didn't. Dyne did.
@enter Cloud right
Cloud: The man you went after.
Barret: We grew up in Corel. He lost his family when Shinra burned the town. So did I.
Barret [dots]: I saw what happened at Battle Square. I should've stopped him.
Tifa: You can tell Dio what you saw. Waxwell has the casings.
@enter Waxwell farleft
Waxwell: And an attendant who saw the other gun-arm. I hid him in the maintenance shed before Dio's men found us.
Barret [?]: You never mentioned that.
Waxwell: You never asked how I knew which way to run.
@fx shake
> The rail trembles. Bullmoters force their way into the trench, scattering the tools beside Barret.
Barret [anger]: Repairs can wait. Get behind me.
Cloud: We'll cover you.
`);

ff7Scene('s13', 'A Door Left Open', `
@bg outside
@music drama
@title CHAPTER 13 · A DOOR LEFT OPEN
> With the Bullmoters gone, the party starts back toward the door. Barret walks with them, keeping his damaged gun-arm raised.
@enter Barret center
@enter Tifa left
Barret: The guard can clear my name. After that, I'm going after Dyne.
Tifa: We'll go with you.
Barret: This part is mine. But I could use the help getting to him.
@enter Waxwell right
Waxwell: Then we have a problem. I fixed a device to the door so it would stay open.
@enter Shelly farleft
Shelly: Can you take it off?
Waxwell: Yes. Something found it first.
@fx flash
> A tall figure waits where the gold door stood. The air around him bends, and the door flickers behind his shoulder.
@exit Shelly
@enter Sephiroth farleft
@enter Cloud farright
Cloud [shock]: Sephiroth.
Sephiroth: You crossed into another world and left the path open.
Waxwell: I didn't invite you.
Sephiroth: You didn't have to.
Barret: Cloud. Who is he?
Cloud [dots]: Stay back from the door.
Sephiroth: Try to stop me.
> Grangalans and Bullmoters surge from the trench between the party and the door.
`);

ff7Scene('s14', 'Close the Door', `
@bg outside
@music goldsaucer
@title CHAPTER 14 · CLOSE THE DOOR
> Sephiroth withdraws into the dust. The gold door remains, but its edges have begun to break apart.
@enter Cloud center
@enter Tifa left
Cloud: He isn't gone.
Tifa: Then we close the path before he comes back.
@enter Waxwell right
Waxwell: The device holding it open is mine. I'll break it.
@enter Vee farleft
Vee: And give up the machinery you stole?
Waxwell: I can steal something else. Move.
> Aerith gives Dandy the flower she carried from Midgar. Cait Sith presses his die into Gigi's hand.
@enter Shelly farright
Shelly: I still owe you a look at those fossils.
@exit Shelly
@enter Aerith farright
Aerith: I'll be at the church. Find me there.
@fx door
> The Toons cross to Gardenview. Waxwell pulls the device free; the door starts to narrow.
@exitall
@enter Barret left
@enter Tifa center
@enter Cloud right
Barret: I'll speak to Dio. Then we find Dyne.
Tifa: Together.
Cloud: We should leave before the trail's gone.
@exitall
@enter Waxwell left
@enter Bassie right
Bassie: You found Barret.
Waxwell: I found a man who needed somewhere to hide. Don't make a story out of it.
> The door closes. Waxwell looks at the broken device in his hand, then follows the others home.
`);
