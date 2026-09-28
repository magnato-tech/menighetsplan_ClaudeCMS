// Visning av tjenestegrupper og husfellesskap

import { layout, esc } from './felles.js';

export function renderBliMed(data, menySider) {
  const tjenestegruppeHtml = data.grupper
    .filter(g => g.kategori === 'tjenestegruppe')
    .map(g => `
      <div class="gruppe-kort">
        <h4>${esc(g.navn)}</h4>
        <p>${esc(g.beskrivelse)}</p>
      </div>
    `)
    .join('');

  const husgruppeHtml = data.grupper
    .filter(g => g.kategori === 'husgruppe')
    .map(g => `
      <div class="gruppe-kort">
        <h4>${esc(g.navn)}</h4>
        <p>${esc(g.beskrivelse)}</p>
      </div>
    `)
    .join('');

  const innhold = `
    <h2>Bli med i menighetens arbeid</h2>
    <div class="blokk-tekst">
      <p>Gud har gitt deg talenter og evner! Menighetens arbeid er basert på frivillighet, og vi kan alle bidra. Ulike tjenester gjør at vi til sammen får til det som skjer av arbeid.</p>
    </div>

    <h3>Tjenestegrupper</h3>
    <div class="gruppe-grid">
      ${tjenestegruppeHtml}
    </div>

    <h3>Husfellesskap</h3>
    <div class="gruppe-grid">
      ${husgruppeHtml}
    </div>

    <div class="blokk-tekst">
      <p><strong>Vil du bli med?</strong> Ta kontakt med oss på <a href="/kontakt">vår kontaktside</a>.</p>
    </div>
  `;

  return layout({ tittel: 'Bli med', innhold, menySider, aktivSlug: 'bli-med' });
}
