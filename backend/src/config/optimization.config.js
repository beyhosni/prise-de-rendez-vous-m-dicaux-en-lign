const cacheService = require('../services/cache.service');
const sessionService = require('../services/session.service');
const webSocketService = require('../services/websocket.service');
const notificationService = require('../services/notification.service');

/**
 * Configuration et initialisation des services d'optimisation
 */
class OptimizationConfig {
  /**
   * Initialiser tous les services d'optimisation
   * @param {Object} server - Serveur HTTP pour WebSocket
   */
  static async initialize(server) {
    try {
      // Connexion au service de cache
      await cacheService.connect();
      console.log('Service de cache initialisé');

      // Initialisation du service WebSocket
      webSocketService.initialize(server);
      console.log('Service WebSocket initialisé');

      // Configuration des tâches planifiées
      this.setupScheduledTasks();
      console.log('Tâches planifiées configurées');

      console.log('Tous les services d'optimisation ont été initialisés avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l'initialisation des services d'optimisation:', error);
      return false;
    }
  }

  /**
   * Configurer les tâches planifiées pour l'optimisation
   */
  static setupScheduledTasks() {
    // Nettoyer les sessions expirées toutes les heures
    setInterval(async () => {
      try {
        const cleanedCount = await sessionService.cleanupExpiredSessions();
        if (cleanedCount > 0) {
          console.log(`${cleanedCount} sessions expirées ont été nettoyées`);
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage des sessions expirées:', error);
      }
    }, 60 * 60 * 1000); // Toutes les heures

    // Envoyer des pings aux clients WebSocket toutes les 30 secondes
    setInterval(() => {
      try {
        webSocketService.pingAllClients();
      } catch (error) {
        console.error('Erreur lors de l'envoi des pings WebSocket:', error);
      }
    }, 30 * 1000); // Toutes les 30 secondes

    // Nettoyer les connexions WebSocket inactives toutes les 5 minutes
    setInterval(() => {
      try {
        webSocketService.cleanupInactiveConnections();
      } catch (error) {
        console.error('Erreur lors du nettoyage des connexions WebSocket inactives:', error);
      }
    }, 5 * 60 * 1000); // Toutes les 5 minutes

    // Afficher les statistiques de connexion toutes les 10 minutes
    setInterval(() => {
      try {
        const stats = webSocketService.getStats();
        console.log('Statistiques WebSocket:', stats);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques WebSocket:', error);
      }
    }, 10 * 60 * 1000); // Toutes les 10 minutes
  }

  /**
   * Configuration pour le redémarrage gracieux
   */
  static setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('Arrêt gracieux des services d'optimisation...');

      try {
        // Fermer toutes les connexions WebSocket
        webSocketService.wss.close(() => {
          console.log('Serveur WebSocket fermé');
        });

        // Se déconnecter de Redis
        await cacheService.disconnect();
        console.log('Déconnecté de Redis');

        console.log('Arrêt gracieux terminé');
        process.exit(0);
      } catch (error) {
        console.error('Erreur lors de l'arrêt gracieux:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

module.exports = OptimizationConfig;
