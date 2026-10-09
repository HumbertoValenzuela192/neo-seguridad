import type { PublicPage } from '../lib/routes';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NeoPage from './pages/NeoPage';
import CentralPage from './pages/CentralPage';
import ContactPage from './pages/ContactPage';
import ScrollEffects from './ScrollEffects';
import { useSiteNavigation } from './navigation';
import { useContentGuard } from './contentGuard';

const pages = {
  home: HomePage,
  neo: NeoPage,
  central: CentralPage,
  contact: ContactPage,
};

export function Marketing({ page: initialPage = 'home' }: { page?: PublicPage }) {
  const { page, count } = useSiteNavigation(initialPage);
  useContentGuard();
  const Page = pages[page];
  const neo = page === 'neo';
  return (
    <div className={`public-page ${neo ? 'theme-neo' : ''}`}>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header page={page} />
      <div key={page} className={count ? 'page-enter' : undefined}>
        <Page />
      </div>
      <Footer neo={neo} />
      <ScrollEffects page={page} />
      <div id="route-status" className="sr-only" role="status" aria-live="polite" />
    </div>
  );
}
