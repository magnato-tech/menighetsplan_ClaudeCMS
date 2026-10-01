# Spesifikasjon for regeltestene (tests/rules/firestore.rules.test.mjs)

Verktøy: `@firebase/rules-unit-testing` v5 + vitest, ren JavaScript (ESM, `.mjs`). Kjøres av `npm run test:rules` (emulator startes av `firebase emulators:exec`; du skal IKKE starte emulator selv, og du kan ikke kjøre testene fordi Java mangler).

Prosjekt-ID: `demo-menighetsplan`. Emulatorvert/port leses automatisk fra miljøvariabler som `emulators:exec` setter (`FIRESTORE_EMULATOR_HOST`). Bruk `initializeTestEnvironment({ projectId, firestore: { rules: fs.readFileSync('firestore.rules','utf8') } })`. Rydd med `testEnv.clearFirestore()` i `beforeEach`, og `testEnv.cleanup()` i `afterAll`.

## Kontekster (alltid custom claims `pid` og evt. `role`)

| Navn | uid | claims |
|---|---|---|
| admin | u-admin | `{ role: 'admin', pid: 'p-admin' }` |
| editor | u-editor | `{ role: 'editor', pid: 'p-editor' }` |
| leaderA | u-leaderA | `{ pid: 'p-leaderA' }` (leder i gruppe gA) |
| deputyA | u-deputyA | `{ pid: 'p-deputyA' }` (nestleder i gA) |
| memberA | u-memberA | `{ pid: 'p-memberA' }` (medlem i gA) |
| memberA2 | u-memberA2 | `{ pid: 'p-memberA2' }` (medlem i gA) |
| memberB | u-memberB | `{ pid: 'p-memberB' }` (medlem i gB) |
| leaderB | u-leaderB | `{ pid: 'p-leaderB' }` (leder i gB) |
| outsider | u-outsider | `{ pid: 'p-outsider' }` (ikke medlem noe sted) |
| anon | uten innlogging | `testEnv.unauthenticatedContext()` |
| nopid | u-nopid | `{}` (innlogget uten pid-claim) |

Bruk `testEnv.authenticatedContext(uid, claims).firestore()`.

## Seed (med `testEnv.withSecurityRulesDisabled`, før hver test)

- `groups/gA`, `groups/gB` med `{ name: 'A' }` / `{ name: 'B' }`.
- `groups/gA/members/{pid}` for p-leaderA `{ pid, role:'leader' }`, p-deputyA `role:'deputy'`, p-memberA og p-memberA2 `role:'member'`. Tilsvarende i gB: p-leaderB `leader`, p-memberB `member`. Alle member-dokumenter har feltet `pid`.
- `persons/{pid}` for alle pid-ene over: `{ displayName: 'X', uid: 'u-...' }`.
- `persons/p-memberA/private/contact` = `{ email: 'a@x.no', birthDate: '2000-01-01' }`, og samme for p-memberA2 (brukes til å teste at andre ikke får lese).
- `groups/gA/memberContacts/p-memberA` = `{ pid:'p-memberA', phone:'91234567' }`, og tilsvarende `groups/gB/memberContacts/p-memberB`.
- `groups/gA/messages/m1` = `{ authorPid:'p-memberA', text:'hei', createdAt: <Timestamp> }`.
- `pages/pub` = `{ title:'P', status:'published' }`, `pages/draft` = `{ title:'D', status:'draft' }`; samme for `news/pub`, `news/draft`.
- `gatherings/gaA` = `{ title:'x', groupId:'gA', public:false }`, `gatherings/gaB` = `{ groupId:'gB', public:false }`, `gatherings/gaPub` = `{ groupId:null, public:true }`, `gatherings/gaAll` = `{ groupId:null, public:false }`.
- `tasks/tA` = `{ groupId:'gA', gatheringId:'gaA', title:'T', slots:1 }`, `tasks/tB` = `{ groupId:'gB', ... }`.
- `assignments/tA_p-memberA` = `{ taskId:'tA', groupId:'gA', pid:'p-memberA', status:'confirmed' }`.

## Testene (bruk `assertSucceeds` / `assertFails` fra rules-unit-testing)

