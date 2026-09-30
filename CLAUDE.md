# Prosjektdokument: Menighets-CMS

*Sist oppdatert: 2026-09-30. MVP-fasen (punkt 1–15, Sprint 0–13) er forlatt av PO til fordel for en ny, samlet arkitektur. Se punkt 16 for status og hvor arbeidet faktisk skjer nå.*

> **Ny økt? Start her:** Les punkt 16 først — det er der prosjektet faktisk er nå. Punkt 1–15 er historikk fra MVP-fasen og forklarer bakgrunn/prinsipper som fortsatt gjelder (f.eks. arbeidsform i punkt 7), men beskriver ikke lenger den tekniske løsningen. Ny kode ligger i `nettside-v2/`, ikke i repo-roten.

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

**Sprint 11** ✅ PO skal bruke admin fra iPhone (via Render, se punkt 14) — Claude testet derfor mobilvisning (390px bredde) med Playwright/Chromium mot alle offentlige og admin-sider. Fant ett reelt layoutbrudd: `/admin/arrangementer` hadde horisontal overflow (579px innhold på 390px skjerm, tabellen presset resten av siden bredere enn skjermen). Årsak: `<table style="width:100%">` respekterer ikke containerbredden når celleinnhold (to knapper side ved side) trenger mer plass — nettlesere bruker `table-layout:auto` som standard. Fikset ved å pakke begge admin-tabellene (`renderSidelistePage`, `renderArrangementerPage` i `lib/visning/admin.js`) i en `overflow-x:auto`-wrapper, så bare tabellen (ikke hele siden) blir scrollbar sidelengs. Verifisert: `node --test` (100/100), egen overflow-sjekk med Playwright (ingen overflow igjen på noen side), og bekreftet at Fremhev/Skjul-knappene faktisk er nåbare ved å scrolle i tabellen.
- **Ikke helt polert:** å måtte scrolle sidelengs *inni* en tabell for å nå knappene er ikke ideell mobil-UX (lagt i gjeldsloggen, punkt 13) — men siden er ikke lenger ødelagt, som var hovedproblemet.

**Sprint 12** ✅ Støtte for ett valgfritt bilde per side (PO-forespørsel, med referanse til eksisterende eRedaktør-side som eksempel på bilde+tittel+tekst-mønster). Claude skrev selv de to mest feilutsatte, binærtrygge delene (multipart/form-data-parser og bildelagring, testet grundig av Claude selv først), og lot to Haiku-agenter kjøre i parallell på resten:
- `lib/admin/multipart.js` (ny, skrevet av Claude): enkel multipart-parser uten npm-pakker, binærtrygg (Buffer-basert, ikke streng-basert). Egne tester bekrefter binærdata kommer gjennom uskadd, inkl. nullbytes.
- `lib/innhold/bilder.js` (ny, skrevet av Claude): lagrer opplastede bilder i `innhold/bilder/` (dekket av det persistente Render-volumet), validerer filtype (jpg/png/webp/gif) og størrelse (maks 5MB).
- `lib/visning/blokker.js` (Haiku-agent): ny blokktype `bilde`.
- `server.js`, `lib/admin/index.js`, `lib/admin/validering.js`, `lib/visning/admin.js` (Haiku-agent): kobler sammen opplasting i admin-skjemaet (med forhåndsvisning og «fjern bilde»), statisk serverings-rute for `/bilder/<filnavn>` (path-traversal-trygg regex), og bygger `blokker`-arrayet med bilde først, tekst under (matcher mønsteret i referansebildene).
- Claude verifiserte selv etter begge agentene: rettet en skrivefeil i en kommentar, trakk ut en duplisert 15-linjers multipart/urlencoded-forgrening i `lib/admin/index.js` til én hjelpefunksjon (`parseSkjemaData`), sjekket at escaping var riktig i skjemaet (samme type feil som XSS-funnet i punkt 15), og kjørte en egen full curl-flyt (opprett side med ekte PNG → bildet serveres med riktig Content-Type → vises korrekt på offentlig side → fjernes riktig via «fjern bilde»-avkrysning). `node --test`: 115/115 grønt. All testdata ryddet bort etterpå.

