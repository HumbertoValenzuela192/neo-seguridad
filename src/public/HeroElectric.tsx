import { useEffect, useState } from 'react';
import { asset } from '../components/Brand';
import ElectricLogo, { prepareShape } from './ElectricLogo';

const LOGO = asset('tigrr.png');

function supported() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

// Al evaluarse el módulo (antes de hidratar la página) se carga el logo y se calcula su
// silueta, de modo que el efecto pueda dibujarse en cuanto el hero esté montado.
if (typeof window !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  void prepareShape(LOGO);
}

declare global {
  interface Window {
    __fxStarted?: boolean;
    __heroGo?: boolean;
    __heroManaged?: boolean;
  }
}
const root = () => document.documentElement;

// Libera la portada: todos los elementos del hero arrancan su animación a la vez.
function release() {
  if (window.__heroGo) return;
  window.__heroGo = true;
  root().classList.add('hero-go');
  window.setTimeout(() => root().classList.add('hero-done'), 1600);
}
const started = () => {
  window.__fxStarted = true;
  release();
};
const fallback = () => {
  root().classList.add('fx-off');
  release();
};

export default function HeroElectric() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    window.__heroManaged = true;
    const ok = supported();
    setOn(ok);
    // Sin efecto posible (o si no arranca a tiempo) se muestra el logo estático.
    if (!ok) fallback();
    const timer = window.setTimeout(() => {
      if (!window.__fxStarted) fallback();
    }, 2200);
    return () => clearTimeout(timer);
  }, []);
  if (!on) return null;
  return (
    <div className="electric-layer">
      <ElectricLogo
        src={LOGO}
        color="#ffe2bf"
        glowColor="#ff7a1a"
        scale={0.753}
        strands={3}
        thickness={1.6}
        bend={0.5}
        crackle={1.2}
        arcs={1}
        flicker={0.5}
        glow={0.9}
        fill={0.35}
        speed={1.6}
        intro={0.05}
        cursorRadius={110}
        interactive
        onRender={started}
      />
    </div>
  );
}
