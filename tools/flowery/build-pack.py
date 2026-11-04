#!/usr/bin/env python3
"""build-pack.py - packs everything the "Flower Kingdom" event needs into ONE file: assets/flowery/flowery.bin

    python3 tools/flowery/build-pack.py <drspritearchive folder> [--voice <Flowery clips folder>] [--sfx <common sound effects folder>] [--music <folder with the Chapter 5 soundtrack .mp3/.ogg files, or DELTARUNE's mus folder>]

Only the sprites listed in MANIFEST are taken (not the whole archive). They are trimmed, packed into a few
atlas sheets and written, together with a JSON frame index and any music, into a single container:

    8 bytes   b"DHFLWR01"
    4 bytes   little-endian length N of the header
    N bytes   UTF-8 JSON: {"files": [{"name", "type", "off", "len"}...], "frames": {...}, "music": {...}}
    ...       the files, back to back (atlas PNGs, music .ogg)

js/flowery-pack.js reads it back. Music: MUSIC_WANTED maps the event's track keys to the file names Deltarune
uses in its mus/ folder (several guesses each; the first that exists wins). Anything not found falls back to the
game's own tracks at run time, so the event works without music in the bin.
"""
import glob, io, json, os, struct, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'assets', 'flowery', 'flowery.bin')

