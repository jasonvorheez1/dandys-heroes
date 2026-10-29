# Charm team options

Charm now has roles across five existing base kits. These are status-based interactions: no particular teammate, pair, trinket or friendship badge is required.

| Hero | Skill / rarity | New role |
|---|---|---|
| Glisten | Prismatic Close-Up / Green | Its successful primary hit Charms for 1.75s; reflected splash keeps Dazzle without spreading Charm. |
| Teagan | A Seat at the Table / Green | Replaces its 2.4s Stun with 2s Charm. Existing damage, Slow and allied Shield remain. |
| Razzle & Dazzle | Curtain Call / Blue | A cast started in Comedy Charms the nearest enemy within 250 range for 1.5s. Tragedy takes 20% less damage from Charmed attackers. The dual act can provide both. |
| Gigi | House Advantage / Blue | Any allied successful Charm grants 8 Energy to the lowest-Energy ally, once every 4s. Existing Charm refreshes do not count. |
| Yatta | Festival Fuel / Purple | Basics deal 15% additional damage to Charmed enemies; defeating one grants one Celebration stack for 10s. |

For example, Razzle & Dazzle can supply the frontline, Glisten applies precision control, Teagan supplies protection, Gigi helps ability rotation, and Yatta supplies damage. This is an example composition, not a programmed team bonus. Other existing Charm sources can enable the same payoffs, and every Hero retains the rest of their kit.

## Shared Charm behavior

Charm redirects Basic Attacks toward living, targetable teammates. Skills retain their normal targeting. The target's scripted focus, taunt or distraction no longer overrides Charm's Basic Attack targeting. Projectiles choose the Charmed target before launch, and Charm is rechecked at contact. Basic Attacks begun under Charm are canceled if it is cleansed before they land.

Charm cannot be refreshed while active. When it expires, is cleansed, or is explicitly removed, the unit gains **Composure** for 2s and cannot be Charmed during that period. Composure appears in status details and cannot be dispelled as an ordinary buff. Crowd-control immunity and resistance still apply. Bosses are immune to Charm. A lone normal enemy with no targetable teammate still has no teammate to attack; the Charm status can nevertheless enable the generic damage and defensive payoffs.

All affected skill descriptions have been updated in the game. Existing Charm visuals are reused. No sprites, character portraits, saves or ownership progress are changed.

## Verification and recovery

Focused checks load the actual Hero definitions, Battle methods and AI Basic Attack code. They cover all five additions, primary-only Charm, Teagan's control conversion, Comedy/Tragedy behavior, generic Energy and damage payoffs, boss immunity, prevention of refresh chains, expiry/cleanse recovery, and actual friendly-fire Basic targeting. Nugget, Cody and Dango's combat regression tests also run against the updated bundle.

The previous `js/game.js` and a SHA-256 manifest are backed up in the chat workspace under `work/charm-update-backup`. Restore that original file to revert this update. No saves are overwritten. Matchup balance has not been established through broad playtesting.
