// Admin-grensesnitt for redigering av faste sider

import { layout, esc } from './felles.js';

// Sideliste: tabell med alle sider, rediger/slett-lenker og "Ny side"-knapp
export function renderSidelistePage(sider) {
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

  const innhold = `<h2>Administrer sider</h2>
<a href="/admin/ny" style="display: inline-block; margin-bottom: 16px; padding: 8px 12px; background: var(--rav); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Ny side</a>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
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
</table>`;

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
    <a href="/admin" style="padding: 8px 16px; background: var(--dempet); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Avbryt</a>
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
    <a href="/admin" style="padding: 8px 16px; background: var(--dempet); color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Avbryt</a>
  </div>
</form>`;

  return layout({ tittel: 'Slett side', innhold });
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
