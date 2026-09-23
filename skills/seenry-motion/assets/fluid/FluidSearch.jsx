import React, { useId, useRef, useState } from 'react';
import { useFluidReducedMotion } from './FluidSurface';
import './fluid-search.css';

// Original Seenry search disclosure. Filter only the silhouette, never content.
export default function FluidSearch({value,onChange,label='Search',placeholder='Search…'}) {
 const [focused,setFocused]=useState(false), host=useRef(null);
 const reduced=useFluidReducedMotion(), id='search-'+useId().replace(/:/g,'');
 const open=focused||Boolean(value);
 function close(){onChange('');setFocused(false);host.current.focus()}
 return <div ref={host} tabIndex={-1} className={'seenry-fluid-search'+(open?' is-open':'')} data-reduced={reduced} onFocusCapture={e=>{if(e.target!==host.current)setFocused(true)}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close()}}}>
 <svg aria-hidden="true" className="sfs-defs"><defs><filter id={id} x="-20%" y="-100%" width="140%" height="300%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="5"/><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -8.5"/></filter></defs></svg>
 <div className="sfs-shapes" aria-hidden="true" style={{filter:reduced?'none':`url(#${id})`}}><div className="sfs-pill"/><div className="sfs-circle"/></div>
 <label className="sfs-field"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input aria-label={label} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></label>
 <button className="sfs-close" type="button" aria-label="Close search" aria-hidden={!open} tabIndex={open?0:-1} onClick={close}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
 </div>
}
