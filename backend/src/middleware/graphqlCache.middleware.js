const cacheService = require('../services/cache.service');

/**
 * Middleware pour la mise en cache des requêtes GraphQL
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
const graphqlCacheMiddleware = (options = {}) => {
  const {
    defaultTTL = 300, // Durée de vie par défaut en secondes
    enabledQueries = [], // Liste des requêtes à mettre en cache
    disabledQueries = [], // Liste des requêtes à ne pas mettre en cache
    keyGenerator = null, // Fonction personnalisée pour générer les clés de cache
  } = options;

  return async (req, res, next) => {
    // Vérifier si la requête est une requête GraphQL
    if (!req.body || !req.body.query) {
      return next();
    }

    const query = req.body.query;
    const variables = req.body.variables || {};
    const operationName = req.body.operationName;

    // Vérifier si cette requête doit être mise en cache
    if (disabledQueries.includes(operationName)) {
      return next();
    }

    // Si la liste des requêtes activées est définie, vérifier si cette requête y est
    if (enabledQueries.length > 0 && !enabledQueries.includes(operationName)) {
      return next();
    }

    // Générer une clé de cache
    let cacheKey;
    if (keyGenerator && typeof keyGenerator === 'function') {
      cacheKey = keyGenerator(req);
    } else {
      // Clé de cache par défaut basée sur la requête et les variables
      const queryHash = require('crypto')
        .createHash('md5')
        .update(JSON.stringify({ query, variables }))
        .digest('hex');
      cacheKey = `graphql:${operationName || 'anonymous'}:${queryHash}`;
    }

    // Vérifier si le résultat est en cache
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit pour ${operationName || 'anonymous'}`);
      return res.json(cachedResult);
    }

    // Intercepter la méthode json pour mettre en cache le résultat
    const originalJson = res.json;
    res.json = function (data) {
      // Mettre en cache le résultat s'il n'y a pas d'erreurs
      if (!data.errors || data.errors.length === 0) {
        const ttl = getTTLForQuery(operationName, defaultTTL);
        cacheService.set(cacheKey, data, ttl);
        console.log(`Mise en cache pour ${operationName || 'anonymous'} (TTL: ${ttl}s)`);
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Obtenir le TTL approprié pour une requête spécifique
 * @param {string} operationName - Nom de l'opération GraphQL
 * @param {number} defaultTTL - TTL par défaut
 * @returns {number} TTL en secondes
 */
function getTTLForQuery(operationName, defaultTTL) {
  // TTL spécifiques pour différentes requêtes
  const queryTTLs = {
    'GetDoctors': 600, // 10 minutes pour la liste des médecins
    'GetDoctor': 900, // 15 minutes pour les détails d'un médecin
    'GetAppointments': 120, // 2 minutes pour les rendez-vous
    'GetMedicalDocuments': 300, // 5 minutes pour les documents médicaux
    'GetReviews': 300, // 5 minutes pour les évaluations
  };

  return queryTTLs[operationName] || defaultTTL;
}

module.exports = graphqlCacheMiddleware;
