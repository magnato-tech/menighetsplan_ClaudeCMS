# Firebase: Security Rules og tester (utkast)

**Status 2026-10-01 natt: reglene er skrevet, men regeltestene er IKKE kjørt.** Firestore/Storage-emulatoren krever Java (JDK 21+), og Java finnes ikke på denne maskinen. Reglene regnes derfor ikke som verifisert.

| Del | Status |
|---|---|
| `src/logic` + `tests/logic` (40 tester, ren TypeScript) | Kjørt: 40 grønne, `tsc --noEmit` ren |
| `firestore.rules`, `storage.rules` | Skrevet, **ikke kjørt** |
| `tests/rules/*.mjs` (127 + 17 tester) | Skrevet av Haiku, gjennomgått og rettet av Claude, **ikke kjørt** |

## Kjøre

```
npm install
npm run test:logic       # fungerer uten Java
npm run typecheck
npm run test:rules       # krever Java 21+ i PATH
```

`test:rules` starter emulatoren selv (`firebase emulators:exec`, prosjekt `demo-menighetsplan`). Ingen Firebase-konto eller nett er nødvendig utover nedlasting av emulator-filen første gang.

## For å få Java (beslutning trengs fra PO)

Enklest uten systemendringer: last ned en bærbar JDK (Temurin 21, zip, ca. 200 MB) til en mappe og sett `JAVA_HOME`/PATH for økten. Alternativ: installer via `winget install EclipseAdoptium.Temurin.21.JDK`.

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
2. **Spørringer mot `gatherings`:** regelen bruker `isMember(resource.data.groupId)`. Firestore krever at en liste-spørring *beviselig* er tillatt ut fra `where`-betingelsene. Spør derfor én gruppe om gangen (`where('groupId','==',gid)`), ikke `in`-lister. Offentlig kalender leses via server (Admin SDK), ikke klient.
3. **`pages`/`news` utkast:** enkel `status`. Redigering av en publisert side er synlig umiddelbart (beslutning H).
4. **Ingen rate limiting** på chat.
5. **Uverifisert regel-semantikk:** bruken av `Map.get()`, `exists()`/`get()` i funksjoner, og collection group-regelen `match /{path=**}/members/{pid}` må bekreftes av testkjøringen.
6. Seed-funksjoner i testene bruker `withSecurityRulesDisabled` (rettet etter gjennomgang; Haiku hadde først seedet med reglene på).

## Neste steg

1. Skaff Java, kjør `npm run test:rules`, rett feil (i regler eller tester, med vurdering av hver).
2. Oppdater `DESIGN-...md` med resultatet. Først da regnes reglene som verifiserte.
3. Deretter: Firebase Auth + server-rute som setter claims (`role`, `pid`).
