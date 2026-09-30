# Design: datamodell og sikkerhet for Menighetsplan + nettsted på Firebase

Status: **utkast til godkjenning. Ingen kode er bygget.** Regler og tester under er ikke kjørt.

## 1. Forutsetninger (rett meg hvis noe er feil)

| # | Forutsetning | Kilde |
|---|---|---|
| 1 | Firestore inneholder bare mockdata. Ingen migrering, og modellen kan endres fritt. | Bekreftet av bruker |
| 2 | Nettsted og app bruker **samme innlogging** (Firebase Auth). | Bekreftet |
| 3 | Chat: ca. 5–10 samtidige brukere. | Bekreftet |
| 4 | Sider og nyheter redigeres av én person, fra PC. | Bekreftet |
| 5 | Målet er 0 kr i drift. Firestore Standard, Spark-plan. | Bruker |
| 6 | Menigheten er behandlingsansvarlig. Menighetstilhørighet er en særlig kategori personopplysninger (GDPR art. 9). | Antakelse |
| 7 | Noen personer kan finnes uten innlogging (barn, eldre). | **Antakelse, avklares** |

## 2. Prinsipper

1. **Security Rules er sikkerhetsgrensen.** UI kan være feil uten at data lekker.
2. **Rolle settes bare på serveren** (Firebase Admin SDK, custom claims). Klienten kan aldri sette sin egen rolle.
3. **Privat data skilles fysisk fra offentlig data.** Mobil og fødselsdato ligger i egne dokumenter med egne regler.
4. **Smale spørringer.** Dagens app abonnerer på hele collections (7 `onSnapshot`). Det sprenger gratiskvoten (50 000 lesninger per dag) og gir lekkasjerisiko. Ny modell: abonner bare på det brukeren skal se.
5. **Offentlig nettsted rendres på serveren** (Next.js + Admin SDK) og laster ikke Firebase-klienten. Da blir siden lett å laste. Bare innlogget del (Min side, chat) bruker klient-SDK.

## 3. Roller

| Rolle | Hvordan den bestemmes | Kan |
|---|---|---|
| Besøkende | Ikke innlogget | Lese publiserte sider og nyheter |
| Medlem | Innlogget | Lese egne grupper, oppgaver, chat. Endre egen profil og egne svar |
| Gruppeleder / nestleder | `groups/{gid}/members/{uid}.role` (**per gruppe**, ikke global) | Administrere sin gruppe |
| Redaktør | Custom claim `role: "editor"` | Skrive sider og nyheter, laste opp media |
| Admin | Custom claim `role: "admin"` | Alt, inkludert brukere |

Leder er bevisst ikke en global claim. En person kan lede én gruppe og være medlem i en annen.

## 4. Datamodell (Firestore)

```
users/{uid}                      role-speil (kun lesing for klient), personId, opprettet
persons/{pid}                    displayName, photoPath, uid?          <- lav sensitivitet
  └─ private/contact             phone, birthDate, email               <- høy sensitivitet
groups/{gid}                     name, category, description, schedule, visibility
  ├─ members/{uid}               role: leader|deputy|member, joinedAt
  └─ messages/{mid}              authorUid, text, imagePath?, createdAt
gatherings/{id}                  title, startsAt, groupId|null, theme, bibleRef, hostPid, status, program[]
  └─ attendances/{uid}           status: attending|declined, updatedAt
tasks/{id}                       gatheringId, groupId, title, slots, status
assignments/{id}                 taskId, groupId, pid, status: pending|confirmed|declined
pages/{id}                       slug, title, parentId, status: draft|published, blocks[], updatedBy, publishedAt
news/{id}                        slug, title, ingress, blocks[], status, publishedAt
```

Endringer fra dagens modell, og hvorfor:

- `memberIds`/`leaderIds`-lister på gruppen blir underkolleksjonen `members`. Rules kan da sjekke medlemskap med ett oppslag, og spørringer blir smale.
- `groupMessages` (egen toppkolleksjon) blir `groups/{gid}/messages`. Tilgangen følger gruppen, og du leser bare én gruppes meldinger, sortert og begrenset (`limit(50)`).
- Bilder i chat lagres i Storage. I dag sendes de som Data-URL inne i dokumentene (maks 5 MB), som sprenger Firestores dokumentgrense på 1 MiB.
- `groupId` dupliseres inn i `tasks` og `assignments` (denormalisering), slik at regler og spørringer slipper joins.
- Mobil, e-post og fødselsdato flyttes til `persons/{pid}/private/contact`.

## 5. Tilgangsmatrise

L = les, O = opprett, E = endre, S = slett

| Data | Besøkende | Medlem | Leder (egen gruppe) | Redaktør | Admin |
|---|---|---|---|---|---|
| `pages`, `news` publisert | L | L | L | L | L |
| `pages`, `news` utkast | – | – | – | L O E S | L O E S |
| `persons` (navn, bilde) | – | L | L | L | L O E S |
| `persons/.../private/contact` | – | egen: L E | **beslutning A** | – | L O E S |
| `groups` | – | L egne | L E | – | L O E S |
| `groups/.../members` | – | L egne | L O E S | – | L O E S |
| `groups/.../messages` | – | L O egne gr. | L O S egen gr. | – | L S |
| `gatherings`, `tasks` | – | L egne | L O E S egen gr. | – | alt |
| `assignments` | – | L egne + gruppe. E egen status | L O E S egen gr. | – | alt |
| `attendances` | – | O E egen | L egen gr. | – | alt |
| `users` | – | L egen (rolle kan ikke endres) | – | – | L (skriver via server) |

**Beslutning A:** Skal gruppeledere se mobilnummeret til medlemmene i sin gruppe? Praktisk (ringe ved forfall), men krever at medlemmer er informert. Forslag: ja, bare for egen gruppe, og bare mobil, ikke fødselsdato.