E = 'Entities/'
C5 = 'Structures/Ch5/'
# folder (non-recursive) or glob -> frames keep their GameMaker sprite names (spr_ prefix dropped)
MANIFEST = [
    # Flowery
    E + 'Flowery/Portraits', E + 'Flowery/Overworld/General', E + 'Flowery/Overworld/General/Idle', E + 'Flowery/Overworld/General/Clap',
    E + 'Flowery/Overworld/General/Float', E + 'Flowery/Overworld/General/Float/Condescend', E + 'Flowery/Overworld/General/Shrug',
    E + 'Flowery/Overworld/General/Shrug/Float', E + 'Flowery/Overworld/General/Shrug/Float/Spin', E + 'Flowery/Overworld/General/Teeth Shine',
    E + 'Flowery/Overworld/Battle', E + 'Flowery/Overworld/Battle/Idle', E + 'Flowery/Overworld/Battle/Idle/Jacket',
    E + 'Flowery/Overworld/Battle/Flowery & Floradinns', E + 'Flowery/Overworld/Battle/Powering Up', E + 'Flowery/Overworld/Battle/Jarona!',
    E + 'Flowery/Overworld/Battle/Jarona!/Punch', E + 'Flowery/Overworld/Battle/Jarona!/Kick', E + 'Flowery/Overworld/Battle/ACTs/Blow',
    E + 'Flowery/Overworld/Battle/ACTs/Blown', E + 'Flowery/Overworld/Battle/ACTs/Pirouette', E + 'Flowery/Overworld/Battle/Omega Flowery',
    E + 'Flowery/Battle/Attacks', E + 'Flowery/Overworld/Walk/Cardinal/With Jacket', E + 'Flowery/Overworld/Flowery & Asgore',
    E + 'Flowery/Battle/Background/Thorns', E + 'Flowery/Battle/Background/Platforms', E + 'Flowery/Battle/Background/Tower/Decor/Flower',
    E + 'Flowery/Misc/Bush',
    # the endgame: Jevil ("joker" in the game files) and Spamton NEO, plus Spamton for the cutscenes
    E + 'Jevil/Attacks', E + 'Jevil/Body', E + 'Jevil/Misc', E + 'Spamton NEO/Attacks', E + 'Spamton NEO/Parts', E + 'Spamton NEO/Final Forme',
    E + 'Spamton NEO/Misc', E + 'Spamton NEO/Arena', E + 'Spamton',
    # the final fight's arena (the vine tower) and the flowers' bullet sprites
    E + 'Flowery/Battle/Background/Tower/Texture', E + 'Flowery/Battle/Background/Tower/Decor/Leaf', E + 'Flowery/Battle/Background/Tower/Boosters',
    E + 'Flowery/Battle/Background/Tower/Lattice/Section B',
    E + 'Seth/Battle/Attacks', E + 'Green/Battle/Attacks', E + 'Orange/Battle/Bullet Pattern', E + 'Blue/Battle/Attacks',
    E + 'Yellow/Battle/Attacks', E + 'Yellow/Battle/Bullet Pattern/Punishment Gun', E + 'Aqua/Battle/Attacks',
    # the Darkners who lend Flowery their power (drawn as ghosts)
    E + 'Umbrella Yokai/Regular', E + 'Ramb', E + 'Zenlooker',
    # Floradinn
    E + 'Floradinn', E + 'Floradinn/Idle', E + 'Floradinn/Flattened', E + 'Floradinn/ACTs', E + 'Floradinn/Attacks',
    # Asgore
    E + 'Asgore',
    # the other flowers
    E + 'Seth/Portraits', E + 'Seth/Overworld', E + 'Seth/Overworld/Animations/Adjust Glasses', E + 'Seth/Overworld/Battle/Idle', E + 'Seth/Overworld/Reading',
    E + 'Seth/Overworld/Battle/Throw', E + 'Seth/Overworld/Animations/Point',
    E + 'Aqua/Portraits', E + 'Aqua/Overworld', E + 'Aqua/Overworld/Animations/Laugh', E + 'Aqua/Overworld/Animations/Wave', E + 'Aqua/Overworld/Animations/Spin',
    E + 'Aqua/Overworld/Animations/Clap', E + 'Aqua/Battle/Bullet Pattern/Knife',
    E + 'Seth & Aqua',
    E + 'Blue/Portraits', E + 'Blue/Portraits/Butterfly/Normal', E + 'Blue/Overworld', E + 'Blue/Overworld/Spin', E + 'Blue/Overworld/Laugh',
    E + 'Blue/Battle/Bullet Pattern/Flowers', E + 'Blue/Battle/Attacks',
    E + 'Yellow/Portraits', E + 'Yellow/Overworld', E + 'Yellow/Overworld/Shoot', E + 'Yellow/Overworld/Cool', E + 'Yellow/Battle/Bullet Pattern/Flowers',
    E + 'Yellow/Battle/Evidence',
    E + 'Orange/Portraits', E + 'Orange/Overworld', E + 'Orange/Overworld/Expressions', E + 'Orange/Overworld/Animations/Talk', E + 'Orange/Overworld/Gloves',
    E + 'Orange/Overworld/Punch/Anime Punch',
    E + 'Green/Portraits', E + 'Green/Overworld', E + 'Green/Overworld/Animations/Wave', E + 'Green/Overworld/Pan', E + 'Green/Overworld/Signs',
    E + 'Green/Misc/Foods', E + 'Green & Orange',
    E + 'Pink/Mew Mew', E + 'Pink/Ghost', E + 'Pink/Mew Mew/Animations/Overjoyed', E + 'Pink/Portraits/Speaker/Standard',
    # effects
    'Effect/Sparkles', 'Effect/Shines', 'Effect/Impact', 'Effect/Explosion', 'Effect/Dust & Smoke', 'Effect/Flowery', 'Effect/Parry',
    'Effect/spr_sparkle_*.png', 'Effect/spr_shine_*.png', 'Effect/spr_slidedust_*.png', 'Effect/spr_explosion_diagonal_*.png',
    C5 + 'General/Leaves & Petals/Falling Petal', C5 + 'General/Leaves & Petals/Leaf Fall - Green', C5 + 'General/Leaves & Petals/Petal - Blue',
    C5 + '01 - The Garden of Hopes and Dreams/Cherry Blossom Petals',
    # backgrounds
    C5 + '02 - Cliffs/Parallax/Sky', C5 + '02 - Cliffs/Parallax/Clouds/spr_sunrise_back_clouds_0.png', C5 + '02 - Cliffs/Parallax/Castle',
    C5 + '02 - Cliffs/Parallax/spr_sunrise_back_cliffs_0.png', C5 + '02 - Cliffs/Parallax/Flowers/spr_sunrise_back_field_0.png',
    C5 + '02 - Cliffs/Parallax/Flowers/spr_sunrise_flowerlayer_dark_0.png', C5 + '02 - Cliffs/Parallax/Flowers/spr_sunrise_layer_0_0.png',
    C5 + '01 - The Garden of Hopes and Dreams/Background', C5 + '01 - The Garden of Hopes and Dreams/Garden - Glade/Background',
    C5 + '01 - The Garden of Hopes and Dreams/Garden - Glade/spr_asgore_flower_0.png',
    C5 + '03 - Flower Castle/Foyer', C5 + '03 - Flower Castle/Foyer/Big Door', C5 + '03 - Flower Castle/Onsen & Zen Garden',
    C5 + '03 - Flower Castle/Right/Cafe', C5 + '03 - Flower Castle/Top of Castle', C5 + '03 - Flower Castle/Top of Castle/Finale',
    C5 + '03 - Flower Castle/Top of Castle/Parallax', C5 + '03 - Flower Castle/Top of Castle/Sunlight', C5 + '03 - Flower Castle/Exterior',
    C5 + '03 - Flower Castle/General/Doors', C5 + '03 - Flower Castle/General/Parallax',
    # Ralsei (locked in a cupboard by Flowery, as in Chapter 5) and the cupboard
    E + 'Ralsei/Portraits', E + 'Ralsei/Portraits/No Hat', E + 'Ralsei/Walk', E + 'Ralsei/Battle',
    C5 + '01 - The Garden of Hopes and Dreams/Garden - Beginning',
    # Chapter 5 Darkners that the ichor gets into (this event only; drawn "Inked" at run time)
    E + 'Kawkaw', E + 'Mantis', E + 'Bloxer', E + 'Floradinn/Nerd', E + 'Floradinn/Conductor',
    # Omega Flowery: every flower's piece of the fused form
    E + 'Aqua/Battle/Omega Flowery', E + 'Blue/Battle/Omega Flowery', E + 'Yellow/Battle/Omega Flowery', E + 'Green/Battle/Omega Flowery',
    E + 'Seth/Overworld/Battle/Omega Flowery', E + 'Orange/Overworld/Omega Flowery',
    # walk cycles
    E + 'Seth/Overworld/Walk', E + 'Aqua/Overworld/Walk', E + 'Blue/Overworld/Walk', E + 'Yellow/Overworld/Walk', E + 'Yellow/Overworld/Walk/Walk - Sad',
    E + 'Orange/Overworld/Walk', E + 'Green/Overworld/Walk', E + 'Pink/Mew Mew/Walk', E + 'Floradinn/Bush',
    # props
    C5 + '01 - The Garden of Hopes and Dreams/Garden - Glade/Plants', C5 + '01 - The Garden of Hopes and Dreams/Garden - Glade/Shrine',
    C5 + '01 - The Garden of Hopes and Dreams/Garden - Glade/Hanging Decorations', C5 + '01 - The Garden of Hopes and Dreams/Trees/Blocktree',
    C5 + '01 - The Garden of Hopes and Dreams/Trees/Darkfruit Tree', C5 + '01 - The Garden of Hopes and Dreams/Trees/Tree Shadow',
    C5 + '02 - Cliffs/Hanging Decorations', C5 + '02 - Cliffs/Scarecrow Sign', C5 + '02 - Cliffs/Tall Grass', C5 + '02 - Cliffs/Shop',
    C5 + '03 - Flower Castle/Right/Lanterns/Orange', C5 + '03 - Flower Castle/Right/Lanterns/Pink', C5 + '03 - Flower Castle/Right/Foxes',
    C5 + '03 - Flower Castle/Onsen & Zen Garden/Plants', C5 + '03 - Flower Castle/Jail', C5 + '03 - Flower Castle/Top of Castle/Pink',
    'Effect/spr_savepoint_*.png', 'Effect/spr_npc_sign_0.png', 'Effect/spr_treasurebox_*.png',
    # whole tilesets: rooms are painted from rectangles of these (kept untrimmed so tile coordinates stay true)
    'tilesets/tiles_flowercastle.png', 'tilesets/bg_dw_soft_cliff_grass_tileset.png', 'tilesets/tiles_cliff_dark_new.png',
    'tilesets/tiles_flowercastle_exterior_new.png', 'tilesets/tiles_flowercastle_cafe.png', 'tilesets/tiles_flowercastle_onsen.png',
    'tilesets/tiles_flowercastle_pinkroom.png', 'tilesets/tiles_garden_walls.png', 'tilesets/bg_dw_garden_decoration_tileset.png',
    'tilesets/bg_fcastle_flower_tower_lattice_tileset.png', 'tilesets/tiles_flowercastle_penultimate.png',
    # battle UI (the turn-based half of the final fight)
    'UI/Battle/Buttons', 'UI/Battle/Tension Bar', 'UI/Battle/Icons/spr_headflowery_0.png', 'UI/Battle/Icons/spr_chartarget_*.png',
]

