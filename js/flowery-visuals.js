/* Flowery's combat voices and effects, using art and recordings from Flower Kingdom. */
'use strict';

const FloweryVisuals = (() => {
  const voiceNames = [
    'hah', 'hoo', 'my_jarona', 'jarona1', 'jarona2', 'jarona3', 'jarona4',
    'last_jarona', 'leaf_it', 'hey_guys', 'just_kidding', 'omega'
  ];
  CUE_SOURCES.push([Object.fromEntries(voiceNames.map(name =>
    ['flowery_voice_' + name, [name + '.ogg']])),
    (typeof ASSET === 'string' ? ASSET : './') + 'assets/deltarune/flowery-voice/']);
  const previousMix = soundMix;
  soundMix = function (cue) {
    if (!cue.startsWith('flowery_voice_')) return previousMix(cue);
    return { bus: 'creature', gain: .92, throttle: 650, perCue: 1,
      maxMs: 5600, fadeMs: 220, musicDip: [.72, 2200] };
  };

  function voice(B, name, options = {}) {
    if (!B || B.offscreen || B.paused || B.over) return false;
    return Sound.play('flowery_voice_' + name, {
      vol: options.vol || .9, priority: !!options.priority,
      throttle: options.throttle == null ? 650 : options.throttle
    });
  }

  function transient(host, className, duration, color) {
    if (!host) return null;
    const node = document.createElement('div');
    node.className = className;
    if (color) node.style.setProperty('--flower-color', color);
    host.appendChild(node);
    setTimeout(() => node.remove(), duration);
    return node;
  }

  function charge(u, B, target, copy = false) {
    if (B.offscreen || !target?.el) return;
    const fx = transient(target.el, 'flowery-charge-fx' + (copy ? ' copy' : ''), 520);
    if (fx) fx.style.setProperty('--charge-dir', u.face > 0 ? '1' : '-1');
    if (copy) {
      const ghost = document.createElement('img');
      ghost.className = 'flowery-jarona-copy';
      ghost.src = 'assets/deltarune/flowery-attack.png';
      ghost.alt = '';
      ghost.style.setProperty('--copy-face', u.face > 0 ? '-1' : '1');
      target.el.appendChild(ghost);
      setTimeout(() => ghost.remove(), 480);
    } else {
      Sound.play('dr_rudebuster_hit', { vol: .63, throttle: 80 });
      FX.burst(target.x, target.y - 48, 11, '#ffe274', { spMax: 185 });
    }
  }

  function thicket(u, B, zone) {
    if (B.offscreen || !B.el?.units) return;
    const wall = document.createElement('div');
    wall.className = 'flowery-thicket-wall';
    wall.style.left = zone.min + 'px';
    wall.style.top = (B.ground - 110) + 'px';
    wall.style.width = (zone.max - zone.min) + 'px';
    wall.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
    B.el.units.appendChild(wall);
    B.after(7, () => wall.remove());
    Sound.play('dr_spellcast', { vol: .55, throttle: 250 });
  }

  const recruitColor = { Floradinn: '#f58bd5', Sheary: '#cad6f4', Leafling: '#8ee48b', Shinobeetle: '#efb26b' };
  function recruit(u, B, name, target) {
    if (B.offscreen) return;
    const color = recruitColor[name] || '#ffe17e';
    const marker = transient(target?.el || u.el, 'flowery-recruit-fx', 920, color);
    if (marker) marker.textContent = name.toUpperCase();
    if (target) FX.burst(target.x, target.y - 50, 7, color, { spMax: 100 });
  }

  function omega(u, B) {
    if (B.offscreen || !u.el) return;
    let halo = u.el.querySelector('.flowery-omega-halo');
    if (!halo) {
      halo = document.createElement('div');
      halo.className = 'flowery-omega-halo';
      halo.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
      u.el.appendChild(halo);
    }
    B.after(10, () => halo.remove());
    Sound.play('dr_great_shine', { vol: .75, priority: true });
    FX.burst(u.x, u.y - 60, 25, '#f6bcff', { spMax: 230 });
  }

  function flower(B, target, color) {
    if (B.offscreen || !target?.el) return;
    transient(target.el, 'flowery-flower-hit', 580, color);
    FX.burst(target.x, target.y - 50, 8, color, { spMax: 135 });
  }

  function petals(B, u) {
    if (B.offscreen) return;
    transient(u.el, 'flowery-petal-burst', 580, '#ff9ddd');
    FX.burst(u.x, u.y - 50, 17, '#ff9ddd', { spMax: 150 });
  }

  return { voice, charge, thicket, recruit, omega, flower, petals };
})();
