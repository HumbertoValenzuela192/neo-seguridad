import type { PublicPage } from '../lib/routes';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SolutionsPage from './pages/SolutionsPage';
import NeoPage from './pages/NeoPage';
import CentralPage from './pages/CentralPage';
import ContactPage from './pages/ContactPage';

const pages = {
  home: HomePage,
  solutions: SolutionsPage,
  neo: NeoPage,
  central: CentralPage,
  contact: ContactPage,
};

export function Marketing({ page = 'home' }: { page?: PublicPage }) {
  const Page = pages[page];
  const neo = page === 'neo';
  return (
    <div className={`public-page ${neo ? 'theme-neo' : ''}`}>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header page={page} />
      <Page />
      <Footer neo={neo} />
    </div>
  );
}