# event track key -> words to look for in file names (.ogg/.mp3/.wav, searched recursively). Works with the official
# soundtrack's names ("... - 34 Flower Man feat. Camellia.mp3") or the game's own mus/ files. Everything is re-encoded to
# Ogg Vorbis (ffmpeg, quality 2, about 96 kbps) so the bin stays small; without ffmpeg .ogg files are copied as they are.
MUSIC_WANTED = {
    'flFlowery': ['your_dads_best_friend', 'your dads best friend'],            # Flowery's motif
    'flBattle': ['rakuichi_buster', 'rakuichi buster'],                          # standard Chapter 5 battle theme
    'flSkate': ['ride_the_board', 'ride the board'],                             # Flowery's skateboard
    'flWho': ['who_might_you_be', 'who might you be'],                           # meeting Flowery
    'flFlowers': ['petal_dance', 'petal dance'],                                 # the colored flowers' battles
    'flCliffs': ['sunset_of_seven_suns', 'sunset of seven suns'],
    'flShop': ['shop_3', 'shop 3'],
    'flAsgore': ['flower_king', 'flower king'],
    'flOrange': ['im_telling', "i'm telling", 'im telling'],
    'flYellow': ['stop_criminell', 'stop criminell', 'stop, criminell'],
    'flBoss': ['flower_man', 'flower man'],                                      # Flowery's final battle
    'flSad': ['that_day', 'that day'],                                           # Asgore's flashback after the battle
    'flHome': ['walking_home', 'walking home'],
    'flNeo': ['world_revolving_x_big_shot', 'revolving_x_big', 'world revolving x big shot'],   # the endgame: Jevil x Spamton NEO
}


