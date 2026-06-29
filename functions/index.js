const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({maxInstances: 10});

// Funzione di test per verificare che il deploy funzioni
exports.ping = onRequest((request, response) => {
  logger.info("Ping ricevuto", {structuredData: true});
  response.json({status: "ok", message: "pong", timestamp: new Date().toISOString()});
});
