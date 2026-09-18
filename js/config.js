/* ==========================================================================
   Q4 2026 ROAS — OPT-IN
   config.js — unico punto di configurazione della pagina.
   Non serve toccare main.js per cambiare webhook, evento, video o redirect.
   ========================================================================== */

(function (window) {
  'use strict';

  /* ------------------------------------------------------------------------
     1) WEBHOOK n8n
     Per passare da TEST a PRODUCTION cambia SOLO la riga ACTIVE_ENV qui sotto.
     ------------------------------------------------------------------------ */

  var ACTIVE_ENV = 'TEST'; // <<< 'TEST' oppure 'PRODUCTION'

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
     3) Vidalytics — zona video isolata.
     Per sostituire il video Q4: cambia EMBED_ID / ACCOUNT_ID / SRC_BASE con
     quelli forniti da Vidalytics. Metti ENABLED:false per lasciare la sola
     cover statica (POSTER) senza caricare nulla da rete.
     ATTENZIONE: i valori qui sotto sono ancora quelli del vecchio video Q2,
     tenuti solo come segnaposto finché non arriva il video definitivo Q4.
     ------------------------------------------------------------------------ */

  var VIDALYTICS = {
    ENABLED: true,
    EMBED_ID: 'vidalytics_embed_l32oZ0q5alt4ptyZ',
    SRC_BASE: 'https://fast.vidalytics.com/embeds/mfTzAkpp/l32oZ0q5alt4ptyZ/',
    POSTER: './assets/vsl-cover.png',
    // Il player parte solo al primo click sulla cover: zero richieste di rete
    // al load. Metti false per caricare l'embed subito.
    CLICK_TO_LOAD: true
  };

  /* ------------------------------------------------------------------------
     4) Countdown (opzionale)
     Si attiva solo se in pagina esiste un elemento [data-countdown].
     Attualmente NON è presente in index.html: la data è un placeholder Q2 e
     va aggiornata insieme al nuovo copy Q4.
     ------------------------------------------------------------------------ */

  var COUNTDOWN = {
    ENABLED: false,
    TARGET_ISO: '2026-04-13T21:00:00+02:00' // PLACEHOLDER — data vecchio Q2
  };

  /* ------------------------------------------------------------------------
     5) Form / telefono
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
     6) Parametri di tracking raccolti all'apertura della pagina
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
    VIDALYTICS: VIDALYTICS,
    COUNTDOWN: COUNTDOWN,
    FORM: FORM,
    TRACKING_PARAMS: TRACKING_PARAMS,
    TRACKING_STORAGE_KEY: TRACKING_STORAGE_KEY,
    DRAFT_STORAGE_KEY: DRAFT_STORAGE_KEY
  };
})(window);
