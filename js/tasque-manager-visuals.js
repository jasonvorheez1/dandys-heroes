/* Small battle cues for Tasque Manager's commands. */
'use strict';
const TasqueManagerVisuals=(()=>{
  const host=B=>!B?.offscreen&&!B?.over&&B.el?.units?B.el.units:null;
  function temporary(B,className,duration){
    const h=host(B);if(!h)return null;
    const node=document.createElement('div');node.className=className;node.setAttribute('aria-hidden','true');h.appendChild(node);
    setTimeout(()=>node.remove(),duration);return node;
  }
  function spark(B,target){
    if(!target||B.offscreen)return;
    FX.burst(target.x,target.y-52,6,'#62f7fc',{spMax:120});
    const n=temporary(B,'tasque-spark',420);if(n){n.style.left=target.x+'px';n.style.top=(target.y-54)+'px';}
  }
  function whip(B,u,target){
    const n=temporary(B,'tasque-whip',550);if(n){n.style.left=(target?.x||u.x)+'px';n.style.top=((target?.y||u.y)-65)+'px';}
    if(!B.offscreen){Sound.play('dr_swing',{vol:.55,throttle:90});if(target)spark(B,target);}
  }
  function order(B,u){
    const n=temporary(B,'tasque-order',760);if(n){n.style.left=u.x+'px';n.style.top=(u.y-100)+'px';n.textContent='ORDER, ORDER!';}
    if(!B.offscreen)Sound.play('dr_spellcast',{vol:.56,throttle:180});
  }
  function alphabet(B,left,width,correct){
    const n=temporary(B,'tasque-alphabet',1750);if(!n)return;
    n.style.left=left+'px';n.style.width=width+'px';n.style.height=Math.max(130,B.ground-20)+'px';
    for(let i=0;i<4;i++){
      const col=document.createElement('div');col.className='tasque-letter'+(i===correct?' correct':'');col.textContent='ABCD'[i];
      n.appendChild(col);
    }
    setTimeout(()=>n.classList.add('strike'),650);
    Sound.play('dr_select',{vol:.42,throttle:100});
  }
  function reassemble(B,p,done){
    const n=temporary(B,'tasque-parts'+(done?' done':''),700);if(!n)return;
    n.style.left=p.x+'px';n.style.top=(p.y-42)+'px';
    for(let i=0;i<6;i++)n.appendChild(document.createElement('i'));
    if(done)Sound.play('dr_power',{vol:.46,throttle:120});
  }
  function compliance(B,u,final=false){
    const n=temporary(B,'tasque-compliance'+(final?' final':''),1100);if(n)n.textContent=final?'COMPLIANCE COMPLETE':'PRIORITY OVERRIDE';
    if(!B.offscreen){Sound.play('dr_great_shine',{vol:.65,throttle:120});FX.ring(u.x,u.y-55,180,'#65f7ff',.6);}
  }
  return{spark,whip,order,alphabet,reassemble,compliance};
})();
