/* audio.js - pooled sfx playback straight off the SFX folder */
'use strict';

const SFXDIR = ASSET + 'SFX/Common/';
const SFXDIR2 = ASSET + 'SFX/Dandysworldcommon/';
const SFXDIR3 = ASSET + 'SFX/shop/';
const SFXDIR4 = ASSET + 'SFX/Twisteds/';
const SFXDIR5 = UPLOADS_CDN;
const cueUrl = (dir, file) => dir === SFXDIR5 ? uploadUrl(file) : dir + file;
const SFXDIR7 = ASSET + 'SFX/';
const HANDHELD_AUDIO = typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches;
const MUSIC_DEFAULT_VOLUME = HANDHELD_AUDIO ? .24 : .28;

/* Supplied score. Music lives on its own pair of Audio elements so a screen
   change can crossfade without competing with the short SFX voice pools. */
const MUSIC_TRACKS = {
  cookieShop: uploadUrl('crkshop.mp3'),
  cookieMoonBattle: uploadUrl('CRKBBG3FIGHT.mp3'),
  navigation: uploadUrl('navigationhome.mp3'),
  navigationClairDeLune: uploadUrl('navigationhome.mp3'),
  navigationChristmas: uploadUrl('the_perfect_christmas.mp3'),
  navigationLockedAway: uploadUrl('locked_away.mp3'),
  battle: uploadUrl('normalbattle.mp3'),
  arena: uploadUrl('_High_Quality__Shadow_of_the_Colossus_OST_13_-_Revived_Power.mp3'),
  arenaBattle: 'youtube:dNT-dEiwp8s',
  arenaBattleFallback: uploadUrl('_High_Quality__Shadow_of_the_Colossus_OST_13_-_Revived_Power.mp3'),
  eventBattle: uploadUrl('EVenttwistedfight.mp3'),
  qomMenu: uploadUrl('Queens_of_Mischief_BGM___Dandy_s_World.mp3'),
  qomBattle: uploadUrl('Queensofmischiefbattlemusic.mp3'),
  collabMenu: uploadUrl('kingdomheartseventmusic-2.mp3'),
  collabEvent: uploadUrl('kingdomheartsbattlemusic.mp3'),
  delilahEvent: uploadUrl('viewingtwisteddelilahevent.ogg'),
  shop: uploadUrl('shop.ogg'),
  phantasiaShop: uploadUrl('A_Bossa_do_L_mure_-_Official_Toons_Universe_Soundtrack.mp3'),
  // The Unknown World event has no menu track. Its supplied score belongs to
  // the actual battle; Big Wig keeps the separate boss score.
  unknownWorldMenu: null,
  unknownWorldBattle: uploadUrl('unknown-world-battle.mp3'),
  unknownWorldBossBattle: uploadUrl('unknown-world-boss-theme.mp3'),
  apexTrial: uploadUrl('ATLUS_Sound_Team_-_Battle-b2.mp3'),
  glossary: uploadUrl('glossary.mp3'),
  journal: uploadUrl('journal.mp3')
};
const MUSIC_VARIANTS = {
  battle: [MUSIC_TRACKS.battle, uploadUrl('battletheme2.mp3')],
  navigation: [
    MUSIC_TRACKS.navigationClairDeLune,
    MUSIC_TRACKS.navigationChristmas,
    MUSIC_TRACKS.navigationLockedAway
  ]
};
// Per-track trims keep unusually loud supplied scores in the same range while
// still allowing the user's Music setting to control every track.
const MUSIC_TRACK_TRIMS = {
  arena: .39,
  arenaBattle: .39,
  arenaBattleFallback: .39,
  apexTrial: .455,
  collabEvent: .58,
  qomMenu: .66,
  qomBattle: .66,
  navigationChristmas: .82,
  navigationLockedAway: .72
};
/* Cue names in this set resolve against SFXDIR2 instead of SFXDIR - kept as
   its own small table so CUE (below) doesn't have to carry a per-file dir. */
const CUE2 = {
  // items
  item_eat: ['EatingItem2.mp3.mp3', 'EatingItem3.mp3.mp3'],
  item_drink: ['DrinkingItem.mp3.mp3'],
  item_medkit: ['MedkitUsed.mp3.mp3'],
  item_bandage: ['UsingBandage.wav'],
  item_valve: ['ValveUsed.mp3.mp3'],
  item_jumper: ['JumperUsed.mp3.mp3'],
  item_eject: ['EjectButtonUsed.mp3.mp3'],
  item_stopwatch: ['UsingStopwatch.wav'],
  item_pop: ['PopOpened.mp3.mp3'],
  item_pickup: ['ItemPickedUp.mp3.mp3'],
  item_used: ['ItemUsed.mp3.mp3'],
  airhorn: ['AirhornUsed.mp3.mp3'],
  currency: ['Event_Currency_Earned.mp3.mp3'],
  ichor_gain: ['Ichor_Gain.mp3.mp3'],
  // heal / support - these now appear directly in battle
  heal_soft: ['Healing_Sound.mp3.mp3'],
  heal_incoming: ['abouttoheall.mp3'],
  heal_tick: ['Healing_Sound.mp3.mp3'],   // regen/over-time heals
  // combat impacts from DW
  shatter: ['loudshatter.mp3'],           // shield/ice break
  shrink2: ['loudshrink.mp3'],            // CC land (root, stun, slow)
  spectral: ['spectralsound.mp3'],        // magic debuff land
  sweep: ['sweep.mp3'],                   // heavy swing alt
  pop2: ['pop.mp3'],                      // light hit/pop
  bomb2: ['bomb.mp3'],                    // explosion alt
  beam_charge: ['chargeupabeam.mp3'],     // energy full / power up
  beam_fire: ['lightbeam.mp3'],           // magic beam launch
  throwsomething: ['throwsomething.mp3'], // projectile throw
  robot: ['robotnoise.mp3'],              // shock/electric hit alt
  // utility
  ding: ['cuteding.mp3'],
  sparkle: ['twinklesparkle.wav'],
  whisper: ['whisssss.mp3'],
  ticktock: ['ticktock.mp3'],
  choose: ['choose.mp3'],
  ui_click: ['Futuristic_scifi_button_click_sound_effect.wav', 'Roblox_UI_Bright_Click.wav']
};

/* Original storefront sounds generated specifically for Dandy's dialogue
   and arrival animation. Kept separate from the shared combat libraries. */
const CUE3 = {
  dandy_text: ['dandy-text.wav'],
  dandy_text_bright: ['dandy-text-bright.wav'],
  dandy_entrance: ['dandy-entrance.wav']
};

/* Creature recordings supplied for this project. They are deliberately kept
   out of the generic combat tables: a Twisted's voice should identify the
   creature, not become another random hit sound. Long recordings are mixed as
   sparse ambience and never looped. */
const CUE4 = {
  paint_swipe: ['tear.wav'],
  paint_splash: ['Pop-Up.ogg'],
  pebble_talk: ['Pebbletalk.mp3.mp3'],
  pebble_speak: ['Pebblespeak.mp3.mp3'],
  twisted_found: ['foundbytwisted.mp3'],
  twisted_caught: ['caught.mp3'],

  tw_gourdy_spot: ['TwistedGourdy_GroundedAngry_01.mp3.mp3'],
  tw_gourdy_attack: ['TwistedGourdy_GroundedAngry_01.mp3.mp3'],

  tw_bassie_spot: ['twistedBassieSpot.mp3.mp3'],
  tw_bassie_attack: ['twistedBassieRandom1.mp3.mp3'],
  tw_bassie_step: ['twistedBassieFootstep1.mp3.mp3', 'twistedBassieFootstep2.mp3.mp3', 'twistedBassieFootstep4.mp3.mp3'],
  tw_bassie_down: ['twistedBassieLoseAggro.mp3.mp3'],

  tw_bobette_spot: ['Twisted_Bobette_Sound_2.ogg'],
  tw_bobette_attack: ['Twisted_Bobette_misses.ogg'],
  tw_bobette_down: ['Twisted_Bobette_misses.ogg'],

  tw_dyle_spot: ['twistedDyle_Speed_Up.mp3.mp3'],
  tw_dyle_attack: ['Slash_1.ogg'],
  tw_dyle_step: ['Twisted_Dyle_Moving_1.mp3.mp3', 'Twisted_Dyle_Moving_2.mp3.mp3'],
  tw_dyle_idle: ['snakeslitherortwistedyleidle.mp3'],

  tw_dandy_spot: ['TwistedDandyStomp.mp3.mp3'],
  tw_dandy_step: ['TwistedDandyStomp.mp3.mp3'],

  tw_vee_spot: ['TwistedVeeSpotHDFIXED.mp3.mp3'],
  tw_vee_attack: ['twistedVeeskillcheck.ogg'],
  tw_vee_step: ['twistedVeeStep.ogg'],
  tw_vee_down: ['twistedVee_Stopped_Chasing_You.ogg'],

  tw_sprout_spot: ['twistedsproutYelling_for_Cosmo.mp3.mp3'],
  tw_sprout_attack: ['Sprout_Twisted_Attack_01.ogg', 'Sprout_Twisted_Attack_02.ogg', 'Sprout_Twisted_Attack_03.ogg'],
  tw_sprout_skill: ['VineAbility_ThornSpike_04.mp3.mp3'],
  tw_sprout_step: ['Twisted_Sprout_Footstep.mp3.mp3'],
  tw_sprout_idle: ['twistedSprout_breathing.mp3.mp3'],

  tw_shelly_spot: ['twistedShellySpot.mp3.mp3'],
  tw_shelly_attack: ['twistedShellyAttack.mp3.mp3'],
  tw_shelly_step: ['TwistedShellyFootsteps.mp3.mp3'],
  tw_shelly_idle: ['twistedShelly_idleSounds.ogg', 'twistedShellysound.mp3.mp3'],

  tw_pebble_spot: ['twistedPebbleBarkNew.mp3.mp3'],
  tw_pebble_attack: ['twistedpebblesnarl.ogg'],
  tw_rnd_spot: ['TwistedRNDWake.mp3.mp3'],
  tw_rnd_attack: ['TwistedRNDAttack.mp3.mp3'],
  tw_rnd_skill: ['TwistedRNDActivate.mp3.mp3'],
  tw_rnd_down: ['TwistedRNDSleep.mp3.mp3'],
  tw_blot_attack: ['TwistedBlotHandAttack.mp3.mp3'],
  tw_blot_skill: ['TwistedBlotHandSpawn.mp3.mp3'],
  tw_blot_down: ['TwistedBlotHandDespawn.mp3.mp3']
};

