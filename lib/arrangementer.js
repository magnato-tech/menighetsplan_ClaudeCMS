// Henting og caching av arrangementer fra Menighetsplan-API

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as menighetsplanKilde from './kilder/menighetsplan.js';

const TZ = 'Europe/Oslo';
const REFRESH_MIN = +(process.env.REFRESH_MINUTES || 15);

export function lagOpprettArrangementer(ROOT, KILDE_URL) {
  const adapter = menighetsplanKilde;
  // Ligger under innhold/ (ikke data/) fordi det er innhold/ som er montert som
  // persistent disk på Render (render.yaml) - data/ overlever ikke en omstart der.
  const CACHE_FILE = path.join(ROOT, 'innhold', 'cache', 'siste-vellykkede.json');

  const state = { tekst: null, fetchedAt: null, error: null, fromCache: false };

  async function refresh() {
    try {
      const res = await fetch(KILDE_URL, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Kilden svarte med HTTP ${res.status}`);
      const tekst = await res.text();
      const { antall } = adapter.tolk(tekst, 0, 1); // validerer formatet før vi godtar det
      Object.assign(state, { tekst, fetchedAt: new Date(), error: null, fromCache: false });
      await mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await writeFile(CACHE_FILE, tekst, 'utf8');
      console.log(`[${new Date().toLocaleString('nb-NO')}] Hentet ${antall} oppføringer fra ${adapter.navn}.`);
    } catch (err) {
      state.error = err.name === 'TimeoutError' ? 'kilden svarte ikke innen 15 sekunder' : err.message === 'fetch failed' ? 'fikk ikke kontakt med kilden' : (err.message || String(err));
      console.warn(`Kunne ikke hente fra ${adapter.navn}: ${state.error}`);
      if (!state.tekst && existsSync(CACHE_FILE)) {
        state.tekst = await readFile(CACHE_FILE, 'utf8');
        state.fromCache = true;
      }
    }
  }

  function hentData(from, to) {
    if (!state.tekst) return { antall: 0, forekomster: [], raa: [] };
    try { return adapter.tolk(state.tekst, from, to, { tz: TZ }); }
    catch (err) { state.error = err.message; return { antall: 0, forekomster: [], raa: [] }; }
  }

  return { state, refresh, hentData, adapter };
}

export const TZ_CONST = TZ;
