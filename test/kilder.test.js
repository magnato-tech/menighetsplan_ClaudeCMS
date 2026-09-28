import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as mp from '../lib/kilder/menighetsplan.js';

const FRA = Date.UTC(2026, 8, 1), TIL = Date.UTC(2027, 0, 1);
const mock = readFileSync(new URL('../data/menighetsplan-mock.json', import.meta.url), 'utf8');

test('Menighetsplan-API: leser kontrakt v1', () => {
  const r = mp.tolk(mock, FRA, TIL);
  assert.equal(r.antall, 5);
  const g = r.forekomster[0];
  assert.equal(g.erGudstjeneste, true);
  assert.equal(new Date(g.startUtc).toISOString(), '2026-10-04T09:00:00.000Z');
  assert.match(g.description, /Tema: Guds rike er nær/);
  assert.match(g.description, /Mark 1,14–15/);
});

test('Menighetsplan-API: avlyst og tagger', () => {
  const r = mp.tolk(mock, FRA, TIL);
  const basar = r.forekomster.find(o => o.summary === 'Høstbasar');
  assert.equal(basar.status, 'AVLYST');
  assert.deepEqual(basar.categories, ['Familie']);
});

test('Menighetsplan-API: vintertid (+01:00) blir riktig', () => {
  const fam = mp.tolk(mock, FRA, TIL).forekomster.find(o => o.summary === 'Familiegudstjeneste');
  assert.equal(new Date(fam.startUtc).toISOString(), '2026-11-01T10:00:00.000Z');
});

test('Menighetsplan-API: ukjent versjon gir tydelig feil', () => {
  assert.throws(() => mp.tolk(JSON.stringify({ versjon: 2, arrangementer: [] }), FRA, TIL), /versjon 2/);
  assert.throws(() => mp.tolk('<html>', FRA, TIL), /nettside i stedet for data/);
  assert.throws(() => mp.tolk('{ødelagt', FRA, TIL), /ikke gyldig JSON/);
});

test('Menighetsplan-API: ekte responsformat fra GAIS (tagger som strenger, ingen dobbel Gudstjeneste-tag)', () => {
  const ekteSvar = {
    versjon: 1, kilde: 'menighetsplan', generert: '2026-09-28T12:19:58.366Z', tidssone: 'Europe/Oslo',
    arrangementer: [
      { id: 'gathering-1', type: 'gudstjeneste', tittel: 'Gudstjeneste & dåp', tema: '', bibeltekst: '', beskrivelse: '', start: '2026-09-06T13:00:00+02:00', slutt: '2026-09-06T15:00:00+02:00', heldag: false, sted: 'Hovedsalen og kafeen', status: 'planlagt', tagger: ['gudstjeneste'], sistEndret: '2026-09-28T12:19:58.365Z' },
      { id: 'gathering-2', type: 'arrangement', tittel: 'Ungdomsmøte & lovsang', tema: '', bibeltekst: '', beskrivelse: '', start: '2026-09-11T21:00:00+02:00', slutt: '2026-09-11T23:00:00+02:00', heldag: false, sted: 'Ungdomssalen', status: 'planlagt', tagger: ['ungdom'], sistEndret: '2026-09-28T12:19:58.366Z' },
    ],
  };
  const r = mp.tolk(JSON.stringify(ekteSvar), Date.UTC(2026, 8, 1), Date.UTC(2026, 9, 1));
  assert.equal(r.antall, 2);
  const gudstj = r.forekomster.find(o => o.uid === 'gathering-1');
  assert.equal(gudstj.erGudstjeneste, true);
  assert.deepEqual(gudstj.categories, ['Gudstjeneste']); // ikke dobbel opp med den rå "gudstjeneste"-taggen
  const ungdom = r.forekomster.find(o => o.uid === 'gathering-2');
  assert.deepEqual(ungdom.categories, ['ungdom']);
});

test('Menighetsplan-API: tåler manglende valgfrie felt og hopper over ugyldige rader', () => {
  const r = mp.tolk(JSON.stringify({ versjon: 1, arrangementer: [
    { id: 'a', type: 'arrangement', tittel: 'Minimalt', start: '2026-10-01T18:00:00+02:00', status: 'planlagt' },
    { id: 'b', type: 'arrangement', tittel: 'Ødelagt dato', start: 'i morgen', status: 'planlagt' },
  ] }), FRA, TIL);
  assert.equal(r.forekomster.length, 1);
  assert.equal(r.forekomster[0].location, '');
});
