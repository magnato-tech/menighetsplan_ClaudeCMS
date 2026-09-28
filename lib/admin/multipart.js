// Enkel multipart/form-data-parser (ingen npm-pakker).
// Leser hele forespørselen som Buffer (binærtrygt) og deler den opp på
// boundary-markøren fra Content-Type-headeren. Skiller tekstfelt fra filfelt
// basert på om Content-Disposition-headeren i delen har et filename.
// Dekker det multipart-skjemaer fra vanlige nettlesere faktisk sender -
// ikke en fullstendig RFC 2388-implementasjon.

export async function lesRawBody(req, maksBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (maksBytes && total > maksBytes) {
        req.destroy();
        reject(new Error('Forespørselen er for stor'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function hentBoundary(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType || '');
  if (!match) return null;
  return (match[1] || match[2]).trim();
}

function delOppBuffer(buffer, separator) {
  const deler = [];
  let start = 0;
  while (true) {
    const idx = buffer.indexOf(separator, start);
    if (idx === -1) break;
    deler.push(buffer.slice(start, idx));
    start = idx + separator.length;
  }
  return deler;
}

export function erMultipart(req) {
  return (req.headers['content-type'] || '').startsWith('multipart/form-data');
}

// Returnerer { felt: { navn: tekstverdi }, filer: { navn: { filnavn, data: Buffer } } }
export async function parseMultipart(req, opts = {}) {
  const contentType = req.headers['content-type'] || '';
  const boundary = hentBoundary(contentType);
  if (!boundary) throw new Error('Fant ingen boundary i Content-Type');

  const body = await lesRawBody(req, opts.maksBytes);
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const rawDeler = delOppBuffer(body, boundaryBuf);

  const felt = {};
  const filer = {};

  for (const del of rawDeler) {
    if (del.length === 0) continue;
    // Avsluttende boundary ser ut som "--\r\n" (eller "--") - ikke en ekte del
    if (del.slice(0, 2).toString('latin1') === '--') continue;
    if (del.slice(0, 2).toString('latin1') !== '\r\n') continue; // uventet format, hopp over
    let innhold = del.slice(2);
    if (innhold.slice(-2).toString('latin1') === '\r\n') innhold = innhold.slice(0, -2);
    if (innhold.length === 0) continue;

    const headerSlutt = innhold.indexOf('\r\n\r\n');
    if (headerSlutt === -1) continue;

    const headerTekst = innhold.slice(0, headerSlutt).toString('utf8');
    const data = innhold.slice(headerSlutt + 4);

    const navnMatch = /name="([^"]*)"/.exec(headerTekst);
    if (!navnMatch) continue;
    const feltnavn = navnMatch[1];

    const filnavnMatch = /filename="([^"]*)"/.exec(headerTekst);
    if (filnavnMatch) {
      if (!filnavnMatch[1]) continue; // tomt filfelt - ingen fil ble valgt
      filer[feltnavn] = { filnavn: filnavnMatch[1], data };
    } else {
      felt[feltnavn] = data.toString('utf8');
    }
  }

  return { felt, filer };
}
