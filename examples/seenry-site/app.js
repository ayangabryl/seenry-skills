import {createIconSwap} from './runtime/icon-swap.mjs';
import {createNumberTransition} from './runtime/number-transition.mjs';
import {icons} from './icons.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let toastTimer;
function announce(message){clearTimeout(toastTimer);$('#status').textContent=message;$('#status').classList.add('visible');toastTimer=setTimeout(()=>$('#status').classList.remove('visible'),2400);}
const effects=new Set();
function animate(el,keyframes,options){if(reduced.matches)return;const effect=el.animate(keyframes,options);effects.add(effect);effect.finished.then(()=>effects.delete(effect),()=>effects.delete(effect));return effect;}
reduced.addEventListener('change',()=>{if(reduced.matches){effects.forEach(a=>a.cancel());effects.clear();}});

// Copy feedback follows the actual clipboard result. Every control owns its reset.
$$('[data-copy]').forEach(button=>{
 const icon=button.querySelector('.icon');
 let swap=null,request=0,timer;
 if(icon){const slot=document.createElement('span');slot.className='swap-slot';slot.innerHTML=`<span>${icons.copy}</span><span>${icons.check}</span>`;icon.replaceWith(slot);swap=createIconSwap({slot,icons:[...slot.children],duration:180});}
 button.addEventListener('click',async()=>{
  const attempt=++request;clearTimeout(timer);
  try{await navigator.clipboard.writeText(button.dataset.copy);if(attempt!==request)return;swap?.set(1);announce(button.dataset.copy.startsWith('npx')?'Install command copied':'Prompt copied');timer=setTimeout(()=>{if(attempt===request)swap?.set(0)},2200);}
  catch{const dialog=$('#copy-fallback');dialog.querySelector('textarea').value=button.dataset.copy;dialog.showModal();dialog.querySelector('textarea').focus();dialog.querySelector('textarea').select();}
 });
});

function choose(buttons,active){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===active)));const index=buttons.indexOf(active),track=active.parentElement.querySelector('.track');if(track)track.style.transform=`translateX(${index*100}%)`;}
let compositionEffect;
$$('[data-composition]').filter(b=>b.tagName==='BUTTON').forEach(button=>button.addEventListener('click',()=>{
 if(button.getAttribute('aria-pressed')==='true')return;
 const specimen=$('#composition-demo'),story=specimen.querySelector('.mini-story'),from=story.getBoundingClientRect();
 compositionEffect?.cancel();specimen.dataset.composition=button.dataset.composition;
 choose($$('.demo-toolbar button[data-composition]'),button);
 const to=story.getBoundingClientRect();
 compositionEffect=animate(story,[{transform:`translate(${from.x-to.x}px,${from.y-to.y}px)`},{transform:'translate(0,0)'}],{duration:320,easing:'cubic-bezier(.22,.75,.2,1)'});
}));
$('#guides').addEventListener('click',()=>{const next=$('#guides').getAttribute('aria-pressed')!=='true';$('#guides').setAttribute('aria-pressed',String(next));$('#guides').setAttribute('aria-label',next?'Hide layout guides':'Show layout guides');$('#composition-demo').classList.toggle('show-guides',next);});

// A real local timer. Absolute elapsed time owns truth, never an animation frame.
let total=300,remaining=300,running=false,deadline=0,lastSecond=300;
const minuteNumber=createNumberTransition({slot:$('#minutes'),value:5,format:{minimumIntegerDigits:2,useGrouping:false},duration:220,reserveValues:[0,5,88],align:'center'});
const secondNumber=createNumberTransition({slot:$('#seconds'),value:0,format:{minimumIntegerDigits:2,useGrouping:false},duration:220,reserveValues:[0,59,88],align:'center'});
const playSlot=$('#timer-toggle .swap-slot'),playIcon=createIconSwap({slot:playSlot,icons:[...playSlot.children],duration:180});
function paintTime(force=false){const seconds=Math.max(0,Math.ceil(remaining));if(force||seconds!==lastSecond){lastSecond=seconds;minuteNumber.update(Math.floor(seconds/60));secondNumber.update(seconds%60);$('.time').setAttribute('aria-label',`${Math.floor(seconds/60)} minutes ${seconds%60} seconds remaining`);}$('#timer-progress').style.strokeDashoffset=String(100*(1-remaining/total));}
function paintTimerState(){playIcon.set(running?1:0);$('#timer-label').textContent=running?'Pause focus':remaining<=0?'Start again':remaining<total?'Resume focus':'Start focus';$('#timer-toggle').setAttribute('aria-label',running?'Pause focus timer':remaining<=0?'Restart focus timer':remaining<total?'Resume focus timer':'Start focus timer');$('#timer-message').textContent=running?'One thing at a time.':remaining<=0?'A moment, well spent.':remaining<total?'Pick up when you are ready.':'A little space to think.';}
function resetTimer(seconds=total){total=seconds;remaining=seconds;running=false;paintTime(true);paintTimerState();}
$('#timer-toggle').addEventListener('click',()=>{if(running){remaining=Math.max(0,(deadline-performance.now())/1000);running=false;}else{if(remaining<=0)remaining=total;deadline=performance.now()+remaining*1000;running=true;}paintTimerState();paintTime();});
$('#timer-reset').addEventListener('click',()=>{resetTimer();announce('Timer reset');});
$$('[data-duration]').forEach(button=>button.addEventListener('click',()=>{choose($$('[data-duration]'),button);resetTimer(Number(button.dataset.duration));}));
const timerInterval=setInterval(()=>{if(!running)return;remaining=Math.max(0,(deadline-performance.now())/1000);paintTime();if(remaining===0){running=false;paintTimerState();announce('Focus session finished');}},100);

