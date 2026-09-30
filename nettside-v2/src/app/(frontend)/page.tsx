import { getPayload } from 'payload'
import config from '@/payload.config'
import { fmtDatoTid } from '@/lib/format'
import './styles.css'

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

  const { docs: nyheter } = await payload.find({
    collection: 'nyheter',
    sort: '-publisertDato',
    limit: 3,
  })

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

      {nyheter.length > 0 && (
        <section className="aktuelt">
          <h2>Aktuelt</h2>
          <div className="nyhetskort-liste">
            {nyheter.map((nyhet) => (
              <a key={nyhet.id} href={`/aktuelt/${nyhet.slug}`} className="nyhetskort">
                {nyhet.bilde && typeof nyhet.bilde === 'object' && nyhet.bilde.url && (
                  <img src={nyhet.bilde.url} alt={nyhet.bilde.alt || ''} />
                )}
                <h3>{nyhet.tittel}</h3>
                {nyhet.ingress && <p>{nyhet.ingress}</p>}
                <span className="nyhetskort-les-mer">LES MER →</span>
              </a>
            ))}
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
              {a.bilde && typeof a.bilde === 'object' && a.bilde.url && (
                <img className="aktivitet-miniatyr" src={a.bilde.url} alt={a.bilde.alt || ''} />
              )}
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
