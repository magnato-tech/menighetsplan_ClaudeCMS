# Prosjektdokument: Menighets-CMS

*Sist oppdatert: 2026-09-28, etter Sprint 8 (Claude tok over som prosjektleder igjen etter at GAIS avsluttet sitt arbeid). Neste: se punkt 10.*

> **Ny økt? Start her:** Les dette dokumentet, så punkt 9–14. Kjør neste sprint i punkt 10 uten å spørre om lov på forhånd, og rapporter til PO etterpå. Oppdater punkt 9 og 10 når sprinten er ferdig.

## 1. Formål
Et enkelt, vedlikeholdsfritt CMS (offentlig nettside) for Lillesand Misjonskirke, der **mesteparten av innholdet genereres automatisk** fra menighetsappen **Menighetsplan 2.0** ([Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil)). CMS-et skal med tiden **erstatte eRedaktør** og ta over `lillesandmisjonskirke.no`.

## 2. Kjerneprinsipp
- CMS-et er en **egen modul** (egen kode, hosting og domene) som **kun integrerer med Menighetsplan 2.0, via et offentlig, lesbart API**. Ingen iCal, ingen direkte Firestore-tilkobling, ingen andre kilder. Kontrakt: `INTEGRASJON-MENIGHETSPLAN.md`.
  - **Avklart endelig 2026-09-28 (se punkt 6):** Det ble kortvarig vurdert å koble CMS-et direkte til appens Firestore-database (Firebase Web SDK) — det er **forlatt**. Det faktiske oppsettet: API-et kjører i selve appen (`server.ts` i AI Studio), deployet på Google Cloud Run, og eksponerer `GET /api/offentlig/arrangementer` (åpent, ingen nøkkel, server-side filtrert til kun offentlige/relevante felt, `Cache-Control: public, max-age=300`). URL: se punkt 14. Dette er nøyaktig den opprinnelige kontrakten CMS-et allerede var bygget mot (`lib/kilder/menighetsplan.js`), og krever ingen npm-avhengigheter.
- **Menighetsplan er fasit** for gudstjenester og arrangementer. Enkeltarrangementer (Kulturnatta, Bibeldagen o.l.) legges inn der, ikke dobbelt i CMS-et.
- CMS-et leser, men skriver aldri tilbake. Persondata og interne data forlater aldri appen — API-et filtrerer dette bort server-side før CMS-et ser noe (bekreftet av GAIS: ingen personopplysninger i responsen, interne samlinger/grupper filtreres bort).
- All kunnskap om appen ligger i én adapterfil (`lib/kilder/menighetsplan.js`). CMS-et leser aldri Firestore direkte, og kjenner ikke til databasen bak API-et.
- **Appens kode endres ikke fra CMS-prosjektet.** Appen utvikles og publiseres i Google AI Studio (`https://menighetsplan2-0-mobil-1.ai.studio`). PO ønsker **ikke** å lime inn prompter i AI Studio. Mappen `..\Menighetsplan2.0_mobil-main` er en lokal **sandkasse**: der kan vi endre fritt, men endringene når ikke den ekte appen eller databasen.
- Filen `AI-STUDIO-PROMPTER.md` er **slettet med vilje** og skal ikke gjenskapes.
- **GitHub:** CMS-et har sitt eget repo, `magnato-tech/menighetsplan_ClaudeCMS`. Appens repo røres ikke. GAIS har fortsatt pushrettigheter til CMS-repoet fra tidligere, men trenger trolig ikke bruke dem nå — API-tilkoblingen er kun én miljøvariabel (`MENIGHETSPLAN_API_URL`, se README), ingen kodeendring i CMS-repoet var nødvendig utover en liten feltmapping-fiks (se punkt 10).

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
- **Nedgradert 2026-09-28 (ikke lenger CMS-ets problem):** Det tidligere kritiske punktet om at `firestore.rules` tillot lesing/skriving for alle, gjaldt et scenario der CMS-et skulle koble seg direkte til Firestore. Siden CMS-et nå går via appens API (punkt 2), er databasens egne regler internt anliggende for appen/GAIS, ikke noe CMS-et er eksponert mot — så lenge API-et fortsetter å filtrere korrekt server-side (bekreftet av GAIS, se punkt 2).
- **Avklart endelig 2026-09-28:** Hovedspørsmålet (appen hadde ikke noe API) er løst — appen *har* nå et API (`server.ts` i AI Studio, deployet på Cloud Run), som er alternativ (b) fra den opprinnelige listen. Det korte mellomsteget med direkte Firestore-tilkobling (alternativ a) ble forlatt før noe ble bygget.
- Appen mangler felt for offentlig/gudstjeneste/avlyst/sluttid **i selve appens Firestore-modell** — men dette er nå skjult bak API-et, som allerede leverer `type`, `status` (inkl. `avlyst`), `start`/`slutt`. Ikke lenger CMS-ets bekymring på samme måte som før.
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

