import Link from 'next/link'

export default function LoggInnPage() {
  return (
    <div className="logg-inn-side">
      <h1>Logg inn</h1>
      <p>
        Innlogging for Min side og administrasjon kommer her. Ikke koblet til ekte autentisering
        ennå — dette er en plassholder i oppbyggingsfasen.
      </p>
      <p>
        <Link href="/min-side">Se en forhåndsvisning av Min side</Link> (uten ekte innlogging — du
        kan bytte hvilken bruker du ser siden som).
      </p>
    </div>
  )
}
