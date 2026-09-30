import { getPayload } from 'payload'
import config from '@/payload.config'
import { grupperPerManed, sorterManedsnokler } from '@/lib/aktivitetStatus'
import { fmtDatoTid } from '@/lib/format'
import '../styles.css'

export default async function KalenderPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: aktiviteter } = await payload.find({
    collection: 'aktiviteter',
    where: {
      and: [{ offentlig: { equals: true } }, { start: { greater_than: new Date().toISOString() } }],
    },
    sort: 'start',
    limit: 200,
  })

  const gruppert = grupperPerManed(aktiviteter)
  const manedsrekkefolge = sorterManedsnokler(gruppert)

  return (
    <div className="side-innhold">
      <h1>Kalender</h1>
      <p>
        <a href="/kalender.ics" className="kalender-abonner-lenke">
          📅 Abonner på kalenderen
        </a>
        <span className="dempet"> — legg til i Google Kalender, Outlook eller Apple Kalender</span>
      </p>
      {aktiviteter.length === 0 && <p>Ingen kommende aktiviteter registrert ennå.</p>}
      {manedsrekkefolge.map((maaned) => (
        <section key={maaned} style={{ marginBottom: '2rem' }}>
          <h2>{maaned}</h2>
          <ul className="aktivitetsliste">
            {gruppert[maaned].map((a) => (
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
      ))}
    </div>
  )
}
