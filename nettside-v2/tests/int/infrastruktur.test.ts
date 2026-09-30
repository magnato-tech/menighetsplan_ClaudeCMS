import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  finnRolleIGruppe,
  filtrerMineGrupper,
  finnLedetGrupper,
  erGruppeleder,
} from '@/lib/gruppeLogikk'
import { statusForAktivitet } from '@/lib/aktivitetStatus'
import type { User, Grupper, Aktiviteter, Oppgaver, Tildelinger } from '@/payload-types'

const TEST_PREFIX = 'TESTINFRA_'
const createdIds = {
  users: [] as (string | number)[],
  grupper: [] as (string | number)[],
  aktiviteter: [] as (string | number)[],
  oppgaver: [] as (string | number)[],
  tildelinger: [] as (string | number)[],
}

// Delt testbilde (Aktiviteter.bilde er obligatorisk) - opprettet én gang, ryddet bort til slutt
let testBildeId: number
let testPayload: Awaited<ReturnType<typeof getPayload>>

beforeAll(async () => {
  const payloadConfig = await config
  testPayload = await getPayload({ config: payloadConfig })
  const buffer = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000a49444154789c6360000002000155e3fe15000000004945' + '4e44ae426082',
    'hex',
  )
  const bilde = (await testPayload.create({
    collection: 'media',
    data: { alt: `${TEST_PREFIX}Bilde` },
    file: { data: buffer, mimetype: 'image/png', name: 'testinfra.png', size: buffer.length },
  })) as { id: number }
  testBildeId = bilde.id
})

afterAll(async () => {
  await testPayload.delete({ collection: 'media', id: testBildeId }).catch(() => {})
})

describe('Infrastruktur: database ↔ Payload ↔ webapp', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    // Slett i omvendt rekkefølge på grunn av fremmednøkler
    for (const tildelingId of createdIds.tildelinger) {
      try {
        await payload.delete({ collection: 'tildelinger', id: tildelingId })
      } catch {
        // Ignorer feil ved sletting
      }
    }
    for (const oppgaveId of createdIds.oppgaver) {
      try {
        await payload.delete({ collection: 'oppgaver', id: oppgaveId })
      } catch {
        // Ignorer feil ved sletting
      }
    }
    for (const aktivitetId of createdIds.aktiviteter) {
      try {
        await payload.delete({ collection: 'aktiviteter', id: aktivitetId })
      } catch {
        // Ignorer feil ved sletting
      }
    }
    for (const gruppeId of createdIds.grupper) {
      try {
        await payload.delete({ collection: 'grupper', id: gruppeId })
      } catch {
        // Ignorer feil ved sletting
      }
    }
    for (const userId of createdIds.users) {
      try {
        await payload.delete({ collection: 'users', id: userId })
      } catch {
        // Ignorer feil ved sletting
      }
    }
  })

  it('opprett og les person, gruppe, aktivitet, oppgave med relasjonsjekk', async () => {
    // Opprett person
    const bruker = (await payload.create({
      collection: 'users',
      data: {
        email: `${TEST_PREFIX}bruker@test.no`,
        password: 'test123',
        navn: `${TEST_PREFIX}Bruker`,
        globalRolle: 'member',
      },
    })) as User

    createdIds.users.push(bruker.id)

    // Opprett gruppe
    const gruppe = (await payload.create({
      collection: 'grupper',
      data: {
        navn: `${TEST_PREFIX}TestGruppe`,
        kategori: 'tjenestegruppe',
        medlemmer: [bruker.id],
        ledere: [],
        varaledere: [],
      },
    })) as Grupper

    createdIds.grupper.push(gruppe.id)

    // Opprett aktivitet knyttet til gruppe
    const aktivitet = (await payload.create({
      collection: 'aktiviteter',
      data: {
        tittel: `${TEST_PREFIX}Aktivitet`,
        bilde: testBildeId,
        start: '2026-12-25T10:00:00Z',
        gruppe: gruppe.id,
        offentlig: true,
      },
    })) as Aktiviteter

    createdIds.aktiviteter.push(aktivitet.id)

    // Opprett oppgave knyttet til aktivitet
    const oppgave = (await payload.create({
      collection: 'oppgaver',
      data: {
        tittel: `${TEST_PREFIX}Oppgave`,
        aktivitet: aktivitet.id,
        gruppe: gruppe.id,
        status: 'confirmed',
      },
    })) as Oppgaver

    createdIds.oppgaver.push(oppgave.id)

    // Les gruppe tilbake med depth: 1 for å se resolvet relasjon
    const gruppeHentet = (await payload.findByID({
      collection: 'grupper',
      id: gruppe.id,
      depth: 1,
    })) as Grupper

    // Verifiser at gruppens medlemmer har riktig referanse
    expect(gruppeHentet.medlemmer).toBeDefined()
    expect(Array.isArray(gruppeHentet.medlemmer)).toBe(true)

    // Les aktivitet tilbake
    const aktivitetHentet = (await payload.findByID({
      collection: 'aktiviteter',
      id: aktivitet.id,
      depth: 1,
    })) as Aktiviteter

    // Verifiser at aktivitetens gruppe-referanse resolver
    expect(aktivitetHentet.gruppe).toBeDefined()
    if (typeof aktivitetHentet.gruppe !== 'number' && typeof aktivitetHentet.gruppe !== 'string') {
      expect((aktivitetHentet.gruppe as any).navn).toBe(gruppe.navn)
    }

    // Les oppgave tilbake
    const oppgaveHentet = (await payload.findByID({
      collection: 'oppgaver',
      id: oppgave.id,
      depth: 1,
    })) as Oppgaver

    // Verifiser at oppgavens relasjonaler resolver
    expect(oppgaveHentet.aktivitet).toBeDefined()
    expect(oppgaveHentet.gruppe).toBeDefined()
  })
})

