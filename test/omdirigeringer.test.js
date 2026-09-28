// Tester for omdirigering av gamle URL-er

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { lagOpprettOmdirigeringer } from '../lib/innhold/omdirigeringer.js';

describe('Omdirigeringer', () => {
  let tmpDir;
  let omdirigeringer;

  test('setup – opprett midlertidig mappe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cms-test-omdir-'));
    // Opprett tom omdirigeringer.json
    const filsti = path.join(tmpDir, 'omdirigeringer.json');
    await writeFile(filsti, '{}', 'utf8');
    omdirigeringer = lagOpprettOmdirigeringer(tmpDir);
  });

  test('hentOmdirigeringer returnerer tomt objekt fra tom fil', async () => {
    const omdir = await omdirigeringer.hentOmdirigeringer();
    assert.deepEqual(omdir, {});
  });

  test('hentOmdirigeringer leser og parser JSON', async () => {
    const filsti = path.join(tmpDir, 'omdirigeringer.json');
    const data = {
      '/gammel-side': '/ny-side',
      '/noe-annet': '/anderledes'
    };
    await writeFile(filsti, JSON.stringify(data), 'utf8');
    const omdir = await omdirigeringer.hentOmdirigeringer();
    assert.deepEqual(omdir, data);
  });

  test('hentOmdirigeringer returnerer tomt objekt hvis fil ikke finnes', async () => {
    const omdirigeringer2 = lagOpprettOmdirigeringer('/nonexistent/path');
    const omdir = await omdirigeringer2.hentOmdirigeringer();
    assert.deepEqual(omdir, {});
  });

  test('hentOmdirigeringer returnerer tomt objekt hvis JSON er ugyldig', async () => {
    const filsti = path.join(tmpDir, 'omdirigeringer.json');
    await writeFile(filsti, 'dette er ikke json', 'utf8');
    const omdir = await omdirigeringer.hentOmdirigeringer();
    assert.deepEqual(omdir, {});
  });

  test('hentOmdirigeringer returnerer tomt objekt hvis innhold ikke er objekt', async () => {
    const filsti = path.join(tmpDir, 'omdirigeringer.json');
    await writeFile(filsti, '"en streng"', 'utf8');
    const omdir = await omdirigeringer.hentOmdirigeringer();
    assert.deepEqual(omdir, {});
  });

  test('cleanup – slett midlertidig mappe', async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });
});
