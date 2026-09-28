// Felles HTML-layout, escapering, formattering

export const TZ = 'Europe/Oslo';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const fmtDate = ms => new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(ms);

export const fmtTime = ms => new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(ms);

export function layout({ tittel, innhold, menySider = [], aktivSlug = null }) {
  const menyHtml = menySider
    .filter(s => s.meny?.vis)
    .map(s => {
      const isActive = s.slug === aktivSlug;
      return `<li><a href="/${s.slug}" class="${isActive ? 'active' : ''}">${esc(s.tittel)}</a></li>`;
    }).join('');

  return `<!doctype html><html lang="nb"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tittel)} – Lillesand Misjonskirke</title>
<link rel="icon" href="/logo.svg">
<style>
  :root { --sjo:#1F4E5F; --sand:#F4EFE6; --rav:#C8873A; --tekst:#1d2a30; --dempet:#5b6b72; --linje:#e2dccf; --rod:#a23b2a; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--sand); color: var(--tekst); }
  header { background: var(--sjo); color: var(--sand); padding: 16px; display:flex; align-items:center; gap:12px; }
  header img { width: 44px; height: 44px; }
  header h1 { font-size: 1.25rem; margin: 0; } header p { margin: 2px 0 0; opacity:.8; font-size:.9rem; }
  nav { background: var(--sjo); color: var(--sand); padding: 0 16px; }
  nav ul { list-style:none; margin:0; padding:0; display:flex; gap:8px; flex-wrap:wrap; }
  nav li { margin:0; }
  nav a { display:block; padding:8px 12px; color:var(--sand); text-decoration:none; }
  nav a:hover { background: rgba(255,255,255,0.1); border-radius:4px; }
  nav a.active { background: var(--rav); color: var(--sand); border-radius:4px; font-weight:600; }
  main { max-width: 760px; margin: 0 auto; padding: 16px; }
  footer { margin-top:40px; padding-top:16px; border-top:1px solid var(--linje); font-size:.85rem; color:var(--dempet); text-align:center; }
  a { color: var(--sjo); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .warn { background:#fdecea; border:1px solid var(--rod); color: var(--rod); padding:12px; border-radius:8px; margin-bottom:16px; }
  .suksess { background:#e8f5e9; border:1px solid #4caf50; color: #2e7d32; padding:12px; border-radius:8px; margin-bottom:16px; }
  .tag { display:inline-block; background: var(--sand); border:1px solid var(--linje); border-radius:999px; padding:0 8px; font-size:.75rem; margin-right:4px; }
  h2 { font-size:1.05rem; color: var(--sjo); }
  h3 { font-size:1rem; color: var(--rav); margin:20px 0 12px; }
  .event-row { background:#fff; border:1px solid var(--linje); border-radius:6px; padding:12px; margin-bottom:8px; display:flex; gap:12px; }
  .event-date { flex-shrink:0; font-weight:600; color:var(--rav); min-width:70px; font-size:.9rem; }
  .event-time { flex-shrink:0; color:var(--dempet); font-size:.9rem; min-width:50px; }
  .event-content { flex:1; min-width:0; }
  .event-title { font-weight:500; }
  .event-desc { margin-top:4px; font-size:.85rem; color:var(--dempet); }
  .event-location { margin-top:4px; font-size:.85rem; color:var(--dempet); }
  .service-card { background:#fff; border:1px solid var(--linje); border-radius:8px; padding:16px; }
  .service-date { font-size:1.3rem; font-weight:600; color:var(--rav); }
  .service-time { font-size:1rem; color:var(--tekst); margin-top:4px; }
  .service-desc { margin-top:12px; color:var(--dempet); font-size:.95rem; }
  .service-location { font-size:.9rem; margin-top:8px; color:var(--dempet); }
  .filter-bar { margin:16px 0; padding:12px; background:#fff; border:1px solid var(--linje); border-radius:8px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
  .filter-bar a { padding:4px 8px; border:1px solid var(--linje); border-radius:4px; background:transparent; font-size:.9rem; }
  .filter-bar a.active { background:var(--sjo); color:var(--sand); border-color:var(--sjo); }
  .event-row.cancelled { opacity:.7; }
  .cancelled strong { text-decoration: line-through; }
  .blokk-tekst { margin:16px 0; line-height:1.6; }
  .blokk-tekst p { margin:0 0 12px 0; }
  .blokk-tekst h4 { margin:16px 0 8px 0; font-size:1rem; color:var(--rav); }
  .blokk-tekst ul { margin:8px 0; padding-left:20px; }
  .blokk-tekst li { margin:4px 0; }
  .blokk-tekst a { color:var(--sjo); }
  .gruppe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin: 16px 0; }
  .gruppe-kort { background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px; }
  .gruppe-kort h4 { margin: 0 0 8px 0; font-size: 1rem; color: var(--rav); }
  .gruppe-kort p { margin: 0; font-size: 0.9rem; color: var(--dempet); line-height: 1.4; }
  .aktuelt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin: 16px 0; }
  .aktuelt-kort { background: #fff; border: 1px solid var(--linje); border-radius: 8px; overflow: hidden; }
  .aktuelt-kort img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .aktuelt-innhold { padding: 12px 16px; }
  .aktuelt-dato { font-size: 0.8rem; color: var(--rav); font-weight: 600; }
  .aktuelt-tittel { font-weight: 600; margin-top: 4px; }
  .aktuelt-tekst { margin-top: 8px; font-size: 0.9rem; color: var(--dempet); line-height: 1.4; }
  @media (max-width:480px) {
    header { padding:12px; }
    header h1 { font-size:1rem; }
    main { padding:12px; }
    .event-row { flex-direction:column; }
    nav ul { flex-direction:column; gap:0; }
    nav a { padding:8px 16px; border-radius:0; }
  }
</style></head><body>
<header><img src="/logo.svg" alt=""><div><h1>Lillesand Misjonskirke</h1><p>Velkommen</p></div></header>
<nav><ul><li><a href="/" class="${aktivSlug === null ? 'active' : ''}">Hjem</a></li>${menyHtml}<li><a href="/bli-med" class="${aktivSlug === 'bli-med' ? 'active' : ''}">Bli med</a></li></ul></nav>
<main>
  ${innhold}
</main>
<footer>
  <div style="margin-bottom:12px"><a href="mailto:kontakt@lillesand-misjon.no">kontakt@lillesand-misjon.no</a></div>
  <div>Lillesand Misjonskirke</div>
</footer>
</body></html>`;
}
