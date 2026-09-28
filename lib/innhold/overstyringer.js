// Lagring av overstyringer for arrangementer (fremhevet, skjult)
// Grensesnitt: hentAlle(), hentForUid(uid), settOverstyring(uid, overstyring)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UID_REGEX = /^[a-z0-9-]+$/i;

export function lagOpprettOverstyringer(mappen) {
  const overstyringerFil = path.join(mappen, 'arrangement-overstyringer.json');

  async function hentAlle() {
    if (!existsSync(overstyringerFil)) return {};
    try {
      const innhold = await readFile(overstyringerFil, 'utf8');
      return JSON.parse(innhold);
    } catch (err) {
      console.warn('Klarte ikke lese overstyringer:', err.message);
      return {};
    }
  }

  async function hentForUid(uid) {
    if (!UID_REGEX.test(uid)) return null;
    const alle = await hentAlle();
    return alle[uid] || null;
  }

  async function lagre(alle) {
    await mkdir(path.dirname(overstyringerFil), { recursive: true });
    await writeFile(overstyringerFil, JSON.stringify(alle, null, 2), 'utf8');
  }

  async function settOverstyring(uid, overstyring) {
    if (!UID_REGEX.test(uid)) throw new Error(`Ugyldig uid: ${uid}`);
    const alle = await hentAlle();

    const bilde = alle[uid]?.bilde;

    // Hvis fremhevet og skjult begge er false og det ikke er noe bilde lagret, fjern fra lageret
    if (overstyring.fremhevet === false && overstyring.skjult === false && !bilde) {
      delete alle[uid];
    } else {
      alle[uid] = {
        fremhevet: !!overstyring.fremhevet,
        skjult: !!overstyring.skjult,
        ...(bilde ? { bilde } : {})
      };
    }

    await lagre(alle);
  }

  // Slår av/på ett felt (fremhevet eller skjult) for én uid med kun én lesing og én skriving
  // av fila (i stedet for hentForUid + settOverstyring, som hver leser fila på nytt).
  async function toggleFelt(uid, felt) {
    if (!UID_REGEX.test(uid)) throw new Error(`Ugyldig uid: ${uid}`);
    const alle = await hentAlle();
    const naavarende = alle[uid] || { fremhevet: false, skjult: false };
    const ny = { ...naavarende, [felt]: !naavarende[felt] };

    if (!ny.fremhevet && !ny.skjult && !ny.bilde) {
      delete alle[uid];
    } else {
      alle[uid] = ny;
    }

    await lagre(alle);
    return ny;
  }

  // Setter (eller fjerner) bilde-filnavn for en uid. Tom/null fjerner bildet.
  async function settBilde(uid, filnavn) {
    if (!UID_REGEX.test(uid)) throw new Error(`Ugyldig uid: ${uid}`);
    const alle = await hentAlle();
    const naavarende = alle[uid] || { fremhevet: false, skjult: false };
    const ny = { ...naavarende };
    if (filnavn) ny.bilde = filnavn;
    else delete ny.bilde;

    if (!ny.fremhevet && !ny.skjult && !ny.bilde) {
      delete alle[uid];
    } else {
      alle[uid] = ny;
    }

    await lagre(alle);
    return ny;
  }

  // Fjerner overstyringer for uid-er som ikke lenger finnes hos Menighetsplan
  // (f.eks. et arrangement som er slettet der). Kalles med settet av uid-er
  // som faktisk finnes i den siste hentingen fra kilden.
  async function ryddOpp(gyldigeUider) {
    const alle = await hentAlle();
    let endret = false;
    for (const uid of Object.keys(alle)) {
      if (!gyldigeUider.has(uid)) {
        delete alle[uid];
        endret = true;
      }
    }
    if (endret) await lagre(alle);
    return alle;
  }

  return { hentAlle, hentForUid, settOverstyring, toggleFelt, settBilde, ryddOpp };
}
