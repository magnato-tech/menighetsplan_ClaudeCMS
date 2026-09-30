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

  const { docs: aktiviteter } = await payload.find({
    collection: 'aktiviteter',
    where: {
      and: [{ offentlig: { equals: true } }, { datoStart: { greater_than: new Date().toISOString() } }],
    },
    sort: 'datoStart',
    limit: 20,
  })

  const nesteGudstjeneste = aktiviteter.find((a) => a.type === 'gudstjeneste')

  return (
    <div className="forside">
      {nesteGudstjeneste && (
        <section className="neste-gudstjeneste">
          <h2>Neste gudstjeneste</h2>
          <div className="kort">
            <strong>{fmtDatoTid(nesteGudstjeneste.datoStart)}</strong>
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
            <li key={a.id} className={a.status === 'avlyst' ? 'avlyst' : ''}>
              <span className="dato">{fmtDatoTid(a.datoStart)}</span>
              <span className="tittel">{a.tittel}</span>
              {a.status === 'avlyst' && <span className="tag tag-avlyst">Avlyst</span>}
              {a.type === 'gudstjeneste' && <span className="tag">Gudstjeneste</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
