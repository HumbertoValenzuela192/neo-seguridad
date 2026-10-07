import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Search, Trash2 } from 'lucide-react';
import { AddButton, Button, Field, MoveButtons, Notice } from './ui';
import { errorMessage } from '../lib/api';
import type { Address, Contact, Installation } from '../types';

export function ContactsEditor({
  title,
  value,
  onChange,
  ordered = false,
}: {
  title: string;
  value: Contact[];
  onChange: (value: Contact[]) => void;
  ordered?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-4 text-base">{title}</h3>
      <div className="space-y-4">
        {value.map((contact, i) => (
          <div key={i} className="rounded-xl border border-line p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">
                {ordered ? `Orden de llamado ${i + 1}` : `Persona ${i + 1}`}
              </span>
              <MoveButtons
                index={i}
                length={value.length}
                onMove={(direction) => {
                  const next = value.slice();
                  [next[i], next[i + direction]] = [next[i + direction], next[i]];
                  onChange(next);
                }}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['name', 'Nombre'],
                  ['cargo', 'Cargo'],
                  ['phone', 'Teléfono'],
                  ['email', 'Correo'],
                ] as const
              ).map(([key, label]) => (
                <Field label={label} key={key}>
                  <input
                    type={key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'}
                    value={contact[key] || ''}
                    onChange={(e) =>
                      onChange(value.map((c, j) => (j === i ? { ...c, [key]: e.target.value } : c)))
                    }
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>
      <AddButton
        onClick={() => onChange([...value, { name: '', phone: '', cargo: '', email: '' }])}
      >
        Agregar {title.toLowerCase().includes('guardia') ? 'guardia' : 'contacto'}
      </AddButton>
    </section>
  );
}
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}
function LocationMap({ value, onChange }: { value: Address; onChange: (value: Address) => void }) {
  const ref = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    marker = useRef<Marker | null>(null),
    change = useRef(onChange),
    current = useRef(value);
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<SearchResult[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  change.current = onChange;
  current.current = value;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void import('leaflet')
      .then((L) => {
        if (!active) return;
        const icon = L.icon({
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          shadowSize: [41, 41],
        });
        const m = L.map(ref.current!).setView(
          [current.current.lat ?? -33.4489, current.current.lng ?? -70.6693],
          current.current.lat != null ? 16 : 11,
        );
        map.current = m;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(m);
        const pin = L.marker([current.current.lat ?? -33.4489, current.current.lng ?? -70.6693], {
          draggable: true,
          icon,
        }).addTo(m);
        marker.current = pin;
        const set = (lat: number, lng: number) => {
          pin.setLatLng([lat, lng]);
          change.current({ ...current.current, lat, lng });
        };
        m.on('click', (e) => set(e.latlng.lat, e.latlng.lng));
        pin.on('dragend', () => {
          const p = pin.getLatLng();
          set(p.lat, p.lng);
        });
        const observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(ref.current!);
        m.on('unload', () => observer.disconnect());
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
      controller.abort();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (value.lat != null && value.lng != null) {
      marker.current?.setLatLng([value.lat, value.lng]);
      map.current?.setView([value.lat, value.lng], 16);
    }
  }, [value.lat, value.lng]);
  async function search() {
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
      );
      if (!response.ok)
        throw new Error('No se pudo buscar la dirección. Puedes marcar el punto en el mapa.');
      const list: SearchResult[] = await response.json();
      setResults(list);
      if (!list.length) setError('No se encontraron direcciones. Prueba con comuna y ciudad.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <Field label="Buscar dirección" className="flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void search();
              }
            }}
          />
        </Field>
        <Button
          aria-label="Buscar dirección en el mapa"
          variant="secondary"
          disabled={busy}
          onClick={() => void search()}
        >
          <Search size={18} />
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="min-h-11 w-full p-3 text-left text-sm hover:bg-raised"
                onClick={() => {
                  onChange({ address: r.display_name, lat: Number(r.lat), lng: Number(r.lon) });
                  setResults([]);
                }}
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <Notice error>{error}</Notice>}
      <div
        ref={ref}
        className="leaflet-map"
        role="region"
        aria-label="Mapa de ubicación de la instalación"
      />
      <p className="text-xs text-muted">
        Selecciona un resultado, toca el mapa o arrastra el marcador. También puedes ingresar las
        coordenadas.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitud">
          <input
            type="number"
            min="-90"
            max="90"
            step="any"
            value={value.lat ?? ''}
            onChange={(e) =>
              onChange({ ...value, lat: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Longitud">
          <input
            type="number"
            min="-180"
            max="180"
            step="any"
            value={value.lng ?? ''}
            onChange={(e) =>
              onChange({ ...value, lng: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </Field>
      </div>
    </div>
  );
}
export function InstallationFields({
  value,
  onChange,
  readOnlyLocation = false,
  section = 'all',
}: {
  value: Installation;
  onChange: (value: Installation) => void;
  readOnlyLocation?: boolean;
  section?: 'all' | 'general' | 'location' | 'contacts' | 'guards';
}) {
  const [active, setActive] = useState(0);
  const addresses = value.addresses.length
    ? value.addresses
    : [{ address: '', lat: null, lng: null }];
  const updateAddress = (index: number, address: Address) =>
    onChange({ ...value, addresses: addresses.map((a, i) => (i === index ? address : a)) });
  return (
    <>
      {(section === 'all' || section === 'general') && (
        <Field label="Nombre de la instalación">
          <input
            value={value.name}
            required
            readOnly={readOnlyLocation}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </Field>
      )}
      {(section === 'all' || section === 'location') && (
        <section className="space-y-4">
          <h3 className="text-base">Direcciones de ingreso</h3>
          {addresses.map((address, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field label={`Dirección ${i + 1}`} className="flex-1">
                <input
                  readOnly={readOnlyLocation}
                  value={address.address}
                  onChange={(e) =>
                    updateAddress(i, { address: e.target.value, lat: null, lng: null })
                  }
                />
              </Field>
              {!readOnlyLocation && (
                <>
                  <Button
                    variant="secondary"
                    aria-label={`Ubicar dirección ${i + 1}`}
                    onClick={() => setActive(i)}
                  >
                    <MapPin size={17} />
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={addresses.length === 1}
                    aria-label={`Quitar dirección ${i + 1}`}
                    onClick={() => {
                      onChange({ ...value, addresses: addresses.filter((_, j) => j !== i) });
                      setActive(0);
                    }}
                  >
                    <Trash2 size={17} />
                  </Button>
                </>
              )}
            </div>
          ))}
          {!readOnlyLocation && (
            <>
              <AddButton
                onClick={() => {
                  onChange({
                    ...value,
                    addresses: [...addresses, { address: '', lat: null, lng: null }],
                  });
                  setActive(addresses.length);
                }}
              >
                Agregar dirección
              </AddButton>
              <p className="text-sm text-muted">
                Ubicación de la dirección {Math.min(active, addresses.length - 1) + 1}
              </p>
              <LocationMap
                value={addresses[Math.min(active, addresses.length - 1)]}
                onChange={(address) =>
                  updateAddress(Math.min(active, addresses.length - 1), address)
                }
              />
            </>
          )}
        </section>
      )}
      {(section === 'all' || section === 'guards') && (
        <Field label="¿Contiene guardia?">
          <select
            value={value.hasGuard}
            onChange={(e) => onChange({ ...value, hasGuard: e.target.value })}
          >
            <option value="">Selecciona una opción</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </Field>
      )}
      {(section === 'all' || section === 'contacts') && (
        <ContactsEditor
          title="Orden de llamado en caso de intrusión"
          value={value.callOrder}
          ordered
          onChange={(callOrder) => onChange({ ...value, callOrder })}
        />
      )}
      {(section === 'all' || section === 'guards') && value.hasGuard === 'si' && (
        <>
          <ContactsEditor
            title="Guardias de la instalación"
            value={value.guards}
            onChange={(guards) => onChange({ ...value, guards })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del supervisor">
              <input
                value={value.supervisorName}
                onChange={(e) => onChange({ ...value, supervisorName: e.target.value })}
              />
            </Field>
            <Field label="Teléfono del supervisor">
              <input
                type="tel"
                value={value.supervisorPhone}
                onChange={(e) => onChange({ ...value, supervisorPhone: e.target.value })}
              />
            </Field>
            <Field label="Cargo del supervisor">
              <input
                value={value.supervisorCargo || 'Supervisor'}
                onChange={(e) => onChange({ ...value, supervisorCargo: e.target.value })}
              />
            </Field>
            <Field label="Correo del supervisor">
              <input
                type="email"
                value={value.supervisorEmail || ''}
                onChange={(e) => onChange({ ...value, supervisorEmail: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}
    </>
  );
}
