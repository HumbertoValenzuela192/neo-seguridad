import { Link } from 'react-router';
import { Download, ExternalLink } from 'lucide-react';
import { Modal, Notice } from '../../components/ui';
import { siteURL } from '../../lib/routes';
import { useStore } from '../store';

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { session, recoveryPending } = useStore();
  return (
    <Modal title="Configuración" onClose={onClose}>
      <p className="mb-5 text-sm text-muted">
        {session?.name} · Administra los respaldos de este navegador.
      </p>
      {recoveryPending && (
        <Notice>
          Existe una copia local pendiente de recuperar. Respáldala antes de continuar.
        </Notice>
      )}
      <div className="space-y-3">
        <Link
          to="/recuperacion"
          className="button button-secondary w-full justify-start"
          onClick={onClose}
        >
          <Download size={18} />
          Respaldo y recuperación
        </Link>
        <a href={siteURL('/')} className="button button-ghost w-full justify-start">
          <ExternalLink size={18} />
          Volver a Tigrr Security
        </a>
      </div>
    </Modal>
  );
}
