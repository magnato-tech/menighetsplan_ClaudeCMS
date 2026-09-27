// Admin-ruting og skjemahåndtering

import { renderSidelistePage, renderRedaktionPage, renderSlettBekreftelse, render401 } from '../visning/admin.js';
import { sjekKAuth } from './auth.js';
import { validateSkjema, validerNySlug } from './validering.js';

// Parse POST-body fra application/x-www-form-urlencoded
async function parsePostBody(req) {
  let body = '';
  return new Promise((resolve, reject) => {
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        resolve(Object.fromEntries(params));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function handleAdmin(req, res, url, lager, passord) {
  // Sjekk auth for alle admin-routes
  if (!sjekKAuth(req, passord)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin"', 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(render401());
  }

  const pathname = url.pathname;
  const method = req.method;

  try {
    // GET /admin – sideliste
    if (pathname === '/admin' && method === 'GET') {
      const sider = await lager.listSider();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderSidelistePage(sider));
    }

    // GET /admin/ny – tomt skjema for ny side
    if (pathname === '/admin/ny' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderRedaktionPage(null, null));
    }

    // POST /admin/ny – opprett ny side
    if (pathname === '/admin/ny' && method === 'POST') {
      const data = await parsePostBody(req);
      const { feil, side } = validateSkjema(data, false, lager);

      if (feil) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderRedaktionPage(data, feil));
      }

      // Sjekk at slug ikke allerede finnes
      const slugOk = await validerNySlug(side.slug, lager);
      if (!slugOk) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderRedaktionPage(data, 'Slug finnes allerede'));
      }

      await lager.lagreSide(side);
      res.writeHead(303, { 'Location': '/admin' });
      return res.end();
    }

    // GET /admin/rediger/<slug> – skjema med eksisterende data
    const redigerMatch = pathname.match(/^\/admin\/rediger\/([a-z0-9-]+)$/);
    if (redigerMatch && method === 'GET') {
      const slug = redigerMatch[1];
      const side = await lager.hentSide(slug);
      if (!side) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderRedaktionPage(null, 'Siden finnes ikke'));
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderRedaktionPage(side, null));
    }

    // POST /admin/rediger/<slug> – oppdater side
    if (redigerMatch && method === 'POST') {
      const slug = redigerMatch[1];
      const eksisterende = await lager.hentSide(slug);
      if (!eksisterende) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('Siden finnes ikke');
      }

      const data = await parsePostBody(req);
      data.slug = slug; // Slug er låst

      const { feil, side } = validateSkjema(data, true, lager);

      if (feil) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderRedaktionPage(data, feil));
      }

      await lager.lagreSide(side);
      res.writeHead(303, { 'Location': '/admin' });
      return res.end();
    }

    // GET /admin/slett/<slug> – bekreftelsesside
    const slettMatch = pathname.match(/^\/admin\/slett\/([a-z0-9-]+)$/);
    if (slettMatch && method === 'GET') {
      const slug = slettMatch[1];
      const side = await lager.hentSide(slug);
      if (!side) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('Siden finnes ikke');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderSlettBekreftelse(side));
    }

    // POST /admin/slett/<slug> – slett side
    if (slettMatch && method === 'POST') {
      const slug = slettMatch[1];
      await lager.slettSide(slug);
      res.writeHead(303, { 'Location': '/admin' });
      return res.end();
    }

    // Ingen match
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Admin-side ikke funnet');

  } catch (err) {
    console.error('Admin-feil:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Noe gikk galt: ' + err.message);
  }
}
