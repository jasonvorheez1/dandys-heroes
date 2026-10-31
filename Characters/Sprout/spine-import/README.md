# Sprout Spine pilot

`sprout-spine.json` is a draft Spine 4.2 skeleton built from the existing Sprout cutout. Its nine PNG attachments are in `images/`. `layout.json` records the original canvas positions, pivots, parent joints, and draw order. The head PNG includes the painted face that the browser rig currently overlays with an SVG mask.

To continue in the Spine editor:

1. Import `sprout-spine.json` with **Import Data** and set the skeleton's image path to this `images/` directory.
2. Check the setup pose against `../Sprout.png`, especially the head and arm layering.
3. Refine the draft `idle`, `walk`, `attack`, `cast`, and `hit` timelines in the editor. Add the named skill poses from `js/rigs/sprout-rig.js` before switching the game to this rig.
4. Save the `.spine` project, then export the skeleton and texture atlas together. Use a web runtime version that matches the editor export version.

This draft is import material, not an editor-validated export. The game continues using its existing Sprout rig until a licensed Spine editor export and matching web runtime are supplied. The official [Spine import guide](https://esotericsoftware.com/spine-import) and [web player guide](https://esotericsoftware.com/spine-player) describe those steps.
