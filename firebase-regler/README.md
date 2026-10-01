# Firebase: Security Rules og tester (utkast)

**Status 2026-10-01: regeltestene er KJØRT mot Firebase-emulatoren og består (144 av 144).** Reglene er likevel fortsatt utkast: de er ikke prøvd mot ekte brukere eller et ekte Firebase-prosjekt, og kjente begrensninger står under.

| Del | Status |
|---|---|
| `src/logic` + `tests/logic` (ren TypeScript) | Kjørt: 40 grønne, `tsc --noEmit` ren |
| `firestore.rules` | Kjørt: 127 tester grønne |
| `storage.rules` | Kjørt: 17 tester grønne |
| Mutasjonstest | 10 med vilje svekkede regler ble alle fanget av minst én test |

Testene ble først skrevet av Haiku. Claude rettet to feil i testene: seeding med reglene på (Firestore) og manglende `await` ved seeding av Storage-filer. Ingen regler ble svekket for å få testene grønne. Eneste regelendring: `pages`/`news` bruker `resource.data.status` direkte i stedet for `.get()`.

## Kjøre

```
npm install
npm run test:logic       # ren logikk, trenger ikke Java
npm run typecheck
npm run test:rules       # krever Java 21+ i PATH (Temurin 21 er testet)
```

`test:rules` starter emulatoren selv (`firebase emulators:exec`, prosjekt `demo-menighetsplan`). Ingen Firebase-konto er nødvendig. Første kjøring laster ned emulator-filen.

### Windows-tips

Emulatoren feiler med «Unable to establish loopback connection» hvis stien til temp-mappen er lang (grensen for unix-sockets er ca. 108 tegn). Sett en kort temp-mappe før kjøring:

```powershell
$env:TEMP="C:\jt"; $env:TMP="C:\jt"; $env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=C:\jt"
```

## Modellen reglene bygger på

- Custom claims (satt fra server): `role` = `admin` | `editor`, `pid` = personens id.
- `groups/{gid}/members/{pid}` med `role` = `leader` | `deputy` | `member`. Leder er per gruppe.
- Bare admin kan gjøre noen til leder eller endre/fjerne en leder.
- `persons/{pid}/private/*`: e-post og fødselsdato, bare personen selv og admin.
- `groups/{gid}/memberContacts/{pid}`: mobilnummer, lesbart for gruppens ledere (beslutning A).
- `assignments/{taskId_pid}`: fast ID, identitet fra `pid`-claim (aldri fra skjema).
- Oppgavestatus lagres ikke; den utledes fra tildelinger (`src/logic/aktivitetStatus.ts`).

## Kjente begrensninger og risiko

1. **Regler kan ikke telle:** `slots` (antall plasser) kan ikke håndheves av reglene. Overbooking hindres bare av UI/logikk.
2. **Spørringer mot `gatherings`:** regelen bruker `isMember(resource.data.groupId)`. Firestore krever at en liste-spørring beviselig er tillatt ut fra `where`-betingelsene. Spør derfor én gruppe om gangen (`where('groupId','==',gid)`), ikke `in`-lister. Offentlig kalender leses via server (Admin SDK), ikke klient.
3. **`pages`/`news` utkast:** enkel `status`. Redigering av en publisert side er synlig umiddelbart (beslutning H).
4. **Ingen rate limiting** på chat.
5. **Regel-semantikk bekreftet av testene:** `exists()`/`get()` i funksjoner og collection group-regelen `match /{path=**}/members/{pid}` (tester 11.1–11.3).
6. **Ikke dekket av testene:** samtidighet, Admin SDK-koden på serveren, utstedelse av custom claims, og kjøring mot ekte Firebase.

## Neste steg

1. Firebase Auth + server-rute som setter claims (`role`, `pid`) med Admin SDK, med tester (se DESIGN 7b, test 11–13).
2. Datalaget i appen flyttes til ny modell med smale spørringer.
3. Test mot et ekte Firebase-prosjekt (Spark) før reglene deployes.