/* Supplied collaboration performances. They are kept on the creature bus so
   dialogue never piles up over itself during Sora's fast combo strings. */
const CUE5 = {
  qom_hey: ['qomHEY.mp3'],
  glass_break: ['glassbreak.mp3'],
  male_scream: ['vocalsmalescream.mp3'],
  orb_magic: ['orb.mp3'],
  skill_impact: ['skillimpacthit.mp3'],
  fist_up: ['fistup.mp3'],
  yap_skill: ['yappinginaskill1.mp3'],
  yap_attack: ['yappingattack.mp3'],
  drum_hit: ['drumhit.mp3'],
  swish_attack: ['swishattack.mp3', 'swishattack2.mp3'],
  powerline_beat1: ['powerline_attack2_beat1.mp3'],
  powerline_beat2: ['powerline_attack2_beat2.mp3'],
  powerline_defeat: ['powerline_defeat_microphonics.mp3'],
  crowd_aww: ['crowdawwww.mp3'],
  laser_hit: ['laserhit.mp3'],
  toon_death: ['deathsound.mp3'],
  vee_ad_pop: ['Pop-Up-2.ogg'],
  keyblade_hit: ['keybladehit.wav', 'keybladehit2.wav'],
  sora_start: ['soraletsgo.wav'],
  sora_attack: ['soraattack1.wav', 'soraattack2.wav', 'sorattack3.wav'],
  sora_skill: ['soraitsover.wav', 'soraBackoff.wav', 'soratakethis.wav', 'sorathere.wav'],
  sora_magic: ['sorathunder.wav'],
  sora_limit: ['sorathisisit.wav'],
  sora_down: ['sorako.wav'],
  kairi_start: ['kairiilltry.wav'],
  kairi_attack: ['attack1kairi.wav', 'attack2kairi.wav', 'attack3kairi.wav'],
  kairi_skill: ['kairilight.wav', 'kairithunder.wav'],
  kairi_protect: ['kairibecareful.wav', 'kairiheal.wav'],
  riku_start: ['rikuilltakeem.wav'],
  riku_attack: ['Rikuattack1.wav', 'Rikuattack2.wav', 'rikuattack3.wav'],
  riku_skill: ['rikuOUTOFMYWAY.wav', 'rikuyouregonnaloseitall.wav'],
  riku_guard: ['rikutaunt.wav'],
  goofy_start: ['goofyyeah-2.wav', 'goofyboyoh-2.wav'],
  goofy_attack: ['Goofyattack.wav', 'goofytakethat__1_.wav', 'goofytakethat__2_.wav'],
  goofy_skill: ['Goofyattack.wav', 'goofytakethat__1_.wav', 'goofytakethat__2_.wav'],
  goofy_protect: ['goofyyeah-2.wav', 'goofyboyoh-2.wav'],
  goofy_hurt: ['goofydamaged.wav', 'goofydamaged2.wav'],
  goofy_down: ['goofykoed-2.wav'],
  phantasia_start: ['phantasialetmehandlethisone.mp3', 'Phantasia_COMEONEVERYPONY.mp3.mp3'],
  phantasia_skill: ['phantasiaI_hope_it_heals.mp3.mp3'],
  phantasia_down: ['phantasiaimsososorry.mp3']
};

/* Main-hero recordings supplied from the original game. These are identity
   cues, not replacements for every skill's cast or impact sound. */
const CUE6 = {
  // Final Fantasy VII event recordings supplied for this project.
  ff7_cursor_move: ['Cursor_-_Move_ff7.wav'],
  ff7_cursor_accept: ['ff7_Cursor_-_Accept.wav'],
  ff7_cursor_equip: ['Cursor_-_Equip_ff7.wav'],
  ff7_purchase: ['Purchase.wav'],
  ff7_barret_gun: ['barretgunfire.wav'],
  ff7_ice: ['ice.wav'],
  ff7_strong_hit: ['ff7stronghit.wav'],
  ff7_sword_hit: ['ff7swordhit.wav'],
  ff7_enemy_down: ['ff7enemydown.wav'],
  ff7_slots_spin: ['slots.mp3'],
  ff7_slots_stop: ['slotsstop.mp3'],
  // Supplied combat library. These named cues are shared by the combat engine,
  // so existing and future heroes pick them up without per-hero sound wiring.
  hit_blunt: ['impact_generic_1.wav'],
  hit_heavy: ['impact_axe.wav'],
  crit: ['sfx_hit_critical_01.wav', 'sfx_hit_critical_02.wav'],
  skill_hit_normal: ['sfx_hit_skillnormal_01.wav', 'sfx_hit_skillnormal_02.wav'],
  skill_hit_strong: ['sfx_hit_skillstrong_01.wav', 'sfx_hit_skillstrong_02.wav'],
  shield_cast: ['Eff_Treasure_Shield.wav'],
  light_magic: ['lightmagic_ability_normal.wav'],
  cookie_brave_attack: ['sfx_cookie0001_attack_1_.wav'],
  cookie_brave_skill_hit: ['sfx_cookie0001_skill_hit.wav'],
  // Character recordings retained as cues for later hero/foe assignments.
  monster_10111_die: ['m10111_die.wav'],
  monster_10112_skill: ['m10112_skill1.wav'],
  cookie_darkmagic_ability: ['darkmagic_ability_normal.wav'],
  cookie_darkmagic_spread: ['darkmagic_spread_normal.wav'],
  gigi_ability: ['Gigi_Ability.ogg'],
  flutter_white: ['flutterwhite.ogg'],
  flutter_wingbeat: ['flutterwhite.ogg'],
  // Supplied Ichor Machine recordings live in uploads/.
  machine_start: ['startSkill_Check.ogg'],
  machine_fail: ['failskillcheck.ogg'],
  unknown_machine_attack: ['unknown-machine-attack.ogg'],
  unknown_machine_question: ['unknown-machine-question.ogg'],
  machine_speak: ['unknown-machine-question.ogg'],
  unknown_world_explode: ['ENC_cogfall_apart.mp3.mp3'],
  cog_hot_air: ['SA_hot_air.mp3'],
  cog_demotion: ['SA_demotion.mp3', 'SA_demotion_1_.mp3'],
  cog_fountain_pen: ['SA_fountain_pen.mp3', 'SA_fountain_pen_1_.mp3'],
  cog_filibuster: ['SA_filibuster.mp3'],
  cog_jargon: ['SA_jargon.mp3', 'SA_jargon_1_.mp3'],
  cog_mumbo_jumbo: ['SA_mumbo_jumbo.mp3'],
  cog_evil_eye: ['SA_evil_eye.mp3', 'SA_evil_eye_1_.mp3'],
  cog_power_trip: ['SA_powertie_impact.mp3'],
  cog_pick_pocket: ['SA_pick_pocket.mp3'],
  cog_hangup: ['SA_hangup.mp3', 'SA_hangup_1_.mp3'],
  cog_guilt_trip: ['SA_guilt_trip.mp3', 'SA_guilt_trip_1_.mp3', 'SA_guilt_trip_2_.mp3'],
  cog_paradigm_shift: ['SA_paradigm_shift.mp3'],
  cog_glower_power: ['SA_glower_power.mp3'],
  hero_bobette_talk: ['Bobette_Talking_Sound.ogg'],
  hero_gourdy_talk: ['Gourdydialouge.mp3.mp3'],
  hero_bassie_talk: ['BassieTalk.mp3.mp3'],
  hero_astro_talk: ['Astrotalk.mp3.mp3'],
  hero_astro_ability: ['AstroActiveAbility.mp3.mp3'],
  hero_sprout_talk: ['Sprouttalk.mp3.mp3'],
  hero_vee_talk: ['Veetalk.mp3.mp3'],
  hero_vee_ability: ['Veeabilityaudio.mp3.mp3'],
  hero_glisten_ability: ['GlistenUsingHisAbilityAudio.mp3.mp3'],
  hero_shelly_talk: ['Shellytalk.mp3.mp3'],
  hero_shelly_ability: ['ShellyAbility.mp3.mp3'],
  toodles_gamble: ['GamblingAbility.ogg'],
  // Supplied wind recording used as Rudie's long charge/arrival layer.
  rudie_wind: ['Wind-Related_Abilities.ogg'],
  // The same supplied wind recording fits Tisha's wide cleaning pulse.
  tisha_wind: ['Wind-Related_Abilities.ogg']
};

