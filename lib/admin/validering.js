// Validering av skjemadata

const SLUG_REGEX = /^[a-z0-9-]+$/;

// Valider skjemadata. Returnerer { feil: null|string, side: sideobjekt }
// isRedigerig: true hvis vi redigerer eksisterende side (slug er låst)
export function validateSkjema(data, isRedigerig, lager) {
  const slug = (data.slug || '').trim().toLowerCase();
  const tittel = (data.tittel || '').trim();
  const tekst = data.tekst || '';
  const vis = data.vis === 'on';
  const rekkefolge = parseInt(data.rekkefolge || 999, 10);

  // Valider slug
  if (!slug) {
    return { feil: 'Slug er obligatorisk', side: null };
  }
  if (!SLUG_REGEX.test(slug)) {
    return { feil: 'Slug må bare inneholde små bokstaver, tall og bindestrek', side: null };
  }

  // Valider tittel
  if (!tittel) {
    return { feil: 'Tittel er obligatorisk', side: null };
  }

  // Sjekk at slug ikke allerede finnes (for nye sider)
  // MERK: Dette er synkront og vi kan ikke kalle async hentSide her. Vi må håndtere det i index.js
  // For nå returnerer vi en feil hvis det er ny side og slug finnes
  // Dette krever tilgang til lager, så vi må håndtere det i index.js før validering

  const side = {
    slug,
    tittel,
    meny: {
      vis,
      rekkefolge: isNaN(rekkefolge) ? 999 : rekkefolge
    },
    blokker: [
      {
        type: 'tekst',
        tekst,
        id: data.blockId || undefined // Hvis redigering: behold eksisterende ID
      }
    ],
    sistEndret: new Date().toISOString()
  };

  return { feil: null, side };
}

// Valider at en ny side sin slug ikke allerede finnes
// Brukes i index.js før saving
export async function validerNySlug(slug, lager) {
  const eksisterende = await lager.hentSide(slug);
  return !eksisterende; // true hvis OK (slug finnes ikke)
}
