/* Check project-authored measurable decisions. Does not choose a style or score taste. */
async function check(page, contract) {
  if (!contract || !Array.isArray(contract.rules) || contract.rules.length===0) throw new Error('Nonempty project rules required');
  for (const r of contract.rules) {
    if (!r.selector || !['type','fit','stationary-hover','state-change'].includes(r.kind)) throw new Error('Rule requires selector and supported kind');
    if (r.kind==='state-change') {
      if (!r.action?.selector || !['click','press'].includes(r.action.type) || (r.action.type==='press'&&!r.action.key)) throw new Error('State change needs an explicit click or key action');
      if (r.probes!==undefined && (!Array.isArray(r.probes)||r.probes.some(x=>typeof x!=='string'))) throw new Error('Probes must be selectors');
      if (r.boundsAfter!==undefined && (!Array.isArray(r.boundsAfter)||r.boundsAfter.some(x=>!x.selector||!Number.isFinite(x.maxHeight)||x.maxHeight<0))) throw new Error('Invalid after-state bound');
      if (r.waitMs!==undefined && (!Number.isFinite(r.waitMs)||r.waitMs<0||r.waitMs>2000)) throw new Error('State wait must be 0–2000ms');
    }
    if (r.kind==='type' && !['maxSize','maxWeight','maxTrackingEm','case'].some(k=>r[k]!==undefined)) throw new Error('Type rule needs a constraint');
    for (const k of ['maxSize','maxWeight','maxTrackingEm']) if (r[k]!==undefined && (!Number.isFinite(r[k]) || r[k]<0)) throw new Error('Invalid numeric constraint');
    if (r.case!==undefined && !['sentence','any'].includes(r.case)) throw new Error('Invalid case constraint');
  }
  const initialScroll=await page.evaluate(()=>({left:scrollX,top:scrollY}));
  const results=[];
  for (const rule of contract.rules) {
    const count=await page.locator(rule.selector).count();
    if (!count){results.push({selector:rule.selector,kind:rule.kind,status:'missing',findings:['Selector matched nothing']});continue;}
    if(rule.kind==='state-change'){
      const findings=[],values={samples:[],boundsAfter:[]},selectors=[rule.selector,...(rule.probes||[])];
      const handles=[];
      try {
        // Scroll before measuring. Retain references so a visually identical replacement is detectable.
        const action=page.locator(rule.action.selector);
        if(await action.count()!==1)throw new Error('Action must match exactly one element');
        await action.scrollIntoViewIfNeeded();
        for(const selector of selectors){
          const els=await page.locator(selector).elementHandles();
          if(!els.length)findings.push('Probe matched nothing: '+selector);
          for(let i=0;i<els.length;i++)handles.push({selector,index:i,handle:els[i],before:await els[i].boundingBox()});
        }
        if(handles.some(x=>!x.before))findings.push('Enter the visible starting state before measuring');
        if(rule.action.type==='press')await action.press(rule.action.key);else await action.click();
        // Sample the transition and settled result; endpoints alone can miss a jump and return.
        const wait=rule.waitMs??350;
        for(let step=0;step<7;step++){
          if(step)await page.waitForTimeout(wait/6);
          for(const item of handles){
            const matches=page.locator(item.selector),loc=matches.nth(item.index),after=await matches.count()>item.index?await loc.boundingBox():null;
            if(!after||!item.before){findings.push('Required probe is missing or hidden: '+item.selector);continue;}
            const drift=Math.max(...['x','y','width','height'].map(k=>Math.abs(after[k]-item.before[k])));
            values.samples.push({selector:item.selector,index:item.index,step,maxDrift:drift});
            if(drift>.5)findings.push('State change moves/resizes stationary probe: '+item.selector);
          }
        }
        if(rule.preserveNodes)for(const item of handles){
          const same=await item.handle.evaluate((el,{selector,index})=>el.isConnected&&document.querySelectorAll(selector)[index]===el,{selector:item.selector,index:item.index});
          if(!same)findings.push('State change replaced node: '+item.selector);
        }
        if(rule.focusOnAction&&!await action.evaluate(el=>el===document.activeElement))findings.push('Action loses keyboard focus');
        for(const bound of rule.boundsAfter||[]){
          const els=await page.locator(bound.selector).all();
          if(!els.length)findings.push('After-state selector matched nothing: '+bound.selector);
          for(const el of els){const height=await el.evaluate(e=>e.getBoundingClientRect().height);values.boundsAfter.push({selector:bound.selector,height});if(height>bound.maxHeight+.01)findings.push('Closed region retains height: '+bound.selector);}
        }
      }catch(error){findings.push(error.message);}
      finally{await Promise.all(handles.map(x=>x.handle.dispose()));}
      results.push({selector:rule.selector,kind:rule.kind,status:findings.length?'mismatch':'matched',findings:[...new Set(findings)],values});
      continue;
    }
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
        if(before&&after&&['x','y','width','height'].some(k=>Math.abs(before[k]-after[k])>.5)){entries[i].status='mismatch';entries[i].findings.push('Hover moves/resizes the declared stationary target');}
      }
    }
    entries.forEach((entry,index)=>results.push({selector:rule.selector,kind:rule.kind,index,...entry}));
  }
  if(contract.rules.some(r=>r.kind==='stationary-hover')){await page.mouse.move(0,0);await page.evaluate(pos=>scrollTo({...pos,behavior:'instant'}),initialScroll);}
  return {status:results.some(x=>x.status==='mismatch'||x.status==='missing')?'needs-repair':results.some(x=>x.status==='unobserved')?'incomplete':'matched-decisions',results,limit:'Checks measurable project decisions only. Matched decisions do not prove visual quality or accessibility.'};
}
module.exports={check};
