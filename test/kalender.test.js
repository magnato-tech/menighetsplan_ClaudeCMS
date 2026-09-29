// Tester for kalenderlogikk

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  byggKalenderGrid,
  getDatoString,
  getDagsDatoString,
  parseYearMonth,
  getCurrentYearMonth,
  getNextMonth,
  getPrevMonth,
  getAarManed,
} from '../lib/visning/kalender.js';

describe('Kalenderlogikk', () => {
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

  describe('getDatoString', () => {
    test('formaterer dato som YYYY-MM-DD', () => {
      const d = new Date('2026-10-15T10:00:00Z');
      const result = getDatoString(d, 'Europe/Oslo');
      assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/));
    });

    test('håndterer tidssone korrekt', () => {
      // A time close to midnight UTC might be a different date in Oslo
      const d = new Date('2026-10-15T22:00:00Z'); // 2026-10-16 00:00 in Oslo
      const result = getDatoString(d, 'Europe/Oslo');
      // Should be 2026-10-16 in Oslo
      assert.equal(result, '2026-10-16');
    });
  });

  describe('getDagsDatoString', () => {
    test('returnerer dagens dato i YYYY-MM-DD format', () => {
      const ms = Date.parse('2026-10-15T10:00:00Z');
      const result = getDagsDatoString(ms);
      assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/));
    });
  });

  describe('getAarManed', () => {
    test('returnerer {ar, maned} for gitt tidspunkt', () => {
      const ms = Date.parse('2026-10-15T10:00:00Z');
      const result = getAarManed(ms);
      assert.equal(result.ar, 2026);
      assert.equal(result.maned, 10);
    });

    test('returnerer maned som 1-12, ikke 0-11', () => {
      const ms = Date.parse('2026-01-15T10:00:00Z');
      const result = getAarManed(ms);
      assert.equal(result.maned, 1);

      const msDesember = Date.parse('2026-12-15T10:00:00Z');
      const resultDes = getAarManed(msDesember);
      assert.equal(resultDes.maned, 12);
    });
  });

  describe('parseYearMonth', () => {
    test('parser YYYY-MM format', () => {
      const result = parseYearMonth('2026-10');
      assert.deepEqual(result, { ar: 2026, maned: 10 });
    });

    test('returnerer null for ugyldig format', () => {
      assert.equal(parseYearMonth('2026-13'), null);
      assert.equal(parseYearMonth('2026'), null);
      assert.equal(parseYearMonth('10-2026'), null);
      assert.equal(parseYearMonth(''), null);
      assert.equal(parseYearMonth(null), null);
    });

    test('accepterer enkeltsiffer måneder', () => {
      const result = parseYearMonth('2026-1');
      assert.deepEqual(result, { ar: 2026, maned: 1 });
    });
  });

  describe('getCurrentYearMonth', () => {
    test('returnerer YYYY-MM for gitt tidspunkt', () => {
      const ms = Date.parse('2026-10-15T10:00:00Z');
      const result = getCurrentYearMonth(ms);
      assert.equal(result, '2026-10');
    });

    test('padder måned med null', () => {
      const ms = Date.parse('2026-01-15T10:00:00Z');
      const result = getCurrentYearMonth(ms);
      assert.equal(result, '2026-01');
    });
  });

  describe('getNextMonth', () => {
    test('returnerer neste måned', () => {
      const result = getNextMonth('2026-10');
      assert.equal(result, '2026-11');
    });

    test('håndterer årsskifte', () => {
      const result = getNextMonth('2026-12');
      assert.equal(result, '2027-01');
    });

    test('returnerer innputtverdi ved ugyldig format', () => {
      const result = getNextMonth('invalid');
      assert.equal(result, 'invalid');
    });
  });

  describe('getPrevMonth', () => {
    test('returnerer forrige måned', () => {
      const result = getPrevMonth('2026-10');
      assert.equal(result, '2026-09');
    });

    test('håndterer årsskifte', () => {
      const result = getPrevMonth('2026-01');
      assert.equal(result, '2025-12');
    });
  });

  describe('byggKalenderGrid', () => {
    test('returnerer struktur med uker, manedNavn og ar', () => {
      const result = byggKalenderGrid(2026, 10, [], Date.parse('2026-10-15T10:00:00Z'));
      assert.ok(Array.isArray(result.uker));
      assert.equal(typeof result.manedNavn, 'string');
      assert.equal(result.ar, 2026);
    });

    test('oktober 2026 starter på torsdag', () => {
      // Oktober 2026 starts on Thursday (Oct 1 is a Thursday)
      // So grid should start on Monday of that week
      const result = byggKalenderGrid(2026, 10, [], Date.parse('2026-10-15T10:00:00Z'));
      const forsteUke = result.uker[0];
      assert.equal(forsteUke.length, 7);
      // First day should be from September (iValgtManed=false)
      assert.equal(forsteUke[0].iValgtManed, false);
      assert.equal(forsteUke[0].dagINummer, 28); // Sept 28 (Monday before Oct 1)
      // Oct 1 should be on Thursday (index 3 in the week starting Monday)
      assert.equal(forsteUke[3].dagINummer, 1);
      assert.equal(forsteUke[3].iValgtManed, true);
    });

    test('hver uke har eksakt 7 dager', () => {
      const result = byggKalenderGrid(2026, 10, [], Date.parse('2026-10-15T10:00:00Z'));
      for (const uke of result.uker) {
        assert.equal(uke.length, 7);
      }
    });

    test('oktober har 31 dager', () => {
      const result = byggKalenderGrid(2026, 10, [], Date.parse('2026-10-15T10:00:00Z'));
      let lastDayOfMonth = 0;
      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.iValgtManed) {
            lastDayOfMonth = Math.max(lastDayOfMonth, dag.dagINummer);
          }
        }
      }
      assert.equal(lastDayOfMonth, 31);
    });

    test('februar 2028 har 29 dager (skuddår)', () => {
      const result = byggKalenderGrid(2028, 2, [], Date.parse('2028-02-15T10:00:00Z'));
      let daysInMonth = 0;
      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.iValgtManed) {
            daysInMonth = Math.max(daysInMonth, dag.dagINummer);
          }
        }
      }
      assert.equal(daysInMonth, 29);
    });

    test('februar 2026 har 28 dager (ikke skuddår)', () => {
      const result = byggKalenderGrid(2026, 2, [], Date.parse('2026-02-15T10:00:00Z'));
      let daysInMonth = 0;
      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.iValgtManed) {
            daysInMonth = Math.max(daysInMonth, dag.dagINummer);
          }
        }
      }
      assert.equal(daysInMonth, 28);
    });

    test('erIdag markerer dagens dato', () => {
      const now = Date.parse('2026-10-15T10:00:00Z');
      const result = byggKalenderGrid(2026, 10, [], now);
      let foundToday = false;
      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.erIdag) {
            foundToday = true;
            assert.equal(dag.dagINummer, 15); // Oct 15
            assert.equal(dag.iValgtManed, true);
          }
        }
      }
      assert.ok(foundToday, 'Dagens dato ble ikke funnet i griddet');
    });

    test('grupperer arrangementer per dag basert på Oslo-tidssone', () => {
      // UTC 2026-10-15 22:00:00 = 2026-10-16 00:00:00 in Oslo (summer time, UTC+2)
      const events = [
        baseEvent({ summary: 'Event 1', startUtc: Date.parse('2026-10-15T22:00:00Z') }),
        baseEvent({ summary: 'Event 2', startUtc: Date.parse('2026-10-16T08:00:00Z') }),
      ];
      const result = byggKalenderGrid(2026, 10, events, Date.parse('2026-10-15T10:00:00Z'));

      let found15 = false;
      let found16 = false;
      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.dagINummer === 15 && dag.iValgtManed && dag.arrangementer.length > 0) {
            found15 = true;
            // Oct 15 should have the first event (because UTC 22:00 = Oct 16 in Oslo)
          }
          if (dag.dagINummer === 16 && dag.iValgtManed && dag.arrangementer.length > 0) {
            found16 = true;
            // Oct 16 should have events
            assert.ok(dag.arrangementer.some(e => e.summary === 'Event 1'));
          }
        }
      }
      assert.ok(found16, 'Oct 16 should have an event');
    });

    test('sorterer arrangementer innad en dag kronologisk', () => {
      const events = [
        baseEvent({ summary: 'Later', startUtc: Date.parse('2026-10-15T14:00:00Z') }),
        baseEvent({ summary: 'Earlier', startUtc: Date.parse('2026-10-15T08:00:00Z') }),
        baseEvent({ summary: 'Middle', startUtc: Date.parse('2026-10-15T11:00:00Z') }),
      ];
      const result = byggKalenderGrid(2026, 10, events, Date.parse('2026-10-15T10:00:00Z'));

      for (const uke of result.uker) {
        for (const dag of uke) {
          if (dag.dagINummer === 15 && dag.iValgtMaden) {
            const summaries = dag.arrangementer.map(e => e.summary);
            assert.deepEqual(summaries, ['Earlier', 'Middle', 'Later']);
          }
        }
      }
    });

    test('januar 2026 starter på torsdag', () => {
      // Verify jan 1 2026 is actually a Thursday
      const d = new Date('2026-01-01T00:00:00Z');
      const dayOfWeek = d.getDay();
      assert.equal(dayOfWeek, 4); // Thursday

      const result = byggKalenderGrid(2026, 1, [], Date.parse('2026-01-15T10:00:00Z'));
      const forsteUke = result.uker[0];
      assert.equal(forsteUke[0].iValgtManed, false); // Dec 28
      assert.equal(forsteUke[3].dagINummer, 1); // Jan 1 on Thursday
      assert.equal(forsteUke[3].iValgtManed, true);
    });

    test('måned som starter på mandag', () => {
      // Find a month that starts on Monday
      // April 2026 starts on Wednesday
      // Let's check May 2025: starts on Thursday
      // June 2025: starts on Sunday
      // July 2025: starts on Tuesday
      // For testing, let's construct from date knowledge
      // We need a month starting on Monday.
      // Checking: May 2024 starts on Wednesday, June 2024 starts on Saturday, July 2024 starts on Monday

      const result = byggKalenderGrid(2024, 7, [], Date.parse('2024-07-15T10:00:00Z'));
      const forsteUke = result.uker[0];
      // First day should be 1st (no days from previous month)
      assert.equal(forsteUke[0].dagINummer, 1);
      assert.equal(forsteUke[0].iValgtManed, true);
    });

    test('månedsnavn kapitaliseres', () => {
      const result = byggKalenderGrid(2026, 10, [], Date.parse('2026-10-15T10:00:00Z'));
      assert.equal(result.manedNavn, 'Oktober');
      assert.equal(result.manedNavn[0], result.manedNavn[0].toUpperCase());
    });
  });
});
