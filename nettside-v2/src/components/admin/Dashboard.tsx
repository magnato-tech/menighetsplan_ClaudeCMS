import { getPayload } from 'payload'
import config from '@/payload.config'

const STATUS_FARGE: Record<string, string> = {
  bekreftet: 'var(--dash-good)',
  venter: 'var(--dash-warning)',
  trengerVikar: 'var(--dash-critical)',
  avlyst: 'var(--dash-muted)',
}

function StatTile({ label, verdi }: { label: string; verdi: number }) {
  return (
    <div className="dash-tile">
      <div className="dash-tile-verdi">{verdi}</div>
      <div className="dash-tile-label">{label}</div>
    </div>
  )
}

function StatusRad({
  ikon,
  label,
  verdi,
  maks,
  farge,
}: {
  ikon: string
  label: string
  verdi: number
  maks: number
  farge: string
}) {
  const bredde = maks > 0 ? Math.max((verdi / maks) * 100, verdi > 0 ? 4 : 0) : 0
  return (
    <div className="dash-bar-rad">
      <span className="dash-bar-ikon" aria-hidden="true">
        {ikon}
      </span>
      <span className="dash-bar-label">{label}</span>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${bredde}%`, background: farge }} />
      </div>
      <span className="dash-bar-verdi">{verdi}</span>
    </div>
  )
}

function GruppeRad({ label, verdi, maks }: { label: string; verdi: number; maks: number }) {
  const bredde = maks > 0 ? Math.max((verdi / maks) * 100, verdi > 0 ? 4 : 0) : 0
  return (
    <div className="dash-bar-rad">
      <span className="dash-bar-label dash-bar-label-bred">{label}</span>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${bredde}%`, background: 'var(--dash-seq)' }} />
      </div>
      <span className="dash-bar-verdi">{verdi}</span>
    </div>
  )
}

