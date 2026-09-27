# Prosjektdokument: Menighets-CMS

*Sist oppdatert: 2026-09-28, etter Sprint 3b. Neste: ikke planlagt (se punkt 9).*

> **Ny økt? Start her:** Les dette dokumentet, så punkt 9–14. Kjør neste sprint i punkt 10 uten å spørre om lov på forhånd, og rapporter til PO etterpå. Oppdater punkt 9 og 10 når sprinten er ferdig.

## 1. Formål
Et enkelt, vedlikeholdsfritt CMS (offentlig nettside) for Lillesand Misjonskirke, der **mesteparten av innholdet genereres automatisk** fra menighetsappen **Menighetsplan 2.0** ([Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil)). CMS-et skal med tiden **erstatte eRedaktør** og ta over `lillesandmisjonskirke.no`.

## 2. Kjerneprinsipp
- CMS-et er en **egen modul** (egen kode, hosting og domene) som **kun integrerer med Menighetsplan 2.0, via et offentlig, lesbart API**. Ingen iCal eller andre kilder. Kontrakt: `INTEGRASJON-MENIGHETSPLAN.md`.
- **Menighetsplan er fasit** for gudstjenester og arrangementer. Enkeltarrangementer (Kulturnatta, Bibeldagen o.l.) legges inn der, ikke dobbelt i CMS-et.
- CMS-et leser, men skriver aldri tilbake. Persondata og interne data forlater aldri appen.
- All kunnskap om appen ligger i én adapterfil (`lib/kilder/menighetsplan.js`). CMS-et leser aldri Firestore direkte.
- **Appens kode endres ikke fra CMS-prosjektet.** Appen utvikles og publiseres i Google AI Studio (`https://menighetsplan2-0-mobil-1.ai.studio`). PO ønsker **ikke** å lime inn prompter i AI Studio. Mappen `..\Menighetsplan2.0_mobil-main` er en lokal **sandkasse**: der kan vi endre fritt, men endringene når ikke den ekte appen eller databasen.
- Filen `AI-STUDIO-PROMPTER.md` er **slettet med vilje** og skal ikke gjenskapes.
- **GitHub:** CMS-et skal ha sitt eget repo (f.eks. `Menighetsplan_CMS_Claude`). Appens repo røres ikke.

## 3. Foreløpige antagelser (bekreftes/justeres i Sprint 0)
- Dagens nettside (lillesandmisjonskirke.no, eRedaktør) skal erstattes av CMS-et. Faste sider flyttes over, og gamle lenker videresendes.
- Redaktører legger inn arrangementer i Menighetsplan. CMS-ets egen admin gjelder kun faste sidetekster.
- Enkel, ikke-teknisk administrasjon er et krav — brukergrensesnittet skal være så enkelt at det ikke krever opplæring.

### Avklart med Product Owner (Sprint 0)
| Spørsmål | Svar |
|---|---|
| Navn | **Lillesand Misjonskirke** |
| Domene | `lillesandmisjonskirke.no`, overtas fra eRedaktør når CMS-et er klart |
| Hosting | Velges i Sprint 1 (CMS-et). Appen ligger på AI Studio/Cloud Run. |
| Logo/farger | Teamet bestemmer – foreløpig profil i `ARKITEKTUR.md` |
| Språk | Kun norsk |
| Merkelapper | Kun «Gudstjeneste» |
| Datakilde | **Kun** Menighetsplan 2.0 via API. Mock (`data/menighetsplan-mock.json`) til endepunktet finnes |
| Offentlig/privat | Alt i kalenderen kan vises offentlig |
| Personlig innhold | Vises i appen **Menighetsplan 2.0**, ikke i CMS-et. CMS-et er kun offentlig og kan lenke dit. |
| Kobling | CMS er egen modul, koblet kun til Menighetsplan 2.0 via API |

## 4. Teknisk retning (se `ARKITEKTUR.md`)
- Enkel, robust stack fremfor "kult og komplisert". Node.js uten eksterne pakker.
- Henter fra Menighetsplan-API hvert 15. min, med siste gode kopi som fallback
- Offentlig side med kommende arrangementer, filter på gudstjeneste
- Lett admin kun for faste sidetekster

## 5. Botteam (maks 8, opprettes og justeres av produktsjef ved behov)

| # | Bot | Ansvar |
|---|-----|--------|
| 1 | **Arkitekt** | Teknisk design, valg av verktøy, datamodell, og overgangen fra eRedaktør |
| 2 | **Backend-utvikler** | Menighetsplan-adapteren, og API-endepunktet på app-siden |
| 3 | **Frontend-utvikler** | Offentlig visning av kalenderen/arrangementer |
| 4 | **Admin-utvikler** | Enkelt redigeringspanel for sidetekster og brukere |
| 5 | **QA/Tester** | Sjekker at ting faktisk fungerer, spesielt at kontrakten mot Menighetsplan holder |
| 6 | **Sikkerhet** | Passordbeskyttelse av admin, trygg lagring, og at API-et bare gir ut offentlige felt |
| 7 | **UX-rådgiver** | Sørger for at ikke-tekniske brukere finner frem uten hjelp |
| 8 | **Djevelens advokat** | Utfordrer valg før de låses — se punkt 6 |

