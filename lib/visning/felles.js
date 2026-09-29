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
  header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; } header p { margin: 2px 0 0; opacity:.8; font-size:.9rem; }
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
  h2 { font-size: 1.3rem; font-weight: 700; color: var(--sjo); }
  h3 { font-size: 1.1rem; font-weight: 600; color: var(--rav); margin:20px 0 12px; }
  .event-row, .service-card, .gruppe-kort, .aktuelt-kort, .cta-kort { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .event-row:hover, .service-card:hover, .gruppe-kort:hover, .aktuelt-kort:hover, .cta-kort:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
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
  .cta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 16px 0; }
  .cta-kort { display: block; background: #fff; border: 1px solid var(--linje); border-radius: 8px; padding: 16px; text-decoration: none; color: var(--tekst); }
  .cta-kort h3 { margin: 0 0 8px 0; font-size: 1rem; color: var(--rav); }
  .cta-kort p { margin: 0; font-size: 0.9rem; color: var(--dempet); line-height: 1.4; }
  .hero { position: relative; overflow: hidden; border-radius: 8px; margin-bottom: 16px; height: 280px; background: var(--sjo); }
  .hero-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; transition: opacity 1s ease; }
  .hero-slide.active { opacity: 1; }
  .hero-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 60px 20px 20px; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8); background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%); }
  .hero-content h2 { margin: 0; font-size: 1.8rem; font-weight: 600; }
  .hero-content p { margin: 8px 0 0; font-size: 1rem; opacity: 0.95; }
  .hero-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10; }
  .hero-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: background 0.3s ease; }
  .hero-dot.active { background: var(--rav); }
  .hero-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: rgba(0,0,0,0.3); border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 4px; transition: background 0.2s; z-index: 5; }
  .hero-nav:hover { background: rgba(0,0,0,0.5); }
  .hero-nav.prev { left: 12px; }
  .hero-nav.next { right: 12px; }
  .kalender-container { margin: 0; }
  .kalender-header { margin-bottom: 16px; }
  .kalender-header h2 { margin: 0; }
  .kalender-nav { display: flex; gap: 16px; margin-bottom: 20px; justify-content: space-between; }
  .kalender-nav-link { padding: 8px 16px; background: var(--sand); border: 1px solid var(--linje); border-radius: 4px; text-decoration: none; color: var(--sjo); transition: background 0.2s, transform 0.2s; }
  .kalender-nav-link:hover { background: var(--linje); transform: translateY(-1px); }
  .kalender-grid-wrapper { overflow-x: auto; margin-bottom: 20px; border-radius: 8px; border: 1px solid var(--linje); }
  .kalender-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--linje); padding: 1px; min-width: 100%; }
  .kalender-dag-header { background: var(--sjo); color: var(--sand); padding: 12px 8px; text-align: center; font-weight: 600; font-size: 0.85rem; }
  .kalender-dag { background: #fff; padding: 8px; min-height: 100px; position: relative; display: flex; flex-direction: column; }
  .kalender-dag.utenfor-maned { background: #fafaf8; opacity: 0.6; }
  .kalender-dag.i-dag { border: 2px solid var(--rav); }
  .kalender-dag-nummer { font-weight: 600; font-size: 0.9rem; color: var(--tekst); margin-bottom: 4px; }
  .kalender-hendelser { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .kalender-hendelse { display: inline-block; background: var(--sand); border: 1px solid var(--linje); border-radius: 3px; padding: 2px 6px; font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--sjo); font-weight: 500; }
  .kalender-hendelse.gudstjeneste { background: #e8f0f7; border-color: var(--sjo); color: var(--sjo); }
  .kalender-hendelse.mere { background: var(--linje); color: var(--dempet); border-color: var(--linje); }
  .kalender-hendelse.avlyst { text-decoration: line-through; opacity: 0.7; }
  @media (max-width:480px) {
    .kalender-nav { flex-direction: column; gap: 8px; }
    .kalender-nav-link { width: 100%; text-align: center; }
    .kalender-grid-wrapper { margin: 0 -12px 20px; border-radius: 0; border: none; border-top: 1px solid var(--linje); border-bottom: 1px solid var(--linje); }
    .kalender-dag { min-height: 80px; padding: 6px 4px; font-size: 0.9rem; }
    .kalender-dag-nummer { font-size: 0.8rem; }
    .kalender-hendelse { font-size: 0.65rem; padding: 1px 4px; }
    .kalender-dag-header { padding: 8px 4px; font-size: 0.75rem; }
  }
  @media (max-width:480px) {
    .hero { height: 180px; }
    .hero-content h2 { font-size: 1.2rem; }
    .hero-content p { font-size: 0.85rem; }
    .hero-nav { width: 32px; height: 32px; font-size: 16px; }
  }
  @media (max-width:480px) {
    header { padding:12px; }
    header h1 { font-size:1rem; }
    main { padding:12px; }
    .event-row { flex-direction:column; }
    nav ul { flex-direction:column; gap:0; }
    nav a { padding:8px 16px; border-radius:0; }
    .cta-grid { grid-template-columns: 1fr; }
  }
</style></head><body>
<header><img src="/logo.svg" alt=""><div><h1>Lillesand Misjonskirke</h1><p>Velkommen</p></div></header>
<nav><ul><li><a href="/" class="${aktivSlug === null ? 'active' : ''}">Hjem</a></li>${menyHtml}<li><a href="/kalender" class="${aktivSlug === 'kalender' ? 'active' : ''}">Kalender</a></li><li><a href="/bli-med" class="${aktivSlug === 'bli-med' ? 'active' : ''}">Bli med</a></li></ul></nav>
<main>
  ${innhold}
</main>
<footer>
  <div style="margin-bottom:12px"><a href="mailto:kontakt@lillesand-misjon.no">kontakt@lillesand-misjon.no</a></div>
  <div>Lillesand Misjonskirke</div>
</footer>
</body></html>`;
}