# Flowery's voice clips (the "Miscellaneous - Flowery" rip, English folder): event key -> clip file name without extension
VOICE_WANTED = {
    'sanfrandisco': 'snd_flowery_voiceclip_hereicomesanfrandisco_strong', 'sanfrandisco_weak': 'snd_flowery_voiceclip_hereicomesanfrandisco_weak',
    'sanfran': 'snd_flowery_voiceclip_sanfran', 'my_jarona': 'snd_flowery_voiceclip_heh_it_s_my_jarona',
    'jarona1': 'snd_flowery_voiceclip_jarona1', 'jarona2': 'snd_flowery_voiceclip_jarona2', 'jarona3': 'snd_flowery_voiceclip_jarona3',
    'jarona4': 'snd_flowery_voiceclip_jarona4', 'last_jarona': 'snd_flowery_voiceclip_last_jarona', 'just_kidding': 'snd_ja_kidding',
    'jarona_orange1': 'snd_jarona_orange1', 'jarona_orange2': 'snd_jarona_orange2', 'lend_power': 'snd_flowery_voiceclip_lend_me_your_power',
    'omega': 'snd_flowery_voiceclip_omega_flowery', 'powering_up': 'snd_flowery_voiceclip_powering_up', 'prism_blow': 'snd_flowery_voiceclip_prism_blow',
    'powers_combined': 'snd_flowery_voiceclip_with_your_powers_combined', 'itsme': 'snd_flowery_voiceclip_itsmeflowery',
    'hey_guys': 'snd_flowery_voiceclip_heyguys', 'leaf_it': 'snd_flowery_voiceclip_leaf_it_to_me', 'plant': 'snd_flowery_voiceclip_all_according_to_all_according_to_plant',
    'take_that': 'snd_flowery_voiceclip_take_that', 'predictable': 'snd_flowery_voiceclip_what_a_predictable_creature', 'show_you': 'snd_flowery_voiceclip_huhillshowyou',
    'nonono': 'snd_flowery_voiceclip_nonono', 'forget_it': 'snd_flowery_voiceclip_forget_it', 'wind': 'snd_flowery_voiceclip_mysterious_wind',
    'spiral': 'snd_flowery_voiceclip_spiral_dance', 'only_help': 'snd_flowery_voiceclip_im_only_trying_to_help_you', 'go_home': 'snd_flowery_voiceclip_go_home',
    'goodbye': 'snd_flowery_voiceclip_goodbye', 'my_dreams': 'snd_flowery_voiceclip_thats_my_dreams', 'smile_again': 'snd_flowery_voiceclip_smile_again',
    'try_flavor': 'snd_flowery_voiceclip_try_my_flavor', 'best_friend': 'snd_flowery_voiceclip_yourdadsmybestfriend', 'kris': 'snd_flowery_voiceclip_kris',
    'keep_waiting': 'snd_flowery_voiceclip_sorrytokeepyouwaiting1', 'lady_waiting': 'snd_flowery_voiceclip_sorrytokeepaladyinwaiting',
    'for_the_fans': 'snd_forthefans', 'youre_hero': 'snd_flowery_voiceclip_youre_a_hero', 'great_style': 'snd_flowery_voiceclip_great_style',
    'my_king': 'snd_flowery_voiceclip_my_king', 'flowery': 'snd_flowery_voiceclip_flowery', 'its_all_yours': 'snd_flowery_voiceclip_its_all_yours',
    'wow': 'snd_flowery_voiceclip_wow', 'hah': 'snd_flowery_voiceclip_hah', 'hoo': 'snd_flowery_voiceclip_hoo', 'yes': 'snd_flowery_voiceclip_yes',
    'huh': 'snd_flowery_voiceclip_huh', 'thats_great': 'snd_flowery_voiceclip_thatsgreat',
    'noise1': 'snd_flowery_voicenoise_1', 'noise2': 'snd_flowery_voicenoise_2', 'noise3': 'snd_flowery_voicenoise_3',
}
# the common Deltarune sound effects the event uses ("Miscellaneous - Common Sound Effects"): key -> file name without extension
SFX_WANTED = {k: 'snd_' + k for k in (
    'text', 'txtasg', 'menumove', 'select', 'cantselect', 'hurt1', 'hurtsmall', 'damage', 'impact', 'bump', 'battleenter', 'weaponpull', 'weaponpull_fast',
    'criticalswing', 'laz_c', 'swing', 'smallswing', 'heavyswing', 'ultraswing', 'power', 'boost', 'spellcast', 'great_shine', 'graze', 'save', 'spare', 'won',
    'levelup', 'tensionhorn', 'pirouette', 'rumble', 'screenshake', 'break1', 'break2', 'bomb', 'badexplosion', 'dooropen', 'doorclose', 'item', 'grab',
    'joker_chaos', 'joker_anything', 'joker_ha0', 'joker_ha1', 'joker_laugh0', 'joker_laugh1', 'joker_metamorphosis', 'joker_neochaos', 'joker_oh',
    'joker_byebye', 'spamton_laugh', 'sneo_laugh_long', 'sneo_overpower', 'txtspam', 'txtspam2', 'explosion', 'explosion_firework', 'glassbreak',
    'chargeshot_charge', 'chargeshot_fire', 'heartshot_dr', 'punchheavythunder', 'scytheburst_bc', 'whip_hard', 'camera_flash', 'rocket', 'ominous',
    'petrify', 'bell_bounce_short', 'slidewhistle', 'deathnoise', 'sparkle_glock', 'spearappear_choppy', 'electric_talk', 'punchmed', 'mercyadd',
    'jump', 'wing', 'magicsprinkle', 'scissorbell', 'paper_rise', 'noise', 'error', 'drumroll', 'applause', 'orchhit', 'cymbal', 'shineselect', 'crowngrowth',
    'ehurt1', 'hit', 'b', 'awkward', 'chain_extend', 'stardrop', 'egg', 'locker', 'knock', 'revival', 'usefountain', 'creepyjingle', 'rudebuster_hit', 'rudebuster_swing')}


