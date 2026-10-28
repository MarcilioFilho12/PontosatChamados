import { useEffect, useRef } from 'react'

const VERT = `#version 300 es
precision mediump float;
uniform vec2 u_resolution;
out vec2 fragCoord;
void main() {
  vec2 position = vec2(
    gl_VertexID == 1 ? 3.0 : -1.0,
    gl_VertexID == 2 ? 3.0 : -1.0
  );
  gl_Position = vec4(position, 0.0, 1.0);
  fragCoord = (position + 1.0) * 0.5 * u_resolution;
  fragCoord.y = u_resolution.y - fragCoord.y;
}
`

const FRAG = `#version 300 es
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform int u_reverse;
in vec2 fragCoord;
out vec4 fragColor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

void main() {
  vec2 st = fragCoord.xy;
  st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
  st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

  float opacity = step(0.0, st.x) * step(0.0, st.y);
  vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

  vec3 color = u_colors[int(show_offset * 6.0)];
  float animation_speed_factor = 3.0;
  vec2 center_grid = u_resolution / 2.0 / u_total_size;
  float dist_from_center = distance(center_grid, st2);
  float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
  opacity *= step(timing_offset_intro, u_time * animation_speed_factor);
  opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

  fragColor = vec4(color, opacity);
  fragColor.rgb *= fragColor.a;
}
`

export function LoginDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false })
    if (!gl) return
    const surface = canvas
    const context = gl

    const program = createProgram(context, VERT, FRAG)
    if (!program) return
    context.useProgram(program)
    context.enable(context.BLEND)
    context.blendFunc(context.SRC_ALPHA, context.ONE)

    const time = context.getUniformLocation(program, 'u_time')
    const resolution = context.getUniformLocation(program, 'u_resolution')
    context.uniform1fv(context.getUniformLocation(program, 'u_opacities'), [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1])
    context.uniform3fv(
      context.getUniformLocation(program, 'u_colors'),
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    )
    context.uniform1f(context.getUniformLocation(program, 'u_total_size'), 20)
    context.uniform1f(context.getUniformLocation(program, 'u_dot_size'), 6)
    context.uniform1i(context.getUniformLocation(program, 'u_reverse'), 0)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now()
    let frame = 0

    function resize() {
      const width = host?.clientWidth ?? 0
      const height = host?.clientHeight ?? 0
      if (!width || !height) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      surface.width = Math.floor(width * ratio)
      surface.height = Math.floor(height * ratio)
      context.viewport(0, 0, surface.width, surface.height)
      context.uniform2f(resolution, width * 2, height * 2)
    }

    function draw(now: number) {
      context.clearColor(0, 0, 0, 0)
      context.clear(context.COLOR_BUFFER_BIT)
      context.uniform1f(time, reduced ? 4 : (now - started) / 1000)
      context.drawArrays(context.TRIANGLES, 0, 3)
      if (!reduced) frame = window.requestAnimationFrame(draw)
    }

    resize()
    draw(started)
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      context.deleteProgram(program)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()
  const vs = compile(gl, gl.VERTEX_SHADER, vertex)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment)
  if (!program || !vs || !fs) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  return program
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

