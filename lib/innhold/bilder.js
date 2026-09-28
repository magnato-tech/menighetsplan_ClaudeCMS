// Lagring av opplastede bilder (filbasert, samme mønster som lager.js/overstyringer.js)
// Grensesnitt: lagreBilde(buffer, originalFilnavn) -> filnavn (string)

import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const TILLATTE_ENDELSER = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
export const MAKS_STORRELSE = 5 * 1024 * 1024; // 5 MB

export function lagOpprettBilder(mappen) {
  const bilderDir = path.join(mappen, 'bilder');

  async function lagreBilde(buffer, originalFilnavn) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Ingen fil ble sendt');
    }
    if (buffer.length > MAKS_STORRELSE) {
      throw new Error('Bildet er for stort (maks 5 MB)');
    }
    const endelse = path.extname(originalFilnavn || '').toLowerCase();
    if (!TILLATTE_ENDELSER.includes(endelse)) {
      throw new Error(`Filtype ${endelse || '(ukjent)'} er ikke tillatt. Bruk jpg, png, webp eller gif.`);
    }

    const filnavn = `${randomUUID().slice(0, 8)}${endelse}`;
    await mkdir(bilderDir, { recursive: true });
    await writeFile(path.join(bilderDir, filnavn), buffer);
    return filnavn;
  }

  function bildesti(filnavn) {
    return path.join(bilderDir, filnavn);
  }

  return { lagreBilde, bildesti };
}
