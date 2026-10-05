import { useEffect, useRef } from 'react';
import { createSignalField } from './signal-field.mjs';

// Decorative only. Keep the accessible process status in nearby DOM text.
export function SignalField({ state = 'idle', color, className, style }) {
  const canvas = useRef(null);
  const controller = useRef(null);

  useEffect(() => {
    controller.current = createSignalField(canvas.current, { state, color });
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    controller.current?.update(state, color ? { color } : {});
  }, [state, color]);

  return <canvas ref={canvas} className={className} style={style} aria-hidden="true" />;
}
