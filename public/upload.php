<?php
// ============================================================
// INSTANTOWN — upload.php
// Riceve un'immagine in base64 via POST e la salva sul server,
// ritornando l'URL pubblico dell'immagine appena caricata.
// ============================================================

header('Content-Type: application/json');

// ── CONFIGURAZIONE ──
// Cambia questo URL con il dominio reale del tuo spazio Aruba
// (la cartella "uploads/offerte" deve esistere e avere permessi di scrittura,
// di solito chmod 755 o 775 a seconda della configurazione del tuo hosting).
$BASE_URL       = 'https://www.instantown.it'; // <-- verifica/aggiorna se il dominio è diverso
$UPLOAD_DIR     = __DIR__ . '/uploads/offerte/';
$UPLOAD_URL_DIR = '/uploads/offerte/';
$MAX_BYTES      = 5 * 1024 * 1024; // 5 MB massimo per immagine, dopo la decodifica
$TIPI_AMMESSI   = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

function rispondi($stato, $dati = []) {
  echo json_encode(array_merge(['stato' => $stato], $dati));
  exit;
}

// ── SOLO POST ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  rispondi('errore', ['messaggio' => 'Metodo non consentito, usare POST']);
}

// ── LETTURA INPUT ──
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || empty($input['immagine'])) {
  rispondi('errore', ['messaggio' => 'Campo "immagine" mancante']);
}

$immagineData = $input['immagine'];

// ── PARSING DATA URL (es. "data:image/jpeg;base64,/9j/4AAQ...") ──
if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/', $immagineData, $match)) {
  rispondi('errore', ['messaggio' => 'Formato immagine non valido. Attesi: jpeg, png, webp']);
}

$estensione  = $match[1] === 'jpeg' ? 'jpg' : $match[1];
$base64Puro  = $match[2];
$binario     = base64_decode($base64Puro, true);

if ($binario === false) {
  rispondi('errore', ['messaggio' => 'Decodifica base64 fallita']);
}

if (strlen($binario) > $MAX_BYTES) {
  rispondi('errore', ['messaggio' => 'Immagine troppo grande (massimo 5MB)']);
}

// ── VERIFICA CHE SIA UN'IMMAGINE VERA (non solo l'estensione dichiarata) ──
$infoImg = @getimagesizefromstring($binario);
if ($infoImg === false) {
  rispondi('errore', ['messaggio' => 'Il file non è un\'immagine valida']);
}

// ── CREA CARTELLA SE NON ESISTE ──
if (!is_dir($UPLOAD_DIR)) {
  if (!@mkdir($UPLOAD_DIR, 0755, true)) {
    rispondi('errore', ['messaggio' => 'Impossibile creare la cartella di upload']);
  }
}

// ── NOME FILE UNIVOCO ──
$nomeFile = 'offerta_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $estensione;
$percorsoCompleto = $UPLOAD_DIR . $nomeFile;

if (file_put_contents($percorsoCompleto, $binario) === false) {
  rispondi('errore', ['messaggio' => 'Salvataggio file fallito']);
}

// ── URL PUBBLICO FINALE ──
$urlPubblico = $BASE_URL . $UPLOAD_URL_DIR . $nomeFile;

rispondi('ok', ['url' => $urlPubblico]);
