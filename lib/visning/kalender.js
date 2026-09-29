// Kalenderlogikk for månedsvisning

const TZ = 'Europe/Oslo';
const DAG_MS = 86400000;

/**
 * Hent dagens dato i gitt tidssone som en dato-streng (YYYY-MM-DD).
 * @param {number} nowMs - millisekunder siden epoch (for testbarhet)
 * @returns {string} YYYY-MM-DD
 */
export function getDagsDatoString(nowMs) {
  const d = new Date(nowMs);
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).split('-');
  return parts.join('-');
}

/**
 * Hent dato-streng fra en Date i gitt tidssone.
 * @param {Date} dato - Date-objekt
 * @param {string} tz - tidssone, standard Europe/Oslo
 * @returns {string} YYYY-MM-DD
 */
export function getDatoString(dato, tz = TZ) {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dato).split('-');
  return parts.join('-');
}

/**
 * Hent måned og år fra millisekunder.
 * @param {number} ms - millisekunder siden epoch
 * @returns {{ar: number, maned: number}} år og måned (1-12)
 */
export function getAarManed(ms) {
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(d).split('-');
  return { ar: parseInt(parts[0], 10), maned: parseInt(parts[1], 10) };
}

/**
 * Bygger en kalender-grid for gitt måned.
 * @param {number} ar - år (f.eks. 2026)
 * @param {number} maned - måned (1-12, hvor JANUAR = 1)
 * @param {Array} forekomster - liste over arrangementer med startUtc og andre felt
 * @param {number} nowMs - dagens dato i ms (for testbarhet), standard Date.now()
 * @returns {{uker: Array, manedNavn: string, ar: number}} grid med uker, måned navn og år
 *
 * Hver dag i griddet er: { dato: Date, dagINummer: 1-31, iValgtManed: bool, erIdag: bool, arrangementer: [...] }
 * Hver uke er array med 7 dager (mandag-søndag).
 * Grid inkluderer hele uker som dekker måneden, så kan inkludere dager fra forrige/neste måned.
 */
export function byggKalenderGrid(ar, maned, forekomster, nowMs = Date.now()) {
  const dagsDatoString = getDagsDatoString(nowMs);

  // First day of the month
  const firstDay = new Date(ar, maned - 1, 1);
  // Last day of the month
  const lastDay = new Date(ar, maned, 0);

  // Day of week for first day: 0=Sunday, 1=Monday, ..., 6=Saturday
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Calculate how many days we need to go back to start on a Monday
  // Monday = 1, so if firstDay is Monday (1), daysToGoBack = 0
  // If firstDay is Sunday (0), daysToGoBack = 6
  const daysToGoBack = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Build a map of arrangements by date (YYYY-MM-DD)
  const arrangementsByDate = new Map();
  for (const evt of forekomster) {
    const datoString = getDatoString(new Date(evt.startUtc), TZ);
    if (!arrangementsByDate.has(datoString)) {
      arrangementsByDate.set(datoString, []);
    }
    arrangementsByDate.get(datoString).push(evt);
  }

  // Sort arrangements within each date chronologically
  for (const arr of arrangementsByDate.values()) {
    arr.sort((a, b) => a.startUtc - b.startUtc);
  }

  // Build the grid
  const uker = [];
  let currentDate = new Date(firstDay);
  currentDate.setDate(currentDate.getDate() - daysToGoBack);

  // We'll stop when we've completed a week that includes the last day of the month
  // and we're past it
  let hasPassedLastDay = false;

  while (!hasPassedLastDay || currentDate.getDay() !== 1) {
    // 1 = Monday, so we stop after the week that contains the last day
    const uke = [];

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      // We want Monday first in our grid, but Date.getDay() has Sunday = 0
      // So we need to adjust: JavaScript Monday=1, but we want it first in our array
      const dato = new Date(currentDate);
      const dagINummer = dato.getDate();
      const datoString = getDatoString(dato, TZ);
      const iValgtManed = dato.getMonth() === maned - 1;
      const erIdag = datoString === dagsDatoString;

      const arrangementer = arrangementsByDate.get(datoString) || [];

      uke.push({
        dato: new Date(dato), // clone to avoid mutation
        dagINummer,
        iValgtManed,
        erIdag,
        arrangementer: [...arrangementer], // clone array
      });

      // Check if we've passed the last day of the month
      if (
        iValgtManed &&
        dagINummer === daysInMonth
      ) {
        hasPassedLastDay = true;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    uker.push(uke);
  }

  // Get month name in Norwegian
  const manedNavnLower = new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, month: 'long' }).format(new Date(ar, maned - 1, 1));
  const manedNavn = manedNavnLower.charAt(0).toUpperCase() + manedNavnLower.slice(1);

  return {
    uker,
    manedNavn,
    ar,
  };
}

/**
 * Parse year-month string (YYYY-MM) and return {ar, maned} or null if invalid.
 * @param {string} s - YYYY-MM format
 * @returns {{ar: number, maned: number}|null}
 */
export function parseYearMonth(s) {
  if (!s || typeof s !== 'string') return null;
  const match = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const ar = parseInt(match[1], 10);
  const maned = parseInt(match[2], 10);
  if (maned < 1 || maned > 12) return null;
  return { ar, maned };
}

/**
 * Get current month in YYYY-MM format (in Europe/Oslo timezone).
 * @param {number} nowMs - millisekunder siden epoch
 * @returns {string} YYYY-MM
 */
export function getCurrentYearMonth(nowMs = Date.now()) {
  const { ar, maned } = getAarManed(nowMs);
  return `${ar}-${String(maned).padStart(2, '0')}`;
}

/**
 * Calculate next month from YYYY-MM string.
 * @param {string} aarManed - YYYY-MM format
 * @returns {string} YYYY-MM for next month
 */
export function getNextMonth(aarManed) {
  const parsed = parseYearMonth(aarManed);
  if (!parsed) return aarManed;
  let { ar, maned } = parsed;
  maned++;
  if (maned > 12) {
    maned = 1;
    ar++;
  }
  return `${ar}-${String(maned).padStart(2, '0')}`;
}

/**
 * Calculate previous month from YYYY-MM string.
 * @param {string} aarManed - YYYY-MM format
 * @returns {string} YYYY-MM for previous month
 */
export function getPrevMonth(aarManed) {
  const parsed = parseYearMonth(aarManed);
  if (!parsed) return aarManed;
  let { ar, maned } = parsed;
  maned--;
  if (maned < 1) {
    maned = 12;
    ar--;
  }
  return `${ar}-${String(maned).padStart(2, '0')}`;
}
