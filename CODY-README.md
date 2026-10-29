# Cody — Dandy's Heroes

Cody is registered as an A-tier Damage / Control Hero, Frontline, Physical Damage. He uses normal Rare obtainment; this installation does not unlock him by editing a save. The supplied idle PNG and icon are copied byte-for-byte into `Characters/Cody/`. Animations-off mode uses the supplied idle PNG.

His five Skills implement the requested trap-specialist kit: opening and active traps, movement/Basic Attack restriction with a boss fallback, chain-ball swings and pulls, trapped-target damage bonuses, armor breaks, Heavy Hitter, and the once-per-wave Iron Lockdown. Jessie and Dango have between-floor banter with Cody that acknowledges Nugget as his boyfriend. Nugget is not added as a separate playable Hero by this update.

## Chosen values for unspecified details

- Opening traps are ready immediately after the short wave setup. Active traps arm in 0.55s, or 0.2s during Iron Lockdown. Traps persist for up to 20s; at most eight unused traps are retained per Cody.
- Iron Jaw! starts at 110% Attack damage. Already-Trapped targets take 50% bonus trap damage and lose 25% Armor. Each distinct enemy caught grants 10% Attack Speed for the wave, up to three. Red adds one opening trap and one active trap, and 20% trap damage.
- Bosses, immovable enemies, CC-immune enemies and enemies with at least 50% CC resistance receive a 35% Slow instead of Trapped. An ordinary resisted trap also falls back to Slow. Existing engine CC duration/resistance rules apply.
- Trapped blocks movement, dashes and Basic Attacks, including an attack waiting for contact, but does not silence Skills. Duration starts at 5s. Active-trap Stun starts at 0.45s.
- Ball and Chain: 11s cooldown, 175 range, up to three arc hits at 105% Attack, then a 145% slam on the highest-current-HP enemy among those hit, with a 0.65s knockdown. The trapped-target slam gains the requested 40% damage and 20% Armor penetration. The next Basic deals 55% additional damage and 65% Attack splash.
- Chain Reaction: 13s cooldown, 135% Attack main strike, 65% Attack path hits, 35% Slow for 5s, and a pull to 60 range ahead of Cody. Crossing an armed trap grants 35% extra trap damage. An already-Trapped target receives a second hit at 70% of the first hit's base damage and nearby enemies are interrupted and knocked back. Red's secondary target must be within 90 range and receives 65% damage.
- Heavy Hitter grants the requested 15% Attack, 20% Critical Damage and 25% basic damage against its listed controlled targets. Three successful hits on a Trapped enemy apply the additional 15% Armor reduction. Both replacement-trap placement and activation are limited to once per 10s.
- Red drains 5 Energy per hit on a Trapped enemy. Critical chain-ball hits restore 4 Energy. Crushed Armor grants Ball and Chain 20% extra damage. Immobilized targets grant 15 percentage points of situational Critical Hit chance.
- Lockdown begins after four trap activations, once per wave, for 8s. Basics strike twice; chain-ball Skills gain 25% damage. Hitting a Trapped enemy heals 1.5% Max HP and grants a 2.5% Max HP Shield for 3s. The finale deals 230% Attack in 210 range and knocks enemies back. Red's extra stat bonuses start at 12% Attack, 15% Armor and 15% Critical Damage.

Scalable fields use the game's normal skill upgrade scaling. Existing global damage, shield, Energy and critical caps remain in force. A-tier is the requested authored tier; matchup balance has not been established through broad playtesting.

## Art and animation

The rig uses eleven source-pixel cutouts of the provided idle artwork, with arm, forearm, head, leg, boot and chain-ball joints. Idle keeps the boots planted; walk and skills use heavy motion with damped transitions. The supplied face is retained rather than redrawn. Its detail is limited by the original 206×364 image. Traps use small mechanical jaw graphics, and chain effects use linked metal strokes and the cropped source ball. Sounds come from the existing game sound library.

Open `cody-preview.html` to inspect motions or toggle to the exact supplied static pose. The preview demonstrates animation; the in-game Skill preview uses actual battle logic.

## Validation and rollback

Focused checks run the actual Battle damage/status methods and actual AI Basic Attack code. They cover trap activation and resistance, the catch cap, wave resets, Lockdown gating and double hits, armor bonuses, pull crossings, replacement cooldowns, critical energy and cancellation of a Basic Attack after Trapped lands. Rig checks cover all eleven layers, hierarchy, finite transforms, cleanup and exact copies of the supplied images. Dango's mechanics and rig regression checks also pass against the updated bundle.

The installer backs up pre-existing files and verifies installed files by SHA-256. Its manifest and originals are in this chat workspace under `work/cody-update-backup`. Restoring the three original JS files there reverts Cody's registration. No saves are overwritten.

## Dango correction made during this work

Dango's animated art now faces three-quarters right, with hands resting against her hips. Her source arm tubes were split at the elbow and given overlapping joint caps so forearms stay connected through rotation. Head pitch and camera height were corrected to remove the upward-looking pose. Animations-off mode uses the exact static PNG supplied in this chat. Backups for those changes are in `work/dango-pose-fix-backup` and `work/dango-joint-fix-backup`.
