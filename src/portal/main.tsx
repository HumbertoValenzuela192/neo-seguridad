import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/index.css';
import { legacyPortalPath, siteURL } from '../lib/routes';
const legacy = legacyPortalPath(location.hash);
if (legacy !== null) {
  const destination = new URL(siteURL('/admin') + legacy, location.origin);
  new URLSearchParams(location.search).forEach((value, key) => {
    if (!destination.searchParams.has(key)) destination.searchParams.set(key, value);
  });
  history.replaceState(null, '', destination.pathname + destination.search);
}
document.body.classList.add('theme-neo');
createRoot(document.getElementById('root')!).render(<App />);
