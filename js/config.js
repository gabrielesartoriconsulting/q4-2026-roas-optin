/* ==========================================================================
   Q4 2026 ROAS — OPT-IN
   config.js — unico punto di configurazione della pagina.
   Non serve toccare main.js per cambiare webhook, evento o redirect.
   ========================================================================== */

(function (window) {
  'use strict';

  /* ------------------------------------------------------------------------
     1) WEBHOOK n8n
     Per passare da TEST a PRODUCTION cambia SOLO la riga ACTIVE_ENV qui sotto.
     ------------------------------------------------------------------------ */

  var ACTIVE_ENV = 'PRODUCTION'; // <<< 'TEST' oppure 'PRODUCTION'

  var WEBHOOK_ENDPOINTS = {
    TEST: 'https://n8n.srv1681240.hstgr.cloud/webhook-test/907a4800-3caa-417e-9802-e459b1477cb4',
    PRODUCTION: 'https://n8n.srv1681240.hstgr.cloud/webhook/907a4800-3caa-417e-9802-e459b1477cb4'
  };

  /* ------------------------------------------------------------------------
     2) Identità della pagina / evento (finiscono nel payload n8n)
     ------------------------------------------------------------------------ */

  var EVENT_NAME = 'Q4 2026 ROAS';
  var PAGE_NAME = 'Q4 2026 ROAS - Opt-In';
  var THANK_YOU_URL = './grazie.html';

  /* ------------------------------------------------------------------------
     3) Countdown (opzionale)
     Si attiva solo se in pagina esiste un elemento [data-countdown].
     Attualmente NON è presente in index.html.
     Data evento: Serata 1 — Lunedì 12 Ottobre 2026, ore 20:30 (Europe/Rome).
     +02:00 = ora legale italiana (CEST), in vigore fino al 25 ottobre 2026.
     ------------------------------------------------------------------------ */

  var COUNTDOWN = {
    ENABLED: false,
    TARGET_ISO: '2026-10-12T20:30:00+02:00' // Lunedì 12 Ottobre 2026, 20:30 Europe/Rome
  };

  /* ------------------------------------------------------------------------
     4) Form / telefono
     ------------------------------------------------------------------------ */

  var FORM = {
    DEFAULT_COUNTRY: 'IT',
    // Riempie il campo "source" del payload quando in URL non c'è nulla.
    DEFAULT_SOURCE: 'direct',
    // Salva una bozza dei campi in sessionStorage: se n8n risponde con errore
    // e l'utente ricarica, non perde quello che ha scritto.
    KEEP_DRAFT: true,
    MESSAGES: {
      name: 'Inserisci il tuo nome (almeno 2 caratteri).',
      email: 'Inserisci un indirizzo email valido.',
      phone: 'Inserisci un numero di cellulare valido.',
      network: 'Non riusciamo a registrare la tua iscrizione in questo momento. I tuoi dati sono ancora qui: riprova tra qualche secondo.',
      server: 'Qualcosa è andato storto durante l\'invio. I tuoi dati non sono andati persi: riprova.',
      loading: 'INVIO IN CORSO...'
    }
  };

  /* ------------------------------------------------------------------------
     5) Parametri di tracking raccolti all'apertura della pagina
     ------------------------------------------------------------------------ */

  var TRACKING_PARAMS = [
    's', 'l', 't', 'id',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
  ];

  // Chiave sessionStorage: cambiala se pubblichi più pagine sullo stesso dominio.
  var TRACKING_STORAGE_KEY = 'q4_2026_roas_optin_tracking';
  var DRAFT_STORAGE_KEY = 'q4_2026_roas_optin_draft';

  /* ------------------------------------------------------------------------
     Esporta — da qui in giù non serve modificare nulla.
     ------------------------------------------------------------------------ */

  window.CONFIG = {
    ACTIVE_ENV: ACTIVE_ENV,
    WEBHOOK_ENDPOINTS: WEBHOOK_ENDPOINTS,
    WEBHOOK_URL: WEBHOOK_ENDPOINTS[ACTIVE_ENV],
    EVENT_NAME: EVENT_NAME,
    PAGE_NAME: PAGE_NAME,
    THANK_YOU_URL: THANK_YOU_URL,
    COUNTDOWN: COUNTDOWN,
    FORM: FORM,
    TRACKING_PARAMS: TRACKING_PARAMS,
    TRACKING_STORAGE_KEY: TRACKING_STORAGE_KEY,
    DRAFT_STORAGE_KEY: DRAFT_STORAGE_KEY
  };
})(window);
