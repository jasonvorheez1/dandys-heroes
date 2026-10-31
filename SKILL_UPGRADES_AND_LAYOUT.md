# Skill upgrades and responsive layout — 2026-10-31

84 playable heroes / 420 White–Red skills audited through the native stat and skill parameter pipeline.

- Every selected skill now includes its actual current-level values and next-level values, rather than limiting the projection to three unlabeled or heavily rounded numbers. The table remains at maximum rank with current values only. The next-rank projection uses enough precision to show small real improvements, labels cooldowns in seconds and ratios as percentages, and retains the native effective-level/Mod and stat scaling rules.
- Blot Red, Brusha Red, Yatta Red, Finn Purple and Tisha Purple had a Skill Mastery upgrade writing to an unrecognized modifier key. It now reaches the real Skill Haste/CDR stat.
- Named cooldowns and intervals such as escapeCd, rescueCd, blockCd, charmCooldown and interval improve in the correct direction. Continuous utility values retain precision instead of losing early-rank gains to rounding.
- Activation/resource gates remain fixed. Coal Purple, Blot Purple and Looey Red keep their authored stack requirements. Coal gains actual upgradeable anchoring range, protected damage share and Aggro instead of raising its activation threshold beyond the Weight cap.
- Chell's combo bonus, chained damage, gel ricochet, gel speed/evasion, portal protection and Red bridge now use their own skill-level parameters. Applied status instances retain cast-time values, and status detail text displays those values. Momentum capacity, costs and portal-trip requirements stay fixed. Existing core voice clips and the supplied portal firing recording remain.
- The legacy mobile-frame.js no longer stops the outer game or replaces desktop with a 360×780 iframe. It only shares the embedding host runtime when needed. Responsive CSS removes the 560px app/battle cap, adds flexible desktop/tablet grids, and retains existing phone and touch/safe-area rules.

Validation: all 420 skills have scaling and complete rank tables; sampled consecutive ranks 1→2, 100→101 and 799→800 have real numeric progression. Five mastery passives verified against native Unit.recompute; Chell's rank-scaled protection verified against real status modifiers. Upgrade precision, integer formatting, cooldown direction, gate stability and roster initialization checked. Loaded scripts syntax checked after installation. Browser checks recorded separately in the working MODLOG.

No save migration, currency changes, unlock changes or art replacement. Overwritten sources are backed up under backups/skills-responsive-<timestamp>. New files are js/skill-progression.js, css/skill-progression.css and css/responsive-layout.css.