**Sprint 4** ✅ Mer automatisk og relevant forside (58 tester grønne):
- Filter «Alle arrangementer / Kun gudstjenester» (`?visning=`), gjenopprettet og koblet opp (var falt ut i modulariseringen i 3a, CSS lå klar men ubrukt).
- Ny seksjon «Denne uken» øverst: arrangementer neste 7 dager, kronologisk.
- Kategori-tagger fra Menighetsplan (`tagger`-feltet, f.eks. «Familie», «Type: Konsert») vises nå på arrangementsrader — mer av dataene fra kilden brukes automatisk, uten dobbel «Gudstjeneste»-tag.
- Ny fil `lib/visning/relevans.js` med rene, testbare funksjoner for filtrering/uke-uttrekk.
- Verifisert av Claude: `node --test` (58/58) og curl (filter ekskluderer riktig, tags vises i HTML).

**Sprint 5** ✅ Lokale overstyringer for arrangementer (74 tester grønne):
- Nytt lager `lib/innhold/overstyringer.js` → `innhold/arrangement-overstyringer.json`, keyet på Menighetsplan sin `uid`. Helt uavhengig av og skriver aldri til Menighetsplan.
- `/admin/arrangementer`: liste over kommende arrangementer med «Fremhev»/«Skjul»-knapper per rad. Lenke fra `/admin`.
- Offentlig forside: skjulte arrangementer vises ingen steder (verken Fremhevet, Denne uken eller månedsliste), fremhevede får egen seksjon øverst.
- Verifisert av Claude: `node --test` (74/74) og curl-flyt (401→200 med auth, fremhev→vises i Fremhevet, skjul→forsvinner helt). NB: agenten glemte å nullstille testdataene sine i `arrangement-overstyringer.json` etter egen verifisering — Claude nullstilte filen til `{}` før og etter sin egen verifisering, slik at PO møter en ren tilstand.

**Om PO-oppdraget «hent mest mulig data automatisk, moderne admin»:** Sprint 4 dekket automatikk-delen, Sprint 5 dekket kjernen i «styre hva som legges ut» (fremhev/skjul). Det uavklarte spørsmålet i punkt 6 (ekte tilgang til Menighetsplan, Firestore åpen for alle) er IKKE rørt — krever fortsatt et valg fra PO. Sprint 6 tar fatt på resten av «moderne admin»: samlet dashboard og bedre tilbakemelding i admin-grensesnittet.

**Sprint 6** ✅ Admin-dashboard og tilbakemelding (84 tester grønne):
- `/admin` er nå et dashboard via `renderDashboard()` (brukte tidligere rå inline-HTML, ikke `layout()` — rettet). Viser tilkoblingsstatus mot Menighetsplan (sist hentet/feil), antall sider, antall kommende arrangementer, og en «Hent nå»-knapp (`POST /admin/hent-na`).
- Grønne suksessbannere (`.suksess`-klasse i `felles.js`) etter opprett/rediger/slett side og fremhev/skjul arrangement, via `?utfort=...`.
- Verifisert av Claude: `node --test` (84/84), curl mot dashboard/hent-na/suksessbanner, offentlig forside uendret (200). Ingen testdata latt igjen (sjekket `arrangement-overstyringer.json` er `{}` og `innhold/sider/` har kun de tre ekte sidene).

