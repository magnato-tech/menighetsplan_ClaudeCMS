// Tester for filtrering og relevans

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { filtrerForekomster, hentDenneUken, hentKategorierForVising } from '../lib/visning/relevans.js';

describe('Filtrering og relevans', () => {
  const baseEvent = (overrides = {}) => ({
    summary: 'Test event',
    startUtc: Date.now(),
    endUtc: Date.now() + 3600000,
    location: 'Kirken',
    description: '',
    status: 'BEKREFTET',
    erGudstjeneste: false,
    categories: [],
    ...overrides,
  });

  describe('filtrerForekomster', () => {
    test('viser alt når visning=alle', () => {
      const events = [
        baseEvent({ erGudstjeneste: true, summary: 'Gudstjeneste' }),
        baseEvent({ erGudstjeneste: false, summary: 'Konser' }),
      ];
      const filtered = filtrerForekomster(events, 'alle');
      assert.equal(filtered.length, 2);
    });

    test('viser bare gudstjenester når visning=gudstjenester', () => {
      const events = [
        baseEvent({ erGudstjeneste: true, summary: 'Gudstjeneste' }),
        baseEvent({ erGudstjeneste: false, summary: 'Høstbasar' }),
        baseEvent({ erGudstjeneste: true, summary: 'Familiegudstjeneste' }),
      ];
      const filtered = filtrerForekomster(events, 'gudstjenester');
      assert.equal(filtered.length, 2);
      assert.ok(filtered.every(e => e.erGudstjeneste));
    });

    test('ignorerer ukjent visning-verdi og viser alt', () => {
      const events = [
        baseEvent({ erGudstjeneste: true }),
        baseEvent({ erGudstjeneste: false }),
      ];
      const filtered = filtrerForekomster(events, 'ukjent');
      assert.equal(filtered.length, 2);
    });

    test('håndterer tom liste', () => {
      const filtered = filtrerForekomster([], 'gudstjenester');
      assert.equal(filtered.length, 0);
    });
  });

  describe('hentDenneUken', () => {
    test('inkluderer arrangementer innen 7 dager', () => {
      const now = Date.now();
      const events = [
        baseEvent({ startUtc: now + 1 * 86400000 }), // 1 dag frem
        baseEvent({ startUtc: now + 3 * 86400000 }), // 3 dager frem
        baseEvent({ startUtc: now + 6.9 * 86400000 }), // 6.9 dager frem
      ];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 3);
    });

    test('ekskluderer arrangementer mer enn 7 dager frem', () => {
      const now = Date.now();
      const events = [
        baseEvent({ startUtc: now + 7 * 86400000 }), // eksakt 7 dager = grensen
        baseEvent({ startUtc: now + 7.1 * 86400000 }), // 7.1 dager = utenfor
        baseEvent({ startUtc: now + 30 * 86400000 }), // 30 dager = langt fram
      ];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 0);
    });

    test('ekskluderer arrangementer i fortiden', () => {
      const now = Date.now();
      const events = [
        baseEvent({ startUtc: now - 1000 }), // 1 sekund i fortiden
        baseEvent({ startUtc: now - 86400000 }), // 1 dag i fortiden
        baseEvent({ startUtc: now + 1 * 86400000 }), // 1 dag fram
      ];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 1);
      assert.equal(denneUken[0].summary, 'Test event');
    });

    test('returnerer tomt når ingen arrangementer denne uken', () => {
      const now = Date.now();
      const events = [
        baseEvent({ startUtc: now - 86400000 }),
        baseEvent({ startUtc: now + 10 * 86400000 }),
      ];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 0);
    });

    test('sorter kronologisk stigende', () => {
      const now = Date.now();
      const events = [
        baseEvent({ startUtc: now + 3 * 86400000, summary: 'Event 3' }),
        baseEvent({ startUtc: now + 1 * 86400000, summary: 'Event 1' }),
        baseEvent({ startUtc: now + 2 * 86400000, summary: 'Event 2' }),
      ];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 3);
      assert.equal(denneUken[0].summary, 'Event 1');
      assert.equal(denneUken[1].summary, 'Event 2');
      assert.equal(denneUken[2].summary, 'Event 3');
    });

    test('håndterer arrangementer som akkurat starter nå', () => {
      const now = Date.now();
      const events = [baseEvent({ startUtc: now })];
      const denneUken = hentDenneUken(events, now);
      assert.equal(denneUken.length, 1);
    });
  });

  describe('hentKategorierForVising', () => {
    test('returner alle kategorier unntatt "Gudstjeneste"', () => {
      const event = baseEvent({
        categories: ['Gudstjeneste', 'Familie', 'Møte'],
      });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, ['Familie', 'Møte']);
    });

    test('returner tom array når bare "Gudstjeneste" finnes', () => {
      const event = baseEvent({ categories: ['Gudstjeneste'] });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, []);
    });

    test('returner tom array når categories mangler', () => {
      const event = baseEvent({ categories: undefined });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, []);
    });

    test('returner tom array når categories er tom', () => {
      const event = baseEvent({ categories: [] });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, []);
    });

    test('håndterer categories med spesialtegn', () => {
      const event = baseEvent({
        categories: ['Type: Konsert', 'Målgruppe: Familie', 'Gudstjeneste'],
      });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, ['Type: Konsert', 'Målgruppe: Familie']);
    });

    test('håndterer ikke-array categories', () => {
      const event = baseEvent({ categories: 'ikke-array' });
      const kategorier = hentKategorierForVising(event);
      assert.deepEqual(kategorier, []);
    });
  });
});
