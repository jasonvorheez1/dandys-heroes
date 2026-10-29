# Dango update

Dango is an SS-tier Support / Control Hero in the Midline, available through the normal Main Character obtainment system. No saved progress is changed by installation.

Included:

- All five supplied Skills, Stamina milestones, a per-wave two-application haste cap, terrain, interruption rescue, and the once-per-wave Perfect Preparation.
- The supplied icon, preserved as its original PNG.
- A fourteen-part 2D rig rendered from the supplied FBX, including elbows, knees, feet and hair follow-through. Skills have distinct poses; Meltdown uses nervous motion and a sweat accent.
- Friendship campaigns and equippable badges with Bassie and Jessie.
- Cream floor splats and the existing game's sound effects.

Open `dango-preview.html` in the game directory to preview the rig without changing a save. Reload the game to find Dango in Heroes. Her normal Skill previews use the real battle engine.

## Adaptation values

The engine has a 100-point Energy bar. The proposed 100/300 Energy rewards become 10/30 Energy. Meltdown restores 5 Energy per miss. Existing global Skill Haste, Damage Reduction, shield and crowd-control caps still apply.

Where the proposal left a number open, this implementation uses: 10% Evasion and 8% Movement Speed per 50 Stamina; 35% terrain slow; 25% Slip Accuracy reduction; 0.45s Slip interruption; 0.65s first-contact trail knockdown; 35% Skill Power shields at the 100 milestone; 12% missing-HP healing on a dodged Skill; 35% CC resistance at 150; a 30% reduction to the next Skill cooldown after rescue. White damage starts at 125% Skill Power; the preparation throw at 85%; every-third-ally-Skill splash at 70%; the finale at four hits of 45%. Red stat bonuses start at 15% HP, Skill Power and Evasion, and 20% Shield Power. Skills with scalable values use the game's upgrade scaling.

White's initial Cream Coating widens the first cream application. Perfect Preparation widens coverage for ten seconds and interrupts dashes crossing cream. Movement Evasion suppression recognizes Float, Lift, Buoyant, Uneven Step, explicitly tagged movement-Evasion effects, and named dash/sidestep/footwork effects. It does not remove passive baseline Evasion.

The supplied FBX has no skeleton or clips. Its separate meshes were articulated and rendered in Blender; animation in the game is a 2D cutout rig, with the original UV face preserved. The model's hair color and face differ from the first screenshot reference; this update uses the supplied model.

## Validation and recovery

Focused automated tests exercise the actual Battle status, interruption and dodge-event methods, plus the kit's haste cap, wave reset, finale limit, trail, rescue and dodge cooldown. A separate rig test checks all fourteen images, parent relationships, draw order, animation states, finite spring transforms and cleanup. These checks establish behavior; SS-tier balance has not been established through matchup testing.

The installer backs up every pre-existing file that it changes and hash-checks all installed files. The backup and its manifest are in the chat workspace under `work/dango-install-backup`. Restore the three original JS files there to revert game registration; the newly added Dango assets can remain unused. No saves are overwritten.

Original model reference: https://sketchfab.com/3d-models/dango-from-dandy-world-9592bcfa0f7f469b952420bcfc2c929e . Artwork derives from the user's local FBX and supplied icon. No public upload or release was made.
