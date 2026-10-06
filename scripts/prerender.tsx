import { renderToString } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import { Marketing } from '../src/public/Marketing';
import type { PublicPage } from '../src/lib/routes';
import routes from '../routes.json';
async function prerender() {
  const template = await readFile('dist/index.html', 'utf8');
  for (const page of routes.publicPages) {
    const path = `dist/${page.file}`;
    const canonical = 'https://tigrrsecurity.cl' + page.path;
    let html = template
      .replace(/<title>.*?<\/title>/, '<title>' + page.title + '</title>')
      .replace(
        /(<meta\s+(?:name="(?:description|twitter:description)"|property="og:description")\s+content=")[^"]*("\s*\/?>)/g,
        '$1' + page.description + '$2',
      )
      .replace(
        /(<meta\s+(?:name="twitter:title"|property="og:title")\s+content=")[^"]*("\s*\/?>)/g,
        '$1' + page.title + '$2',
      )
      .replace(/https:\/\/tigrrsecurity\.cl\/(?="\s*\/?>)/g, canonical)
      .replace('data-page="public"', 'data-page="' + page.page + '"')
      .replace('<body>', page.page === 'neo' ? '<body class="theme-neo">' : '<body>')
      .replace(
        /https:\/\/tigrrsecurity\.cl\/tigrr.png/g,
        page.page === 'neo'
          ? 'https://tigrrsecurity.cl/neo-globo.png'
          : 'https://tigrrsecurity.cl/tigrr.png',
      );
    if (page.page === 'neo')
      html = html
        .replace(/(<meta\s+name="theme-color"\s+content=")[^"]+"/, '$1#111514"')
        .replace(/(<link\s+rel="icon"\s+href=")[^"]+"/, '$1/neo-globo-icon.png"');
    await writeFile(
      path,
      html.replace(
        '<div id="root"></div>',
        `<div id="root">${renderToString(<Marketing page={page.page as PublicPage} />)}</div>`,
      ),
    );
  }
  console.log(`${routes.publicPages.length} páginas comerciales prerenderizadas.`);
}
prerender().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
