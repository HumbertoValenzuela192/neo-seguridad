import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/index.css';
document.body.classList.add('theme-neo');
createRoot(document.getElementById('root')!).render(<App />);
