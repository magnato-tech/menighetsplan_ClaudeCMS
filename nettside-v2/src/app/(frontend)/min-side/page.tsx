import { getPayload } from 'payload'
import config from '@/payload.config'
import '../styles.css'

function fmtDatoKort(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
function fmtDatoLang(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })
}

type Fane = 'medlem' | 'gruppeleder' | 'admin'

export default async function MinSidePage({
  searchParams,
}: {
  searchParams: Promise<{ som?: string; fane?: string; filter?: string }>
}) {
  const { som, fane: faneParam, filter } = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: brukere } = await payload.find({ collection: 'users', sort: 'navn', limit: 100 })
  const valgtBruker = som ? brukere.find((b) => String(b.id) === som) : brukere[0]

  if (!valgtBruker) {
    return (
      <div className="min-side">
        <h1>Min side</h1>
        <p>
          Ingen personer finnes ennå. Kjør <code>npm run seed</code>.
        </p>
      </div>
    )
  }

  const { docs: alleGrupper } = await payload.find({ collection: 'grupper', limit: 100, depth: 1 })
  const mineGrupper = alleGrupper.filter((g) => {
    const idIn = (rel: unknown) =>
      Array.isArray(rel) && rel.some((p) => (typeof p === 'object' ? p.id : p) === valgtBruker.id)
    return idIn(g.medlemmer) || idIn(g.ledere) || idIn(g.varaledere)
  })
  const ledetGrupper = alleGrupper.filter((g) => {
    const idIn = (rel: unknown) =>
      Array.isArray(rel) && rel.some((p) => (typeof p === 'object' ? p.id : p) === valgtBruker.id)
    return idIn(g.ledere) || idIn(g.varaledere)
  })
  const rolleIGruppe = (g: (typeof alleGrupper)[number]) => {
    const idIn = (rel: unknown) =>
      Array.isArray(rel) && rel.some((p) => (typeof p === 'object' ? p.id : p) === valgtBruker.id)
    if (idIn(g.ledere)) return 'Leder'
    if (idIn(g.varaledere)) return 'Nestleder'
    return 'Medlem'
  }

  const erAdmin = valgtBruker.globalRolle === 'admin'
  const erGruppeleder = ledetGrupper.length > 0
  const tilgjengeligeFaner: Fane[] = ['medlem', ...(erGruppeleder ? (['gruppeleder'] as const) : []), ...(erAdmin ? (['admin'] as const) : [])]
  const aktivFane: Fane = (faneParam as Fane) && tilgjengeligeFaner.includes(faneParam as Fane) ? (faneParam as Fane) : 'medlem'

  const { docs: alleOppgaver } = await payload.find({ collection: 'oppgaver', limit: 500, depth: 1 })
  const { docs: alleTildelinger } = await payload.find({ collection: 'tildelinger', limit: 500, depth: 1 })
  const { docs: alleAktiviteter } = await payload.find({ collection: 'aktiviteter', limit: 500, depth: 1, sort: 'start' })
  const { docs: alleMeldinger } = await payload.find({
    collection: 'gruppemeldinger',
    limit: 200,
    depth: 1,
    sort: '-createdAt',
  })

  const gruppeId = (rel: unknown) => (typeof rel === 'object' && rel ? (rel as { id: string | number }).id : rel)

  function statusForAktivitet(aktId: string | number) {
    const oppgaver = alleOppgaver.filter((o) => gruppeId(o.aktivitet) === aktId)
    if (oppgaver.length === 0) return null
    const harTrukket = alleTildelinger.some(
      (t) => oppgaver.some((o) => o.id === gruppeId(t.oppgave)) && t.svar === 'withdrawn',
    )
    if (harTrukket) return { label: 'Forfall', klasse: 'tag-forfall' }
    const antallLedige = oppgaver.filter((o) => o.status === 'vacant' || o.status === 'open').length
    if (antallLedige > 0) return { label: `Mangler ${antallLedige}`, klasse: 'tag-mangler' }
    return { label: 'Dekket', klasse: 'tag-dekket' }
  }

  // Min side (medlem)
  const handlingskortMedlem = (() => {
    const ledigeIMineGrupper = alleOppgaver.filter(
      (o) => mineGrupper.some((g) => g.id === gruppeId(o.gruppe)) && (o.status === 'vacant' || o.status === 'open'),
    ).length
    const ventendeTildelinger = alleTildelinger.filter(
      (t) => gruppeId(t.person) === valgtBruker.id && t.svar === 'pending',
    ).length
    return ledigeIMineGrupper + ventendeTildelinger
  })()

  const gruppekort = mineGrupper.map((g) => {
    const nesteAkt = alleAktiviteter
      .filter((a) => gruppeId(a.gruppe) === g.id && new Date(a.start) >= new Date('2026-08-01'))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]
    const sisteMelding = alleMeldinger.find((m) => gruppeId(m.gruppe) === g.id)
    return {
      gruppe: g,
      rolle: rolleIGruppe(g),
      nesteAkt,
      nesteAktStatus: nesteAkt ? statusForAktivitet(nesteAkt.id) : null,
      sisteMelding,
    }
  })

  // Gruppeleder
  const aktiviteterLedetGrupper = alleAktiviteter.filter((a) => ledetGrupper.some((g) => g.id === gruppeId(a.gruppe)))
  const aktiviteterMedStatus = aktiviteterLedetGrupper.map((a) => ({ akt: a, status: statusForAktivitet(a.id) }))
  const tellinger = {
    alle: aktiviteterMedStatus.length,
    forfall: aktiviteterMedStatus.filter((x) => x.status?.klasse === 'tag-forfall').length,
    mangler: aktiviteterMedStatus.filter((x) => x.status?.klasse === 'tag-mangler').length,
    dekket: aktiviteterMedStatus.filter((x) => x.status?.klasse === 'tag-dekket').length,
  }
  const aktivtFilter = filter && ['forfall', 'mangler', 'dekket'].includes(filter) ? filter : 'alle'
  const filtrerteAktiviteter = aktiviteterMedStatus.filter((x) => {
    if (aktivtFilter === 'alle') return true
    if (aktivtFilter === 'forfall') return x.status?.klasse === 'tag-forfall'
    if (aktivtFilter === 'mangler') return x.status?.klasse === 'tag-mangler'
    if (aktivtFilter === 'dekket') return x.status?.klasse === 'tag-dekket'
    return true
  })
  const trengerOppfolging = aktiviteterMedStatus.filter(
    (x) => x.status?.klasse === 'tag-mangler' || x.status?.klasse === 'tag-forfall',
  ).length

  function faneUrl(f: Fane) {
    return `/min-side?som=${valgtBruker.id}&fane=${f}`
  }

  return (
    <div className="min-side">
      <h1>Min side</h1>

      <form className="brukervelger" method="get">
        <input type="hidden" name="fane" value={aktivFane} />
        <label htmlFor="som">Vis som (demonstrasjon, ingen ekte innlogging ennå):</label>
        <select id="som" name="som" defaultValue={String(valgtBruker.id)}>
          {brukere.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.navn}
            </option>
          ))}
        </select>
        <button type="submit">Bytt</button>
      </form>

      <div className="fanevelger">
        <a href={faneUrl('medlem')} className={aktivFane === 'medlem' ? 'fane aktiv' : 'fane'}>
          Min side
        </a>
        {erGruppeleder && (
          <a href={faneUrl('gruppeleder')} className={aktivFane === 'gruppeleder' ? 'fane aktiv' : 'fane'}>
            Gruppeleder
            {trengerOppfolging > 0 && <span className="fane-prikk" />}
          </a>
        )}
        {erAdmin && (
          <a href="/admin" className="fane">
            Admin
          </a>
        )}
      </div>

      {aktivFane === 'medlem' && (
        <>
          {handlingskortMedlem > 0 && (
            <section className="kort handlingskort">
              <span className="handlingskort-label">DETTE TRENGER DIN HANDLING</span>
              <h2>{handlingskortMedlem} saker venter på deg</h2>
              <p>Du har ubesvarte tildelinger eller ledige oppgaver i dine grupper.</p>
            </section>
          )}

          <section>
            <h2>Mine grupper ({mineGrupper.length})</h2>
            {gruppekort.length === 0 && <p>Ikke medlem av noen grupper.</p>}
            <div className="gruppekort-liste">
              {gruppekort.map(({ gruppe, rolle, nesteAkt, nesteAktStatus, sisteMelding }) => (
                <div key={gruppe.id} className="gruppekort">
                  <div className="gruppekort-header">
                    <span className="tag">{gruppe.kategori}</span>
                    <span className={`tag tag-rolle-${rolle.toLowerCase()}`}>{rolle}</span>
                  </div>
                  <h3>{gruppe.navn}</h3>
                  <p className="gruppekort-meta">
                    {Array.isArray(gruppe.medlemmer) ? gruppe.medlemmer.length : 0} medlemmer
                    {gruppe.moteplan?.ukedag &&
                      ` · ${gruppe.moteplan.ukedag} kl. ${gruppe.moteplan.klokkeslett} (${gruppe.moteplan.frekvens})`}
                  </p>
                  {nesteAkt && (
                    <div className="gruppekort-neste">
                      <span className="gruppekort-neste-label">NESTE AKTIVITET</span>
                      {nesteAktStatus && <span className={`tag ${nesteAktStatus.klasse}`}>{nesteAktStatus.label}</span>}
                      <p>{nesteAkt.tittel}</p>
                      <p className="dempet">{fmtDatoLang(nesteAkt.start)}</p>
                    </div>
                  )}
                  {sisteMelding && (
                    <div className="gruppekort-melding">
                      <strong>{typeof sisteMelding.avsender === 'object' ? sisteMelding.avsender.navn : ''}</strong>
                      <p>{sisteMelding.innhold}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {aktivFane === 'gruppeleder' && (
        <>
          <p className="rolle-info">
            {valgtBruker.navn} leder {ledetGrupper.length} grupper
          </p>

          {trengerOppfolging > 0 && (
            <section className="kort handlingskort">
              <h2>{trengerOppfolging} oppgaver trenger vikar / oppfølging</h2>
              <p>I {tellinger.alle} aktiviteter dette semesteret</p>
            </section>
          )}

          <section>
            <div className="semesteroversikt-header">
              <h2>Semesteroversikt</h2>
              <span className="dempet">{tellinger.alle} aktiviteter</span>
            </div>
            <div className="filterchips">
              <a href={`/min-side?som=${valgtBruker.id}&fane=gruppeleder&filter=alle`} className={aktivtFilter === 'alle' ? 'chip aktiv' : 'chip'}>
                Alle {tellinger.alle}
              </a>
              <a
                href={`/min-side?som=${valgtBruker.id}&fane=gruppeleder&filter=forfall`}
                className={aktivtFilter === 'forfall' ? 'chip chip-forfall aktiv' : 'chip chip-forfall'}
              >
                Forfall {tellinger.forfall}
              </a>
              <a
                href={`/min-side?som=${valgtBruker.id}&fane=gruppeleder&filter=mangler`}
                className={aktivtFilter === 'mangler' ? 'chip chip-mangler aktiv' : 'chip chip-mangler'}
              >
                Mangler {tellinger.mangler}
              </a>
              <a
                href={`/min-side?som=${valgtBruker.id}&fane=gruppeleder&filter=dekket`}
                className={aktivtFilter === 'dekket' ? 'chip chip-dekket aktiv' : 'chip chip-dekket'}
              >
                Dekket {tellinger.dekket}
              </a>
            </div>
            <ul className="aktivitetsliste">
              {filtrerteAktiviteter.map(({ akt, status }) => (
                <li key={akt.id}>
                  <span className="dato">{fmtDatoKort(akt.start)}</span>
                  <span className="tittel">{akt.tittel}</span>
                  {status && <span className={`tag ${status.klasse}`}>{status.label}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Mine ledergrupper</h2>
            <div className="gruppekort-liste">
              {ledetGrupper.map((g) => (
                <div key={g.id} className="gruppekort">
                  <div className="gruppekort-header">
                    <span className="tag">{g.kategori}</span>
                    <span className={`tag tag-rolle-${rolleIGruppe(g).toLowerCase()}`}>{rolleIGruppe(g)}</span>
                  </div>
                  <h3>{g.navn}</h3>
                  <p className="gruppekort-meta">
                    {Array.isArray(g.medlemmer) ? g.medlemmer.length : 0} medlemmer
                    {g.moteplan?.ukedag && ` · Fast tid: ${g.moteplan.ukedag} kl. ${g.moteplan.klokkeslett} (${g.moteplan.frekvens})`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
