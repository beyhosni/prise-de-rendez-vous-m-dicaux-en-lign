const sessionService = require('../services/session.service');
const cacheService = require('../services/cache.service');

/**
 * Middleware d'authentification pour les routes protégées
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
const authMiddleware = (options = {}) => {
  const {
    required = true, // Si l'authentification est requise
    roles = [], // Rôles autorisés (vide = tous les rôles)
    refreshToken = false // Si le token doit être rafraîchi
  } = options;

  return async (req, res, next) => {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Si aucun token n'est fourni
    if (!token) {
      if (required) {
        return res.status(401).json({
          error: 'Token d'authentification manquant',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      return next();
    }

    // Vérifier le token et récupérer la session
    const authData = await sessionService.verifyTokenAndGetSession(token);

    if (!authData) {
      return res.status(401).json({
        error: 'Token d'authentification invalide ou expiré',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Rafraîchir la session si demandé
    if (refreshToken) {
      await sessionService.refreshSession(authData.sessionId);
    }

    // Vérifier si l'utilisateur a le rôle requis
    if (roles.length > 0 && !roles.includes(authData.user.role)) {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: authData.user.role
      });
    }

    // Ajouter les données utilisateur à la requête
    req.user = authData.user;
    req.sessionId = authData.sessionId;
    req.token = token;

    // Ajouter des méthodes utilitaires à la requête
    req.hasRole = (role) => authData.user.role === role;
    req.hasAnyRole = (roleArray) => roleArray.includes(authData.user.role);
    req.hasAllRoles = (roleArray) => roleArray.every(role => authData.user.role === role);

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est le propriétaire de la ressource
 * @param {string} paramName - Nom du paramètre contenant l'ID de l'utilisateur
 * @param {string} userIdField - Champ dans l'objet utilisateur contenant l'ID
 * @returns {Function} Middleware Express
 */
const ownershipMiddleware = (paramName = 'id', userIdField = 'id') => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    // Les administrateurs peuvent accéder à toutes les ressources
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Récupérer l'ID de la ressource
    const resourceId = req.params[paramName];

    // Vérifier si l'utilisateur est le propriétaire
    if (req.user[userIdField] !== resourceId) {
      return res.status(403).json({
        error: 'Accès non autorisé à cette ressource',
        code: 'AUTH_RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Middleware pour limiter le nombre de requêtes par utilisateur
 * @param {number} maxRequests - Nombre maximum de requêtes
 * @param {number} windowMs - Fenêtre de temps en millisecondes
 * @returns {Function} Middleware Express
 */
const rateLimitMiddleware = (maxRequests = 100, windowMs = 60 * 1000) => {
  return async (req, res, next) => {
    // Clé de cache pour le rate limiting
    const key = req.user 
      ? `rate_limit:user:${req.user.id}` 
      : `rate_limit:ip:${req.ip}`;

    // Obtenir le compteur actuel
    const currentCount = await cacheService.get(key) || 0;

    // Vérifier si la limite est dépassée
    if (currentCount >= maxRequests) {
      return res.status(429).json({
        error: 'Trop de requêtes',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Incrémenter le compteur
    await cacheService.set(key, currentCount + 1, Math.ceil(windowMs / 1000));

    // Ajouter les en-têtes de rate limiting
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount - 1),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs)
    });

    next();
  };
};

/**
 * Middleware pour ajouter des en-têtes de sécurité
 * @returns {Function} Middleware Express
 */
const securityHeadersMiddleware = () => {
  return (req, res, next) => {
    // En-têtes de sécurité
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    next();
  };
};

module.exports = {
  authMiddleware,
  ownershipMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware
};
