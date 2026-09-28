# Lillesand Misjonskirke – CMS

Egen modul – den nye offentlige nettsiden (skal erstatte eRedaktør). Eneste integrasjon er **Menighetsplan 2.0** via API (se `INTEGRASJON-MENIGHETSPLAN.md`). Foreløpig vises rådataene på en enkel side.

Til Menighetsplan har endepunktet, bruker CMS-et en innebygd mock av API-et.

## Slik starter du (Windows)

1. **Installer Node.js** (én gang): last ned «LTS» fra <https://nodejs.org> og installer med standardvalg.
2. Åpne mappen `CMS system` i Filutforsker, klikk i adressefeltet, skriv `cmd` og trykk Enter.
3. Skriv:
   ```
   npm start
   ```
4. Åpne <http://localhost:3000> i nettleseren.

Stopp serveren med `Ctrl + C` i det svarte vinduet.

Det trengs **ikke** `npm install` – prosjektet har ingen eksterne pakker.

## Koble til appen

Standard er en innebygd mock av API-et. Menighetsplan-appen (via GAIS) har nå et ekte,
offentlig API-endepunkt på Google Cloud Run. Sett miljøvariabelen for å bruke det:

```
set MENIGHETSPLAN_API_URL=https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer
npm start
```

Endepunktet krever ingen nøkkel/innlogging, filtrerer offentlig/internt server-side
(kun offentlige arrangementer sendes ut), og har 5 minutters caching (`Cache-Control`).
Merk: dette er en dev-sandbox på Cloud Run og kan få en «kald start» (litt treg første
respons) etter lang inaktivitet – appens cache-i-fil-fallback (`innhold/cache/siste-vellykkede.json`)
tar seg av dette hvis kallet skulle feile eller time ut.

| Variabel | Standard | Betydning |
|---|---|---|
| `MENIGHETSPLAN_API_URL` | innebygd mock | Adressen til appens offentlige API |
| `PORT` | `3000` | Hvilken port siden kjører på |
| `REFRESH_MINUTES` | `15` | Hvor ofte appen spørres på nytt |

## Test

```
npm test
```

Testene sjekker kontrakten mot Menighetsplan: tidssone og sommertid, avlyste arrangementer, manglende felt og at feil format eller ny versjon gir en tydelig feilmelding.

## Kodestruktur

CMS-et er modulær og kan vokse uten omskriving:

- **`lib/arrangementer.js`** – Henting og caching av arrangementer fra Menighetsplan-API
- **`lib/innhold/lager.js`** – Grensesnitt for lagring av sider (filbasert, senere bytbar mot database)
- **`lib/visning/felles.js`** – HTML-layout, escapering og formattering av datoer
- **`lib/visning/blokker.js`** – Register over blokktyper og rendering av innhold
- **`lib/visning/forside.js`** – Forsiden med arrangementer
- **`lib/visning/side.js`** – Visning av faste sider
- **`lib/visning/debug.js`** – Debug-side med rådata
- **`innhold/sider/`** – JSON-filer for hver fast side (én fil per slug)

Sider er helt separate fra arrangementer og bruker samme HTML-layout. For å legge til en ny blokktype: åpne `lib/visning/blokker.js`, legg til en renderer-funksjon og registrer den i `blokker`-objektet.

## Innhold

| Fil | Hva |
|---|---|
| `server.js` | Webserveren og rådata-siden |
| `lib/kilder/menighetsplan.js` | Adapter for Menighetsplan-API (eneste sted som kjenner appen) |
| `data/menighetsplan-mock.json` | Eksempelsvar fra Menighetsplan-API (kontrakt v1) |
| `public/logo.svg` | Foreløpig logo |
| `ARKITEKTUR.md` | Teknisk forslag fra Sprint 0 |
| `INTEGRASJON-MENIGHETSPLAN.md` | API-kontrakten mot Menighetsplan |
