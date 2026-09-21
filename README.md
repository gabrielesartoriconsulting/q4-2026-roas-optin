# Q4 2026 ROAS — Opt-In

Landing statica, senza build e senza dipendenze da ClickFunnels.
Basta aprire i file o caricarli su un qualsiasi hosting statico.

## Struttura

```
index.html        opt-in
grazie.html       thank-you
css/style.css     tutto lo stile
js/config.js      <-- unico file da toccare per webhook, evento, redirect
js/main.js        logica (tracking, form, modal, countdown)
js/countries.js   prefissi internazionali (dati statici)
assets/           immagini e favicon
```

## Cambiare il webhook n8n

`js/config.js`:

```js
var ACTIVE_ENV = 'TEST';          // <-- 'TEST' oppure 'PRODUCTION'

var WEBHOOK_ENDPOINTS = {
  TEST:       'https://n8n.srv1681240.hstgr.cloud/webhook-test/907a4800-3caa-417e-9802-e459b1477cb4',
  PRODUCTION: 'https://n8n.srv1681240.hstgr.cloud/webhook/907a4800-3caa-417e-9802-e459b1477cb4'
};
```

Attualmente è attivo **TEST**. Per andare live basta cambiare `ACTIVE_ENV` in `'PRODUCTION'`.

## Cambiare il redirect della thank-you

`js/config.js` → `THANK_YOU_URL` (ora `./grazie.html`).

## Cambiare il copy

Tutti i testi stanno in `index.html` / `grazie.html`, marcati con
`<!-- COPY PLACEHOLDER Q2 -->` (opt-in) e `PLACEHOLDER` (thank-you).
Sono ancora i testi del vecchio lancio Q2: date, numeri e promesse vanno riscritti.

`EVENT_NAME` e `PAGE_NAME` (che finiscono nel payload n8n) stanno in `js/config.js`.

## Form e payload

Due form, stessa logica, `form_location` diverso:

| Posizione | `form_location` |
|---|---|
| form nell'hero | `hero` |
| form nel popup aperto dalle CTA | `popup` |

Per aggiungere un'altra posizione basta un nuovo
`<form data-form data-form-location="...">` con gli stessi campi: nessun JS da scrivere.

Payload inviato in POST JSON. I primi 9 campi sono quelli **obbligatori** attesi dal
workflow n8n; i successivi sono aggiuntivi e possono essere ignorati lato n8n.

```json
{
  "nome": "Mario Rossi",
  "email": "mario@example.com",
  "telefono": "+393331234567",
  "evento": "Q4 2026 ROAS",
  "url": "https://.../index.html?s=...",
  "s": "...", "l": "...", "t": "...", "id": "...",

  "name": "Mario Rossi",
  "phone": "+393331234567", "phone_prefix": "+39", "phone_number": "3331234567",
  "form_location": "hero",
  "event": "Q4 2026 ROAS",
  "page": "Q4 2026 ROAS - Opt-In",
  "source": "...",
  "tracking": { "s": null, "l": null, "t": null, "id": null,
                "utm_source": null, "utm_medium": null,
                "utm_campaign": null, "utm_term": null, "utm_content": null },
  "submitted_at": "2026-09-17T12:00:00.000Z"
}
```

`nome`/`name`, `telefono`/`phone` ed `evento`/`event` contengono lo stesso valore:
la coppia in italiano è quella richiesta dal workflow, quella in inglese resta per
compatibilità con il resto della struttura. Se un parametro di tracking non è presente
nell'URL viene inviato come `null`.

Il redirect a `grazie.html` avviene **solo** dopo una risposta HTTP positiva del webhook.
In caso di errore i dati restano nel form (e in una bozza in `sessionStorage`).

## Tracking

`s`, `l`, `t`, `id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
vengono letti dalla query string all'apertura e conservati in `sessionStorage`
per tutta la permanenza sulla pagina.

## Countdown

Disattivato (`COUNTDOWN.ENABLED = false`). `TARGET_ISO` punta già alla Serata 1:
Lunedì 12 Ottobre 2026 ore 20:30 (Europe/Rome) → `2026-10-12T20:30:00+02:00`.
Per attivarlo: metti `ENABLED: true` e aggiungi in pagina

```html
<div class="countdown-section" data-countdown>
  <div class="countdown">
    <div class="countdown-block"><div class="number" data-countdown-days>00</div><div class="label">Giorni</div></div>
    <div class="countdown-block"><div class="number" data-countdown-hours>00</div><div class="label">Ore</div></div>
    <div class="countdown-block"><div class="number" data-countdown-minutes>00</div><div class="label">Minuti</div></div>
    <div class="countdown-block"><div class="number" data-countdown-seconds>00</div><div class="label">Secondi</div></div>
  </div>
</div>
```