Gruppér med `describe`. Hver bullet er minst én `it`. **Test både at tillatt handling lykkes og at forbudt feiler.**

### 1. Uinnlogget
- anon kan lese `pages/pub`, `news/pub`, og `gatherings/gaPub`.
- anon kan IKKE lese `pages/draft`, `news/draft`, `gatherings/gaA`, `persons/p-memberA`, `persons/p-memberA/private/contact`, `groups/gA`, `groups/gA/messages/m1`, `tasks/tA`, `assignments/tA_p-memberA`, `groups/gA/memberContacts/p-memberA`.
- anon kan IKKE skrive noe (prøv `pages/x`, `groups/gA/messages/new`).
- anon kan ikke liste hele `pages` uten filter: `getDocs(collection(db,'pages'))` feiler; med `where('status','==','published')` lykkes.

### 2. Privatliv (test 2)
- memberA kan lese og skrive egen `persons/p-memberA/private/contact`.
- memberA2 kan IKKE lese `persons/p-memberA/private/contact`.
- leaderA kan IKKE lese `persons/p-memberA/private/contact`.
- editor kan IKKE lese den. admin kan.
- leaderA kan lese `groups/gA/memberContacts/p-memberA` (mobil, beslutning A). memberA2 kan IKKE. leaderB kan IKKE lese `groups/gA/memberContacts/p-memberA`. memberA kan lese sin egen.
- memberA kan skrive egen memberContacts `{ pid:'p-memberA', phone:'99999999' }`. memberA kan IKKE skrive memberContacts for p-memberA2, og ikke med ekstra felt (`email`), og ikke med phone > 20 tegn.

### 3. Rolle-eskalering (test 3/4)
- memberA kan IKKE skrive til `users/u-memberA` (med `{ role:'admin' }`). Ingen klient kan skrive til `users/*`.
- memberA kan IKKE opprette `groups/gA/members/p-memberA` på nytt med `role:'leader'` (overskriving av eget medlemsdokument). Oppdatering av eget medlemsdokument til leader feiler.
- memberA kan IKKE oppdatere `persons/p-memberA` med `{ uid: 'annen' }` eller `{ role: 'admin' }`, men kan oppdatere `{ displayName: 'Ny' }`.
- leaderA kan IKKE opprette et medlem med `role:'leader'` i gA. leaderA kan opprette `role:'member'` og `role:'deputy'` (med `pid` lik dokument-ID). admin kan opprette `role:'leader'`.
- leaderA kan IKKE slette eller endre roller på en annen leder (seed en ekstra leder `p-leaderA2` i gA for testen); admin kan.
- Påstand om custom claims: `nopid`-konteksten kan ikke gjøre noe gruppe-relatert (les `groups/gA` feiler).

### 4. Gruppeledertilgang (test 5/6)
- leaderA kan oppdatere `groups/gA`, opprette/oppdatere/slette `tasks` med `groupId:'gA'`, og opprette `gatherings` med `groupId:'gA'`.
- leaderA kan IKKE oppdatere `groups/gB`, ikke opprette task med `groupId:'gB'`, ikke opprette gathering med `groupId:'gB'`, ikke flytte egen task til gB (endre `groupId`).
- deputyA kan oppdatere `groups/gA` og opprette tasks i gA.
- memberA kan IKKE oppdatere `groups/gA` eller opprette tasks.
- admin kan oppdatere begge grupper og opprette gathering med `groupId:null`. leaderA kan IKKE opprette gathering med `groupId:null`.

### 5. Gruppemeldinger (test 9)
- memberA kan lese `groups/gA/messages/m1`. memberB og outsider kan IKKE.
- memberA kan opprette melding `{ authorPid:'p-memberA', text:'hei', createdAt: serverTimestamp() }` i gA. memberB kan IKKE opprette i gA.
- Avvises: falsk `authorPid:'p-memberA2'` fra memberA; text med 2001 tegn; ukjent ekstra felt; `createdAt` satt til en fast dato (ikke `serverTimestamp()`); `imagePath` utenfor `groups/gA/chat/`; tom tekst uten `imagePath`.
- Tillatt: tom tekst med gyldig `imagePath:'groups/gA/chat/bilde1.png'`.
- Oppdatering av melding feiler for alle inkludert forfatter og admin.
- Forfatter (memberA) kan slette egen melding, memberA2 kan IKKE slette memberAs, leaderA kan slette, admin kan slette.

