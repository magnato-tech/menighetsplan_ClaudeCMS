// Kalenderside – månedsvisning

import { esc, layout, fmtTime } from './felles.js';
import { getNextMonth, getPrevMonth } from './kalender.js';

/**
 * Render en enkeltdag i kalender-griddet.
 * @param {Object} dag - { dato: Date, dagINummer, iValgtManed, erIdag, arrangementer: [...] }
 * @returns {string} HTML for en dag
 */
function renderKalenderDag(dag) {
  const { dagINummer, iValgtManed, erIdag, arrangementer } = dag;

  const klasseListe = ['kalender-dag'];
  if (!iValgtManed) klasseListe.push('utenfor-maned');
  if (erIdag) klasseListe.push('i-dag');

  // Vis opptil 2-3 arrangementer som tags, pluss "+N mer" hvis flere
  const maxVisible = 2;
  const visible = arrangementer.slice(0, maxVisible);
  const hidden = arrangementer.length - maxVisible;

  const hendelsesHtml = visible
    .map(evt => {
      const cancelled = evt.status === 'AVLYST';
      const className = ['kalender-hendelse', evt.erGudstjeneste ? 'gudstjeneste' : '', cancelled ? 'avlyst' : ''].filter(Boolean).join(' ');
      const tittel = cancelled ? `Avlyst: ${evt.summary}` : evt.summary;
      return `<div class="${className}" title="${esc(tittel)}">${esc(evt.summary)}</div>`;
    })
    .join('');

  const merHtml = hidden > 0 ? `<div class="kalender-hendelse mere">+${hidden} mer</div>` : '';

  return `<div class="${klasseListe.join(' ')}">
    <div class="kalender-dag-nummer">${dagINummer}</div>
    <div class="kalender-hendelser">${hendelsesHtml}${merHtml}</div>
  </div>`;
}

/**
 * Render kalender-grid som HTML.
 * @param {{uker: Array, manedNavn: string, ar: number}} grid - fra byggKalenderGrid()
 * @param {string} aarManed - YYYY-MM format (e.g., "2026-10")
 * @param {Array} menySider - faste sider for menyen
 * @returns {string} HTML
 */
export function renderKalender(grid, aarManed, menySider) {
  const { uker, manedNavn, ar } = grid;
  const prevManed = getPrevMonth(aarManed);
  const nextManed = getNextMonth(aarManed);

  // Kolonneoverskrifter: mandag-søndag
  const dagerUkenHtml = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    .map(d => `<div class="kalender-dag-header">${d}</div>`)
    .join('');

  // Grid-dager
  const ukerHtml = uker
    .map(uke => uke.map(dag => renderKalenderDag(dag)).join(''))
    .join('');

  const gridHtml = `<div class="kalender-grid-wrapper">
    <div class="kalender-grid">
      ${dagerUkenHtml}
      ${ukerHtml}
    </div>
  </div>`;

  const innhold = `<div class="kalender-container">
    <div class="kalender-header">
      <h2>${manedNavn} ${ar}</h2>
    </div>

    <div class="kalender-nav">
      <a href="/kalender?maned=${prevManed}" class="kalender-nav-link prev">‹ Forrige måned</a>
      <a href="/kalender?maned=${nextManed}" class="kalender-nav-link next">Neste måned ›</a>
    </div>

    ${gridHtml}
  </div>`;

  return layout({
    tittel: `Kalender – ${manedNavn} ${ar}`,
    innhold,
    menySider,
    aktivSlug: 'kalender',
  });
}
