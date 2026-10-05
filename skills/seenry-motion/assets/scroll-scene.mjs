// Original Design Motion adapter. Supply the project's GSAP + ScrollTrigger.
// The document must be readable before enhancement and after destroy/failure.
export function createScrollScene({gsap, ScrollTrigger, root, stage, build,
  distance=()=>window.innerHeight*2.4, scrub=true,
  query='(min-width: 760px) and (min-height: 540px) and (prefers-reduced-motion: no-preference)',
  observe=[], onError=()=>{}}) {
  if(!root || !stage || !root.contains(stage) || typeof build!=='function')
    throw new TypeError('A scene root, contained stable stage and timeline builder are required');
  if(scrub!==true && !(Number.isFinite(scrub)&&scrub>0))throw new TypeError('Use direct scrub:true or positive catch-up seconds');
  const media=window.matchMedia(query), reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const saved=root.getAttribute('data-scroll-enhanced');
  let context=null,timeline=null,disposed=false,frame=0,mode='fallback',reason=null;
  const restore=()=>saved===null?root.removeAttribute('data-scroll-enhanced'):root.setAttribute('data-scroll-enhanced',saved);
  const stop=()=>{context?.revert();context=null;timeline=null;restore();mode='fallback';};
  const span=()=>{
    const value=typeof distance==='function'?distance():distance;
    if(!Number.isFinite(value)||value<=0)throw new TypeError('Scroll distance must be a positive pixel count');
    return '+='+value;
  };
  const refresh=()=>{
    if(disposed||frame)return;
    frame=requestAnimationFrame(()=>{frame=0;if(!disposed&&timeline)ScrollTrigger.refresh();});
  };
  const sync=()=>{
    if(disposed)return;
    stop();
    if(!media.matches||reduce.matches){reason='responsive or reduced-motion fallback';return;}
    if(!gsap?.context||!ScrollTrigger?.create){reason='animation engine unavailable';return;}
    try{
      gsap.registerPlugin(ScrollTrigger);
      span();
      root.setAttribute('data-scroll-enhanced','true');
      // Establish the context before the builder executes so a failed builder
      // can revert both its styles and its pin without touching other scenes.
      context=gsap.context(()=>{},root);
      context.add(()=>{
        timeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
          trigger:root,pin:stage,start:'top top',end:span,scrub,
          invalidateOnRefresh:true
        }});
        build(timeline,{select:selector=>root.querySelectorAll(selector),root,stage});
        if(timeline.totalDuration()<=0)throw new Error('The choreography needs at least one timed change');
      });
      mode='enhanced';reason=null;refresh();
    }catch(error){stop();reason=String(error);onError(error);}
  };
  media.addEventListener('change',sync);reduce.addEventListener('change',sync);
  root.addEventListener('load',refresh,true);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(refresh):null;
  // Observe content that may change size, not the pin/spacer itself.
  observe.forEach(element=>observer?.observe(element));
  document.fonts?.ready.then(()=>{if(!disposed)refresh();});
  sync();
  return {
    refresh,
    get status(){return {mode,reason,progress:timeline?.progress()??null,start:timeline?.scrollTrigger?.start??null,end:timeline?.scrollTrigger?.end??null};},
    destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;observer?.disconnect();media.removeEventListener('change',sync);reduce.removeEventListener('change',sync);root.removeEventListener('load',refresh,true);stop();}
  };
}