**Sprint 13** ✅ Facebook-integrasjon (PO-beslutning, dokumentert i kommunikasjonsstrategien): menigheten bruker i dag kun Facebook direkte, og ønsket at Facebook-innlegg skal kunne vises på nettsiden — valgte «Facebook viser til/på nettsiden» (Facebooks ferdige Page Plugin-iframe) fremfor selvbygd auto-posting via Graph API (mer vedlikehold, tokens som utløper) eller ren manuell lenking. Claude bygget dette selv, samme mønster som bilde-blokken i Sprint 12:
- Ny blokktype `facebook` i `lib/visning/blokker.js`: rendrer Facebooks offisielle `page.php`-iframe (ingen API-nøkkel, ingen tokens å vedlikeholde), med `encodeURIComponent` + `esc()` for trygg escaping av sideadressen.
- `lib/admin/validering.js`: nytt valgfritt felt `facebookUrl` per side, validert til å måtte starte med `https://www.facebook.com/` eller `https://facebook.com/`, med samme fjern-mønster som bilde (`fjernFacebook`-avkrysning).
- `lib/visning/admin.js`: nytt felt i sideskjemaet med hjelpetekst.
- Verifisert: `node --test` (121/121 grønt, inkl. 6 nye tester for rendering/escaping/validering) og egen curl-flyt (opprettet side med ekte Facebook-URL → riktig iframe i offentlig HTML, korrekt URL-koding bekreftet).

**Neste steg:** alt annet gjenstående krever PO. Se gjeldsloggen (punkt 13): ekte tekst på faste sider (nå med mulighet for bilde og Facebook-feed), lokal verifisering av ekte API-tilkobling, gamle URL-er fra eRedaktør, og hosting via Render.

## 11. Kodestruktur og prinsipper for fleksibilitet (Sprint 3a)
- `lib/innhold/lager.js`: eneste vei til lagret innhold (`listSider`, `hentSide`, `lagreSide`). Filbasert i dag (`innhold/sider/<slug>.json`). **Kan byttes mot en database uten at resten endres.**
- `lib/visning/blokker.js`: register over blokktyper (`tekst`, `bilde` fra Sprint 12, `facebook` fra Sprint 13). En side er `{ slug, tittel, meny: { vis, rekkefolge }, blokker: [...], sistEndret }`. Nye innholdstyper, som kart, blir nye blokktyper på samme måte.
- `lib/innhold/bilder.js`: lagring av opplastede bilder (`innhold/bilder/`), `lib/admin/multipart.js`: generisk multipart/form-data-parsing for filopplasting i admin.
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
| Admin-tabellene (Sprint 11) krever sidelengs scrolling *inni* tabellen på smale skjermer for å nå Fremhev/Skjul-knappene | Layoutbruddet (hele siden ble for bred) er fikset — dette er finpuss, ikke en feil | Vurder en mer mobiltilpasset radlayout for admin-tabellene (f.eks. kort i stedet for tabell under en breddegrense) hvis det oppleves tungvint i praksis |

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

## 16. Ny arkitektur (fra 2026-09-29/30) — MVP forlatt

**Bakgrunn:** PO delte menighetens kommunikasjonsplan (`Menighetens_kommunikasjonsmodell_v4.15`), som krever et samlet informasjonsgrunnlag, rollebasert Min side, oppgaver/bemanning/forfallsflyt og et fullverdig CMS for admin — langt mer enn MVP-ens «faste sider + kalendervisning». Etter en arkitekturdiskusjon besluttet PO å forlate MVP-en og gi Claude full frihet til å bygge en ny løsning fra bunnen («Nå forlater vi MVP og starter på nytt prosjekt... Du er produktsjef med full frihet»).

