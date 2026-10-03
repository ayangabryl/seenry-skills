// Assess captured instant Card paint, including text leaves and every paint ancestor.
export function cardReadableFindings(row){
 const out=[],sharp=s=>s==='none'||(/^blur\(0(?:\.0+)?px\)$/.test(s)),inside=(g,r)=>g.left>=r.left-.25&&g.top>=r.top-.25&&g.right<=r.right+.25&&g.bottom<=r.bottom+.25;
 const check=(node,label,expected)=>{
  if(!node){out.push({kind:'missing-leaf',label});return;}
  if(node.painted!==true||node.visibility!=='visible'||node.display==='none'||node.effectiveDisplay!==true||!Number.isFinite(node.opacity)||node.opacity<.99||!Number.isFinite(node.colorAlpha)||node.colorAlpha<.99||!node.text||!node.glyphs?.some(g=>g.width>0&&g.height>0))out.push({kind:'unpainted-leaf',label});
  if(expected&&node.text!==expected)out.push({kind:'wrong-text',label,expected,actual:node.text});
  if(typeof node.filter!=='string'||!Array.isArray(node.ancestorFilters)||!sharp(node.filter)||node.ancestorFilters?.some(n=>!sharp(n.filter)))out.push({kind:'blurred-leaf',label});
  if(node.clipPath!=='none'||!Array.isArray(node.paintAncestors)||node.paintAncestors?.some(n=>n.clipPath!=='none'))out.push({kind:'clipped-leaf',label});
  const clipped=new Set(['hidden','clip','auto','scroll','overlay']);
  for(const ancestor of [node,...(node.paintAncestors||[])]){
   const values=(ancestor.overflow||'visible').split(/\s+/),x=ancestor.overflowX||values[0],y=ancestor.overflowY||values[1]||values[0],clipX=clipped.has(x),clipY=clipped.has(y);
   if(!clipX&&!clipY)continue;
   const rect=ancestor.clipRect||ancestor.rect;
   if(!rect||!['left','top','right','bottom'].every(k=>Number.isFinite(rect[k]))){out.push({kind:'missing-overflow-bounds',label});continue;}
   for(const glyph of node.glyphs||[])if((clipX&&(glyph.left<rect.left-.25||glyph.right>rect.right+.25))||(clipY&&(glyph.top<rect.top-.25||glyph.bottom>rect.bottom+.25)))out.push({kind:'overflow-clipped-leaf',label,clipX,clipY});
  }
  for(const g of node.glyphs||[])if(row.shell&&!inside(g,row.shell))out.push({kind:'leaf-outside-shell',label});
 };
 check(row.keyboardText?.cue,'preview cue','3-track preview');
 const tracks=row.keyboardText?.tracks||[];if(tracks.length!==3)out.push({kind:'track-count',actual:tracks.length});
 tracks.forEach((t,i)=>{check(t.name,`track${i+1} name`);check(t.duration,`track${i+1} duration`);});
 return out;
}
