import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import '../styles.css'

export default async function SidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'sider',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const side = docs[0]
  if (!side) return notFound()

  return (
    <article className="side">
      <h1>{side.tittel}</h1>
      {(side.blokker || []).map((blokk, i) => {
        if (blokk.blockType === 'tekst') {
          return <div key={i} className="blokk-tekst">{/* lexical richText rendres senere */}</div>
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
        return null
      })}
    </article>
  )
}
