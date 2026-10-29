# Care Bear combat and animation review

Reviewed Cheer Bear Shelly, Wish Bear Gigi, Tenderheart Bear Sprout and Share Bear Cosmo. Original transparent character artwork and facing are retained. Base Shelly, Gigi, Sprout, Cosmo and Bedtime Bear Astro keep their existing rigs. No named-Toon or trinket bonuses were added.

| Character | Combat changes | Animation and effects |
|---|---|---|
| Cheer Bear Shelly | Actual HP loss builds Cheer with a .75s gate; every second teammate cast consistently adds Cheer. Encore, Gloom, single-target Charm/Silence fallback and emergency rescue remain. Cheer displays 0–3. | Rainbow badge, fossil first-aid kit and fossil exhibit props; connected source-art limbs, distinct preparation/release/recovery and Encore response. Existing fossil/rainbow effects and sounds retained. |
| Wish Bear Gigi | Tokens track actual HP loss; prizes rotate Star → Ribbon → Spark. A reserved Jackpot upgrades the final capsule only. Purple grants the stated 3% Attack per prize, capped at eight. Make a Wish prioritizes critical HP, then debuffs/pressure/Energy. Rescue and counters reset per wave. | Original face and mittens; hinged lid, capsules, wish star, prize delivery cues and rare rescue reaction. Unfired capsules stop on interruption. Token display includes 0/8. |
| Tenderheart Bear Sprout | Stare removes real shield records and positive buffs. Links copy 65% of actual HP damage at base level, never recursively; landed control mirrors safely. Root siphon requires natural expiry. Warm Heart grants real CC immunity. Red uses the correct team-aura modifier interface, fixing battle startup. Pulls respect anchoring and movement locks. | Apron-heart charge, berry throw, heart beam, persistent heartstring tether, .2s collision pull and defensive pulse. |
| Share Bear Cosmo | Copies buffs with their values/stacks and bounded duration. Shields are actually reduced by third Basics. Sharing receives teammate heal/shield events, copies effective value once and preserves provenance. Energy theft diverts incoming gains instead of confiscating stored Energy, with a 100% upper bound so high skill scaling cannot turn a gain into a loss. Red speed/vulnerability and marked-enemy explosions now work. | Lollipop platter, twin swirl props, sugar vortex at enemy positions, row strikes, copying/sharing responses and recovery. |

## Timing

| Skill | Startup ends | Impact/release | Recovery finishes |
|---|---:|---:|---:|
| White | .12s | .48s | 1.35s; Gigi 1.65s |
| Green | .08s | .30s | .95s |
| Blue active | .10s | .38s | 1.10s |

These are continuous battle-clock timelines beginning at AI preparation, rather than an extra delay after the normal cast windup. Blue Cosmo is passive. Projectiles still travel after launch. Interruptions before release cancel the effect; death and wave transitions clear pending sequences and effects. Pausing pauses effects. Reduced-motion mode retains the intact source pose.

## Presentation and verification

Source-pixel masks keep faces and costume artwork intact, avoid duplicate overlapping pieces, and provide independent limbs and Gigi's cap. Original PNGs are displayed during idle and when animations are disabled. Art heights are calibrated to the existing character baseline; HP/name/status plates and effect origins use actual source proportions.

Skill descriptions now state implemented targeting, damage, shields, status effects and conditions. Status descriptions distinguish immunity, mitigation, copied buffs and links.

Automated combat checks cover all four kits and all eleven active timelines, interruption/canceled volleys, wave resets, actual shield removal, effective healing/shield sharing, bounded Energy diversion, recursion, control immunity/expiry, rarity gating, buff values, Charm and prize rotation. Rig/effect checks cover finite transforms, state changes, registry routing, intact idle, pause behavior, effect cleanup and offscreen suppression. Copper, Selena, Nugget, Cody, Dango and seven-hero Charm regression suites passed. Existing Copper voice gain and full-save acquisition restrictions are preserved.

Live verification: the installed game booted the Full Test Save, rendered all four reviewed rigs at their calibrated heights, showed 0/3 Cheer and 0/8 Tokens, copied enemy Speed Up to the team, and completed a local Arena victory with all four surviving. The original Astro/Scraps/Vee/Cosmo/Cocoa formation was restored. The level mismatch made that fight brief; controlled combat tests and the browser pose preview covered the complete active sequences.

An unrelated pre-existing friendship-scene error (`qom_eclipse_connie / Two Names on the Poster`) remains in the game’s external friendship dialogue script. It did not prevent this battle.
