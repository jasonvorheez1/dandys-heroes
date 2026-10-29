/* Dyle's Sprout appearance dresses the default puppet without replacing its pose or animation. */
'use strict';
const SALTED_CARAMEL = {
  id:'salted-caramel', name:'Salted caramel', art:'assets/skins/sprout-salted-caramel.svg',
  description:'Dyle’s gift: recruit Sprout and hear four of Dyle’s gossip files.',
  get available() { return DyleShop.hasSkin(); }
};
const SproutSalted = { pending:undefined };
{
  const originalSkin = Art.skin;
  Art.skin = function(id,costume) {
    if (id !== 'Sprout') return originalSkin.apply(this,arguments);
    const selected = arguments.length > 1 ? costume : Save.data?.heroes?.Sprout?.costume;
    SproutSalted.pending = selected;
    if (selected === SALTED_CARAMEL.id) return SALTED_CARAMEL.available ? SALTED_CARAMEL : null;
    return originalSkin.apply(this,arguments);
  };
}
function dressSaltedCaramel(rig) {
  const NS='http://www.w3.org/2000/svg';
  const node=(tag,attrs,parent)=>{
    const n=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs||{}))n.setAttribute(key,value);
    parent.appendChild(n);return n;
  };
  const {parts,face,grin}=rig.R;
  const insert=(part,before)=>{
    const g=node('g',{},part.g);
    if(before)part.g.insertBefore(g,before);
    return g;
  };
  const head=insert(parts.head,grin||face);
  // Caramel sits on the berry's far side, leaving the original eyes visible.
  node('path',{d:'M173 81 Q196 78 207 94 L209 115 Q197 102 188 107 Q179 111 170 105 Z',fill:'#dc7628',opacity:.96},head);
  node('path',{d:'M178 86 Q194 82 203 93',fill:'none',stroke:'#f4b25d','stroke-width':3,'stroke-linecap':'round',opacity:.75},head);
  const torso=insert(parts.torso,parts.armLu.g);
  node('path',{d:'M117 230 Q143 238 169 228 L170 314 Q145 323 117 315 Z',fill:'#c46a25'},torso);
  node('path',{d:'M118 244 Q143 250 168 241 M120 305 Q143 312 168 302',fill:'none',stroke:'#e9a45f','stroke-width':3,opacity:.6},torso);
  node('path',{d:'M135 260 L145 252 L155 260 L155 274 L145 282 L135 274 Z',fill:'#f8e5ba',stroke:'#e2b578','stroke-width':2},torso);
  node('path',{d:'M141 260 L149 260 L151 267 L145 275 L139 267 Z',fill:'#fff7e9',opacity:.9},torso);
  const scarf=parts.scarf.g.querySelector('svg');
  if(scarf)scarf.style.filter='sepia(.42) saturate(1.7) hue-rotate(-8deg)';
  // Gloves are parented to the original forearms and follow every action.
  node('path',{d:'M64 312 Q69 297 82 298 Q85 288 95 290 Q112 293 116 308 Q117 327 101 338 Q80 348 66 334 Q60 324 64 312 Z',fill:'#f6ead8',opacity:.92},parts.armLf.g);
  node('path',{d:'M178 291 Q184 281 194 286 Q202 284 210 292 Q219 303 215 314 Q206 322 190 315 Q180 312 178 291 Z',fill:'#f6ead8',opacity:.92},parts.armR.g);
  rig.R.svg.classList.add('salted-caramel-rig');
  return rig;
}
{
  const originalCreate=SproutRig.create;
  SproutRig.create=function(host,costume) {
    const selected=arguments.length>1?costume:SproutSalted.pending===undefined?Save.data?.heroes?.Sprout?.costume:SproutSalted.pending;
    SproutSalted.pending=undefined;
    const rig=originalCreate.call(this,host);
    return selected===SALTED_CARAMEL.id&&SALTED_CARAMEL.available?dressSaltedCaramel(rig):rig;
  };
}
{
  const originalExtras=HeroPage.extrasTab;
  HeroPage.extrasTab=function(id) {
    const wrap=originalExtras.call(this,id);if(id!=='Sprout')return wrap;
    const unlocked=SALTED_CARAMEL.available,equipped=Save.hero(id).costume===SALTED_CARAMEL.id;
    const card=el('div','card hero-skin-card');
    card.innerHTML=`<div class="hero-skin-kicker">DYLE’S SHOP APPEARANCE</div><div class="hero-skin-layout"><div class="hero-skin-swatches"><img src="${Art.defaultHero(id)}" alt="Default Sprout"><img src="${ASSET+SALTED_CARAMEL.art}" alt="Salted caramel"></div><div class="hero-skin-copy"><div class="row"><div class="grow"><b>Salted caramel</b><small class="muted">Sprout skin</small></div><span class="hero-skin-status">${equipped?'EQUIPPED':unlocked?'UNLOCKED':'LOCKED'}</span></div><p class="mini muted">${unlocked?'A gift from Dyle.':'Recruit Sprout and hear 4 of Dyle’s gossip files, then claim in his shop.'}</p></div></div>`;
    const button=el('button','btn small hero-skin-button',equipped?'USE DEFAULT':unlocked?'EQUIP SKIN':'VISIT DYLE’S SHOP');button.type='button';
    button.onclick=()=>{
      if(!SALTED_CARAMEL.available){Screens.shopKeeper='dyle';Screens.dyleShopTab='skins';Screens.go('shop');return;}
      Save.hero(id).costume=equipped?null:SALTED_CARAMEL.id;Save.write();Sound.play('ui_ok');this.draw();
    };
    card.appendChild(button);wrap.prepend(card);
    if(equipped){
      const summary=[...wrap.querySelectorAll('.gear-summary-grid>div')].find(n=>n.querySelector('small')?.textContent==='SKIN');
      if(summary)summary.querySelector('b').textContent=SALTED_CARAMEL.name;
      else wrap.querySelector('.gear-summary-grid')?.insertAdjacentHTML('beforeend','<div><small>SKIN</small><b>Salted caramel</b></div>');
    }
    return wrap;
  };
}
