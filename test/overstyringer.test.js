// Tester for overstyringer (fremhevet/skjult arrangementer)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { lagOpprettOverstyringer } from '../lib/innhold/overstyringer.js';
import { anvendOverstyringer } from '../lib/visning/relevans.js';

describe('Overstyringer', () => {
  let tmpDir;
  let overstyringer;

  test('setup – opprett midlertidig mappe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cms-test-overstyringer-'));
    overstyringer = lagOpprettOverstyringer(tmpDir);
  });

  describe('settOverstyring og hentForUid', () => {
    test('lagrer og henter en overstyring', async () => {
      await overstyringer.settOverstyring('gathering-1', { fremhevet: true, skjult: false });
      const hentet = await overstyringer.hentForUid('gathering-1');
      assert.deepEqual(hentet, { fremhevet: true, skjult: false });
    });

    test('hentForUid returnerer null for ukjent uid', async () => {
      const hentet = await overstyringer.hentForUid('ukjent-uid');
      assert.equal(hentet, null);
    });

    test('setter kun fremhevet', async () => {
      await overstyringer.settOverstyring('gathering-2', { fremhevet: true, skjult: false });
      const hentet = await overstyringer.hentForUid('gathering-2');
      assert.equal(hentet.fremhevet, true);
      assert.equal(hentet.skjult, false);
    });

    test('setter kun skjult', async () => {
      await overstyringer.settOverstyring('gathering-3', { fremhevet: false, skjult: true });
      const hentet = await overstyringer.hentForUid('gathering-3');
      assert.equal(hentet.fremhevet, false);
      assert.equal(hentet.skjult, true);
    });

    test('fjerner overstyring når både fremhevet og skjult er false', async () => {
      await overstyringer.settOverstyring('gathering-4', { fremhevet: true, skjult: false });
      let hentet = await overstyringer.hentForUid('gathering-4');
      assert.ok(hentet);

      await overstyringer.settOverstyring('gathering-4', { fremhevet: false, skjult: false });
      hentet = await overstyringer.hentForUid('gathering-4');
      assert.equal(hentet, null);
    });

    test('hentAlle returnerer tom objekt for ny mappe', async () => {
      const tmpDir2 = await mkdtemp(path.join(os.tmpdir(), 'cms-test-overstyringer2-'));
      const overstyringer2 = lagOpprettOverstyringer(tmpDir2);
      const alle = await overstyringer2.hentAlle();
      assert.deepEqual(alle, {});
      await rm(tmpDir2, { recursive: true });
    });

    test('validerer uid – avviser ugyldig format', async () => {
      let thrown = false;
      try {
        await overstyringer.settOverstyring('../etc/passwd', { fremhevet: true, skjult: false });
      } catch (err) {
        thrown = true;
        assert.match(err.message, /uid/i);
      }
      assert.ok(thrown);
    });

    test('hentForUid avviser ugyldig uid', async () => {
      const hentet = await overstyringer.hentForUid('../../invalid');
      assert.equal(hentet, null);
    });
  });

  describe('anvendOverstyringer', () => {
    const baseEvent = (overrides = {}) => ({
      uid: 'gathering-1',
      summary: 'Test event',
      startUtc: Date.now(),
      erGudstjeneste: false,
      status: 'BEKREFTET',
      ...overrides,
    });

    test('returnerer alle arrangementer i resten når ingen overstyringer', () => {
      const events = [
        baseEvent({ uid: 'e1' }),
        baseEvent({ uid: 'e2' }),
        baseEvent({ uid: 'e3' }),
      ];
      const { fremhevede, resten } = anvendOverstyringer(events, {});
      assert.equal(fremhevede.length, 0);
      assert.equal(resten.length, 3);
    });

    test('fremhevede arrangementer havner i fremhevede', () => {
      const events = [
        baseEvent({ uid: 'e1' }),
        baseEvent({ uid: 'e2' }),
      ];
      const overstyringer = {
        'e1': { fremhevet: true, skjult: false },
      };
      const { fremhevede, resten } = anvendOverstyringer(events, overstyringer);
      assert.equal(fremhevede.length, 1);
      assert.equal(fremhevede[0].uid, 'e1');
      assert.equal(resten.length, 1);
      assert.equal(resten[0].uid, 'e2');
    });

    test('skjulte arrangementer vises ikke noe sted', () => {
      const events = [
        baseEvent({ uid: 'e1' }),
        baseEvent({ uid: 'e2' }),
        baseEvent({ uid: 'e3' }),
      ];
      const overstyringer = {
        'e2': { fremhevet: false, skjult: true },
      };
      const { fremhevede, resten } = anvendOverstyringer(events, overstyringer);
      assert.equal(fremhevede.length, 0);
      assert.equal(resten.length, 2);
      assert.equal(resten[0].uid, 'e1');
      assert.equal(resten[1].uid, 'e3');
    });

    test('skjult overstyrer fremhevet', () => {
      const events = [
        baseEvent({ uid: 'e1' }),
      ];
      const overstyringer = {
        'e1': { fremhevet: true, skjult: true },
      };
      const { fremhevede, resten } = anvendOverstyringer(events, overstyringer);
      assert.equal(fremhevede.length, 0);
      assert.equal(resten.length, 0);
    });

    test('håndterer tom liste', () => {
      const { fremhevede, resten } = anvendOverstyringer([], {});
      assert.equal(fremhevede.length, 0);
      assert.equal(resten.length, 0);
    });

    test('håndterer events uten uid i overstyringer', () => {
      const events = [
        baseEvent({ uid: 'e1' }),
        baseEvent({ uid: 'e2' }),
      ];
      const overstyringer = {
        'e1': { fremhevet: true, skjult: false },
      };
      const { fremhevede, resten } = anvendOverstyringer(events, overstyringer);
      assert.equal(fremhevede.length, 1);
      assert.equal(resten.length, 1);
    });
  });

  describe('toggleFelt', () => {
    test('slår på og av fremhevet', async () => {
      let ny = await overstyringer.toggleFelt('gathering-toggle-1', 'fremhevet');
      assert.equal(ny.fremhevet, true);
      assert.equal(ny.skjult, false);

      const lagret = await overstyringer.hentForUid('gathering-toggle-1');
      assert.equal(lagret.fremhevet, true);

      ny = await overstyringer.toggleFelt('gathering-toggle-1', 'fremhevet');
      assert.equal(ny.fremhevet, false);

      const fjernet = await overstyringer.hentForUid('gathering-toggle-1');
      assert.equal(fjernet, null);
    });

    test('bevarer det andre feltet ved toggling', async () => {
      await overstyringer.toggleFelt('gathering-toggle-2', 'skjult');
      const ny = await overstyringer.toggleFelt('gathering-toggle-2', 'fremhevet');
      assert.equal(ny.fremhevet, true);
      assert.equal(ny.skjult, true);
    });
  });

  describe('ryddOpp', () => {
    test('fjerner overstyringer for uid-er som ikke lenger finnes', async () => {
      await overstyringer.settOverstyring('rydd-behold', { fremhevet: true, skjult: false });
      await overstyringer.settOverstyring('rydd-fjern', { fremhevet: false, skjult: true });

      const gyldige = new Set(['rydd-behold']);
      const resultat = await overstyringer.ryddOpp(gyldige);

      assert.ok(resultat['rydd-behold']);
      assert.equal(resultat['rydd-fjern'], undefined);

      const fraDisk = await overstyringer.hentAlle();
      assert.ok(fraDisk['rydd-behold']);
      assert.equal(fraDisk['rydd-fjern'], undefined);
    });

    test('gjør ingenting når alle uid-er fortsatt er gyldige', async () => {
      await overstyringer.settOverstyring('rydd-uendret', { fremhevet: true, skjult: false });
      const gyldige = new Set(['rydd-uendret', 'noe-annet']);
      const resultat = await overstyringer.ryddOpp(gyldige);
      assert.ok(resultat['rydd-uendret']);
    });
  });

  describe('settBilde', () => {
    test('lagrer bilde-filnavn for en uid', async () => {
      const ny = await overstyringer.settBilde('bilde-1', 'abc12345.jpg');
      assert.equal(ny.bilde, 'abc12345.jpg');
      const hentet = await overstyringer.hentForUid('bilde-1');
      assert.equal(hentet.bilde, 'abc12345.jpg');
    });

    test('bevarer fremhevet-status når bilde settes', async () => {
      await overstyringer.settOverstyring('bilde-2', { fremhevet: true, skjult: false });
      await overstyringer.settBilde('bilde-2', 'def67890.png');
      const hentet = await overstyringer.hentForUid('bilde-2');
      assert.equal(hentet.fremhevet, true);
      assert.equal(hentet.bilde, 'def67890.png');
    });

    test('null fjerner bildet, og hele oppføringen hvis ellers false', async () => {
      await overstyringer.settBilde('bilde-3', 'ghi11111.jpg');
      await overstyringer.settBilde('bilde-3', null);
      const hentet = await overstyringer.hentForUid('bilde-3');
      assert.equal(hentet, null);
    });
  });

  test('cleanup – slett midlertidig mappe', async () => {
    await rm(tmpDir, { recursive: true });
  });
});
