/* Shared helpers for the live Queens of Mischief kits. The base hero file
   defines stats and artwork; these files provide their complete stage acts. */
'use strict';

function qomShow(B, kind, u, target, extra) {
  if (B.fxQomSkill) B.fxQomSkill(kind, u, Object.assign({ target }, extra || {}));
}
function qomVoice(u, cue) {
  if (u.team === TEAM_P) Sound.play(cue, { vol: 1, throttle: cue === 'qom_hey' ? 10000 : 3200 });
}
function qomWave(B, u, ratio, type, tag, callback) {
  let total = 0;
  qomFoes(B, u).forEach(enemy => {
    const stat = type === 'physical' ? u.st.atk : u.st.mag;
    const hit = B.damage(u, enemy, stat * ratio, { type, area: true, tag });
    if (hit) total += Math.max(0, hit.amount || 0);
    if (callback && enemy.alive) callback(enemy, hit);
  });
  return total;
}
function qomHasShieldFrom(ally, source) {
  return !!(ally && ally.shields && ally.shields.some(sh => sh.src === source && sh.amt > 0));
}
function qomMark(u, B, label, color) {
  B.fxFloatIcon(u.x, u.y - 106, label, color);
}
function qomRefreshStatus(B, u, id, duration, options) {
  const before = u.getStatus(id);
  if (before) B.removeStatus(u, id);
  B.applyStatus(u, u, id, duration, options);
}


/* Stage meter: each Queen shows the resource her kit is built around, so the
   rhythm, volume, and stored notes are readable without opening status chips. */
const QOM_METER = {
  QOMGourdy: u => {
    const beat = u._qomBeat || 0;
    return { cls: 'drums', pips: 4, lit: n => n === beat, accent: beat === 4, label: '' };
  },
  QOMEclipse: u => {
    const amp = qomStacks(u, 'qom_amp'), cap = u.rarity >= 5 ? 15 : 10;
    return { cls: 'amp', pips: cap, lit: n => n <= amp, accent: amp >= 10, label: amp >= 15 ? 'HEADLINER' : amp >= 10 ? 'FULL VOLUME' : '' };
  },
  QOMRibecca: u => {
    const res = qomStacks(u, 'qom_resonance');
    return { cls: 'bones', pips: 5, lit: n => n <= res, accent: res >= 4, label: '' };
  },
  QOMSoulvester: u => {
    const r = Math.min(3, qomStacks(u, 'qom_resolve'));
    return { cls: 'swords', pips: 3, lit: n => n <= r, accent: r >= 3, label: r >= 3 ? 'RIPOSTE' : '' };
  },
  QOMConnie: u => {
    const notes = qomStacks(u, 'qom_notes');
    return { cls: 'notes', pips: 8, lit: n => n <= notes, accent: notes >= 5, label: notes >= 8 ? 'SPECTRAL' : '' };
  }
};
function qomMeterHtml(u) {
  const make = QOM_METER[u.id];
  if (!make) return null;
  const m = make(u);
  let pips = '', key = m.cls + (m.accent ? '!' : '') + m.label;
  for (let n = 1; n <= m.pips; n++) { const on = m.lit(n); key += on ? 1 : 0; pips += `<i class="${on ? 'on' : ''}"></i>`; }
  return { key, html: `<span class="qm-pips">${pips}</span>${m.label ? `<b>${m.label}</b>` : ''}`, cls: m.cls, accent: m.accent };
}
