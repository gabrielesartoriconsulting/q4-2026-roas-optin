/* ==========================================================================
   Q4 2026 ROAS — SHOW-UP
   config.js — unico punto di configurazione della pagina.
   Date, serate, link WhatsApp, Google Calendar e tracking si cambiano QUI.
   main.js legge solo window.CONFIG: non serve toccarlo.
   ========================================================================== */

(function (window) {
  'use strict';

  /* ------------------------------------------------------------------------
     1) LINK COMMUNITY WHATSAPP
     Incolla qui il link di invito definitivo (https://chat.whatsapp.com/...).
     Finché è vuoto i bottoni WhatsApp restano visibili ma disattivati
     ("Link in arrivo") e non portano da nessuna parte.
     ------------------------------------------------------------------------ */

  var WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/FBwNG38H1w8KzcDO4n8ZG5';

  /* ------------------------------------------------------------------------
     2) SERATE
     Orari in ora italiana (Europe/Rome). La conversione in UTC per il
     calendario e per gli stati "oggi / live / conclusa" è automatica,
     ora legale compresa: non serve calcolare nulla a mano.
     m = mese 1-12. titolo / focus / testo compaiono nelle card delle serate.
     ------------------------------------------------------------------------ */

  var SERATE = [
    {
      y: 2026, m: 10, d: 12, giorno: 'Lunedì', ora: '20:30',
      titolo: 'Regalo 50 prodotti',
      focus: 'Da 10-15-20.000€ al mese',
      testo: 'Si parte dal tema delle serate: perché regaliamo 50 prodotti e cosa c’è dietro a un prodotto con un potenziale da 10-15-20.000€ al mese.',
      img: 'show-up-assets/images/serata-1.webp'
    },
    {
      y: 2026, m: 10, d: 13, giorno: 'Martedì', ora: '20:30',
      titolo: 'Regalo 50 prodotti',
      focus: 'Studenti Live',
      testo: 'In diretta con noi ci sono alcuni studenti: il loro percorso, raccontato da loro.',
      img: 'show-up-assets/images/serata-2.webp'
    },
    {
      y: 2026, m: 10, d: 14, giorno: 'Mercoledì', ora: '20:30',
      titolo: 'Regalo 50 prodotti',
      focus: 'Domande & Risposte',
      testo: 'Una serata dedicata alle tue domande: rispondiamo in diretta a dubbi e curiosità sui 50 prodotti.',
      img: 'show-up-assets/images/serata-3.webp'
    }
  ];

  var EVENT = {
    TIMEZONE: 'Europe/Rome',
    // Durata usata per l'evento a calendario e per capire quando una serata
    // è "conclusa". Da confermare con la durata reale delle dirette.
    DURATA_MINUTI: 90,
    SERATE: SERATE
  };

  /* ------------------------------------------------------------------------
     3) GOOGLE CALENDAR
     Il bottone "Aggiungi le 3 date" crea UN evento che si ripete per 3 giorni
     consecutivi (RRULE giornaliera) partendo dalla serata 1:
       dates=20261012T183000Z/20261012T200000Z  (20:30-22:00 ora italiana)
     Ogni card serata ha anche il suo link singolo.
     Se le serate non fossero più consecutive, metti RECURRING: false:
     il bottone principale aggiungerà solo la serata 1 e restano i link singoli.
     ------------------------------------------------------------------------ */

  var CALENDAR = {
    TITLE: 'Serata live ROAS - Regalo 50 prodotti',
    DETAILS: 'Serata live gratuita con Gabriele Sartori. ' +
      'Il link per entrare in diretta arriva via email e nella community WhatsApp prima di ogni serata.',
    LOCATION: 'Online',
    RECURRING: true
  };

  /* ------------------------------------------------------------------------
     4) TRACKING (opzionale)
     Vuoti = nessuno script di terze parti caricato.
     ------------------------------------------------------------------------ */

  var TRACKING = {
    META_PIXEL_ID: '',
    CLARITY_ID: ''
  };

  /* ------------------------------------------------------------------------
     Esporta — da qui in giù non serve modificare nulla.
     ------------------------------------------------------------------------ */

  window.CONFIG = {
    WHATSAPP_COMMUNITY_URL: WHATSAPP_COMMUNITY_URL,
    EVENT: EVENT,
    CALENDAR: CALENDAR,
    TRACKING: TRACKING
  };
})(window);