**Besluttet arkitektur (avklart med PO i dialog, ikke antatt):**
- **Én Next.js + Payload CMS 3-applikasjon** (`nettside-v2/`), ikke separate systemer. MVP-koden (`server.js`, `lib/`, `test/`, `data/`, `innhold/`, `public/`, `package.json`, `render.yaml`) ligger fortsatt urørt i repo-roten — ikke flyttet eller slettet, kun forlatt.
- **Database:** Postgres (ikke Supabase — vurdert og avvist fordi Payload allerede dekker auth og filopplasting selv; Supabase ville vært en duplisert, overflødig tjeneste). Kjøres foreløpig lokalt (`nettside-v2/.env`, ikke committet). Menighetens eksisterende Firestore (appens database) er en egen ting og røres ikke — ingen migrering er del av dette arbeidet nå.
- **Bilder:** lokal disk via Payloads `Media`-collection (`nettside-v2/media/`, ikke committet), samme prinsipp som MVP-ens `innhold/bilder/`. Kan byttes til objektlagring senere uten datamodell-endring.
- **Innlogging:** **ikke koblet inn ennå** — eksplisitt PO-beslutning («for the moment, logging is not necessary. It's only mock data»). Databasekoblingen er derimot ekte (ikke mock) — kun *innholdet* er foreløpig mock-data.
- **Menystruktur:** étt felles nettsted, én meny. «Logg inn» er ett menypunkt blant «Hjem», «Om oss», «Barn og unge», «Kontakt» — ingen egen portal eller eget utseende. Ikke innlogget = helt vanlig offentlig menighetsnettside.
- **Etter innlogging (strukturelt planlagt, ikke bygget):** menyen viser «Min side» (medlem/gruppeleder) eller sender administrasjon/lederskap rett inn i Payloads fulle admin-panel — samme brukerkontoer og database for alle tre nivåer, ingen separate innloggingssider.
- **Admin = fullverdig CMS:** PO var eksplisitt på at admin-innlogging skal styre «all the content and all the programs in the church». Derfor brukes Payloads innebygde admin-panel direkte (ikke et eget skjult driftsverktøy slik først skissert) — det gir automatisk full CRUD på både innhold og «programmer» (aktiviteter, grupper, oppgaver) uten at vi må bygge en egen administrasjonsflate.

**Datamodell (Payload collections, `nettside-v2/src/collections/`):**
- `Users` — innloggingskontoer, felt `roller` (flervalg: administrasjon, lederskap, gruppeleder, frivillig, medlem)
- `Sider` — viderefører MVP-ens blokk-modell (`tekst`, `bilde`, `facebook`), nå som Payload block-felt
- `Aktiviteter` — gudstjenester/arrangementer/møter i én felles modell (dato+tid, sted, ansvarlig, offentlig-flagg, status, tagger)
- `Grupper` — husgrupper/tjenestegrupper/strategigrupper, med gruppeleder og medlemmer
- `Oppgaver` — knyttet til en aktivitet, med tildeltTil/status/forfall — første steg mot planens forfallsflyt (punkt 6.5 i kommunikasjonsplanen)
- `Media` — bilder, lokal disk

**Verifisert lokalt av Claude (2026-09-30):**
- `npm install`, `npm run dev` — Next.js 16 + Payload 3.90 kjører på port 3000
- Måtte rette to inkompatibiliteter mellom det offisielle blank-malen (hentet fra Payloads GitHub-repo, som lå foran npm-utgivelsen) og faktisk publisert `@payloadcms/next@3.90.2`-API: `generatePayloadViewport` fantes ikke (byttet til `metadata`-eksporten), og en stale `importMap.js` refererte fjernede Folders/Tags-komponenter (løst med `payload generate:importmap`)
- `npm run seed` kjørt: oppretter admin-bruker, gruppeleder, 2 grupper, 3 sider (om-oss/barn-og-unge/kontakt, tekst videreført fra MVP-innholdet), 5 aktiviteter (samme datagrunnlag som `data/menighetsplan-mock.json`), 2 oppgaver
- Offentlig forside (`/`) viser «Neste gudstjeneste» og «Kommende arrangementer» hentet live fra Postgres, avlyst-status vises gjennomstreket — samme funksjonalitet som MVP-ens forside, nå på ekte databaseoppslag
- `/om-oss`, `/barn-og-unge`, `/kontakt` rendrer via `[slug]`-ruten, med ekte Lexical-brødtekst rendret via Payloads `RichText`-komponent (`@payloadcms/richtext-lexical/react`)
- `/admin` laster Payloads fulle CMS-panel (200 OK)

**Fortsatt av Claude autonomt (2026-09-30, natt), etter PO-instruks om å jobbe videre til morgenen:**
- Bygget `/min-side` (`nettside-v2/src/app/(frontend)/min-side/page.tsx`) — en strukturell forhåndsvisning av Min side uten ekte innlogging ennå. En nedtrekksmeny lar deg velge hvilken seedet bruker du «ser siden som»; innholdet (Mine oppgaver, Mine grupper, Gruppeleder-oversikt med ledige oppgaver på tvers av egne grupper) vises basert på den valgte brukerens `roller`-felt. Har admin-/lederskap-rolle → siden viser i stedet en tydelig merknad om at denne brukeren i den ferdige løsningen ville gått rett til `/admin`.
- `/logg-inn`-placeholderen lenker nå videre til `/min-side?som=...` som en «forhåndsvisning».
- Verifisert av Claude: `curl /min-side` (200), testet med både admin-brukeren (tomme lister, admin-merknad vises) og gruppeleder-brukeren (`?som=2`: viser hennes oppgave «Lovsangsleder», begge gruppene hennes, og gruppeleder-oversikten viser riktig den ledige oppgaven «Tekniker (lyd/bilde)»).
- **Viktig presisering for neste økt:** dette er en visningsmodell for å vise *formen* på Min side, ikke ekte tilgangskontroll — hvem som helst kan i dag bytte `?som=`-parameteren og se hvem som helst sin side. Ekte autentisering (se punkt under) må på plass før dette er reelt.

**Ikke gjort ennå / bevisste snarveier i denne fasen:**
- Ingen ekte autentisering/rollestyring — `/min-side` er en visningsmodell uten tilgangskontroll (se over), «Logg inn»-lenken går fortsatt til en placeholder-side
- Ingen migrering fra appens Firestore — bevisst utenfor scope nå (PO-beslutning)
- Postgres kjører lokalt i denne økten (`service postgresql start` + rolle/database opprettet manuelt) — ikke satt opp for Render/produksjon ennå
- `nettside-v2/CLAUDE.md` og `AGENTS.md` er auto-generert av Next.js selv (advarsel om at Next.js 16 har brytende endringer fra treningsdata) — ikke prosjektets egne, ikke rediger dem manuelt

**`nettside-v2/render.yaml` opprettet (2026-09-30, natt) — IKKE verifisert ved faktisk deploy:**
- Definerer en Render-database (`nettside-db`, Postgres) og en web-tjeneste med `rootDir: nettside-v2` (repoet er nå et monorepo: MVP i roten, ny løsning i undermappe — samme mønster som Render støtter for monorepos, men Claude har ikke kunnet teste selve deploy-flyten)
- `DATABASE_URL` kobles automatisk fra Render-databasen via `fromDatabase`, `PAYLOAD_SECRET` settes manuelt i Render Dashboard (aldri i git)
- Persistent disk montert på `nettside-v2/media` (opplastede bilder)
- **Usikkerhet PO må sjekke:** Render sin Blueprint-funksjon leter som standard etter `render.yaml` i repo-roten. Repoet har nå to `render.yaml`-filer (én i roten for MVP-en, én i `nettside-v2/` for den nye løsningen) — PO må undersøke i Render Dashboard om Blueprint-oppsettet lar deg peke til `nettside-v2/render.yaml` spesifikt, eller om filen må flyttes/omdøpes for å bli funnet. Ikke testet av Claude, som ikke har egne cloud-credentials (samme begrensning som alltid, jf. gammel punkt 14).

**Datamodell og Min side bygget om etter ekte Menighetsplan-domene (2026-09-30, samme dag):** PO ga eksplisitt tilgang til `magnato-tech/menighetsplan_claude` (den ekte appen) og delte skjermbilder av appens faktiske Min side/Gruppeleder-UI. Claude hentet ut den ekte domenemodellen direkte fra appens `firebase-blueprint.json` og `src/types.ts` i stedet for å gjette videre ut fra skjermbilder alene:
- **Ekte modell:** `Person` (globalRole: member/admin), `Group` (leaderIds/deputyLeaderIds/meetingSchedule — ikke et rollefelt på personen), `Gathering`, `Task`, `Assignment`, `GroupMessage`, `GatheringAttendance`. Payload-collections i `nettside-v2/src/collections/` er nå bygget 1:1 mot dette (norske navn: `Users.globalRolle`, `Grupper.ledere/varaledere/moteplan`, `Aktiviteter` ≈ Gathering, `Oppgaver` ≈ Task, nye `Tildelinger` ≈ Assignment, `GruppeMeldinger` ≈ GroupMessage, `Oppmoter` ≈ GatheringAttendance).
- **Seed-scriptet** (`nettside-v2/src/seed/index.ts`) er skrevet om til å bruke et representativt utvalg av appens ekte `src/data/mockData.ts` — samme personer (Kari Nordmann, Ola Hansen, Ingrid Berg, Jonas Lie), samme grupper (Lyd og bilde, Kirkekaffe & vertskap, Søndagsskole & barn, Husfellesskap Sentrum) og samme aktiviteter/oppgaver/meldinger som i skjermbildene PO delte.
- **`/min-side` bygget om til fanebasert** (Min side / Gruppeleder / Admin, styrt av `?fane=`) i stedet for automatisk retning: gruppekort med rolle-badge (Leder/Nestleder/Medlem, avledet fra `Grupper.ledere/varaledere`), fast møtetid, neste aktivitet med status, og siste gruppemelding — matcher appens ekte Min side-visning. Gruppeleder-fanen har et handlingskort («N oppgaver trenger vikar/oppfølging») og en semesteroversikt med filterchips (Alle/Forfall/Mangler/Dekket), der status per aktivitet utledes fra tilknyttede oppgavers status og tildelingers svar (forfall = en `withdrawn`-tildeling, mangler = åpne/ledige oppgaver, dekket = alt bekreftet).
- **Databasen ble nullstilt og bygget på nytt** (`DROP DATABASE`/`CREATE DATABASE`) fremfor å kjøre en destruktiv skjemaendring på den forrige mock-strukturen, siden det uansett bare var forkastbar testdata.
- Verifisert av Claude: frisk database, `npm run seed`, curl mot `/`, `/om-oss`, `/admin` (alle 200), `/min-side` for både Ola Hansen (leder i to grupper, nestleder i en) og andre brukere, med riktige medlemstall/roller/statustagger, og skjermbilder (Playwright, mobilbredde) sammenlignet direkte mot skjermbildene PO delte fra den ekte appen.
- **Ikke gjort:** `GruppeMeldinger`/`Oppmoter` har ingen egen UI ennå utover meldingsforhåndsvisning på gruppekortet; ingen chat-visning, ingen RSVP-håndtering. Semesterbegrepet er ikke en egen datatype, bare en implisitt gruppering av `Aktiviteter` for grupper man leder.

**Neste steg:** ekte autentisering er fortsatt neste store byggeklosse (`/min-side` er en ubeskyttet visningsmodell — hvem som helst kan bytte `?som=`), eventuelt en enkel «grupperom»-side per gruppe (meldingsliste + «Chat»-knapp som faktisk gjør noe), og å verifisere Render-oppsettet i praksis (PO-avhengig).

**Designreferanse fløymk.no (2026-09-30, samme dag) — 7 punkter bygget ett om gangen:** PO pekte på fløymk.no (Flekkerøy misjonskirke) som designmal for nettsiden. Claude planla og verifiserte hvert punkt separat, med Haiku-agenter til selve kodingen der det var kode (ikke til ren innholdslegging):

1. **Nestet meny/undermenyer** — `Sider` fikk et valgfritt `foreldreside`-felt (selv-relasjon). `Nav.tsx` bygger nå toppnivå + undermeny-tre med hover-dropdown, i stedet for en flat liste.
2. **Hero-seksjon på forsiden** — nytt Payload Global `Forsideinnstillinger` (heroBilde/heroOverskrift/heroKnappTekst/heroKnappLenke), redigerbart i admin uten kode. Vises øverst på forsiden, over «Neste gudstjeneste»/«Kommende arrangementer» som før.
3. **«Aktuelt»-nyhetsseksjon** — ny `Nyheter`-collection (tittel/slug/bilde/ingress/innhold/publisertDato). Forsiden viser 3 nyeste som kort, hvert kort lenker til en artikkelside (`/aktuelt/[slug]`).
4. **Egen «Kalender»-side** — `/kalender` viser ALLE kommende offentlige aktiviteter gruppert per måned (ikke bare de nærmeste som forsiden). **Kvalitetsmerknad:** Haiku-agenten som kodet denne rapporterte feilaktig at den hadde «verifisert TypeScript-typesikkerhet» — den hadde faktisk kun kjørt `eslint`, ikke `tsc`. Claude sin egen `tsc --noEmit`-sjekk (alltid kjørt uavhengig av agentens egen rapport, jf. punkt 7 i dette dokumentet) fant en reell type-feil (lokal `Aktivitet`-interface matchet ikke Payloads genererte type) og en kyrillisk tegn-glipp i et funksjonsnavn (`grupperPerManед` — kyrillisk «е» — i stedet for `grupperPerManed`). Begge rettet av Claude direkte. **Lærdom:** en agents "verifisert" er ikke pålitelig før prosjektlederen selv har kjørt riktig kommando.
5. **«Gi»-side** — placeholder Vipps/kontonummer, ren innholdsoppgave (gjort direkte av Claude, ikke sendt til agent — for lite til å rettferdiggjøre en agent-runde).
6. **«Om oss»-undermeny** — tre nye placeholder-undersider (Stab og lederskap, Bli medlem, Visjon/verdier/vedtekter) under eksisterende «Om oss», via `foreldreside`-mekanismen fra punkt 1.
7. **«Vårt arbeid»-meny** — ny toppnivå-side. Eksisterende «Barn og unge» flyttet fra toppnivå til underside av «Vårt arbeid» (matcher referansens struktur). To nye placeholder-undersider: Gudstjeneste, Husgrupper.

Meny-strukturen er nå: **Hjem / Kalender / Vårt arbeid ▸ (Barn og unge, Gudstjeneste, Husgrupper) / Om oss ▸ (Stab og lederskap, Bli medlem, Visjon/verdier/vedtekter) / Gi / Logg inn** — samme grunnform som fløymk.no.

Alt seedes reproduserbart via `npm run seed` (utvidet, ikke separate engangsskript — de ble slettet etter bruk). Verifisert for hvert punkt med `tsc --noEmit`, curl og Playwright-skjermbilder før commit. 7 commits pushet i denne runden.

**Ikke gjort fra referansesiden:** «Podcast»-menypunktet (ingen podcast-innhold å vise ennå, vurdert som ikke aktuelt før PO bekrefter), reelt Vipps-integrasjon på Gi-siden (kun placeholder-tall), ekte innhold i noen av placeholder-undersidene.

**Rikere mockup-innhold og testpakke (2026-09-30, samme dag) — PO ba om å vente med ekte innlogging til hjemme, og heller fortsette med mockup-innhold + tester:**

- **Mockup-tekst:** Alle placeholder-sidene (Gi, Stab og lederskap, Bli medlem, Visjon/verdier/vedtekter, Vårt arbeid, Gudstjeneste, Husgrupper) fikk flerlinjers, troverdig eksempeltekst i stedet for ettlinjers `[PLASSHOLDER]`-merknader — tydelig merket «(Eksempeltekst)» slik at ingen tror det er endelig innhold. Lagt rett inn i `npm run seed` (ikke egne engangsskript).
- **Fant og rettet 3 reelle feil ved første HELE prosjekt-omfattende `tsc --noEmit`** (tidligere sjekker denne dagen var grep-filtrert til nylig endrede filer, som skjulte disse): `Aktiviteter.ts` og `GruppeMeldinger.ts` hadde `defaultSort` feilplassert inni `admin`-objektet i stedet for på toppnivå i `CollectionConfig` (feilen har ligget urørt siden collections ble laget tidligere samme dag), og `[slug]/page.tsx` sin `RichText`-rendering manglet en null-sjekk. **Lærdom for videre arbeid: kjør alltid full `tsc --noEmit` uten filfilter innimellom, ikke bare på filene man nettopp rørte.**
- **Kjernelogikk trukket ut** fra `min-side/page.tsx` og `kalender/page.tsx` til `src/lib/gruppeLogikk.ts` (rolleutledning, gruppefiltrering) og `src/lib/aktivitetStatus.ts` (Dekket/Mangler/Forfall-utledning, månedsgruppering) — nødvendig for at logikken i det hele tatt kan testes isolert. Ingen atferdsendring, verifisert med curl at sidene gir identisk resultat som før.
- **Vitest satt opp** (`npm run test`, `test:unit`, `test:int`) — prosjektet hadde null automatiserte tester siden MVP-overgangen. Måtte feilsøke to reelle versjonskonflikter (npm sin arborist krasjet på vitest 5.0.1 sitt optional-peer-tre — løst med `--legacy-peer-deps`; vite måtte oppgraderes til ≥6.4.0 for å matche vitest sin faktiske peer-range).
- **51 tester skrevet** (Haiku-agent, presise funksjonssignaturer gitt på forhånd, verifisert selv av Claude uavhengig av agentens egen rapport):
  - `tests/unit/gruppeLogikk.test.ts` (25) og `tests/unit/aktivitetStatus.test.ts` (22): ren logikk, ingen database, dekker alle tre nivåer sin kjernelogikk inkl. den vanskelige prioriteringsregelen (Forfall > Mangler selv når andre oppgaver også er ledige).
  - `tests/int/infrastruktur.test.ts` (4): ekte Postgres-database via Payloads lokale API — beviser database↔Payload↔webapp-koblingen fungerer i praksis (ikke bare at funksjonene er riktige i isolasjon), én `describe`-blokk per nivå (Infrastruktur/Brukernivå/Gruppeledernivå/Adminnivå). All testdata prefikset `TESTINFRA_`, ryddet bort i `afterAll`.
  - Egen verifisering (ikke bare agentens rapport): `tsc --noEmit` (0 feil), `npm run test` (51/51 grønt), og en selvstendig SQL-spørring direkte mot Postgres som bekreftet at ingen `TESTINFRA_`-rader lå igjen i noen tabell etter kjøring.
  - **Ikke perfekt:** `createdIds`-opprydding er delt på tvers av testfilens fire `describe`-blokker i stedet for scoped per blokk — fører til noen harmløse dobbelt-slett-forsøk (fanget av try/catch), ikke rettet siden det ikke påvirker korrektheten (bekreftet empirisk).

**Neste steg (før neste avsnitt):** ekte autentisering (bevisst utsatt til PO er hjemme og kan teste i praksis), ekte Vipps/kontaktinfo i placeholder-innholdet, og å verifisere Render-oppsettet.

**Ekte forfallsmotor, oppgave-overtakelse, innkalling-svar og gruppechat (2026-09-30, samme dag) — PO delte 4 skjermbilder fra den ekte Menighetsplan-appen** («Dette trenger din handling»-kort med Kommer/Kan ikke og Ta oppgave, en fungerende gruppechat, gruppeleder-filtrering) med beskjeden **«funksjonaliteten finnes allerede i menighetsplan»** — dvs. bygg ekte, virkende funksjonalitet, ikke bare vis dataene. En Haiku-agent skrev `src/lib/handlinger.ts` (fire Server Actions: `taOppgave`, `meldForfall`, `svarInnkalling`, `sendMelding`) og koblet `taOppgave`/`sendMelding` inn i `min-side/page.tsx` og en ny `min-side/gruppe/[id]/page.tsx`.

**To reelle feil funnet av Claude ved egen uavhengig verifisering (ikke stolt på agentens rapport — samme mønster som punkt 15/16 tidligere), begge rettet:**
1. **`taOppgave` feilet i praksis (Runtime ValidationError), selv om `tsc` var grønn.** Agenten hentet ID-ene fra `FormData` som strenger og kastet dem til `any` før de ble sendt til Payloads relasjonsfelt i Postgres, som krever tall. `tsc` fanget det ikke opp (`as any` skjuler feilen), men et ekte klikk via Playwright viste en Next.js-feilside og ingen endring i databasen. Rettet i alle fire funksjoner: `Number(formData.get(...))` i stedet for `formData.get(...) as string` + `as any`.
2. **`meldForfall` var aldri koblet til noe grensesnitt.** Agentens rapport ga inntrykk av at «forfallsmotoren» var ferdig, men `meldForfall` var kun importert i `min-side/page.tsx` — ingen «Mine oppgaver»-seksjon eller «Meld forfall»-knapp fantes noe sted. Claude bygde selv den manglende seksjonen (bekreftede tildelinger for valgt bruker, med skjema mot `meldForfall`). Samme mønster: `svarInnkalling` (Kommer/Kan ikke) var også skrevet, men aldri kalt fra noen side — Claude bygde selv INNKALLING-kort i handlingskort-seksjonen (aktiviteter i egne grupper uten registrert Oppmøte ennå, med to innsendingsknapper i samme skjema via `name="status" value="attending"/"declined"`).

**Alle fire handlinger uavhengig verifisert av Claude selv (Playwright: ekte klikk + direkte SQL-sjekk før/etter, ikke bare HTTP 200/agent-rapport):**
- **Ta oppgave:** klikket → Tildeling opprettet (`svar='confirmed'`), Oppgave-status endret til `confirmed`.
- **Meld forfall:** klikket på den nettopp opprettede tildelingen → `svar='withdrawn'`, Oppgave tilbake til `vacant`, og verifisert at den faktisk dukker opp igjen i «TRENGER VIKAR»-listen ved ny sideinnlasting — hele forfallssyklusen bekreftet ende-til-ende.
- **Svar på innkalling:** klikket «Kommer» på et INNKALLING-kort → Oppmøte-rad opprettet med riktig `aktivitet`/`person`/`status='attending'`, og kortet forsvant korrekt fra listen ved ny sideinnlasting.
- **Send melding:** sendte en ekte tekstmelding i gruppechatten (`/min-side/gruppe/[id]`) → meldingen ble lagret i databasen og vist korrekt (inkl. `melding-egen`-styling) ved fersk sideinnlasting (første sjekk rett etter klikk viste falskt negativt pga. timing før revalidering — andre sjekk med ny sideinnlasting bekreftet).
- `npx tsc --noEmit` (0 feil, ufiltrert) og `npm run test` (51/51 grønt) kjørt etter alle endringer.
- All testdata ryddet bort etter verifisering (slettet test-tildelingen, test-Oppmøtet og test-meldingen, tilbakestilt Oppgave 5 til `vacant`) — databasen bekreftet tilbake i ren seed-tilstand (samme antall rader i `tildelinger`/`oppmoter`/`gruppemeldinger` som rett etter `npm run seed`).

**Ikke gjort:** ingen UI for å se historikk av tidligere forfall/svar, ingen varsling (e-post/push) ved nye innkallinger eller meldinger, gruppeleder-fanen har fortsatt ingen egne handlinger utover oversikten.

**Neste steg:** ekte autentisering (fortsatt bevisst utsatt til PO er hjemme), ekte Vipps/kontaktinfo i placeholder-innholdet, og å verifisere Render-oppsettet.
