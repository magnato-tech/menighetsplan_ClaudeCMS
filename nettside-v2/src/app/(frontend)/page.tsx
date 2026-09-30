import { getPayload } from 'payload'
import config from '@/payload.config'
import './styles.css'

function fmtDatoTid(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const forside = await payload.findGlobal({
    slug: 'forsideinnstillinger',
  }).catch(() => null)

  const { docs: aktiviteter } = await payload.find({
    collection: 'aktiviteter',
    where: {
      and: [{ offentlig: { equals: true } }, { start: { greater_than: new Date().toISOString() } }],
    },
    sort: 'start',
    limit: 20,
  })

  const nesteGudstjeneste = aktiviteter.find((a) => a.erGudstjeneste)

  return (
    <div className="forside">
      {forside && (
        <section
          className="hero"
          style={{
            backgroundImage: forside.heroBilde && typeof forside.heroBilde === 'object' && forside.heroBilde.url
              ? `url(${forside.heroBilde.url})`
              : undefined,
          }}
        >
          <div className="hero-overlay">
            <h1>{forside.heroOverskrift}</h1>
            {forside.heroKnappTekst && forside.heroKnappLenke && (
              <a href={forside.heroKnappLenke} className="hero-knapp">{forside.heroKnappTekst}</a>
            )}
          </div>
        </section>
      )}

      {nesteGudstjeneste && (
        <section className="neste-gudstjeneste">
          <h2>Neste gudstjeneste</h2>
          <div className="kort">
            <strong>{fmtDatoTid(nesteGudstjeneste.start)}</strong>
            <p>{nesteGudstjeneste.tittel}</p>
            {nesteGudstjeneste.sted && <p className="sted">{nesteGudstjeneste.sted}</p>}
          </div>
        </section>
      )}

      <section className="kommende">
        <h2>Kommende arrangementer</h2>
        {aktiviteter.length === 0 && <p>Ingen kommende arrangementer registrert ennå.</p>}
        <ul className="aktivitetsliste">
          {aktiviteter.map((a) => (
            <li key={a.id} className={a.avlyst ? 'avlyst' : ''}>
              <span className="dato">{fmtDatoTid(a.start)}</span>
              <span className="tittel">{a.tittel}</span>
              {a.avlyst && <span className="tag tag-avlyst">Avlyst</span>}
              {a.erGudstjeneste && <span className="tag">Gudstjeneste</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
