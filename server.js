// Lillesand Misjonskirke – CMS, Sprint 0-skjelett
// Modularisert arkitektur: lib/arrangementer.js, lib/innhold/lager.js, lib/visning/*.js

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lagOpprettArrangementer } from './lib/arrangementer.js';
import { lagOpprettGrupper } from './lib/grupper.js';
import { lagOpprettLager } from './lib/innhold/lager.js';
import { lagOpprettOverstyringer } from './lib/innhold/overstyringer.js';
import { lagOpprettOmdirigeringer } from './lib/innhold/omdirigeringer.js';
import { lagOpprettBilder } from './lib/innhold/bilder.js';
import { renderForside } from './lib/visning/forside.js';
import { renderSide } from './lib/visning/side.js';
import { renderBliMed } from './lib/visning/bli-med.js';
import { renderDebug } from './lib/visning/debug.js';
import { handleAdmin } from './lib/admin/index.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = +(process.env.PORT || 3000);
const KILDE_URL = process.env.MENIGHETSPLAN_API_URL || `http://localhost:${PORT}/mock/api/offentlig/arrangementer`;
// /api/public/all er restriksjonen PO opphevet 2026-09-29 (se CLAUDE.md punkt 14) – men det ekte
// endepunktet krever i dag Google-innlogging (funn samme dag), så mock er fortsatt standard.
const KILDE_URL_GRUPPER = process.env.MENIGHETSPLAN_GRUPPER_API_URL || `http://localhost:${PORT}/mock/api/public/all`;
const ADMIN_PASSORD = process.env.ADMIN_PASSORD || 'admin';

// Initialisering
const arrangementer = lagOpprettArrangementer(ROOT, KILDE_URL);
const grupper = lagOpprettGrupper(ROOT, KILDE_URL_GRUPPER);
const lager = lagOpprettLager(path.join(ROOT, 'innhold'));
const overstyringer = lagOpprettOverstyringer(path.join(ROOT, 'innhold'));
const omdirigeringer = lagOpprettOmdirigeringer(path.join(ROOT, 'innhold'));
const bilder = lagOpprettBilder(path.join(ROOT, 'innhold'));

// ---------- Server ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    // Mock API for Menighetsplan
    if (url.pathname === '/mock/api/offentlig/arrangementer' || url.pathname === '/mock/api/public/all') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(await readFile(path.join(ROOT, 'data', 'menighetsplan-mock.json')));
    }

    // Logo
    if (url.pathname === '/logo.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(await readFile(path.join(ROOT, 'public', 'logo.svg')));
    }

    // Hero carousel images
    const heroMatch = url.pathname.match(/^\/hero-([123])\.svg$/);
    if (heroMatch) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(await readFile(path.join(ROOT, 'public', `hero-${heroMatch[1]}.svg`)));
    }

    // Opplastede bilder
    const bildeMatch = url.pathname.match(/^\/bilder\/([a-z0-9]+\.(jpg|jpeg|png|webp|gif))$/i);
    if (bildeMatch) {
      const filnavn = bildeMatch[1];
      const ext = bildeMatch[2].toLowerCase();
      const contentTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif'
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      try {
        const data = await readFile(bilder.bildesti(filnavn));
        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(data);
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Bildet finnes ikke');
      }
    }

    // JSON API for arrangementer
    if (url.pathname === '/api/arrangementer') {
      const now = Date.now();
      const to = now + 120 * 86400000;
      const data = arrangementer.hentData(now, to);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ hentet: arrangementer.state.fetchedAt, feil: arrangementer.state.error, kilde: arrangementer.adapter.navn, arrangementer: data.forekomster }, null, 2));
    }

    // Forside
    if (url.pathname === '/') {
      if (url.searchParams.has('oppdater')) await arrangementer.refresh();
      const now = Date.now();
      const to = now + 120 * 86400000;
      const data = arrangementer.hentData(now, to);
      const menySider = await lager.listSider();
      const visning = url.searchParams.get('visning') || 'alle';
      const alle = await overstyringer.hentAlle();
      const html = renderForside({ forekomster: data.forekomster, state: arrangementer.state, adapter: arrangementer.adapter }, menySider, visning, alle);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // Bli med (tjenestegrupper og husfellesskap)
    if (url.pathname === '/bli-med') {
      if (url.searchParams.has('oppdater')) await grupper.refresh();
      const data = grupper.hentData();
      const menySider = await lager.listSider();
      const html = renderBliMed(data, menySider);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // Debug-side
    if (url.pathname === '/debug') {
      if (url.searchParams.has('oppdater')) await arrangementer.refresh();
      const now = Date.now();
      const to = now + 120 * 86400000;
      const data = arrangementer.hentData(now, to);
      const html = renderDebug({ forekomster: data.forekomster, raa: data.raa, state: arrangementer.state }, arrangementer.adapter, KILDE_URL);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // Admin-ruter
    if (url.pathname.startsWith('/admin')) {
      return handleAdmin(req, res, url, lager, overstyringer, arrangementer, bilder, ADMIN_PASSORD, grupper);
    }

    // Faste sider
    const slug = url.pathname.slice(1);
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      const side = await lager.hentSide(slug);
      if (side) {
        const menySider = await lager.listSider();
        const html = renderSide(side, menySider);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
    }

    // Omdirigeringer (gamle URL-er → nye)
    const omdirigMap = await omdirigeringer.hentOmdirigeringer();
    const omdirigerTil = omdirigMap[url.pathname];
    if (omdirigerTil) {
      res.writeHead(301, { 'Location': omdirigerTil });
      return res.end();
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    const menySider = await lager.listSider();
    const notFoundHtml = renderSide({ slug: '', tittel: 'Fant ikke siden', blokker: [] }, menySider);
    return res.end(notFoundHtml);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Noe gikk galt: ' + err.message);
  }
});

server.listen(PORT, async () => {
  console.log(`Lillesand Misjonskirke CMS kjører på http://localhost:${PORT}`);
  await arrangementer.refresh();
  await grupper.refresh();
  const REFRESH_MIN = +(process.env.REFRESH_MINUTES || 15);
  setInterval(() => arrangementer.refresh(), REFRESH_MIN * 60000);
  setInterval(() => grupper.refresh(), REFRESH_MIN * 60000);
});
