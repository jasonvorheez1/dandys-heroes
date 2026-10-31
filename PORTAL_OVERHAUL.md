# Portal event overhaul — 2026-10-31

Uses Downloads/portal as supplemental event artwork. Existing game and unrelated event assets remain in place.

Changes: eight aligned Chell sprite clips in the native battle renderer, stable facing and size, crouch/dodge and hit poses, actual cube artwork for Cube Drop, and a time-zero escape cooldown fix. Chell remains a silent shop reward and is absent from story/credits.

Boss: guided start/pause overlay; persistent contextual objectives, numbered core progress, three redirected hits per later core; fixed reachable pedestal; pick up/carry/drop/dispose interactions; wider disposal windows; usable ceiling portal surface; full chamber retained on small screens; snapped touch portal placement; selectable portal colours; pointer capture and key clearing on blur/pause; aspect-correct pointer mapping. Existing voice/audio, damage stats, event rewards and finale remain.

Validation: deterministic simulation exercised four-core completion via actual rocket portal/body collisions on Easy/Medium/Hard, plus carry/dispose, pedestal, pause and cleanup. Animation registration and non-Chell fallback checked. All loaded JavaScript syntax checked after installation. Sprite contact sheet visually inspected. Native browser verification was stopped by Computer Use because it could not identify the current URL; mobile layout and real-time play feel remain unverified.

Backup directory contains original overwritten files. Newly added files: js/chell-visuals.js, assets/aperture/chell/chell-motion.png/.json, cube.png, tools/portal/build-chell-motion.py, PORTAL_OVERHAUL.md. To revert, restore originals from backup and remove these additions if desired.

Chell blinking fix: corrected frame packing (frames previously overlapped in column zero), validated all 27 referenced cells contain visible pixels, and versioned the atlas URL to discard cached broken artwork. The builder now rejects blank referenced frames.

Chell core/portal combo rework installed. See CHELL_CORE_REWORK.md. Source backup: C:\Users\anoob\Downloads\dandy_s_heroes_by_scraps\dandys heroes\backups\chell-core-rework-20261031-151600
