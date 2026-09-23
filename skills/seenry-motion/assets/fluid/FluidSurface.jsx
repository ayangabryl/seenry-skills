import React, { useEffect, useState } from 'react';
import { Liquid } from 'liquid-gooey';

// Adapter for liquid-gooey 0.2.2 (MIT). Preserve LICENSE.upstream when copying.
// The application owns visibility, focus, actions and state; this owns rendering.
export function useFluidReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
const MotionContext = React.createContext(false);
export function FluidSurface({ children, fill = '#202020', blur = 6, contrast = 18, ...props }) {
  const reduced = useFluidReducedMotion();
  return <MotionContext.Provider value={reduced}>{reduced
    ? <div {...props} style={{ position: 'relative', ...props.style, '--fluid-fill': fill }}>{children}</div>
    : <Liquid {...props} fill={fill} blur={blur} contrast={contrast}>{children}</Liquid>}
  </MotionContext.Provider>;
}
export function FluidItem({ children, x = 0, y = 0, scale = 1, effect = 'morph', ...props }) {
  const reduced = React.useContext(MotionContext);
  if (reduced) return <div style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}>{children}</div>;
  return <Liquid.Item {...props} effect={effect} x={x} y={y} scale={scale}>{children}</Liquid.Item>;
}
