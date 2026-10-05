import React,{useState} from 'react';
import {ArrowRight,ArrowDown,Copy,Check,RotateCcw} from 'lucide-react';
import './skill-hero.css';
const install='npx skills add ayangabryl/seenry-skills';
const modes=['Type','Layout','Motion'];
export default function SkillHero(){
 const [mode,M]=useState('Type'),[copied,C]=useState(false),[failed,F]=useState(false),[replay,R]=useState(0);
 async function copy(){try{await navigator.clipboard.writeText(install);C(true);F(false)}catch{F(true)}}
 return <section className="skill-hero" aria-labelledby="skill-hero-title">
  <div className="skill-hero-intro"><h1 id="skill-hero-title">Design skills for your coding agent.</h1><a className="r-primary" href="#install-guide">Get the skills <ArrowRight size={17}/></a></div>
  <div className={'skill-composition mode-'+mode.toLowerCase()} aria-label="Interactive Seenry lettering">
   <div className="skill-lettering" aria-hidden="true" key={replay}>{[...'seenry'].map((letter,i)=><span className={'skill-letter letter-'+i} key={i} style={{'--i':i}}><span>{letter}</span></span>)}</div>
   <div className="skill-composition-controls"><div role="group" aria-label="Change the composition">{modes.map(m=><button key={m} aria-pressed={mode===m} onClick={()=>M(m)}>{m}</button>)}</div><button className="skill-replay" onClick={()=>{M('Motion');R(v=>v+1)}} aria-label="Replay letter motion"><RotateCcw size={16}/></button></div>
   <p className="skill-composition-hint" aria-live="polite">{mode==='Type'?'One word. A few different personalities.':mode==='Layout'?'Same letters. A different balance.':'A little anticipation. A softer landing.'}</p>
  </div>
  <div className="skill-hero-bottom"><p>Give your agent an eye for type, layout and movement.<br/>Then make something that feels like you.</p><button className="skill-hero-install" onClick={copy}><code>{install}</code>{copied?<Check size={15}/>:<Copy size={15}/>}</button></div>
  <span className="skill-hero-note" role="status">{failed?'Copy this command: '+install:copied?'Copied. Paste it into your terminal.':''}</span>
  <nav className="skill-hero-index" aria-label="Explore the five skills">{[['Design','seenry'],['Motion','seenry-motion'],['Assets','seenry-assets'],['Branding','seenry-branding'],['Decks','seenry-decks']].map(([name,id])=><a href={'#'+id} key={id}>{name}<ArrowDown size={14}/></a>)}</nav>
 </section>
}
