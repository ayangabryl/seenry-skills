const vertexSource = `#version 300 es
void main() {
  vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(point * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uTime;
uniform float uRadius;
uniform vec3 uDark;
uniform vec3 uBase;
uniform vec3 uLight;
out vec4 outColor;

float roundedBox(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 uv = pixel / uSize;
  vec2 center = pixel - uSize * 0.5;
  float distanceToEdge = roundedBox(center, uSize * 0.5, uRadius);
  float edgeSoftness = max(fwidth(distanceToEdge), 1.0);
  float shape = 1.0 - smoothstep(-edgeSoftness, edgeSoftness, distanceToEdge);

  float slowSweep = 0.43 + 0.16 * sin(uTime * 0.36);
  float bentX = uv.x - 0.035 * exp(-pow((uv.y - uPointer.y) * 3.0, 2.0)) * (uPointer.x - 0.5);
  float broadReflection = exp(-pow((bentX - slowSweep) / 0.19, 2.0));
  float fineReflection = exp(-pow((bentX - slowSweep - 0.105) / 0.023, 2.0));
  float pointerGlow = exp(-dot((uv - uPointer) * vec2(uSize.x / uSize.y, 1.0) * 3.4,
                              (uv - uPointer) * vec2(uSize.x / uSize.y, 1.0) * 3.4));
  float brush = sin(pixel.y * 1.8 + 0.35 * sin(pixel.x * 0.045)) * 0.022;
  float vertical = clamp(0.62 - uv.y * 0.43 + brush, 0.0, 1.0);

  vec3 material = mix(uDark, uBase, vertical);
  material += uLight * (0.27 * broadReflection + 0.26 * fineReflection + 0.13 * pointerGlow);
  float rim = exp(-pow((distanceToEdge + 2.1) / 1.8, 2.0));
  float travelling = 0.50 + 0.50 * sin(atan(center.y, center.x) * 1.6 - uTime * 0.55);
  material += uLight * rim * (0.21 + 0.48 * travelling);
  material -= uDark * exp(-pow((distanceToEdge + 8.5) / 8.0, 2.0)) * 0.2;
  outColor = vec4(clamp(material, 0.0, 1.0), shape);
}`;

const palettes = Object.freeze({
  silver: { dark: [0.10, 0.15, 0.18], base: [0.38, 0.47, 0.49], light: [0.90, 0.96, 0.88] },
  bronze: { dark: [0.16, 0.10, 0.075], base: [0.50, 0.30, 0.18], light: [1.00, 0.78, 0.48] },
  graphite: { dark: [0.055, 0.065, 0.075], base: [0.21, 0.24, 0.27], light: [0.74, 0.81, 0.86] },
});

function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(result);
    gl.deleteShader(result);
    throw new Error(`Reflective surface shader failed: ${detail}`);
  }
  return result;
}

