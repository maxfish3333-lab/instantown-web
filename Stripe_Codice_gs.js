/**
 * ════════════════════════════════════════════════════════════
 * INSTANTOWN — Integrazione Stripe Connect (Marketplace)
 * Progetto Apps Script dedicato: "Stripe"
 * ════════════════════════════════════════════════════════════
 *
 * SETUP INIZIALE (da fare una volta sola):
 * 1. Vai su Impostazioni progetto (icona ingranaggio a sinistra)
 * 2. Scorri fino a "Proprietà script"
 * 3. Aggiungi una proprietà:
 *      Chiave:  STRIPE_SECRET_KEY
 *      Valore:  sk_test_... (la tua chiave privata test, da Stripe Dashboard)
 * 4. Salva
 *
 * La secret key NON va mai scritta direttamente nel codice.
 * Va letta sempre tramite getStripeSecretKey() qui sotto.
 */

const SHEET_ID = '1m5ovESlhcbVwafN3EOpuYpWUGm1tbH6CtNPTBNZZrOI';
const TAB_ANAGRAFICA = 'anagrafica_negozi';

// ── Legge la secret key dalle Proprietà dello script (mai nel codice) ──
function getStripeSecretKey() {
  const key = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY non configurata. Vai su Impostazioni progetto > Proprietà script.');
  }
  return key;
}

// ── Funzione di test: verifica che la chiave funzioni chiamando Stripe ──
function testConnessioneStripe() {
  const secretKey = getStripeSecretKey();

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/balance', {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + secretKey
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code === 200) {
    Logger.log('✅ Connessione Stripe OK');
    Logger.log('Saldo disponibile: ' + JSON.stringify(body.available));
    return {success: true, balance: body};
  } else {
    Logger.log('❌ Errore connessione Stripe: ' + JSON.stringify(body));
    return {success: false, error: body};
  }
}

// ── Helper: apre il foglio anagrafica_negozi ──
function getSheetAnagrafica() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_ANAGRAFICA);
}

// ════════════════════════════════════════════════════════════
// ONBOARDING ESERCENTE — Crea Connected Account + Link Stripe-hosted
// ════════════════════════════════════════════════════════════

/**
 * Crea un nuovo Connected Account su Stripe per un esercente.
 * Da chiamare quando un esercente completa la registrazione su InstantTown.
 *
 * @param {string} email - email dell'esercente
 * @param {string} nomeAttivita - nome dell'insegna/attività
 * @return {string} l'ID dell'account creato (es. "acct_xxxxx")
 */
function creaAccountEsercente(email, nomeAttivita) {
  const secretKey = getStripeSecretKey();

  const payload = {
    'type': 'express',              // tipo di account più semplice da onboardare
    'country': 'IT',
    'email': email,
    'business_type': 'individual',  // semplificato; si può estendere a 'company' dopo
    'capabilities[card_payments][requested]': 'true',
    'capabilities[transfers][requested]': 'true',
    'business_profile[name]': nomeAttivita
  };

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/accounts', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + secretKey
    },
    payload: payload,
    muteHttpExceptions: true
  });

  const body = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    Logger.log('❌ Errore creazione account: ' + JSON.stringify(body));
    throw new Error('Errore Stripe: ' + (body.error ? body.error.message : 'sconosciuto'));
  }

  Logger.log('✅ Account creato: ' + body.id);
  return body.id; // es: "acct_1AbCdEfGhIjKl"
}

/**
 * Genera il link di onboarding Stripe-hosted per un account esistente.
 * L'esercente clicca questo link e Stripe lo guida nella verifica
 * di identità e dati bancari, poi torna sul nostro sito.
 *
 * @param {string} accountId - l'ID account da creaAccountEsercente()
 * @return {string} URL del link di onboarding (valido pochi minuti, da usare subito)
 */
function creaLinkOnboarding(accountId) {
  const secretKey = getStripeSecretKey();

  // URL a cui Stripe rimanda l'utente — andranno create queste pagine
  // sul sito (anche solo messaggi di conferma per ora)
  const refreshUrl = 'https://instantown-app.web.app/onboarding-refresh.html';
  const returnUrl = 'https://instantown-app.web.app/onboarding-completato.html';

  const payload = {
    'account': accountId,
    'refresh_url': refreshUrl,
    'return_url': returnUrl,
    'type': 'account_onboarding'
  };

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/account_links', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + secretKey
    },
    payload: payload,
    muteHttpExceptions: true
  });

  const body = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    Logger.log('❌ Errore creazione link: ' + JSON.stringify(body));
    throw new Error('Errore Stripe: ' + (body.error ? body.error.message : 'sconosciuto'));
  }

  Logger.log('✅ Link onboarding generato: ' + body.url);
  return body.url;
}

/**
 * FUNZIONE DI TEST — esegui questa per provare l'intero flusso
 * con dati fittizi, prima di collegarlo al form vero.
 */
function testOnboardingCompleto() {
  const email = 'test-esercente-' + new Date().getTime() + '@example.com';
  const nomeAttivita = 'Pizzeria Test InstantTown';

  Logger.log('--- Step 1: creazione account ---');
  const accountId = creaAccountEsercente(email, nomeAttivita);

  Logger.log('--- Step 2: generazione link onboarding ---');
  const link = creaLinkOnboarding(accountId);

  Logger.log('--- RISULTATO ---');
  Logger.log('Account ID: ' + accountId);
  Logger.log('Link da aprire nel browser per completare onboarding: ' + link);

  return {accountId: accountId, link: link};
}