def collect(archive):
    seen, out = set(), []
    for entry in MANIFEST:
        path = os.path.join(archive, entry)
        files = sorted(glob.glob(path)) if any(c in entry for c in '*?') else (
            [path] if path.endswith('.png') else sorted(glob.glob(os.path.join(glob.escape(path), '*.png'))))
        if not files:
            print('  (nothing at', entry + ')')
        for f in files:
            name = os.path.basename(f)[:-4]
            if name.startswith('spr_'):
                name = name[4:]
            if name in seen:
                continue
            seen.add(name)
            out.append((name, f))
    # sprites supplied by hand (tools/flowery/extra, already at 1x): the lamppost, skateboard, drink, fists and Knight clash poses
    for f in sorted(glob.glob(os.path.join(HERE, 'extra', '*.png'))):
        name = os.path.basename(f)[:-4]
        name = name[4:] if name.startswith('spr_') else name
        if name not in seen:
            seen.add(name)
            out.append((name, f))
    return out


def pack(sprites, width=2048, maxh=2048):
    """shelf-pack trimmed sprites into as many sheets as needed"""
    items = []
    for name, f in sprites:
        im = Image.open(f).convert('RGBA')
        box = (0, 0, im.width, im.height) if '/tilesets/' in f.replace(os.sep, '/') else (im.getbbox() or (0, 0, 1, 1))
        items.append((name, im.crop(box), im.size, box))
    items.sort(key=lambda t: (-t[1].height, -t[1].width))
    sheets, frames = [], {}
    cur, x, y, row = None, 0, 0, 0
    for name, im, (ow, oh), box in items:
        w, h = im.size
        if cur is None or x + w > width:
            x, y, row = 0, y + row + 1, 0
        if cur is None or y + h > maxh:
            cur = Image.new('RGBA', (width, maxh), (0, 0, 0, 0))
            sheets.append(cur)
            x, y, row = 0, 0, 0
        cur.paste(im, (x, y))
        # sheet, x, y, w, h, offset x/y inside the original canvas, original w/h
        frames[name] = [len(sheets) - 1, x, y, w, h, box[0], box[1], ow, oh]
        x += w + 1
        row = max(row, h)
    out = []
    for i, s in enumerate(sheets):
        used = [f for f in frames.values() if f[0] == i]
        bottom = max(f[2] + f[4] for f in used)
        s = s.crop((0, 0, width, bottom))
        buf = io.BytesIO()
        s.save(buf, 'PNG', optimize=True)
        out.append(buf.getvalue())
    return out, frames


