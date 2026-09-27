// Tester for lagring av sider

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { lagOpprettLager } from '../lib/innhold/lager.js';

describe('Lager', () => {
  let tmpDir;
  let lager;

  test('setup – opprett midlertidig mappe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cms-test-'));
    lager = lagOpprettLager(tmpDir);
  });

  test('listSider returnerer tom liste for ny mappe', async () => {
    const sider = await lager.listSider();
    assert.equal(sider.length, 0);
  });

  test('lagreSide lagrer en side', async () => {
    const side = {
      slug: 'test-side',
      tittel: 'Test side',
      meny: { vis: true, rekkefolge: 1 },
      blokker: [{ type: 'tekst', tekst: 'Test' }],
      sistEndret: '2026-09-27T00:00:00Z'
    };
    await lager.lagreSide(side);
    const hentet = await lager.hentSide('test-side');
    // Siden skal ha modellVersjon og blokk-id lagt til
    assert.equal(hentet.slug, side.slug);
    assert.equal(hentet.tittel, side.tittel);
    assert.equal(hentet.modellVersjon, 1);
    assert.ok(hentet.blokker[0].id);
    assert.equal(hentet.blokker[0].type, side.blokker[0].type);
    assert.equal(hentet.blokker[0].tekst, side.blokker[0].tekst);
  });

  test('hentSide returnerer null for ukjent side', async () => {
    const hentet = await lager.hentSide('finnes-ikke');
    assert.equal(hentet, null);
  });

  test('hentSide validerer slug – avviser med ugyldig slag', async () => {
    const hentet = await lager.hentSide('../etc/passwd');
    assert.equal(hentet, null);
  });

  test('lagreSide validerer slug – kaster for ugyldig slug', async () => {
    const side = { slug: '../etc/passwd', tittel: 'Evil', blokker: [] };
    try {
      await lager.lagreSide(side);
      assert.fail('Skulle kaste error');
    } catch (err) {
      assert.ok(err.message.includes('Ugyldig slug'));
    }
  });

  test('listSider sorterer på rekkefolge', async () => {
    // Opprett ny lager for denne testen for å unngå påvirkning fra tidligere tester
    const tmpDir2 = await (await import('node:fs/promises')).mkdtemp(path.join(os.tmpdir(), 'cms-test-sort-'));
    const lager2 = lagOpprettLager(tmpDir2);

    await lager2.lagreSide({ slug: 's1', tittel: 'S1', meny: { vis: true, rekkefolge: 2 }, blokker: [] });
    await lager2.lagreSide({ slug: 's2', tittel: 'S2', meny: { vis: true, rekkefolge: 1 }, blokker: [] });
    const sider = await lager2.listSider();

    assert.equal(sider[0].slug, 's2');
    assert.equal(sider[1].slug, 's1');

    // Cleanup
    await (await import('node:fs/promises')).rm(tmpDir2, { recursive: true, force: true });
  });

  test('cleanup – slett midlertidig mappe', async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });
});
