// Original authored fit to observed source bounds, not the creator's implementation.
export const leftSamples=[
[0,407,347,74,74,37],[.05,405,323,78,78,39],[.15,383,242,122,132,58],[.25,360,162,168,187,79],[.35,337,96,215,244,78],[.45,326,75,237,262,62],[.55,316,63,257,270,45],[.65,313,61,263,270,36],[.75,309,62,271,268,31],[.85,308,65,272,266,30],[1,309,67,271,264,30]];
export const rightSamples=[
[0,622,353,132,62,31],[.12,628,370,144,85,40],[.25,633,394,174,115,55],[.4,635,417,225,176,59],[.55,631,426,249,193,46],[.68,626,431,265,196,34],[.8,622,431,271,194,30],[1,623,430,267,190,30]];
export function sample(frames,phase){
 const p=Math.max(0,Math.min(1,phase));let i=1;while(i<frames.length-1&&frames[i][0]<p)i++;
 const a=frames[i-1],b=frames[i],t=(p-a[0])/(b[0]-a[0]);return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t);
}
export function interpolate(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}

export const leftCloseSamples=[[0,309,67,271,264,30],[.1667,314,81,261,254,29],[.3333,354,238,181,150,44],[.5,366,273,157,138,64],[.6667,391,337,106,91,46],[.8333,401,345,86,78,40],[1,407,347,74,74,37]];
