import { useEffect, useRef } from 'react';

// The original threads shader, owned by React so GPU resources and listeners are released.
const vertex = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision mediump float;
uniform float time;uniform vec2 resolution;uniform vec3 color;uniform vec2 mouse;
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);vec4 h=fract(sin(vec4(dot(i,vec2(127.1,311.7)),dot(i+vec2(1,0),vec2(127.1,311.7)),dot(i+vec2(0,1),vec2(127.1,311.7)),dot(i+vec2(1,1),vec2(127.1,311.7))))*43758.5453);return mix(mix(h.x,h.y,f.x),mix(h.z,h.w,f.x),f.y)*2.-1.;}
void main(){vec2 uv=gl_FragCoord.xy/resolution;float strength=1.;for(int i=0;i<40;i++){float p=float(i)/40.;float amplitude=smoothstep(.1+p*.4,.7,uv.x)*.5;float t=time/10.+(mouse.x-.5);float n=mix(noise(vec2(t,uv.x+p)*2.5),noise(vec2(t,uv.x+t)*3.5)/1.5,uv.x*.3);float y=.5+(p-.5)*.05+n/2.*amplitude;float width=7./max(resolution.x,resolution.y)*(1.-p);float blur=10./max(resolution.x,resolution.y)*smoothstep(.1+p*.4,.15+p*.4,uv.x)*p;float line=1.-smoothstep(width,width+blur+.001,abs(uv.y-y));strength*=1.-line*(1.-pow(p,.3));}float v=1.-strength;gl_FragColor=vec4(color*v,v);}`;
export function Waves() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas'),
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    if (!gl) return;
    function shader(type: number, source: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }
    const vs = shader(gl.VERTEX_SHADER, vertex),
      fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, 'time'),
      uResolution = gl.getUniformLocation(program, 'resolution'),
      uMouse = gl.getUniformLocation(program, 'mouse');
    const rgb = getComputedStyle(host)
      .getPropertyValue('--accent-rgb')
      .split(',')
      .map((v) => Number(v) / 255);
    gl.uniform3f(gl.getUniformLocation(program, 'color'), rgb[0], rgb[1], rgb[2]);
    gl.uniform2f(uMouse, 0.5, 0.5);
    host.append(canvas);
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 1.5),
        ratio = Math.min(1, 1920 / (host.clientWidth * dpr));
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr * ratio));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    let visible = true,
      frame = 0,
      last = 0,
      elapsed = 0;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(host);
    const move = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      gl.uniform2f(
        uMouse,
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      );
    };
    window.addEventListener('mousemove', move);
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (t - last < 1000 / 30) return;
      const delta = Math.min((t - last) / 1000, 0.1);
      last = t;
      if (!visible || document.hidden) return;
      elapsed += delta;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener('mousemove', move);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.remove();
    };
  }, []);
  return <div ref={ref} className="wave-canvas" aria-hidden="true" />;
}
export function Matrix() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!,
      parent = canvas.parentElement!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0,
      last = 0;
    let drops: number[] = [];
    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drops = Array.from({ length: Math.ceil(canvas.width / 14) }, () => -Math.random() * 20);
    };
    resize();
    const color = getComputedStyle(parent).getPropertyValue('--accent');
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || t - last < 70) return;
      last = t;
      ctx.fillStyle = '#11151430';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px monospace';
      ctx.fillStyle = color;
      drops.forEach((y, i) => {
        ctx.fillText('01NEOTIGRR'.charAt(Math.floor(Math.random() * 10)), i * 14, y * 14);
        drops[i] = y * 14 > canvas.height ? 0 : y + 0.35;
      });
    };
    const start = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      },
      stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };
    parent.addEventListener('mouseenter', start);
    parent.addEventListener('mouseleave', stop);
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => {
      stop();
      observer.disconnect();
      parent.removeEventListener('mouseenter', start);
      parent.removeEventListener('mouseleave', stop);
    };
  }, []);
  return <canvas ref={ref} className="matrix-canvas" aria-hidden="true" />;
}
