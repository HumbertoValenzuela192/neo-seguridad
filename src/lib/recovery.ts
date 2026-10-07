import type { Session } from '../types';
import { request } from './api';
export interface BrowserBackup {
  origin: string;
  exportedAt: string;
  values: Record<string, string>;
  archivedBrowserCopy?: BrowserBackup;
}
const ARCHIVE = 'neo_local_recovery_20261006',
  UPLOADED = 'neo_recovery_uploaded_20261006';
export function hasPendingRecovery(backup: BrowserBackup | null) {
  return (
    !!backup && !localStorage.getItem(UPLOADED) && !sessionStorage.getItem('neo_recovery_archived')
  );
}
export function browserBackup(storage: Storage, origin: string): BrowserBackup {
  const values: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith('neo_') && key !== 'neo_admin_session') values[key] = storage.getItem(key)!;
  }
  const payload: BrowserBackup = { origin, exportedAt: new Date().toISOString(), values };
  if (values[ARCHIVE]) {
    try {
      payload.archivedBrowserCopy = JSON.parse(values[ARCHIVE]);
    } catch {
      /* Keep the raw value in the export. */
    }
  }
  return payload;
}
export function preserveBrowserData(): BrowserBackup | null {
  const archived = localStorage.getItem(ARCHIVE);
  if (archived) return JSON.parse(archived) as BrowserBackup;
  if (
    !localStorage.getItem('neo_cuentas_cliente') ||
    sessionStorage.getItem('neo_recovery_archived')
  )
    return null;
  const payload = browserBackup(localStorage, location.origin);
  // If storage is full, retain the in-memory backup until the server confirms archival.
  try {
    localStorage.setItem(ARCHIVE, JSON.stringify(payload));
  } catch {
    /* recoverBeforeLoad uploads the same payload. */
  }
  return payload;
}
export async function recoverBeforeLoad(session: Session, backup: BrowserBackup | null) {
  if (!session.sections.includes('usuarios') || !session.sections.includes('cuentas')) return;
  if (
    backup &&
    !localStorage.getItem(UPLOADED) &&
    !sessionStorage.getItem('neo_recovery_archived')
  ) {
    const result = await request<{ archive_id: string }>('/recovery', 'POST', backup);
    sessionStorage.setItem('neo_recovery_archived', result.archive_id);
    try {
      localStorage.setItem(UPLOADED, result.archive_id);
    } catch {
      /* Server already archived it. */
    }
  }
  if (!sessionStorage.getItem('neo_directory_imported')) {
    await request('/directory/import', 'POST', {});
    sessionStorage.setItem('neo_directory_imported', '1');
  }
}
