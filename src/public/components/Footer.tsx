export default function Footer({ neo }: { neo: boolean }) {
  return (
    <footer className="public-footer">
      <div className="site-container flex flex-wrap justify-between gap-4">
        <small>
          © {new Date().getFullYear()}{' '}
          {neo
            ? 'NEO Seguridad. Menos ruido. Más control.'
            : 'Tigrr Security. Seguridad que se anticipa.'}
        </small>
      </div>
    </footer>
  );
}
