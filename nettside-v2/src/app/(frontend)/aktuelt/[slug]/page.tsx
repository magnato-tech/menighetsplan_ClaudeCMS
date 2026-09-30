import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import config from '@/payload.config'
import '../../styles.css'

export default async function NyhetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'nyheter',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const nyhet = docs[0]
  if (!nyhet) return notFound()

  return (
    <article className="side">
      {nyhet.bilde && typeof nyhet.bilde === 'object' && nyhet.bilde.url && (
        <img src={nyhet.bilde.url} alt={nyhet.bilde.alt || ''} style={{ width: '100%', marginBottom: '1rem' }} />
      )}
      <h1>{nyhet.tittel}</h1>
      {nyhet.innhold && <RichText data={nyhet.innhold} />}
    </article>
  )
}
