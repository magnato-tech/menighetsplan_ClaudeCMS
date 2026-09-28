// Admin-grensesnitt for redigering av faste sider

import { layout, esc, fmtDate, fmtTime } from './felles.js';

// Sideliste: tabell med alle sider, rediger/slett-lenker og "Ny side"-knapp
export function renderSidelistePage(sider, utfortParameter = null) {
  const suksessBanner = renderSuksessBanner(utfortParameter);

  const rader = sider.map(side => {
    const menyStatus = side.meny?.vis ? 'Ja' : 'Nei';
    return `<tr>
      <td>${esc(side.slug)}</td>
      <td>${esc(side.tittel)}</td>
      <td>${esc(menyStatus)}</td>
      <td>
        <a href="/admin/rediger/${side.slug}">Rediger</a>
      </td>
      <td>
        <a href="/admin/slett/${side.slug}">Slett</a>
      </td>
    </tr>`;
  }).join('');

  const innhold = `<p><a href="/admin" style="color: var(--sjo);">← Tilbake til administrasjon</a></p>
${suksessBanner}
<h2>Administrer sider</h2>
<a href="/admin/ny" style="display: inline-block; margin-bottom: 16px; padding: 8px 12px; background: var(--rav); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Ny side</a>
<div style="overflow-x: auto; margin-bottom: 16px;">
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: var(--sjo); color: white;">
      <th style="padding: 8px; text-align: left;">Slug</th>
      <th style="padding: 8px; text-align: left;">Tittel</th>
      <th style="padding: 8px; text-align: left;">Vis i meny</th>
      <th style="padding: 8px; text-align: left;"></th>
      <th style="padding: 8px; text-align: left;"></th>
    </tr>
  </thead>
  <tbody>
    ${rader}
  </tbody>
</table>
</div>`;

  return layout({ tittel: 'Administrer sider', innhold });
}

// Redigeringsskjema for ny eller eksisterende side
export function renderRedaktionPage(side = null, feil = null) {
  const isNy = !side;
  const slug = side?.slug || '';
  const tittel = side?.tittel || '';
  const vis = side?.meny?.vis ?? true;
  const rekkefolge = side?.meny?.rekkefolge ?? 999;

  // Tekst fra første blokk (MVP har kun én tekstblokk)
  const tekst = (side?.blokker?.[0]?.tekst || '');

  const feilHtml = feil ? `<div class="warn"><strong>Feil:</strong> ${esc(feil)}</div>` : '';

  const slugField = isNy
    ? `<label for="slug">Slug (kun bokstaver, tall og bindestrek)</label>
       <input type="text" id="slug" name="slug" value="${esc(slug)}" required style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--linje); border-radius: 4px;">`
    : `<input type="hidden" name="slug" value="${esc(slug)}">
       <p><strong>Slug:</strong> ${esc(slug)}</p>`;

  const innhold = `<h2>${isNy ? 'Ny side' : 'Rediger: ' + esc(tittel)}</h2>
${feilHtml}
<form method="POST" style="max-width: 600px;">
  ${slugField}

  <label for="tittel">Tittel</label>
  <input type="text" id="tittel" name="tittel" value="${esc(tittel)}" required style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--linje); border-radius: 4px;">

  <label for="tekst">Tekst (Markdown-inspirert)</label>
  <p style="font-size: 0.85rem; color: var(--dempet); margin-bottom: 8px;">
    Bruk <code>## Overskrift</code> for overskrift,<br>
    <code>- punkt</code> for punktliste,<br>
    og tom linje mellom avsnitt.
  </p>
  <textarea id="tekst" name="tekst" style="width: 100%; height: 300px; padding: 8px; border: 1px solid var(--linje); border-radius: 4px; font-family: monospace;">${esc(tekst)}</textarea>

  <div style="margin-top: 16px;">
    <label style="display: flex; align-items: center; margin-bottom: 12px;">
      <input type="checkbox" id="vis" name="vis" value="on" ${vis ? 'checked' : ''} style="margin-right: 8px;">
      Vis i meny
    </label>
  </div>

  <label for="rekkefolge">Rekkefølge i meny (lavere tall = tidligere)</label>
  <input type="number" id="rekkefolge" name="rekkefolge" value="${rekkefolge}" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid var(--linje); border-radius: 4px;">

  <div style="display: flex; gap: 12px;">
    <button type="submit" style="padding: 8px 16px; background: var(--rav); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Lagre</button>
    <a href="/admin/sider" style="padding: 8px 16px; background: var(--dempet); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Avbryt</a>
  </div>
</form>`;

  return layout({ tittel: isNy ? 'Ny side' : 'Rediger side', innhold });
}

