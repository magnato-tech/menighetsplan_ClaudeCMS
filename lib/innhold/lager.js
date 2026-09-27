// Lagring av sider (filbasert implementasjon)
// Grensesnitt: listSider(), hentSide(slug), lagreSide(side), slettSide(slug)

import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const SLUG_REGEX = /^[a-z0-9-]+$/;

// Generer kort, tilfeldig, unik ID
function genererBlockId() {
  return randomUUID().slice(0, 8);
}

// Fyll inn modellVersjon og blokk-ID hvis de mangler
function normaliserSide(side) {
  const kopi = { ...side };
  if (!kopi.modellVersjon) {
    kopi.modellVersjon = 1;
  }
  if (kopi.blokker && Array.isArray(kopi.blokker)) {
    kopi.blokker = kopi.blokker.map(blokk => ({
      ...blokk,
      id: blokk.id || genererBlockId()
    }));
  }
  return kopi;
}

export function lagOpprettLager(mappen) {
  const siderDir = path.join(mappen, 'sider');

  async function listSider() {
    if (!existsSync(siderDir)) return [];
    const filer = await readdir(siderDir);
    const sider = [];
    for (const fil of filer) {
      if (!fil.endsWith('.json')) continue;
      try {
        const innhold = await readFile(path.join(siderDir, fil), 'utf8');
        const side = normaliserSide(JSON.parse(innhold));
        sider.push(side);
      } catch (err) {
        console.warn(`Klarte ikke lese ${fil}:`, err.message);
      }
    }
    return sider.sort((a, b) => (a.meny?.rekkefolge || 999) - (b.meny?.rekkefolge || 999));
  }

  async function hentSide(slug) {
    if (!SLUG_REGEX.test(slug)) return null;
    const filsti = path.join(siderDir, `${slug}.json`);
    if (!existsSync(filsti)) return null;
    try {
      const innhold = await readFile(filsti, 'utf8');
      return normaliserSide(JSON.parse(innhold));
    } catch (err) {
      console.warn(`Klarte ikke lese side ${slug}:`, err.message);
      return null;
    }
  }

  async function lagreSide(side) {
    if (!SLUG_REGEX.test(side.slug)) throw new Error(`Ugyldig slug: ${side.slug}`);
    await mkdir(siderDir, { recursive: true });
    const filsti = path.join(siderDir, `${side.slug}.json`);
    const normalert = normaliserSide(side);
    await writeFile(filsti, JSON.stringify(normalert, null, 2), 'utf8');
  }

  async function slettSide(slug) {
    if (!SLUG_REGEX.test(slug)) return;
    const filsti = path.join(siderDir, `${slug}.json`);
    try {
      await unlink(filsti);
    } catch (err) {
      // Ignorerer feilen hvis filen ikke finnes
    }
  }

  return { listSider, hentSide, lagreSide, slettSide };
}
