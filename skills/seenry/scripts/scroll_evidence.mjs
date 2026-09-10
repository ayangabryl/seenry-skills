// Observe the real document's vertical sequence without changing product styles.
// Call through the host's existing Playwright page; capture receives a step record.
export async function collectScrollEvidence(page, {capture=async()=>{}, maxSteps=24, settleMs=250, stepFraction=.75}={}) {
  if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>60)throw new Error('maxSteps must be 1–60');
  if(!Number.isFinite(settleMs)||settleMs<0||settleMs>2000)throw new Error('settleMs must be 0–2000');
  if(!Number.isFinite(stepFraction)||stepFraction<=0||stepFraction>1)throw new Error('stepFraction must be greater than 0 and at most 1');
  const read=()=>page.evaluate(()=>({x:scrollX,y:scrollY,height:innerHeight,bottom:Math.max(0,document.documentElement.scrollHeight-innerHeight)}));
  const origin=await read(), steps=[];
  let reachedBottom=false;
  try {
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    for(let index=0;index<maxSteps;index++) {
      await page.waitForTimeout(settleMs);
      const position=await read();
      const step={index,...position};steps.push(step);await capture(step);
      if(position.y>=position.bottom-1){reachedBottom=true;break;}
      if(index===maxSteps-1)break;
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),Math.min(position.bottom,position.y+Math.max(1,position.height*stepFraction)));
    }
  } finally {
    await page.evaluate(({x,y})=>scrollTo({left:x,top:y,behavior:'instant'}),origin);
    await page.waitForTimeout(settleMs);
  }
  return {steps,reachedBottom,origin,returned:await read(),
    limitations:['Bounded document scrolling only; nested scrollers, tabs, dialogs and drag states need explicit scenarios.',
      'Short settling waits do not prove assets or motion finished. Inspect the screenshots and recording.',
      'Scroll-triggered state is retained; original position is restored without resetting product state.']};
}
