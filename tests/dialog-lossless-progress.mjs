// Self-contained page-side helper; serialize with .toString() and install in the test namespace.
// ownedJobs are actual Animation objects captured AFTER the production open/close call.
// This function never seeks, pauses, cancels, finishes, alters styles or synthesizes input.
export function atNaturalOwnedTransformProgress(surface, ownedJobs, action, {
 label, expected='entry', snapshot, maxWaitMs=500, maxFrames=40
}={}) {
 if(!surface||!Array.isArray(ownedJobs)||typeof action!=='function'||typeof snapshot!=='function')throw Error('Surface, owned Animation references, action and snapshot required');
 if(!['entry','exit'].includes(expected)||!Number.isFinite(maxWaitMs)||maxWaitMs<=0||maxWaitMs>1000||!Number.isInteger(maxFrames)||maxFrames<1||maxFrames>120)throw Error('Invalid bounded progress options');
 const startedAt=performance.now();let frames=0,raf,timer,done=false;
 const exitScale=value=>{
  if(typeof value!=='string')return false;const m=/^(scale|matrix)\(([^()]*)\)$/.exec(value.trim());if(!m)return false;
  const tokens=m[2].split(',').map(s=>s.trim()),numeric=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  if(tokens.some(s=>!numeric.test(s)))return false;const a=tokens.map(Number),near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
  return m[1]==='scale'?(a.length===1||a.length===2)&&a.every(n=>near(n,.97)):a.length===6&&a.every((n,i)=>near(n,[.97,0,0,.97,0,0][i]));
 };
 const sample=()=>{
  const live=surface.getAnimations({subtree:false});
  return ownedJobs.map(a=>{const e=a.effect,t=e?.getComputedTiming(),keys=e?.getKeyframes()||[],properties=[...new Set(keys.flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))];
   const observation={live:live.includes(a),surfaceTarget:e?.target===surface,pseudo:e?.pseudoElement||null,pending:a.pending,playState:a.playState,currentTime:a.currentTime,duration:t?.duration,endTime:t?.endTime,progress:t?.progress,endTransform:keys.at(-1)?.transform||null,properties};
   observation.qualifies=observation.live&&observation.surfaceTarget&&observation.pseudo===null&&properties.includes('transform')&&a.playState==='running'&&a.pending===false&&Number.isFinite(a.currentTime)&&a.currentTime>0&&Number.isFinite(t?.duration)&&t.duration>0&&Number.isFinite(t?.endTime)&&a.currentTime<t.endTime&&Number.isFinite(t?.progress)&&t.progress>0&&t.progress<1&&(expected==='exit'?exitScale(observation.endTransform):observation.endTransform==='none');return observation;
  });
 };
 const stateFits=()=>surface.open===true&&surface.matches(':modal')&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&(expected==='entry'?surface.inert===false:surface.inert===true);
 return new Promise(resolve=>{
  const finish=value=>{if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);resolve({label,mode:'unpaused-positive-progress-gated-API',expected,startedAt,endedAt:performance.now(),framesWaited:frames,...value});};
  timer=setTimeout(()=>{try{finish({status:'blocked',acted:false,reason:'deadline',lastOwnedJobs:sample()});}catch(e){finish({status:'observer-error',acted:false,error:e.stack||String(e)});}},maxWaitMs);
  const tick=()=>{
   if(done)return;frames++;
   try{
   let jobs=sample();
   if(stateFits()&&jobs.some(j=>j.qualifies)){
    // The snapshot can force layout. Recheck real jobs immediately after it, then act synchronously.
    const before=snapshot();jobs=sample();const beforeActionAt=performance.now();
    if(stateFits()&&jobs.some(j=>j.qualifies)&&beforeActionAt-startedAt<maxWaitMs){
     try{action();const afterActionAt=performance.now(),after=snapshot();finish({status:'observed',acted:true,beforeActionAt,afterActionAt,actualElapsedMs:beforeActionAt-startedAt,qualifiedOwnedJobs:jobs,before,after});}
     catch(e){finish({status:'action-error',acted:true,error:e.stack||String(e),beforeActionAt,qualifiedOwnedJobs:jobs,before});}return;
    }
   }
   if(frames>=maxFrames||performance.now()-startedAt>=maxWaitMs)finish({status:'blocked',acted:false,reason:'observation-budget',lastOwnedJobs:jobs});
   else if(!ownedJobs.length||jobs.every(j=>!j.live||['finished','idle'].includes(j.playState)))finish({status:'blocked',acted:false,reason:'owned-window-ended-or-absent',lastOwnedJobs:jobs});
   else raf=requestAnimationFrame(tick);
   }catch(e){finish({status:'observer-error',acted:false,error:e.stack||String(e)});}
  };
  raf=requestAnimationFrame(tick);
 });
}