def find_music(folder):
    found = {}
    if not folder:
        return found
    files = [f for ext in ('ogg', 'mp3', 'wav') for f in glob.glob(os.path.join(folder, '**', '*.' + ext), recursive=True)]
    norm = lambda n: os.path.basename(n).lower().replace('-', '_').replace('.', '_')
    for key, words in MUSIC_WANTED.items():
        for f in files:
            n = norm(f)
            if any(w.replace(' ', '_').replace("'", '').replace(',', '') in n.replace("'", '') for w in words):
                found[key] = f
                break
    print('music found:', {k: os.path.basename(v)[-50:] for k, v in found.items()} or 'none')
    missing = [k for k in MUSIC_WANTED if k not in found]
    if missing:
        print('  missing (the game falls back to its own tracks):', missing)
    return found


def encode(path):
    import shutil, subprocess, tempfile
    if not shutil.which('ffmpeg'):
        if path.lower().endswith('.ogg'):
            return open(path, 'rb').read()
        print('  ffmpeg not found, skipping', path)
        return None
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, 'a.ogg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-c:a', 'libvorbis', '-q:a', '2', out], check=True)
        return open(out, 'rb').read()


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    archive = args[0]
    music_dir = args[args.index('--music') + 1] if '--music' in args else None
    voice_dir = args[args.index('--voice') + 1] if '--voice' in args else None
    sfx_dir = args[args.index('--sfx') + 1] if '--sfx' in args else None
    sprites = collect(archive)
    print(len(sprites), 'sprites')
    sheets, frames = pack(sprites)
    files, blobs = [], []
    for i, png in enumerate(sheets):
        files.append({'name': 'atlas-%d.png' % i, 'type': 'image/png'})
        blobs.append(png)
    music = find_music(music_dir)
    for key, path in music.items():
        data = encode(path)
        if data:
            files.append({'name': 'music/' + key + '.ogg', 'type': 'audio/ogg'})
            blobs.append(data)
    # Flowery's voice clips and the common sound effects: only the whitelisted ones (VOICE_WANTED / SFX_WANTED), never the whole pack
    for kind, folder, wanted in (('voice', voice_dir, VOICE_WANTED), ('sfx', sfx_dir, SFX_WANTED)):
        if not folder:
            continue
        index = {}
        for f in [g for d in folder.split(',') for g in glob.glob(os.path.join(d, '**', '*'), recursive=True)]:
            if f.lower().endswith(('.ogg', '.wav', '.mp3')) and '/japanese/' not in f.replace(os.sep, '/').lower():
                index.setdefault(os.path.splitext(os.path.basename(f))[0].lower(), f)
        got = 0
        for key, src in wanted.items():
            f = index.get(src.lower())
            if not f:
                print('  (no %s clip %s)' % (kind, src))
                continue
            data = encode(f)
            if data:
                files.append({'name': kind + '/' + key + '.ogg', 'type': 'audio/ogg'})
                blobs.append(data)
                got += 1
        print(kind, got, 'of', len(wanted))
    off = 0
    for f, b in zip(files, blobs):
        f['off'], f['len'] = off, len(b)
        off += len(b)
    header = json.dumps({'v': 1, 'files': files, 'frames': frames, 'music': sorted(music)}, separators=(',', ':')).encode('utf-8')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'wb') as fh:
        fh.write(b'DHFLWR01')
        fh.write(struct.pack('<I', len(header)))
        fh.write(header)
        for b in blobs:
            fh.write(b)
    print('wrote', OUT, '%.1f KB' % (os.path.getsize(OUT) / 1024), '|', len(sheets), 'atlas sheets,', len(music), 'music tracks')


if __name__ == '__main__':
    main()