export async function Dashboard() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const [sider, brukere, grupperRes, oppgaver, kommendeAktiviteter] = await Promise.all([
    payload.count({ collection: 'sider' }),
    payload.count({ collection: 'users' }),
    payload.find({ collection: 'grupper', limit: 100 }),
    payload.find({ collection: 'oppgaver', limit: 1000, depth: 0 }),
    payload.find({
      collection: 'aktiviteter',
      where: { and: [{ offentlig: { equals: true } }, { start: { greater_than: new Date().toISOString() } }] },
      limit: 1000,
      depth: 0,
    }),
  ])

  const grupper = grupperRes.docs

  const statusTelling = { bekreftet: 0, venter: 0, trengerVikar: 0, avlyst: 0 }
  for (const o of oppgaver.docs) {
    if (o.status === 'confirmed') statusTelling.bekreftet++
    else if (o.status === 'assigned') statusTelling.venter++
    else if (o.status === 'open' || o.status === 'vacant') statusTelling.trengerVikar++
    else if (o.status === 'cancelled') statusTelling.avlyst++
  }
  const statusMaks = Math.max(...Object.values(statusTelling), 1)

  const gruppeId = (rel: unknown) => (typeof rel === 'object' && rel ? (rel as { id: string | number }).id : rel)
  const { docs: alleAktiviteterMedGruppe } = await payload.find({
    collection: 'aktiviteter',
    limit: 1000,
    depth: 0,
  })
  const aktiviteterPerGruppe = grupper.map((g) => ({
    navn: g.navn,
    antall: alleAktiviteterMedGruppe.filter((a) => gruppeId(a.gruppe) === g.id).length,
  }))
  const gruppeMaks = Math.max(...aktiviteterPerGruppe.map((g) => g.antall), 1)

  return (
    <div className="dash-root">
      <style>{`
        .dash-root {
          --dash-good: #0ca30c;
          --dash-warning: #fab219;
          --dash-critical: #d03b3b;
          --dash-muted: #898781;
          --dash-seq: #2a78d6;
          --dash-surface: #fcfcfb;
          --dash-text: #0b0b0b;
          --dash-text-secondary: #52514e;
          --dash-border: rgba(11,11,11,0.10);
          margin-bottom: 2rem;
        }
        html[data-theme='dark'] .dash-root {
          --dash-surface: #1a1a19;
          --dash-text: #ffffff;
          --dash-text-secondary: #c3c2b7;
          --dash-border: rgba(255,255,255,0.10);
        }
        .dash-tiles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .dash-tile {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          padding: 1rem;
        }
        .dash-tile-verdi {
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--dash-text);
        }
        .dash-tile-label {
          font-size: 0.85rem;
          color: var(--dash-text-secondary);
          margin-top: 0.2rem;
        }
        .dash-panel {
          background: var(--dash-surface);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin-bottom: 1rem;
        }
        .dash-panel h4 {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
          color: var(--dash-text);
        }
        .dash-bar-rad {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.5rem;
        }
        .dash-bar-ikon {
          width: 1.2rem;
          text-align: center;
        }
        .dash-bar-label {
          width: 7rem;
          flex-shrink: 0;
          font-size: 0.85rem;
          color: var(--dash-text-secondary);
        }
        .dash-bar-label-bred {
          width: 10rem;
        }
        .dash-bar-track {
          flex: 1;
          height: 10px;
          background: var(--dash-border);
          border-radius: 999px;
          overflow: hidden;
        }
        .dash-bar-fill {
          height: 100%;
          border-radius: 999px;
        }
        .dash-bar-verdi {
          width: 2rem;
          text-align: right;
          font-size: 0.85rem;
          color: var(--dash-text);
          font-weight: 600;
        }
        .dash-tabellvisning summary {
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--dash-text-secondary);
        }
        .dash-tabellvisning table {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          border-collapse: collapse;
        }
        .dash-tabellvisning td {
          padding: 0.2rem 0.8rem 0.2rem 0;
          color: var(--dash-text);
        }
      `}</style>

      <div className="dash-tiles">
        <StatTile label="Sider" verdi={sider.totalDocs} />
        <StatTile label="Kommende arrangementer" verdi={kommendeAktiviteter.totalDocs} />
        <StatTile label="Grupper" verdi={grupper.length} />
        <StatTile label="Brukere" verdi={brukere.totalDocs} />
      </div>

      <div className="dash-panel">
        <h4>Oppgavestatus</h4>
        <StatusRad ikon="✓" label="Bekreftet" verdi={statusTelling.bekreftet} maks={statusMaks} farge={STATUS_FARGE.bekreftet} />
        <StatusRad ikon="…" label="Venter svar" verdi={statusTelling.venter} maks={statusMaks} farge={STATUS_FARGE.venter} />
        <StatusRad ikon="!" label="Trenger vikar" verdi={statusTelling.trengerVikar} maks={statusMaks} farge={STATUS_FARGE.trengerVikar} />
        <StatusRad ikon="×" label="Avlyst" verdi={statusTelling.avlyst} maks={statusMaks} farge={STATUS_FARGE.avlyst} />
        <details className="dash-tabellvisning">
          <summary>Vis som tabell</summary>
          <table>
            <tbody>
              <tr>
                <td>Bekreftet</td>
                <td>{statusTelling.bekreftet}</td>
              </tr>
              <tr>
                <td>Venter svar</td>
                <td>{statusTelling.venter}</td>
              </tr>
              <tr>
                <td>Trenger vikar</td>
                <td>{statusTelling.trengerVikar}</td>
              </tr>
              <tr>
                <td>Avlyst</td>
                <td>{statusTelling.avlyst}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>

      <div className="dash-panel">
        <h4>Aktiviteter per gruppe</h4>
        {aktiviteterPerGruppe.length === 0 && <p>Ingen grupper registrert ennå.</p>}
        {aktiviteterPerGruppe.map((g) => (
          <GruppeRad key={g.navn} label={g.navn} verdi={g.antall} maks={gruppeMaks} />
        ))}
        <details className="dash-tabellvisning">
          <summary>Vis som tabell</summary>
          <table>
            <tbody>
              {aktiviteterPerGruppe.map((g) => (
                <tr key={g.navn}>
                  <td>{g.navn}</td>
                  <td>{g.antall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  )
}
