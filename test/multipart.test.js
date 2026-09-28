import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { parseMultipart } from '../lib/admin/multipart.js';

function lagFakeRequest(bodyBuffer, contentType) {
  const req = new EventEmitter();
  req.headers = { 'content-type': contentType };
  req.destroy = () => {};
  process.nextTick(() => {
    req.emit('data', bodyBuffer);
    req.emit('end');
  });
  return req;
}

function byggMultipartBody(boundary, deler) {
  const buffers = [];
  for (const del of deler) {
    buffers.push(Buffer.from(`--${boundary}\r\n`));
    let headers = `Content-Disposition: form-data; name="${del.navn}"`;
    if (del.filnavn) headers += `; filename="${del.filnavn}"`;
    headers += '\r\n';
    if (del.contentType) headers += `Content-Type: ${del.contentType}\r\n`;
    headers += '\r\n';
    buffers.push(Buffer.from(headers));
    buffers.push(Buffer.isBuffer(del.verdi) ? del.verdi : Buffer.from(del.verdi));
    buffers.push(Buffer.from('\r\n'));
  }
  buffers.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(buffers);
}

test('parseMultipart: tekstfelt og filfelt', async () => {
  const boundary = 'TestBoundary123';
  const binærData = Buffer.from([0xff, 0xd8, 0x00, 0x01, 0x02, 0xfe]); // vilkårlige binærbytes, inkl. 0x00
  const body = byggMultipartBody(boundary, [
    { navn: 'tittel', verdi: 'Min side' },
    { navn: 'tekst', verdi: 'Linje 1\n\nLinje 2' },
    { navn: 'bilde', filnavn: 'foto.jpg', contentType: 'image/jpeg', verdi: binærData },
  ]);
  const req = lagFakeRequest(body, `multipart/form-data; boundary=${boundary}`);

  const { felt, filer } = await parseMultipart(req);

  assert.equal(felt.tittel, 'Min side');
  assert.equal(felt.tekst, 'Linje 1\n\nLinje 2');
  assert.equal(filer.bilde.filnavn, 'foto.jpg');
  assert.ok(Buffer.isBuffer(filer.bilde.data));
  assert.equal(Buffer.compare(filer.bilde.data, binærData), 0, 'binærdata skal være identisk, uskadd');
});

test('parseMultipart: tomt filfelt (ingen fil valgt) gir ingen fil-oppføring', async () => {
  const boundary = 'B2';
  const body = byggMultipartBody(boundary, [
    { navn: 'tittel', verdi: 'Uten bilde' },
    { navn: 'bilde', filnavn: '', contentType: 'application/octet-stream', verdi: '' },
  ]);
  const req = lagFakeRequest(body, `multipart/form-data; boundary=${boundary}`);

  const { felt, filer } = await parseMultipart(req);

  assert.equal(felt.tittel, 'Uten bilde');
  assert.equal(filer.bilde, undefined);
});

test('parseMultipart: anførselstegn rundt boundary i Content-Type', async () => {
  const boundary = 'QuotedBoundary';
  const body = byggMultipartBody(boundary, [{ navn: 'a', verdi: 'b' }]);
  const req = lagFakeRequest(body, `multipart/form-data; boundary="${boundary}"`);

  const { felt } = await parseMultipart(req);
  assert.equal(felt.a, 'b');
});

test('parseMultipart: for stor forespørsel avvises', async () => {
  const boundary = 'B3';
  const body = byggMultipartBody(boundary, [{ navn: 'a', verdi: 'x'.repeat(1000) }]);
  const req = lagFakeRequest(body, `multipart/form-data; boundary=${boundary}`);

  await assert.rejects(() => parseMultipart(req, { maksBytes: 10 }), /for stor/);
});
