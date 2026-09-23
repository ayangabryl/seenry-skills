import ExpressiveMotion from "./ExpressiveMotion";
import FocusSearch from "./FocusSearch";
import React, { useRef, useState } from 'react';
import { Plus, File, Image, Folder, Check, Copy } from 'lucide-react';
import { FluidSurface, FluidItem, useFluidReducedMotion } from '../../skills/seenry-motion/assets/fluid/FluidSurface';
import './fluid-lab.css';
const families = ['Merge', 'Trail', 'Bend', 'Blend', 'Blur'];
const contexts = { Merge: ['Actions', 'Panel', 'Search'], Trail: ['Selection', 'Slider'], Bend: ['Card', 'Pill'], Blend: ['Images'], Blur: ['Numbers', 'Label', 'Detail'] };
const transition = { duration: 550, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' };
const artwork = [
  'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300"><rect width="240" height="300" fill="#bbd5ee"/><circle cx="85" cy="155" r="100" fill="#40556d"/><circle cx="180" cy="100" r="60" fill="#eee9e0"/></svg>'),
  'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300"><rect width="240" height="300" fill="#d9c4aa"/><path d="M0 300L110 20 240 300Z" fill="#74594c"/><circle cx="175" cy="84" r="44" fill="#f4e9d7"/></svg>')
];
export default function FluidLab({initialFamily='Merge', navigation=true}) {
 const [family,F]=useState(initialFamily),[context,C]=useState(contexts[initialFamily][0]),[open,O]=useState(false),[index,I]=useState(0),[amount,A]=useState(50),[light,L]=useState(false),[blur,B]=useState(6),[notice,N]=useState(''),[copied,S]=useState(false);
 const [query,Q]=useState('');
 const trigger=useRef(); const reduced=useFluidReducedMotion();
 const fill=light?'#fff':'#202020';
 function close(){O(false);trigger.current?.focus()}
 const common={fill,blur,contrast:18,shadow:'0 1px 2px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.12)'};
 async function copy(){
 const recipes={
 'Merge:Actions':'Keep 40px buttons; action offsets [-54,-34], [0,-64], [54,-34] from a stationary trigger. Use 550ms cubic-bezier(0.34,1.56,0.64,1), stagger 40ms. Keep closed actions untabbable and non-interactive. Return focus on Escape or selection. This configuration follows the inspected fan; do not claim pixel-perfect fidelity.',
 'Merge:Panel':'Use FluidItem morph={shape:true,contentBlur:7}. A 112px closed surface expands to 224px, with a shared 24px corner token. The application owns disclosure state and focus. Keep trigger and revealed panel on the same fill. Retarget current geometry on interruption.',
 'Merge:Search':'Use a flex search field with stable 52px height. On focus or nonempty query, reveal a 36px close button from width 0, opacity 0, scale .8 to width 36, opacity 1, scale 1 over 220ms cubic-bezier(.22,1,.36,1). Reverse on blur with an empty query. Escape/close clears the query and focuses the stable wrapper. Keep focus while moving between input and close. This is a CSS/Motion geometry adaptation, not a filtered merge.',
 'Trail:Selection':'Use an 80×44px selected pill inside a 240px track. FluidItem effect="move" follows translateX(index*80px), 450ms cubic-bezier(.22,1,.36,1). Keep labels legible while the surface travels and expose selected state.',
 'Trail:Slider':'Use a native keyboard-operable 0–100 range. Move a 40px thumb across 200px; FluidItem effect="move" supplies the trailing surface. The native value updates immediately; never delay authoritative input to follow a spring.',
 'Bend:Card':'Use FluidItem effect="bend" on a 180×90px card with 24px corners; move between [-36,20] and [36,-20] over 550ms cubic-bezier(.22,1,.36,1). Keep content sharp.',
 'Bend:Pill':'Use FluidItem effect="bend" on a 180×48px pill; move between [-36,20] and [36,-20] over 550ms cubic-bezier(.22,1,.36,1). Keep the hit area predictable.',
 'Blend:Images':'Use exactly two 120×150px images with 24px corners in FluidItem effect="melt". Translate x from ±58 to ±28 over 650ms cubic-bezier(.22,1,.36,1). Preserve attribution, alt text and a static reduced-motion fallback.',
 'Blur:Numbers':'Keep three digit slots stable with tabular numerals. Only changed columns transition: directional y ±70%, opacity 0↔1 and blur 6px↔0 in 160ms cubic-bezier(.22,1,.36,1). Bound outgoing layers using wait presence and settle at the latest value after rapid clicks. Announce one current value, not individual animated glyphs.',
 'Blur:Label':'Use a stable text slot. Resolve each new label from y7px, blur7px and opacity0 to its resting state over 360ms cubic-bezier(.22,1,.36,1). Keep a single current semantic label.',
 'Blur:Detail':'Reserve the detail area. Resolve new content from y7px, blur7px and opacity0 over 360ms cubic-bezier(.22,1,.36,1). Keep the navigation control outside the changing content.'};
 const text=`Use Seenry Motion for ${family} / ${context}. Preserve the project DESIGN.md brand, content and real behavior.\n\n${recipes[family+':'+context]}\n\n${family==='Blur'||context==='Search'?'Use the existing motion runtime or CSS. No fluid engine is required for this treatment.':'Install liquid-gooey@0.2.2 (MIT) and the FluidSurface/FluidItem adapter from the Seenry motion skill; preserve LICENSE.upstream. Shared fill: '+fill+'; blur: '+blur+'px; contrast:18. A continuous silhouette needs one shared fill; different-color surfaces need separate layers.'}\n\nVerify initial, active, exit, rapid reversal, keyboard, touch, 390px layout and live reduced motion. State belongs to the application. Do not invent successful backend actions. Source: https://github.com/ayangabryl/seenry-skills/blob/main/site/src/FluidLab.jsx ; adapter: https://github.com/ayangabryl/seenry-skills/tree/main/skills/seenry-motion/assets/fluid`;
 try{await navigator.clipboard.writeText(text);S(true)}catch{N('Clipboard unavailable. Use the linked source to copy the recipe.')}
 }

 return <section id="motion-library" className="fl-lab" aria-label="Reusable surface effects">
 <div className="fl-heading"><div><h3>Fluid surfaces</h3><p>One treatment. Different places to use it.</p></div><button onClick={copy} className="fl-copy">{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy prompt'}</button></div>
 {navigation&&<div className="fl-families" role="group" aria-label="Effect family">{families.map(f=><button key={f} aria-pressed={family===f} onClick={()=>{F(f);C(contexts[f][0]);O(false);I(0);S(false);N('')}}>{f}</button>)}</div>}
 <div className={'fl-stage '+(light?'fl-light':'')} style={{'--fl-fill':fill,'--fl-ink':light?'#202020':'#fff'}} onKeyDown={e=>{if(e.key==='Escape')close()}}>
 {family==='Merge'&&context==='Actions'&&<FluidSurface {...common} className="fl-fan">
 {[File,Image,Folder].map((Icon,i)=><FluidItem key={i} x={open?[-54,0,54][i]:0} y={open?[-34,-64,-34][i]:0} transition={transition} delay={reduced?0:i*40}><button className="fl-round" aria-label={['New file','Add image','New folder'][i]} aria-hidden={!open} tabIndex={open?0:-1} style={{pointerEvents:open?'auto':'none'}} onClick={()=>{N(['File selected','Image selected','Folder selected'][i]+' — demo');close()}}><Icon size={17}/></button></FluidItem>)}
 <FluidItem><button className="fl-round fl-trigger" ref={trigger} aria-label={open?'Close fluid actions':'Open fluid actions'} aria-expanded={open} onClick={()=>O(v=>!v)}><Plus size={22} style={{transform:`rotate(${open?45:0}deg)`,transition:reduced?'none':'transform 220ms'}}/></button></FluidItem>
 </FluidSurface>}
 {family==='Merge'&&context==='Panel'&&<FluidSurface {...common} className="fl-panel-host"><FluidItem morph={{shape:true,contentBlur:7}}><div className={'fl-panel '+(open?'is-open':'')}><button ref={trigger} aria-expanded={open} onClick={()=>O(v=>!v)}>{open?'Close options':'Options'} <Plus size={16}/></button>{open&&<div className="fl-panel-items">{['Save reference','Add to collection','Copy link'].map(t=><button key={t} onClick={()=>{N(t+' selected — demo');close()}}>{t}</button>)}</div>}</div></FluidItem></FluidSurface>}
 {family==='Merge'&&context==='Search'&&<div className="fl-search-demo"><FocusSearch value={query} onChange={Q} label="Try fluid search" placeholder="Search references"/><span role="status">{query?'Searching for “'+query+'” — demo':''}</span></div>}
 {family==='Trail'&&context==='Selection'&&<div className="fl-segments"><FluidSurface {...common} className="fl-indicator"><FluidItem effect="move"><div className="fl-selection" style={{transform:`translateX(${index*80}px)`}}/></FluidItem></FluidSurface>{['Design','Build','Review'].map((t,i)=><button key={t} aria-pressed={index===i} style={{color:'#fff',mixBlendMode:'difference'}} onClick={()=>I(i)}>{t}</button>)}</div>}
 {family==='Trail'&&context==='Slider'&&<div className="fl-slider"><div className="fl-track"/><FluidSurface {...common} className="fl-thumb-host"><FluidItem effect="move"><div className="fl-thumb" style={{transform:`translateX(${amount*2}px)`}}/></FluidItem></FluidSurface><input aria-label="Fluid position" type="range" min="0" max="100" value={amount} onChange={e=>A(+e.target.value)}/></div>}
 {family==='Bend'&&<div className="fl-bend"><FluidSurface {...common}><FluidItem effect="bend"><div className={'fl-bend-body '+(context==='Pill'?'is-pill':'')} style={{transform:`translate(${index?36:-36}px,${index?-20:20}px)`,transition:reduced?'none':'transform 550ms cubic-bezier(.22,1,.36,1)'}}><Folder size={20}/><span>Project notes</span></div></FluidItem></FluidSurface><button className="fl-run" onClick={()=>I(index?0:1)}>Move {context.toLowerCase()} ↗</button></div>}
 {family==='Blend'&&<div className="fl-blend"><FluidSurface {...common}>{artwork.map((src,i)=><FluidItem key={i} effect="melt"><div className="fl-image" style={{transform:`translateX(${i?(open?28:58):(open?-28:-58)}px)`,transition:reduced?'none':'transform 650ms cubic-bezier(.22,1,.36,1)'}}><img src={src} alt={i?'Warm geometric study':'Cool geometric study'}/></div></FluidItem>)}</FluidSurface><button className="fl-run" onClick={()=>O(v=>!v)}>{open?'Separate images':'Bring together'}</button></div>}
 {family==='Blur'&&context==='Numbers'&&<ExpressiveMotion id="blur-digits"/>}
 {family==='Blur'&&context!=='Numbers'&&<div className="fl-blur"><div key={index} className="fl-blur-content">{context==='Label'?<strong>{['Saved','Added to collection','Ready to share'][index%3]}</strong>:<><Folder size={28}/><strong>{index%2?'Project details':'Your projects'}</strong><p>{index%2?'References, notes and decisions.':'Keep your work in one place.'}</p></>}</div><button className="fl-run" onClick={()=>I(index+1)}>Change {context.toLowerCase()} →</button></div>}
 <span className="fl-status" role="status">{notice}</span>
 </div>
 <div className="fl-options"><div role="group" aria-label="Application context">{contexts[family].map(c=><button aria-pressed={context===c} key={c} onClick={()=>{C(c);O(false);I(0);N('');S(false)}}>{c}</button>)}</div>{family!=='Blur'&&family!=='Blend'&&context!=='Search'&&<button aria-pressed={light} onClick={()=>{L(!light);S(false)}}>{light?'White surface':'Dark surface'}</button>}{(family==='Merge'||family==='Trail')&&context!=='Search'&&<label>Join radius <input aria-label="Join radius" type="range" min="3" max="12" value={blur} onChange={e=>{B(+e.target.value);S(false)}}/><span>{blur}</span></label>}</div>
 <p className="fl-note">{family==='Blur'?'Blur resolves changing content while the surrounding layout stays still.':context==='Search'?'Focus reveals a close control. Escape clears and closes without moving the page.':'One shared surface color keeps merging shapes continuous. Text stays sharp.'} <a href="https://github.com/ayangabryl/seenry-skills/tree/main/skills/seenry-motion/assets/fluid">Adapter & license ↗</a></p>
 </section>
}
