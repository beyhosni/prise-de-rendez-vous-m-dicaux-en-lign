const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // Se reconnecter après 2 secondes
          return new Error('Le serveur Redis refuse la connexion');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // Arrêter de réessayer après 1 heure
          return new Error('Délai de reconnexion dépassé');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        // Se reconnecter après
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.client.on('error', (err) => {
      console.error('Erreur Redis:', err);
    });

    this.client.on('connect', () => {
      console.log('Connecté à Redis');
    });
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Erreur de connexion à Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Erreur lors de la déconnexion de Redis:', error);
    }
  }

  /**
   * Mettre en cache une valeur
   * @param {string} key - Clé de cache
   * @param {any} value - Valeur à mettre en cache
   * @param {number} ttl - Durée de vie en secondes (optionnel)
   */
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise en cache de ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupérer une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {any|null} Valeur en cache ou null si non trouvée
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprimer une clé du cache
   * @param {string} key - Clé à supprimer
   */
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      return false;
    }
  }

  /**
   * Vérifier si une clé existe dans le cache
   * @param {string} key - Clé à vérifier
   * @returns {boolean} True si la clé existe
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Erreur lors de la vérification de ${key}:`, error);
      return false;
    }
  }

  /**
   * Définir un TTL pour une clé existante
   * @param {string} key - Clé à modifier
   * @param {number} ttl - Durée de vie en secondes
   */
  async expire(key, ttl) {
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la définition du TTL pour ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrémenter une valeur numérique dans le cache
   * @param {string} key - Clé à incrémenter
   * @param {number} increment - Valeur d'incrément (défaut: 1)
   * @returns {number|null} Nouvelle valeur ou null en cas d'erreur
   */
  async incr(key, increment = 1) {
    try {
      const value = await this.client.incrBy(key, increment);
      return value;
    } catch (error) {
      console.error(`Erreur lors de l'incrémentation de ${key}:`, error);
      return null;
    }
  }

  /**
   * Invalider toutes les clés correspondant à un motif
   * @param {string} pattern - Motif de recherche (ex: "user:*")
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`Erreur lors de l'invalidation du motif ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalider le cache d'un médecin
   * @param {string} doctorId - ID du médecin
   */
  async invalidateDoctor(doctorId) {
    await this.invalidatePattern(`doctor:${doctorId}:*`);
    await this.invalidatePattern(`appointments:doctor:${doctorId}:*`);
    await this.invalidatePattern(`availabilities:doctor:${doctorId}:*`);
    await this.invalidatePattern(`reviews:doctor:${doctorId}:*`);
  }

  /**
   * Invalider le cache d'un patient
   * @param {string} patientId - ID du patient
   */
  async invalidatePatient(patientId) {
    await this.invalidatePattern(`patient:${patientId}:*`);
    await this.invalidatePattern(`appointments:patient:${patientId}:*`);
    await this.invalidatePattern(`documents:patient:${patientId}:*`);
    await this.invalidatePattern(`reviews:patient:${patientId}:*`);
  }

  /**
   * Invalider le cache des rendez-vous
   * @param {string} doctorId - ID du médecin (optionnel)
   * @param {string} patientId - ID du patient (optionnel)
   */
  async invalidateAppointments(doctorId = null, patientId = null) {
    if (doctorId) {
      await this.invalidatePattern(`appointments:doctor:${doctorId}:*`);
    }
    if (patientId) {
      await this.invalidatePattern(`appointments:patient:${patientId}:*`);
    }
    if (!doctorId && !patientId) {
      await this.invalidatePattern(`appointments:*`);
    }
  }

  /**
   * Invalider le cache des messages
   * @param {string} conversationId - ID de la conversation (optionnel)
   */
  async invalidateMessages(conversationId = null) {
    if (conversationId) {
      await this.invalidatePattern(`messages:conversation:${conversationId}:*`);
    } else {
      await this.invalidatePattern(`messages:*`);
    }
  }

  /**
   * Invalider le cache des notifications
   * @param {string} userId - ID de l'utilisateur (optionnel)
   */
  async invalidateNotifications(userId = null) {
    if (userId) {
      await this.invalidatePattern(`notifications:user:${userId}:*`);
    } else {
      await this.invalidatePattern(`notifications:*`);
    }
  }

  /**
   * Obtenir ou définir une valeur du cache (pattern cache-aside)
   * @param {string} key - Clé de cache
   * @param {Function} fetchFunction - Fonction pour récupérer la valeur si non présente en cache
   * @param {number} ttl - Durée de vie en secondes (optionnel)
   * @returns {any} Valeur en cache ou fraîchement récupérée
   */
  async getOrSet(key, fetchFunction, ttl = 3600) {
    let value = await this.get(key);

    if (value === null) {
      value = await fetchFunction();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
    }

    return value;
  }
}

// Singleton
const cacheService = new CacheService();

module.exports = cacheService;
