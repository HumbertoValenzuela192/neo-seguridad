import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Field, Form, Notice, PageHeading, Panel } from '../components/ui';
import { browserBackup } from '../lib/recovery';
import { request } from '../lib/api';

export default function Recovery() {
  const [message, setMessage] = useState('');
  const [snapshot] = useState(() => {
    try {
      return browserBackup(localStorage, location.origin);
    } catch {
      return null;
    }
  });
  return (
    <>
      <PageHeading
        title="Respaldo de este navegador"
        description="Exporta la copia local antes de recuperar datos. Las fichas del servidor no se sobrescriben."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Exportar copia local">
          <p className="mb-5 text-sm text-muted">
            {snapshot
              ? `Este navegador conserva ${Object.keys(snapshot.values).length} conjuntos de datos. La descarga incluye el respaldo anterior, si existe.`
              : 'No se pudo acceder al almacenamiento de este navegador.'}
          </p>
          <Button
            disabled={!snapshot}
            onClick={() => {
              if (!snapshot) return;
              const payload = { ...snapshot, exportedAt: new Date().toISOString() },
                url = URL.createObjectURL(
                  new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
                );
              const a = document.createElement('a');
              a.href = url;
              a.download = `portal-browser-backup-${location.hostname}-${Date.now()}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download size={17} />
            Descargar respaldo
          </Button>
        </Panel>
        <Panel title="Recuperar copia en el servidor">
          <p className="mb-5 text-sm text-muted">
            Requiere una sesión de administrador con acceso a usuarios y cuentas. Los registros
            existentes se conservan.
          </p>
          <Form
            label="Archivar y recuperar"
            onSave={async (form) => {
              const file = new FormData(form).get('backup');
              if (!(file instanceof File) || !file.size)
                throw new Error('Selecciona un archivo de respaldo.');
              if (file.size > 2 * 1024 * 1024) throw new Error('El archivo supera 2 MiB.');
              const payload = JSON.parse(await file.text());
              if (
                !payload ||
                typeof payload !== 'object' ||
                (!payload.values && !payload.archivedBrowserCopy)
              )
                throw new Error('El archivo no contiene un respaldo de este portal.');
              const result = await request<{ archive_id: string; message: string }>(
                '/recovery',
                'POST',
                payload,
              );
              sessionStorage.setItem('neo_recovery_archived', result.archive_id);
              setMessage(result.message);
            }}
          >
            <Field label="Archivo JSON">
              <input name="backup" type="file" accept="application/json,.json" required />
            </Field>
          </Form>
          {message && <Notice>{message}</Notice>}
        </Panel>
      </div>
    </>
  );
}
