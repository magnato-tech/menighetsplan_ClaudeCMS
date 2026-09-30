import { describe, it, expect } from 'vitest'
import { statusForAktivitet, grupperPerManed, sorterManedsnokler } from '@/lib/aktivitetStatus'
import type { Aktiviteter, Oppgaver, Tildelinger } from '@/payload-types'

describe('aktivitetStatus: statusForAktivitet', () => {
  it('returnerer null når aktiviteten ikke har noen oppgaver', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 6, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    expect(statusForAktivitet(99, oppgaver, tildelinger)).toBeNull()
  })

  it('returnerer {label: "Dekket", klasse: "tag-dekket"} når alle oppgaver er confirmed', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
  })

  it('returnerer {label: "Dekket", klasse: "tag-dekket"} når alle oppgaver har bekreftede tildelinger', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'assigned', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'assigned', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger = [
      { id: 101, oppgave: 1, svar: 'confirmed' } as unknown as Tildelinger,
      { id: 102, oppgave: 2, svar: 'confirmed' } as unknown as Tildelinger,
    ]

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
  })

  it('returnerer {label: "Mangler 1", klasse: "tag-mangler"} når 1 oppgave er open', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
  })

  it('returnerer {label: "Mangler 1", klasse: "tag-mangler"} når 1 oppgave er vacant', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'vacant', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
  })

  it('returnerer {label: "Mangler 2", klasse: "tag-mangler"} når 2 oppgaver er open/vacant', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'vacant', gruppe: 1 } as unknown as Oppgaver,
      { id: 3, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Mangler 2', klasse: 'tag-mangler' })
  })

  it('returnerer {label: "Forfall", klasse: "tag-forfall"} når minst én tildeling har svar withdrawn', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger = [{ id: 101, oppgave: 1, svar: 'withdrawn' } as unknown as Tildelinger]

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Forfall', klasse: 'tag-forfall' })
  })

  it('prioriterer "Forfall" over "Mangler" selv om andre oppgaver mangler', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 3, aktivitet: 5, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger = [{ id: 101, oppgave: 2, svar: 'withdrawn' } as unknown as Tildelinger]

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Forfall', klasse: 'tag-forfall' })
  })

  it('håndterer oppgaver med objekt-form aktivitet-ref', () => {
    const oppgaver = [
      { id: 1, aktivitet: { id: 5 }, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: { id: 6 }, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
  })

  it('håndterer tildelinger med objekt-form oppgave-ref', () => {
    const oppgaver = [{ id: 1, aktivitet: 5, status: 'assigned', gruppe: 1 } as unknown as Oppgaver]
    const tildelinger = [{ id: 101, oppgave: { id: 1 }, svar: 'withdrawn' } as unknown as Tildelinger]

    const result = statusForAktivitet(5, oppgaver, tildelinger)
    expect(result).toEqual({ label: 'Forfall', klasse: 'tag-forfall' })
  })

  it('filtrerer oppgaver by aktivitetId korrekt når flere aktiviteter finnes', () => {
    const oppgaver = [
      { id: 1, aktivitet: 5, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 2, aktivitet: 6, status: 'open', gruppe: 1 } as unknown as Oppgaver,
      { id: 3, aktivitet: 6, status: 'confirmed', gruppe: 1 } as unknown as Oppgaver,
    ]
    const tildelinger: Tildelinger[] = []

    // For aktivitet 5: 1 oppgave som er open → Mangler 1
    expect(statusForAktivitet(5, oppgaver, tildelinger)).toEqual({
      label: 'Mangler 1',
      klasse: 'tag-mangler',
    })

    // For aktivitet 6: 1 open + 1 confirmed → Mangler 1
    expect(statusForAktivitet(6, oppgaver, tildelinger)).toEqual({
      label: 'Mangler 1',
      klasse: 'tag-mangler',
    })
  })
})

