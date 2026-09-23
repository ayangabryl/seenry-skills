// One moving surface, fitted to the observed row-to-row hover. Keyboard behavior is proposed.
const landmarks=[0,.20,.45,.63,.77,.85,.90,.94,.97,.985,1];
function progress(t){const n=Math.min(1,Math.max(0,t))*10,i=Math.min(9,Math.floor(n));return landmarks[i]+(landmarks[i+1]-landmarks[i])*(n-i)}
export function createMenuHighlight(menu,preference){
 const layer=document.createElement('span');layer.className='menu-highlight';layer.ariaHidden='true';menu.prepend(layer);
 let y=0,height=60,shown=false,raf=0,active=null;
 const draw=()=>{layer.style.transform=`translateY(${y}px)`;layer.style.height=height+'px'};
 const show=item=>{
  if(item===active&&shown)return;active=item;
  const danger=item.classList.contains('danger'),targetY=item.offsetTop-(danger?4:1),targetH=item.offsetHeight+(danger?8:2),fromY=y,fromH=height;
  cancelAnimationFrame(raf);
  if(!shown||preference.matches){y=targetY;height=targetH;draw()}
  else{const start=performance.now();const tick=now=>{const t=Math.min(1,(now-start)/200),p=progress(t);y=fromY+(targetY-fromY)*p;height=fromH+(targetH-fromH)*p;draw();if(t<1)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
  shown=true;layer.dataset.visible='true';
 };
 const hide=()=>{cancelAnimationFrame(raf);shown=false;active=null;layer.dataset.visible='false'};
 menu.addEventListener('pointerover',event=>{const item=event.target.closest('[role=menuitem]');if(item)show(item)});
 menu.addEventListener('pointerleave',()=>{const focused=menu.querySelector(':focus-visible');if(focused)show(focused);else hide()});
 menu.addEventListener('focusin',event=>{if(event.target.matches('[role=menuitem]'))show(event.target)});
 menu.addEventListener('focusout',event=>{if(!menu.contains(event.relatedTarget))hide()});
 preference.addEventListener('change',()=>{if(preference.matches&&active){cancelAnimationFrame(raf);const item=active;shown=false;show(item)}});
 return{hide,show};
}
