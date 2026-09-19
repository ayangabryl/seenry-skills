/* Check project-authored measurable decisions. Does not choose a style or score taste. */
async function check(page, contract) {
  if (!contract || !Array.isArray(contract.rules) || contract.rules.length===0) throw new Error('Nonempty project rules required');
  for (const r of contract.rules) {
    if (!r.selector || !['type','fit','stationary-hover'].includes(r.kind)) throw new Error('Rule requires selector and supported kind');
    if (r.kind==='type' && !['maxSize','maxWeight','maxTrackingEm','case'].some(k=>r[k]!==undefined)) throw new Error('Type rule needs a constraint');
    for (const k of ['maxSize','maxWeight','maxTrackingEm']) if (r[k]!==undefined && (!Number.isFinite(r[k]) || r[k]<0)) throw new Error('Invalid numeric constraint');
    if (r.case!==undefined && !['sentence','any'].includes(r.case)) throw new Error('Invalid case constraint');
  }
  const initialScroll=await page.evaluate(()=>({left:scrollX,top:scrollY}));
  const results=[];
  for (const rule of contract.rules) {
    const count=await page.locator(rule.selector).count();
    if (!count){results.push({selector:rule.selector,kind:rule.kind,status:'missing',findings:['Selector matched nothing']});continue;}
    const entries=await page.locator(rule.selector).evaluateAll((els,rule)=>els.map(el=>{
      const s=getComputedStyle(el),b=el.getBoundingClientRect();
      const visible=b.width>0&&b.height>0&&s.visibility!=='hidden';
      if(!visible)return {status:'unobserved',findings:['Enter the state where this element is visible']};
      const findings=[];const values={};
      if(rule.kind==='type'){
        values.size=parseFloat(s.fontSize);values.weight=parseFloat(s.fontWeight);values.trackingEm=s.letterSpacing==='normal'?0:parseFloat(s.letterSpacing)/values.size;values.text=el.innerText.trim();values.transform=s.textTransform;
        if(rule.maxSize!==undefined&&values.size>rule.maxSize+.1)findings.push('Size exceeds project decision');
        if(rule.maxWeight!==undefined&&values.weight>rule.maxWeight)findings.push('Weight exceeds project decision');
        if(rule.maxTrackingEm!==undefined&&Math.abs(values.trackingEm)>rule.maxTrackingEm+.001)findings.push('Tracking exceeds project decision');
        if(rule.case==='sentence'&&(s.textTransform==='uppercase'||(/^[^a-z]*[A-Z][^a-z]*$/.test(values.text)&&values.text.replace(/[^A-Z]/g,'').length>3)))findings.push('Uppercase treatment conflicts with project decision; inspect legitimate acronyms');
      }
      if(rule.kind==='fit'){
        const boxes=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()&&!n.parentElement.closest('svg,[aria-hidden="true"]')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
        while(walker.nextNode()){const n=walker.currentNode,style=getComputedStyle(n.parentElement);if(style.display==='none'||style.visibility==='hidden')continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width&&r.height)boxes.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom,text:n.textContent.trim()});}
        values.textFragments=boxes.length;values.escaped=boxes.filter(r=>r.left<b.left-1||r.right>b.right+1).map(r=>r.text);
        if(values.escaped.length)findings.push('Text escapes the horizontal bounds of its declared group');
        values.collisions=[];
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],c=boxes[j];if(Math.min(a.right,c.right)-Math.max(a.left,c.left)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>1)values.collisions.push([a.text,c.text]);}
        if(values.collisions.length)findings.push('Text fragments overlap inside group');
        if(rule.singleLine&&new Set(boxes.map(r=>Math.round(r.top/3))).size>1)findings.push('Action label is not on one line');
      }
      return {status:findings.length?'mismatch':'matched',findings,values};
    }),rule);
    if(rule.kind==='stationary-hover'){
      for(let i=0;i<count;i++){
        if(entries[i].status==='unobserved')continue;
        const el=page.locator(rule.selector).nth(i);await el.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(250);const before=await el.boundingBox();await el.hover();await page.waitForTimeout(350);const after=await el.boundingBox();
        if(before&&after&&(Math.abs(before.x-after.x)>.5||Math.abs(before.y-after.y)>.5)){entries[i].status='mismatch';entries[i].findings.push('Hover moves the declared stationary target');}
      }
    }
    entries.forEach((entry,index)=>results.push({selector:rule.selector,kind:rule.kind,index,...entry}));
  }
  if(contract.rules.some(r=>r.kind==='stationary-hover')){await page.mouse.move(0,0);await page.evaluate(pos=>scrollTo({...pos,behavior:'instant'}),initialScroll);}
  return {status:results.some(x=>x.status==='mismatch'||x.status==='missing')?'needs-repair':results.some(x=>x.status==='unobserved')?'incomplete':'matched-decisions',results,limit:'Checks measurable project decisions only. Matched decisions do not prove visual quality or accessibility.'};
}
module.exports={check};
