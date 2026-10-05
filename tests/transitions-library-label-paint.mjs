// Only persistent album title/count ink is assessed here. Details have intentional
// clipping/reveal and are deliberately outside this assertion. Range rectangles
// are geometric evidence; retain real frames for final visible-ink review.
export function glyphIntersections(title, meta, tolerance = .25) {
 const edges = r => ({left:r.left ?? r.x, top:r.top ?? r.y,
  right:r.right ?? (r.x + r.width), bottom:r.bottom ?? (r.y + r.height)});
 const hits=[];
 for(const [titleLine,a0] of title.entries())for(const [metaLine,b0] of meta.entries()){
  const a=edges(a0),b=edges(b0),left=Math.max(a.left,b.left),top=Math.max(a.top,b.top),
   right=Math.min(a.right,b.right),bottom=Math.min(a.bottom,b.bottom);
  if(right-left>tolerance&&bottom-top>tolerance)hits.push({titleLine,metaLine,left,top,right,bottom,width:right-left,height:bottom-top});
 }
 return hits;
}
export function labelPaintFindings(row, expected) {
 if(row.open!=='true'&&row.closing!=='true')return [];
 const titles=[row.title,...(row.ghosts||[])].filter(n=>n?.painted),
  metas=[row.meta,...(row.metaGhosts||[])].filter(n=>n?.painted),findings=[];
 for(const [kind,nodes,text] of [['title',titles,expected.title],['meta',metas,expected.meta]]){
  if(nodes.length!==1)findings.push({kind:`${kind}-paint-count`,actual:nodes.length});
  for(const node of nodes){
   if(node.text!==text)findings.push({kind:`${kind}-identity`,actual:node.text,expected:text});
   if(!node.glyphs?.some(r=>r.width>0&&r.height>0))findings.push({kind:`${kind}-no-positive-glyphs`});
  }
 }
 for(const title of titles)for(const meta of metas)for(const intersection of glyphIntersections(title.glyphs||[],meta.glyphs||[]))findings.push({kind:'title-meta-glyph-intersection',...intersection});
 return findings;
}
