const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const sessionService = require('./session.service');
const notificationService = require('./notification.service');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket
    this.rooms = new Map(); // roomName -> Set of userIds
  }

  /**
   * Initialiser le serveur WebSocket
   * @param {Object} server - Serveur HTTP
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('Serveur WebSocket initialisé');
  }

  /**
   * Gérer une nouvelle connexion WebSocket
   * @param {Object} ws - Connexion WebSocket
   * @param {Object} req - Requête HTTP
   */
  async handleConnection(ws, req) {
    try {
      // Extraire le token de la requête
      const token = this.extractToken(req);

      if (!token) {
        ws.close(1008, 'Token d'authentification manquant');
        return;
      }

      // Vérifier le token et récupérer la session
      const authData = await sessionService.verifyTokenAndGetSession(token);

      if (!authData) {
        ws.close(1008, 'Token d'authentification invalide');
        return;
      }

      const { user, sessionId } = authData;

      // Stocker la connexion
      this.clients.set(user.id, {
        ws,
        user,
        sessionId,
        lastActivity: new Date()
      });

      // Envoyer un message de confirmation
      this.sendToUser(user.id, {
        type: 'connection',
        data: {
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      });

      // Envoyer le nombre de notifications non lues
      const unreadCount = await notificationService.getUnreadCount(user.id);
      this.sendToUser(user.id, {
        type: 'unread_count',
        data: {
          count: unreadCount
        }
      });

      // Configurer les gestionnaires d'événements
      this.setupEventHandlers(ws, user.id);

      console.log(`Utilisateur ${user.id} connecté via WebSocket`);
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      ws.close(1011, 'Erreur interne du serveur');
    }
  }

  /**
   * Configurer les gestionnaires d'événements pour une connexion WebSocket
   * @param {Object} ws - Connexion WebSocket
   * @param {string} userId - ID de l'utilisateur
   */
  setupEventHandlers(ws, userId) {
    // Gestion des messages entrants
    ws.on('message', (message) => {
      this.handleMessage(userId, message);
    });

    // Gestion de la fermeture de connexion
    ws.on('close', (code, reason) => {
      this.handleDisconnection(userId, code, reason);
    });

    // Gestion des erreurs
    ws.on('error', (error) => {
      console.error(`Erreur WebSocket pour l'utilisateur ${userId}:`, error);
    });

    // Gestion des pings pour maintenir la connexion active
    ws.on('pong', () => {
      const client = this.clients.get(userId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  /**
   * Gérer un message reçu d'un client
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} message - Message reçu
   */
  async handleMessage(userId, message) {
    try {
      const parsedMessage = JSON.parse(message);
      const { type, data } = parsedMessage;

      switch (type) {
        case 'ping':
          // Répondre à un ping
          this.sendToUser(userId, {
            type: 'pong',
            data: {
              timestamp: new Date().toISOString()
            }
          });
          break;

        case 'join_room':
          // Rejoindre une salle
          if (data && data.roomName) {
            this.joinRoom(userId, data.roomName);
          }
          break;

        case 'leave_room':
          // Quitter une salle
          if (data && data.roomName) {
            this.leaveRoom(userId, data.roomName);
          }
          break;

        case 'mark_notification_read':
          // Marquer une notification comme lue
          if (data && data.notificationId) {
            await notificationService.markAsRead(data.notificationId, userId);

            // Envoyer le nouveau nombre de notifications non lues
            const unreadCount = await notificationService.getUnreadCount(userId);
            this.sendToUser(userId, {
              type: 'unread_count',
              data: {
                count: unreadCount
              }
            });
          }
          break;

        default:
          console.warn(`Type de message non reconnu: ${type}`);
      }
    } catch (error) {
      console.error(`Erreur lors du traitement du message de l'utilisateur ${userId}:`, error);
    }
  }

  /**
   * Gérer la déconnexion d'un client
   * @param {string} userId - ID de l'utilisateur
   * @param {number} code - Code de fermeture
   * @param {string} reason - Raison de la fermeture
   */
  handleDisconnection(userId, code, reason) {
    console.log(`Utilisateur ${userId} déconnecté: ${code} - ${reason}`);

    // Retirer l'utilisateur de toutes les salles
    this.leaveAllRooms(userId);

    // Supprimer le client
    this.clients.delete(userId);
  }

  /**
   * Envoyer un message à un utilisateur spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} message - Message à envoyer
   * @returns {boolean} Succès de l'envoi
   */
  sendToUser(userId, message) {
    const client = this.clients.get(userId);

    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'envoi d'un message à l'utilisateur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Envoyer un message à tous les clients connectés
   * @param {Object} message - Message à envoyer
   * @returns {number} Nombre de clients ayant reçu le message
   */
  broadcast(message) {
    let sentCount = 0;

    for (const [userId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`Erreur lors de l'envoi d'un message à l'utilisateur ${userId}:`, error);
        }
      }
    }

    return sentCount;
  }

  /**
   * Envoyer un message à tous les utilisateurs d'un rôle spécifique
   * @param {string} role - Rôle des utilisateurs
   * @param {Object} message - Message à envoyer
   * @returns {number} Nombre de clients ayant reçu le message
   */
  sendToRole(role, message) {
    let sentCount = 0;

    for (const [userId, client] of this.clients.entries()) {
      if (client.user.role === role && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`Erreur lors de l'envoi d'un message à l'utilisateur ${userId}:`, error);
        }
      }
    }

    return sentCount;
  }

  /**
   * Ajouter un utilisateur à une salle
   * @param {string} userId - ID de l'utilisateur
   * @param {string} roomName - Nom de la salle
   */
  joinRoom(userId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }

    this.rooms.get(roomName).add(userId);

    // Envoyer une confirmation à l'utilisateur
    this.sendToUser(userId, {
      type: 'room_joined',
      data: {
        roomName,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Retirer un utilisateur d'une salle
   * @param {string} userId - ID de l'utilisateur
   * @param {string} roomName - Nom de la salle
   */
  leaveRoom(userId, roomName) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(userId);

      // Supprimer la salle si elle est vide
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }

      // Envoyer une confirmation à l'utilisateur
      this.sendToUser(userId, {
        type: 'room_left',
        data: {
          roomName,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Retirer un utilisateur de toutes les salles
   * @param {string} userId - ID de l'utilisateur
   */
  leaveAllRooms(userId) {
    for (const [roomName, members] of this.rooms.entries()) {
      if (members.has(userId)) {
        members.delete(userId);

        // Supprimer la salle si elle est vide
        if (members.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    }
  }

  /**
   * Envoyer un message à tous les membres d'une salle
   * @param {string} roomName - Nom de la salle
   * @param {Object} message - Message à envoyer
   * @returns {number} Nombre de clients ayant reçu le message
   */
  sendToRoom(roomName, message) {
    if (!this.rooms.has(roomName)) {
      return 0;
    }

    let sentCount = 0;
    const members = this.rooms.get(roomName);

    for (const userId of members) {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Extraire le token d'authentification de la requête
   * @param {Object} req - Requête HTTP
   * @returns {string|null} Token ou null si non trouvé
   */
  extractToken(req) {
    // Essayer de récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Essayer de récupérer le token depuis les paramètres de requête
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  /**
   * Envoyer un ping à tous les clients connectés
   */
  pingAllClients() {
    for (const [userId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }

  /**
   * Nettoyer les connexions inactives
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const maxInactivity = 5 * 60 * 1000; // 5 minutes

    for (const [userId, client] of this.clients.entries()) {
      const inactiveTime = now - client.lastActivity;

      if (inactiveTime > maxInactivity) {
        console.log(`Fermeture de la connexion inactive pour l'utilisateur ${userId}`);
        client.ws.terminate();
      }
    }
  }

  /**
   * Obtenir des statistiques sur les connexions WebSocket
   * @returns {Object} Statistiques
   */
  getStats() {
    const roleStats = {};
    let totalConnections = 0;

    for (const [userId, client] of this.clients.entries()) {
      totalConnections++;

      const role = client.user.role;
      if (!roleStats[role]) {
        roleStats[role] = 0;
      }
      roleStats[role]++;
    }

    return {
      totalConnections,
      connectionsByRole: roleStats,
      totalRooms: this.rooms.size
    };
  }
}

// Singleton
const webSocketService = new WebSocketService();

// Configurer les écouteurs d'événements pour le service de notification
notificationService.on('notification', (data) => {
  const { userId, notification } = data;

  // Envoyer la notification via WebSocket
  webSocketService.sendToUser(userId, {
    type: 'notification',
    data: notification
  });

  // Envoyer le nouveau nombre de notifications non lues
  notificationService.getUnreadCount(userId).then(unreadCount => {
    webSocketService.sendToUser(userId, {
      type: 'unread_count',
      data: {
        count: unreadCount
      }
    });
  });
});

// Configurer le nettoyage périodique des connexions inactives
setInterval(() => {
  webSocketService.cleanupInactiveConnections();
}, 60 * 1000); // Toutes les minutes

// Configurer l'envoi de pings périodiques
setInterval(() => {
  webSocketService.pingAllClients();
}, 30 * 1000); // Toutes les 30 secondes

module.exports = webSocketService;
