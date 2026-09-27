// Debug-side – viser rådata fra arrangementer

import { esc, fmtDate, fmtTime } from './felles.js';

const TZ = 'Europe/Oslo';

function fmtUtc(ms) {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function renderDebug(data, adapter, KILDE_URL) {
  const occ = data.forekomster || [];
  const raa = data.raa || [];
  const state = data.state || {};
  const REFRESH_MIN = +(process.env.REFRESH_MINUTES || 15);

  const now = Date.now();
  const to = now + 120 * 86400000;

  const banner = state.error
    ? `<div class="warn"><strong>Klarte ikke å hente fra ${esc(adapter.navn)}:</strong> ${esc(state.error)}.<br>${state.tekst ? `Viser sist vellykkede henting${state.fetchedAt ? ' (' + esc(state.fetchedAt.toLocaleString('nb-NO', { timeZone: TZ })) + ')' : ' fra lagret kopi'}.` : 'Ingen tidligere data å vise.'}</div>`
    : '';

  const rows = occ.map(o => `
    <tr class="${o.status === 'AVLYST' ? 'cancelled' : ''}">
      <td>${esc(fmtDate(o.startUtc))}</td>
      <td>${o.allDay ? 'Hele dagen' : esc(fmtTime(o.startUtc) + '–' + fmtTime(o.endUtc))}</td>
      <td class="mono small">${o.allDay ? '' : esc(fmtUtc(o.startUtc))}</td>
      <td><strong>${esc(o.summary)}</strong>${o.erGudstjeneste && !o.categories.includes('Gudstjeneste') ? ' <span class="tag">Gudstjeneste</span>' : ''}${o.categories.length ? ` <span class="tag">${esc(o.categories.join(', '))}</span>` : ''}${o.description ? `<div class="small">${esc(o.description).replace(/\n/g, '<br>')}</div>` : ''}</td>
      <td>${esc(o.location)}</td>
      <td><span class="status s-${esc(o.status)}">${esc(o.status)}</span>${o.klass !== 'PUBLIC' ? ` <span class="tag">${esc(o.klass)}</span>` : ''}</td>
      <td class="small">${esc(o.flag)}${o.originalStart ? `<br>opprinnelig ${esc(fmtDate(o.originalStart) + ' ' + fmtTime(o.originalStart))}` : ''}</td>
    </tr>`).join('');

  const rawDetails = raa.map(e => `
    <details><summary>${esc(e.tittel || '(uten tittel)')} <span class="small mono">${esc(e.id)}</span></summary>
      <table class="raw">${e.felt.map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td class="mono">${esc(v)}</td></tr>`).join('')}</table>
    </details>`).join('');

  return `<!doctype html><html lang="nb"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lillesand Misjonskirke – kalender (Sprint 0)</title>
<link rel="icon" href="/logo.svg">
<style>
  :root { --sjo:#1F4E5F; --sand:#F4EFE6; --rav:#C8873A; --tekst:#1d2a30; --dempet:#5b6b72; --linje:#e2dccf; --rod:#a23b2a; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--sand); color: var(--tekst); }
  header { background: var(--sjo); color: var(--sand); padding: 16px; display:flex; align-items:center; gap:12px; }
  header img { width: 44px; height: 44px; }
  header h1 { font-size: 1.25rem; margin: 0; } header p { margin: 2px 0 0; opacity:.8; font-size:.9rem; }
  main { max-width: 1200px; margin: 0 auto; padding: 16px; }
  .meta { color: var(--dempet); font-size: .9rem; margin-bottom: 12px; }
  .warn { background:#fdecea; border:1px solid var(--rod); color: var(--rod); padding:12px; border-radius:8px; margin-bottom:16px; }
  .scroll { overflow-x:auto; background:#fff; border:1px solid var(--linje); border-radius:10px; }
  table { border-collapse: collapse; width:100%; }
  th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--linje); vertical-align: top; font-size:.92rem; }
  th { background:#faf7f1; font-weight:600; white-space:nowrap; }
  tr.cancelled td { color: var(--dempet); } tr.cancelled strong { text-decoration: line-through; }
  .tag { display:inline-block; background: var(--sand); border:1px solid var(--linje); border-radius:999px; padding:0 8px; font-size:.75rem; }
  .status { font-weight:600; font-size:.8rem; } .s-AVLYST { color: var(--rod); } .s-BEKREFTET { color: var(--sjo); }
  .small { font-size:.8rem; color: var(--dempet); } .mono { font-family: ui-monospace, Consolas, monospace; }
  h2 { font-size:1.05rem; margin: 24px 0 8px; color: var(--sjo); }
  details { background:#fff; border:1px solid var(--linje); border-radius:8px; margin-bottom:6px; padding:8px 10px; }
  table.raw td { font-size:.8rem; border-bottom:1px dashed var(--linje); word-break: break-all; }
  a { color: var(--sjo); }
</style></head><body>
<header><img src="/logo.svg" alt=""><div><h1>Lillesand Misjonskirke</h1><p>Sprint 0 – rådata fra ${esc(adapter.navn)}</p></div></header>
<main>
  ${banner}
  <div class="meta">
    Kilde: <strong>${esc(adapter.navn)}</strong> · <span class="mono">${esc(KILDE_URL)}</span><br>
    Sist hentet: ${state.fetchedAt ? esc(state.fetchedAt.toLocaleString('nb-NO', { timeZone: TZ })) : '–'} · oppdateres hvert ${REFRESH_MIN}. minutt ·
    <a href="/debug?oppdater=1">Hent nå</a> · <a href="/api/arrangementer">JSON</a><br>
    Viser ${occ.length} forekomster fra ${esc(fmtDate(now))} til ${esc(fmtDate(to))} · tidssone ${esc(TZ)}
  </div>
  <div class="scroll"><table>
    <thead><tr><th>Dato</th><th>Tid (norsk)</th><th>Lagret som</th><th>Arrangement</th><th>Sted</th><th>Status</th><th>Merknad</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">Ingen arrangementer i perioden.</td></tr>'}</tbody>
  </table></div>
  <h2>Rådata fra kilden (${raa.length})</h2>
  ${rawDetails}
</main></body></html>`;
}
