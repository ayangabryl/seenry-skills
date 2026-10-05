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
uniform float uRimOnly;
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

  if (uRimOnly > 0.5) {
    float angle = atan(center.y, center.x);
    vec2 pointerDirection = (uPointer - 0.5) * 2.0;
    float pointerAngle = atan(pointerDirection.y, pointerDirection.x);
    float angularDistance = atan(sin(angle - pointerAngle), cos(angle - pointerAngle));
    float pointerStrength = smoothstep(0.12, 0.62, length(pointerDirection));
    float attention = exp(-pow(angularDistance / 0.46, 2.0)) * pointerStrength;
    float offsetDistance = atan(sin(angle - pointerAngle - 0.34), cos(angle - pointerAngle - 0.34));
    float colorAccent = exp(-pow(offsetDistance / 0.19, 2.0)) * pointerStrength;
    float edge = distanceToEdge + attention * 0.75;
    float outer = 1.0 - smoothstep(-0.6, 1.4, edge);
    float rim = smoothstep(-5.5, -3.3, edge) * outer;
    float innerLine = exp(-pow((edge + 5.7) / 1.15, 2.0));
    float sweep = angle * 2.4 - uTime * 0.52;
    float glint = pow(max(sin(sweep), 0.0), 20.0);
    float secondGlint = pow(max(sin(angle * 3.1 + uTime * 0.32 + 1.7), 0.0), 34.0);
    float grain = 0.07 * sin(angle * 5.2 + uTime * 0.13)
                + 0.035 * sin(angle * 11.0 - uTime * 0.23);
    float brightness = 0.12 + 0.25 * (0.5 + 0.5 * sin(angle * 1.8 - uTime * 0.24))
                     + grain + 0.58 * glint + 0.28 * secondGlint + 0.45 * attention;
    vec3 silver = mix(uBase, uLight, clamp(brightness, 0.0, 1.0));
    vec3 spectral = vec3(0.18, 0.44, 1.0) * glint + vec3(1.0, 0.28, 0.30) * secondGlint
                  + vec3(0.16, 0.54, 1.0) * attention * 0.52
                  + vec3(1.0, 0.24, 0.32) * colorAccent * 0.42;
    vec3 color = clamp(silver + spectral * 0.60, 0.0, 1.0);
    color = mix(color, uDark, innerLine * 0.72);
    float opacity = clamp(rim + innerLine * 0.42, 0.0, 1.0);
    outColor = vec4(color * opacity, opacity);
    return;
  }

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
  chromatic: { dark: [0.09, 0.11, 0.14], base: [0.42, 0.47, 0.55], light: [0.96, 0.97, 1.00] },
  bronze: { dark: [0.16, 0.10, 0.075], base: [0.50, 0.30, 0.18], light: [1.00, 0.78, 0.48] },
  graphite: { dark: [0.055, 0.065, 0.075], base: [0.21, 0.24, 0.27], light: [0.74, 0.81, 0.86] },
});

