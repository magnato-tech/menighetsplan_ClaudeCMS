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

async function main() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  console.log('Sår admin-bruker...')
  const finnesFra = await payload.find({ collection: 'users', limit: 1 })
  let adminId: string | number | undefined
  if (finnesFra.docs.length === 0) {
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@lillesandmisjonskirke.no',
        password: 'endre-meg-123',
        navn: 'Administrator',
        roller: ['administrasjon', 'lederskap'],
      },
    })
    adminId = admin.id
  } else {
    adminId = finnesFra.docs[0].id
  }

  console.log('Sår gruppeleder...')
  const { docs: eksisterendeGruppeleder } = await payload.find({
    collection: 'users',
    where: { email: { equals: 'gruppeleder@lillesandmisjonskirke.no' } },
    limit: 1,
  })
  const gruppeleder =
    eksisterendeGruppeleder[0] ||
    (await payload.create({
      collection: 'users',
      data: {
        email: 'gruppeleder@lillesandmisjonskirke.no',
        password: 'endre-meg-123',
        navn: 'Kari Gruppeleder',
        roller: ['gruppeleder', 'medlem'],
      },
    }))

  console.log('Sår grupper...')
  const { docs: eksisterendeGrupper } = await payload.find({ collection: 'grupper', limit: 1 })
  if (eksisterendeGrupper.length === 0) {
    await payload.create({
      collection: 'grupper',
      data: {
        navn: 'Lovsangsteamet',
        type: 'tjenestegruppe',
        beskrivelse: 'Ansvarlig for musikk og lovsang på gudstjenester.',
        gruppeleder: gruppeleder.id,
        medlemmer: [gruppeleder.id],
      },
    })
    await payload.create({
      collection: 'grupper',
      data: {
        navn: 'Husgruppe sentrum',
        type: 'husgruppe',
        beskrivelse: 'Samles annenhver tirsdag i sentrum.',
        gruppeleder: gruppeleder.id,
        medlemmer: [gruppeleder.id],
      },
    })
  }

  console.log('Sår sider...')
  const sider = [
    {
      slug: 'om-oss',
      tittel: 'Om oss',
      rekkefolge: 1,
      tekst:
        'Lillesand Misjonskirke er en del av det globale misjonsarbeidet. Vi fokuserer på å bygge en levende menighet basert på evangeliet.\n\nVårt fokus:\n- Prediking og bibelstudie\n- Diakoni og hjelp til nødlidende\n- Misjon og evangelisering\n- Menighetsfellesskap\n\nVi arbeider med både lokale og internasjonale prosjekter for å gjøre en positiv forskjell i verden.',
    },
    {
      slug: 'barn-og-unge',
      tittel: 'Barn og unge',
      rekkefolge: 2,
      tekst:
        'Vi tilbyr aktiviteter for barn og unge fra barnehagealder og oppover. Alle er velkommen til å delta i våre program og arrangementer.\n\nAktiviteter:\n- Søndagsskole for barn\n- Ungdomsgruppe på fredager\n- Sommerleirsamling\n- Bibelstudie og spirituell dybde\n\nTakk for at dere tar del i menighetslivet vårt! For mer informasjon, kontakt oss på kontakt@lillesand-misjon.no',
    },
    {
      slug: 'kontakt',
      tittel: 'Kontakt',
      rekkefolge: 3,
      tekst:
        'Har du spørsmål eller ønsker å komme i kontakt med oss? Vi setter pris på å høre fra deg.\n\nKontaktinformasjon:\nE-post: kontakt@lillesand-misjon.no\nTelefon: +47 37 27 03 80\nAdresse: Lillesand Misjonskirke, Lillesand, Norge\n\nVi holder gudstjenester hver søndag kl. 11:00. Alle er velkomne!',
    },
  ]

  for (const side of sider) {
    const { docs: eksisterende } = await payload.find({
      collection: 'sider',
      where: { slug: { equals: side.slug } },
      limit: 1,
    })
    if (eksisterende.length > 0) continue
    await payload.create({
      collection: 'sider',
      data: {
        tittel: side.tittel,
        slug: side.slug,
        visIMeny: true,
        rekkefolge: side.rekkefolge,
        blokker: [
          {
            blockType: 'tekst',
            innhold: richText(side.tekst),
          },
        ],
      },
    })
  }

  console.log('Sår aktiviteter...')
  const aktiviteter = [
    {
      tittel: 'Gudstjeneste',
      type: 'gudstjeneste' as const,
      datoStart: '2026-10-04T09:00:00.000Z',
      datoSlutt: '2026-10-04T10:30:00.000Z',
      sted: 'Lillesand Misjonskirke',
      beskrivelse: 'Tema: Guds rike er nær. Tekst: Mark 1,14–15',
      status: 'planlagt' as const,
    },
    {
      tittel: 'Gudstjeneste',
      type: 'gudstjeneste' as const,
      datoStart: '2026-10-11T09:00:00.000Z',
      datoSlutt: '2026-10-11T10:30:00.000Z',
      sted: 'Lillesand Misjonskirke',
      beskrivelse: 'Tema: Tro i hverdagen. Tekst: Jak 2,14–17',
      status: 'planlagt' as const,
    },
    {
      tittel: 'Høstbasar',
      type: 'arrangement' as const,
      datoStart: '2026-10-24T10:00:00.000Z',
      datoSlutt: '2026-10-24T13:00:00.000Z',
      sted: 'Lillesand Misjonskirke',
      beskrivelse: 'Loddsalg, kafé og aktiviteter for barna.',
      status: 'avlyst' as const,
      tagger: ['Familie'],
    },
    {
      tittel: 'Familiegudstjeneste',
      type: 'gudstjeneste' as const,
      datoStart: '2026-11-01T10:00:00.000Z',
      datoSlutt: '2026-11-01T11:15:00.000Z',
      sted: 'Lillesand Misjonskirke',
      beskrivelse: 'Tema: Takk for maten',
      status: 'planlagt' as const,
    },
    {
      tittel: 'Kulturnatta',
      type: 'arrangement' as const,
      datoStart: '2026-11-13T17:00:00.000Z',
      datoSlutt: '2026-11-13T21:00:00.000Z',
      sted: 'Lillesand Misjonskirke',
      beskrivelse: 'Åpen kirke med konsert og kveldsmat.',
      status: 'planlagt' as const,
      tagger: ['Konsert'],
    },
  ]

  const opprettedeAktiviteter: (string | number)[] = []
  for (const a of aktiviteter) {
    const { docs: eksisterende } = await payload.find({
      collection: 'aktiviteter',
      where: { tittel: { equals: a.tittel }, datoStart: { equals: a.datoStart } },
      limit: 1,
    })
    if (eksisterende.length > 0) {
      opprettedeAktiviteter.push(eksisterende[0].id)
      continue
    }
    const opprettet = await payload.create({
      collection: 'aktiviteter',
      data: {
        tittel: a.tittel,
        type: a.type,
        datoStart: a.datoStart,
        datoSlutt: a.datoSlutt,
        sted: a.sted,
        beskrivelse: a.beskrivelse,
        ansvarlig: adminId,
        offentlig: true,
        status: a.status,
        tagger: (a.tagger || []).map((verdi) => ({ verdi })),
      },
    })
    opprettedeAktiviteter.push(opprettet.id)
  }

  console.log('Sår oppgaver...')
  if (opprettedeAktiviteter[0]) {
    const { docs: eksisterendeOppgaver } = await payload.find({ collection: 'oppgaver', limit: 1 })
    if (eksisterendeOppgaver.length === 0) {
      await payload.create({
        collection: 'oppgaver',
        data: {
          tittel: 'Lovsangsleder',
          aktivitet: opprettedeAktiviteter[0],
          tildeltTil: gruppeleder.id,
          status: 'bemannet',
        },
      })
      await payload.create({
        collection: 'oppgaver',
        data: {
          tittel: 'Tekniker (lyd/bilde)',
          aktivitet: opprettedeAktiviteter[0],
          status: 'ledig',
        },
      })
    }
  }

  console.log('Ferdig. Admin: admin@lillesandmisjonskirke.no / endre-meg-123')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
