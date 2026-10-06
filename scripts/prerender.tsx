import { renderToString } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import { Marketing } from '../src/public/Marketing';
async function prerender() {
  for (const [file, neo] of [
    ['index.html', false],
    ['tigrr.html', true],
  ] as const) {
    const path = `dist/${file}`,
      html = await readFile(path, 'utf8');
    await writeFile(
      path,
      html.replace(
        '<div id="root"></div>',
        `<div id="root">${renderToString(<Marketing neo={neo} />)}</div>`,
      ),
    );
  }
  console.log('Portada y página NEO prerenderizadas.');
}
prerender().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