const CUE7 = {
  mastery_xp: ['mastery-xp.wav'],
  endless_enter: ['endless-enter.wav'],
  endless_cache: ['endless-cache.wav'],
  crate_reveal: ['crate-reveal.wav'],
  campaign_bubble_pop: ['campaign-bubble-pop.wav'],
  campaign_bubble_tick: ['campaign-bubble-tick.wav'],
  arena_fanfare: ['arena-fanfare.wav'],
  arena_crowd: ['arena-crowd.wav'],
  arena_gate: ['arena-gate.wav'],
  squirm_book_chomp: ['squirm-book-chomp.wav'],
  squirm_panic_flail: ['squirm-panic-flail.wav'],
  squirm_curl_shield: ['squirm-curl-shield.wav'],
  bobette_wrap: ['bobette-wrap.wav'],
  bobette_present_pop: ['bobette-present-pop.wav'],
  bobette_gift_toss: ['bobette-gift-toss.wav'],
  blot_ink_cast: ['blot-ink-cast.wav'],
  blot_mime_wall: ['blot-mime-wall.wav'],
  blot_ink_burst: ['blot-ink-burst.wav'],
  connie_vanish: ['connie-vanish.wav'],
  connie_return: ['connie-return.wav'],
  connie_prank: ['connie-prank.wav'],
  connie_phase: ['connie-phase.wav'],
  connie_veil: ['connie-veil.wav'],
  connie_fright: ['connie-fright.wav'],
  scraps_grapple: ['scraps-grapple.wav'],
  scraps_slam: ['scraps-slam.wav'],
  scraps_snip: ['scraps-snip.wav'],
  scraps_cup: ['scraps-cup.wav'],
  scraps_yarn: ['scraps-yarn.wav'],
  scraps_shred: ['scraps-shred.wav'],
  scraps_swap: ['scraps-swap.wav'],
  bigwig_gavel: ['bigwig-gavel.wav'],
  bigwig_book: ['bigwig-book.wav'],
  bigwig_stamp: ['bigwig-stamp.wav'],
  rudie_hoofstep: ['rudie-hoofstep-barrage.wav'],
  rudie_red_nose: ['rudie-red-nose-rush.wav'],
  tisha_duster_sweep: ['tisha-duster-sweep.wav'],
  tisha_formation_signal: ['tisha-formation-signal.wav'],
  tisha_dust_cloud: ['tisha-dust-cloud.wav'],
  teagan_tea_service: ['teagan-tea-service.wav'],
  teagan_manners_correction: ['teagan-manners-correction.wav'],
  teagan_proper_seating: ['teagan-proper-seating.wav'],
  shelly_rainbow_pulse: ['shelly-rainbow-pulse.wav'],
  shelly_fossil_fact: ['shelly-fossil-fact.wav'],
  shelly_rainbow_beam: ['shelly-rainbow-beam.wav'],
  apex_trial_warning: ['apex-trial-warning.wav'],
  // Queens of Mischief stage kit: every member has an instrument voice.
  qom_crash: ['qom/drum-crash.wav'],
  qom_snare: ['qom/snare.wav'],
  qom_riff: ['qom/guitar-riff.wav'],
  qom_guard: ['qom/keytar-shield.wav'],
  qom_bone: ['qom/bone-rattle.wav'],
  qom_counter: ['qom/sword-parry.wav'],
  qom_ghost: ['qom/ghost-vanish.wav'],
  qom_candy: ['qom/candy-pop.wav'],
  cookie_cane_swing: ['cookie-cane-swing.wav'],
  cookie_cane_slam: ['cookie-cane-slam.wav'],
  cookie_shadow_strings: ['cookie-shadow-strings.wav'],
  cookie_jelly_tornado: ['cookie-jelly-tornado.wav'],
  cookie_great_success: ['cookie-great-success.wav'],
  cookie_tiger_spear: ['cookie-tiger-spear.wav'],
  cookie_tiger_pounce: ['cookie-tiger-pounce.wav']
};

const COLLAB_AUDIO = {
  GingerBrave:{attack:'cookie_brave_attack',skill:'cookie_cane_slam',magic:'cookie_brave_attack'},
  GingerBright:{attack:'swing_light',skill:'sparkle',magic:'sparkle'},
  ShadowMilkCookie:{attack:'cookie_darkmagic_ability',skill:'cookie_shadow_strings',magic:'cookie_darkmagic_ability'},
  CreamPuffCookie:{attack:'sparkle',skill:'sparkle',magic:'sparkle'},
  TigerLilyCookie:{attack:'cookie_tiger_spear',skill:'cookie_tiger_pounce',magic:'cookie_tiger_pounce'},
  PureVanillaCookie:{attack:'heal_soft',skill:'sparkle',magic:'cleanse'},
  Sora: { start: 'sora_start', attack: 'sora_attack', skill: 'sora_skill', magic: 'sora_magic', limit: 'sora_limit', down: 'sora_down' },
  Riku: { start: 'riku_start', attack: 'riku_attack', skill: 'riku_skill', guard: 'riku_guard' },
  Kairi: { start: 'kairi_start', attack: 'kairi_attack', skill: 'kairi_skill', protect: 'kairi_protect' },
  Goofy: { start: 'goofy_start', attack: 'goofy_attack', skill: 'goofy_skill', protect: 'goofy_protect', hurt: 'goofy_hurt', down: 'goofy_down' },
  Phantasia: { start: 'phantasia_start', skill: 'phantasia_skill', protect: 'phantasia_skill', down: 'phantasia_down' },
  // Care Bear visitors use their authored cues through the same collaboration
  // route as the Kingdom Hearts visitors. Shelly’s skill code also calls
  // these directly for the detailed impact moments below.
  CheerbearShelly: {
    attack: 'shelly_rainbow_pulse', skill: 'shelly_rainbow_pulse',
    magic: 'shelly_rainbow_beam', down: 'toon_death'
  }
};

const HERO_AUDIO = {
  Bobette: { talk: 'hero_bobette_talk' },
  Gourdy: { talk: 'hero_gourdy_talk', ability: 'tw_gourdy_attack' },
  Bassie: { talk: 'hero_bassie_talk' },
  Astro: { talk: 'hero_astro_talk', ability: 'hero_astro_ability' },
  Sprout: { talk: 'hero_sprout_talk', ability: 'tw_sprout_skill' },
  Vee: { talk: 'hero_vee_talk', ability: 'hero_vee_ability' },
  Shelly: { talk: 'hero_shelly_talk', ability: 'hero_shelly_ability' },
  Glisten: { ability: 'hero_glisten_ability' },
  Gigi: { ability: 'gigi_ability' },
  Flutter: { ability: 'flutter_white' },
  Toodles: { ability: 'toodles_gamble' },
  Rudie: { ability: 'rudie_wind' },
  Tisha: { ability: 'tisha_wind' },
  Pebble: { talk: 'pebble_talk', ability: 'pebble_speak' },
  MrsHolloway: { talk: 'whisper', ability: 'spectral' },
  MrHolloway: { talk: 'sweep', ability: 'hit_heavy' }
};

const TWISTED_AUDIO = {
  Gourdy: { spot: 'tw_gourdy_spot', attack: 'tw_gourdy_attack', skill: 'tw_gourdy_attack' },
  Bassie: { spot: 'tw_bassie_spot', attack: 'tw_bassie_attack', skill: 'tw_bassie_attack', step: 'tw_bassie_step', down: 'tw_bassie_down' },
  Bobette: { spot: 'tw_bobette_spot', attack: 'tw_bobette_attack', skill: 'tw_bobette_attack', down: 'tw_bobette_down' },
  Dyle: { spot: 'tw_dyle_spot', attack: 'tw_dyle_attack', skill: 'tw_dyle_spot', step: 'tw_dyle_step', idle: 'tw_dyle_idle' },
  Dandy: { spot: 'tw_dandy_spot', attack: 'tw_dandy_spot', skill: 'tw_dandy_spot' },
  Vee: { spot: 'tw_vee_spot', attack: 'tw_vee_attack', skill: 'tw_vee_attack', step: 'tw_vee_step', down: 'tw_vee_down' },
  Sprout: { spot: 'tw_sprout_spot', attack: 'tw_sprout_attack', skill: 'tw_sprout_skill', step: 'tw_sprout_step', idle: 'tw_sprout_idle' },
  Shelly: { spot: 'tw_shelly_spot', attack: 'tw_shelly_attack', skill: 'tw_shelly_attack', step: 'tw_shelly_step', idle: 'tw_shelly_idle' },
  Pebble: { spot: 'tw_pebble_spot', attack: 'tw_pebble_attack', skill: 'tw_pebble_attack' },
  RnD: { spot: 'tw_rnd_spot', attack: 'tw_rnd_attack', skill: 'tw_rnd_skill', down: 'tw_rnd_down' },
  Blot: { attack: 'tw_blot_attack', skill: 'tw_blot_skill', down: 'tw_blot_down' }
};

/* Offline RMS trims for the supplied recordings, normalised toward -22 dB
   before the bus gains below. This is why the very hot Dandy stomp and the
   much quieter Gourdy vocal can share one creature bus without a jump scare. */
const SFX_FILE_GAIN = {
  'tear.wav': 1.34, 'Pop-Up.ogg': .27,
  'Pebbletalk.mp3.mp3': .27, 'Pebblespeak.mp3.mp3': .46,
  'foundbytwisted.mp3': .49, 'caught.mp3': .49,
  'TwistedGourdy_GroundedAngry_01.mp3.mp3': 5.28,
  'twistedBassieSpot.mp3.mp3': 2.03, 'twistedBassieRandom1.mp3.mp3': 2.17,
  'twistedBassieFootstep1.mp3.mp3': 1.85, 'twistedBassieFootstep2.mp3.mp3': 2.34,
  'twistedBassieFootstep4.mp3.mp3': 2.15, 'twistedBassieLoseAggro.mp3.mp3': 4.77,
  'Twisted_Bobette_Sound_2.ogg': 2.23, 'Twisted_Bobette_misses.ogg': 2.07,
  'twistedDyle_Speed_Up.mp3.mp3': 1.32, 'Slash_1.ogg': .64,
  'Twisted_Dyle_Moving_1.mp3.mp3': 4.25, 'Twisted_Dyle_Moving_2.mp3.mp3': 3.38,
  'snakeslitherortwistedyleidle.mp3': 3.83, 'TwistedDandyStomp.mp3.mp3': .29,
  'TwistedVeeSpotHDFIXED.mp3.mp3': .47, 'twistedVeeskillcheck.ogg': .83,
  'twistedVeeStep.ogg': .43, 'twistedVee_Stopped_Chasing_You.ogg': .42,
  'twistedsproutYelling_for_Cosmo.mp3.mp3': 2.06,
  'Sprout_Twisted_Attack_01.ogg': .64, 'Sprout_Twisted_Attack_02.ogg': .63,
  'Sprout_Twisted_Attack_03.ogg': .62, 'VineAbility_ThornSpike_04.mp3.mp3': 1.24,
  'Twisted_Sprout_Footstep.mp3.mp3': 1.61, 'twistedSprout_breathing.mp3.mp3': 1.07,
  'twistedShellySpot.mp3.mp3': .34, 'twistedShellyAttack.mp3.mp3': .65,
  'TwistedShellyFootsteps.mp3.mp3': .89, 'twistedShelly_idleSounds.ogg': 1.53,
  'twistedShellysound.mp3.mp3': .39, 'twistedPebbleBarkNew.mp3.mp3': 1.13,
  'twistedpebblesnarl.ogg': 1.23, 'TwistedBlotHandAttack.mp3.mp3': 1.10,
  'TwistedRNDWake.mp3.mp3': .45, 'TwistedRNDAttack.mp3.mp3': .40,
  'TwistedRNDActivate.mp3.mp3': .42, 'TwistedRNDSleep.mp3.mp3': .38,
  'TwistedBlotHandSpawn.mp3.mp3': 1.54, 'TwistedBlotHandDespawn.mp3.mp3': 2.96,
  'GlistenUsingHisAbilityAudio.mp3.mp3': .82, 'Gigi_Ability.ogg': .75,
  'GamblingAbility.ogg': .85, 'flutterwhite.ogg': .78,
  'AstroActiveAbility.mp3.mp3': .85, 'Veeabilityaudio.mp3.mp3': .80,
  'ShellyAbility.mp3.mp3': .82, 'Gourdydialouge.mp3.mp3': 1.25
};

