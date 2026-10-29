# Nugget — Dandy's Heroes

Nugget is an SS-tier Tank / Support in the Frontline, using normal Main Character obtainment. His kit works independently of specific Toons and trinkets. There are no Jessie–Nugget combat bonuses, pairing requirements, named-Hero triggers or equipment-specific effects.

His personality and relationships appear in his Hero description, White callouts and between-floor dialogue: a friendly hot dog salesman from the Dandy's World show, in love with Cody, and Jessie's younger brother. No saves are edited by installation.

## Kit

- **Hotdog Delivery!** Starts each wave with three Hotdogs and prepares one every 10s, up to three. When an ally crosses below 65% HP, an automatic delivery heals 15% of their Max HP and shields 20% of Nugget's Max HP. Stock is not spent repeatedly while the same ally remains below the threshold; a recipient can qualify again after recovering to 65%. When stock is empty, a low-health ally can be served after replenishment. Hotdog shield absorption grants Loyalty, up to five stacks of 5% Armor and Magic Defense. The active delivers to all surviving Heroes, heals 15% Max HP and shields 25% Nugget Max HP for 8s, then returns to the frontline for a Physical slam. At five Loyalty, the active shields are 30% stronger and grant 20% Damage Reduction for 6s.
- **Extra Toppings.** Prioritizes different recipients: highest Attack gets 20% Attack Speed and 15% lifesteal; lowest HP gets 25% Damage Reduction and a shield of 20% Nugget Max HP; highest Energy gets 20% Skill Haste and Knockback immunity. Effects last 8s. Each serving grants Loyalty. Broken Hotdog shields trigger a headbutt once Green is unlocked. Lifesteal uses actual HP damage, not damage that was absorbed by shields.
- **Good Dog!** Guards the lowest-HP teammate for 6s, after charging their attacker and knocking them down. Intercepts 50% of incoming damage, then reduces the redirected portion by 35%. This damage does not roll Critical Hits or apply the attacker's outgoing damage bonuses a second time. Each three interceptions trigger a capped bite and -20% enemy Attack for 6s. A surviving protected ally grants Nugget a missing-HP heal and shield.
- **A Dog's Loyalty.** Adds 25% Max HP and 20% Armor. Protection grants stacking Damage Reduction. Critical Hits grant 15% Evasion for 5s and reduce Good Dog!'s remaining cooldown by 2s, including an intercepted Critical Hit. Once per wave, while Nugget is alive and able to act, another Hero is saved from a KO at 20% HP with a shield of 30% Nugget Max HP. Nugget taunts nearby enemies and gains 40% Damage Reduction. This does not spend the rescue on disposable minions.
- **Best Friend Forever.** Hotdogs replenish every 7s and deliveries cleanse one removable debuff. Topping buffs gain 15% Healing received and cannot be dispelled for their first 3s; they then become removable normally. Good Dog! guards two teammates. Counters drain Energy, defensive stacks increase, and interceptions heal Nugget. Once per wave after sufficient prevention, The Whole Pack! shields Nugget, grants his defensive immunities and gives the team Damage Reduction, Attack Speed, ten healing pulses and automatic counters, followed by a final Hotdog delivery.

Prepared Hotdogs and Protective Instinct have visible `0/3`–`3/3` status counters. Loyalty uses the normal stack display.

## Values selected where the proposal left details open

Green and Blue cooldowns start at 12s and 13s. White's slam starts at 170% Attack in 180 range, with 85 Knockback. The headbutt starts at 80% Attack and Stuns for 0.5s. Good Dog!'s initial hit starts at 120% Attack with a 0.65s knockdown. Its bite returns 60% intercepted damage, capped at 200% Attack. Surviving the guard restores 15% missing HP and grants a shield of 15% Nugget Max HP.

Purple's Damage Reduction is 5% per stack for 8s, capped at four, or six at Red. Red's interception heal is 1.5% Nugget Max HP. Counterattacks remove 5 Energy. Red adds 15% Max HP, 15% Armor, 20% Shield Power and 20% Good Dog! damage at initial skill values.

The Whole Pack! requires prevention equal to 150% of Nugget's current Max HP. Its meter counts actual absorption by Nugget's shields and damage diverted by Guard, without counting the redirected damage's shield absorption again. Other generic Damage Reduction is not added to this meter. It lasts 10s: Nugget gets a 50% Max HP shield, 30% Armor and Magic Defense, Stun immunity and Knockback immunity. Allies get 25% Damage Reduction, 20% Attack Speed and ten heals of 1.5% Nugget Max HP. Pack counters deal 65% Attack, reduce enemy Attack by 20%, and heal Nugget for 1% Max HP. Counters are limited to one per attacker per 0.35s and do not recursively trigger from other counterattacks. The final delivery heals 15% recipient Max HP and shields 20% Nugget Max HP.

Existing global combat, shield, Critical Hit and Skill Haste caps still apply. Scalable skill fields use normal upgrade scaling. SS is the requested authored tier; it is not a claim of verified matchup balance.

## Supplied artwork and VN portraits

The original Nugget static PNG and icon WebP are copied unchanged. An eleven-part 2D rig uses their source pixels with overlapping joints, gentle ear motion, a trot, serving motions, guard poses and hit reactions. Animations-off mode uses the exact supplied PNG.

The four supplied VN portraits are stored as `Characters/Nugget/vn.webp`, `Characters/Cody/vn.webp`, `Characters/Jessie/vn.webp` and `Characters/Dango/vn.webp`. They are registered in the existing Story VN art table, used as full-body portraits in relevant between-floor scenes, and used in friendship introductions. Battle and roster icons keep their separate icon images. The original WebP files are preserved byte-for-byte.

Open `nugget-preview.html` to inspect the rig, toggle the exact static artwork, and view all four portraits. This is an artwork preview; in-game skill previews use real combat logic.

## Verification and recovery

Automated checks exercise the actual Battle damage, healing, shield, status, dispel and lethal-event methods. They cover inventory, threshold deliveries, actual prevention, Loyalty caps, timed buff protection, guard math, Critical Hit handling, emergency rescue and its restrictions, lifesteal, counterattacks, Red cleansing, replenishment, pack healing and the finale. Source checks confirm there are no named-Toon or trinket combat synergies. Rig checks cover all eleven layers, hierarchy, finite transforms, cleanup and exact copies of every supplied image. Cody and Dango's existing combat tests pass against the updated bundle.

Files are backed up before installation and verified by SHA-256 afterward. The backup manifest and previous files are in the chat workspace under `work/nugget-update-backup`. Restoring those pre-existing files reverts registration, engine hooks and portrait integration. No saves are overwritten, no public upload is performed, and Dango's corrected battle pose/static PNG are preserved.
