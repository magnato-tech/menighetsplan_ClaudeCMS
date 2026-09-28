// Tester for grupper (tjenestegrupper og husfellesskap) og «Nyheter og aktuelt»

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as mp from '../lib/kilder/menighetsplan.js';
import { renderBliMed } from '../lib/visning/bli-med.js';
import { renderForside } from '../lib/visning/forside.js';

const eksempel = JSON.stringify({
  versjon: 1,
  grupper: [
    { id: 'group-lyd', navn: 'Lyd og bilde', kategori: 'tjenestegruppe', beskrivelse: 'Lydteknikere og bildefolk som sørger for god lyd og bilde.' },
    { id: 'group-barn', navn: 'Søndagsskole & barn', kategori: 'tjenestegruppe', beskrivelse: 'Medarbeidere til søndagsskolen.' },
    { id: 'group-hus-1', navn: 'Husfellesskap Sentrum', kategori: 'husgruppe', beskrivelse: 'Samles annenhver uke til fellesskap.' },
  ],
});

describe('Bli med', () => {
  test('renderBliMed – viser tjenestegrupper og husgrupper', () => {
    const data = mp.tolkGrupper(eksempel);
    const html = renderBliMed(data, []);
    assert.match(html, /Lyd og bilde/, 'skal inneholde en tjenestegruppe');
    assert.match(html, /Husfellesskap Sentrum/, 'skal inneholde husgruppe-seksjonen');
    assert.match(html, /bli-med/, 'skal ha aktiv link for bli-med');
  });

  test('renderBliMed – inneholder alle tjenestegrupper fra kilden', () => {
    const data = mp.tolkGrupper(eksempel);
    const html = renderBliMed(data, []);
    const tjenestegruppeCount = data.grupper.filter(g => g.kategori === 'tjenestegruppe').length;
    assert.equal(tjenestegruppeCount, 2);
    assert.match(html, /Søndagsskole/);
  });

  test('renderBliMed – viser kontaktlenke, ikke persondata', () => {
    const data = mp.tolkGrupper(eksempel);
    const html = renderBliMed(data, []);
    assert.match(html, /\/kontakt/, 'skal ha lenke til kontakt-siden');
    assert.doesNotMatch(html, /\d{3} \d{2} \d{3}/, 'skal ikke inneholde telefonnummer');
  });
});

function lagForekomst(uid, overrides = {}) {
  return {
    uid,
    summary: 'Test-arrangement',
    startUtc: Date.now() + 86400000,
    status: 'PLANLAGT',
    erGudstjeneste: false,
    allDay: false,
    location: 'Lillesand Misjonskirke',
    ...overrides,
  };
}

describe('Forside – Nyheter og aktuelt', () => {
  test('viser ikke seksjonen når ingenting er fremhevet', () => {
    const data = { forekomster: [lagForekomst('a1')], state: {} };
    const html = renderForside(data, [], 'alle', {});
    assert.doesNotMatch(html, /Nyheter og aktuelt/);
  });

  test('viser seksjonen med overskrift når noe er fremhevet', () => {
    const data = { forekomster: [lagForekomst('a1')], state: {} };
    const html = renderForside(data, [], 'alle', { a1: { fremhevet: true, skjult: false } });
    assert.match(html, /Nyheter og aktuelt/);
    assert.match(html, /aktuelt-kort/);
  });

  test('viser bilde fra /bilder/ når overstyringen har et bilde-filnavn', () => {
    const data = { forekomster: [lagForekomst('a1')], state: {} };
    const html = renderForside(data, [], 'alle', { a1: { fremhevet: true, skjult: false, bilde: 'abc12345.jpg' } });
    assert.match(html, /<img src="\/bilder\/abc12345\.jpg"/);
  });

  test('viser ikke <img> når det ikke er noe bilde', () => {
    const data = { forekomster: [lagForekomst('a1')], state: {} };
    const html = renderForside(data, [], 'alle', { a1: { fremhevet: true, skjult: false } });
    assert.doesNotMatch(html, /aktuelt-kort">\s*<img/);
  });
});
