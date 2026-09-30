import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function Nav() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: sider } = await payload.find({
    collection: 'sider',
    where: { visIMeny: { equals: true } },
    sort: 'rekkefolge',
    limit: 50,
  })

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          Lillesand Misjonskirke
        </Link>
        <nav className="meny">
          <Link href="/">Hjem</Link>
          {sider.map((side) => (
            <Link key={side.id} href={`/${side.slug}`}>
              {side.tittel}
            </Link>
          ))}
          <Link href="/logg-inn" className="logg-inn">
            Logg inn
          </Link>
        </nav>
      </div>
    </header>
  )
}
