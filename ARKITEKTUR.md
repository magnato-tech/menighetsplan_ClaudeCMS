# Arkitektur – forslag fra Sprint 0 (revidert 2)

*Arkitekt-botten, med innspill fra djevelens advokat. Til godkjenning hos Product Owner.*

## Kort fortalt

CMS-et er en **egen modul** og blir den nye offentlige nettsiden til Lillesand Misjonskirke. På sikt **erstatter** det eRedaktør og tar over `lillesandmisjonskirke.no`. Den **eneste integrasjonen** er et API i appen **Menighetsplan 2.0** ([Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil)). Derfra hentes gudstjenester og arrangementer hvert kvarter.

Detaljert kontrakt: **[INTEGRASJON-MENIGHETSPLAN.md](INTEGRASJON-MENIGHETSPLAN.md)**.

```
 Frivillige/admin ──▶ Menighetsplan 2.0 ──(offentlig API, kun lesing)──▶ CMS ──▶ Besøkende
                      (fasit, Firestore)                                 lillesandmisjonskirke.no
```

## Løs kobling

- CMS-et kjenner bare **kontrakten** (JSON v1), ikke Firestore eller appens typer.
- All kunnskap om appen ligger i én fil: `lib/kilder/menighetsplan.js`. Endrer appen seg, er det bare den filen som endres.
- Til appen har endepunktet, bruker CMS-et en **mock** (`data/menighetsplan-mock.json`) som følger kontrakten.

## Valg

| Område | Valg | Hvorfor |
|---|---|---|
| Plattform | **Node.js**, ingen eksterne pakker | Lite vedlikehold |
| Arrangementsdata | Hentes fra Menighetsplan, lagres ikke i CMS-et | Én fasit, ingen dobbel registrering |
| Siste kopi | Lagres som fil og brukes hvis API-et er nede | Aldri blank side |
| Innhold som ikke er arrangementer | «Om oss», «Kontakt», «Bli med» o.l. eies av CMS-et | Hører ikke hjemme i appen. Flyttes fra eRedaktør. |
| Hosting | Velges i Sprint 1. Kandidater er Vercel eller Google Cloud Run. (AI Studio gir bare `*.ai.studio`-adresser, så CMS-et hostes separat.) | Må kunne ta over `lillesandmisjonskirke.no` |
| Språk | JavaScript nå, TypeScript vurderes | Samme som appen |

## Datamodell i CMS-et

`uid`, tittel, beskrivelse (tema, bibeltekst, tekst), sted, start/slutt (UTC internt, vist i norsk tid), heldag, status (bekreftet/avlyst), `erGudstjeneste`, merkelapper.

## Veien fra eRedaktør til nytt CMS

1. CMS-et bygges og testes på en midlertidig adresse, mens eRedaktør lever videre.
2. Faste sider («Om oss», «Taler», «Kontakt» osv.) flyttes over.
3. Viktige gamle lenker får videresending (for eksempel `/kalender`), så Google og bokmerker ikke brytes.
4. Domenet flyttes til CMS-et, og eRedaktør sies opp.

## Visuell profil (foreløpig)

| Farge | Kode | Bruk |
|---|---|---|
| Sjøblå | `#1F4E5F` | Topp, overskrifter, lenker |
| Sand | `#F4EFE6` | Bakgrunn |
| Rav | `#C8873A` | Aksent |

Logo: kors over en bølge (`public/logo.svg`). Den kan byttes når som helst.

## Djevelens advokat – status

| Punkt | Status |
|---|---|
| **Firestore er åpen for alle** (lese og skrive, også persondata), og appen har ingen ekte innlogging | **Kritisk.** Må tas opp med PO. |
| Endepunktet finnes ikke i appen | **Uavklart.** Se CLAUDE.md punkt 6 |
| Appen skiller ikke gudstjeneste, offentlig eller avlyst, og har ingen sluttid | Midlertidige regler i integrasjonsdokumentet |
| Sommertid/tidssone | Løst. Kontrakten krever Oslo-offset, og konverteringen er testet. |
| API-et nede / feil format / ny versjon | Løst. Siste gode kopi og tydelig melding. |
| Private data lekker | Løst i kontrakten. Hviteliste, og husfellesskap (`gruppesamling`) er aldri med. |
| Tett kobling | Løst. Bare adapterfilen kjenner appen. |
| Bytte fra eRedaktør bryter lenker | Plan for videresending (se over) |

## Forslag til Sprint 1

1. **Appen:** stramme inn `firestore.rules` (sikkerhet)
2. **Appen:** lage `GET /api/offentlig/arrangementer` etter kontrakt v1, pluss feltene `publicVisible`, `kind`, `endsAt` og `cancelled`
3. **CMS:** ordentlig forside med «Neste gudstjeneste» og kommende arrangementer
4. **CMS:** velge hosting og få en midlertidig testadresse
