// Omdirigering av gamle URL-er til nye (ved overgang fra eRedaktør)
// Grensesnitt: hentOmdirigeringer()

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function lagOpprettOmdirigeringer(mappen) {
  const omdirigeringerFilsti = path.join(mappen, 'omdirigeringer.json');

  async function hentOmdirigeringer() {
    try {
      const innhold = await readFile(omdirigeringerFilsti, 'utf8');
      const map = JSON.parse(innhold);
      // Sikrer at verdien er et objekt med string-nøkler som maps til string-verdier
      if (typeof map !== 'object' || map === null) {
        return {};
      }
      return map;
    } catch (err) {
      // Hvis filen ikke finnes eller ikke kan leses, returnerer tomt objekt
      return {};
    }
  }

  return { hentOmdirigeringer };
}
