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

  test('renderBlokker rendrer bilde med src og alt', () => {
    const blokker = [{ type: 'bilde', src: 'a1b2c3d4.jpg', alt: 'En vakker kirke' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<img'));
    assert.ok(html.includes('src="/bilder/a1b2c3d4.jpg"'));
    assert.ok(html.includes('alt="En vakker kirke"'));
    assert.ok(html.includes('max-width:100%'));
  });

  test('renderBlokker escaper spesialtegn i bilde-alt', () => {
    const blokker = [{ type: 'bilde', src: 'test.jpg', alt: 'Test med " og <' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('Test med " og <'));
    assert.ok(html.includes('alt="Test med &quot; og &lt;"'));
  });

  test('renderBlokker escaper src i bilde', () => {
    const blokker = [{ type: 'bilde', src: 'test<script>.jpg', alt: 'Test' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('src="/bilder/test&lt;script&gt;.jpg"'));
  });

  test('renderBlokker returnerer tom streng for bilde uten src', () => {
    const blokker = [{ type: 'bilde', src: '', alt: 'Mangler kilde' }];
    const html = renderBlokker(blokker);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker returnerer tom streng for bilde med null src', () => {
    const blokker = [{ type: 'bilde', src: null, alt: 'Mangler kilde' }];
    const html = renderBlokker(blokker);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker rendrer bilde uten alt-tekst', () => {
    const blokker = [{ type: 'bilde', src: 'test.jpg' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<img'));
    assert.ok(html.includes('src="/bilder/test.jpg"'));
    assert.ok(html.includes('alt=""'));
  });

  test('renderBlokker rendrer liste med tekst og bilde', () => {
    const blokker = [
      { type: 'tekst', tekst: 'En introduksjonstekst' },
      { type: 'bilde', src: 'bilde1.jpg', alt: 'Foto' }
    ];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<p>En introduksjonstekst</p>'));
    assert.ok(html.includes('<img'));
    assert.ok(html.includes('src="/bilder/bilde1.jpg"'));
  });

  test('renderBlokker rendrer Facebook-blokk som iframe med kodet lenke', () => {
    const blokker = [{ type: 'facebook', side: 'https://www.facebook.com/lillesandmisjonskirke' }];
    const html = renderBlokker(blokker);
    assert.ok(html.includes('<iframe'));
    assert.ok(html.includes('facebook.com/plugins/page.php'));
    assert.ok(html.includes(encodeURIComponent('https://www.facebook.com/lillesandmisjonskirke')));
  });

  test('renderBlokker returnerer tom streng for Facebook-blokk uten side', () => {
    const blokker = [{ type: 'facebook', side: '' }];
    const html = renderBlokker(blokker);
    assert.equal(html.trim(), '');
  });

  test('renderBlokker escaper ondsinnet innhold i Facebook-lenken', () => {
    const blokker = [{ type: 'facebook', side: 'https://www.facebook.com/x"><script>alert(1)</script>' }];
    const html = renderBlokker(blokker);
    assert.ok(!html.includes('<script>'));
  });
});
