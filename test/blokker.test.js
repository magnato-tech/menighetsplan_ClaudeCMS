// Tester for blokkrendering

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { renderBlokker } from '../lib/visning/blokker.js';

describe('Blokker', () => {
  test('renderBlokker escaper <script>', () => {
    const blokker = [{ type: 'tekst', tekst: '<script>alert("XSS")</script>' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  test('renderBlokker konverterer HTML-tegn', () => {
    const blokker = [{ type: 'tekst', tekst: 'A & B < C > D' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('A &amp; B &lt; C &gt; D'));
  });

  test('renderBlokker lager avsnitt fra linjer', () => {
    const blokker = [{ type: 'tekst', tekst: 'Linje 1\nLinje 2' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<p>Linje 1</p>'));
    assert.ok(html.includes('<p>Linje 2</p>'));
  });

  test('renderBlokker lager tom linje som skille mellom avsnitt', () => {
    const blokker = [{ type: 'tekst', tekst: 'Avsnitt 1\n\nAvsnitt 2' }];
    const html = renderBlokker(blokker);
    // Skal være to separate <p> på grunn av tom linje
    const count = (html.match(/<p>/g) || []).length;
    assert.equal(count, 2);
  });

  test('renderBlokker konverterer underoverskrifter', () => {
    const blokker = [{ type: 'tekst', tekst: '## Underoverskrift' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<h4>Underoverskrift</h4>'));
  });

  test('renderBlokker konverterer punktlister', () => {
    const blokker = [{ type: 'tekst', tekst: '- Punkt 1\n- Punkt 2' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<li>Punkt 1</li>'));
    assert.ok(html.includes('<li>Punkt 2</li>'));
  });

  test('renderBlokker konverterer URLs til lenker', () => {
    const blokker = [{ type: 'tekst', tekst: 'Besøk https://example.com' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<a href="https://example.com" target="_blank">'));
  });

  test('renderBlokker konverterer e-post til lenker', () => {
    const blokker = [{ type: 'tekst', tekst: 'Kontakt oss: test@example.com' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<a href="mailto:test@example.com">'));
  });

  test('renderBlokker ignorerer ukjent blokktype', () => {
    const blokker = [{ type: 'ukjent', data: 'test' }];
    const html = renderBlokker(blokker);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker håndterer tom liste', () => {
    const blokker = [];
    const html = renderBlokker(blokker);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker håndterer null som liste', () => {
    const html = renderBlokker(null);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker escaper i underoverskrift', () => {
    const blokker = [{ type: 'tekst', tekst: '## <b>Test</b>' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('<b>'));
    assert.ok(html.includes('&lt;b&gt;'));
  });

  test('renderBlokker escaper i liste', () => {
    const blokker = [{ type: 'tekst', tekst: '- <script>alert("XSS")</script>' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  test('renderBlokker kombinerer underoverskrift med liste', () => {
    const blokker = [{ type: 'tekst', tekst: '## Lister\n- Punkt 1\n- Punkt 2' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<h4>Lister</h4>'));
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<li>Punkt 1</li>'));
  });
});
