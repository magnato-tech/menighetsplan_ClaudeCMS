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
    depth: 1,
  })

  // Del sidene i toppnivå og barn
  const toppnivaSider: typeof sider = []
  const barnSider: Record<string | number, typeof sider> = {}

  sider.forEach((side) => {
    if (!side.foreldreside) {
      toppnivaSider.push(side)
    } else {
      const forelder =
        typeof side.foreldreside === 'object' ? side.foreldreside.id : side.foreldreside
      if (!barnSider[forelder]) {
        barnSider[forelder] = []
      }
      barnSider[forelder].push(side)
    }
  })

  // Sorter barn-sidene på rekkefolge
  Object.keys(barnSider).forEach((forelder) => {
    barnSider[forelder].sort(
      (a, b) => (a.rekkefolge || 0) - (b.rekkefolge || 0),
    )
  })

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          Lillesand Misjonskirke
        </Link>
        <nav className="meny">
          <Link href="/">Hjem</Link>
          {toppnivaSider.map((side) => {
            const barn = barnSider[side.id] || []
            if (barn.length === 0) {
              return (
                <Link key={side.id} href={`/${side.slug}`}>
                  {side.tittel}
                </Link>
              )
            } else {
              return (
                <div key={side.id} className="meny-punkt-med-undermeny">
                  <Link href={`/${side.slug}`}>
                    {side.tittel}
                  </Link>
                  <ul className="undermeny">
                    {barn.map((barnSide) => (
                      <li key={barnSide.id}>
                        <Link href={`/${barnSide.slug}`}>
                          {barnSide.tittel}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          })}
          <Link href="/logg-inn" className="logg-inn">
            Logg inn
          </Link>
        </nav>
      </div>
    </header>
  )
}
