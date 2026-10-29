/* Dandy's seated shop puppet, drawn from the supplied conversation poses. */
'use strict';
const DandyShopRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let serial = 0;
  function node(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) n.setAttribute(key, value);
    if (parent) parent.appendChild(n);
    return n;
  }
  class Rig {
    constructor(host) {
      this.time = 0;
      this.id = `dandy-shop-${++serial}`;
      this.svg = node('svg', { viewBox: '0 0 300 365', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, this.svg);
      const gradient = (name, light, mid, dark) => {
        const g = node('radialGradient', { id: `${this.id}-${name}`, cx: '35%', cy: '25%', r: '80%' }, defs);
        [[0, light], [.65, mid], [1, dark]].forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${this.id}-${name})`;
      };
      this.cream = gradient('cream', '#e0d9bb', '#c8c0a2', '#aaa183');
      const green = gradient('green', '#39bb24', '#239d13', '#16730c');
      const limbs = gradient('limbs', '#aac59b', '#91ad81', '#6d8b61');
      const cushion = gradient('cushion', '#d6c8b4', '#b9aa95', '#8d7c68');
      const colors = [
        ['red', '#d33d51', '#b82e43', '#8d2035'],
        ['orange', '#e5a13a', '#ce8125', '#9e5b14'],
        ['yellow', '#e1db39', '#c5c527', '#99961a'],
        ['blue', '#4272d0', '#3053ad', '#243b87'],
        ['purple', '#8c3ed2', '#7029b1', '#4d1d83']
      ];
      const fills = Object.fromEntries(colors.map(([name, a, b, c]) => [name, gradient(name, a, b, c)]));
      // The cushion and visible seat anchor his hips while his feet hang free.
      node('path', { d: 'M63 298 L250 288 L253 355 L62 355 Z', fill: '#614532' }, this.svg);
      node('path', { d: 'M72 304 L242 297 M92 304 L91 355 M220 301 L222 355', fill: 'none', stroke: '#493424', 'stroke-width': 3, opacity: .65 }, this.svg);
      node('path', { d: 'M46 289 Q63 270 97 273 L230 271 L258 283 Q251 289 245 300 Q200 314 153 310 L64 310 Q54 301 46 289 Z', fill: cushion }, this.svg);
      node('path', { d: 'M61 293 Q143 307 242 286', fill: 'none', stroke: '#e2d6c4', 'stroke-width': 1.5, opacity: .6 }, this.svg);
      this.body = node('g', {}, this.svg);
      node('ellipse', { cx: 154, cy: 271, rx: 52, ry: 22, fill: this.cream }, this.body);
      this.legs = [115, 164].map((x, i) => {
        const leg = node('g', {}, this.body);
        node('path', { d: `M${x} 279 Q${x+12} 273 ${x+26} 281 L${x+23} 324 Q${x+25} 348 ${x+9} 351 Q${x-5} 353 ${x-5} 338 L${x} 306 Z`, fill: limbs }, leg);
        return leg;
      });
      this.upper = node('g', {}, this.body);
      node('path', { d: 'M109 218 Q150 202 199 218 Q214 242 208 267 Q185 285 146 282 Q113 282 98 265 Z', fill: green }, this.upper);
      this.head = node('g', {}, this.upper);
      const petals = [
        ['purple', 'M77 48 Q52 30 35 53 Q10 77 15 118 Q16 145 54 153 L94 140 L111 82 Z', 79, 113],
        ['blue', 'M47 143 Q20 147 19 175 Q16 211 45 236 Q67 254 103 232 L119 185 L95 144 Z', 85, 183],
        ['red', 'M112 69 Q89 48 100 22 Q112 -1 143 4 Q184 4 189 32 Q194 54 177 77 Z', 146, 78],
        ['orange', 'M176 74 Q181 40 210 41 Q247 41 264 77 Q280 104 258 132 L214 143 L179 113 Z', 212, 107],
        ['yellow', 'M225 138 Q260 121 276 147 Q292 181 273 216 Q257 245 222 234 L202 198 Z', 227, 178]
      ];
      this.petals = petals.map(([name, d, x, y]) => {
        const group = node('g', {}, this.head);
        node('path', { d, fill: fills[name] }, group);
        return { group, x, y };
      });
      node('path', { d: 'M151 65 C196 63 231 91 237 134 C246 181 219 221 164 225 C112 231 70 207 67 165 C62 117 90 72 133 67 Z', fill: this.cream }, this.head);
      node('ellipse', { cx: 85, cy: 191, rx: 15, ry: 12, transform: 'rotate(24 85 191)', fill: '#82aa80', opacity: .85 }, this.head);
      node('ellipse', { cx: 220, cy: 188, rx: 13, ry: 12, transform: 'rotate(-25 220 188)', fill: '#82aa80', opacity: .85 }, this.head);
      this.features = node('g', {}, this.head);
      // Bent forearms end in rounded mitten hands resting against both cheeks.
      this.hands = node('g', {}, this.head);
      node('path', { d: 'M102 261 Q85 259 89 244 L102 217 L122 221 L117 249 Q112 263 102 261 Z M203 259 Q218 258 218 245 L208 214 L189 221 L190 247 Q193 258 203 259 Z', fill: limbs }, this.hands);
      node('path', { d: 'M97 239 Q84 227 88 214 Q91 203 100 211 Q103 198 114 202 Q124 202 130 215 Q137 225 125 237 Q110 249 97 239 Z M201 239 Q185 235 179 224 Q176 214 188 206 Q198 199 204 207 Q210 196 218 203 Q227 210 219 226 Q216 237 201 239 Z', fill: limbs }, this.hands);
      this.drawFace('happy', false, false);
    }
    drawFace(mood = 'happy', talking = false, blink = false) {
      const syllable = talking && Math.sin(this.time * 10) > .25;
      const glance = Math.sin(this.time * .55) > .72 ? -3 : 5;
      const key = `${mood}-${syllable}-${blink}-${glance}`;
      if (key === this.faceKey) return;
      this.faceKey = key;
      const g = this.features;
      g.replaceChildren();
      const line = (d, width = 2.7) => node('path', { d, fill: 'none', stroke: '#211f19', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const worried = mood === 'concerned' || mood === 'serious';
      const relaxed = mood === 'thoughtful' || mood === 'skeptical';
      const defs = node('defs', {}, g);
      [[111, 149, 32, 32], [191, 147, 30, 31]].forEach(([x, y, rx, ry], i) => {
        if (blink) { line(`M${x-rx} ${y+4} Q${x} ${y+22} ${x+rx} ${y+4}`); return; }
        const clipId = `${this.id}-eye-${i}`;
        node('ellipse', { cx:x, cy:y, rx, ry }, node('clipPath', { id:clipId }, defs));
        node('ellipse', { cx:x, cy:y, rx, ry, fill:'#eeeadf' }, g);
        const eye = node('g', { 'clip-path': `url(#${clipId})` }, g);
        node('ellipse', { cx:x+glance, cy:y+6, rx:rx-6, ry:ry-6, fill:'#10110e' }, eye);
        if (relaxed) node('path', { d:`M${x-rx-2} ${y-ry-2} H${x+rx+2} V${y-7} Q${x} ${y+1} ${x-rx-2} ${y-7} Z`, fill:this.cream, stroke:'#211f19', 'stroke-width':2.5 }, eye);
        node('ellipse', { cx:x, cy:y, rx, ry, fill:'none', stroke:'#211f19', 'stroke-width':2.7 }, g);
        // A little lower lid softens the sideways look from the seated reference.
        if (!relaxed) node('path', { d:`M${x-rx+7} ${y+ry-8} Q${x} ${y+ry-13} ${x+rx-5} ${y+ry-7}`, fill:'none', stroke:'#211f19', 'stroke-width':2, 'stroke-linecap':'round' }, eye);
      });
      if (worried) line('M88 111 Q105 111 117 101 M177 103 Q193 113 208 109', 3);
      else if (relaxed || talking) line('M173 102 Q188 113 207 107', 3);
      if (worried) line('M129 207 Q154 198 178 205', 2.8);
      else {
        node('path', { d: syllable
          ? 'M113 198 Q148 207 191 194 Q184 220 153 220 Q126 220 113 198 Z'
          : 'M113 198 Q150 205 191 194 Q182 215 153 216 Q128 215 113 198 Z',
          fill:'#e8e1ce', stroke:'#211f19', 'stroke-width':2.8, 'stroke-linejoin':'round' }, g);
        line(syllable ? 'M133 202 Q129 211 133 217 M153 202 L155 219 M174 199 Q175 209 179 213'
          : 'M133 202 Q130 208 133 213 M153 202 L155 215 M174 199 Q174 207 178 209', 2.5);
      }
    }
    update({ mood = 'happy', talking = false, reduced = false }, dt) {
      this.time += reduced ? 0 : dt;
      const t = this.time, breath = reduced ? 0 : Math.sin(t * 1.8);
      this.upper.setAttribute('transform', `translate(0 ${breath*.7})`);
      this.head.setAttribute('transform', `rotate(${breath*.7 + (talking && !reduced ? Math.sin(t*3)*.6 : 0)} 153 220)`);
      this.legs.forEach((leg, i) => leg.setAttribute('transform', `rotate(${reduced ? 0 : Math.sin(t*1.7+i*.7)*2} ${i ? 178 : 129} 282)`));
      this.petals.forEach(({group,x,y}, i) => group.setAttribute('transform', `rotate(${reduced ? 0 : Math.sin(t*1.8+i)*.7} ${x} ${y})`));
      this.drawFace(mood, talking && !reduced, !reduced && t%5.2 > 5.05);
    }
  }
  return { create: host => new Rig(host) };
})();
