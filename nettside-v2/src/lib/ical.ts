export type IcsAktivitet = {
  id: string | number
  tittel: string
  start: string
  slutt?: string | null
  sted?: string | null
  avlyst?: boolean | null
  erGudstjeneste?: boolean | null
}

function escapeIcsText(tekst: string): string {
  return tekst
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(linje: string): string {
  if (linje.length <= 75) return linje
  const deler: string[] = []
  let rest = linje
  let forste = true
  while (rest.length > 0) {
    const lengde = forste ? 75 : 74
    deler.push((forste ? '' : ' ') + rest.slice(0, lengde))
    rest = rest.slice(lengde)
    forste = false
  }
  return deler.join('\r\n')
}

function tilIcsDato(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function genererIcs(aktiviteter: IcsAktivitet[], domene: string): string {
  const naa = tilIcsDato(new Date().toISOString())
  const linjer: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lillesand Misjonskirke//Kalender//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lillesand Misjonskirke',
    'X-WR-TIMEZONE:Europe/Oslo',
  ]

  for (const a of aktiviteter) {
    linjer.push('BEGIN:VEVENT')
    linjer.push(`UID:aktivitet-${a.id}@${domene}`)
    linjer.push(`DTSTAMP:${naa}`)
    linjer.push(`DTSTART:${tilIcsDato(a.start)}`)
    if (a.slutt) linjer.push(`DTEND:${tilIcsDato(a.slutt)}`)
    linjer.push(`SUMMARY:${escapeIcsText(a.tittel)}`)
    if (a.sted) linjer.push(`LOCATION:${escapeIcsText(a.sted)}`)
    if (a.erGudstjeneste) linjer.push('CATEGORIES:Gudstjeneste')
    linjer.push(`STATUS:${a.avlyst ? 'CANCELLED' : 'CONFIRMED'}`)
    linjer.push('END:VEVENT')
  }

  linjer.push('END:VCALENDAR')
  return linjer.map(foldLine).join('\r\n') + '\r\n'
}