// Bekreftelsesside før sletting
export function renderSlettBekreftelse(side) {
  const innhold = `<h2>Slett side</h2>
<div class="warn">
  <p><strong>Er du sikker på at du vil slette denne siden?</strong></p>
  <p><strong>Slug:</strong> ${esc(side.slug)}<br>
  <strong>Tittel:</strong> ${esc(side.tittel)}</p>
</div>
<form method="POST" style="margin-top: 16px;">
  <div style="display: flex; gap: 12px;">
    <button type="submit" style="padding: 8px 16px; background: var(--rod); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Slett</button>
    <a href="/admin/sider" style="padding: 8px 16px; background: var(--dempet); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Avbryt</a>
  </div>
</form>`;

  return layout({ tittel: 'Slett side', innhold });
}

// Arrangementer-side: list og toggling av fremhevet/skjult
export function renderArrangementerPage(forekomster, overstyringer = {}, utfortParameter = null) {
  const suksessBanner = renderSuksessBanner(utfortParameter);

  const rader = forekomster.map(o => {
    const override = overstyringer[o.uid] || {};
    const fremhevetStatus = override.fremhevet ? 'ja' : 'nei';
    const skjultStatus = override.skjult ? 'ja' : 'nei';

    const avlystTag = o.status === 'AVLYST' ? ' <span class="tag" style="background:var(--rod);color:white">Avlyst</span>' : '';

    return `<tr>
      <td>${esc(o.summary)}${avlystTag}</td>
      <td>${esc(fmtDate(o.startUtc))} ${esc(fmtTime(o.startUtc))}</td>
      <td style="text-align: center;">${fremhevetStatus}</td>
      <td style="text-align: center;">${skjultStatus}</td>
      <td>
        <form method="POST" action="/admin/arrangementer/${esc(o.uid)}/fremhev" style="display: inline;">
          <button type="submit" style="padding: 4px 12px; background: ${override.fremhevet ? 'var(--rod)' : 'var(--rav)'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
            ${override.fremhevet ? 'Fjern fremheving' : 'Fremhev'}
          </button>
        </form>
      </td>
      <td>
        <form method="POST" action="/admin/arrangementer/${esc(o.uid)}/skjul" style="display: inline;">
          <button type="submit" style="padding: 4px 12px; background: ${override.skjult ? 'var(--rod)' : 'var(--sjo)'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
            ${override.skjult ? 'Vis igjen' : 'Skjul'}
          </button>
        </form>
      </td>
    </tr>`;
  }).join('');

  const innhold = `<p><a href="/admin" style="color: var(--sjo);">← Tilbake til administrasjon</a></p>
${suksessBanner}
<h2>Administrer arrangementer</h2>
<p>Her kan du fremheve eller skjule arrangementer fra Menighetsplan på den offentlige siden.</p>
<div style="overflow-x: auto; margin-bottom: 16px;">
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: var(--sjo); color: white;">
      <th style="padding: 8px; text-align: left;">Tittel</th>
      <th style="padding: 8px; text-align: left;">Dato/tid</th>
      <th style="padding: 8px; text-align: center;">Fremhevet</th>
      <th style="padding: 8px; text-align: center;">Skjult</th>
      <th style="padding: 8px; text-align: center;"></th>
      <th style="padding: 8px; text-align: center;"></th>
    </tr>
  </thead>
  <tbody>
    ${rader || '<tr><td colspan="6" style="padding: 16px; text-align: center;">Ingen arrangementer</td></tr>'}
  </tbody>
</table>
</div>
<p style="font-size: 0.85rem; color: var(--dempet);">
  <strong>Fremhevet:</strong> Arrangementer markert som fremhevet vises i en egen seksjon øverst på forsiden.<br>
  <strong>Skjult:</strong> Skjulte arrangementer vises ikke noe sted på nettsiden.
</p>`;

  return layout({ tittel: 'Administrer arrangementer', innhold });
}

