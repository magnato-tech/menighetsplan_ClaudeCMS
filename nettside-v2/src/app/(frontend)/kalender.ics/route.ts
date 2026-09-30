import { getPayload } from 'payload'
import config from '@/payload.config'
import { genererIcs } from '@/lib/ical'

export async function GET(request: Request) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: aktiviteter } = await payload.find({
    collection: 'aktiviteter',
    where: {
      and: [{ offentlig: { equals: true } }, { start: { greater_than: new Date().toISOString() } }],
    },
    sort: 'start',
    limit: 500,
    depth: 0,
  })

  const url = new URL(request.url)
  const ics = genererIcs(aktiviteter, url.hostname)

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="kalender.ics"',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