**Kvalitetsgjennomgang (djevelens advokat), samme kveld:** Claude kjørte en selvstendig kodegjennomgang (8 vinkler: linje-for-linje, fjernet oppførsel, kryssfil-sporing, reuse/simplification/efficiency, altitude/conventions) av alt som ble bygget i Sprint 4–6, siden mye ble skrevet av flere Haiku-agenter på rad uten menneskelig blikk innimellom. Se punkt 15 for resultat.

**Sprint 7** ✅ Automatisk opprydding og avlyst-status (88 tester grønne):
- `lib/innhold/overstyringer.js` fikk `ryddOpp(gyldigeUider)`: fjerner overstyringer for arrangementer som ikke lenger finnes hos Menighetsplan (f.eks. slettet der), så fila ikke vokser med utdaterte valg over tid. Kjøres automatisk hver gang `/admin/arrangementer` lastes.
- Admin-oversikten over arrangementer viser nå «Avlyst»-status (samme røde tag som på den offentlige forsiden), slik at PO ser det direkte når hen skal vurdere fremhev/skjul.
- Verifisert av Claude: `node --test` (88/88), og curl med en simulert utdatert overstyring (bekreftet fjernet ved neste sideinnlasting, gyldig overstyring beholdt).

**Senere (ikke planlagt):** koble til ekte data (avhenger av PO-valg i punkt 6), eget GitHub-repo (avhenger av at `gh` installeres), hosting, overgang fra eRedaktør med videresending av gamle lenker.

## 10. Neste sprint
**Ekte API-tilkobling landet 2026-09-28.** GAIS bekreftet at API-et kjører på Cloud Run (URL i punkt 14) og delte et ekte eksempelsvar. Claude sammenlignet det mot kontrakten i `lib/kilder/menighetsplan.js` og fant ett avvik: ekte `tagger` er en liste med rene strenger (`["gudstjeneste"]`), mens koden fra Sprint 4 forventet objekter (`{ verdi }`, som i mock-dataene) — det ga tomme kategori-tagger og ville laget en duplikat "Gudstjeneste"-tag. Rettet i `lib/kilder/menighetsplan.js` (støtter nå begge former, og filtrerer bort den rå "gudstjeneste"-taggen når `erGudstjeneste` allerede er satt), med ny test i `test/kilder.test.js` som bruker GAIS sitt ekte eksempelsvar direkte.

**Ikke verifisert av Claude:** faktisk nettverkskall mot Cloud Run-URL-en — sandkassen Claude kjører i blokkerer utgående kall dit (proxy svarer 403, policy-avgjørelse, ikke appens feil). PO må selv sette `MENIGHETSPLAN_API_URL` (se README) og bekrefte at ekte arrangementer vises riktig på `http://localhost:3000` før dette regnes som fullt verifisert.

**Sprint 8** ✅ Etter at GAIS avsluttet sitt arbeid (bekreftet via GitHub: `master` uendret siden Claude sin forrige commit, ingen force push skjedde), tok Claude over som prosjektleder igjen og kjørte tre parallelle Haiku-agenter (100/100 tester grønne):
- **Defensiv `isPublic`-sjekk** i `lib/kilder/menighetsplan.js`: selv om API-et allerede filtrerer server-side, hopper adapteren nå uansett over rader med eksplisitt `isPublic: false` (belte-og-bukseseler).
- **Fremhevet overstyrer visningsfilter** (PO-avgjørelse, se gjeldsloggen): `lib/visning/forside.js` bygger nå Fremhevet-seksjonen fra den ufiltrerte (kun skjult-fjernede) listen, mens «Denne uken» og månedslisten fortsatt respekterer `?visning=`-filteret som før.
- **Omdirigeringsmekanisme** for gamle eRedaktør-lenker: ny modul `lib/innhold/omdirigeringer.js` + tom tabell `innhold/omdirigeringer.json` (`{}`, klar for PO å fylle inn), koblet inn i `server.js` rett før 404-håndtering (301-redirect ved treff).
- Claude fant og rettet selv en feil i én av agentenes tester (brukte `require()` i en ESM-fil) før commit — verifisert med `node --test` (100/100) og egen curl-smoketest av server.

