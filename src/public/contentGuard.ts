import { useEffect } from 'react';

const FIELD = 'input, textarea, select, [contenteditable="true"]';

const inField = (target: EventTarget | null) =>
  target instanceof Element && target.closest(FIELD) !== null;

/**
 * Evita seleccionar, copiar, arrastrar y abrir el menú contextual sobre el contenido del
 * sitio. Los campos del formulario quedan intactos para poder escribir y pegar datos.
 * Es una barrera de uso, no de seguridad: el código fuente y las capturas siguen disponibles.
 */
export function useContentGuard() {
  useEffect(() => {
    const block = (event: Event) => {
      if (inField(event.target) || inField(document.activeElement)) return;
      event.preventDefault();
    };
    const events = ['copy', 'cut', 'selectstart', 'dragstart', 'contextmenu'] as const;
    for (const name of events) document.addEventListener(name, block);
    return () => {
      for (const name of events) document.removeEventListener(name, block);
    };
  }, []);
}
