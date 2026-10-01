# Menighets-CMS / Menighetsplan (Lillesand Misjonskirke)

Kort prosjektinstruks. Hold denne filen under ca. 5 KB. Historikk ligger i `arkiv/CLAUDE-historikk.md` og skal ikke leses med mindre noen ber om det.

## Mål

Ett nettsted og én app for menigheten: offentlige sider og nyheter, innlogget «Min side», grupper, oppgaver, chat og en enkel admin for innhold. Skal erstatte eRedaktør. Drift skal koste 0 kr så lenge det lar seg gjøre. Product Owner (PO) er Magnar. Claude er produktsjef.

## Målarkitektur (under godkjenning)

Next.js + Firestore + Firebase Auth + Firebase Storage. Admin for sider og nyheter bygges enten med FireCMS Community eller eget panel (avgjøres etter en liten test). Ingen Payload, ingen Postgres, ingen betalt CMS-lisens (FireCMS PRO er avvist).

Fullstendig design, datamodell, roller, Security Rules og tester: **`DESIGN-firebase-sikkerhet-og-datamodell.md`**. Les den før du foreslår eller endrer noe om data, roller eller sikkerhet.

## Status

- Appen `Menighetsplan2.0_mobil` (Vite + React + Firestore) bruker bare mockdata. Ingen auth, og Security Rules er åpne (`if true`). **Ikke legg inn ekte medlemsdata før innlogging og regler er på plass.**
- `nettside-v2/` (Next.js + Payload + Postgres) og MVP-en i repo-roten (`server.js`, `lib/`, `data/`, `innhold/`, `test/`) er forlatt. De brukes som spesifikasjon og kilde til gjenbruk, ikke som mål.
- **Regler og tester:** `firebase-regler/` (`firestore.rules`, `storage.rules`, 144 regeltester, 40 logikktester). Kjør med `npm run test:rules` (krever Java 21 og kort temp-sti, se README der). Utkast, men testet mot emulator.
- Kan gjenbrukes: felter og blokker fra `nettside-v2/src/collections/` (7 blokker i `Sider`), `src/lib/gruppeLogikk.ts`, `aktivitetStatus.ts`, `handlinger.ts`, `ical.ts`, og testene for dem.

## Arbeidsregler

1. **Ikke bygg nye funksjoner før målarkitekturen er godkjent.** Security Rules og 144 regeltester er skrevet og grønne i `firebase-regler/` (utkast, ikke prøvd mot ekte Firebase). Neste steg er Firebase Auth + server-rute som setter claims (`role`, `pid`) med Admin SDK, med tester.
2. Security Rules er sikkerhetsgrensen. UI kan aldri være eneste beskyttelse.
3. Roller settes bare på serveren (Admin SDK, custom claims). Leder er per gruppe, ikke global.
4. Server-side rendering med Admin SDK omgår reglene: serveren må selv filtrere på publisert status og aldri returnere `private/`-data.
5. Mobil, e-post og fødselsdato ligger i egne, strengt beskyttede dokumenter. Menighetstilhørighet er særlig kategori personopplysninger (GDPR art. 9).
6. Ingen eksisterende data slettes eller migreres før strategien er verifisert.
7. Påstander om priser og vilkår (Firebase, Render, Neon, m.fl.) skal verifiseres mot kilden og merkes «ikke verifisert» hvis de ikke er det. Målet er 0 kr, så si fra før noe som krever kort eller abonnement.
8. Verifiser før du rapporterer: kjør `tsc --noEmit` og testene, og se på resultatet. Ikke bruk `as any` som snarvei.
9. Test aldri med ekte personopplysninger. Ryd bort testdata etter bruk.
10. Les bare filene oppgaven trenger. Ikke start agenter for små ting.

## Praktisk (Windows, PO sin maskin)

- Node og npm er installert. `gh` og `git` ligger ikke i PATH. GitHub Desktop har git: `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`.
- Stier i Claude-arbeidsmappen er for lange for git. Bruk en kort `subst`-stasjon, eller last ned som zip.
- Claude kan ikke skrive til GitHub. Endrede filer leveres til PO, som laster dem opp (Add file → Create new file, eller Edit).
- Hold denne filen og `DESIGN-...md` oppdatert ved hver beslutning. Start nye samtaler med disse to som overlevering.

## Åpne beslutninger

FireCMS eller eget admin (test FireCMS mot `pages` først) · MFA-faktor og kostnad · Firebase Storage/Blaze og budsjettgrense · hosting (ikke valgt) · datoer i seed-data (bør være relative) · meldingsretensjon. Se punkt 10 i designdokumentet.