/* Named cues mapped to real files in SFX/Common. Arrays get randomised so
   repeated hits never sound like a loop. */
const CUE = {
  // drawing & sketching
  tapdraw: ['tapdraw.wav'],
  scratch_pencil: ['ACT_SCRATCH_1.wav', 'ACT_SCRATCH_2.wav', 'ACT_SCRATCH_3.wav'],
  candy_pop: ['candy-pop.wav'],
  ghost_vanish: ['ghost-vanish.wav'],
  earth_quake: ['019_quake_1.wav'],
  bone_rattle: ['bone-rattle.wav'],
  // swings
  swing_sword: ['010_swing_sword_0.wav', '010_swing_sword_1.wav', '010_swing_sword_2.wav'],
  swing_blade: ['006_swing_blade_0.wav', '006_swing_blade_1.wav', '006_swing_blade_2.wav'],
  swing_knife: ['007_swing_knife_0.wav', '007_swing_knife_1.wav', '007_swing_knife_2.wav'],
  swing_pole: ['008_swing_pole_0.wav', '008_swing_pole_1.wav', '008_swing_pole_2.wav'],
  swing_rapier: ['009_swing_rapier_0.wav', '009_swing_rapier_1.wav', '009_swing_rapier_2.wav'],
  swing_light: ['snd_se_common_punch_kick_swing_s.wav', 'ACT_SWIPE1.wav', 'ACT_SWIPE2.wav'],
  swing_heavy: ['ACT_SWIPEHVY1.wav', 'ACT_SWIPEHVY2.wav', 'ACT_SWIPEBIG1.wav'],
  swing_double: ['ACT_DOUBLESWISH_1.wav', 'ACT_DOUBLESWISH_2.wav', 'ACT_SWIPEDOUBLELRG1.wav'],
  swing_claw: ['ACT_SCRATCH_1.wav', 'ACT_SCRATCH_2.wav', 'ACT_SCRATCH_3.wav'],
  swing_ninja: ['ACT_NINJASWIPE1.wav', 'ACT_NINJASWIPE2.wav', 'ACT_NINJASWISHES1.wav'],
  stab: ['012_stab_fast.wav', '012_stab_middle.wav', '012_stab_deep.wav'],
  spin: ['011_spin_0.wav', '011_spin_1.wav', '011_spin_2.wav'],
  whoosh: ['ACT_SPELLIT_WHOOSH_1.wav', 'ACT_SPELLIT_WHOOSH_2.wav'],
  // impacts
  hit_slash: ['101_hit_slash_0.wav', '101_hit_slash_1.wav', '101_hit_slash_3.wav'],
  hit_light: ['snd_se_common_punch_hit_s.wav', 'snd_se_common_kick_hit_s.wav'],
  hit_magic: ['snd_se_common_Magic_hit_m.wav', 'snd_se_common_Magic_hit_s.wav'],
  hit_magic_big: ['snd_se_common_Magic_hit_m.wav'],
  hit_water: ['snd_se_common_Water_hit_m.wav', 'snd_se_common_Water_hit_s.wav'],
  hit_grab: ['100_hit_grap_0.wav', '100_hit_grap_1.wav', '100_hit_grap_2.wav'],
  miss: ['ACT_SPELLIT_WHOOSH_1.wav', 'ACT_SPELLIT_WHOOSH_2.wav'],
  guard: ['snd_se_common_GuardOn.wav'],
  guardbreak: ['105_guard_slash_1.wav'],
  block: ['105_guard_slash_0.wav', '105_guard_slash_1.wav'],
  // elements
  fire: ['015_blaze_0.wav', '015_blaze_1.wav'],
  fire_big: ['snd_se_common_fire_l.wav', 'snd_se_common_fire_ll.wav'],
  explode: ['016_explode_0.wav', '016_explode_1.wav'],
  bomb: ['snd_se_common_bomb_m.wav', 'snd_se_common_bomb_l.wav'],
  freeze: ['017_freeze_0.wav', '017_freeze_1.wav'],
  icebreak: ['018_ice_break_0.wav', '018_ice_break_1.wav'],
  shock: ['014_electric_m.wav', '014_electric_l.wav'],
  shock_big: ['014_electric_ll.wav'],
  quake: ['019_quake_0.wav', '019_quake_1.wav'],
  magiccircle: ['022_magiccircle_d.wav'],
  tornado_s: ['ACT_SPELLIT_TORNADO_START.wav'],
  tornado_e: ['ACT_SPELLIT_TORNADO_END.wav'],
  steam: ['ACT_STEAM1.wav', 'ACT_STEAM2.wav', 'ACT_STEAM3.wav'],
  cloth: ['019_cloth_a.wav', '019_cloth_b.wav', '019_cloth_c.wav'],
  bone: ['021_bonecleak_0.wav', '021_bonecleak_1.wav'],
  blood: ['020_blood_0.wav', '020_blood_1.wav'],
  rocks: ['ACT_MINESTONE1.wav', 'ACT_MINESTONE3.wav', 'ACT_MINESTONE5.wav'],
  dig: ['ACT_DIGDIRT1.wav', 'ACT_DIGDIRT2.wav', 'ACT_DIGDIRT3.wav'],
  grow: ['ACT_GROW.wav'],
  shrink: ['ACT_SHRINK.wav'],
  flash: ['ACT_CAMERAFLASH.wav'],
  grab: ['ACT_GRAB.wav'],
  grapple: ['ACT_GRAPPLEFIRE.wav'],
  chain: ['ACT_GRABCHAIN.wav'],
  lock: ['ACT_TARGETLOCK.wav'],
  bounce: ['ACT_BOUNCEHI.wav', 'ACT_BOUNCELO.wav'],
  // movement
  step: ['200_walk_normal_0.wav', '200_walk_normal_1.wav', '200_walk_normal_2.wav'],
  step_soft: ['snd_se_common_Step_Carpet.wav', 'snd_se_common_Step_Soft.wav'],
  step_metal: ['snd_se_common_Metal_Step_M.wav'],
  step_wet: ['203_walk_water_0.wav', '203_walk_water_1.wav'],
  step_grass: ['201_walk_garden_0.wav', '201_walk_garden_1.wav'],
  step_heavy: ['snd_se_common_Metal_Step_L.wav'],
  dash: ['000_airdash_0.wav', '000_airdash_1.wav', '000_airdash_2.wav'],
  brake: ['208_brake_normal.wav'],
  jump: ['ACT_JUMP1.wav', 'ACT_JUMP2.wav', 'ACT_JUMP3.wav'],
  land: ['snd_se_common_Landing_Soil.wav'],
  down: ['209_down_normal_0.wav'],
  // status / support
  heal: ['snd_se_common_LifeUp.wav'],
  buff: ['snd_se_common_GuardOn.wav'],
  cleanse: ['snd_se_common_LifeUp.wav'],
  ult: ['303_tag_r_blazing_a.wav'],
  ult_ready: ['303_crushassault_flash.wav'],
  summon: ['persona_call.wav'],
  unsummon: ['persona_disappear.wav'],
  banish: ['persona_destroy.wav'],
  dizzy: ['snd_se_common_furafura.wav'],
  warn: ['snd_se_common_Waring_Out.wav'],
  countdown: ['snd_se_common_Countdown.wav'],
  // ui
  // A tactile paper/prop set replaces the old matching arcade-menu family.
  // These files were already in the project but unused by the interface.
  ui_move: ['400_menu_cursor_b.wav'],
  ui_ok: ['ACT_BUTTONPRESS_VAR1.wav'],
  ui_open: ['019_cloth_a.wav'],
  ui_close: ['ACT_PUTAWAY.wav'],
  ui_back: ['019_cloth_c.wav'],
  ui_err: ['400_menu_reset.wav'],
  ui_start: ['024_getset_a.wav'],
  ui_click: ['ACT_BUTTONPRESS.wav'],
  // Hero file UI accents. These reuse the project's tactile menu recordings,
  // but keep the roster's open/switch/tab/replay moments distinct from the
  // generic modal click.
  hero_file_open: ['ACT_BUTTONPRESS.wav'],
  hero_file_close: ['ACT_PUTAWAY.wav'],
  hero_file_switch: ['400_menu_cursor_b.wav'],
  hero_file_tab: ['ACT_PUZZLEBUTTONPOS.wav'],
  hero_file_replay: ['024_getset_a.wav'],
  hero_file_team: ['ACT_BUTTONPRESS_VAR1.wav'],
  hero_roster_enter: ['024_getset_a.wav'],
  hero_roster_exit: ['ACT_PUTAWAY.wav'],
  hero_roster_select: ['400_menu_cursor_b.wav'],
  hero_roster_sort: ['ACT_PUZZLEBUTTONPOS.wav'],
  hero_roster_action: ['ACT_BUTTONPRESS_VAR1.wav'],
  choose: ['ACT_PUZZLEBUTTONPOS.wav'],
  ding: ['400_tag_fukidasi.wav'],
  coin: ['snd_se_common_coin.wav'],
  gacha: ['gacha_normal.wav'],
  get_item: ['403_result_get.wav'],
  get_rare: ['403_result_get.wav'],
  // Gigi's non-White cues: recycled capsule-machine, coin and chime recordings.
  gigi_ticket: ['gacha_normal.wav'],
  gigi_coin_toss: ['ACT_BOUNCEHI.wav'],
  gigi_coin_hit: ['snd_se_common_coin.wav'],
  gigi_house_call: ['400_tag_fukidasi.wav'],
  gigi_clover: ['snd_se_common_coin.wav'],
  gigi_land: ['ACT_BOUNCELO.wav'],
  get_food: ['snd_se_common_item_Get_Tabemono.wav'],
  cheer: ['snd_se_Audience_Kansei_m.wav'],
  cheer_big: ['snd_se_Audience_Kansei_l.wav'],
  gasp: ['snd_se_Audience_Doyomeki_m.wav'],
  boo: ['snd_se_Audience_Zannen.wav'],
  suddendeath: ['snd_se_audience_suddendeath.wav'],
  talk: ['say.wav']
};

