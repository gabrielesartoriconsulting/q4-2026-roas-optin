/* ==========================================================================
   Q4 2026 ROAS — OPT-IN
   main.js — logica della pagina. Tutto ciò che è configurabile sta in
   js/config.js: qui non ci sono URL, nomi evento o date hardcoded.

   Moduli:
     Tracking  — cattura e conserva s / l / t / id + utm_*
     Phone     — selettore prefisso internazionale senza dipendenze
     Forms     — un solo handler condiviso per tutti i form (hero, popup, ...)
     Modal     — apertura/chiusura del popup d'iscrizione
     Countdown — opzionale, si attiva solo se presente in pagina
   ========================================================================== */

(function (window, document) {
  'use strict';

  var CFG = window.CONFIG;
  if (!CFG) {
    return;
  }

  /* ======================================================================
     Utility
     ====================================================================== */

  var storage = (function () {
    // sessionStorage può lanciare in private mode / cookie bloccati.
    function safe(fn, fallback) {
      try {
        return fn();
      } catch (e) {
        return fallback;
      }
    }
    return {
      get: function (key) {
        return safe(function () {
          return window.sessionStorage.getItem(key);
        }, null);
      },
      set: function (key, value) {
        return safe(function () {
          window.sessionStorage.setItem(key, value);
          return true;
        }, false);
      },
      remove: function (key) {
        return safe(function () {
          window.sessionStorage.removeItem(key);
          return true;
        }, false);
      }
    };
  })();

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* ======================================================================
     Tracking — s / l / t / id + utm_*
     I parametri vengono letti all'apertura della pagina e conservati in
     sessionStorage, così sopravvivono a navigazioni interne e ricariche
     per tutta la permanenza sulla pagina.
     ====================================================================== */

  var Tracking = (function () {
    var data = {};

    function readFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var found = {};
      CFG.TRACKING_PARAMS.forEach(function (key) {
        var value = params.get(key);
        if (value !== null && value !== '') {
          found[key] = value;
        }
      });
      return found;
    }

    function readFromStorage() {
      var raw = storage.get(CFG.TRACKING_STORAGE_KEY);
      if (!raw) return {};
      try {
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    function init() {
      var stored = readFromStorage();
      var fresh = readFromUrl();

      // I parametri presenti nell'URL corrente vincono su quelli memorizzati.
      CFG.TRACKING_PARAMS.forEach(function (key) {
        var value = fresh[key] !== undefined ? fresh[key] : stored[key];
        data[key] = value !== undefined ? value : null;
      });

      var toStore = {};
      CFG.TRACKING_PARAMS.forEach(function (key) {
        if (data[key] !== null) toStore[key] = data[key];
      });
      storage.set(CFG.TRACKING_STORAGE_KEY, JSON.stringify(toStore));
    }

    return {
      init: init,
      get: function (key) {
        return data[key] !== undefined ? data[key] : null;
      },
      all: function () {
        var copy = {};
        CFG.TRACKING_PARAMS.forEach(function (key) {
          copy[key] = data[key] !== undefined ? data[key] : null;
        });
        return copy;
      }
    };
  })();

  /* ======================================================================
     Phone — selettore prefisso internazionale, zero dipendenze.
     Produce: phone_prefix ("+39"), phone_number ("3331234567"),
              phone ("+393331234567").
     ====================================================================== */

  var Phone = (function () {
    var PRIORITY = ['IT', 'CH', 'GB', 'DE', 'FR', 'ES', 'US'];

    function flagEmoji(cc) {
      // ISO alpha-2 -> coppia di regional indicator symbols.
      return String.fromCodePoint(
        0x1f1e6 + cc.charCodeAt(0) - 65,
        0x1f1e6 + cc.charCodeAt(1) - 65
      );
    }

    function buildSelect(select) {
      var list = window.COUNTRY_CODES || [];
      if (!list.length) return;

      var byCode = {};
      list.forEach(function (row) {
        byCode[row[0]] = row;
      });

      var fragment = document.createDocumentFragment();

      function addOption(row) {
        var option = document.createElement('option');
        option.value = row[0];
        option.dataset.dial = row[1];
        option.textContent = flagEmoji(row[0]) + ' ' + row[2] + ' +' + row[1];
        fragment.appendChild(option);
      }

      var top = document.createElement('optgroup');
      top.label = 'Più usati';
      PRIORITY.forEach(function (cc) {
        if (!byCode[cc]) return;
        var option = document.createElement('option');
        option.value = cc;
        option.dataset.dial = byCode[cc][1];
        option.textContent = flagEmoji(cc) + ' ' + byCode[cc][2] + ' +' + byCode[cc][1];
        top.appendChild(option);
      });
      fragment.appendChild(top);

      var all = document.createElement('optgroup');
      all.label = 'Tutti i paesi';
      list.forEach(function (row) {
        var option = document.createElement('option');
        option.value = row[0];
        option.dataset.dial = row[1];
        option.textContent = flagEmoji(row[0]) + ' ' + row[2] + ' +' + row[1];
        all.appendChild(option);
      });
      fragment.appendChild(all);

      select.appendChild(fragment);
      select.value = CFG.FORM.DEFAULT_COUNTRY;
      if (!select.value) select.value = 'IT';
      sync(select);
    }

    function sync(select) {
      var field = select.closest('.form-field');
      var label = field ? $('[data-phone-dial]', field) : null;
      if (label) label.textContent = '+' + dialOf(select);
    }

    function dialOf(select) {
      var option = select.options[select.selectedIndex];
      return option && option.dataset.dial ? option.dataset.dial : '';
    }

    function init(form) {
      var select = $('[data-phone-country]', form);
      if (!select) return;
      buildSelect(select);
      select.addEventListener('change', function () {
        sync(select);
      });
    }

    /**
     * @returns {{prefix:string, number:string, full:string, valid:boolean}}
     */
    function read(form) {
      var select = $('[data-phone-country]', form);
      var input = $('[name="phone_number"]', form);
      var dial = select ? dialOf(select) : '';
      var raw = input ? input.value : '';

      // Tiene solo le cifre; se l'utente incolla il numero col prefisso
      // internazionale già davanti, lo rimuove per non duplicarlo.
      var digits = raw.replace(/\D/g, '');
      if (dial && digits.indexOf(dial) === 0 && digits.length > dial.length + 5) {
        digits = digits.slice(dial.length);
      }
      digits = digits.replace(/^0+/, '');

      var prefix = dial ? '+' + dial : '';
      return {
        prefix: prefix,
        number: digits,
        full: prefix + digits,
        valid: Boolean(dial) && digits.length >= 6 && digits.length <= 15
      };
    }

    return { init: init, read: read };
  })();

  /* ======================================================================
     Forms — un solo handler per tutti i form della pagina.
     Ogni form dichiara la propria posizione con data-form-location
     (es. "hero", "popup"): finisce nel payload come form_location.
     ====================================================================== */

  var Forms = (function () {
    var submitting = false; // blocca il doppio click anche fra form diversi

    function fieldOf(input) {
      return input ? input.closest('.form-field') : null;
    }

    function showError(form, input, message) {
      var field = fieldOf(input);
      if (field) field.classList.add('is-invalid');
      var box = $('[data-form-error]', form);
      if (box) {
        box.textContent = message;
        box.hidden = false;
      }
      if (input && typeof input.focus === 'function') input.focus();
    }

    function clearErrors(form) {
      $$('.form-field.is-invalid', form).forEach(function (field) {
        field.classList.remove('is-invalid');
      });
      var box = $('[data-form-error]', form);
      if (box) {
        box.textContent = '';
        box.hidden = true;
      }
    }

    function setLoading(form, isLoading) {
      var button = $('[type="submit"]', form);
      if (!button) return;
      if (isLoading) {
        if (!button.dataset.originalHtml) {
          button.dataset.originalHtml = button.innerHTML;
        }
        button.innerHTML = '<span class="form-submit__spinner" aria-hidden="true"></span>' +
          CFG.FORM.MESSAGES.loading;
      } else if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
      }
      button.disabled = isLoading;
      form.classList.toggle('is-loading', isLoading);
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function saveDraft(values) {
      if (!CFG.FORM.KEEP_DRAFT) return;
      storage.set(CFG.DRAFT_STORAGE_KEY, JSON.stringify(values));
    }

    function restoreDraft(form) {
      if (!CFG.FORM.KEEP_DRAFT) return;
      var raw = storage.get(CFG.DRAFT_STORAGE_KEY);
      if (!raw) return;
      var draft;
      try {
        draft = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!draft) return;
      ['name', 'email', 'phone_number'].forEach(function (key) {
        var input = $('[name="' + key + '"]', form);
        if (input && !input.value && draft[key]) input.value = draft[key];
      });
      var select = $('[data-phone-country]', form);
      if (select && draft.country) {
        select.value = draft.country;
        select.dispatchEvent(new Event('change'));
      }
    }

    function buildPayload(form, values, phone) {
      var tracking = Tracking.all();
      return {
        // --- Campi obbligatori attesi dal workflow n8n ---
        nome: values.name,
        email: values.email,
        telefono: phone.full,
        evento: CFG.EVENT_NAME,
        url: window.location.href,
        s: tracking.s,
        l: tracking.l,
        t: tracking.t,
        id: tracking.id,

        // --- Campi aggiuntivi (stessi dati, forma estesa) ---
        name: values.name,
        phone: phone.full,
        phone_prefix: phone.prefix,
        phone_number: phone.number,
        form_location: form.dataset.formLocation || 'hero',
        event: CFG.EVENT_NAME,
        page: CFG.PAGE_NAME,
        source: tracking.utm_source || tracking.s || CFG.FORM.DEFAULT_SOURCE,
        tracking: {
          s: tracking.s,
          l: tracking.l,
          t: tracking.t,
          id: tracking.id,
          utm_source: tracking.utm_source,
          utm_medium: tracking.utm_medium,
          utm_campaign: tracking.utm_campaign,
          utm_term: tracking.utm_term,
          utm_content: tracking.utm_content
        },
        submitted_at: new Date().toISOString()
      };
    }

    function onSubmit(event) {
      event.preventDefault();
      var form = event.currentTarget;

      if (submitting) return;
      clearErrors(form);

      var nameInput = $('[name="name"]', form);
      var emailInput = $('[name="email"]', form);
      var phoneInput = $('[name="phone_number"]', form);
      var countrySelect = $('[data-phone-country]', form);

      var values = {
        name: (nameInput ? nameInput.value : '').trim().replace(/\s+/g, ' '),
        email: (emailInput ? emailInput.value : '').trim().toLowerCase(),
        phone_number: phoneInput ? phoneInput.value : '',
        country: countrySelect ? countrySelect.value : ''
      };
      saveDraft(values);

      if (values.name.length < 2) {
        return showError(form, nameInput, CFG.FORM.MESSAGES.name);
      }
      if (!isValidEmail(values.email)) {
        return showError(form, emailInput, CFG.FORM.MESSAGES.email);
      }

      var phone = Phone.read(form);
      if (!phone.valid) {
        return showError(form, phoneInput, CFG.FORM.MESSAGES.phone);
      }

      var payload = buildPayload(form, values, phone);

      submitting = true;
      setLoading(form, true);

      fetch(CFG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Webhook HTTP ' + response.status);
          }
          // Redirect solo dopo risposta positiva del webhook.
          storage.remove(CFG.DRAFT_STORAGE_KEY);
          window.location.href = CFG.THANK_YOU_URL;
        })
        .catch(function (error) {
          // I dati restano nei campi: nessun reset, nessuna perdita.
          submitting = false;
          setLoading(form, false);
          var isNetwork = error instanceof TypeError;
          showError(
            form,
            null,
            isNetwork ? CFG.FORM.MESSAGES.network : CFG.FORM.MESSAGES.server
          );
          if (window.console && window.console.warn) {
            window.console.warn('[optin] invio non riuscito:', error.message);
          }
        });
    }

    function init() {
      $$('form[data-form]').forEach(function (form) {
        Phone.init(form);
        restoreDraft(form);
        form.setAttribute('novalidate', 'novalidate');
        form.addEventListener('submit', onSubmit);
        $$('input, select', form).forEach(function (input) {
          input.addEventListener('input', function () {
            var field = fieldOf(input);
            if (field) field.classList.remove('is-invalid');
          });
        });
      });
    }

    return { init: init };
  })();

  /* ======================================================================
     Modal — le CTA sparse nella pagina aprono lo stesso popup d'iscrizione.
     Nessuna logica di invio duplicata: il form nel popup usa lo stesso
     handler, cambia solo data-form-location.
     ====================================================================== */

  var Modal = (function () {
    var modal = null;
    var lastFocused = null;

    function open() {
      if (!modal) return;
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('has-modal-open');
      var firstInput = $('input, select', modal);
      if (firstInput) firstInput.focus();
    }

    function close() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('has-modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function init() {
      modal = $('[data-modal]');
      if (!modal) return;

      $$('[data-open-modal]').forEach(function (trigger) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          open();
        });
      });

      $$('[data-close-modal]', modal).forEach(function (trigger) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          close();
        });
      });

      modal.addEventListener('click', function (event) {
        if (event.target === modal) close();
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') close();
      });
    }

    return { init: init };
  })();

  /* ======================================================================
     Countdown — opzionale: nessun errore se il markup non esiste.
     ====================================================================== */

  var Countdown = (function () {
    function init() {
      var root = $('[data-countdown]');
      if (!root || !CFG.COUNTDOWN.ENABLED) return;

      var target = new Date(CFG.COUNTDOWN.TARGET_ISO).getTime();
      if (isNaN(target)) return;

      var slots = {
        days: $('[data-countdown-days]', root),
        hours: $('[data-countdown-hours]', root),
        minutes: $('[data-countdown-minutes]', root),
        seconds: $('[data-countdown-seconds]', root)
      };

      function pad(value) {
        return String(Math.max(0, value)).padStart(2, '0');
      }

      function tick() {
        var diff = target - Date.now();
        if (diff < 0) diff = 0;
        var seconds = Math.floor(diff / 1000);
        if (slots.days) slots.days.textContent = pad(Math.floor(seconds / 86400));
        if (slots.hours) slots.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
        if (slots.minutes) slots.minutes.textContent = pad(Math.floor((seconds % 3600) / 60));
        if (slots.seconds) slots.seconds.textContent = pad(seconds % 60);
      }

      tick();
      window.setInterval(tick, 1000);
    }

    return { init: init };
  })();

  /* ======================================================================
     Bootstrap
     ====================================================================== */

  function boot() {
    Tracking.init();
    Forms.init();
    Modal.init();
    Countdown.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