describe('Brukernivå', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const tildelingId of createdIds.tildelinger) {
      try {
        await payload.delete({ collection: 'tildelinger', id: tildelingId })
      } catch {}
    }
    for (const oppgaveId of createdIds.oppgaver) {
      try {
        await payload.delete({ collection: 'oppgaver', id: oppgaveId })
      } catch {}
    }
    for (const aktivitetId of createdIds.aktiviteter) {
      try {
        await payload.delete({ collection: 'aktiviteter', id: aktivitetId })
      } catch {}
    }
    for (const gruppeId of createdIds.grupper) {
      try {
        await payload.delete({ collection: 'grupper', id: gruppeId })
      } catch {}
    }
    for (const userId of createdIds.users) {
      try {
        await payload.delete({ collection: 'users', id: userId })
      } catch {}
    }
  })

  it('medlem i gruppe vises i filtrerMineGrupper, erGruppeleder er false', async () => {
    // Opprett bruker
    const bruker = (await payload.create({
      collection: 'users',
      data: {
        email: `${TEST_PREFIX}medlem@test.no`,
        password: 'test123',
        navn: `${TEST_PREFIX}Medlem`,
        globalRolle: 'member',
      },
    })) as User

    createdIds.users.push(bruker.id)

    // Opprett gruppe der bruker er KUN medlem (ikke leder/varaleder)
    const gruppe = (await payload.create({
      collection: 'grupper',
      data: {
        navn: `${TEST_PREFIX}MedlemGruppe`,
        kategori: 'husgruppe',
        medlemmer: [bruker.id],
        ledere: [],
        varaledere: [],
      },
    })) as Grupper

    createdIds.grupper.push(gruppe.id)

    // Hent alle grupper fra databasen
    const { docs: alleGrupper } = await payload.find({
      collection: 'grupper',
      depth: 1,
      limit: 100,
    })

    // Bruk filtrerMineGrupper på faktisk database-svar
    const mineGrupper = filtrerMineGrupper(alleGrupper as Grupper[], bruker.id)

    // Verifiser at gruppen er med
    expect(mineGrupper.some((g) => g.id === gruppe.id)).toBe(true)

    // Verifiser at erGruppeleder returnerer false
    expect(erGruppeleder(alleGrupper as Grupper[], bruker.id)).toBe(false)
  })
})

