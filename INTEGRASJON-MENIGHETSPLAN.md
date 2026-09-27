# Integrasjon: CMS ⇄ Menighetsplan 2.0

*Kontrakt v1. Utkast fra Sprint 0.*
*Appen: [magnato-tech/Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil) (React + Firebase/Firestore).*

## Prinsipp

- CMS-et er en **egen modul** med egen kode, hosting og domene. På sikt tar det over `lillesandmisjonskirke.no` fra eRedaktør.
- CMS-et har **én eneste integrasjon**: et offentlig, lesbart API i Menighetsplan-appen. Det finnes ingen iCal og ingen andre kilder.
- **Menighetsplan er fasit** for gudstjenester og arrangementer. Alt legges inn der.
- CMS-et **leser aldri Firestore direkte** og skriver aldri tilbake. Det kjenner bare kontrakten under.
- API-et gir bare ut **offentlige felt** fra en godkjent liste. Personer, oppgaver, tildelinger, oppmøte, gruppemeldinger og husfellesskap forlater aldri appen.
- Hvis appen er nede, viser CMS-et siste vellykkede henting.

```
 Menighetsplan 2.0 (fasit)                         CMS (egen modul)
 ┌──────────────────────────────┐  GET JSON (v1)   ┌─────────────────────────┐
 │ Firestore: gatherings        │ ───────────────▶ │ adapter → felles modell │
 │ persons, tasks, assignments, │  hvert 15. min   │ → lillesandmisjonskirke │
 │ groupMessages … (deles IKKE) │                  │ siste kopi ved feil     │
 └──────────────────────────────┘                  └─────────────────────────┘
```

## Endepunkt

```
GET https://menighetsplan2-0-mobil-1.ai.studio/api/offentlig/arrangementer?fra=2026-09-01&til=2027-03-01
```

- `fra` og `til` er valgfrie. Standard er fra 7 dager tilbake til 180 dager frem.
- Endepunktet krever ingen innlogging, fordi det bare inneholder offentlig informasjon. Det kjøres **på serveren** (AI Studio full-stack/Cloud Run) og leser bare dokumenter med `publicVisible == true`.
- Headere: `Content-Type: application/json; charset=utf-8`, `Cache-Control: public, max-age=300` og `Access-Control-Allow-Origin: *`.

## Svar (versjon 1)

```json
{
  "versjon": 1,
  "kilde": "menighetsplan",
  "generert": "2026-09-27T18:00:00+02:00",
  "tidssone": "Europe/Oslo",
  "arrangementer": [
    {
      "id": "gathering-okt-1",
      "type": "gudstjeneste",
      "tittel": "Gudstjeneste",
      "tema": "Guds rike er nær",
      "bibeltekst": "Mark 1,14–15",
      "beskrivelse": "",
      "start": "2026-10-04T11:00:00+02:00",
      "slutt": "2026-10-04T12:30:00+02:00",
      "heldag": false,
      "sted": "Lillesand Misjonskirke",
      "status": "planlagt",
      "tagger": [],
      "sistEndret": "2026-09-20T10:00:00Z"
    }
  ]
}
```

| Felt | Påkrevd | Merknad |
|---|---|---|
| `id` | ja | Stabil. Firestore-dokument-ID for `gatherings` |
| `type` | ja | `gudstjeneste` eller `arrangement`. Styrer merkelappen «Gudstjeneste» |
| `tittel` | ja | |
| `start` | ja | ISO 8601 **med Oslo-offset** (+01:00/+02:00) |
| `slutt` | nei | Samme format |
| `status` | ja | `planlagt` eller `avlyst` |
| `tema`, `bibeltekst`, `beskrivelse`, `sted`, `tagger`, `heldag`, `sistEndret` | nei | Mangler de, tåler CMS-et det |

**Regler for endringer:** Nye felt kan legges til uten ny versjon. Å fjerne eller endre betydningen av et felt krever `versjon: 2`. CMS-et avviser ukjente versjoner med en tydelig melding og fortsetter å vise siste gode data.

## Kobling fra Menighetsplan 2.0 sin datamodell

| Kontrakt | Fra `Gathering` (src/types.ts) |
|---|---|
| `id` | `id` |
| `tittel` | `title` |
| `tema` / `bibeltekst` | `theme` / `bibleText` |
| `sted` | `location` |
| `start` | `startsAt` (UTC i Firestore) → konverteres til Oslo-tid med offset |
| `slutt` | `endsAt` (nytt felt), ellers `start` + 90 min |
| `type` | `kind === "gudstjeneste"` (nytt felt) → `gudstjeneste`, ellers `arrangement` |
| hvem som tas med | `type === "arrangement"` og ikke `publicVisible === false`. `gruppesamling` er aldri offentlig. |
| `status` | `cancelled` (nytt felt) → `avlyst`, ellers `planlagt` |
| `beskrivelse` | `publicDescription` (nytt felt) |
| `tagger` | Finnes ikke ennå (tom liste) |
| **tas aldri med** | `groupId`, `hostPersonId`, `invitationSent*`, `programSchedule` (inneholder `taskId`) |

### Anbefalte tillegg i appen (små, bakoverkompatible)

```ts
// src/types.ts – Gathering
publicVisible?: boolean;          // eksplisitt «vis på nettsiden» (standard: false)
kind?: "gudstjeneste" | "annet";  // i stedet for å gjette ut fra tittelen
endsAt?: string;                  // ISO
cancelled?: boolean;              // vis «Avlyst» i stedet for å slette
publicDescription?: string;       // kort tekst til nettsiden
```

## Hvor endepunktet bor

**Uavklart.** Appen utvikles i Google AI Studio, og PO ønsker ikke å endre den der. Alternativene er:

1. CMS-et leser direkte fra appens Firestore via Googles REST-API. Det leser bare fra, bare samlingen `gatherings`, og gjør om til kontrakten over med hvitelistede felt, uten å endre appen.
2. Appen flyttes ut av AI Studio, slik at endepunktet kan legges til i koden.

## ⚠️ Sikkerhet: må fikses før noe går offentlig

`firestore.rules` i appen har i dag `allow read: if true; allow write: if true;` på **alle** samlinger, også `persons` (navn, telefon, e-post) og `groupMessages`. Firebase-konfigurasjonen ligger åpent i nettleseren. Derfor kan hvem som helst i dag **lese og endre alle data** i databasen, helt uten appen.

Dette gjelder uavhengig av CMS-et, men blir viktigere når kirken får en offentlig nettside som peker til appen. Minimum er å kreve innlogging for lesing og skriving, og at bare admin kan skrive. Det er også grunnen til at CMS-et **ikke** skal lese Firestore direkte, men gå via et server-endepunkt som bare gir ut hvitelistede felt.

## Åpne punkter

1. ~~Hvilken adresse har appen?~~ `https://menighetsplan2-0-mobil-1.ai.studio`
2. Hvordan CMS-et henter data (se over), og sikkerheten i appens database.
3. Mock-dataene i appen har `startsAt` som `"…T11:00:00.000Z"`, altså kl. 13 norsk tid. Appen lagrer riktig UTC når noe opprettes i skjemaet, så dette gjelder bare testdataene.
