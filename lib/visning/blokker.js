// Rendering av blokktyper

import { esc } from './felles.js';

// Regex for å detektere URLs og e-post
const URL_REGEX = /https?:\/\/[^\s<>"\)]+/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function konverterTekst(tekst) {
  // Escape all HTML first
  let html = esc(tekst);

  // Konverter URLs til lenker
  html = html.replace(URL_REGEX, (url) => {
    const origUrl = url;
    // Unescape for href
    const cleanUrl = origUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    return `<a href="${esc(cleanUrl)}" target="_blank">${esc(origUrl)}</a>`;
  });

  // Konverter e-post til lenker
  html = html.replace(EMAIL_REGEX, (email) => {
    return `<a href="mailto:${esc(email)}">${esc(email)}</a>`;
  });

  return html;
}

function renderTekst(blokk) {
  if (!blokk.tekst) return '';

  const linjer = blokk.tekst.split('\n');
  const output = [];
  let currentList = [];
  let inList = false;

  for (const linje of linjer) {
    const trimmet = linje.trim();

    // Tom linje = nytt avsnitt
    if (!trimmet) {
      if (inList && currentList.length) {
        output.push(`<ul>${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      continue;
    }

    // Underoverskrift (## )
    if (trimmet.startsWith('## ')) {
      if (inList && currentList.length) {
        output.push(`<ul>${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      const heading = konverterTekst(trimmet.slice(3).trim());
      output.push(`<h4>${heading}</h4>`);
      continue;
    }

    // Punktliste (- )
    if (trimmet.startsWith('- ')) {
      inList = true;
      const item = konverterTekst(trimmet.slice(2).trim());
      currentList.push(item);
      continue;
    }

    // Vanlig avsnitt
    if (inList && currentList.length) {
      output.push(`<ul>${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`);
      currentList = [];
      inList = false;
    }

    const paragraph = konverterTekst(trimmet);
    output.push(`<p>${paragraph}</p>`);
  }

  // Avslutting av liste hvis nødvendig
  if (inList && currentList.length) {
    output.push(`<ul>${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`);
  }

  return `<div class="blokk-tekst">${output.join('')}</div>`;
}

function renderBilde(blokk) {
  if (!blokk.src) return '';

  const src = esc(blokk.src);
  const alt = esc(blokk.alt || '');
  return `<div class="blokk-bilde"><img src="/bilder/${src}" alt="${alt}" style="max-width:100%; height:auto; border-radius:8px; display:block; margin-bottom:16px;"></div>`;
}

const blokker = {
  tekst: renderTekst,
  bilde: renderBilde,
};

export function renderBlokker(liste) {
  if (!Array.isArray(liste)) return '';

  return liste.map(blokk => {
    const renderer = blokker[blokk.type];
    if (!renderer) {
      // Ukjent blokktype – hopp over
      return '';
    }
    try {
      return renderer(blokk);
    } catch (err) {
      console.warn(`Feil ved rendering av blokktype ${blokk.type}:`, err.message);
      return '';
    }
  }).join('');
}
