// Forside – viser neste gudstjeneste og kommende arrangementer

import { esc, fmtDate, fmtTime, layout } from './felles.js';
import { filtrerForekomster, hentDenneUken, hentKategorierForVising, anvendOverstyringer } from './relevans.js';

function getMonthYear(ms) {
  const TZ = 'Europe/Oslo';
  const date = new Date(ms);
  return new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, month: 'long', year: 'numeric' }).format(date);
}

function renderAktueltCard(o) {
  const cancelled = o.status === 'AVLYST';
  const bildeHtml = o.bilde ? `<img src="/bilder/${esc(o.bilde)}" alt="">` : '';

  return `<div class="aktuelt-kort">
    ${bildeHtml}
    <div class="aktuelt-innhold">
      <div class="aktuelt-dato">${esc(fmtDate(o.startUtc))}</div>
      <div class="aktuelt-tittel">${cancelled ? '<span style="text-decoration:line-through">' + esc(o.summary) + '</span>' : esc(o.summary)}</div>
      ${o.description ? `<div class="aktuelt-tekst">${esc(o.description).replace(/\n/g, '<br>')}</div>` : ''}
    </div>
  </div>`;
}

function renderEventRow(o) {
  const isServiceTag = o.erGudstjeneste;
  const cancelled = o.status === 'AVLYST';
  const otherCategories = hentKategorierForVising(o);
  const categoryTagsHtml = otherCategories.map(cat => `<span class="tag">${esc(cat)}</span>`).join('');

  return `<div class="event-row ${cancelled ? 'cancelled' : ''}">
    <div class="event-date">${esc(fmtDate(o.startUtc))}</div>
    <div class="event-time">${o.allDay ? 'Hele dagen' : esc(fmtTime(o.startUtc))}</div>
    <div class="event-content">
      <div class="event-title">${cancelled ? '<span style="text-decoration:line-through">' + esc(o.summary) + '</span>' : esc(o.summary)}${isServiceTag ? ' <span class="tag">Gudstjeneste</span>' : ''}${categoryTagsHtml}${cancelled ? ' <span class="tag" style="background:var(--rod);color:white">Avlyst</span>' : ''}</div>
      ${o.description ? `<div class="event-desc">${esc(o.description).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="event-location">${esc(o.location)}</div>
    </div>
  </div>`;
}

export function renderForside(data, menySider = [], visning = 'alle', overstyringer = {}) {
  let occ = data.forekomster || [];
  const state = data.state || {};

  const adapter = data.adapter || { navn: 'Menighetsplan-API' };
  const TZ = 'Europe/Oslo';

  // Validér visning-parameter
  if (!['alle', 'gudstjenester'].includes(visning)) {
    visning = 'alle';
  }

  // Framheve-seksjonen og "Neste gudstjeneste" skal vises uavhengig av
  // visningsfilter (men ikke skjulte arrangementer)
  const { fremhevede, resten: allNotHidden } = anvendOverstyringer(occ, overstyringer);

  // Filtrer basert på visningsvalg for resten av siden
  occ = filtrerForekomster(occ, visning);

  // Anvend overstyringer for «Denne uken» og månedslisten
  const { resten } = anvendOverstyringer(occ, overstyringer);

  const banner = state.error
    ? `<div class="warn"><strong>Klarte ikke å hente fra ${esc(adapter.navn)}:</strong> ${esc(state.error)}.<br>${state.tekst ? `Viser sist vellykkede henting${state.fetchedAt ? ' (' + esc(state.fetchedAt.toLocaleString('nb-NO', { timeZone: TZ })) + ')' : ' fra lagret kopi'}.` : 'Ingen tidligere data å vise.'}</div>`
    : '';

  // Filter-bar
  const filterBar = `<div class="filter-bar">
    <a href="/?visning=alle" class="${visning === 'alle' ? 'active' : ''}">Alle arrangementer</a>
    <a href="/?visning=gudstjenester" class="${visning === 'gudstjenester' ? 'active' : ''}">Kun gudstjenester</a>
  </div>`;

  // Neste gudstjeneste (alltid fra hele listen, ikke filtrert, og ikke skjult)
  const nextService = allNotHidden.find(o => o.erGudstjeneste && o.status !== 'AVLYST');
  const nextServiceHtml = nextService
    ? `<div class="next-service">
        <h2 style="margin-top:0">Neste gudstjeneste</h2>
        <div class="service-card">
          <div class="service-date">${esc(fmtDate(nextService.startUtc))}</div>
          <div class="service-time">${nextService.allDay ? 'Hele dagen' : esc(fmtTime(nextService.startUtc))}</div>
          <div class="service-title" style="font-weight:600; margin-top:12px; font-size:1.1rem">${esc(nextService.summary)}</div>
          ${nextService.description ? `<div class="service-desc">${esc(nextService.description).replace(/\n/g, '<br>')}</div>` : ''}
          <div class="service-location" style="margin-top:8px; color:var(--dempet)">${esc(nextService.location)}</div>
        </div>
      </div>`
    : `<div class="next-service"><h2 style="margin-top:0">Neste gudstjeneste</h2><p>Ingen kommende gudstjenester.</p></div>`;

  // "Nyheter og aktuelt"-seksjon (hvis noen arrangementer er fremhevet)
  const fremhevetHtml = fremhevede.length > 0
    ? `<h2 style="margin-top:24px">Nyheter og aktuelt</h2><div class="aktuelt-grid">${fremhevede.map(renderAktueltCard).join('')}</div>`
    : '';

  // "Denne uken"-seksjon (fra resten, dvs. ikke skjulte)
  const now = Date.now();
  const denneUken = hentDenneUken(resten, now);
  const denneUkenHtml = denneUken.length > 0
    ? `<h2 style="margin-top:24px">Denne uken</h2>${denneUken.map(renderEventRow).join('')}`
    : `<h2 style="margin-top:24px">Denne uken</h2><p>Ingen arrangementer denne uken.</p>`;

  // Kommende arrangementer gruppert etter måned (fra resten, dvs. ikke skjulte)
  const monthGroups = {};
  resten.forEach(o => {
    const monthKey = getMonthYear(o.startUtc);
    if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
    monthGroups[monthKey].push(o);
  });

  const arrangementsHtml = Object.entries(monthGroups).map(([month, events]) => {
    const rows = events.map(renderEventRow).join('');
    return `<h3>${esc(month)}</h3>${rows}`;
  }).join('');

  const updateTime = state.fetchedAt ? new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(state.fetchedAt) : 'ukjent';

  const innhold = `
    ${banner}
    ${filterBar}
    ${nextServiceHtml}
    ${fremhevetHtml}
    ${denneUkenHtml}
    <h2 style="margin-top:24px">Alle kommende arrangementer</h2>
    ${arrangementsHtml || '<p>Ingen arrangementer.</p>'}
    <div style="margin-top:40px; padding-top:16px; border-top:1px solid var(--linje); font-size:.85rem; color:var(--dempet); text-align:center">
      <div>Sist oppdatert ${esc(updateTime)}</div>
    </div>
  `;

  return layout({ tittel: 'Hjem', innhold, menySider, aktivSlug: null });
}
