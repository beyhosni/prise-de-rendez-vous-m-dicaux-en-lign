const cacheService = require('./cache.service');
const jwt = require('jsonwebtoken');

class SessionService {
  constructor() {
    this.sessionPrefix = 'session:';
    this.userSessionPrefix = 'user_sessions:';
    this.defaultTTL = 24 * 60 * 60; // 24 heures en secondes
  }

  /**
   * Créer une nouvelle session utilisateur
   * @param {Object} user - Données utilisateur
   * @param {Object} options - Options de session
   * @returns {Promise<string>} Token JWT
   */
  async createSession(user, options = {}) {
    const {
      ttl = this.defaultTTL,
      rememberMe = false,
      additionalData = {}
    } = options;

    const sessionId = this.generateSessionId();
    const sessionData = {
      id: sessionId,
      userId: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      rememberMe,
      ...additionalData
    };

    // Mettre en cache la session
    await cacheService.set(`${this.sessionPrefix}${sessionId}`, sessionData, ttl);

    // Ajouter l'ID de session à la liste des sessions de l'utilisateur
    const userSessions = await this.getUserSessions(user.id) || [];
    userSessions.push(sessionId);
    await cacheService.set(`${this.userSessionPrefix}${user.id}`, userSessions, ttl);

    // Générer un token JWT
    const token = jwt.sign(
      { sessionId, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: ttl }
    );

    return token;
  }

  /**
   * Récupérer une session par son ID
   * @param {string} sessionId - ID de la session
   * @returns {Promise<Object|null>} Données de session ou null
   */
  async getSession(sessionId) {
    return await cacheService.get(`${this.sessionPrefix}${sessionId}`);
  }

  /**
   * Mettre à jour une session
   * @param {string} sessionId - ID de la session
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession = { ...session, ...updates, lastActivity: new Date().toISOString() };
    return await cacheService.set(`${this.sessionPrefix}${sessionId}`, updatedSession);
  }

  /**
   * Supprimer une session
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async deleteSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Supprimer la session
    await cacheService.del(`${this.sessionPrefix}${sessionId}`);

    // Retirer l'ID de session de la liste des sessions de l'utilisateur
    const userSessions = await this.getUserSessions(session.userId) || [];
    const updatedSessions = userSessions.filter(id => id !== sessionId);
    await cacheService.set(`${this.userSessionPrefix}${session.userId}`, updatedSessions);

    return true;
  }

  /**
   * Récupérer toutes les sessions d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des IDs de session
   */
  async getUserSessions(userId) {
    return await cacheService.get(`${this.userSessionPrefix}${userId}`) || [];
  }

  /**
   * Supprimer toutes les sessions d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de sessions supprimées
   */
  async deleteUserSessions(userId) {
    const sessionIds = await this.getUserSessions(userId);
    let deletedCount = 0;

    for (const sessionId of sessionIds) {
      if (await cacheService.del(`${this.sessionPrefix}${sessionId}`)) {
        deletedCount++;
      }
    }

    await cacheService.del(`${this.userSessionPrefix}${userId}`);
    return deletedCount;
  }

  /**
   * Vérifier si une session est valide
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} Validité de la session
   */
  async isSessionValid(sessionId) {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  /**
   * Rafraîchir une session (étendre sa durée de vie)
   * @param {string} sessionId - ID de la session
   * @param {number} ttl - Nouvelle durée de vie en secondes
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async refreshSession(sessionId, ttl = this.defaultTTL) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const refreshedSession = { 
      ...session, 
      lastActivity: new Date().toISOString() 
    };

    return await cacheService.set(`${this.sessionPrefix}${sessionId}`, refreshedSession, ttl);
  }

  /**
   * Nettoyer les sessions expirées
   * @returns {Promise<number>} Nombre de sessions nettoyées
   */
  async cleanupExpiredSessions() {
    // Cette méthode serait idéalement exécutée périodiquement par un job planifié
    // Pour l'instant, nous allons simplement compter les clés de session
    const sessionKeys = await cacheService.client.keys(`${this.sessionPrefix}*`);
    let cleanedCount = 0;

    for (const key of sessionKeys) {
      const session = await cacheService.get(key);
      if (session) {
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

        // Supprimer les sessions inactives depuis plus de 24h (ou 7 jours si rememberMe est true)
        const maxInactivity = session.rememberMe ? 7 * 24 : 24;

        if (hoursSinceActivity > maxInactivity) {
          await cacheService.del(key);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  /**
   * Générer un ID de session unique
   * @returns {string} ID de session
   */
  generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Vérifier un token JWT et récupérer la session associée
   * @param {string} token - Token JWT
   * @returns {Promise<Object|null>} Données de session ou null
   */
  async verifyTokenAndGetSession(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await this.getSession(decoded.sessionId);

      if (!session) {
        return null;
      }

      return { user: session, sessionId: decoded.sessionId };
    } catch (error) {
      return null;
    }
  }
}

// Singleton
const sessionService = new SessionService();

module.exports = sessionService;
