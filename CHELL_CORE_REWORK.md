# Chell: portal and core rework

Chell remains silent. Her Curiosity, Intelligence and Anger cores use original supplied recordings; Morality has no invented dialogue. Core lines share a cooldown, do not overlap one another, honor Sound mute/volume, and pause or stop with their battle.

## Portal Momentum and combos

Successful cube deliveries build 1 Momentum, up to 3. A close-range portal dodge also builds 1, limited to once per second. The counter appears as three pips beside Chell's cores and a status with a tappable explanation.

| Cost | Skill | Combo |
|---|---|---|
| 1 | Gel Dispenser | Gel Relay: Repulsion Gel lets deliveries bounce to a second enemy for 35% Attack damage. Propulsion Gel gives 2 Momentum per successful delivery. |
| 2 | Anger Management | Fling Shot: a rocket arcs out of a floor portal and chains into another enemy for half damage. |
| 3 | Thinking With Portals | Infinite Fall: the strongest target makes three actual portal trips, then lands once for 60% more damage. |

White regroups movable enemies through portal drops. Displacement-immune targets remain in place and do not contribute to the displacement counter. Green routes recent incoming ranged damage back through portals or deploys an Anger-guided rocket. Blue uses the existing Repulsion and Propulsion gels: Intelligence operates the dispenser, rather than supplying a separate gel type. Purple makes portal dodges visible and lets Morality stop a critical hit before it lands, rather than trying to heal after a lethal hit. Red coordinates a group drop and Hard-Light Bridge once per wave.

## Visuals and sound

Uses the supplied pixel portal, core, turret, cube and rocket art. Chell has a centered sprite sheet with a firing pose assembled from the supplied body and gun-arm parts. Live portal entrances and exits, projectile routes, falling enemies, gel streams, fields and bridge use battle simulation time. The renderer creates two bounded effect canvases per active battle and clears them on finish, quit or restart. Reduced Effects removes core bobbing and body-flight motion; gameplay remains the same. No full-screen flashes were added.

`portal-gun-fire-orange.mp3` is copied unchanged from the user-supplied file and used by both Chell's native sound cue and the event's portal gun. Other event audio is unchanged. Core clips were extracted from the existing event sound pack into the native Sound cue system; no extra audio library or network service is required.

## Validation

Automated checks cover actual displacement versus immunity, delayed/once-only portal projectile damage, both redirect paths, both gels, critical prevention and its cooldown, Red activation, every Momentum combo, mute/voice overlap/pause/cleanup, dead casters, finished battles, offscreen simulations and other heroes' projectile fallback. Every referenced sprite frame is checked for visible pixels. The actual packed atlas was inspected. Native-renderer preview exercises portal trajectories and character poses; audio playback is not assessed by ear.

No save, unlock, event reward or unrelated game asset changes. Original source files are backed up before installation. Asset generation: `python tools/portal/build-chell-core-assets.py --game . --output assets/aperture/chell` with the supplied sprite sheet and firing recording still in Downloads.