## 6. Utkast til Security Rules (ikke testet)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isAdmin()  { return signedIn() && request.auth.token.role == 'admin'; }
    function isEditor() { return isAdmin() || (signedIn() && request.auth.token.role == 'editor'); }
    function memberPath(gid) {
      return /databases/$(database)/documents/groups/$(gid)/members/$(request.auth.uid);
    }
    function isMember(gid) { return signedIn() && exists(memberPath(gid)); }
    function isLeader(gid) {
      return isMember(gid) && get(memberPath(gid)).data.role in ['leader', 'deputy'];
    }

    // Standard: alt er stengt.
    match /{document=**} { allow read, write: if false; }

    match /pages/{id} {
      allow read:  if resource.data.status == 'published' || isEditor();
      allow write: if isEditor();
    }
    match /news/{id} {
      allow read:  if resource.data.status == 'published' || isEditor();
      allow write: if isEditor();
    }

    match /users/{uid} {
      allow read:  if signedIn() && (request.auth.uid == uid || isAdmin());
      allow write: if false;   // rolle og kobling skrives bare av server (Admin SDK)
    }

    match /persons/{pid} {
      allow read:   if signedIn();
      allow create: if isAdmin();
      allow update: if isAdmin() || (signedIn() && resource.data.uid == request.auth.uid
                        && !('uid' in request.resource.data.diff(resource.data).affectedKeys()));
      allow delete: if isAdmin();

      match /private/{doc} {
        allow read, write: if isAdmin()
          || (signedIn() && get(/databases/$(database)/documents/persons/$(pid)).data.uid == request.auth.uid);
        // beslutning A (avgjort ja): leder-lesing av mobil i egen gruppe må legges til her.
        // Krever en måte å finne personens grupper på (f.eks. `groupIds` på persons) og
        // at feltet for mobil skilles fra fødselsdato/e-post i eget dokument (private/phone).
      }
    }

    match /groups/{gid} {
      allow read:   if isMember(gid) || isAdmin();
      allow update: if isLeader(gid) || isAdmin();
      allow create, delete: if isAdmin();

      match /members/{uid} {
        allow read:  if isMember(gid) || isAdmin();
        allow write: if isLeader(gid) || isAdmin();
      }

      match /messages/{mid} {
        allow read:   if isMember(gid);
        allow create: if isMember(gid)
                      && request.resource.data.authorUid == request.auth.uid
                      && request.resource.data.text.size() <= 2000
                      && request.resource.data.createdAt == request.time;
        allow delete: if (signedIn() && resource.data.authorUid == request.auth.uid)
                      || isLeader(gid) || isAdmin();
        allow update: if false;
      }
    }

    // gatherings, tasks, assignments, attendances: samme mønster som over (medlem leser,
    // leder skriver i egen gruppe, medlem kan bare endre egen tildeling/oppmøte).
  }
}
```

### Storage-regler (skisse)

- `public/**`: alle leser, bare redaktør og admin skriver.
- `groups/{gid}/chat/**`: medlemmer i gruppen leser og skriver. Bare bilder, maks 5 MB.
- `profiles/{uid}/**`: innlogget leser, eier skriver.

Medlemssjekk i Storage Rules bruker `firestore.exists(...)`, og den finnes bare i Storage-reglene. Det må bekreftes i implementasjonen.

## 7. Tester som må bestå før noe regnes som ferdig

Kjøres mot emulator (`@firebase/rules-unit-testing`):

1. Uinnlogget kan lese publisert side, men ikke utkast, og ikke noe annet.
2. Medlem kan **ikke** lese `private/contact` til en annen person.
3. Medlem i gruppe A kan ikke lese eller skrive meldinger i gruppe B.
4. Medlem kan ikke sette seg selv til admin, leder eller redaktør (verken i `users`, `members` eller claims).
5. Leder av gruppe A kan ikke endre gruppe B.
6. Medlem kan ikke endre andres tildeling eller oppmøte.
7. Melding med falsk `authorUid` avvises. Melding over 2000 tegn avvises.
8. Redaktør kan publisere sider, men ikke endre grupper eller personer.
9. Uten rolle kan ingen liste en hel collection.
10. Storage: ikke-medlem kan ikke lese eller laste opp til en gruppes chat.

## 7b. Server-side rendering omgår Security Rules

Firebase Admin SDK er **ikke** begrenset av Security Rules. Når offentlige sider rendres på serveren, må serverkoden selv:

- bare hente dokumenter med `status == "published"` (og `publishedAt <= nå`),
- aldri returnere utkast, brukerdata eller felt fra `private/`,
- være den eneste plassen Admin SDK brukes til lesing av innhold, samlet i ett dataaksess-lag (ikke spredt i komponentene).

Ekstra tester (11–13):

11. Dataaksess-laget returnerer ikke utkast, selv når en utkast-slug etterspørres direkte.
12. Dataaksess-laget returnerer ingen felt fra `persons/.../private`.
13. Offentlige ruter eksponerer ikke Admin SDK-nøkler eller tjenestekonto til klienten.

## 8. Gratiskvote (Firestore Standard)

Dokumentert: 50 000 lesninger, 20 000 skrivinger og 1 GiB lagring per dag. Regelbaserte `get()` og `exists()` teller som lesninger.

Overslag for 10 aktive brukere: ca. 100–300 lesninger per bruker per dag med smale spørringer og `limit`. Det gir under 5 000 per dag, og det er godt innenfor. Dagens modell med full-collection-lyttere kan ligge 10 ganger høyere. Tallene er et overslag og må måles.

**Storage og Blaze:** Oppgitt (ikke selv verifisert mot Googles vilkår): Firebase Storage krever Blaze-plan, men no-cost-kvoten gjelder fortsatt på Blaze. Da må betalingskort og billing aktiveres, men det gir ikke nødvendigvis kostnad. Hvis Blaze brukes:

- sett **budsjettvarsel og øvre grense** i Google Cloud før noe lastes opp,
- begrens filstørrelse og type i Storage Rules (bilder, maks 5 MB),
- verifiser gjeldende vilkår på firebase.google.com/pricing før beslutning.

Alternativ uten kort: en annen lagringstjeneste (for eksempel Cloudflare R2).

**Hosting:** velges etter konkret kontroll av gjeldende gratis-/no-cost-vilkår. Ikke bestemt.

**Medieopplasting i CMS:** all opplasting går via Storage-regler, ikke via åpne URL-er.

## 9. Hva fra Payload-prosjektet gjenbrukes

| Fra Payload | Brukes som |
|---|---|
| Collections `Sider`, `Nyheter`, `Aktiviteter`, `Grupper`, `Oppgaver`, `Tildelinger`, `Oppmoter`, `GruppeMeldinger` | Spesifikasjon for felter og status |
| 5 blokktyper (tekst, video, hero, kalender, kolonner) | Blokk-skjema i `pages.blocks[]` |
| `lib/gruppeLogikk`, `aktivitetStatus`, `ical` | Gjenbrukes som ren logikk (ingen Payload-avhengighet) |
| Vitest-tester for logikken | Flyttes over |
| Payload-admin, Payload-auth, Postgres | Kastes |

## 10. Åpne beslutninger

| # | Spørsmål | Forslag |
|---|---|---|
| A | Skal ledere se medlemmenes mobilnummer? | **Avgjort: ja**, egen gruppe, kun mobil (ikke fødselsdato/e-post) |
| B | Personer uten innlogging (barn, eldre)? | **Avgjort: ja.** `persons` uten `uid`. Leder eller admin administrerer dem |
| C | Skal gruppechat kunne slettes/modereres av leder? | Ja |
| D | Hvor lenge lagres meldinger? | Forslag: 12 måneder, deretter slett |
| E | Admin-panel: FireCMS Community eller eget? | Test FireCMS mot `pages` først. Ellers eget |
| F | Innlogging: e-post/passord, Google, eller e-postlenke? | **Avgjort: Google og e-post/passord.** Firebase Auth lagrer og tilbakestiller passord. Krev minst 8 tegn |
| G | Skal admin ha tofaktor? | Ja, men ikke låst. MFA krever Identity Platform, og SMS-faktor prises separat. Faktor og kostnad må verifiseres først (TOTP-app er et mulig alternativ uten SMS) |

## 11. Arbeidsregel og byggerekkefølge

**Ingen nye funksjoner bygges før denne målarkitekturen er gjennomgått og godkjent.** Ingen eksisterende data slettes eller migreres før ny modell og migreringsstrategi er verifisert. Reglene i punkt 6 er forslag og testgrunnlag, ikke produksjonsregler, før testene er kjørt og resultatet er dokumentert.

Første tekniske steg:

1. Les dagens repoer (`menighetsplan_ClaudeCMS`, `Menighetsplan2.0_mobil`).
2. Kartlegg faktisk datamodell, kode og avhengigheter.
3. Sammenlign dagens modell med foreslått Firestore-modell.
4. Skriv Security Rules og testene.
5. Kjør testene.
6. Dokumenter resultatet.
7. Først deretter starter implementeringen.

Gjenbruk som skal vurderes i steg 1–3 (ikke verifisert ennå): `ContentBlock`-modellen, Tiptap-editoren, blokkomponentene, dagens design, gruppelogikk og eksisterende tester.

Byggerekkefølge etter godkjenning:

1. Emulator-oppsett + Security Rules + tester (punkt 7 og 7b). **Ingenting annet før disse er grønne.**
2. Firebase Auth + server-rute som setter roller (custom claims).
3. Datalaget i appen flyttes til ny modell med smale spørringer.
4. Nettstedet i Next.js (server-rendret, leser publisert innhold).
5. Adminpanel for sider og nyheter (FireCMS-test, ellers eget).
6. Personvern: erklæring, sletting av person, logging av admin-endringer.
