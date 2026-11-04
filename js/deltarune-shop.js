/* Flower Kingdom recruits appear in Dyle's Characters tab as the event progresses. */
'use strict';

(() => {
  const offers = [
    { id:'TasqueManager', start:true, price:30000, art:'assets/deltarune/tasque-manager-portrait.png', note:'Control / Support · SS Tier' },
    { id:'Kris', part:2, price:15000, art:'assets/deltarune/kris-portrait.png', note:'Control / Damage · S Tier' },
    { id:'Ralsei', part:6, price:30000, art:'assets/deltarune/ralsei-portrait.png', note:'Support / Healer / Control · SS Tier' },
    { id:'Flowery', part:10, price:45000, art:'assets/deltarune/flowery-portrait.png', note:'Damage / Control · S Tier' }
  ];
  function available(offer, progress){
    return offer.start ? !!progress.started : Math.max(0, Number(progress.seg) || 0) >= offer.part;
  }
  function buy(offer){
    if(Save.owns(offer.id)||!available(offer,FlowerKingdom.state()))return;
    if(!Save.can({ichor:offer.price})){UI.toast('Not enough Ichor.');return;}
    Save.spend({ichor:offer.price});
    Save.data.heroes[offer.id]=Save.newHero(offer.id);
    try{Achievements.record('heroUnlock',1);if(UI.queueHeroUnlock)UI.queueHeroUnlock(offer.id);}catch(_){/* optional presentation */}
    Save.write();UI.toast(HEROES[offer.id].name+' joined your team.');Screens.render();
  }
  if(typeof DyleShop==='undefined'||!DyleShop.renderCharacters)return;
  const previous=DyleShop.renderCharacters;
  DyleShop.renderCharacters=function(contents){
    previous.apply(this,arguments);
    const progress=FlowerKingdom.state();
    offers.forEach(offer=>{
      const name=HEROES[offer.id].name;
      const owned=Save.owns(offer.id),unlocked=available(offer,progress),afford=Save.can({ichor:offer.price});
      const card=el('section','ap-shelf');
      const message=owned?'On your roster.':unlocked?offer.note:offer.start?'Start Flower Kingdom to unlock.':`Finish Flower Kingdom part ${offer.part} to unlock.`;
      const action=owned?'Owned':unlocked?`Buy · ${offer.price.toLocaleString()} Ichor`:'Locked';
      card.innerHTML=`<img src="${offer.art}" alt="${name}"><div><small>FLOWER KINGDOM · ${offer.start?'START':`PART ${offer.part}`}</small><b>${name}</b><p>${message}</p><button type="button" class="ap-buy" ${owned||!unlocked||!afford?'disabled':''}>${action}</button></div>`;
      card.querySelector('button').onclick=()=>buy(offer);
      contents.appendChild(card);
    });
  };
})();

if (typeof HERO_GENDER !== 'undefined') {
  HERO_GENDER.Ralsei = 'Male';
  HERO_GENDER.TasqueManager = 'Female';
  HERO_GENDER.Flowery = 'Male';
  HERO_GENDER.Kris = 'Other';
}
if (typeof HERO_ANIMAL !== 'undefined') {
  HERO_ANIMAL.TasqueManager = 'Cat';
  HERO_ANIMAL.TasqueCompanion = 'Cat';
  HERO_ANIMAL.Ralsei = 'Goat';
}
if (typeof HeroCollections !== 'undefined' && HeroCollections.catalogue) {
  if (!HeroCollections.catalogue.some(c => c.id === 'deltarune')) {
    HeroCollections.catalogue.push({
      id: 'deltarune', name: 'Flower Kingdom & Deltarune', theme: 'Deltarune crossover roster',
      icon: '♥', color: '#ff7799', stat: 'hp',
      members: () => ['Kris', 'Ralsei', 'TasqueManager', 'Flowery'].filter(id => (typeof PLAYABLE_IDS !== 'undefined' ? PLAYABLE_IDS : []).includes(id))
    });
  }
}
