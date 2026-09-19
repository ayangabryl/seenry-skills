/* Read rendered geometry; findings are review candidates, never a visual-quality score.
   Host calls inspect(page) after entering EACH consequential state. No browser dependency. */
async function inspect(page) {
  return page.evaluate(() => {
    const visible = el => { const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'; };
    const controls=[...document.querySelectorAll('button,[role="button"]')].filter(visible).map(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect(),size=parseFloat(s.fontSize);
      const icons=[...el.querySelectorAll('svg,img')].filter(visible).map(icon=>{const box=icon.getBoundingClientRect();return {width:box.width,height:box.height,oversized:box.height>size*1.75||box.width>size*2};});
      const lines=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()&&visible(n.parentElement)&&!n.parentElement.closest('svg,[aria-hidden="true"]')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
      while(walker.nextNode()){const range=document.createRange();range.selectNodeContents(walker.currentNode);for(const rect of range.getClientRects())if(rect.width>0&&!lines.some(y=>Math.abs(y-rect.top)<3))lines.push(rect.top);}
      return {label:el.innerText.trim()||el.getAttribute('aria-label')||'',width:r.width,height:r.height,fontSize:size,fontWeight:s.fontWeight,letterSpacing:s.letterSpacing,textLines:lines.length,icons,review:lines.length>1||icons.some(i=>i.oversized)};
    });
    const typography=[...document.querySelectorAll('h1,h2,h3,label,dt')].filter(visible).map(el=>{const s=getComputedStyle(el);return{text:el.textContent.trim(),family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,tracking:s.letterSpacing,case:s.textTransform};});
    return {viewport:{width:innerWidth,height:innerHeight},horizontalOverflow:document.documentElement.scrollWidth>innerWidth,controls,typography,limit:'Flags require contextual review; multiline controls and large icon-only controls can be intentional. This does not assess aesthetics, accessible names or font-file availability.'};
  });
}
module.exports={inspect};
