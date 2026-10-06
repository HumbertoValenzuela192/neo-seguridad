import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Form, Field, Notice, text } from '../../components/ui';
import { request } from '../../lib/api';
import { nowLabel, validRut } from '../../lib/domain';

export default function ContactForm() {
  const [solution, setSolution] = useState(''),
    [sent, setSent] = useState(false);
  return (
    <div className="panel">
      {sent ? (
        <div className="space-y-5">
          <ShieldCheck size={36} className="text-accent" />
          <h3 className="text-xl">Gracias por contactarnos.</h3>
          <Notice>Nos comunicaremos con usted en las próximas 48 horas hábiles.</Notice>
          <button className="button button-secondary" onClick={() => setSent(false)}>
            Enviar otra solicitud
          </button>
        </div>
      ) : (
        <Form
          label="Solicitar evaluación"
          onSave={async (form) => {
            if (!validRut(text(form, 'rut')))
              throw new Error('RUT inválido. Revisa el dígito verificador.');
            const values = Object.fromEntries(new FormData(form).entries());
            await request('/leads', 'POST', {
              ...values,
              id: crypto.randomUUID(),
              date: nowLabel(),
              status: 'nuevo',
            });
            setSent(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Empresa">
              <input name="company" autoComplete="organization" required />
            </Field>
            <Field label="RUT">
              <input name="rut" placeholder="12.345.678-5" required />
            </Field>
            <Field label="Nombre del contacto">
              <input name="manager" autoComplete="name" required />
            </Field>
            <Field label="Correo corporativo">
              <input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Teléfono">
              <input name="phone" type="tel" autoComplete="tel" required />
            </Field>
            <Field label="Cantidad de cámaras">
              <input name="cameras" type="number" min="1" step="1" required />
            </Field>
          </div>
          <Field label="Solución">
            <select
              name="solution"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              required
            >
              <option value="">Selecciona una opción</option>
              <option>NEO</option>
              <option>Monitoreo 24/7</option>
              <option>Ambos</option>
            </select>
          </Field>
          {solution === 'NEO' && (
            <Field label="Cantidad de operadores">
              <input name="operators" type="number" min="1" step="1" required />
            </Field>
          )}
        </Form>
      )}
    </div>
  );
}
