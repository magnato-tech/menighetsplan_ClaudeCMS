import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'

const richText = (tekst: string) => ({
  root: {
    type: 'root',
    children: tekst.split('\n\n').map((avsnitt) => ({
      type: 'paragraph',
      children: [{ type: 'text', text: avsnitt, version: 1 }],
      version: 1,
    })),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

async function finnEllerOpprett<T extends { id: string | number }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<T> {
  const { docs } = await payload.find({ collection: collection as never, where: where as never, limit: 1 })
  if (docs.length > 0) return docs[0] as T
  return (await payload.create({ collection: collection as never, data: data as never })) as T
}

async function main() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  console.log('Sår personer (fra Menighetsplan sin mockData.ts)...')
  const kari = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'users',
    { email: { equals: 'kari.nordmann@eksempel.no' } },
    {
      email: 'kari.nordmann@eksempel.no',
      password: 'endre-meg-123',
      navn: 'Kari Nordmann',
      telefon: '912 34 567',
      globalRolle: 'admin',
    },
  )
  const ola = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'users',
    { email: { equals: 'ola.hansen@eksempel.no' } },
    {
      email: 'ola.hansen@eksempel.no',
      password: 'endre-meg-123',
      navn: 'Ola Hansen',
      telefon: '987 65 432',
      globalRolle: 'member',
    },
  )
  const ingrid = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'users',
    { email: { equals: 'ingrid.berg@eksempel.no' } },
    {
      email: 'ingrid.berg@eksempel.no',
      password: 'endre-meg-123',
      navn: 'Ingrid Berg',
      telefon: '456 78 901',
      globalRolle: 'member',
    },
  )
  const jonas = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'users',
    { email: { equals: 'jonas.lie@eksempel.no' } },
    {
      email: 'jonas.lie@eksempel.no',
      password: 'endre-meg-123',
      navn: 'Jonas Lie',
      telefon: '923 45 678',
      globalRolle: 'member',
    },
  )

  console.log('Sår grupper (tjenestegrupper og husgruppe)...')
  const gruppeLyd = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'grupper',
    { navn: { equals: 'Lyd og bilde' } },
    {
      navn: 'Lyd og bilde',
      kategori: 'tjenestegruppe',
      medlemmer: [kari.id, ola.id],
      ledere: [ola.id],
      varaledere: [kari.id],
      moteplan: { ukedag: 'Søndag', klokkeslett: '09:30', frekvens: 'hver uke' },
    },
  )
  const gruppeKaffe = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'grupper',
    { navn: { equals: 'Kirkekaffe & vertskap' } },
    {
      navn: 'Kirkekaffe & vertskap',
      kategori: 'tjenestegruppe',
      medlemmer: [kari.id, ola.id, jonas.id],
      ledere: [kari.id],
      varaledere: [ola.id],
      moteplan: { ukedag: 'Søndag', klokkeslett: '10:30', frekvens: 'annenhver uke' },
    },
  )
  const gruppeBarn = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'grupper',
    { navn: { equals: 'Søndagsskole & barn' } },
    {
      navn: 'Søndagsskole & barn',
      kategori: 'tjenestegruppe',
      medlemmer: [ingrid.id],
      ledere: [ingrid.id],
      varaledere: [],
      moteplan: { ukedag: 'Søndag', klokkeslett: '11:15', frekvens: 'annenhver uke' },
    },
  )
  const gruppeHus = await finnEllerOpprett<{ id: string | number }>(
    payload,
    'grupper',
    { navn: { equals: 'Husfellesskap Sentrum' } },
    {
      navn: 'Husfellesskap Sentrum',
      kategori: 'husgruppe',
      medlemmer: [kari.id, ola.id, ingrid.id, jonas.id],
      ledere: [ola.id],
      varaledere: [kari.id],
      moteplan: { ukedag: 'Onsdag', klokkeslett: '19:30', frekvens: 'annenhver uke' },
    },
  )

  console.log('Sår aktiviteter (gudstjenester, arrangementer, gruppesamlinger)...')
  type AktData = {
    gruppe: string | number
    tittel: string
    start: string
    slutt?: string
    sted?: string
    type: 'arrangement' | 'gruppesamling'
    tema?: string
    erGudstjeneste?: boolean
    offentlig?: boolean
  }
  const aktiviteterData: AktData[] = [
    {
      gruppe: gruppeHus.id,
      tittel: 'Husfellesskap hos Jonas',
      start: '2026-09-09T19:30:00.000Z',
      slutt: '2026-09-09T21:30:00.000Z',
      sted: 'Hos Jonas Lie (Skogveien 4)',
      type: 'gruppesamling',
      tema: 'Nåde og tilgivelse i hverdagen',
    },
    {
      gruppe: gruppeLyd.id,
      tittel: 'Semesteroppstart & testkveld',
      start: '2026-08-26T18:00:00.000Z',
      slutt: '2026-08-26T20:00:00.000Z',
      sted: 'Hovedsalen',
      type: 'gruppesamling',
    },
    {
      gruppe: gruppeKaffe.id,
      tittel: 'Gudstjeneste & velkomstkaffe',
      start: '2026-08-30T11:00:00.000Z',
      slutt: '2026-08-30T13:00:00.000Z',
      sted: 'Hovedsalen og kafeen',
      type: 'arrangement',
      erGudstjeneste: true,
      offentlig: true,
    },
    {
      gruppe: gruppeKaffe.id,
      tittel: 'Gudstjeneste & dåp',
      start: '2026-09-06T11:00:00.000Z',
      slutt: '2026-09-06T13:00:00.000Z',
      sted: 'Hovedsalen og kafeen',
      type: 'arrangement',
      erGudstjeneste: true,
      offentlig: true,
    },
    {
      gruppe: gruppeBarn.id,
      tittel: 'Søndagsskole semesteroppstart',
      start: '2026-09-06T11:15:00.000Z',
      slutt: '2026-09-06T12:30:00.000Z',
      sted: 'Kjellersalen',
      type: 'arrangement',
    },
    {
      gruppe: gruppeLyd.id,
      tittel: 'Ungdomsmøte & lovsang',
      start: '2026-09-11T19:00:00.000Z',
      slutt: '2026-09-11T21:00:00.000Z',
      sted: 'Ungdomssalen',
      type: 'arrangement',
      offentlig: true,
    },
    {
      gruppe: gruppeKaffe.id,
      tittel: 'Høstgudstjeneste & kirkelunsj',
      start: '2026-09-13T11:00:00.000Z',
      slutt: '2026-09-13T13:00:00.000Z',
      sted: 'Hovedsalen og kafeen',
      type: 'arrangement',
      erGudstjeneste: true,
      offentlig: true,
    },
    {
      gruppe: gruppeLyd.id,
      tittel: 'Lydteknisk opplæring & rigging',
      start: '2026-09-22T19:00:00.000Z',
      slutt: '2026-09-22T21:00:00.000Z',
      sted: 'Hovedsalen',
      type: 'gruppesamling',
    },
    {
      gruppe: gruppeLyd.id,
      tittel: 'Familiegudstjeneste & barnekor',
      start: '2026-09-27T11:00:00.000Z',
      slutt: '2026-09-27T12:30:00.000Z',
      sted: 'Hovedsalen',
      type: 'arrangement',
      erGudstjeneste: true,
      offentlig: true,
    },
  ]

  const aktIder: Record<string, string | number> = {}
  for (const a of aktiviteterData) {
    const opprettet = await finnEllerOpprett<{ id: string | number }>(
      payload,
      'aktiviteter',
      { tittel: { equals: a.tittel }, start: { equals: a.start } },
      {
        gruppe: a.gruppe,
        tittel: a.tittel,
        start: a.start,
        slutt: a.slutt,
        sted: a.sted,
        type: a.type,
        tema: a.tema,
        erGudstjeneste: a.erGudstjeneste || false,
        offentlig: a.offentlig || false,
        avlyst: false,
      },
    )
    aktIder[a.tittel] = opprettet.id
  }

  console.log('Sår oppgaver og tildelinger (dekket/mangler/forfall)...')
  type OppgData = {
    aktivitet: string | number
    gruppe: string | number
    tittel: string
    status: 'open' | 'assigned' | 'confirmed' | 'vacant' | 'cancelled'
    tildeltTil?: string | number
    svar?: 'pending' | 'confirmed' | 'declined' | 'withdrawn'
  }
  const oppgaverData: OppgData[] = [
    {
      aktivitet: aktIder['Semesteroppstart & testkveld'],
      gruppe: gruppeLyd.id,
      tittel: 'Teknisk riggansvarlig',
      status: 'confirmed',
      tildeltTil: ola.id,
      svar: 'confirmed',
    },
    {
      aktivitet: aktIder['Gudstjeneste & velkomstkaffe'],
      gruppe: gruppeKaffe.id,
      tittel: 'Velkomstkaffe vert',
      status: 'confirmed',
      tildeltTil: kari.id,
      svar: 'confirmed',
    },
    {
      aktivitet: aktIder['Gudstjeneste & dåp'],
      gruppe: gruppeLyd.id,
      tittel: 'Lydtekniker søndag',
      status: 'confirmed',
      tildeltTil: ola.id,
      svar: 'confirmed',
    },
    {
      aktivitet: aktIder['Gudstjeneste & dåp'],
      gruppe: gruppeLyd.id,
      tittel: 'Prosjektor & streaming',
      status: 'confirmed',
      tildeltTil: kari.id,
      svar: 'confirmed',
    },
    {
      aktivitet: aktIder['Gudstjeneste & dåp'],
      gruppe: gruppeLyd.id,
      tittel: 'Kamerastyring',
      status: 'vacant',
    },
    {
      aktivitet: aktIder['Ungdomsmøte & lovsang'],
      gruppe: gruppeLyd.id,
      tittel: 'Lovsang med ungdomsbandet',
      status: 'vacant',
    },
    {
      aktivitet: aktIder['Høstgudstjeneste & kirkelunsj'],
      gruppe: gruppeKaffe.id,
      tittel: 'Felles varm høstlunsj i kafeen',
      status: 'vacant',
    },
    {
      aktivitet: aktIder['Familiegudstjeneste & barnekor'],
      gruppe: gruppeLyd.id,
      tittel: 'Barnekor opptreden (flere mikrofoner)',
      status: 'assigned',
      tildeltTil: ola.id,
      svar: 'pending',
    },
    {
      aktivitet: aktIder['Søndagsskole semesteroppstart'],
      gruppe: gruppeBarn.id,
      tittel: 'Lede formingsaktivitet',
      status: 'confirmed',
      tildeltTil: ingrid.id,
      svar: 'confirmed',
    },
  ]

  for (const o of oppgaverData) {
    const oppgave = await finnEllerOpprett<{ id: string | number }>(
      payload,
      'oppgaver',
      { tittel: { equals: o.tittel }, aktivitet: { equals: o.aktivitet } },
      {
        aktivitet: o.aktivitet,
        gruppe: o.gruppe,
        tittel: o.tittel,
        status: o.status,
        antallTrengs: 1,
      },
    )
    if (o.tildeltTil) {
      await finnEllerOpprett(
        payload,
        'tildelinger',
        { oppgave: { equals: oppgave.id }, person: { equals: o.tildeltTil } },
        { oppgave: oppgave.id, person: o.tildeltTil, svar: o.svar || 'pending' },
      )
    }
  }

  console.log('Sår gruppemeldinger...')
  const meldinger = [
    {
      gruppe: gruppeKaffe.id,
      avsender: kari.id,
      innhold:
        'Velkommen til nytt semester i kaffegruppen! Husk å sjekke datoene dine for september og høsten.',
    },
    {
      gruppe: gruppeLyd.id,
      avsender: ola.id,
      innhold: 'Vi har en teknisk opplæringskveld tirsdag 22. september kl. 19:00. Vel møtt!',
    },
    {
      gruppe: gruppeHus.id,
      avsender: ola.id,
      innhold:
        'Gleder meg til høstsemesteret i husfellesskapet vårt! Vi starter opp hos Jonas onsdag 9. september kl. 19:30.',
    },
    {
      gruppe: gruppeHus.id,
      avsender: jonas.id,
      innhold: 'Velkommen hjem til oss! Jeg setter over kaffe og te.',
    },
  ]
  for (const m of meldinger) {
    const { docs } = await payload.find({
      collection: 'gruppemeldinger',
      where: { gruppe: { equals: m.gruppe }, avsender: { equals: m.avsender }, innhold: { equals: m.innhold } },
      limit: 1,
    })
    if (docs.length === 0) {
      await payload.create({ collection: 'gruppemeldinger', data: m })
    }
  }

  console.log('Sår faste sider (om-oss/barn-og-unge/kontakt)...')
  const sider = [
    {
      slug: 'om-oss',
      tittel: 'Om oss',
      rekkefolge: 1,
      tekst:
        'Lillesand Misjonskirke er en del av det globale misjonsarbeidet. Vi fokuserer på å bygge en levende menighet basert på evangeliet.\n\nVi arbeider med både lokale og internasjonale prosjekter for å gjøre en positiv forskjell i verden.',
    },
    {
      slug: 'barn-og-unge',
      tittel: 'Barn og unge',
      rekkefolge: 2,
      tekst:
        'Vi tilbyr aktiviteter for barn og unge fra barnehagealder og oppover. Alle er velkommen til å delta i våre program og arrangementer.',
    },
    {
      slug: 'kontakt',
      tittel: 'Kontakt',
      rekkefolge: 3,
      tekst:
        'Har du spørsmål eller ønsker å komme i kontakt med oss? Vi setter pris på å høre fra deg.\n\nVi holder gudstjenester hver søndag kl. 11:00. Alle er velkomne!',
    },
  ]
  for (const side of sider) {
    const { docs } = await payload.find({ collection: 'sider', where: { slug: { equals: side.slug } }, limit: 1 })
    if (docs.length > 0) continue
    await payload.create({
      collection: 'sider',
      data: {
        tittel: side.tittel,
        slug: side.slug,
        visIMeny: true,
        rekkefolge: side.rekkefolge,
        blokker: [{ blockType: 'tekst', innhold: richText(side.tekst) }],
      },
    })
  }

  console.log('Ferdig.')
  console.log('Admin (globalRolle=admin): kari.nordmann@eksempel.no / endre-meg-123')
  console.log('Gruppeleder-eksempel (leder Lyd og bilde + Kirkekaffe): ola.hansen@eksempel.no / endre-meg-123')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