function createNeighborReflection(target) {
  const canvas = document.createElement('canvas');
  canvas.className = 'seenry-reflective__neighbor';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  const originalPosition = target.style.position;
  const ownsPosition = getComputedStyle(target).position === 'static';
  if (ownsPosition) target.style.position = 'relative';
  target.append(canvas);
  const context = canvas.getContext('2d');
  return {
    target, canvas,
    draw(source, palette, time) {
      if (!context) return;
      if (!target.contains(canvas)) target.append(canvas);
      const bounds = target.getBoundingClientRect();
      const sourceBounds = source.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      const deltaX = sourceBounds.left + sourceBounds.width / 2 - bounds.left - bounds.width / 2;
      const deltaY = sourceBounds.top + sourceBounds.height / 2 - bounds.top - bounds.height / 2;
      const length = Math.hypot(deltaX, deltaY) || 1;
      const nx = deltaX / length;
      const ny = deltaY / length;
      const extent = Math.max(bounds.width, bounds.height) / 2;
      const cx = bounds.width / 2;
      const cy = bounds.height / 2;
      const gradient = context.createLinearGradient(cx - nx * extent, cy - ny * extent,
        cx + nx * extent, cy + ny * extent);
      const pulse = 0.82 + 0.18 * Math.sin(time * 0.8);
      const warm = palette === 'bronze';
      gradient.addColorStop(0, 'rgba(130,150,165,0.01)');
      gradient.addColorStop(0.68, warm ? 'rgba(180,140,105,0.06)' : 'rgba(130,175,205,0.06)');
      gradient.addColorStop(0.88, warm ? `rgba(240,195,135,${0.21 * pulse})` : `rgba(140,185,225,${0.20 * pulse})`);
      gradient.addColorStop(1, warm ? `rgba(255,235,195,${0.50 * pulse})` : `rgba(235,245,255,${0.48 * pulse})`);
      const radius = radiusInPixels(getComputedStyle(target).borderTopLeftRadius,
        Math.min(bounds.width, bounds.height));
      context.beginPath();
      context.roundRect(1, 1, Math.max(0, bounds.width - 2), Math.max(0, bounds.height - 2), radius);
      context.lineWidth = 1.7;
      context.strokeStyle = gradient;
      context.stroke();
    },
    destroy() {
      canvas.remove();
      if (ownsPosition) target.style.position = originalPosition;
    },
  };
}

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
export function createReflectiveSurface(host, { active = true, palette = 'silver', appearance = 'solid', reflectionTargets = [] } = {}) {
  if (!(host instanceof HTMLElement)) throw new TypeError('Expected a host HTML element');
  if (!Object.hasOwn(palettes, palette)) throw new RangeError('Unknown reflective palette');
  if (!['solid', 'rim'].includes(appearance)) throw new RangeError('Unknown reflective appearance');
  if (!Array.isArray(reflectionTargets) || reflectionTargets.some(target =>
    !(target instanceof HTMLElement) || target === host || target.contains(host) || host.contains(target))) {
    throw new TypeError('Reflection targets must be other HTML elements');
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'seenry-reflective__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  const originalPosition = host.style.position;
  const originalMode = host.getAttribute('data-reflective-mode');
  const originalPalette = host.getAttribute('data-reflective-palette');
  const originalAppearance = host.getAttribute('data-reflective-appearance');
  const ownsPosition = getComputedStyle(host).position === 'static';
  if (ownsPosition) host.style.position = 'relative';
  host.prepend(canvas);
  host.dataset.reflectivePalette = palette;
  host.dataset.reflectiveAppearance = appearance;
  const neighbors = [...new Set(reflectionTargets)].map(createNeighborReflection);

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
      uniforms = Object.fromEntries(['uSize', 'uPointer', 'uTime', 'uRadius', 'uDark', 'uBase', 'uLight', 'uRimOnly']
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
    gl.uniform1f(uniforms.uRimOnly, appearance === 'rim' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    for (const neighbor of neighbors) neighbor.draw(host, selectedPalette, (now - startTime) / 1000);
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
    for (const neighbor of neighbors) neighbor.canvas.style.opacity = requested && gl ? '1' : '0';
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
  for (const neighbor of neighbors) resize?.observe(neighbor.target);
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
      for (const neighbor of neighbors) neighbor.destroy();
      if (ownsPosition) host.style.position = originalPosition;
      if (originalMode === null) host.removeAttribute('data-reflective-mode');
      else host.setAttribute('data-reflective-mode', originalMode);
      if (originalPalette === null) host.removeAttribute('data-reflective-palette');
      else host.setAttribute('data-reflective-palette', originalPalette);
      if (originalAppearance === null) host.removeAttribute('data-reflective-appearance');
      else host.setAttribute('data-reflective-appearance', originalAppearance);
    },
  };
}
