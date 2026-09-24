/* ==========================================================================
   Q4 2026 ROAS — SHOW-UP
   main.js — logica della pagina. Tutti i dati arrivano da js/config.js.

   - date / serate: topbar, hero, mini calendario, card serate con stato
   - showcase hero: cover della serata corrente + le altre 2 dietro
   - link Google Calendar (3 date + singole serate)
   - bottoni WhatsApp (disattivati finché il link è vuoto)
   - FAQ: una risposta aperta alla volta
   - tracking opzionale (Meta Pixel / Clarity) solo se configurato

   Test degli stati: aggiungi ?test_now=2026-10-13T21:00:00+02:00 all'URL.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var CFG = window.CONFIG;
  if (!CFG) return;

  var EVENT = CFG.EVENT;
  var TZ = EVENT.TIMEZONE;
  var LIVE_MS = EVENT.DURATA_MINUTI * 60 * 1000;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  var STATUS_LABEL = {
    live: 'In diretta ora',
    oggi: 'Oggi',
    prossima: 'Prossima serata',
    programma: 'In programma',
    conclusa: 'Conclusa'
  };

  /* ------------------------------------------------------------------------
     Date / fuso orario
     ------------------------------------------------------------------------ */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function zonedParts(ts) {
    var out = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(ts)).forEach(function (p) { out[p.type] = +p.value; });
    return out;
  }

  // Offset del fuso (ms) in un dato istante: +2h in ora legale, +1h in solare.
  function tzOffset(ts) {
    var p = zonedParts(ts);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts;
  }

  // Ora locale del fuso configurato -> timestamp UTC.
  function zonedToUtc(y, m, d, h, min) {
    var guess = Date.UTC(y, m - 1, d, h, min);
    var ts = guess - tzOffset(guess);
    var fix = tzOffset(ts);
    return fix === tzOffset(guess) ? ts : guess - fix;
  }

  function dayKey(ts) {
    var p = zonedParts(ts);
    return p.year + '-' + pad(p.month) + '-' + pad(p.day);
  }

  function getNow() {
    var test = new URLSearchParams(window.location.search).get('test_now');
    var t = test ? Date.parse(test) : NaN;
    return isNaN(t) ? Date.now() : t;
  }

  var SERATE = EVENT.SERATE.map(function (s, i) {
    var hm = s.ora.split(':');
    var start = zonedToUtc(s.y, s.m, s.d, +hm[0], +hm[1]);
    return {
      n: i + 1,
      data: s,
      start: start,
      end: start + LIVE_MS,
      key: s.y + '-' + pad(s.m) + '-' + pad(s.d),
      mese: MESI[s.m - 1],
      label: s.giorno + ' ' + s.d + ' ' + MESI[s.m - 1] + ' ' + s.y,
      alt: 'Serata ' + (i + 1) + ' – ' + s.titolo + ' – ' + s.focus
    };
  }).sort(function (a, b) { return a.start - b.start; });

  // "12 · 13 · 14 ottobre" oppure "30 ottobre · 2 novembre" se i mesi cambiano.
  function datesList(sep) {
    var sameMonth = SERATE.every(function (s) { return s.data.m === SERATE[0].data.m; });
    if (sameMonth) {
      return SERATE.map(function (s) { return s.data.d; }).join(sep) + ' ' + SERATE[0].mese;
    }
    return SERATE.map(function (s) { return s.data.d + ' ' + s.mese; }).join(sep);
  }

  function sameTime() {
    return SERATE.every(function (s) { return s.data.ora === SERATE[0].data.ora; });
  }

  /* ------------------------------------------------------------------------
     Stato delle serate
     ------------------------------------------------------------------------ */

  function computeState(now) {
    var today = dayKey(now);
    var currentIdx = SERATE.length - 1;
    for (var i = 0; i < SERATE.length; i++) {
      if (now < SERATE[i].end) { currentIdx = i; break; }
    }
    var statuses = SERATE.map(function (s, i) {
      if (now >= s.end) return 'conclusa';
      if (now >= s.start) return 'live';
      if (s.key === today) return 'oggi';
      if (i === currentIdx) return 'prossima';
      return 'programma';
    });
    return {
      currentIdx: currentIdx,
      statuses: statuses,
      allDone: now >= SERATE[SERATE.length - 1].end
    };
  }

  /* ------------------------------------------------------------------------
     Google Calendar
     ------------------------------------------------------------------------ */

  function gcalStamp(ts) {
    return new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function isConsecutive() {
    for (var i = 1; i < SERATE.length; i++) {
      if (SERATE[i].start - SERATE[i - 1].start !== DAY_MS) return false;
    }
    return true;
  }

  function calendarUrl(serata, recurCount) {
    var C = CFG.CALENDAR;
    var params = [
      'action=TEMPLATE',
      'text=' + encodeURIComponent(recurCount ? C.TITLE : C.TITLE + ' (Serata ' + serata.n + ')'),
      'dates=' + gcalStamp(serata.start) + '/' + gcalStamp(serata.end),
      'details=' + encodeURIComponent(recurCount ? C.DETAILS : serata.data.focus + '. ' + C.DETAILS),
      'location=' + encodeURIComponent(C.LOCATION),
      'ctz=' + encodeURIComponent(TZ)
    ];
    if (recurCount) params.push('recur=' + encodeURIComponent('RRULE:FREQ=DAILY;COUNT=' + recurCount));
    return 'https://calendar.google.com/calendar/render?' + params.join('&');
  }

  function setupCalendar() {
    var recur = CFG.CALENDAR.RECURRING && isConsecutive() ? SERATE.length : 0;
    var allUrl = calendarUrl(SERATE[0], recur);
    document.querySelectorAll('[data-calendar]').forEach(function (a) {
      var v = a.getAttribute('data-calendar');
      a.href = v === 'all' ? allUrl : calendarUrl(SERATE[+v - 1], 0);
    });
  }

  /* ------------------------------------------------------------------------
     WhatsApp
     ------------------------------------------------------------------------ */

  function setupWhatsApp() {
    var url = (CFG.WHATSAPP_COMMUNITY_URL || '').trim();
    var valid = /^https:\/\//i.test(url);
    document.querySelectorAll('[data-whatsapp]').forEach(function (a) {
      if (valid) {
        a.href = url;
        return;
      }
      a.removeAttribute('href');
      a.removeAttribute('target');
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('is-disabled');
      var sub = a.querySelector('[data-whatsapp-sub]');
      if (sub) sub.textContent = 'Link in arrivo';
    });
  }

  /* ------------------------------------------------------------------------
     Render statico (una volta)
     ------------------------------------------------------------------------ */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderStatic() {
    var ora = sameTime() ? SERATE[0].data.ora : null;

    var topbar = document.querySelector('[data-topbar-dates]');
    if (topbar) {
      topbar.textContent = datesList(' · ').toUpperCase() + (ora ? ' — ORE ' + ora : '');
    }

    var short = document.querySelector('[data-dates-short]');
    if (short) {
      var list = SERATE.map(function (s) { return s.data.giorno.toLowerCase() + ' ' + s.data.d; });
      short.textContent = list.slice(0, -1).join(', ') + ' e ' + list[list.length - 1] + ' ' + SERATE[SERATE.length - 1].mese;
    }

    var cal = document.querySelector('[data-cal-dates]');
    if (cal) {
      SERATE.forEach(function (s) {
        var card = el('div', 'cal-card');
        card.appendChild(el('span', 'cal-card__day', s.data.giorno.toUpperCase()));
        card.appendChild(el('span', 'cal-card__num', s.data.d));
        card.appendChild(el('span', 'cal-card__month', s.mese.toUpperCase()));
        card.appendChild(el('span', 'cal-card__time', 'ore ' + s.data.ora));
        cal.appendChild(card);
      });
    }

    var stack = document.querySelector('[data-nights]');
    if (stack) {
      SERATE.forEach(function (s) {
        var card = el('article', 'night-card');
        card.setAttribute('data-night', s.n);

        card.appendChild(el('div', 'night-num', s.n));

        var head = el('div', 'night-head');
        var meta = el('div', 'night-meta');
        meta.appendChild(el('span', 'night-date', s.label + ' · ' + s.data.ora));
        meta.appendChild(el('span', 'status'));
        head.appendChild(meta);
        head.appendChild(el('h3', 'night-title', s.data.titolo));
        head.appendChild(el('p', 'night-focus', s.data.focus));
        card.appendChild(head);

        var body = el('div', 'night-body');
        if (s.data.testo) body.appendChild(el('p', 'night-text', s.data.testo));
        var link = el('a', 'night-cal');
        link.setAttribute('data-calendar', s.n);
        link.setAttribute('aria-label', 'Aggiungi la serata ' + s.n + ' al calendario');
        link.target = '_blank';
        link.rel = 'noopener';
        link.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#ico-calendar"/></svg>';
        link.appendChild(document.createTextNode('Aggiungi al calendario'));
        body.appendChild(link);
        card.appendChild(body);

        var cover = el('div', 'night-cover');
        var frame = el('div', 'night-cover-frame');
        var img = el('img');
        img.src = s.data.img;
        img.alt = s.alt;
        img.width = 1672;
        img.height = 941;
        img.loading = 'lazy';
        img.decoding = 'async';
        frame.appendChild(img);
        frame.appendChild(el('span', 'shine'));
        var ring = el('div', 'night-cover-card');
        ring.appendChild(frame);
        cover.appendChild(ring);
        card.appendChild(cover);

        stack.appendChild(card);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Aggiornamento dinamico (ogni minuto)
     ------------------------------------------------------------------------ */

  function setSrc(img, src, alt) {
    if (!img || img.getAttribute('src') === src) return;
    img.setAttribute('src', src);
    if (alt != null) img.setAttribute('alt', alt);
  }

  function update() {
    var state = computeState(getNow());
    var current = SERATE[state.currentIdx];
    var currentStatus = state.statuses[state.currentIdx];

    // Hero
    var title = document.querySelector('[data-hero-title]');
    if (title) {
      var html;
      if (state.allDone) {
        html = 'Le 3 serate live <span class="mk">si sono concluse</span>';
      } else if (currentStatus === 'live') {
        html = 'La serata ' + current.n + ' è <span class="mk">in diretta ora</span>';
      } else if (currentStatus === 'oggi') {
        html = 'Ci vediamo <span class="mk">stasera</span> alle ' + current.data.ora;
      } else {
        html = 'Ci vediamo <span class="mk">' + current.data.giorno.toLowerCase() + ' ' +
          current.data.d + ' ' + current.mese + '</span> alle ' + current.data.ora;
      }
      title.innerHTML = html;
    }

    // Showcase: davanti la serata corrente, dietro le altre
    setSrc(document.querySelector('[data-showcase-img]'), current.data.img, current.alt);
    var others = SERATE.filter(function (s, i) { return i !== state.currentIdx; });
    others.forEach(function (s, i) {
      setSrc(document.querySelector('[data-deck-img="' + i + '"]'), s.data.img);
      var label = document.querySelector('[data-deck-label="' + i + '"]');
      if (label) label.textContent = 'Serata ' + s.n;
    });

    // CTA finale
    var finalCta = document.querySelector('[data-final-cta]');
    if (finalCta) {
      finalCta.textContent = state.allDone ? 'Grazie di aver partecipato'
        : currentStatus === 'oggi' || currentStatus === 'live' ? 'Ci vediamo stasera alle ' + current.data.ora
        : 'Ci vediamo il ' + current.data.d + ' alle ' + current.data.ora;
    }

    // Card serate + mini calendario
    var calCards = document.querySelectorAll('.cal-card');
    SERATE.forEach(function (s, i) {
      var st = state.statuses[i];
      var card = document.querySelector('[data-night="' + s.n + '"]');
      if (card) {
        card.className = 'night-card is-' + st + (i === state.currentIdx && !state.allDone ? ' is-current' : '');
        var badge = card.querySelector('.status');
        badge.className = 'status status--' + st;
        badge.textContent = STATUS_LABEL[st];
      }
      if (calCards[i]) {
        calCards[i].classList.toggle('is-current', i === state.currentIdx && !state.allDone);
        calCards[i].classList.toggle('is-done', st === 'conclusa');
      }
    });
  }

  /* ------------------------------------------------------------------------
     FAQ: una sola risposta aperta alla volta
     ------------------------------------------------------------------------ */

  function setupFaq() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Tracking opzionale
     ------------------------------------------------------------------------ */

  function setupTracking() {
    var T = CFG.TRACKING || {};

    if (T.META_PIXEL_ID) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', T.META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }

    if (T.CLARITY_ID) {
      window.clarity = window.clarity || function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
      var sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(T.CLARITY_ID);
      document.head.appendChild(sc);
    }
  }

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */

  renderStatic();
  setupCalendar();
  setupWhatsApp();
  setupFaq();
  setupTracking();
  update();
  setInterval(update, 60000);
})(window, document);