/* Keep cue ownership data-driven. The old resolver was a chain of nearly
   identical conditionals, which made adding a new audio directory easy to
   get wrong. Define this after every cue table so initialization is safe. */
const CUE_SOURCES = [
  [CUE, SFXDIR],
  [CUE2, SFXDIR2],
  [CUE3, SFXDIR3],
  [CUE4, SFXDIR4],
  [CUE5, SFXDIR5],
  [CUE6, SFXDIR5],
  [CUE7, SFXDIR7]
];

/* A small bus mixer keeps ten combatants from becoming ten equally loud
   noises. `gain` is deliberately conservative; callers can make a cue softer,
   but `callCap` prevents an old `{vol: 1}` from bypassing the mix. */
const SOUND_BUS = {
  // Phone speakers lose detail quickly under a quiet master mix. Give the
  // readable lanes a little more headroom while keeping ambience tucked in.
  ui:       { gain: HANDHELD_AUDIO ? .78 : .62, voices: 2, callCap: HANDHELD_AUDIO ? .96 : .9 },
  movement: { gain: HANDHELD_AUDIO ? .36 : .30, voices: 2, callCap: HANDHELD_AUDIO ? .78 : .7 },
  impact:   { gain: HANDHELD_AUDIO ? .70 : .58, voices: 4, callCap: HANDHELD_AUDIO ? .92 : .85 },
  ability:  { gain: HANDHELD_AUDIO ? .65 : .52, voices: 3, callCap: HANDHELD_AUDIO ? .92 : .85 },
  creature: { gain: HANDHELD_AUDIO ? .66 : .52, voices: 2, callCap: HANDHELD_AUDIO ? .88 : .8 },
  ambience: { gain: HANDHELD_AUDIO ? .16 : .20, voices: 1, callCap: HANDHELD_AUDIO ? .58 : .65 }
};

const UI_SOUND_CUES = new Set(['ui_move', 'ui_ok', 'ui_open', 'ui_close', 'ui_back', 'ui_err', 'ui_start',
  'hero_file_open', 'hero_file_close', 'hero_file_switch', 'hero_file_tab', 'hero_file_replay', 'hero_file_team',
  'hero_roster_enter', 'hero_roster_exit', 'hero_roster_select', 'hero_roster_sort', 'hero_roster_action',
  'coin', 'gacha', 'get_item', 'get_rare', 'get_food', 'currency', 'ichor_gain', 'mastery_xp', 'ding', 'choose', 'ui_click']);
const MOVE_SOUND_CUES = new Set(['step', 'step_soft', 'step_metal', 'step_wet', 'step_grass', 'step_heavy',
  'dash', 'brake', 'jump', 'land', 'down', 'bounce']);
const IMPACT_SOUND_CUES = new Set(['hit_slash', 'hit_blunt', 'hit_light', 'hit_heavy', 'hit_magic',
  'hit_magic_big', 'hit_water', 'hit_grab', 'crit', 'guard', 'guardbreak', 'block', 'icebreak',
  'shatter', 'pop2', 'bomb2', 'explode', 'bomb', 'blood', 'rocks', 'miss',
  'skill_hit_normal', 'skill_hit_strong', 'cookie_brave_skill_hit']);

function soundMix(cue) {
  if (cue.startsWith('ff7_cursor_')) return { bus: 'ui', gain: cue === 'ff7_cursor_move' ? .32 : .5, throttle: 70, perCue: 1, maxMs: 700, fadeMs: 100 };
  if (cue === 'ff7_purchase') return { bus: 'ui', gain: .62, throttle: 180, perCue: 1, maxMs: 1200, fadeMs: 130 };
  if (cue === 'ff7_enemy_down') return { bus: 'impact', gain: .72, throttle: 0, perCue: 3, maxMs: 1700, fadeMs: 180 };
  if (cue === 'ff7_barret_gun') return { bus: 'impact', gain: .58, throttle: 80, perCue: 2, maxMs: 900, fadeMs: 100 };
  if (cue === 'ff7_sword_hit' || cue === 'ff7_strong_hit') return { bus: 'impact', gain: .62, throttle: 50, perCue: 2, maxMs: 900, fadeMs: 100 };
  if (cue === 'ff7_ice') return { bus: 'ability', gain: .62, throttle: 280, perCue: 1, maxMs: 1500, fadeMs: 180 };
  if (cue === 'ff7_slots_spin') return { bus: 'ability', gain: .48, throttle: 900, perCue: 1, maxMs: 1450, fadeMs: 140 };
  if (cue === 'ff7_slots_stop') return { bus: 'ui', gain: .45, throttle: 120, perCue: 2, maxMs: 600, fadeMs: 100 };
  if (cue === 'skill_hit_normal') return { bus: 'impact', gain: .42, throttle: 115, perCue: 2 };
  if (cue === 'skill_hit_strong') return { bus: 'impact', gain: .56, throttle: 175, perCue: 2 };
  if (cue === 'shield_cast') return { bus: 'ability', gain: .52, throttle: 180, perCue: 2 };
  if (cue === 'light_magic') return { bus: 'ability', gain: .48, throttle: 900, perCue: 1 };
  if (cue === 'cookie_brave_attack') return { bus: 'impact', gain: .66, throttle: 90, perCue: 2 };
  if (cue === 'cookie_brave_skill_hit') return { bus: 'impact', gain: .64, throttle: 160, perCue: 2 };
  if (cue.startsWith('cookie_darkmagic_')) return { bus: 'ability', gain: .8, throttle: 180, perCue: 2 };
  if (cue === 'cookie_cane_swing') return { bus: 'impact', gain: .66, throttle: 90, perCue: 2 };
  if (cue.startsWith('cookie_')) return { bus: 'ability', gain: .75, throttle: 220, perCue: 2 };
  // The supplied QoM vocal recordings are mastered very quietly, so they use
  // the normalized Web Audio voice path instead of the element mixer.
  if (cue === 'qom_hey')
    return { bus: 'voice', gain: .4, throttle: 10000, perCue: 1, loud: 1 };
  if (cue === 'qom_snare') return { bus: 'impact', gain: .62, throttle: 140, perCue: 2, maxMs: 700, fadeMs: 120 };
  if (cue === 'qom_crash') return { bus: 'ability', gain: .78, throttle: 260, perCue: 2, maxMs: 1300, fadeMs: 260 };
  if (cue.startsWith('qom_')) return { bus: 'ability', gain: .86, throttle: 160, perCue: 2, maxMs: 1700, fadeMs: 260 };
  if (cue === 'vee_ad_pop') return { bus: 'ui', gain: .48, throttle: 180, perCue: 2, maxMs: 1200, fadeMs: 150 };
  if (cue === 'hero_file_open') return { bus: 'ui', gain: .62, throttle: 500, perCue: 1, maxMs: 900, fadeMs: 120 };
  if (cue === 'hero_file_close') return { bus: 'ui', gain: .58, throttle: 500, perCue: 1, maxMs: 1000, fadeMs: 140 };
  if (cue === 'hero_file_switch') return { bus: 'ui', gain: .44, throttle: 100, perCue: 1, maxMs: 700, fadeMs: 100 };
  if (cue === 'hero_file_tab') return { bus: 'ui', gain: .48, throttle: 80, perCue: 1, maxMs: 900, fadeMs: 120 };
  if (cue === 'hero_file_replay') return { bus: 'ui', gain: .52, throttle: 120, perCue: 1, maxMs: 900, fadeMs: 120 };
  if (cue === 'hero_file_team') return { bus: 'ui', gain: .56, throttle: 180, perCue: 1, maxMs: 900, fadeMs: 120 };
  if (cue === 'hero_roster_enter') return { bus: 'ui', gain: .58, throttle: 500, perCue: 1, maxMs: 1000, fadeMs: 130 };
  if (cue === 'hero_roster_exit') return { bus: 'ui', gain: .54, throttle: 500, perCue: 1, maxMs: 1000, fadeMs: 130 };
  if (cue === 'hero_roster_select') return { bus: 'ui', gain: .42, throttle: 80, perCue: 1, maxMs: 700, fadeMs: 100 };
  if (cue === 'hero_roster_sort') return { bus: 'ui', gain: .44, throttle: 80, perCue: 1, maxMs: 800, fadeMs: 100 };
  if (cue === 'hero_roster_action') return { bus: 'ui', gain: .52, throttle: 150, perCue: 1, maxMs: 900, fadeMs: 120 };
  if (cue === 'endless_enter') return { bus: 'ui', gain: .78, throttle: 500, perCue: 1, maxMs: 2200, fadeMs: 260 };
  if (cue === 'endless_cache') return { bus: 'ui', gain: .82, throttle: 500, perCue: 1, maxMs: 1800, fadeMs: 220 };
  // The generated crate burst is deliberately mixed much lower than normal
  // UI cues; its source master is already very dense.
  if (cue === 'crate_reveal') return { bus: 'ui', gain: .16, throttle: 500, perCue: 1, maxMs: 2600, fadeMs: 300 };
  // The supplied Toon knockout sound is punchy enough to carry the whole
  // disappearance. Give it a short, capped impact lane so a team wipe can
  // layer a few voices without five identical full-volume clips piling up.
  if (cue === 'toon_death')
    return { bus: 'impact', gain: .82, throttle: 0, perCue: 3, maxMs: 1900, fadeMs: 220 };
  if (cue === 'arena_fanfare') return { bus: 'ability', gain: .58, throttle: 1200, perCue: 1, maxMs: 3600, fadeMs: 360 };
  if (cue.startsWith('campaign_bubble_'))
    return { bus: 'ui', gain: cue.endsWith('_tick') ? .28 : .42, throttle: 80, perCue: 1, maxMs: 1400, fadeMs: 180 };
  if (cue === 'arena_crowd') return { bus: 'ambience', gain: .68, throttle: 850, perCue: 1, maxMs: 3600, fadeMs: 380 };
  if (cue === 'arena_gate') return { bus: 'impact', gain: .72, throttle: 450, perCue: 1, maxMs: 2600, fadeMs: 240 };
  if (cue === 'gigi_ticket') return { bus: 'ui', gain: .5, throttle: 300, perCue: 2, maxMs: 1200, fadeMs: 150 };
  if (cue.startsWith('gigi_') && cue !== 'gigi_ability') return { bus: 'ability', gain: .55, throttle: 250, perCue: 2, maxMs: 1400, fadeMs: 160 };
  if (cue === 'gigi_ability') return { bus: 'ability', gain: 1, throttle: 600, perCue: 1, maxMs: 3800, fadeMs: 300 };
  if (/^(sora|riku|kairi|goofy|phantasia)_/.test(cue))
    return { bus: 'creature', gain: .66, throttle: cue.endsWith('_attack') ? 900 : 1350, perCue: 1, maxMs: 3200, fadeMs: 360 };
  if (cue === 'hero_glisten_ability') return { bus: 'ability', gain: .68, throttle: 700, perCue: 1, maxMs: 2600, fadeMs: 280 };
  if (cue.startsWith('hero_'))
    return { bus: 'creature', gain: .62, throttle: cue.endsWith('_ability') ? 900 : 9000, perCue: 1, maxMs: 3600, fadeMs: 420 };
  if (cue === 'toodles_gamble') return { bus: 'ability', gain: .68, throttle: 850, perCue: 1, maxMs: 2400, fadeMs: 280 };
  if (cue.startsWith('tw_')) {
    if (cue.endsWith('_step')) return { bus: 'movement', gain: .65, throttle: 190, perCue: 1, maxMs: 1200, fadeMs: 150 };
    if (cue.endsWith('_idle')) return { bus: 'ambience', gain: .58, throttle: 8500, perCue: 1, maxMs: 5200, fadeMs: 650 };
    if (cue.endsWith('_spot')) return { bus: 'creature', gain: .72, throttle: 5000, perCue: 1, maxMs: 4500, fadeMs: 550 };
    if (cue.endsWith('_down')) return { bus: 'creature', gain: .56, throttle: 1800, perCue: 1, maxMs: 4400, fadeMs: 600 };
    return { bus: 'creature', gain: .62, throttle: 520, perCue: 1, maxMs: 3500, fadeMs: 420 };
  }
  if (cue === 'twisted_found' || cue === 'twisted_caught')
    return { bus: 'creature', gain: .58, throttle: 4000, perCue: 1, maxMs: 3600, fadeMs: 450 };
  if (cue.startsWith('pebble_')) return { bus: 'creature', gain: .72, throttle: 135, perCue: 2, maxMs: 2400, fadeMs: 300 };
  if (cue.startsWith('paint_')) return { bus: 'ability', gain: .7, throttle: 110, perCue: 2 };
  if (cue.startsWith('blot_')) return { bus: 'ability', gain: .58, throttle: 110, perCue: 2, maxMs: 1900, fadeMs: 220 };
  if (cue.startsWith('rudie_')) return { bus: 'ability', gain: .42, throttle: cue === 'rudie_hoofstep' ? 120 : 650, perCue: 2, maxMs: 1800, fadeMs: 220 };
  if (cue === 'unknown_world_explode') return { bus: 'impact', gain: 1.18, throttle: 0, perCue: 3, maxMs: 5200, fadeMs: 520 };
  if (cue === 'machine_speak') return { bus: 'creature', gain: .82, throttle: 850, perCue: 2, maxMs: 2500, fadeMs: 260 };
  if (cue.startsWith('cog_')) return { bus: 'ability', gain: .72, throttle: 260, perCue: 1, maxMs: 2600, fadeMs: 300 };
  if (cue === 'ui_move' || cue === 'ui_click')
    return { bus: 'ui', gain: .34, throttle: 70, perCue: 1 };
  if (cue === 'ui_open' || cue === 'ui_close' || cue === 'ui_back')
    return { bus: 'ui', gain: .48, throttle: 100, perCue: 1 };
  if (cue === 'ui_err') return { bus: 'ui', gain: .42, throttle: 180, perCue: 1 };
  if (cue === 'ui_ok' || cue === 'choose' || cue === 'ding')
    return { bus: 'ui', gain: .52, throttle: 90, perCue: 1 };
  if (cue === 'ui_start') return { bus: 'ui', gain: .58, throttle: 250, perCue: 1 };
  if (UI_SOUND_CUES.has(cue)) return { bus: 'ui', gain: .72, throttle: 60, perCue: 1 };
  if (MOVE_SOUND_CUES.has(cue)) return { bus: 'movement', gain: 1, throttle: 85, perCue: 1 };
  // The common punch/kick recordings are mastered hotter than the other
  // generic impacts. Keep their transient readable without letting every
  // basic attack jump out of the combat mix, especially on phone speakers.
  if (cue === 'hit_blunt') return { bus: 'impact', gain: .68, throttle: 40, perCue: 2 };
  if (cue === 'hit_light') return { bus: 'impact', gain: .72, throttle: 40, perCue: 2 };
  if (IMPACT_SOUND_CUES.has(cue)) return { bus: 'impact', gain: 1, throttle: 40, perCue: 2 };
  return { bus: 'ability', gain: 1, throttle: 65, perCue: 2 };
}

