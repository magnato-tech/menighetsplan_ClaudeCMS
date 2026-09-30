import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import config from '@/payload.config'
import { fmtDatoTid } from '@/lib/format'
import { tilEmbedUrl } from '@/lib/videoEmbed'
import '../styles.css'

export default async function SidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'sider',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
  })

  const side = docs[0]
  if (!side) return notFound()

  const trengerKalender = (side.blokker || []).some((b) => b.blockType === 'kalender')
  const { docs: kommendeAktiviteter } = trengerKalender
    ? await payload.find({
        collection: 'aktiviteter',
        where: {
          and: [{ offentlig: { equals: true } }, { start: { greater_than: new Date().toISOString() } }],
        },
        sort: 'start',
        limit: 50,
      })
    : { docs: [] }

  return (
    <article className="side">
      <h1>{side.tittel}</h1>
      {(side.blokker || []).map((blokk, i) => {
        if (blokk.blockType === 'tekst') {
          return (
            <div key={i} className="blokk-tekst">
              {blokk.innhold && <RichText data={blokk.innhold} />}
            </div>
          )
        }
        if (blokk.blockType === 'bilde') {
          const bilde = blokk.bilde
          const url = typeof bilde === 'object' && bilde ? bilde.url : undefined
          const alt = typeof bilde === 'object' && bilde ? bilde.alt : ''
          return (
            <figure key={i} className="blokk-bilde">
              {url && <img src={url} alt={alt || ''} />}
              {blokk.bildetekst && <figcaption>{blokk.bildetekst}</figcaption>}
            </figure>
          )
        }
        if (blokk.blockType === 'facebook') {
          return (
            <div key={i} className="blokk-facebook">
              <iframe
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(blokk.url)}`}
                width="500"
                height="500"
                style={{ border: 'none', overflow: 'hidden' }}
                loading="lazy"
              />
            </div>
          )
        }
        if (blokk.blockType === 'video') {
          const embedUrl = tilEmbedUrl(blokk.url)
          return (
            <div key={i} className="blokk-video">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <p>Ugyldig video-lenke: {blokk.url}</p>
              )}
              {blokk.bildetekst && <p className="dempet">{blokk.bildetekst}</p>}
            </div>
          )
        }
        if (blokk.blockType === 'hero') {
          const bilde = blokk.bilde
          const url = typeof bilde === 'object' && bilde ? bilde.url : undefined
          return (
            <section key={i} className="hero" style={{ backgroundImage: url ? `url(${url})` : undefined }}>
              <div className="hero-overlay">
                <h2>{blokk.overskrift}</h2>
                {blokk.knappTekst && blokk.knappLenke && (
                  <a href={blokk.knappLenke} className="hero-knapp">
                    {blokk.knappTekst}
                  </a>
                )}
              </div>
            </section>
          )
        }
        if (blokk.blockType === 'kalender') {
          let liste = kommendeAktiviteter
          if (blokk.kunGudstjenester) liste = liste.filter((a) => a.erGudstjeneste)
          liste = liste.slice(0, blokk.antall || 5)
          return (
            <div key={i} className="blokk-kalender">
              {blokk.tittel && <h2>{blokk.tittel}</h2>}
              {liste.length === 0 && <p>Ingen kommende arrangementer registrert ennå.</p>}
              <ul className="aktivitetsliste">
                {liste.map((a) => (
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
            </div>
          )
        }
        if (blokk.blockType === 'kolonner') {
          const kolonner = blokk.kolonner || []
          return (
            <div
              key={i}
              className="blokk-kolonner"
              style={{ gridTemplateColumns: `repeat(${kolonner.length}, 1fr)` }}
            >
              {kolonner.map((k, j) => {
                const bilde = k.bilde
                const url = typeof bilde === 'object' && bilde ? bilde.url : undefined
                return (
                  <div key={j} className="kolonne">
                    {url && <img src={url} alt="" />}
                    {k.overskrift && <h3>{k.overskrift}</h3>}
                    {k.innhold && <RichText data={k.innhold} />}
                  </div>
                )
              })}
            </div>
          )
        }
        return null
      })}
    </article>
  )
}
