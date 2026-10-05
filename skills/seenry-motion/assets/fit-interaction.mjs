// Fit the union of reachable visual states, rather than a single resting screenshot.
export function fitInteraction({states,width,height,padding=20,maxScale=1}) {
 if(!states?.length||![width,height,maxScale].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(padding)||padding<0||width<=padding*2||height<=padding*2)throw new RangeError('Invalid frame dimensions');
 for(const r of states)if(![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0)throw new RangeError('Invalid state bounds');
 const left=Math.min(...states.map(r=>r.x)),top=Math.min(...states.map(r=>r.y));
 const right=Math.max(...states.map(r=>r.x+r.width)),bottom=Math.max(...states.map(r=>r.y+r.height));
 const scale=Math.min(maxScale,(width-padding*2)/(right-left),(height-padding*2)/(bottom-top));
 return {scale,x:(width-(right-left)*scale)/2-left*scale,y:(height-(bottom-top)*scale)/2-top*scale,bounds:{left,top,right,bottom}};
}
