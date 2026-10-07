# Tigrr Security · Diseño público

Refinamiento de la identidad existente, no reemplazo de marca.

- Fondo oscuro cálido (`#140f16`), naranja Tigrr (`#f2711c`), amarillo de foco (`#f9c22e`) y tigre original. La página NEO conserva su tema verde.
- CTA comercial prioritario; sin acceso al panel interno en la navegación pública.
- Conservar copy y distinción empresa / plataforma / central humana. Nada de cifras, testimonios o capacidades inventadas.
- Ondas WebGL y Matrix sólo como ambiente; limpieza de recursos y reducción de movimiento.
- Glassmorphism tenue en cabecera y superficies comerciales seleccionadas; texto siempre legible.
- Contenido visible por defecto, sin cortina de carga ni secciones ocultas hasta el scroll.
- Páginas `/`, `/soluciones`, `/neo`, `/central-24-7`, `/contacto`, con navegación activa y metadatos prerenderizados.
- Geist Variable autohospedada; cuerpo 14–16px, radios de 10px en controles y 16px en superficies.
- Objetivos táctiles de al menos 44px; inputs de 46px y fuente de 16px en móvil. Safe areas respetadas.
- Labels asociados, campos preservados ante error y confirmación sólo tras entregar el formulario.

Tokens y estilos en `src/styles/index.css`; controles del formulario en `src/components/ui.tsx`. No hay componentes ni estilos de navegación administrativa.
