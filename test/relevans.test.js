// Tester for filtrering og relevans

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { filtrerForekomster, hentDenneUken, hentKategorierForVising, anvendOverstyringer } from '../lib/visning/relevans.js';

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

  describe('Fremhevet arrangementer og visningsfilter', () => {
    test('fremhevet arrangement som IKKE er gudstjeneste vises i Fremhevet selv når visning=gudstjenester', () => {
      const now = Date.now();
      const events = [
        baseEvent({
          uid: 'konsert-1',
          summary: 'Konsert',
          erGudstjeneste: false,
          startUtc: now + 100000
        }),
        baseEvent({
          uid: 'gudstjeneste-1',
          summary: 'Gudstjeneste',
          erGudstjeneste: true,
          startUtc: now + 200000
        }),
      ];
      const overstyringer = {
        'konsert-1': { fremhevet: true, skjult: false },
      };

      // Hent fremhevede fra ufiltrert liste (som Fremhevet-seksjonen gjør)
      const { fremhevede: fremhevetUfiltrert } = anvendOverstyringer(events, overstyringer);

      // Filtrer deretter på visning (som resten av siden gjør)
      const filtered = filtrerForekomster(events, 'gudstjenester');
      const { fremhevede: fremhevetFiltrert, resten } = anvendOverstyringer(filtered, overstyringer);

      // Fremhevet skal ha konserten (ufiltrert)
      assert.equal(fremhevetUfiltrert.length, 1);
      assert.equal(fremhevetUfiltrert[0].uid, 'konsert-1');

      // Resten skal IKKE ha konserten (fordi den er filtrert bort)
      assert.equal(fremhevetFiltrert.length, 0);
      assert.equal(resten.length, 1);
      assert.equal(resten[0].uid, 'gudstjeneste-1');
    });

    test('skjult arrangement skal aldri vises, uavhengig av fremhevet-status eller visningsfilter', () => {
      const now = Date.now();
      const events = [
        baseEvent({
          uid: 'skjult-arrangement',
          summary: 'Konsert (skjult)',
          erGudstjeneste: false,
          startUtc: now + 100000
        }),
      ];
      const overstyringer = {
        'skjult-arrangement': { fremhevet: true, skjult: true },
      };

      // Hent fra ufiltrert liste
      const { fremhevede: fremhevetUfiltrert } = anvendOverstyringer(events, overstyringer);

      // Hent fra filtrert liste
      const filtered = filtrerForekomster(events, 'alle');
      const { fremhevede: fremhevetFiltrert, resten } = anvendOverstyringer(filtered, overstyringer);

      // Skal aldri vises noe sted
      assert.equal(fremhevetUfiltrert.length, 0);
      assert.equal(fremhevetFiltrert.length, 0);
      assert.equal(resten.length, 0);
    });

    test('gudstjeneste som er fremhevet vises både i Fremhevet og i resten når visning=gudstjenester', () => {
      const now = Date.now();
      const events = [
        baseEvent({
          uid: 'gudstjeneste-fremhevet',
          summary: 'Gudstjeneste (fremhevet)',
          erGudstjeneste: true,
          startUtc: now + 100000
        }),
      ];
      const overstyringer = {
        'gudstjeneste-fremhevet': { fremhevet: true, skjult: false },
      };

      // Hent fra ufiltrert liste
      const { fremhevede: fremhevetUfiltrert } = anvendOverstyringer(events, overstyringer);

      // Hent fra filtrert liste
      const filtered = filtrerForekomster(events, 'gudstjenester');
      const { fremhevede: fremhevetFiltrert, resten } = anvendOverstyringer(filtered, overstyringer);

      // Skal vises i Fremhevet (ufiltrert)
      assert.equal(fremhevetUfiltrert.length, 1);
      assert.equal(fremhevetUfiltrert[0].uid, 'gudstjeneste-fremhevet');

      // Skal også vises i resten (filtrert, fordi den er en gudstjeneste)
      assert.equal(fremhevetFiltrert.length, 1);
      assert.equal(resten.length, 0);
    });
  });
});
