import ContactForm from '../components/ContactForm';
import { Breadcrumb } from '../components/Sections';

export default function ContactPage() {
  return (
    <main id="main" className="site-container">
      <Breadcrumb label="Contacto" />
      <section className="public-section grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="public-page-title">Cuéntanos qué necesitas proteger.</h1>
          <p className="mt-6 text-muted">
            Analizamos tu operación y te ayudamos a definir la solución adecuada para tus riesgos,
            infraestructura y necesidades.
          </p>
          <p className="mt-6 text-sm text-muted">
            Selecciona la solución y completa los datos de tu operación para solicitar una
            evaluación.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