describe('Gruppeledernivå', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const tildelingId of createdIds.tildelinger) {
      try {
        await payload.delete({ collection: 'tildelinger', id: tildelingId })
      } catch {}
    }
    for (const oppgaveId of createdIds.oppgaver) {
      try {
        await payload.delete({ collection: 'oppgaver', id: oppgaveId })
      } catch {}
    }
    for (const aktivitetId of createdIds.aktiviteter) {
      try {
        await payload.delete({ collection: 'aktiviteter', id: aktivitetId })
      } catch {}
    }
    for (const gruppeId of createdIds.grupper) {
      try {
        await payload.delete({ collection: 'grupper', id: gruppeId })
      } catch {}
    }
    for (const userId of createdIds.users) {
      try {
        await payload.delete({ collection: 'users', id: userId })
      } catch {}
    }
  })

  it('gruppeleder vises i finnLedetGrupper, erGruppeleder er true, statusForAktivitet viser mangler', async () => {
    // Opprett gruppeleder
    const leder = (await payload.create({
      collection: 'users',
      data: {
        email: `${TEST_PREFIX}leder@test.no`,
        password: 'test123',
        navn: `${TEST_PREFIX}Leder`,
        globalRolle: 'member',
      },
    })) as User

    createdIds.users.push(leder.id)

    // Opprett gruppe der bruker er leder
    const gruppe = (await payload.create({
      collection: 'grupper',
      data: {
        navn: `${TEST_PREFIX}LederGruppe`,
        kategori: 'tjenestegruppe',
        medlemmer: [leder.id],
        ledere: [leder.id],
        varaledere: [],
      },
    })) as Grupper

    createdIds.grupper.push(gruppe.id)

    // Opprett aktivitet for gruppen
    const aktivitet = (await payload.create({
      collection: 'aktiviteter',
      data: {
        tittel: `${TEST_PREFIX}LederAktivitet`,
        bilde: testBildeId,
        start: '2026-12-31T18:00:00Z',
        gruppe: gruppe.id,
        offentlig: true,
      },
    })) as Aktiviteter

    createdIds.aktiviteter.push(aktivitet.id)

    // Opprett oppgave med status 'vacant' (ledig)
    const oppgave = (await payload.create({
      collection: 'oppgaver',
      data: {
        tittel: `${TEST_PREFIX}LedigOppgave`,
        aktivitet: aktivitet.id,
        gruppe: gruppe.id,
        status: 'vacant',
      },
    })) as Oppgaver

    createdIds.oppgaver.push(oppgave.id)

    // Hent alle grupper fra databasen
    const { docs: alleGrupper } = await payload.find({
      collection: 'grupper',
      depth: 1,
      limit: 100,
    })

    // Verifiser erGruppeleder returnerer true
    expect(erGruppeleder(alleGrupper as Grupper[], leder.id)).toBe(true)

    // Verifiser finnLedetGrupper viser gruppen
    const ledetGrupper = finnLedetGrupper(alleGrupper as Grupper[], leder.id)
    expect(ledetGrupper.some((g) => g.id === gruppe.id)).toBe(true)

    // Hent alle oppgaver og tildelinger
    const { docs: alleOppgaver } = await payload.find({
      collection: 'oppgaver',
      depth: 0,
      limit: 100,
    })

    const { docs: alleTildelinger } = await payload.find({
      collection: 'tildelinger',
      depth: 0,
      limit: 100,
    })

    // Bruk statusForAktivitet på faktisk database-data
    const status = statusForAktivitet(aktivitet.id, alleOppgaver as Oppgaver[], alleTildelinger as Tildelinger[])

    // Verifiser at status er "Mangler 1" (fordi oppgaven er vacant)
    expect(status).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
  })
})

describe('Adminnivå', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const userId of createdIds.users) {
      try {
        await payload.delete({ collection: 'users', id: userId })
      } catch {}
    }
  })

  it('admin-bruker kan gjenkjennes via globalRolle', async () => {
    // Opprett admin-bruker
    const admin = (await payload.create({
      collection: 'users',
      data: {
        email: `${TEST_PREFIX}admin@test.no`,
        password: 'admin123',
        navn: `${TEST_PREFIX}Admin`,
        globalRolle: 'admin',
      },
    })) as User

    createdIds.users.push(admin.id)

    // Hent personen tilbake fra databasen
    const adminHentet = (await payload.findByID({
      collection: 'users',
      id: admin.id,
    })) as User

    // Verifiser at globalRolle === 'admin'
    expect(adminHentet.globalRolle).toBe('admin')
  })
})
