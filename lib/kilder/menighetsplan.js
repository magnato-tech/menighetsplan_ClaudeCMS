// Adapter: Menighetsplan-appen sitt offentlige API (kontrakt v1, se INTEGRASJON-MENIGHETSPLAN.md).
// CMS-et er en egen modul og kjenner bare denne kontrakten – ikke databasen bak appen.

export const navn = 'Menighetsplan-API';
export const STOTTET_VERSJON = 1;

export function tolk(tekst, fra, til, _opts) {
  let data;
  try { data = JSON.parse(tekst); } catch { throw new Error(tekst.trimStart().startsWith('<') ? 'Menighetsplan svarte med en nettside i stedet for data – har appen fått endepunktet /api/offentlig/arrangementer ennå?' : 'Svaret fra Menighetsplan er ikke gyldig JSON.'); }
  if (data?.versjon !== STOTTET_VERSJON) {
    throw new Error(`Menighetsplan-API har versjon ${data?.versjon ?? 'ukjent'}, CMS-et forstår versjon ${STOTTET_VERSJON}.`);
  }
  if (!Array.isArray(data.arrangementer)) throw new Error('Svaret fra Menighetsplan mangler listen «arrangementer».');

  const forekomster = [];
  for (const a of data.arrangementer) {
    const startUtc = Date.parse(a.start);
    const endUtc = a.slutt ? Date.parse(a.slutt) : startUtc;
    if (Number.isNaN(startUtc)) continue; // hopp over ugyldige rader i stedet for å velte hele siden
    if (endUtc < fra || startUtc >= til) continue;
    const erGudstjeneste = a.type === 'gudstjeneste';
    const tagger = (a.tagger || []).map(t => t.verdi).filter(Boolean);
    forekomster.push({
      kilde: 'menighetsplan',
      uid: a.id,
      summary: a.tittel || (erGudstjeneste ? 'Gudstjeneste' : ''),
      description: [a.tema && erGudstjeneste && a.tema !== a.tittel ? `Tema: ${a.tema}` : '', a.bibeltekst ? `Tekst: ${a.bibeltekst}` : '', a.beskrivelse || ''].filter(Boolean).join('\n'),
      location: a.sted || '',
      categories: [...(erGudstjeneste ? ['Gudstjeneste'] : []), ...tagger],
      klass: 'PUBLIC',
      allDay: !!a.heldag,
      timezone: 'Europe/Oslo',
      startUtc, endUtc,
      status: a.status === 'avlyst' ? 'AVLYST' : 'BEKREFTET',
      flag: a.status === 'avlyst' ? 'avlyst i Menighetsplan' : '',
      originalStart: null,
      rrule: '',
      erGudstjeneste,
    });
  }
  forekomster.sort((x, y) => x.startUtc - y.startUtc);
  return {
    antall: data.arrangementer.length,
    forekomster,
    raa: data.arrangementer.map(a => ({ id: a.id, tittel: a.tittel, felt: Object.entries(a).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]) })),
  };
}
