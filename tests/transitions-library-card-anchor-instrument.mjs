// Exact-source diagnostic injection. It logs only values already read by pinExpandClose.
// No additional geometry/computed-style query runs before the guard decides.
export function instrumentPin(source){
 const start=source.indexOf(' function pinExpandClose('),end=source.indexOf(' // Details hang',start);if(start<0||end<0)throw Error('Pinned Card helper is missing');
 let section=source.slice(start,end);
 const change=(a,b)=>{if(section.split(a).length!==2)throw Error('Pinned diagnostic injection changed: '+a);section=section.replace(a,b);};
 change("  const anchor = q(source, '[data-st-close-anchor]');", "  const diagnostic = window.__anchorDiagnostic ||= {events: [], supports: []};\n  const record = (kind, fields = {}) => diagnostic.events.push({kind, at: globalThis.performance?.now?.() ?? null, ...fields});\n  const supports = (...args) => { const result = CSS.supports(...args); diagnostic.supports.push({args, result}); return result; };\n  const anchor = q(source, '[data-st-close-anchor]');");
 change('if (!control || !anchor) { restoreExpandClosePin(s); return false; }',"if (!control || !anchor) { record('missing', {control: !!control, anchor: !!anchor}); restoreExpandClosePin(s); return false; }");
 // Preserve original short circuit order and number of native support reads.
 section=section.replaceAll("CSS.supports('position-anchor'", "supports('position-anchor'").replaceAll("CSS.supports('top'", "supports('top'").replaceAll("CSS.supports('position-visibility'", "supports('position-visibility'");
 change('if (!supported) { restoreExpandClosePin(s); return false; }',"if (!supported) { record('unsupported'); restoreExpandClosePin(s); return false; }");
 change('if (!target.width || !target.height || !fits(shell) || !fits(origin)) { restoreExpandClosePin(s); return false; }',"if (!target.width || !target.height || !fits(shell) || !fits(origin)) { record('outside', {target, shell, origin}); restoreExpandClosePin(s); return false; }\n  record('fits', {target, shell, origin});");
 change('   const authored = getComputedStyle(anchor).anchorName;',"   const authored = getComputedStyle(anchor).anchorName; record('authored-anchor', {authored});");
 change("  if (getComputedStyle(control).positionVisibility !== 'always' || Math.abs(placed.left - target.left) > .5 || Math.abs(placed.top - target.top) > .5 || Math.abs(placed.width - target.width) > .5 || Math.abs(placed.height - target.height) > .5) { restoreExpandClosePin(s); return false; }", "  const positionVisibility = getComputedStyle(control).positionVisibility;\n  const failed = positionVisibility !== 'always' || Math.abs(placed.left - target.left) > .5 || Math.abs(placed.top - target.top) > .5 || Math.abs(placed.width - target.width) > .5 || Math.abs(placed.height - target.height) > .5;\n  record('placement', {failed, positionVisibility, placed, target, shell, origin, inlineClose: control.style.cssText, inlineAnchor: anchor.style.cssText});\n  if (failed) { restoreExpandClosePin(s); return false; }");
 change("  control.dataset.stClosePinned = 'css'; return true;", "  control.dataset.stClosePinned = 'css'; record('pinned'); return true;");
 return source.slice(0,start)+section+source.slice(end);
}
