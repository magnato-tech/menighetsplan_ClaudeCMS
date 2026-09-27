// Tester for admin-grensesnitt

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { lagOpprettLager } from '../lib/innhold/lager.js';
import { validateSkjema, validerNySlug } from '../lib/admin/validering.js';
import { sjekKAuth } from '../lib/admin/auth.js';

describe('Admin', () => {
  let tmpDir;
  let lager;

  test('setup – opprett midlertidig mappe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cms-admin-test-'));
    lager = lagOpprettLager(tmpDir);
  });

  test('lager.slettSide – sletter eksisterende side', async () => {
    const side = {
      slug: 'slett-test',
      tittel: 'Slett test',
      meny: { vis: true, rekkefolge: 1 },
      blokker: [{ type: 'tekst', tekst: 'Test' }],
      sistEndret: '2026-09-27T00:00:00Z'
    };
    await lager.lagreSide(side);

    const filsti = path.join(tmpDir, 'sider', 'slett-test.json');
    assert.ok(existsSync(filsti), 'Fil skal finnes før sletting');

    await lager.slettSide('slett-test');
    assert.ok(!existsSync(filsti), 'Fil skal være slettet');
  });

  test('lager.slettSide – kaster ikke error for manglende side', async () => {
    // Skal ikke kaste error
    await lager.slettSide('finnes-ikke');
  });

  test('validateSkjema – godtar gyldig data', () => {
    const data = {
      slug: 'test-side',
      tittel: 'Test Side',
      tekst: 'Noe tekst',
      vis: 'on',
      rekkefolge: '1'
    };
    const { feil, side } = validateSkjema(data, false, lager);
    assert.equal(feil, null);
    assert.ok(side);
    assert.equal(side.slug, 'test-side');
    assert.equal(side.tittel, 'Test Side');
  });

  test('validateSkjema – avviser tom tittel', () => {
    const data = {
      slug: 'test',
      tittel: '',
      tekst: 'Noe',
      vis: '',
      rekkefolge: '1'
    };
    const { feil } = validateSkjema(data, false, lager);
    assert.ok(feil && feil.includes('Tittel'));
  });

  test('validateSkjema – avviser tom slug', () => {
    const data = {
      slug: '',
      tittel: 'Tittel',
      tekst: 'Noe',
      vis: '',
      rekkefolge: '1'
    };
    const { feil } = validateSkjema(data, false, lager);
    assert.ok(feil && feil.includes('Slug'));
  });

  test('validateSkjema – avviser ugyldig slug', () => {
    const data = {
      slug: 'Test-Side_123',
      tittel: 'Tittel',
      tekst: 'Noe',
      vis: '',
      rekkefolge: '1'
    };
    const { feil } = validateSkjema(data, false, lager);
    assert.ok(feil && feil.includes('små bokstaver, tall og bindestrek'));
  });

  test('validerNySlug – returnerer true for ukjent slug', async () => {
    const resultat = await validerNySlug('helt-ny-slug', lager);
    assert.equal(resultat, true);
  });

  test('validerNySlug – returnerer false for eksisterende slug', async () => {
    const side = {
      slug: 'eksisterende',
      tittel: 'Eksisterende',
      meny: { vis: true, rekkefolge: 1 },
      blokker: [{ type: 'tekst', tekst: 'Test' }],
      sistEndret: '2026-09-27T00:00:00Z'
    };
    await lager.lagreSide(side);

    const resultat = await validerNySlug('eksisterende', lager);
    assert.equal(resultat, false);
  });

  test('sjekKAuth – godtar riktig passord', () => {
    const req = {
      headers: {
        authorization: 'Basic ' + Buffer.from('bruker:hemlig').toString('base64')
      }
    };
    const resultat = sjekKAuth(req, 'hemlig');
    assert.equal(resultat, true);
  });

  test('sjekKAuth – avviser galt passord', () => {
    const req = {
      headers: {
        authorization: 'Basic ' + Buffer.from('bruker:galt').toString('base64')
      }
    };
    const resultat = sjekKAuth(req, 'hemlig');
    assert.equal(resultat, false);
  });

  test('sjekKAuth – avviser manglende Authorization', () => {
    const req = { headers: {} };
    const resultat = sjekKAuth(req, 'hemlig');
    assert.equal(resultat, false);
  });

  test('hentSide legger til modellVersjon og blokk-id for eldre sider', async () => {
    // Skriv en rå JSON-fil uten modellVersjon og blokk-id
    const gammelSide = {
      slug: 'gammel-side',
      tittel: 'Gammel side',
      meny: { vis: true, rekkefolge: 1 },
      blokker: [{ type: 'tekst', tekst: 'Gammel tekst' }],
      sistEndret: '2026-09-27T00:00:00Z'
      // Ingen modellVersjon, ingen blokk.id
    };

    const siderDir = path.join(tmpDir, 'sider');
    const filsti = path.join(siderDir, 'gammel-side.json');
    await writeFile(filsti, JSON.stringify(gammelSide), 'utf8');

    // Les siden
    const hentet = await lager.hentSide('gammel-side');
    assert.equal(hentet.modellVersjon, 1, 'Skal ha modellVersjon 1');
    assert.ok(hentet.blokker[0].id, 'Blokk skal ha id');
    assert.equal(hentet.blokker[0].type, 'tekst', 'Blokktype skal bevares');
    assert.equal(hentet.blokker[0].tekst, 'Gammel tekst', 'Blokkinnhold skal bevares');
  });

  test('lagreSide lagrer med modellVersjon og blokk-id', async () => {
    const side = {
      slug: 'ny-side',
      tittel: 'Ny side',
      meny: { vis: true, rekkefolge: 1 },
      blokker: [{ type: 'tekst', tekst: 'Ny tekst' }],
      sistEndret: '2026-09-27T00:00:00Z'
    };

    await lager.lagreSide(side);
    const hentet = await lager.hentSide('ny-side');

    assert.equal(hentet.modellVersjon, 1);
    assert.ok(hentet.blokker[0].id, 'Blokk skal ha id');
  });

  test('cleanup – slett midlertidig mappe', async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });
});