function createProgram(gl) {
  const vertex = shader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Reflective surface program failed: ${detail}`);
  }
  return program;
}

function radiusInPixels(value, dimension) {
  const first = String(value).split(/\s+/)[0];
  const number = Number.parseFloat(first);
  if (!Number.isFinite(number)) return 0;
  return Math.min(first.endsWith('%') ? number * dimension / 100 : number, dimension / 2);
}

/** Decorative shader behind an existing semantic control. Application state stays in the DOM. */
export function createReflectiveSurface(host, { active = true, palette = 'silver' } = {}) {
  if (!(host instanceof HTMLElement)) throw new TypeError('Expected a host HTML element');
  if (!Object.hasOwn(palettes, palette)) throw new RangeError('Unknown reflective palette');

  const canvas = document.createElement('canvas');
  canvas.className = 'seenry-reflective__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  const originalPosition = host.style.position;
  const originalMode = host.getAttribute('data-reflective-mode');
  const originalPalette = host.getAttribute('data-reflective-palette');
  const ownsPosition = getComputedStyle(host).position === 'static';
  if (ownsPosition) host.style.position = 'relative';
  host.prepend(canvas);
  host.dataset.reflectivePalette = palette;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let requested = Boolean(active);
  let selectedPalette = palette;
  let visible = true;
  let destroyed = false;
  let frame = 0;
  let gl = null;
  let program = null;
  let uniforms = null;
  let pointer = [0.5, 0.5];
  let startTime = performance.now();

  function disposeGraphics() {
    if (program && gl) gl.deleteProgram(program);
    program = null;
    uniforms = null;
  }

  function setupGraphics() {
    disposeGraphics();
    try {
      gl = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return false;
      program = createProgram(gl);
      uniforms = Object.fromEntries(['uSize', 'uPointer', 'uTime', 'uRadius', 'uDark', 'uBase', 'uLight']
        .map(name => [name, gl.getUniformLocation(program, name)]));
      return true;
    } catch {
      disposeGraphics();
      gl = null;
      return false;
    }
  }

  function measure() {
    const bounds = host.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function draw(now = performance.now()) {
    if (destroyed || !gl || !program || !uniforms) return;
    measure();
    const width = canvas.width;
    const height = canvas.height;
    const bounds = host.getBoundingClientRect();
    const ratio = width / Math.max(bounds.width, 1);
    const radius = radiusInPixels(getComputedStyle(host).borderTopLeftRadius,
      Math.min(bounds.width, bounds.height)) * ratio;
    const colors = palettes[selectedPalette];
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform2f(uniforms.uSize, width, height);
    gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]);
    gl.uniform1f(uniforms.uTime, reduceMotion?.matches ? 0 : (now - startTime) / 1000);
    gl.uniform1f(uniforms.uRadius, radius);
    gl.uniform3fv(uniforms.uDark, colors.dark);
    gl.uniform3fv(uniforms.uBase, colors.base);
    gl.uniform3fv(uniforms.uLight, colors.light);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now) {
    frame = 0;
    if (host.dataset.reflectiveMode !== 'running') return;
    draw(now);
    frame = requestAnimationFrame(tick);
  }

  function setMode() {
    if (destroyed) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    host.dataset.reflectiveMode = !gl ? 'fallback' : !requested ? 'idle' : reduceMotion?.matches ? 'static' : !visible || document.hidden ? 'paused' : 'running';
    if (host.dataset.reflectiveMode === 'running') frame = requestAnimationFrame(tick);
    else if (host.dataset.reflectiveMode === 'static' || host.dataset.reflectiveMode === 'paused') draw(startTime);
  }

  function move(event) {
    if (reduceMotion?.matches) return;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointer = [Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
               Math.max(0, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height))];
    if (host.dataset.reflectiveMode === 'static') draw(startTime);
  }

  function leave() { pointer = [0.5, 0.5]; if (host.dataset.reflectiveMode === 'static') draw(startTime); }
  function onResize() { draw(startTime); }
  function lost(event) { event.preventDefault(); disposeGraphics(); gl = null; setMode(); }
  function restored() { if (setupGraphics()) setMode(); }
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { measure(); if (host.dataset.reflectiveMode !== 'running') draw(startTime); });
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    setMode();
  });

  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  document.addEventListener('visibilitychange', setMode);
  reduceMotion?.addEventListener?.('change', setMode);
  resize?.observe(host);
  intersection?.observe(host);
  if (!resize) window.addEventListener('resize', onResize);
  setupGraphics();
  setMode();

  return {
    get mode() { return host.dataset.reflectiveMode; },
    setActive(value) { requested = Boolean(value); setMode(); },
    setPalette(value) {
      if (!Object.hasOwn(palettes, value)) throw new RangeError('Unknown reflective palette');
      selectedPalette = value;
      host.dataset.reflectivePalette = value;
      if (host.dataset.reflectiveMode !== 'running') draw(startTime);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      resize?.disconnect();
      intersection?.disconnect();
      if (!resize) window.removeEventListener('resize', onResize);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      document.removeEventListener('visibilitychange', setMode);
      reduceMotion?.removeEventListener?.('change', setMode);
      disposeGraphics();
      canvas.remove();
      if (ownsPosition) host.style.position = originalPosition;
      if (originalMode === null) host.removeAttribute('data-reflective-mode');
      else host.setAttribute('data-reflective-mode', originalMode);
      if (originalPalette === null) host.removeAttribute('data-reflective-palette');
      else host.setAttribute('data-reflective-palette', originalPalette);
    },
  };
}