**Sprint 9** ✅ Forberedt ekte hosting-URL (`render.yaml`, se punkt 14) og satt opp `SessionStart`-hook for Claude Code on the web (kun mobilbruk, se punkt 14).

**Sprint 10** ✅ Alt gjenstående i gjeldsloggen er nå PO-avhengig (ekte tekst, lokal API-verifisering, gamle URL-er, hosting), så Claude brukte sprinten på en kvalitetsgjennomgang (`/code-review --level high`) av alt Haiku-agentene skrev i Sprint 8–9, siden det ikke hadde fått samme grundige gjennomgang som tidligere sprinter (jf. punkt 15-praksisen). To reelle funn, begge rettet og verifisert (`node --test`: 100/100, pluss manuell curl-sjekk):
- `render.yaml` sitt persistente volum var kun montert på `innhold/`, ikke `data/` — cache-fallback-filen (`lib/arrangementer.js`) ville dermed forsvunnet ved hver omstart på Render, stikk i strid med selve poenget med fallback-mekanismen. Flyttet cache-filen til `innhold/cache/siste-vellykkede.json` (inni det som faktisk persisteres), oppdatert README.
- `lib/visning/forside.js` kalte `anvendOverstyringer()` to ganger på identisk data (for å hente hhv. `fremhevede` og `resten`/`allNotHidden`) — slått sammen til ett kall.
- **Bifunn, ikke fra code-review:** `.gitignore` hadde feil filnavn for cache-filen (`data/siste-vellykkede.ics`, en `.ics`-rest fra før prosjektet gikk over til JSON-kontrakten) — selve `.json`-cachefilen har dermed ligget **committet i git siden Sprint 3b**. Ikke sensitivt (kun offentlig arrangementsdata), men unødvendig i versjonskontroll. Fjernet fra git, riktig sti lagt til `.gitignore`.

**Neste steg:** alt gjenstående krever PO. Se gjeldsloggen (punkt 13): ekte tekst på faste sider, lokal verifisering av ekte API-tilkobling, gamle URL-er fra eRedaktør, og hosting via Render.

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
| Mock er fortsatt standard (`MENIGHETSPLAN_API_URL` ikke satt) | Ekte API er bekreftet og kontrakten verifisert (punkt 10), men selve nettverkskallet er ikke testet av Claude (sandkasse blokkerer utgående kall) | PO setter miljøvariabelen lokalt og bekrefter ekte data på forsiden |
| Nye felt på `Gathering` finnes bare i app-sandkassen | Appen endres ikke via AI Studio nå | Få feltene inn i den ekte appen |
| Egen enkel tekstmarkering (`##`, `-`) i stedet for en redigerer | Fungerer, og lagres som blokker | Erstattes av en blokkredigerer |
| Fillagring uten låsing og historikk | Én redaktør på localhost | Database eller ferdig CMS |
| Admin med HTTP Basic Auth (Sprint 3b) | Sikkerhet er ikke viktig nå (PO) | Ekte innlogging og roller |
| Den ekte appdatabasen (Firestore) sine egne regler er fortsatt åpne | Ikke lenger CMS-ets direkte problem siden vi går via API-et (punkt 6), men fortsatt en risiko for appen selv | Appens/GAIS sitt ansvar å lukke før produksjon |
| ~~GAIS har pushrettigheter til CMS-repoet~~ — **løst 2026-09-28** | GAIS har selv bekreftet at de ikke vil pushe mer. Claude sjekket collaborator-listen på GitHub direkte: kun `magnato-tech` (eier) er oppført — ingen egen GAIS-konto med tilgang funnet der, så det er ingenting å fjerne på GitHub-siden. | Ingen videre handling nødvendig |
| API-et kjører på en dev-sandbox (Cloud Run), kan ha kald start / gå i dvale | Under aktiv utvikling, GAIS har bekreftet fallback til cache/mock dekker dette | Fast produksjons-URL når `lillesandmisjonskirke.no` settes i drift |
| `innhold/arrangement-overstyringer.json` uten låsing/historikk (Sprint 5) | Samme klasse snarvei som sidelageret over — én redaktør på localhost | Database eller ferdig CMS, samtidig med sidelageret |
| `innhold/omdirigeringer.json` er en tom tabell (Sprint 8) | De gamle eRedaktør-URL-ene er ikke kjent ennå | PO fyller inn `{ "/gammel-sti": "/ny-sti" }`-par når de er kjent |
| ~~Filbasert lagring krever persistent disk~~ — **adressert 2026-09-28** | `render.yaml` (Sprint 9) definerer Render som PaaS med et persistent volum montert på `innhold/`, slik at sideinnhold/overstyringer/omdirigeringer overlever restart | PO oppretter selve Render-tjenesten (se punkt 14) — krever "Starter"-plan (betalt, disk finnes ikke på gratisplanen), ikke en kodeoppgave |