## 6. Djevelens advokat — status (detaljer i `ARKITEKTUR.md`)
- **Kritisk:** `firestore.rules` i appen tillater lesing og skriving for alle, også av persondata, og appen har ingen ekte innlogging. Må tas opp med PO.
- **Uavklart hovedspørsmål:** Appen har ikke noe API, og PO vil ikke endre den via AI Studio. Alternativer som må avklares med PO: (a) CMS-et leser direkte fra appens Firestore via Googles REST-API (kun `gatherings`, kun offentlige felt), eller (b) appen utvikles et annet sted enn AI Studio slik at API-et kan legges til.
- Appen mangler felt for offentlig/gudstjeneste/avlyst/sluttid. Midlertidige regler står i `INTEGRASJON-MENIGHETSPLAN.md`.
- Løst: sommertid, API nede/feil format/ny versjon, hviteliste mot datalekkasje, løs kobling.
- Overgang fra eRedaktør: faste sider flyttes, og gamle lenker videresendes.

## 7. Arbeidsform
- **Fokus nå (PO):** MVP på localhost med testdata. Sikkerhet er ikke viktig i denne fasen. **Fleksibilitet er et must:** ikke lås løsningen, ikke bygg et «proft» CMS nå, men legg til rette for et mer avansert CMS senere (se punkt 11–13).
- **Claude er produktsjef** og kjører sprintene selv. PO ser på resultatet etter hver sprint og gir innspill.
- **Tokenbudsjettet er fast** (ukentlig abonnement, ingenting ekstra). Claude vurderes på hva som oppnås innenfor det. Regler:
  - Én **ny økt per sprint**, slik at konteksten er kort. Dette dokumentet er overleveringen.
  - Prosjektleder: **Sonnet 5** med lav/middels effort. Bytt til **Opus** bare når en sprint handler om arkitektur eller strukturvalg.
  - Koding: **Haiku 4.5-agenter** med små, presise oppgavebeskrivelser (filer, grensesnitt, hvordan resultatet skal verifiseres).
  - Prosjektlederen verifiserer alltid selv, ved å kjøre testene og se på siden, før rapporten går til PO.
  - Prosjektlederen kan ikke bytte sin egen modell. Trenger en sprint Opus, må prosjektlederen si fra til PO før sprinten starter. Agenter får modellen sin ved oppstart (`model: haiku`).
  - Ikke start agenter for små ting prosjektlederen kan gjøre selv i løpet av noen få steg. Les bare de filene oppgaven trenger, og ikke les samme fil flere ganger.
- **Korte sprinter**, planlagt individuelt før hver økt
- Før hver sprint: kort planlegging + djevelens advokat får ordet før noe låses
- Etter hver sprint: enkel gjennomgang med deg (Product Owner) — hva er gjort, hva trenger avklaring, hva er neste steg
- Jeg henter informasjon fra deg fortløpende, kun når den faktisk trengs — ikke alt på én gang

## 8. Sprint 0 — mål og status
1. ✅ Avklare gjenstående åpne spørsmål (punkt 3)
2. ✅ Arkitekt-bot foreslår teknisk løsning i enkelt språk → `ARKITEKTUR.md` (revidert: egen modul, kun Menighetsplan 2.0) og `INTEGRASJON-MENIGHETSPLAN.md`
3. ✅ Minimalt skjelett: henter fra (mock av) Menighetsplan-API og viser rådata → `npm start` (se `README.md`)
4. ✅ Arbeidsform godkjent av PO (se punkt 7)

## 9. Status per sprint
**Sprint 1** (i app-sandkassen)
- ✅ 1b: `Gathering` fikk feltene `isPublic`, `isGudstjeneste`, `cancelled`, `endsAt` (blueprint, `types.ts`, mockdata, admin-skjema). Finnes bare lokalt.
- ⏸ Satt på vent av PO: hvordan CMS-et henter ekte data (punkt 6), og lukking av databasen. CMS-et bruker mock til videre.

**Sprint 2** ✅ Offentlig forside: «Neste gudstjeneste», kommende arrangementer per måned, filteret «Alle / Kun gudstjenester», avlyste vises gjennomstreket. Rådata på `/debug`.

**Sprint 3a** ✅ Modulstruktur og faste sider (27 tester grønne):
- Sidene `om-oss`, `barn-og-unge` og `kontakt` med meny. Gudstjeneste-merkelapp i arrangementslisten.
- ⚠ Sidene har **plassholdertekst** som er funnet på (telefon, e-post, adresse). Kontaktsiden sier gudstjeneste kl. 10:00, mockdataene sier 11:00. Må erstattes med ekte tekst.

