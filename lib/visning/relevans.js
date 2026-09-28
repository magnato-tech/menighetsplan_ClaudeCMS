// Filtrering og relevanssortering av arrangementer

const SEKUNDER_PER_DAG = 86400;
const DAG_MS = SEKUNDER_PER_DAG * 1000;

/**
 * Filtrer forekomster basert på visningsvalg.
 * @param {Array} forekomster - liste over forekomster
 * @param {string} visning - 'alle' eller 'gudstjenester'
 * @returns {Array} filtrert liste
 */
export function filtrerForekomster(forekomster, visning) {
  if (visning === 'gudstjenester') {
    return forekomster.filter(o => o.erGudstjeneste);
  }
  return forekomster;
}

/**
 * Hent arrangementer som starter innen de neste 7 dagene.
 * @param {Array} forekomster - liste over forekomster
 * @param {number} now - millisekunder siden epoch (gjør testbare ved å sende inn parameter)
 * @returns {Array} arrangementer innen 7 dager, sortert kronologisk
 */
export function hentDenneUken(forekomster, now) {
  const seksDAgerFrem = now + 7 * DAG_MS;
  const filtered = forekomster.filter(o => o.startUtc >= now && o.startUtc < seksDAgerFrem);
  return filtered.sort((a, b) => a.startUtc - b.startUtc);
}

/**
 * Vis kategori-tags på arrangementet, uten å doble 'Gudstjeneste'.
 * @param {Object} o - forekomst
 * @returns {Array} kategori-strenger som skal vises som tags
 */
export function hentKategorierForVising(o) {
  if (!Array.isArray(o.categories)) return [];
  return o.categories.filter(cat => cat !== 'Gudstjeneste');
}

/**
 * Anvend overstyringer på forekomster.
 * Returnerer { fremhevede, resten } der:
 * - fremhevede: arrangementer med fremhevet:true (og IKKE skjult:true)
 * - resten: alle andre MINUS de som er skjult:true
 * @param {Array} forekomster - liste over forekomster
 * @param {Object} overstyringer - map keyet på uid { uid: { fremhevet, skjult }, ... }
 * @returns {Object} { fremhevede, resten }
 */
export function anvendOverstyringer(forekomster, overstyringer = {}) {
  const fremhevede = [];
  const resten = [];

  for (const o of forekomster) {
    const override = overstyringer[o.uid] || {};

    // Hvis skjult, hopp over helt (vises ikke noe sted)
    if (override.skjult) {
      continue;
    }

    // Hvis fremhevet (og ikke skjult), legg i fremhevede
    if (override.fremhevet) {
      fremhevede.push({ ...o, bilde: override.bilde || null });
    } else {
      // Ellers i resten
      resten.push(o);
    }
  }

  return { fremhevede, resten };
}
