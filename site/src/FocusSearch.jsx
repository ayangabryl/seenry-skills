import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, X } from 'lucide-react';
import './focus-search.css';
export default function FocusSearch({value,onChange,label='Search motion examples',placeholder='Find a transition…'}) {
 const [active,A]=useState(false); const input=useRef(); const host=useRef(); const reduced=useReducedMotion();
 function close(){onChange('');A(false);host.current.focus()}
 return <div className="focus-search" ref={host} tabIndex={-1} onFocusCapture={e=>{if(e.target!==host.current)A(true)}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))A(false)}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close()}}}>
 <Search size={18} aria-hidden="true"/><input ref={input} aria-label={label} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>
 <AnimatePresence initial={false}>{(active||value)&&<motion.button type="button" aria-label="Close search" initial={{width:0,opacity:0,scale:.8}} animate={{width:36,opacity:1,scale:1}} exit={{width:0,opacity:0,scale:.8}} transition={{duration:reduced?0:.22,ease:[.22,1,.36,1]}} onClick={close}><X size={16}/></motion.button>}</AnimatePresence>
 </div>
}
