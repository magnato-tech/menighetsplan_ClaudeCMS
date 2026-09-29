// Forside – viser neste gudstjeneste og kommende arrangementer

import { esc, fmtDate, fmtTime, layout } from './felles.js';
import { filtrerForekomster, hentDenneUken, hentKategorierForVising, anvendOverstyringer } from './relevans.js';

function getMonthYear(ms) {
  const TZ = 'Europe/Oslo';
  const date = new Date(ms);
  return new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, month: 'long', year: 'numeric' }).format(date);
}

function renderAktueltCard(o) {
  const cancelled = o.status === 'AVLYST';
  const bildeHtml = o.bilde ? `<img src="/bilder/${esc(o.bilde)}" alt="">` : '';

  return `<div class="aktuelt-kort">
    ${bildeHtml}
    <div class="aktuelt-innhold">
      <div class="aktuelt-dato">${esc(fmtDate(o.startUtc))}</div>
      <div class="aktuelt-tittel">${cancelled ? '<span style="text-decoration:line-through">' + esc(o.summary) + '</span>' : esc(o.summary)}</div>
      ${o.description ? `<div class="aktuelt-tekst">${esc(o.description).replace(/\n/g, '<br>')}</div>` : ''}
    </div>
  </div>`;
}

function renderEventRow(o) {
  const isServiceTag = o.erGudstjeneste;
  const cancelled = o.status === 'AVLYST';
  const otherCategories = hentKategorierForVising(o);
  const categoryTagsHtml = otherCategories.map(cat => `<span class="tag">${esc(cat)}</span>`).join('');

  return `<div class="event-row ${cancelled ? 'cancelled' : ''}">
    <div class="event-date">${esc(fmtDate(o.startUtc))}</div>
    <div class="event-time">${o.allDay ? 'Hele dagen' : esc(fmtTime(o.startUtc))}</div>
    <div class="event-content">
      <div class="event-title">${cancelled ? '<span style="text-decoration:line-through">' + esc(o.summary) + '</span>' : esc(o.summary)}${isServiceTag ? ' <span class="tag">Gudstjeneste</span>' : ''}${categoryTagsHtml}${cancelled ? ' <span class="tag" style="background:var(--rod);color:white">Avlyst</span>' : ''}</div>
      ${o.description ? `<div class="event-desc">${esc(o.description).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="event-location">${esc(o.location)}</div>
    </div>
  </div>`;
}

function renderHero() {
  const slides = [
    { image: '/hero-1.svg', title: 'Velkommen til fellesskap', subtitle: '' },
    { image: '/hero-2.svg', title: 'Gudstjeneste hver søndag', subtitle: '' },
    { image: '/hero-3.svg', title: 'Bli med i menigheten', subtitle: '' },
  ];

  const slidesHtml = slides.map((slide, i) => `<div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${slide.image}')">
    <div class="hero-content">
      <h2>${esc(slide.title)}</h2>
      ${slide.subtitle ? `<p>${esc(slide.subtitle)}</p>` : ''}
    </div>
  </div>`).join('');

  const dotsHtml = slides.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('');

  return `<div class="hero" id="hero-carousel">
    ${slidesHtml}
    <button class="hero-nav prev" aria-label="Forrige slide">‹</button>
    <button class="hero-nav next" aria-label="Neste slide">›</button>
    <div class="hero-dots">${dotsHtml}</div>
  </div>
  <script>
    (function() {
      const hero = document.getElementById('hero-carousel');
      if (!hero) return;

      const slides = hero.querySelectorAll('.hero-slide');
      const dots = hero.querySelectorAll('.hero-dot');
      const prevBtn = hero.querySelector('.hero-nav.prev');
      const nextBtn = hero.querySelector('.hero-nav.next');

      let currentIndex = 0;
      let autoPlayTimer = null;

      function showSlide(index) {
        slides.forEach((slide, i) => {
          slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
        currentIndex = index;
      }

      function nextSlide() {
        showSlide((currentIndex + 1) % slides.length);
      }

      function prevSlide() {
        showSlide((currentIndex - 1 + slides.length) % slides.length);
      }

      function startAutoPlay() {
        autoPlayTimer = setInterval(nextSlide, 5000);
      }

      function resetAutoPlay() {
        clearInterval(autoPlayTimer);
        startAutoPlay();
      }

      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
      });

      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
      });

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const index = parseInt(dot.getAttribute('data-index'), 10);
          showSlide(index);
          resetAutoPlay();
        });
      });

      startAutoPlay();
    })();
  </script>`;
}

function renderCtaRow() {
  const ctas = [
    { title: 'Ny her?', description: 'Finn ut mer om oss og hva vi tror på', href: '/om-oss' },
    { title: 'Bli med i en tjeneste', description: 'Se hvilke tjenestegrupper og fellesskap du kan bli med i', href: '/bli-med' },
    { title: 'Ta kontakt', description: 'Har du spørsmål? Vi vil gjerne høre fra deg', href: '/kontakt' },
  ];

  const cardsHtml = ctas.map(cta => `<a href="${esc(cta.href)}" class="cta-kort">
    <h3>${esc(cta.title)}</h3>
    <p>${esc(cta.description)}</p>
  </a>`).join('');

  return `<div class="cta-grid">${cardsHtml}</div>`;
}

export function renderForside(data, menySider = [], visning = 'alle', overstyringer = {}) {
  let occ = data.forekomster || [];
  const state = data.state || {};

  const adapter = data.adapter || { navn: 'Menighetsplan-API' };
  const TZ = 'Europe/Oslo';

  // Validér visning-parameter
  if (!['alle', 'gudstjenester'].includes(visning)) {
    visning = 'alle';
  }

  // Framheve-seksjonen og "Neste gudstjeneste" skal vises uavhengig av
  // visningsfilter (men ikke skjulte arrangementer)
  const { fremhevede, resten: allNotHidden } = anvendOverstyringer(occ, overstyringer);

  // Filtrer basert på visningsvalg for resten av siden
  occ = filtrerForekomster(occ, visning);

  // Anvend overstyringer for «Denne uken» og månedslisten
  const { resten } = anvendOverstyringer(occ, overstyringer);

  const banner = state.error
    ? `<div class="warn"><strong>Klarte ikke å hente fra ${esc(adapter.navn)}:</strong> ${esc(state.error)}.<br>${state.tekst ? `Viser sist vellykkede henting${state.fetchedAt ? ' (' + esc(state.fetchedAt.toLocaleString('nb-NO', { timeZone: TZ })) + ')' : ' fra lagret kopi'}.` : 'Ingen tidligere data å vise.'}</div>`
    : '';

  // Filter-bar
  const filterBar = `<div class="filter-bar">
    <a href="/?visning=alle" class="${visning === 'alle' ? 'active' : ''}">Alle arrangementer</a>
    <a href="/?visning=gudstjenester" class="${visning === 'gudstjenester' ? 'active' : ''}">Kun gudstjenester</a>
  </div>`;

  // Neste gudstjeneste (alltid fra hele listen, ikke filtrert, og ikke skjult)
  const nextService = allNotHidden.find(o => o.erGudstjeneste && o.status !== 'AVLYST');
  const nextServiceHtml = nextService
    ? `<div class="next-service">
        <h2 style="margin-top:0">Neste gudstjeneste</h2>
        <div class="service-card">
          <div class="service-date">${esc(fmtDate(nextService.startUtc))}</div>
          <div class="service-time">${nextService.allDay ? 'Hele dagen' : esc(fmtTime(nextService.startUtc))}</div>
          <div class="service-title" style="font-weight:600; margin-top:12px; font-size:1.1rem">${esc(nextService.summary)}</div>
          ${nextService.description ? `<div class="service-desc">${esc(nextService.description).replace(/\n/g, '<br>')}</div>` : ''}
          <div class="service-location" style="margin-top:8px; color:var(--dempet)">${esc(nextService.location)}</div>
        </div>
      </div>`
    : `<div class="next-service"><h2 style="margin-top:0">Neste gudstjeneste</h2><p>Ingen kommende gudstjenester.</p></div>`;

  // "Nyheter og aktuelt"-seksjon (hvis noen arrangementer er fremhevet)
  const fremhevetHtml = fremhevede.length > 0
    ? `<h2 style="margin-top:24px">Nyheter og aktuelt</h2><div class="aktuelt-grid">${fremhevede.map(renderAktueltCard).join('')}</div>`
    : '';

  // "Denne uken"-seksjon (fra resten, dvs. ikke skjulte)
  const now = Date.now();
  const denneUken = hentDenneUken(resten, now);
  const denneUkenHtml = denneUken.length > 0
    ? `<h2 style="margin-top:24px">Denne uken</h2>${denneUken.map(renderEventRow).join('')}`
    : `<h2 style="margin-top:24px">Denne uken</h2><p>Ingen arrangementer denne uken.</p>`;

  // Kommende arrangementer gruppert etter måned (fra resten, dvs. ikke skjulte)
  const monthGroups = {};
  resten.forEach(o => {
    const monthKey = getMonthYear(o.startUtc);
    if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
    monthGroups[monthKey].push(o);
  });

  const arrangementsHtml = Object.entries(monthGroups).map(([month, events]) => {
    const rows = events.map(renderEventRow).join('');
    return `<h3>${esc(month)}</h3>${rows}`;
  }).join('');

  const updateTime = state.fetchedAt ? new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(state.fetchedAt) : 'ukjent';

  const innhold = `
    ${renderHero()}
    ${renderCtaRow()}
    ${banner}
    ${filterBar}
    ${nextServiceHtml}
    ${fremhevetHtml}
    ${denneUkenHtml}
    <h2 style="margin-top:24px">Alle kommende arrangementer</h2>
    ${arrangementsHtml || '<p>Ingen arrangementer.</p>'}
    <div style="margin-top:40px; padding-top:16px; border-top:1px solid var(--linje); font-size:.85rem; color:var(--dempet); text-align:center">
      <div>Sist oppdatert ${esc(updateTime)}</div>
    </div>
  `;

  return layout({ tittel: 'Hjem', innhold, menySider, aktivSlug: null });
}
