import { useEffect, useRef, useState } from 'react';
import { asset } from '../components/Brand';
import MetallicPaint from './MetallicPaint';

declare global {
  interface Window {
    __metalReady?: boolean;
  }
}

function supported() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/**
 * Globo de NEO en metal líquido (MetallicPaint). Sin WebGL2, o si se pidió menos movimiento,
 * no se dibuja nada: el hero queda sólo con el texto. `onSettled` avisa cuando el globo está
 * listo o ya no se espera (para liberar la entrada del hero).
 */
export default function NeoGlobe({ onSettled }: { onSettled?: () => void }) {
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok = supported();
    setOn(ok);
    if (!ok) settled.current?.();
    // Si el metal tarda demasiado, el hero se libera igual; el globo entra cuando esté listo.
    const timer = window.setTimeout(() => {
      if (!window.__metalReady) settled.current?.();
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="neo-globe" role="img" aria-label="Globo NEO">
      {on && (
        <div className={`neo-globe-metal${ready ? ' is-ready' : ''}`} aria-hidden="true">
          <MetallicPaint
            imageSrc={asset('neo-globo-metal.svg')}
            seed={42}
            scale={3}
            speed={0.25}
            liquid={0.75}
            brightness={1.7}
            contrast={0.55}
            refraction={0.012}
            blur={0.015}
            chromaticSpread={1.5}
            fresnel={1}
            patternSharpness={1}
            waveAmplitude={1}
            noiseScale={0.5}
            distortion={1}
            contour={0.2}
            lightColor="#effff6"
            darkColor="#01140a"
            tintColor="#5fe9a4"
            onReady={() => {
              window.__metalReady = true;
              setReady(true);
              settled.current?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
