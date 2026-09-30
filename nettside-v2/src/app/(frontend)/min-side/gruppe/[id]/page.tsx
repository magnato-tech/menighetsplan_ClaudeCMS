import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendMelding } from '@/lib/handlinger'
import '../../../styles.css'

function fmtTid(iso: string) {
  return new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
}

export default async function GruppechatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ som?: string }>
}) {
  const { id: gruppeId } = await params
  const { som } = await searchParams

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Hent gruppen
  const gruppe = await payload.findByID({
    collection: 'grupper',
    id: gruppeId,
    depth: 1,
  })

  // Hent alle meldinger for denne gruppen
  const { docs: meldinger } = await payload.find({
    collection: 'gruppemeldinger',
    where: { gruppe: { equals: gruppeId } },
    sort: 'createdAt',
    limit: 100,
    depth: 1,
  })

  // Hent valgt bruker
  const { docs: brukere } = await payload.find({
    collection: 'users',
    limit: 100,
  })
  const valgtBruker = som ? brukere.find((b) => String(b.id) === som) : brukere[0]

  if (!gruppe) {
    return (
      <div className="min-side">
        <h1>Gruppe ikke funnet</h1>
        <a href={`/min-side?som=${som}`}>← Tilbake til Min side</a>
      </div>
    )
  }

  if (!valgtBruker) {
    return (
      <div className="min-side">
        <h1>Bruker ikke funnet</h1>
      </div>
    )
  }

  return (
    <div className="min-side">
      <div className="gruppechat-header">
        <a href={`/min-side?som=${valgtBruker.id}`}>← Tilbake til Min side</a>
        <h1>{gruppe.navn}</h1>
      </div>

      <div className="meldingsliste">
        {meldinger.length === 0 ? (
          <p className="dempet">Ingen meldinger ennå i denne gruppen.</p>
        ) : (
          meldinger.map((melding) => {
            const avsenderNavn = typeof melding.avsender === 'object' ? melding.avsender.navn : 'Ukjent'
            const erEgenMelding = typeof melding.avsender === 'object' 
              ? melding.avsender.id === valgtBruker.id
              : melding.avsender === valgtBruker.id

            return (
              <div 
                key={melding.id} 
                className={`melding ${erEgenMelding ? 'melding-egen' : ''}`}
              >
                <div className="melding-avsender">{avsenderNavn}</div>
                <p className="melding-innhold">{melding.innhold}</p>
                {melding.createdAt && (
                  <div className="melding-tid">{fmtTid(melding.createdAt)}</div>
                )}
              </div>
            )
          })
        )}
      </div>

      <form action={sendMelding} className="send-melding-skjema">
        <input type="hidden" name="gruppeId" value={gruppeId} />
        <input type="hidden" name="avsenderId" value={valgtBruker.id} />
        <input 
          type="text" 
          name="innhold" 
          placeholder="Skriv en melding..." 
          required
          aria-label="Meldingstekst"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
