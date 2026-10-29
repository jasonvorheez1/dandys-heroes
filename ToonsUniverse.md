# Toons Universe · Evade expedition

Replaces the Phantasia-only generic event dossier with a dedicated endless roguelite. Opens from Events at Mastery 40. The old event ID is retained for compatibility, but its stage-selection and Wish Coin shop routes open the new mode.

Four objectives per floor alternate extraction and hacking. Completing guarded objectives attracts mixed Twisted/Infected patrols. An optional capsule contains Malachor and may contain a superior supply. Once objectives are complete, defeat the elevator pursuit before its retrieval timer expires. Each secured floor gives a purple card choice and opens Cheknov's Parts counter. Every fifth pursuit includes Infected Phantasia: her original silhouette rendered pitch black with a purple glow.

Evade's Extraction Lab and Service Halls use the clean existing evade1.png and evade2.png images. These maps only appear in this event. Existing EVADE and ENDEAVOR soundtrack files and Cheknov's existing vent artwork are reused. No new character artwork is fabricated.

## Persistence

Malachor, Infected research, floor records and recruited agents are permanent. Parts, cards, supplies and carried health belong to the expedition. Regular Endless progress is never replaced. Interrupted encounters preserve their enemy lineup and carried damage. Existing Phantasia/Discard/Copper/Selena recruits are retained; legacy Wish Coins migrate into Malachor once.

## Exclusive purple cards

| Card | Cap | Battler adaptation |
|---|---:|---|
| Professional | 3 | Objective Parts: 5 → 8 → 11 → 14 |
| Job Well Done | 3 | Objective Malachor: 5 → 8 → 11 → 14 |
| Motivate | 3 | Capsule Malachor: 2 → 5 → 8 → 11 |
| Precision | Repeatable | +2s objective reveal and +2% combat Accuracy per stack |
| Machinist | 3 | +4% extraction speed and Attack Speed per stack |
| Tech Support | 3 | +4% hacking speed and Skill Power per stack |
| Trained | 3 | +5% cooldown recovery per stack |
| Perseverance | 3 | +5s elevator pursuit allowance per stack |
| Hyperactive | 5 | +5% Energy generation per stack, replacing stamina regeneration |
| Hustle | 3 | +10% Max HP and +5% Movement Speed per stack, replacing maximum stamina |
| Generosity | 5 | Superior-capsule chance rises from 15% by 8 points per stack |
| Lucky | 3 | Random gas/blackout probability is multiplied by 0.8 per stack |
| Safety | Repeatable | Non-boss Class II/III probability is multiplied by 0.85 per stack |
| Recover | Repeatable | Immediately heals living agents 30% carried Max HP; never revives |

Rarities marked unknown in the supplied reference are assigned Common/Rare for this adaptation. Recover is Mythical. These are game-balance choices rather than claims about the source game's unknown rarities. Twenty-one supported regular Endless cards can also appear; their combat effects use the existing run-build implementation. Exclusive cards are never inserted into the normal Endless deck. Drafts use a purple horizontal shuffle and respect reduced motion, duplicate-claim checks, stack caps and reload persistence.

## Agent contracts

| Agent | Malachor | Deepest secured floor | Objectives | Infected defeats |
|---|---:|---:|---:|---:|
| Discard | 120 | 4 | 12 | 1 Discard |
| Copper | 220 | 8 | 24 | 2 Copper |
| Phantasia | 320 | 10 | 36 | 1 Phantasia |
| Selena | 420 | 15 | 50 | 3 Selena |

The Agent Shop displays all requirements before purchase. Normal saves recruit level-one agents after earning a contract; Full Test Saves retain their existing roster. After recruitment, 40 Malachor buys five promotion shards. The obsolete generic Toons Universe Pack is removed from Dandy's regular shop, and stale visitor offers cannot bypass the new recruitment rules or consume currency for an unavailable recruit.

Cheknov sells run healing, next-battle Energy, next-battle Shields and extra purple drafts for Parts. The permanent exchange includes the four existing TU Emblems. No new named-hero kit synergies were added.

## Verification

Automated checks cover persistence separation, one-time currency migration, normal-save recruitment gates, existing ownership, fourteen card effects/caps, ordinary card combat hooks, seeded deals and enemy lineups, objective/capsule payouts, research, replay guards, retreat/loss handling, carried wounds, no resurrection, floor/elevator progression and supply consumption. Source assets are copied exactly. Backups are retained under work/toons-universe-event-backup.