### 6. Tildelinger (test 14/15)
- memberA kan opprette `assignments/tA_p-memberA2`? NEI (pid er ikke egen). memberA2 kan opprette `assignments/tA_p-memberA2` med `{ taskId:'tA', groupId:'gA', pid:'p-memberA2', status:'confirmed' }`.
- memberA kan IKKE opprette tildeling for en oppgave i gB (`tB`), heller ikke hvis `groupId` oppgis feil som 'gA' (oppgavens faktiske gruppe må stemme: `tB` hører til gB).
- Avvises: dokument-ID som ikke er `taskId_pid`; status `declined` ved opprettelse fra medlem (tillatt er bare `pending`/`confirmed`); ekstra felt.
- Eier (memberA) kan oppdatere `tA_p-memberA` til `withdrawn`. Eier kan IKKE endre `pid`, `taskId` eller `groupId`. memberA2 kan IKKE oppdatere memberAs tildeling. leaderA kan oppdatere den til hva som helst av gyldige status, men ikke endre `pid`.
- outsider og memberB kan IKKE lese tildelingen. memberA2 (medlem i gA) kan lese den.

### 7. Oppmøte (RSVP)
- memberA kan skrive `gatherings/gaA/attendances/p-memberA` `{ pid:'p-memberA', status:'attending' }`, og oppdatere til `declined`. memberA kan IKKE skrive for p-memberA2. memberB kan IKKE skrive i gaA (ikke medlem).
- memberA kan skrive RSVP til `gatherings/gaAll` (groupId null, alle innloggede). outsider kan også.
- Ugyldig status `maybe` avvises.
- leaderA kan lese attendances under gaA; memberA2 kan IKKE lese memberAs.

### 8. CMS-innhold (test 7/8)
- editor kan opprette/oppdatere/slette `pages` og `news` (status draft/published). Status `archived` avvises.
- editor kan lese drafts. memberA (vanlig innlogget) kan lese `pages/pub` men IKKE `pages/draft`.
- editor kan IKKE oppdatere `groups/gA`, opprette tasks, eller skrive `persons`.
- admin kan alt over, inkludert persons-opprettelse.
- memberA kan IKKE skrive `pages`.

### 9. Medlemskapsoppslag
- memberA kan kjøre collection group-query `collectionGroup(db,'members')` med `where('pid','==','p-memberA')`. Samme query med `p-memberA2` feiler. En query uten `where` feiler.

### 10. Gatherings
- memberA kan lese gaA og gaAll, men IKKE gaB. anon kan lese bare gaPub. memberB kan IKKE lese gaA.
- public:true gathering skrevet av leaderA i gA kan leses av anon.

Hold hver `it` kort og navngi dem på norsk med testnummer (f.eks. «Test 2: medlem kan ikke lese andres private kontaktinfo»).

## Storage-tester (tests/rules/storage.rules.test.mjs)

Bruk `initializeTestEnvironment` med både `firestore` og `storage` rules (storage.rules + firestore.rules). Medlemssjekken i storage bruker firestore.exists, så seed `groups/gA/members/p-memberA` osv. i Firestore først.
- anon kan lese `public/logo.png` (seed med `withSecurityRulesDisabled` og `storage().ref(...).put`), kan ikke skrive.
- editor kan laste opp `public/x.png` (contentType image/png, liten fil). memberA kan ikke.
- memberA kan laste opp `groups/gA/chat/a.png` (image/png, under 5 MB) og lese den. memberB kan ikke lese eller laste opp i gA.
- memberA kan ikke laste opp en `text/plain`-fil i chat, og ikke en fil over 5 MB (simuler med `new Uint8Array(5*1024*1024+1)`).
- memberA kan laste opp `profiles/p-memberA/me.png`; ikke til `profiles/p-memberA2/me.png`. Innlogget kan lese profilbilder; anon ikke.
- admin kan slette `groups/gA/chat/a.png`; memberA kan ikke.

Hvis Storage-delen viser seg vanskelig å sette opp, skriv den likevel og merk tydelig øverst i filen hva som er usikkert.
