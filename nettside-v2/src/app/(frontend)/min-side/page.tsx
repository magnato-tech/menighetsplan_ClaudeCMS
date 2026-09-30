import { getPayload } from 'payload'
import config from '@/payload.config'
import '../styles.css'

function fmtDatoTid(iso: string) {
  return new Date(iso).toLocaleString('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function MinSidePage({
  searchParams,
}: {
  searchParams: Promise<{ som?: string }>
}) {
  const { som } = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: brukere } = await payload.find({
    collection: 'users',
    sort: 'navn',
    limit: 100,
  })

  const valgtBruker = som ? brukere.find((b) => String(b.id) === som) : brukere[0]

  if (!valgtBruker) {
    return (
      <div className="min-side">
        <h1>Min side</h1>
        <p>
          Ingen brukere finnes ennå. Kjør <code>npm run seed</code> for testdata.
        </p>
      </div>
    )
  }

  const roller: string[] = valgtBruker.roller || []
  const erGruppeleder = roller.includes('gruppeleder')
  const erAdmin = roller.includes('administrasjon') || roller.includes('lederskap')

  const { docs: mineOppgaver } = await payload.find({
    collection: 'oppgaver',
    where: { tildeltTil: { equals: valgtBruker.id } },
    depth: 1,
  })

  const { docs: mineGrupper } = await payload.find({
    collection: 'grupper',
    where: {
      or: [{ medlemmer: { contains: valgtBruker.id } }, { gruppeleder: { equals: valgtBruker.id } }],
    },
    depth: 1,
  })

  const ledetGrupper = mineGrupper.filter(
    (g) => typeof g.gruppeleder === 'object' && g.gruppeleder?.id === valgtBruker.id,
  )

  let ledigeOppgaverIGruppe: typeof mineOppgaver = []
  if (erGruppeleder && ledetGrupper.length > 0) {
    const alle = await payload.find({
      collection: 'oppgaver',
      where: { status: { equals: 'ledig' } },
      depth: 1,
    })
    ledigeOppgaverIGruppe = alle.docs
  }

  return (
    <div className="min-side">
      <h1>Min side</h1>

      <form className="brukervelger" method="get">
        <label htmlFor="som">
          Vis som (kun for demonstrasjon uten ekte innlogging ennå):
        </label>
        <select id="som" name="som" defaultValue={String(valgtBruker.id)}>
          {brukere.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.navn} — {(b.roller || []).join(', ')}
            </option>
          ))}
        </select>
        <button type="submit">Bytt</button>
      </form>

      <p className="rolle-info">
        Innlogget som <strong>{valgtBruker.navn}</strong> med roller: {roller.join(', ') || 'ingen'}
      </p>

      {erAdmin && (
        <section className="kort admin-varsel">
          <p>
            Denne brukeren har administrasjons-/lederskapsrolle og ville i den ferdige løsningen
            blitt sendt rett til <a href="/admin">det fulle CMS-administrasjonspanelet</a> i stedet
            for denne siden.
          </p>
        </section>
      )}

      <section>
        <h2>Mine oppgaver</h2>
        {mineOppgaver.length === 0 && <p>Ingen oppgaver tildelt.</p>}
        <ul className="aktivitetsliste">
          {mineOppgaver.map((o) => (
            <li key={o.id}>
              <span className="tittel">{o.tittel}</span>
              <span className="tag">{o.status}</span>
              {o.status !== 'forfall_meldt' && (
                <form method="post" action="#" className="forfall-stub">
                  <button type="button" disabled title="Ikke koblet til ennå">
                    Meld forfall
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Mine grupper</h2>
        {mineGrupper.length === 0 && <p>Ikke medlem av noen grupper.</p>}
        <ul className="aktivitetsliste">
          {mineGrupper.map((g) => (
            <li key={g.id}>
              <span className="tittel">{g.navn}</span>
              <span className="tag">{g.type}</span>
              {typeof g.gruppeleder === 'object' && g.gruppeleder?.id === valgtBruker.id && (
                <span className="tag tag-leder">Gruppeleder</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {erGruppeleder && (
        <section className="gruppeleder-oversikt">
          <h2>Gruppeleder-oversikt</h2>
          <p>Ledige oppgaver på tvers av dine grupper som trenger bemanning:</p>
          {ledigeOppgaverIGruppe.length === 0 && <p>Ingen ledige oppgaver.</p>}
          <ul className="aktivitetsliste">
            {ledigeOppgaverIGruppe.map((o) => (
              <li key={o.id}>
                <span className="tittel">{o.tittel}</span>
                <span className="tag">Ledig</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
