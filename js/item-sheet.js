/* item-sheet.js - the small item/ sprites live in two sheets (tools/pack_items.py, tools/pack_icons.py).
   Each sprite is cut out once as a data URL, so ItemSheet.url() works anywhere a path did.
   The game scripts load only after the cut is done, so top-level code can call it. */
'use strict';

const ItemSheet = (() => {
  const MAP = {"icons/Astro":["icons/sheet.png",1110,6065,213,216],"icons/Bassie":["icons/sheet.png",471,6065,213,216],"icons/Blot":["icons/sheet.png",1087,4655,500,500],"icons/Bobette":["icons/sheet.png",684,6065,213,216],"icons/Boxten":["icons/sheet.png",0,3517,540,569],"icons/Brightney":["icons/sheet.png",540,3517,540,569],"icons/Brusha":["icons/sheet.png",0,5224,500,500],"icons/Coal":["icons/sheet.png",897,6065,213,216],"icons/Cocoa":["icons/sheet.png",892,5724,246,244],"icons/Connie":["icons/sheet.png",1024,0,1000,1000],"icons/Cosmo":["icons/sheet.png",1584,5724,236,222],"icons/Dandy":["icons/sheet.png",0,1996,755,766],"icons/Dyle":["icons/sheet.png",755,1996,755,766],"icons/Eclipse":["icons/sheet.png",636,5724,256,256],"icons/Finn":["icons/sheet.png",236,6065,235,217],"icons/Flutter":["icons/sheet.png",1138,5724,246,244],"icons/Gigi":["icons/sheet.png",1542,5224,353,355],"icons/Ginger":["icons/sheet.png",500,5224,360,365],"icons/Glisten":["icons/sheet.png",1384,5724,200,243],"icons/Goob":["icons/sheet.png",1080,3517,540,569],"icons/Looey":["icons/sheet.png",0,6065,236,222],"icons/MrHolloway":["icons/sheet.png",0,1003,1024,993],"icons/MrsHolloway":["icons/sheet.png",0,0,1024,1003],"icons/Pebble":["icons/sheet.png",0,5724,370,341],"icons/Poppy":["icons/sheet.png",0,4086,540,569],"icons/RnD":["icons/sheet.png",370,5724,266,265],"icons/Rodger":["icons/sheet.png",0,4655,540,569],"icons/Rudie":["icons/sheet.png",860,5224,360,365],"icons/Scraps":["icons/sheet.png",540,4086,540,569],"icons/Shelly":["icons/sheet.png",1483,6065,192,174],"icons/Shrimpo":["icons/sheet.png",755,2762,500,651],"icons/Sprout":["icons/sheet.png",1323,6065,160,214],"icons/Squirm":["icons/sheet.png",0,2762,755,755],"icons/Teagan":["icons/sheet.png",540,4655,547,560],"icons/Tisha":["icons/sheet.png",1255,2762,511,645],"icons/Toodles":["icons/sheet.png",1675,6065,178,173],"icons/Vee":["icons/sheet.png",1080,4086,540,569],"icons/Waxwell":["icons/sheet.png",1220,5224,322,364],"icons/Yatta":["icons/sheet.png",1024,1003,844,940],"item/Apple":["item/sheet-16.png",0,0,16,16],"item/AppleWorm":["item/sheet-16.png",16,0,16,16],"item/Bacon":["item/sheet-16.png",32,0,16,16],"item/Baskets":["item/sheet-100.png",0,0,100,100],"item/Bonbon":["item/sheet-100.png",100,0,100,100],"item/Bottleopop":["item/sheet-100.png",200,0,100,100],"item/Boxochocolates":["item/sheet-100.png",300,0,100,100],"item/Bread":["item/sheet-16.png",48,0,16,16],"item/Brownie":["item/sheet-16.png",64,0,16,16],"item/Bug":["item/sheet-16.png",80,0,16,16],"item/Cherry":["item/sheet-16.png",96,0,16,16],"item/Chocolate":["item/sheet-100.png",400,0,100,100],"item/Eject":["item/sheet-100.png",500,0,100,100],"item/Enigmacandy":["item/sheet-100.png",0,100,100,100],"item/Extractionspeedcandy":["item/sheet-100.png",100,100,100,100],"item/Fish":["item/sheet-16.png",112,0,16,16],"item/FishFillet":["item/sheet-16.png",0,16,16,16],"item/FishSteak":["item/sheet-16.png",16,16,16,16],"item/Grub":["item/sheet-16.png",32,16,16,16],"item/Grubs":["item/sheet-16.png",48,16,16,16],"item/Gumballs":["item/sheet-100.png",200,100,100,100],"item/Honey":["item/sheet-16.png",64,16,16,16],"item/Instructions":["item/sheet-100.png",300,100,100,100],"item/Jumpercable":["item/sheet-100.png",400,100,100,100],"item/Lemon":["item/sheet-16.png",80,16,16,16],"item/Marmalade":["item/sheet-16.png",96,16,16,16],"item/Medkit":["item/sheet-100.png",500,100,100,100],"item/MelonCantaloupe":["item/sheet-16.png",112,16,16,16],"item/MelonHoneydew":["item/sheet-16.png",0,32,16,16],"item/MelonWater":["item/sheet-16.png",16,32,16,16],"item/Moonshine":["item/sheet-16.png",32,32,16,16],"item/Ornaments":["item/sheet-100.png",0,200,100,100],"item/Peach":["item/sheet-16.png",48,32,16,16],"item/PepperGreen":["item/sheet-16.png",64,32,16,16],"item/PepperRed":["item/sheet-16.png",80,32,16,16],"item/Pepperoni":["item/sheet-16.png",96,32,16,16],"item/Pickle":["item/sheet-16.png",112,32,16,16],"item/PickledEggs":["item/sheet-16.png",0,48,16,16],"item/PiePumpkin":["item/sheet-16.png",16,48,16,16],"item/Pineapple":["item/sheet-16.png",32,48,16,16],"item/Pop":["item/sheet-100.png",100,200,100,100],"item/Potato":["item/sheet-16.png",48,48,16,16],"item/PotatoRed":["item/sheet-16.png",64,48,16,16],"item/Pretzel":["item/sheet-16.png",80,48,16,16],"item/Proteinbar":["item/sheet-100.png",200,200,100,100],"item/Pumpkin":["item/sheet-100.png",300,200,100,100],"item/Roll":["item/sheet-16.png",96,48,16,16],"item/Saki":["item/sheet-16.png",112,48,16,16],"item/Sardines":["item/sheet-16.png",0,64,16,16],"item/Sashimi":["item/sheet-16.png",16,64,16,16],"item/Sausages":["item/sheet-16.png",32,64,16,16],"item/Skillcheckcandy":["item/sheet-100.png",400,200,100,100],"item/Smokebomb":["item/sheet-100.png",500,200,100,100],"item/Speedcandy":["item/sheet-100.png",0,300,100,100],"item/Staminacandy":["item/sheet-100.png",100,300,100,100],"item/Steak":["item/sheet-16.png",48,64,16,16],"item/Stealthcandy":["item/sheet-100.png",200,300,100,100],"item/Stein":["item/sheet-16.png",64,64,16,16],"item/Strawberry":["item/sheet-16.png",80,64,16,16],"item/Sushi":["item/sheet-16.png",96,64,16,16],"item/Tomato":["item/sheet-16.png",112,64,16,16],"item/Turnip":["item/sheet-16.png",0,80,16,16],"item/Valve":["item/sheet-100.png",300,300,100,100],"item/Waffles":["item/sheet-16.png",16,80,16,16],"item/Whiskey":["item/sheet-16.png",32,80,16,16],"item/Wine":["item/sheet-16.png",48,80,16,16],"item/airhorn":["item/sheet-100.png",400,300,100,100],"item/bandage":["item/sheet-100.png",500,300,100,100],"item/christmascookie":["item/sheet-100.png",0,400,100,100],"item/easteregg":["item/sheet-100.png",100,400,100,100],"item/jawbreaker":["item/sheet-100.png",200,400,100,100],"item/key":["item/sheet-16.png",64,80,16,16],"item/key2":["item/sheet-16.png",80,80,16,16],"item/lance":["item/sheet-16.png",96,80,16,16],"item/lance2":["item/sheet-16.png",112,80,16,16],"item/longsword":["item/sheet-16.png",0,96,16,16],"item/paper":["item/sheet-16.png",16,96,16,16],"item/rapier":["item/sheet-16.png",32,96,16,16],"item/ring":["item/sheet-16.png",48,96,16,16],"item/rod":["item/sheet-16.png",64,96,16,16],"item/shield":["item/sheet-16.png",80,96,16,16],"item/spear":["item/sheet-16.png",96,96,16,16],"item/staff":["item/sheet-16.png",112,96,16,16],"item/staff2":["item/sheet-16.png",0,112,16,16],"item/stopwatch":["item/sheet-100.png",300,400,100,100],"item/sword":["item/sheet-16.png",16,112,16,16],"item/sword2":["item/sheet-16.png",32,112,16,16],"item/sword3":["item/sheet-16.png",48,112,16,16],"item/trophy":["item/sheet-16.png",64,112,16,16],"item/weakarmor":["item/sheet-16.png",80,112,16,16]};
  const urls = {};
  const load = src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const ready = Promise.all([...new Set(Object.values(MAP).map(v => v[0]))].map(f => load(f).then(img => [f, img]))).then(async sheets => {
    const byFile = Object.fromEntries(sheets);
    const entries = Object.entries(MAP);
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < entries.length) {
        const [key, [file, x, y, w, h]] = entries[next++];
        const img = byFile[file];
        if (!img) continue;
        try {
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
          // Limit concurrent canvases and let PNG encoding run off the hot path.
          const blob = await new Promise((res, rej) => {
            try {
              c.toBlob(b => b ? res(b) : rej(new Error('toBlob empty')), 'image/png');
            } catch (err) {
              rej(err);
            }
          });
          urls[key] = blob ? URL.createObjectURL(blob) : c.toDataURL('image/png');
        } catch (e) {
          // If canvas export fails (e.g. tainted canvas on file://), fallback to direct file path
          urls[key] = file.replace(/sheet.*\.png$/, '') + key.split('/').pop() + '.png';
        }
      }
    }));
    try {
      const css = [['.pop-effect-mark.pumpkin', 'Pumpkin'], ['.pop-effect-mark.candy', 'Speedcandy'], ['.gi-candy', 'Speedcandy'], ['.gi-candy.c3', 'Chocolate']]
        .filter(([, n]) => urls['item/' + n]).map(([sel, n]) => `${sel}{background-image:url(${urls['item/' + n]})}`).join('');
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    } catch (_) {}
  }).catch(err => {
    console.warn('ItemSheet slice warning (falling back to direct assets):', err);
  });

  /* Accepts 'Name', 'Name.png' or a legacy 'item/Name.png' path; unpacked files fall back to their own path. */
  const lookup = (dir, name) => {
    const key = String(name).replace(/^(\.\/)?(item|icons)\//, '').replace(/\.png$/, '');
    return urls[dir + '/' + key] || dir + '/' + key + '.png';
  };
  const url = name => lookup('item', name);
  const icon = name => lookup('icons', name);

  const GAME_SCRIPTS = [
    "js/rigs/puppet.js",
    "js/rigs/sprout-rig.js",
    "js/rigs/gigi-rigs.js",
    "js/rigs/bobette-rig.js",
    "js/rigs/dyle-rig.js",
    "js/rigs/vee-rig.js",
    "js/rigs/shrimpo-rig.js",
    "js/rigs/ginger-rig.js",
    "js/rigs/dandy-rig.js",
    "js/rigs/rudie-rig.js",
    "js/rigs/finn-rig.js",
    "js/rigs/looey-rig.js",
    "js/rigs/soulvester-rig.js",
    "js/rigs/qom-soulvester-rig.js",
    "js/rigs/gourdy-rig.js",
    "js/rigs/qom-gourdy-rig.js",
    "js/rigs/connie-rig.js",
    "js/rigs/qom-connie-rig.js",
    "js/rigs/cocoa-rig.js",
    "js/rigs/jessie-rig.js",
    "js/rigs/toon-cutout-rigs.js",
    "Characters/Dango/rig-data.js",
    "js/rigs/dango-rig.js",
    "js/dango-fx.js",
    "Characters/Cody/rig-data.js",
    "js/rigs/cody-rig.js",
    "js/cody-fx.js",
    "Characters/Nugget/rig-data.js",
    "js/rigs/nugget-rig.js",
    "js/nugget-fx.js",
    "Characters/Discard/rig-data.js",
    "Characters/Selena/rig-data.js",
    "js/rigs/tu-rigs.js",
    "Characters/Copper/rig-data.js",
    "js/rigs/carebear-reviewed-rigs.js",
    "js/carebear-fx.js",
    "js/rigs/registry.js",
    "js/toon-skill-motion.js",
    "js/rigs/toon-rig-joints.js",
    "js/rarity-aura.js",
    "js/game.js",
    "js/dialogue-polish.js",
    "js/friendship-dialogue.js",
    "js/trial-design.js",
    "js/waxwell-fx.js",
    "js/holloway-fx.js",
    "js/ff7-extras.js",
    "js/roster-refresh.js",
    "js/raid-ticket.js",
    "js/story/story-engine.js",
    "js/story/story-nodes.js",
    "js/story/story-script.js",
    "js/story/ch2-engine.js",
    "js/story/ch2-toons.js",
    "js/story/ch2-nodes.js",
    "js/story/ch2-script.js",
    "js/story/ch3-toons.js",
    "js/story/ch3-engine.js",
    "js/story/ch3-nodes.js",
    "js/story/ch3-script.js",
    "js/story/ch3-expansion.js",
    "js/story/story-screen.js",
    "js/rigs/scraps-garden.js",
    "js/rigs/cosmo-caramel.js",
    "js/rigs/rudie-blue-bell.js",
    "js/rigs/dandy-shop-rig.js",
    "js/shop/keepers.js",
    "js/shop/dyle.js",
    "js/shop/dandy.js",
    "js/rigs/sprout-salted-caramel.js",
    "js/story/story-battle.js",
    "js/story/ch2-ui.js",
    "js/story/ch3-ui.js"
  ];
  ready.then(() => GAME_SCRIPTS.reduce((chain, src) => chain.then(() => new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = s.onerror = resolve;
    document.body.appendChild(s);
  })), Promise.resolve()));

  return { url, icon, ready };
})();
