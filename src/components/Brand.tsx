export const asset = (file: string) => (import.meta.env?.BASE_URL || '/') + file;
export function Brand({ neo = false }: { neo?: boolean }) {
  return (
    <a href="./index.html" className="brand">
      <img src={asset(neo ? 'neo-globo-icon.png' : 'tigrr.png')} alt="" width="34" height="34" />
      <span>
        <strong>{neo ? 'NEO' : 'Tigrr'}</strong> {neo ? 'Seguridad' : 'Security'}
      </span>
    </a>
  );
}