describe('aktivitetStatus: grupperPerManed', () => {
  it('grupperer aktiviteter per måned med stor forbokstav', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Aktivitet 1', start: '2026-09-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Aktivitet 2', start: '2026-09-22T11:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const result = grupperPerManed(aktiviteter)
    const nokler = Object.keys(result)

    expect(nokler).toHaveLength(1)
    expect(nokler[0]).toMatch(/^[A-Z]/) // Stor forbokstav
    expect(nokler[0]).toContain('2026')
  })

  it('grupperer aktiviteter fra samme måned sammen', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Aktivitet 1', start: '2026-09-05T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Aktivitet 2', start: '2026-09-15T11:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'Aktivitet 3', start: '2026-09-25T12:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const result = grupperPerManed(aktiviteter)
    const nokler = Object.keys(result)

    expect(nokler).toHaveLength(1)
    expect(result[nokler[0]]).toHaveLength(3)
  })

  it('separerer aktiviteter fra ulike måneder i ulike grupper', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Sep', start: '2026-09-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Okt', start: '2026-10-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'Nov', start: '2026-11-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const result = grupperPerManed(aktiviteter)
    const nokler = Object.keys(result)

    expect(nokler).toHaveLength(3)
    nokler.forEach((nokkel) => {
      expect(result[nokkel]).toHaveLength(1)
    })
  })

  it('returnerer tom objekt når ingen aktiviteter finnes', () => {
    const result = grupperPerManed([])
    expect(result).toEqual({})
  })

  it('formaterer måneder på norsk med stor forbokstav', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Aktivitet', start: '2026-01-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const result = grupperPerManed(aktiviteter)
    const nokler = Object.keys(result)

    // Første bokstav skal være stor
    expect(nokler[0].charAt(0)).toBe(nokler[0].charAt(0).toUpperCase())
    // Skal inneholde år
    expect(nokler[0]).toContain('2026')
  })

  it('grupperer korrekt når alle aktiviteter er fra samme måned', () => {
    const aktiviteter = [
      { id: 1, tittel: 'A1', start: '2026-12-01T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'A2', start: '2026-12-10T11:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'A3', start: '2026-12-31T12:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const result = grupperPerManed(aktiviteter)
    const nokler = Object.keys(result)

    expect(nokler).toHaveLength(1)
    expect(result[nokler[0]]).toHaveLength(3)
    expect(result[nokler[0]].map((a) => a.id)).toEqual([1, 2, 3])
  })
})

describe('aktivitetStatus: sorterManedsnokler', () => {
  it('sorterer månedsnøkler i kronologisk rekkefølge', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Sep', start: '2026-09-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Oct', start: '2026-10-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'Aug', start: '2026-08-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const gruppert = grupperPerManed(aktiviteter)
    const sortert = sorterManedsnokler(gruppert)

    // Sortert skal være i kronologisk rekkefølge: Aug → Sep → Oct
    const forste = new Date(gruppert[sortert[0]][0].start).getTime()
    const andre = new Date(gruppert[sortert[1]][0].start).getTime()
    const tredje = new Date(gruppert[sortert[2]][0].start).getTime()

    expect(forste).toBeLessThan(andre)
    expect(andre).toBeLessThan(tredje)
  })

  it('returnerer tom liste når gruppert objekt er tomt', () => {
    const result = sorterManedsnokler({})
    expect(result).toEqual([])
  })

  it('returnerer én nokkel når kun én måned finnes', () => {
    const aktiviteter = [
      { id: 1, tittel: 'A1', start: '2026-09-05T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'A2', start: '2026-09-15T11:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const gruppert = grupperPerManed(aktiviteter)
    const sortert = sorterManedsnokler(gruppert)

    expect(sortert).toHaveLength(1)
  })

  it('sorterer 3+ måneder kronologisk selv når de registreres i tilfeldig rekkefølge', () => {
    // Lag aktiviteter i tilfeldig rekkefølge: Feb, Apr, Jan, Mar
    const aktiviteter = [
      { id: 1, tittel: 'Feb', start: '2026-02-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Apr', start: '2026-04-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'Jan', start: '2026-01-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 4, tittel: 'Mar', start: '2026-03-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const gruppert = grupperPerManed(aktiviteter)
    const sortert = sorterManedsnokler(gruppert)

    // Skal være i kronologisk rekkefølge: Jan, Feb, Mar, Apr
    const datoer = sortert.map((nokkel) => new Date(gruppert[nokkel][0].start).getTime())

    expect(datoer[0]).toBeLessThan(datoer[1])
    expect(datoer[1]).toBeLessThan(datoer[2])
    expect(datoer[2]).toBeLessThan(datoer[3])
  })

  it('sorterer korrekt når måneder spenner over flere år', () => {
    const aktiviteter = [
      { id: 1, tittel: 'Des 2025', start: '2025-12-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 2, tittel: 'Jan 2026', start: '2026-01-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
      { id: 3, tittel: 'Feb 2026', start: '2026-02-15T10:00:00Z', gruppe: 1 } as unknown as Aktiviteter,
    ]

    const gruppert = grupperPerManed(aktiviteter)
    const sortert = sorterManedsnokler(gruppert)

    const datoer = sortert.map((nokkel) => new Date(gruppert[nokkel][0].start).getTime())

    expect(datoer[0]).toBeLessThan(datoer[1])
    expect(datoer[1]).toBeLessThan(datoer[2])
  })
})
