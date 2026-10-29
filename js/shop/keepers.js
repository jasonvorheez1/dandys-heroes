/* Shop conversations drive each keeper's articulated pose and expressions. */
'use strict';
const ShopKeepers = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let serial = 0;
  function node(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) n.setAttribute(k,v);
    if (parent) parent.appendChild(n);
    return n;
  }
  function dyleFace(rig) {
    const id = `shop-dyle-face-${++serial}`;
    const face = node('g', {'data-shop-expression':'neutral'}, rig.head);
    const defs = node('defs', null, face);
    const fill = node('linearGradient', { id, x1:'0%', y1:'0%', x2:'100%', y2:'60%' }, defs);
    node('stop', {offset:0,'stop-color':'#dbd9d2'},fill);
    node('stop', {offset:1,'stop-color':'#b9b9b5'},fill);
    node('path', { d:'M161 58 Q193 53 207 91 Q221 130 207 167 Q198 202 168 211 Q135 211 120 179 Q107 150 115 110 Q126 69 161 58 Z', fill:`url(#${id})` }, face);
    const ticks = [
      ['M172 62 L173 78','#ec5969'],['M195 78 L189 91','#eeac50'],
      ['M209 132 L199 132','#dece4b'],['M199 177 L191 168','#6bc56e'],
      ['M138 190 L142 176','#679cdb'],['M117 130 L126 131','#9659c2'],['M134 78 L143 91','#69409c']
    ];
    ticks.forEach(([d,color]) => node('path',{d,stroke:color,'stroke-width':6,'stroke-linecap':'round',fill:'none'},face));
    const expression = node('g',null,face);
    const hands = node('g',{stroke:'#10191a','stroke-width':4,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},face);
    node('path',{d:'M171 163 L140 191 M141 183 L139 192 L149 191 M171 163 L190 171 M185 164 L192 172 L185 175'},hands);
    node('circle',{cx:171,cy:163,r:4,fill:'#10191a'},hands);
    let previous = '';
    return (mood,talking,blink,t) => {
      const mouthOpen = talking && Math.sin(t*16) > -.2;
      const key = `${mood}-${mouthOpen}-${blink}`;
      if (key === previous) return;
      previous = key; expression.replaceChildren(); face.dataset.shopExpression = mood;
      const skeptical = mood === 'skeptical' || mood === 'serious';
      const happy = ['pleased','warm','amused'].includes(mood);
      const worried = mood === 'concerned';
      const curious = mood === 'curious';
      const line = d => node('path',{d,fill:'none',stroke:'#142024','stroke-width':2.5,'stroke-linecap':'round'},expression);
      for (const [x,y,rx,ry] of [[147,127,19,29],[193,128,15,27]]) {
        if (blink) { line(`M${x-rx} ${y+5} Q${x} ${y+15} ${x+rx} ${y+3}`); continue; }
        node('ellipse',{cx:x,cy:y,rx,ry,fill:'#eeeee9',stroke:'#142024','stroke-width':2.5},expression);
        node('ellipse',{cx:x+(curious?2:0),cy:y+4,rx:rx-4,ry:ry-5,fill:'#101416'},expression);
        const lid = y + (curious ? -15 : happy ? -5 : skeptical ? 4 : 0);
        node('path',{d:`M${x-rx} ${lid} Q${x-rx-1} ${y-ry} ${x} ${y-ry} Q${x+rx+1} ${y-ry} ${x+rx} ${lid} Z`,fill:'#263b45',stroke:'#142024','stroke-width':2},expression);
      }
      line(worried ? 'M134 96 Q146 87 155 94 M182 94 Q193 86 201 96' : skeptical ? 'M134 93 L155 100 M184 100 L201 92' : 'M137 90 Q146 82 154 91');
      if (mouthOpen) node('path',{d:happy ? 'M165 184 Q179 192 191 181 Q185 204 173 197 Z' : 'M169 184 Q180 179 186 187 Q185 201 175 199 Q168 196 169 184 Z',fill:'#35464d',stroke:'#152024','stroke-width':2},expression);
      else line(happy ? 'M164 185 Q179 200 191 182' : worried || skeptical ? 'M170 191 Q181 181 190 187' : 'M169 189 Q181 185 188 188');
    };
  }
  function mount(host, keeper, root) {
    const dyle = keeper === 'dyle';
    if (!dyle && Save.data?.opt?.animatedChars !== true) {
      const art = document.createElement('img');
      art.className = 'market-keeper-still';
      art.src = (typeof ASSET === 'string' ? ASSET : './') + 'uploads/dandyhimself.webp';
      art.alt = '';
      host.setAttribute('aria-label', 'Dandy');
      host.appendChild(art);
      return {
        speak() {},
        destroy() { host.replaceChildren(); }
      };
    }
    const rig = (dyle ? DyleRig : DandyShopRig).create(host);
    const svg = host.querySelector('svg');
    if (dyle) svg.setAttribute('viewBox', '20 0 260 355');
    const face = dyle ? dyleFace(rig) : null;
    let mood = dyle ? 'thoughtful' : 'happy', running = true, frame = 0, last = 0, t = 0;
    function update(now) {
      if (!running || !root.isConnected) return;
      const dt = Math.min(.04, (now-last)/1000 || .016); last = now;
      const reduced = typeof Accessibility !== 'undefined' && Accessibility.enabled();
      if (!document.hidden) {
        t += reduced ? 0 : dt;
        const talking = root.classList.contains('talking');
        const unit = { moving:false, animT:0, casting:talking && !reduced, hitT:0, visualSleep:false };
        if (dyle) {
          rig.update(unit, reduced ? .001 : dt);
          face(mood,talking,!reduced && t%4.7 > 4.55,t);
        } else rig.update({ mood, talking, reduced }, dt);
      }
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return {
      speak(next) { mood = next || (dyle ? 'thoughtful' : 'happy'); },
      destroy() { running = false; cancelAnimationFrame(frame); host.replaceChildren(); }
    };
  }
  return { mount };
})();
