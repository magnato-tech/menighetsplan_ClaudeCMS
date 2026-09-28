import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lagOpprettBilder } from '../lib/innhold/bilder.js';

test('lagreBilde: lagrer gyldig bilde og returnerer filnavn med riktig endelse', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'bilder-test-'));
  try {
    const { lagreBilde, bildesti } = lagOpprettBilder(tmp);
    const buffer = Buffer.from([0xff, 0xd8, 0xff]);
    const filnavn = await lagreBilde(buffer, 'mitt bilde.JPG');
    assert.match(filnavn, /\.jpg$/);
    const lest = await readFile(bildesti(filnavn));
    assert.equal(Buffer.compare(lest, buffer), 0);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('lagreBilde: avviser ikke-tillatt filtype', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'bilder-test-'));
  try {
    const { lagreBilde } = lagOpprettBilder(tmp);
    await assert.rejects(() => lagreBilde(Buffer.from('x'), 'skript.exe'), /ikke tillatt/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('lagreBilde: avviser for stor fil', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'bilder-test-'));
  try {
    const { lagreBilde } = lagOpprettBilder(tmp);
    const forStor = Buffer.alloc(6 * 1024 * 1024);
    await assert.rejects(() => lagreBilde(forStor, 'stor.png'), /for stort/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('lagreBilde: avviser tom buffer', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'bilder-test-'));
  try {
    const { lagreBilde } = lagOpprettBilder(tmp);
    await assert.rejects(() => lagreBilde(Buffer.alloc(0), 'tom.png'), /Ingen fil/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
