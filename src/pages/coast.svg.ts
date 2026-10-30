// Sprite con la costa en un solo trazado (tierra + islas). Las páginas lo reutilizan con
// <use href=".../coast.svg#coast">: el navegador lo descarga una vez y lo cachea.
import coast from '../data/coast.json';

export const prerender = true;

export function GET() {
  const d = [coast.land, ...coast.islands].join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${coast.view.width} ${coast.view.height}"><defs><path id="coast" d="${d}"/></defs><use href="#coast"/></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
}
