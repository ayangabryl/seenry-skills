import React from 'react';
import { MotionConfig } from 'motion/react';
import FluidLab from './FluidLab';
import MotionLibrary from './MotionLibrary';
import './reading-site.css';
import './motion-page.css';
const groups=[['merge','Fluid surfaces','Merge'],['trail','Trailing movement','Trail'],['bend','Flexible surfaces','Bend'],['blend','Image blending','Blend'],['blur','Blur & numbers','Blur'],['patterns','Interface patterns',null]];
export default function MotionPage(){
 const slug=location.pathname.split('/')[2]||'merge';const current=groups.find(g=>g[0]===slug)||groups[0];
 return <MotionConfig reducedMotion="user"><div className="motion-page"><header><a className="motion-wordmark" href="/">seenry.</a><a href="/">All skills ↗</a></header><div className="motion-page-layout"><aside><h1>Motion</h1><nav aria-label="Motion groups">{groups.map(([id,title])=><a key={id} href={'/motion/'+id} aria-current={id===current[0]?'page':undefined}>{title}</a>)}</nav><p>Pick a treatment.<br/>Try it in context.<br/>Copy its prompt.</p></aside><main id="main"><h2>{current[1]}</h2><p className="motion-intro">{current[0]==='patterns'?'Working examples for navigation, controls and feedback.':'Keep the same behavior across different parts of your interface.'}</p>{current[2]?<FluidLab key={current[0]} initialFamily={current[2]} navigation={false}/>:<MotionLibrary/>}</main></div><footer><a href="https://github.com/ayangabryl/seenry-skills">Source & licenses ↗</a><a href="/">Seenry skills</a></footer></div></MotionConfig>;
}
