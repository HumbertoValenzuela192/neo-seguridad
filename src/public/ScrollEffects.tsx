import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

type Variant = 'up' | 'left' | 'right' | 'zoom' | 'fade';

const STEP = 90;

// Selector → variante. El contenido siempre se renderiza visible; sólo los elementos que
// están bajo el pliegue reciben `data-reveal` una vez hidratada la página, así que sin JS
// (o con movimiento reducido) nada queda oculto.
function plan(root: ParentNode): [Element, Variant, number][] {
  const out: [Element, Variant, number][] = [];
  const add = (
    selector: string,
    variant: Variant | ((i: number, el: Element) => Variant),
    stagger = 0,
  ) =>
    root.querySelectorAll(selector).forEach((el, i) => {
      const v = typeof variant === 'function' ? variant(i, el) : variant;
      out.push([el, v, stagger ? i * stagger : 0]);
    });

  add(
    'main .eyebrow, main .public-section > h2, main .split-section h2, main .section-description',
    'up',
  );
  add('main .tagline, main .public-page-title', 'up');
  add('.layer-card', 'zoom', STEP);
  add('.public-section .grid > .glass-card:not(.layer-card)', (i) => (i % 2 ? 'right' : 'left'));
  add('.split-section > :first-child', (_, el) =>
    el.parentElement?.classList.contains('split-reverse') ? 'right' : 'left',
  );
  add('.split-section > .check-panel', (_, el) =>
    el.parentElement?.classList.contains('split-reverse') ? 'left' : 'right',
  );
  add('.check-panel li', 'fade', 70);
  add('.step', 'up', STEP);
  add('.cta-panel', 'zoom');
  add('.public-section > .button, .public-section > a.button', 'up');
  add('.public-footer .site-container', 'fade');
  return out;
}

export default function ScrollEffects({ page }: { page: string }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onScroll = () => setShowTop(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    let observer: IntersectionObserver | undefined;
    const timers: number[] = [];
    if (motion && 'IntersectionObserver' in window) {
      const seen = new Set<Element>();
      const targets = plan(document).filter(([el]) => {
        if (seen.has(el)) return false;
        seen.add(el);
        // Lo que ya se ve al cargar no se anima: evita parpadeo y respeta el primer pintado.
        return el.getBoundingClientRect().top > window.innerHeight * 0.92;
      });
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            observer?.unobserve(el);
            el.classList.add('is-in');
            // Terminada la animación se devuelve el elemento a sus estilos normales
            // (hover, transiciones propias de las tarjetas, etc.).
            const delay = Number(el.style.getPropertyValue('--rd').replace('ms', '')) || 0;
            timers.push(
              window.setTimeout(() => {
                delete el.dataset.reveal;
                el.classList.remove('is-in');
                el.style.removeProperty('--rd');
              }, 900 + delay),
            );
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      for (const [el, variant, delay] of targets) {
        const node = el as HTMLElement;
        node.dataset.reveal = variant;
        if (delay) node.style.setProperty('--rd', `${delay}ms`);
        observer.observe(node);
      }
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [page]);

  return (
    <button
      type="button"
      className="to-top"
      data-visible={showTop}
      aria-label="Volver arriba"
      tabIndex={showTop ? 0 : -1}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
    >
      <ArrowUp size={22} />
    </button>
  );
}