**Sprint 3b** ✅ Enkel admin for faste sider (42 tester grønne):
- `/admin` (sideliste), `/admin/ny`, `/admin/rediger/<slug>`, `/admin/slett/<slug>` (bekreftelse før sletting). Ett tekstfelt per side med hjelpetekst om `##`/`-`/tom linje.
- Beskyttet med HTTP Basic Auth, passord fra `ADMIN_PASSORD` (standard `admin`).
- Moduler: `lib/admin/` (auth.js, validering.js, index.js), `lib/visning/admin.js`. `lib/innhold/lager.js` fikk `slettSide(slug)`, og fyller inn `modellVersjon: 1` / blokk-`id` for eldre sider ved lesing. De tre eksempelsidene er oppdatert med disse feltene.
- Verifisert av Claude: `node --test` (42/42 grønt) og hele curl-flyten (401 uten auth, 200 med, opprett→303, vis offentlig→200, slett→303, deretter 404).

**Senere (ikke planlagt):** koble til ekte data, eget GitHub-repo, hosting, overgang fra eRedaktør med videresending av gamle lenker.

## 10. Neste sprint
Ikke planlagt ennå. Kandidater fra gjeldsloggen (punkt 13): ekte sidetekster inn via admin, eller avklare datakilde-spørsmålet i punkt 6 med PO. Avklares med PO før neste økt.

## 11. Kodestruktur og prinsipper for fleksibilitet (Sprint 3a)
- `lib/innhold/lager.js`: eneste vei til lagret innhold (`listSider`, `hentSide`, `lagreSide`). Filbasert i dag (`innhold/sider/<slug>.json`). **Kan byttes mot en database uten at resten endres.**
- `lib/visning/blokker.js`: register over blokktyper. En side er `{ slug, tittel, meny: { vis, rekkefolge }, blokker: [...], sistEndret }`. Nye innholdstyper, som bilde eller kart, blir nye blokktyper.
- `lib/visning/*`: layout (`felles.js`), `forside.js`, `side.js`, `debug.js`. `lib/arrangementer.js` tar seg av henting og cache. `server.js` er bare en ruter.
- Innholdet ligger som ren JSON, så det kan flyttes til et større CMS senere.
- Ingen npm-pakker og ingen rammeverk før det finnes et konkret behov.

## 12. Strategi: MVP nå, avansert CMS senere
- **Varig (gjøres riktig nå):** innholdsmodellen (blokker med fast `id`, `modellVersjon`), lagring bare via `lager.js`, stabile nettadresser og en tabell som videresender gamle eRedaktør-lenker, og adapteren mot Menighetsplan.
- **Kastbart (bevisst enkelt):** admin-grensesnitt, design, innlogging og fillagring.
- Ingen funksjon bygges uten et konkret behov nå. Hver snarvei føres i gjeldsloggen (punkt 13).
- **Beslutningspunkt etter MVP:** PO bestemmer hva «avansert» skal bety, og om vi bygger videre selv eller flytter innholdet til et ferdig CMS. Innholdet skal kunne eksporteres uten tap.
- **Foreløpig anbefaling fra Claude (ikke besluttet):** en blokkredigerer (i stil med Editor.js eller WordPress Gutenberg) som lagrer JSON-blokker, og ikke fri plassering av elementer eller en HTML-basert WYSIWYG-editor. Ferdige CMS vurderes ved beslutningspunktet: Payload, Directus, Sanity, Decap og WordPress.

## 13. Gjeldslogg (bevisste snarveier som må håndteres senere)
| Snarvei | Hvorfor den er greit nå | Må gjøres senere |
|---|---|---|
| Plassholdertekst på de faste sidene | Vi trenger noe å vise i MVP-en | PO legger inn ekte tekst via admin (3b) |
| Mock i stedet for ekte Menighetsplan-data | Datakilden er ikke avklart (punkt 6) | Koble til ekte data og verifisere mot kontrakten |
| Nye felt på `Gathering` finnes bare i app-sandkassen | Appen endres ikke via AI Studio nå | Få feltene inn i den ekte appen |
| Egen enkel tekstmarkering (`##`, `-`) i stedet for en redigerer | Fungerer, og lagres som blokker | Erstattes av en blokkredigerer |
| Fillagring uten låsing og historikk | Én redaktør på localhost | Database eller ferdig CMS |
| Admin med HTTP Basic Auth (Sprint 3b) | Sikkerhet er ikke viktig nå (PO) | Ekte innlogging og roller |
| Den ekte appdatabasen er åpen for alle | Utenfor CMS-et, satt på vent av PO | Lukkes før nettsiden settes i drift |

## 14. Praktisk (Windows-maskinen til PO)
- Start: `node server.js` (port 3000). Tester: `node --test`.
- Browser-panelets `preview_start` med launch.json **feiler** på denne maskinen («'C:\Program' is not recognized»). Start i stedet serveren i bakgrunnen med PowerShell (`Set-Location "<mappe>"; node server.js`) og åpne `http://localhost:3000` i panelet. Stopp serveren når du er ferdig.
- `git` i disse mappene treffer et repo i hjemmemappen til brukeren. Ikke kjør git-kommandoer her før CMS-et har fått sitt eget repo.
