import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BorderBeam} from 'border-beam';
import {ThinkingOrb} from 'thinking-orbs';
import {Liquid} from 'liquid-gooey';
import {MetalFx} from 'metal-fx';
import {ImageGeneration} from 'img-fx';

// Host-owned integration guard. Vendor defaults are not the product's policy.
function useMotionPolicy(ref, enabled) {
 const [policy,setPolicy]=useState({reduced:true,hidden:false,visible:false});
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;
 const sync=()=>setPolicy({reduced:mq.matches,hidden:document.hidden,visible});
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()});
 if(ref.current)io.observe(ref.current);mq.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
 return()=>{io.disconnect();mq.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync)};
 },[ref]);
 return {...policy,run:enabled&&!policy.reduced&&!policy.hidden&&policy.visible};
}
function Section({id,title,description,enabled,children}){
 const ref=useRef(null);const p=useMotionPolicy(ref,enabled);
 return <section id={id} ref={ref} data-running={p.run} data-reduced={p.reduced}><h2>{title}</h2><p>{description}</p><div className="stage">{children(p)}</div></section>;
}
function App(){
 const [enabled,setEnabled]=useState(true),[mounted,setMounted]=useState(true),[orb,setOrb]=useState('working'),[open,setOpen]=useState(false),[effect,setEffect]=useState('morph'),[count,setCount]=useState(0),[preset,setPreset]=useState('pixels-organic'),[fallback,setFallback]=useState(false);
 const canGL=useRef(null);if(canGL.current===null){const c=document.createElement('canvas');canGL.current=!!c.getContext('webgl2')}
 const unavailable=fallback||!canGL.current;
 return <main><header><a href="../../skills/seenry-motion/references/libraries-dev.md">Read the decision guide</a><h1>Motion, with a purpose.</h1><p>A capability lab for five free libraries. Host-authored examples, not a model benchmark or a finished product direction.</p><div className="toolbar"><button id="pause" onClick={()=>setEnabled(!enabled)}>{enabled?'Pause effects':'Resume effects'}</button><button id="mount" onClick={()=>setMounted(!mounted)}>{mounted?'Unmount effects':'Mount effects'}</button><label><input id="fallback" type="checkbox" checked={fallback} onChange={e=>setFallback(e.target.checked)}/> Use static GPU fallback</label></div><p role="status" id="action-result">Example actions: {count}</p></header>
 {mounted&&<div className="grid">
 <Section id="beam" title="Focus a single action" description="Border Beam · a moving boundary can draw attention. It should not turn every control into an alert." enabled={enabled}>{p=><BorderBeam size="line" colorVariant="mono" theme="light" strength={.45} active={p.run} staticColors borderRadius={12}><button className="sample-action" onClick={()=>setCount(x=>x+1)}>Try the action</button></BorderBeam>}</Section>
 <Section id="orbs" title="Make a process recognizable" description="Thinking Orbs · nine visual states. These names are demonstrations; they are not evidence of actual AI activity." enabled={enabled}>{p=><><ThinkingOrb state={orb} size={64} theme="light" paused={!p.run} aria-hidden="true"/><label>Demonstration state<select id="orb-state" value={orb} onChange={e=>setOrb(e.target.value)}>{['working','searching','solving','listening','connecting','weaving','composing','breathing','shaping'].map(s=><option key={s}>{s}</option>)}</select></label></>}</Section>
 <Section id="gooey" title="Reveal related actions" description="Liquid Gooey · the shared silhouette connects a group. Click targets and focus stay distinct." enabled={enabled}>{p=><><label>Surface behavior<select id="gooey-effect" value={effect} onChange={e=>setEffect(e.target.value)}>{['morph','move','bend'].map(s=><option key={s}>{s}</option>)}</select></label><div className="gooey-demo"><Liquid fill="#242521" shadow="none" blur={6} contrast={18} style={{width:220,height:56}}><Liquid.Item effect={p.run?effect:'morph'} transition={p.run?'smooth':{duration:0}} style={{position:'absolute',left:0,top:0,width:56,height:56,borderRadius:28,zIndex:2}}><button aria-label="Related actions" aria-expanded={open} onClick={()=>setOpen(!open)}>More</button></Liquid.Item><Liquid.Item effect={p.run?effect:'morph'} x={open?144:0} transition={p.run?'smooth':{duration:0}} style={{position:'absolute',left:0,top:0,width:56,height:56,borderRadius:28,pointerEvents:open?'auto':'none'}}><button style={{opacity:open?1:0}} disabled={!open} tabIndex={open?0:-1} aria-hidden={!open} onClick={()=>setCount(x=>x+1)}>Save</button></Liquid.Item></Liquid></div></>}</Section>
 <Section id="metal" title="Suggest a material" description="Metal FX · reflection can fit a crafted object or instrument. Ordinary controls still work without WebGL." enabled={enabled}>{p=>(unavailable||p.reduced)?<button className="sample-action" onClick={()=>setCount(x=>x+1)}>Try the material</button>:<MetalFx preset="silver" theme="light" strength={.6} disableGlow innerShadow={false} paused={!p.run} borderRadius={12}><button className="sample-action" onClick={()=>setCount(x=>x+1)}>Try the material</button></MetalFx>}</Section>
 <Section id="image" title="Reveal actual visual material" description="Image FX · a reveal shader over an existing image. It does not generate an image or measure job progress." enabled={enabled}>{p=><><label>Reveal treatment<select id="image-preset" value={preset} onChange={e=>setPreset(e.target.value)}>{['pixels-organic','pixels-mechanic','sweep-gradient'].map(s=><option key={s}>{s}</option>)}</select></label><div className="image-demo">{unavailable||p.reduced?<img src="study.jpg" alt="A flower arrangement from a public-domain artwork"/>:<ImageGeneration key={preset} preset={preset} theme="light" images={['study.jpg']} autoReveal paused={!p.run} revealInitialDelay={200} revealDelayRange={[300,500]} revealHoldMs={1200} revealFadeOutMs={400} borderRadius={12}><img src="study.jpg" alt="A flower arrangement from a public-domain artwork"/></ImageGeneration>}</div><small>Automatic replay is for this demonstration only.</small></>}</Section>
 </div>}<footer><p>Pause, reduced motion and offscreen gating are explicit host policy. GPU fallback is exercised separately. A passing browser check does not establish visual taste, hardware performance or physical mobile behavior.</p><a href="evidence/report.json">Read the verification record</a></footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