const Sound = {
  on: true,
  // The old .68 master was difficult to hear on small speakers after the
  // bus and cue trims were applied. This is still below a full-scale element
  // volume, leaving the source recordings room for transients.
  vol: HANDHELD_AUDIO ? .88 : .68,
  pool: {},
  // A phone does not need three pre-warmed copies of every cue. Keeping the
  // pool small avoids decoding and tracking dozens of idle Audio elements
  // during a long battle, while _get() can still add a voice for real overlap.
  poolSize: HANDHELD_AUDIO ? 1 : 3,
  poolMax: HANDHELD_AUDIO ? 3 : 6,
  _idx: {},
  _last: {},
  _voices: [],
  _combatLoad: 0,
  _sceneGeneration: 0,

  setCombatLoad(unitCount) {
    this._combatLoad = Number(unitCount) >= 10 ? 1 : 0;
  },

  _source(cue) {
    for (const [table, dir] of CUE_SOURCES) {
      if (table[cue]) return { files: table[cue], dir };
    }
    return null;
  },

  _get(file, dir) {
    const key = cueUrl(dir || SFXDIR, file);
    if (!this.pool[key]) {
      const arr = [];
      for (let i = 0; i < this.poolSize; i++) {
        const a = new Audio(key);
        a.preload = 'auto';
        arr.push(a);
      }
      this.pool[key] = arr;
      this._idx[key] = 0;
    }
    const arr = this.pool[key];
    const free = arr.find(a => a.paused || a.ended);
    if (free) return free;
    // Let dense battles layer repeated recordings instead of recycling and
    // audibly truncating a copy that is still playing.
    const poolCeiling = this._combatLoad ? Math.min(this.poolMax, HANDHELD_AUDIO ? 3 : 4) : this.poolMax;
    if (arr.length < poolCeiling) {
      const a = new Audio(key);
      a.preload = 'auto';
      arr.push(a);
      return a;
    }
    // At the safety ceiling, dropping the newest sound is less distracting
    // than chopping the tail off one the player is already hearing.
    return null;
  },

  _pruneVoices() {
    this._voices = this._voices.filter(v => !v.audio.paused && !v.audio.ended);
  },

  /** Let a capped or displaced recording leave the mix gracefully. The token
      check prevents an old fade timer from touching an Audio node that has
      already been reused for a newer cue. */
  _fadeOut(a, token, ms, reset) {
    if (!a || a.paused || a.ended || a._mixToken !== token) return;
    const from = a.volume, started = performance.now(), dur = Math.max(60, ms || 180);
    const tick = now => {
      if (a._mixToken !== token || a.paused || a.ended) return;
      const p = clamp((now - started) / dur, 0, 1);
      a.volume = from * (1 - p) * (1 - p);
      if (p < 1) requestAnimationFrame(tick);
      else { a.pause(); if (reset !== false) a.currentTime = 0; }
    };
    requestAnimationFrame(tick);
  },

  /**
   * play('hit_slash', {vol, rate, delay, throttle, priority})
   * Returns true only when a real voice was started, so character-specific
   * routing can fall back to a generic cue without double-playing both.
   */
  play(cue, opt) {
    if (!this.on || !cue) return false;
    opt = opt || {};
    const src = this._source(cue);
    if (!src) return false;
    if (opt.delay) {
      const generation = this._sceneGeneration;
      setTimeout(() => {
        if (generation === this._sceneGeneration)
          this.play(cue, Object.assign({}, opt, { delay: 0 }));
      }, opt.delay);
      return true;
    }

    const cfg = soundMix(cue);
    if (cfg.loud) return this._playLoud(cue, src, cfg, opt);
    const bus = SOUND_BUS[cfg.bus];
    const now = performance.now();
    const key = cue + (opt.tag || '');
    const throttle = opt.throttle == null ? cfg.throttle : Math.max(0, opt.throttle);
    if (this._last[key] && now - this._last[key] < throttle) return false;

    this._pruneVoices();
    let sameCount = 0, busCount = 0, firstSame = null, firstOnBus = null;
    for (const voice of this._voices) {
      if (voice.cue === cue) { sameCount++; if (!firstSame) firstSame = voice; }
      if (voice.bus === cfg.bus) { busCount++; if (!firstOnBus) firstOnBus = voice; }
    }
    const busLimit = this._combatLoad && cfg.bus === 'impact' ? Math.min(bus.voices, 3) : bus.voices;
    if (sameCount >= cfg.perCue || busCount >= busLimit) {
      if (!opt.priority) return false;
      const victim = firstSame || firstOnBus;
      if (victim) {
        this._fadeOut(victim.audio, victim.audio._mixToken, 140);
        this._voices = this._voices.filter(v => v !== victim);
      }
    }
    this._last[key] = now;

    try {
      const file = pick(src.files);
      const a = this._get(file, src.dir);
      if (!a) return false;
      this._voices = this._voices.filter(v => v.audio !== a);
      a.pause(); a.currentTime = 0;
      const requested = opt.vol == null ? 1 : opt.vol;
      const fileGain = src.dir === SFXDIR4 ? (SFX_FILE_GAIN[file] || 1) : 1;
      const phoneCeiling = HANDHELD_AUDIO ? .9 : .72;
      a._soundBaseVolume = clamp(Math.min(requested, bus.callCap) * bus.gain * cfg.gain * fileGain, 0, phoneCeiling);
      a.volume = clamp(a._soundBaseVolume * this.vol, 0, phoneCeiling);
      a.playbackRate = clamp(opt.rate || 1, .6, 1.8);
      const token = a._mixToken = (a._mixToken || 0) + 1;
      const p = a.play();
      this._voices.push({ audio: a, cue, bus: cfg.bus, at: now });
      const duckForVoice = () => {
        if (a._mixToken === token && typeof Music !== 'undefined' && cfg.bus === 'creature' &&
            (opt.priority || /(_spot|_down|_talk|_speak|_start|_ko)$/.test(cue))) {
          Music.duck(.72, Math.min(cfg.maxMs || 1600, 2000));
        }
      };
      if (cfg.maxMs) {
        const fade = Math.min(cfg.fadeMs || 220, cfg.maxMs * .45);
        setTimeout(() => this._fadeOut(a, token, fade), Math.max(0, cfg.maxMs - fade));
      }
      if (p && p.then) p.then(duckForVoice).catch(() => {});
      else duckForVoice();
      return true;
    } catch (e) { return false; /* autoplay blocked until first gesture */ }
  },

  /** Peak-normalized Web Audio playback for quiet dialogue recordings.
      HTMLAudio volume cannot exceed 1, so these lines are decoded once, scaled
      to a consistent peak, and passed through a limiter to stay clean. */
  _ctx: null,
  _buffers: {},
  _loudVoices: [],
  _audioCtx() {
    if (this._ctx) return this._ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = this._ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 4; limiter.ratio.value = 12;
    limiter.attack.value = .002; limiter.release.value = .12;
    limiter.connect(ctx.destination);
    this._limiter = limiter;
    // Stage-voice chain: muffle -> squeeze -> dry + echo/hall -> limiter.
    // It places the vocal "in the arena" behind the fight instead of in the
    // player's ear.
    const muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass'; muffle.frequency.value = 2300; muffle.Q.value = .5;
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass'; lowCut.frequency.value = 170;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28; comp.knee.value = 12; comp.ratio.value = 6;
    comp.attack.value = .006; comp.release.value = .22;
    // Makeup gain after the heavy squeeze; lands vocal peaks around -15 dBFS.
    const makeup = ctx.createGain(); makeup.gain.value = 4;
    const dry = ctx.createGain(); dry.gain.value = .62;
    // Slapback echo with darkening feedback.
    const delay = ctx.createDelay(1.2); delay.delayTime.value = .19;
    const fb = ctx.createGain(); fb.gain.value = .36;
    const fbTone = ctx.createBiquadFilter(); fbTone.type = 'lowpass'; fbTone.frequency.value = 1500;
    const echo = ctx.createGain(); echo.gain.value = .34;
    // Short synthetic hall.
    const hall = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.3), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    hall.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = .26;
    lowCut.connect(muffle); muffle.connect(comp); comp.connect(makeup);
    const post = makeup;
    post.connect(dry); dry.connect(limiter);
    post.connect(delay); delay.connect(fbTone); fbTone.connect(fb); fb.connect(delay);
    delay.connect(echo); echo.connect(limiter);
    post.connect(hall); hall.connect(wet); wet.connect(limiter);
    this._voiceBus = lowCut;
    return ctx;
  },
  _buffer(url) {
    const ctx = this._audioCtx();
    if (!ctx) return Promise.reject(new Error('no audio context'));
    if (!this._buffers[url]) {
      this._buffers[url] = fetch(url).then(r => r.arrayBuffer())
        .then(data => new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad)))
        .then(buffer => {
          let peak = 0;
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const d = buffer.getChannelData(c);
            for (let i = 0; i < d.length; i += 4) { const v = Math.abs(d[i]); if (v > peak) peak = v; }
          }
          return { buffer, norm: clamp(.95 / Math.max(peak, .01), 1, 14) };
        });
      this._buffers[url].catch(() => { delete this._buffers[url]; });
    }
    return this._buffers[url];
  },
  _playLoud(cue, src, cfg, opt) {
    const now = performance.now();
    const generation = this._sceneGeneration;
    const throttle = opt.throttle == null ? cfg.throttle : Math.max(cfg.throttle, opt.throttle);
    if (this._last[cue] && now - this._last[cue] < throttle) return false;
    const ctx = this._audioCtx();
    const url = cueUrl(src.dir, pick(src.files));
    if (!ctx) return false;
    this._last[cue] = now;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const level = clamp(opt.vol == null ? 1 : opt.vol, 0, 1.4) * (HANDHELD_AUDIO ? 1.15 : 1);
    this._buffer(url).then(({ buffer, norm }) => {
      if (!this.on || generation !== this._sceneGeneration || performance.now() - now > 900) return;
      // Dialogue never stacks: a new line replaces the previous one.
      this._loudVoices.forEach(v => { try { v.gain.gain.setTargetAtTime(0, ctx.currentTime, .05); v.node.stop(ctx.currentTime + .2); } catch (e) {} });
      const node = ctx.createBufferSource(), gain = ctx.createGain();
      node.buffer = buffer;
      node.playbackRate.value = clamp(opt.rate || 1, .6, 1.8);
      // The “Hey You” shout is intentionally quieter and darker than the
      // other QoM callouts, and should sit behind the fight instead of
      // jumping out of the mix.
      const heyFilter = cue === 'qom_hey' ? ctx.createBiquadFilter() : null;
      if (heyFilter) {
        heyFilter.type = 'lowpass';
        heyFilter.frequency.value = 1050;
        heyFilter.Q.value = .45;
      }
      gain.gain.value = norm * level * this.vol * cfg.gain * (cue === 'qom_hey' ? .16 : .19);
      if (heyFilter) { node.connect(heyFilter); heyFilter.connect(gain); }
      else node.connect(gain);
      gain.connect(this._voiceBus);
      const voice = { node, gain };
      this._loudVoices = [voice];
      node.onended = () => { this._loudVoices = this._loudVoices.filter(v => v !== voice); };
      node.start();
      if (typeof Music !== 'undefined') Music.duck(.68, 1600);
    }).catch(() => {});
    return true;
  },

  /** Route one action through a Twisted's authored creature profile. */
  twisted(unit, action, opt) {
    if (!unit || !unit.twisted) return false;
    const profile = TWISTED_AUDIO[unit.id];
    return !!(profile && profile[action] && this.play(profile[action], opt));
  },

  collab(unit, action, opt) {
    if (!unit) return false;
    const profile = COLLAB_AUDIO[unit.id];
    return !!(profile && profile[action] && this.play(profile[action], opt));
  },

  /** Use supplied main-hero recordings only at explicit voice moments. */
  hero(unit, action, opt) {
    if (!unit) return false;
    const profile = HERO_AUDIO[typeof unit === 'string' ? unit : unit.id];
    return !!(profile && profile[action] && this.play(profile[action], opt));
  },

  /** One restrained identification cue per encounter, bosses first. */
  encounter(units) {
    const foes = (units || []).filter(u => u.twisted && TWISTED_AUDIO[u.id]);
    const voice = foes.find(u => u.isBoss && TWISTED_AUDIO[u.id].spot) || foes.find(u => TWISTED_AUDIO[u.id].spot);
    if (voice) return this.twisted(voice, 'spot', { vol: .8, priority: true });
    return this.play('twisted_found', { vol: .4, throttle: 7000 });
  },

  /** Warm the pool for cues a battle is about to use a lot. */
  warm(cues) {
    cues.forEach(c => {
      const src = this._source(c);
      if (!src) return;
      if (soundMix(c).loud) src.files.forEach(x => this._buffer(cueUrl(src.dir, x)).catch(() => {}));
      else src.files.forEach(x => this._get(x, src.dir));
    });
  },

  stopBuses(names) {
    this._sceneGeneration++;
    const wanted = new Set(names || []);
    this._voices.forEach(v => {
      if (wanted.has(v.bus)) this._fadeOut(v.audio, v.audio._mixToken, 160);
    });
    this._voices = this._voices.filter(v => !wanted.has(v.bus));
    if (wanted.has('creature') || wanted.has('ability')) {
      this._loudVoices.forEach(v => {
        try { v.gain.gain.setTargetAtTime(0, this._ctx.currentTime, .04); v.node.stop(this._ctx.currentTime + .18); }
        catch (_) {}
      });
      this._loudVoices = [];
    }
  },

  toggle() {
    this.on = !this.on;
    if (!this.on) {
      Object.values(this.pool).flat().forEach(a => a.pause());
      this._voices = [];
      this._loudVoices.forEach(v => { try { v.node.stop(); } catch (e) {} });
      this._loudVoices = [];
      Music.stop();
    } else if (typeof Music !== 'undefined') {
      // Re-enter the last score immediately after the master sound switch is
      // turned back on; otherwise music would stay silent until navigation.
      Music.play(Music.lastKey || 'navigation');
    }
    return this.on;
  },

  setVolume(value, opt) {
    opt = opt || {};
    const fallback = HANDHELD_AUDIO ? .88 : .68;
    this.vol = clamp(Number.isFinite(Number(value)) ? Number(value) : fallback, 0, 1);
    this._voices.forEach(v => {
      if (v.audio && v.audio._soundBaseVolume != null) {
        v.audio.volume = clamp(v.audio._soundBaseVolume * this.vol, 0, HANDHELD_AUDIO ? .9 : .72);
      }
    });
    if (!opt.skipSave && typeof Save !== 'undefined' && Save.data && Save.data.opt) {
      Save.data.opt.sfxVolume = this.vol;
      Save.write();
    }
    return this.vol;
  }
};

