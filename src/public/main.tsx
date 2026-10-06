import { createRoot, hydrateRoot } from 'react-dom/client';
import { Marketing } from './Marketing';
import '../styles/index.css';
const root = document.getElementById('root')!;
const app = <Marketing neo={document.documentElement.dataset.page === 'neo'} />;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
