import React,{useState} from 'react';
import {ArrowRight,ArrowDown,Plus,Minus,Copy,Check} from 'lucide-react';
import './skill-hero.css';
const install='npx skills add ayangabryl/seenry-skills';
export default function SkillHero(){
 const [close,setClose]=useState(false),[copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(install);setCopied(true);setFailed(false)}catch{setFailed(true)}}
 return <section className="skill-hero" aria-labelledby="skill-hero-title">
  <div className="skill-hero-copy">
   <h1 id="skill-hero-title">A designer’s eye.<br/><span>In your agent.</span></h1>
   <p>Open-source skills for the way things look, move and feel. Give your agent a design process worth following.</p>
   <div className="skill-hero-actions"><a className="r-primary" href="#install-guide">Get the skills <ArrowRight size={18}/></a><a href="#seenry">See what’s possible <ArrowDown size={17}/></a></div>
   <div className="skill-hero-install" id="install"><code>{install}</code><button onClick={copy} aria-label={copied?'Install command copied':'Copy install command'}>{copied?<Check size={16}/>:<Copy size={16}/>}</button></div>
   <span className="skill-hero-note" role="status">{failed?'Select the command above to copy.':copied?'Copied. Paste it into your terminal.':'Five skills. Yours to build with.'}</span>
  </div>
  <figure className="skill-hero-art">
   <button className={'skill-art-stage'+(close?' is-close':'')} onClick={()=>setClose(v=>!v)} aria-label={close?'Return to full typography study':'Inspect typography study'} aria-pressed={close}>
    <img src="/artwork/type-study-v1.webp" srcSet="/artwork/type-study-v1-small.webp 800w, /artwork/type-study-v1.webp 1536w" sizes="(max-width:700px) 100vw, 660px" width="1536" height="1024" fetchPriority="high" alt="Charcoal and white sculpted letterforms with translucent tracing paper"/>
    <span className="skill-art-inspect" aria-hidden="true">{close?<Minus size={19}/>:<Plus size={19}/>}</span>
   </button>
   <figcaption><span>Typography, with dimension.</span><span>{close?'Click to step back':'Click for a closer look'}</span></figcaption>
  </figure>
  <nav className="skill-hero-index" aria-label="Explore the five skills">{[['Design','seenry'],['Motion','seenry-motion'],['Assets','seenry-assets'],['Branding','seenry-branding'],['Decks','seenry-decks']].map(([name,id])=><a href={'#'+id} key={id}>{name}<ArrowDown size={14}/></a>)}</nav>
 </section>
}
