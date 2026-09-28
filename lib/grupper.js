// Henting og caching av tjenestegrupper og husfellesskap fra Menighetsplan-API (/api/public/all)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as menighetsplanKilde from './kilder/menighetsplan.js';

export function lagOpprettGrupper(ROOT, KILDE_URL) {
  const adapter = menighetsplanKilde;
  // Under innhold/cache/ (ikke data/) av samme grunn som lib/arrangementer.js:
  // innhold/ er det som er montert som persistent disk på Render.
  const CACHE_FILE = path.join(ROOT, 'innhold', 'cache', 'siste-vellykkede-grupper.json');

  const state = { tekst: null, fetchedAt: null, error: null, fromCache: false };

  async function refresh() {
    try {
      const res = await fetch(KILDE_URL, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Kilden svarte med HTTP ${res.status}`);
      const tekst = await res.text();
      const { antall } = adapter.tolkGrupper(tekst); // validerer formatet før vi godtar det
      Object.assign(state, { tekst, fetchedAt: new Date(), error: null, fromCache: false });
      await mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await writeFile(CACHE_FILE, tekst, 'utf8');
      console.log(`[${new Date().toLocaleString('nb-NO')}] Hentet ${antall} grupper fra ${adapter.navn}.`);
    } catch (err) {
      state.error = err.name === 'TimeoutError' ? 'kilden svarte ikke innen 15 sekunder' : err.message === 'fetch failed' ? 'fikk ikke kontakt med kilden' : (err.message || String(err));
      console.warn(`Kunne ikke hente grupper fra ${adapter.navn}: ${state.error}`);
      if (!state.tekst && existsSync(CACHE_FILE)) {
        state.tekst = await readFile(CACHE_FILE, 'utf8');
        state.fromCache = true;
      }
    }
  }

  function hentData() {
    if (!state.tekst) return { antall: 0, grupper: [] };
    try { return adapter.tolkGrupper(state.tekst); }
    catch (err) { state.error = err.message; return { antall: 0, grupper: [] }; }
  }

  return { state, refresh, hentData, adapter };
}
