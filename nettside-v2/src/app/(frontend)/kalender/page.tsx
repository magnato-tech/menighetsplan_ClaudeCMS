import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Aktiviteter as Aktivitet } from '@/payload-types'
import '../styles.css'

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

function fmtManedAr(iso: string) {
  const d = new Date(iso)
  const maaned = d.toLocaleString('nb-NO', { month: 'long', year: 'numeric' })
  // Stor forbokstav på månedsnavn
  return maaned.charAt(0).toUpperCase() + maaned.slice(1)
}

function grupperPerManed(aktiviteter: Aktivitet[]) {
  const grupper: Record<string, Aktivitet[]> = {}

  aktiviteter.forEach((a) => {
    const nokkel = fmtManedAr(a.start)
    if (!grupper[nokkel]) {
      grupper[nokkel] = []
    }
    grupper[nokkel].push(a)
  })

  return grupper
}

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
  const manedsrekkefolge = Object.keys(gruppert).sort((a, b) => {
    const dateA = new Date(gruppert[a][0].start)
    const dateB = new Date(gruppert[b][0].start)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="side-innhold">
      <h1>Kalender</h1>
      {aktiviteter.length === 0 && <p>Ingen kommende aktiviteter registrert ennå.</p>}
      {manedsrekkefolge.map((maaned) => (
        <section key={maaned} style={{ marginBottom: '2rem' }}>
          <h2>{maaned}</h2>
          <ul className="aktivitetsliste">
            {gruppert[maaned].map((a) => (
              <li key={a.id} className={a.avlyst ? 'avlyst' : ''}>
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