// CSS and export share the same crop geometry and focal point.
let crop='landscape';const cropSizes={landscape:[1200,800],portrait:[900,1200],detail:[1000,1000]};
const photo=$('#crop-image');
$$('[data-crop]').filter(b=>b.tagName==='BUTTON').forEach(button=>button.addEventListener('click',()=>{crop=button.dataset.crop;$('.crop-frame').dataset.crop=crop;choose($$('.demo-toolbar button[data-crop]'),button);$('#crop-size').textContent=cropSizes[crop].join(' × ');photo.alt=`Restored chair, ${crop} crop`;}));
$('#focal').addEventListener('input',()=>{const point=$('#focal').value;photo.style.objectPosition=`${point}% 50%`;photo.style.transformOrigin=`${point}% center`;});
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('#download-crop').addEventListener('click',async()=>{
 const button=$('#download-crop');if(button.disabled)return;button.disabled=true;
 try{await photo.decode();const [w,h]=cropSizes[crop],canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  const iw=photo.naturalWidth,ih=photo.naturalHeight,scale=Math.max(w/iw,h/ih)*(crop==='detail'?1.6:1),sw=w/scale,sh=h/scale,sx=(iw-sw)*(Number($('#focal').value)/100),sy=(ih-sh)/2;
  ctx.drawImage(photo,sx,sy,sw,sh,0,0,w,h);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Export failed');download(blob,`seenry-chair-${crop}.png`);announce('Image prepared. Download started.');
 }catch{announce('Could not export this image. Please try again.');}finally{button.disabled=false;}
});

let palette='paper';const palettes={paper:{surface:'#eee6d9',ink:'#743e2d',secondary:'#362c25',tone:'#cbb89e',card:'#fcfaf5'},ink:{surface:'#343b37',ink:'#f2e7c9',secondary:'#e8e6de',tone:'#667062',card:'#e7e6de'}};
$$('button[data-palette]').forEach(button=>button.addEventListener('click',()=>{palette=button.dataset.palette;$('.brand-stage').dataset.palette=palette;choose($$('button[data-palette]'),button);}));
$('#download-brand').addEventListener('click',()=>{const colors=palettes[palette];const text=`# Fieldwork brand guidelines\n\nFictional identity study created with Seenry. Palette: ${palette}.\n\n## Identity\nObjects for an everyday life. Use a quiet, direct voice.\n\n## Typography\nNewsreader 400 for the wordmark and expressive headlines. Geist 400/500 for body and controls. Both included font families use the SIL Open Font License. Use Georgia and system sans-serif as fallbacks.\n\n## Color roles\n${Object.entries(colors).map(([k,v])=>'- '+k+': '+v).join('\n')}\n\nUse the ink color against the primary surface for expressive text. On the light note card use #45382a. Verify contrast for new combinations. Palette colors are not interchangeable status colors.\n\n## Components\nGroup related content with space before adding containment. Keep inset relationships consistent. Use 8px corners for small controls and 16px for standalone objects; inspect concentric insets instead of nesting equal radii. Keep a 44px touch target where possible and a visible keyboard focus indicator.\n\n## States and motion\nUse 180–260ms color changes for palette switches. Keep type and actions stationary. With reduced motion, settle immediately. Show success only after the corresponding operation succeeds.\n\n## Material\nThe three ovals are an original composition for this study, not a required icon. Do not apply them to every surface. The image-free cards are meant for identity study, not fake customer evidence.\n\n## Open decisions\nTest the system with real product names, longer translated copy, photography and accessibility requirements before production.\n`;
 download(new Blob([text],{type:'text/markdown;charset=utf-8'}),`fieldwork-brand-${palette}.md`);announce('Brand guidelines prepared. Download started.');});

let slide=0,slideEffect;
function moveSlide(next){if(next<0||next>2||next===slide)return;const direction=next>slide?1:-1;slideEffect?.cancel();slide=next;$$('[data-slide]').forEach(el=>el.hidden=Number(el.dataset.slide)!==slide);const active=$(`[data-slide="${slide}"]`);slideEffect=animate(active,[{transform:`translateX(${direction*15}px)`,opacity:.72},{transform:'translateX(0)',opacity:1}],{duration:240,easing:'cubic-bezier(.22,.75,.2,1)'});$('#slide-count').textContent=`${slide+1} of 3`;$('#slide-prev').setAttribute('aria-disabled',String(slide===0));$('#slide-next').setAttribute('aria-disabled',String(slide===2));}
$('#slide-prev').addEventListener('click',()=>moveSlide(slide-1));$('#slide-next').addEventListener('click',()=>moveSlide(slide+1));$('.slides').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();moveSlide(slide+1);}if(e.key==='ArrowLeft'){e.preventDefault();moveSlide(slide-1);}});
window.addEventListener('pagehide',event=>{if(event.persisted)return;clearInterval(timerInterval);minuteNumber.destroy();secondNumber.destroy();playIcon.destroy();effects.forEach(a=>a.cancel());});