const Music = {
  current: null,
  audio: null,
  fadeToken: 0,
  lastTrack: {},
  lastKey: null,
  youtubePlayer: null,
  youtubeHost: null,
  youtubeLoad: null,
  menuMode: 'random',
  // Keep the score present, but leave a little more room for effects and
  // character cues that otherwise disappear into phone-speaker playback.
  volume: MUSIC_DEFAULT_VOLUME,
  duckLevel: 1,
  duckUntil: 0,
  duckTimer: null,

  getMenuMode() {
    if (typeof Save !== 'undefined' && Save.data && Save.data.opt && Save.data.opt.menuMusic) {
      return Save.data.opt.menuMusic;
    }
    return this.menuMode || 'random';
  },

  setMenuMode(mode, opt) {
    opt = opt || {};
    this.menuMode = mode || 'random';
    if (!opt.skipSave && typeof Save !== 'undefined' && Save.data && Save.data.opt) {
      Save.data.opt.menuMusic = this.menuMode;
      Save.write();
    }
    if (this.current === 'navigation') {
      this.play('navigation', { force: true });
    }
    return this.menuMode;
  },

  targetVolume(key, src) {
    let trim = 1;
    if (key === 'navigation') {
      const activeSrc = src || (this.audio && this.audio.src) || this.lastTrack[key] || '';
      if (activeSrc.includes('locked_away') || activeSrc.includes('Locked%20Away') || activeSrc.includes('Locked Away')) {
        trim = MUSIC_TRACK_TRIMS.navigationLockedAway || 0.72;
      } else if (activeSrc.includes('christmas') || activeSrc.includes('Christmas')) {
        trim = MUSIC_TRACK_TRIMS.navigationChristmas || 0.82;
      } else if (MUSIC_TRACK_TRIMS[key] != null) {
        trim = MUSIC_TRACK_TRIMS[key];
      }
    } else if (MUSIC_TRACK_TRIMS[key] != null) {
      trim = MUSIC_TRACK_TRIMS[key];
    }
    return clamp(this.volume * trim * this.duckLevel, 0, 1);
  },

  duck(level, duration) {
    if (!Sound.on || !this.current || this.volume <= 0) return;
    this.duckLevel = Math.min(this.duckLevel, clamp(level, .5, 1));
    this.duckUntil = Math.max(this.duckUntil, performance.now() + duration);
    this._applyGain(90);
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.clearDuck(true);
    }, Math.max(0, this.duckUntil - performance.now()));
  },

  clearDuck(restore) {
    clearTimeout(this.duckTimer);
    this.duckTimer = null;
    this.duckUntil = 0;
    this.duckLevel = 1;
    if (restore) this._applyGain(360);
  },

  _applyGain(ms) {
    if (this.audio && this.current) {
      const target = this.targetVolume(this.current, this.audio.src);
      if (this.audio._musicTargetVolume !== target) {
        this.audio._musicTargetVolume = target;
        this._fade(this.audio, this.audio.volume, target, ms || 180);
      }
    }
    if (this.current === 'arenaBattle' && this.youtubePlayer && this.youtubePlayer.setVolume) {
      this.youtubePlayer.setVolume(Math.round(this.targetVolume('arenaBattle') * 100));
    }
  },

  setVolume(value, opt) {
    opt = opt || {};
    this.volume = clamp(Number(value) || 0, 0, 1);
    if (!opt.skipSave && typeof Save !== 'undefined' && Save.data && Save.data.opt) {
      Save.data.opt.musicVolume = this.volume;
      Save.write();
    }
    this._applyGain(180);
    return this.volume;
  },

  loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (this.youtubeLoad) return this.youtubeLoad;
    this.youtubeLoad = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        if (window.YT && window.YT.Player) resolve(window.YT);
        else reject(new Error('YouTube player API unavailable'));
      };
      let script = document.querySelector('script[data-arena-youtube-api]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.dataset.arenaYoutubeApi = 'true';
        script.onerror = () => reject(new Error('Could not load YouTube player API'));
        document.head.appendChild(script);
      }
    });
    return this.youtubeLoad;
  },

  clearYouTube() {
    if (this.youtubePlayer) {
      try { this.youtubePlayer.destroy(); } catch (_) {}
    }
    this.youtubePlayer = null;
    if (this.youtubeHost) this.youtubeHost.remove();
    this.youtubeHost = null;
  },

  playArenaYoutube() {
    const token = ++this.fadeToken;
    const old = this.audio;
    this.audio = null;
    this.current = 'arenaBattle';
    this.lastKey = 'arenaBattle';
    if (old) this._fade(old, old.volume, 0, 360, token, true);
    if (this.youtubePlayer && this.youtubePlayer.playVideo) {
      this.youtubePlayer.setVolume(Math.round(this.targetVolume('arenaBattle') * 100));
      this.youtubePlayer.playVideo();
      return;
    }
    if (this.youtubeHost) return;
    const host = document.createElement('div');
    host.id = 'arena-youtube-theme';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-220px;top:-220px;width:200px;height:200px;overflow:hidden;opacity:0;pointer-events:none;';
    document.body.appendChild(host);
    this.youtubeHost = host;
    this.loadYouTubeApi().then(YT => {
      if (this.current !== 'arenaBattle' || this.youtubeHost !== host) return;
      this.youtubePlayer = new YT.Player(host, {
        width: '200', height: '200', videoId: 'dNT-dEiwp8s',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: 'dNT-dEiwp8s', playsinline: 1, rel: 0 },
        events: {
          onReady: event => {
            if (this.current !== 'arenaBattle') { this.clearYouTube(); return; }
            event.target.setVolume(Math.round(this.targetVolume('arenaBattle') * 100));
            event.target.playVideo();
          },
          onError: () => {
            if (this.current !== 'arenaBattle') return;
            this.clearYouTube();
            this.play('arenaBattleFallback', { force: true });
          },
          onAutoplayBlocked: () => {
            if (this.current !== 'arenaBattle') return;
            this.clearYouTube();
            this.play('arenaBattleFallback', { force: true });
          }
        }
      });
    }).catch(error => {
      console.warn('[ArenaMusic] YouTube playback unavailable; using local arena theme.', error);
      if (this.current !== 'arenaBattle') return;
      this.clearYouTube();
      this.play('arenaBattleFallback', { force: true });
    });
  },

  play(key, opt) {
    opt = opt || {};
    if (key === 'arenaBattle') {
      if (!Sound.on) this.stop();
      else this.playArenaYoutube();
      return;
    }
    const base = MUSIC_TRACKS[key];
    if (!base || !Sound.on) { if (!base) this.stop(); return; }
    if (this.youtubePlayer || this.youtubeHost) this.clearYouTube();
    // Repainting a screen should not reshuffle a track that is already
    // playing. Random menu music advances only when it ends or the user
    // explicitly changes the menu selection.
    if (this.current === key && this.audio && !this.audio.paused && !opt.force) {
      const target = this.targetVolume(key, this.audio.src);
      if (this.audio._musicTargetVolume !== target) this._applyGain(240);
      return;
    }

    let choices;
    if (key === 'navigation') {
      const mode = this.getMenuMode();
      if (mode === 'christmas') {
        choices = [MUSIC_TRACKS.navigationChristmas];
      } else if (mode === 'lockedAway') {
        choices = [MUSIC_TRACKS.navigationLockedAway];
      } else if (mode === 'clair') {
        choices = [MUSIC_TRACKS.navigationClairDeLune];
      } else {
        // 'random' (shuffles Clair de Lune, The Perfect Christmas, Locked Away)
        choices = MUSIC_VARIANTS.navigation || [
          MUSIC_TRACKS.navigationClairDeLune,
          MUSIC_TRACKS.navigationChristmas,
          MUSIC_TRACKS.navigationLockedAway
        ];
      }
    } else {
      choices = MUSIC_VARIANTS[key] || [base];
    }

    const available = choices.length > 1 && this.lastTrack[key]
      ? choices.filter(src => src !== this.lastTrack[key])
      : choices;
    const src = available[Math.floor(Math.random() * available.length)] || choices[0];
    const targetVolume = this.targetVolume(key, src);

    this.lastTrack[key] = src;
    this.lastKey = key;

    const old = this.audio;
    const token = ++this.fadeToken;
    const next = new Audio(src);
    const isRandomMenu = (key === 'navigation' && this.getMenuMode() === 'random');
    next.loop = !isRandomMenu;
    if (isRandomMenu) {
      next.onended = () => {
        if (this.current === 'navigation' && this.getMenuMode() === 'random') {
          this.play('navigation', { force: true });
        }
      };
    }
    next.preload = 'auto';
    next.volume = 0;
    next._musicTargetVolume = targetVolume;
    this.current = key;
    this.audio = next;

    const attempt = next.play();
    if (attempt && attempt.catch) attempt.catch(() => {});
    this._fade(next, 0, targetVolume, 500, token);
    if (old && old !== next) this._fade(old, old.volume, 0, 360, token, true);
  },

  screen(name, opt) {
    opt = opt || {};
    if (name === 'raid' && opt.ff7) this.play(opt.ff7);
    else if (name === 'raid' && opt.cookieRun) this.play('cookieShop');
    else if (name === 'shop') this.play('shop');
    else if (name === 'phantasia-shop') this.play('phantasiaShop');
    else if (name === 'journal') this.play('journal');
    else if (name === 'glossary') this.play('glossary');
    else if (name === 'raid' && opt.qomEvent) this.play('qomMenu');
    else if (name === 'raid' && opt.collabMenu) this.play('collabMenu');
    else if (name === 'raid' && opt.delilahEvent) this.play('delilahEvent');
    else if (name === 'raid' && opt.unknownWorldMenu) this.play('unknownWorldMenu');
    else if (name === 'arena') this.play('arena');
    else this.play('navigation');
  },

  stop() {
    this.clearYouTube();
    this.clearDuck(false);
    const old = this.audio;
    if (!old) { this.current = null; return; }
    const token = ++this.fadeToken;
    this.current = null;
    this.audio = null;
    this._fade(old, old.volume, 0, 280, token, true);
  },

  _fade(a, from, to, ms, token, pauseAtEnd) {
    if (!a) return;
    const fadeId = a._musicFadeId = (a._musicFadeId || 0) + 1;
    const started = performance.now();
    const tick = now => {
      /* A newer transition may replace the active track, but an outgoing
         element still needs to finish fading instead of being abandoned. */
      if (a.ended || a._musicFadeId !== fadeId) return;
      const p = clamp((now - started) / Math.max(60, ms), 0, 1);
      a.volume = clamp(from + (to - from) * (p * (2 - p)), 0, 1);
      if (p < 1) requestAnimationFrame(tick);
      else if (pauseAtEnd) { a.pause(); a.currentTime = 0; }
    };
    requestAnimationFrame(tick);
  }
};