## 14. Praktisk

**Standard arbeidsform: Windows-maskinen til PO**
- Start: `node server.js` (port 3000). Tester: `node --test`.
- Browser-panelets `preview_start` med launch.json **feiler** på denne maskinen («'C:\Program' is not recognized»). Start i stedet serveren i bakgrunnen med PowerShell (`Set-Location "<mappe>"; node server.js`) og åpne `http://localhost:3000` i panelet. Stopp serveren når du er ferdig.
- CMS-mappen har nå sitt eget lokale git-repo (opprettet i Sprint 3b), separat fra repoet i hjemmemappen til brukeren. `git`-kommandoer her er trygge.
- GitHub: [github.com/magnato-tech/menighetsplan_ClaudeCMS](https://github.com/magnato-tech/menighetsplan_ClaudeCMS) (remote `origin`), push fungerer via Git Credential Manager (cachede credentials, ingen `gh` installert). Appens eget repo (Menighetsplan2.0_mobil) røres fortsatt ikke herfra.
- GAIS-tilgangen (Firestore-vurderingen, punkt 2/13) er løst og lukket — se punkt 13.
- **Ekte API-et (bekreftet virker, GAIS 2026-09-28):** `https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer` (støtter `?fra=YYYY-MM-DD&til=YYYY-MM-DD`). Åpent, ingen nøkkel, `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=300`. Sett `MENIGHETSPLAN_API_URL` til denne for å bruke ekte data (se README). Det finnes også `/api/public/all` (grupper + faste møter) — **skal ikke brukes** av CMS-et, kun `/api/offentlig/arrangementer` er i kontrakten.

**Alternativ arbeidsform: Claude Code on the web (kun når PO jobber fra mobilen)**
- Fra Sprint 9 (2026-09-28) har repoet en `SessionStart`-hook (`.claude/hooks/session-start.sh` + `.claude/settings.json`) som gjør at fjernøkter starter rent. Prosjektet har ingen npm-avhengigheter, så hooken bare bekrefter at Node.js ≥20 er tilgjengelig.
- Brukes **kun** når PO jobber fra mobil, for å nyttiggjøre tildelte agent-tokens der — ikke standard arbeidsform. Windows-arbeidsflyten over gjelder ellers.
- Samme repo, samme branch-regler (jf. punkt 2 om GitHub) — ingen egen gren eller avvikende prosess for mobiløkter.

**Hosting — ekte URL (Sprint 9, 2026-09-28)**
Claude kan ikke opprette skyressurser selv (ingen egne cloud-credentials). `render.yaml` i repo-roten er forberedt for [Render](https://render.com), valgt fordi det kobles direkte mot GitHub, krever ingen serveradministrasjon, og støtter et persistent volum (løser filsystem-problemet i gjeldsloggen, punkt 13). PO gjør selv, ca. 10 minutter:
1. Opprett gratis konto på render.com, koble til GitHub-kontoen (`magnato-tech`).
2. "New +" → "Blueprint" → velg `menighetsplan_ClaudeCMS`-repoet. Render leser `render.yaml` automatisk.
3. **Viktig:** planen må være "Starter" (betalt, i dag rundt $7/mnd) — gratisplanen på Render støtter ikke persistent disk, og uten det forsvinner sideinnhold/overstyringer ved hver omstart.
4. Sett miljøvariabelen `ADMIN_PASSORD` i Render Dashboard (den er bevisst *ikke* i `render.yaml`, skal aldri i git).
5. Deploy — Render gir en ekte URL på formen `https://menighetsplan-cms.onrender.com`, nåbar fra mobil og alle andre steder.
- Egen custom-domene (`lillesandmisjonskirke.no`) kobles på senere, når CMS-et faktisk skal erstatte eRedaktør (punkt 1/3).

## 15. Kvalitetsgjennomgang, natt til 2026-09-28/29 (etter Sprint 4–6)
PO ba Claude fortsette selvstendig i flere sprinter samme kveld («jobb i sprinter, test, planlegg og fortsett selvstendig til du går tom for tokens»), som et bevisst, eksplisitt unntak fra regelen i punkt 7 om én ny økt per sprint — gjort for å bruke kvelden effektivt mens PO var borte. Etter Sprint 4–6 kjørte Claude selv (ikke en agent) en 8-vinklers kodegjennomgang av alt som var bygget, siden mye var skrevet av flere Haiku-agenter på rad uten menneskelig blikk innimellom. Fem funnere kjørte parallelt; flere fant de samme problemene uavhengig av hverandre, som styrket tilliten til funnene.

**Rettet av Claude samme kveld (verifisert med `node --test` og i nettleserpanelet etterpå):**
- «Avbryt»-knappene i rediger-/slett-side-skjemaene pekte til `/admin` (dashboardet, innført i Sprint 6) i stedet for `/admin/sider` (sidelisten brukeren faktisk kom fra) — rettet i `lib/visning/admin.js`.
- `uid` (fra Menighetsplan) ble limt inn i `action`-attributter i `renderArrangementerPage` uten `esc()`, i motsetning til alle andre felt i samme fil — latent XSS-hull i admin hvis en fremtidig uid noensinne inneholder anførselstegn. Rettet.
- Dashboardets tall for «kommende arrangementer» talte alle forekomster fra Menighetsplan, uten å trekke fra skjulte — avvek fra det som faktisk vises offentlig. Rettet til å bruke samme `anvendOverstyringer`-logikk som forsiden.
- Dødt «tenke-høyt»-kommentarblokk i `lib/admin/index.js` (beskrev et problem koden rett under allerede løste) — fjernet.
- `365 * 86400000` («ett år fram») duplisert to steder — samlet i én konstant `ETT_AAR_MS`.
- `lib/innhold/overstyringer.js`: fremhev/skjul leste fila fra disk to ganger per klikk (én gang i `hentForUid`, én gang til inne i `settOverstyring`) — ny funksjon `toggleFelt(uid, felt)` gjør det med én lesing og én skriving.
- Datoformatering i arrangement-admin brukte `toLocaleString` direkte i stedet for `fmtDate`/`fmtTime` fra `felles.js` som resten av admin bruker — rettet for konsekvent format.
- `.claude/scheduled_tasks.lock` (en sesjons-/prosess-låsefil, samme kategori som `data/siste-vellykkede.ics`) lagt til i `.gitignore`.
- Denne gjeldsloggen (punkt 13) manglet `overstyringer.js`-lageret — lagt til.

**Ikke rettet, bevisst latt stå til PO/neste sprint (nå i gjeldsloggen, punkt 13):**
- Samtidighets-race i `overstyringer.json` (to samtidige admin-requests kan i teorien overskrive hverandres endring) — akseptert risiko for én redaktør på localhost, samme vurdering som gjelder sidelageret.
- Skjør `uid`-regex (`^[a-z0-9-]+$`) som fungerer for mock-data, men er en antagelse som kan briste når ekte Menighetsplan-data kobles til (uavklart, punkt 6).
- Om et fremhevet arrangement skal overstyre `?visning=`-filteret (vises uansett) er ikke bestemt — i dag forsvinner det fra «Fremhevet» hvis filteret ikke matcher. Krever et PO-valg, ikke en teknisk fiks.
- Regelen om én ny økt per sprint (punkt 7) ble bevisst satt til side denne kvelden etter eksplisitt PO-instruks — nevnt her for åpenhet, ikke noe å «rette».
