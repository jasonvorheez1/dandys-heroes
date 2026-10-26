"""One-time patches to existing bundled sources for the KH event. Idempotent."""
import subprocess, sys
B = '/workspace/tools/bundle.py'
def get(n): 
    subprocess.check_call(['python3', '-I', B, 'get', n, '/tmp/_p.js']); return open('/tmp/_p.js', encoding='utf-8').read()
def put(n, s):
    open('/tmp/_p.js', 'w', encoding='utf-8').write(s); subprocess.check_call(['python3', '-I', B, 'put', n, '/tmp/_p.js'])
def rep(s, old, new, tag, count=1):
    if new in s: print('  already', tag); return s
    assert s.count(old) >= 1, 'missing ' + tag
    print('  patched', tag); return s.replace(old, new) if count == 0 else s.replace(old, new, count)

# ---- battle/sim.js
s = get('battle/sim.js')
s = rep(s, "      if (u.def.ff7) {\n        // FF7 party members get their own PlayStation-style status window.",
"""      if (u.def.kh) {
        // Kingdom Hearts cast get the KH2 HP gauge card.
        c.classList.add('kh-card');
        c.insertAdjacentHTML('beforeend', `<div class="khc-name">${u.name}</div><div class="khc-hp"><span>HP</span></div>`);
      }
      if (u.def.ff7) {
        // FF7 party members get their own PlayStation-style status window.""", 'sim.buildBars')
s = rep(s, "      const isFF7Enemy = u.team === TEAM_E && (!!u.def.ff7Enemy || u.id === 'Sephiroth');",
"""      const isKHEnemy = u.team === TEAM_E && !!u.def.khEnemy;
      const isFF7Enemy = u.team === TEAM_E && (!!u.def.ff7Enemy || u.id === 'Sephiroth' || isKHEnemy);""", 'sim.kill.flag')
s = rep(s, "        if (isFF7Enemy) {\n          Sound.play('ff7_enemy_down',",
"""        if (isKHEnemy) {
          Sound.play('spectral', { vol: u.isBoss ? .7 : .45, throttle: 0, tag: ':kh:' + u.id + ':' + deathFxIndex, priority: u.isBoss || deathFxIndex < 2 });
          KHFX.ko(this, u);
        } else if (isFF7Enemy) {
          Sound.play('ff7_enemy_down',""", 'sim.kill.fx')
s = rep(s, "          const naturalClip = u.animT > 0\n            ? (u.animState === 'cast' ? 'cast' : 'attack')\n            : u.moving ? 'move' : 'idle';",
"""          const naturalClip = (u._clip && this.t < (u._clipUntil || 0) && u.naturalAtlases[u._clip]) ? u._clip : u.animT > 0
            ? (u.animState === 'cast' ? 'cast' : 'attack')
            : u.moving ? 'move' : 'idle';""", 'sim.clip')
put('battle/sim.js', s)

# ---- battle/ai.js : remember whether the player tapped the skill
s = get('battle/ai.js')
s = rep(s, "    try { s.cast(u, B, B.scaled(u, key), B.skillParams(u, key)); }",
        "    u._lastCastManual = !!(activation && activation.manual);\n    try { s.cast(u, B, B.scaled(u, key), B.skillParams(u, key)); }", 'ai.fire')
put('battle/ai.js', s)

# ---- ui/screens/core.js : KH page chooses its own music
s = get('ui/screens/core.js')
s = rep(s, "        ff7: s.querySelector('.ff7-event') ? s.querySelector('.ff7-event').dataset.music : null,",
        "        ff7: (s.querySelector('.ff7-event') || s.querySelector('.kh-event')) ? (s.querySelector('.ff7-event') || s.querySelector('.kh-event')).dataset.music : null,", 'core.music')
put('ui/screens/core.js', s)

# ---- ui/screens/raid.js
s = get('ui/screens/raid.js')
s = s.replace("e.isFF7 || e.isCookieRun", "e.isFF7 || e.isKH || e.isCookieRun").replace("!e.isFF7 && !e.isCookieRun", "!e.isFF7 && !e.isKH && !e.isCookieRun")
s = rep(s, "        const isComplete = cleared >= stageCount;\n\n        const banner =",
        "        const isComplete = cleared >= stageCount;\n        if (e.isKH) { list.appendChild(this.khBanner(e, entryOpen)); return; }\n\n        const banner =", 'raid.banner')
s = rep(s, "    if (ev.isFF7) { this.ff7Event(s, ev); return; }", "    if (ev.isFF7) { this.ff7Event(s, ev); return; }\n    if (ev.isKH) { this.khEvent(s, ev); return; }", 'raid.dossier')
s = rep(s, "    topbar.append(back, context, pager);\n    s.appendChild(topbar);", "    topbar.append(back, context, pager);\n    if (ev.isKHClassic) this.khClassicBar(topbar);\n    s.appendChild(topbar);", 'raid.classicbar')
s = rep(s, "const page = el('div', 'event-dossier' + (delilah ? ' delilah' : '')", "const page = el('div', 'event-dossier' + (ev.isKHClassic ? ' kh-classic' : '') + (delilah ? ' delilah' : '')", 'raid.classiccls')
s = rep(s, "(e.isCollab ? ' collab' : '') + (e.isPhantasia ? ' phantasia' : '') + (e.isCookieRun ? ' cookie-banner' : '')", "(e.isCollab ? ' collab' : '') + (e.isKHClassic ? ' kh-classic-banner' : '') + (e.isPhantasia ? ' phantasia' : '') + (e.isCookieRun ? ' cookie-banner' : '')", 'raid.classicbanner')
put('ui/screens/raid.js', s)

s = get('core.js')
s = rep(s, "    const skin = HERO_SKINS[id], hero =", "    if (HERO_SKINS[id] && typeof Art !== 'undefined' && Art.forceSkin && Art.forceSkin[id]) return HERO_SKINS[id];\n    const skin = HERO_SKINS[id], hero =", 'core.forceSkin')
put('core.js', s)
