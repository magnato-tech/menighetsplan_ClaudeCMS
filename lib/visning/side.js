// Visning av en fast side

import { esc, layout } from './felles.js';
import { renderBlokker } from './blokker.js';

export function renderSide(side, menySider = []) {
  if (!side) return null;

  const blokkHtml = renderBlokker(side.blokker || []);

  const innhold = `
    <h2>${esc(side.tittel)}</h2>
    ${blokkHtml}
  `;

  return layout({ tittel: side.tittel, innhold, menySider, aktivSlug: side.slug });
}