// Dashboard med status og nøkkeltall
export function renderDashboard(state, sider, antallArrangementer, utfortParameter = null) {
  const suksessBanner = renderSuksessBanner(utfortParameter);

  const statusTekst = state.error
    ? `<div class="warn"><strong>Feil:</strong> ${esc(state.error)}</div>`
    : state.fetchedAt
    ? `<p><strong>Sist hentet:</strong> ${esc(fmtDate(state.fetchedAt))} kl. ${esc(fmtTime(state.fetchedAt))}</p>`
    : '<p><em>Ingen henting utført ennå</em></p>';

  const innhold = `
${suksessBanner}
<h2>Status</h2>
<div style="background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
  <h3 style="margin-top: 0;">Menighetsplan-tilkobling</h3>
  ${statusTekst}
  <p style="font-size: 0.85rem; color: var(--dempet);">Dataene oppdateres automatisk hvert 15. minutt.</p>
</div>

<h2>Oversikt</h2>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
  <div style="background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px;">
    <div style="font-size: 2rem; font-weight: 600; color: var(--rav);">${sider.length}</div>
    <div style="font-size: 0.9rem; color: var(--dempet);">faste sider</div>
  </div>
  <div style="background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px;">
    <div style="font-size: 2rem; font-weight: 600; color: var(--rav);">${antallArrangementer}</div>
    <div style="font-size: 0.9rem; color: var(--dempet);">kommende arrangementer</div>
  </div>
</div>

<div style="background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
  <form method="POST" action="/admin/hent-na" style="margin: 0;">
    <button type="submit" style="padding: 8px 16px; background: var(--rav); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Hent nå</button>
  </form>
  <p style="font-size: 0.85rem; color: var(--dempet); margin-top: 8px;">Tvinger oppdatering fra Menighetsplan</p>
</div>

<h2>Administrasjon</h2>
<ul style="list-style: none; padding: 0;">
  <li style="margin-bottom: 12px;"><a href="/admin/sider" style="font-weight: 500; color: var(--sjo);">Administrer sider</a></li>
  <li style="margin-bottom: 12px;"><a href="/admin/arrangementer" style="font-weight: 500; color: var(--sjo);">Administrer arrangementer</a></li>
</ul>`;

  return layout({ tittel: 'Administrasjon', innhold });
}

// Rendrer en grønn suksess-banner hvis utfort-parameter er satt
function renderSuksessBanner(utfortParameter) {
  if (!utfortParameter) return '';

  const tekster = {
    'opprettet': 'Siden ble opprettet',
    'oppdatert': 'Siden ble oppdatert',
    'slettet': 'Siden ble slettet',
    'hentet': 'Arrangementer oppdatert fra Menighetsplan',
    'fremhevet': 'Arrangementet ble fremhevet',
    'skjult': 'Arrangementet ble skjult'
  };

  const tekst = tekster[utfortParameter] || 'Operasjonen var vellykket';
  return `<div class="suksess"><strong>✓ </strong>${esc(tekst)}</div>`;
}

// Enkel 401-side for manglende auth
export function render401() {
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Autorisering kreves</title>
<style>
  body { font-family: system-ui; background: #f5f5f5; padding: 40px; text-align: center; }
  h1 { color: #a23b2a; }
</style>
</head><body>
<h1>Autorisering kreves</h1>
<p>Du må logge inn for å få tilgang til admin.</p>
</body></html>`;
}
