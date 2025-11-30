const cacheService = require('./cache.service');
const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.notificationPrefix = 'notification:';
    this.userNotificationPrefix = 'user_notifications:';
    this.defaultTTL = 7 * 24 * 60 * 60; // 7 jours en secondes
  }

  /**
   * Créer une nouvelle notification
   * @param {string} userId - ID de l'utilisateur
   * @param {string} title - Titre de la notification
   * @param {string} message - Message de la notification
   * @param {string} type - Type de notification
   * @param {Object} data - Données additionnelles
   * @returns {Promise<Object>} Notification créée
   */
  async createNotification(userId, title, message, type, data = {}) {
    const notificationId = this.generateNotificationId();
    const notification = {
      id: notificationId,
      userId,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Mettre en cache la notification
    await cacheService.set(`${this.notificationPrefix}${notificationId}`, notification, this.defaultTTL);

    // Ajouter l'ID à la liste des notifications de l'utilisateur
    const userNotifications = await this.getUserNotifications(userId) || [];
    userNotifications.unshift(notificationId);
    await cacheService.set(`${this.userNotificationPrefix}${userId}`, userNotifications, this.defaultTTL);

    // Incrémenter le compteur de notifications non lues
    await cacheService.incr(`unread_count:${userId}`);

    // Émettre un événement pour le WebSocket
    this.emit('notification', {
      userId,
      notification
    });

    return notification;
  }

  /**
   * Marquer une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async markAsRead(notificationId, userId) {
    const notification = await cacheService.get(`${this.notificationPrefix}${notificationId}`);

    if (!notification || notification.userId !== userId) {
      return false;
    }

    // Mettre à jour la notification
    notification.isRead = true;
    await cacheService.set(`${this.notificationPrefix}${notificationId}`, notification, this.defaultTTL);

    // Décrémenter le compteur de notifications non lues
    const unreadCount = await cacheService.get(`unread_count:${userId}`) || 0;
    if (unreadCount > 0) {
      await cacheService.set(`unread_count:${userId}`, unreadCount - 1, this.defaultTTL);
    }

    return true;
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications marquées comme lues
   */
  async markAllAsRead(userId) {
    const notificationIds = await this.getUserNotifications(userId) || [];
    let markedCount = 0;

    for (const notificationId of notificationIds) {
      const notification = await cacheService.get(`${this.notificationPrefix}${notificationId}`);

      if (notification && !notification.isRead) {
        notification.isRead = true;
        await cacheService.set(`${this.notificationPrefix}${notificationId}`, notification, this.defaultTTL);
        markedCount++;
      }
    }

    // Réinitialiser le compteur de notifications non lues
    await cacheService.set(`unread_count:${userId}`, 0, this.defaultTTL);

    return markedCount;
  }

  /**
   * Supprimer une notification
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async deleteNotification(notificationId, userId) {
    const notification = await cacheService.get(`${this.notificationPrefix}${notificationId}`);

    if (!notification || notification.userId !== userId) {
      return false;
    }

    // Supprimer la notification
    await cacheService.del(`${this.notificationPrefix}${notificationId}`);

    // Retirer l'ID de la liste des notifications de l'utilisateur
    const userNotifications = await this.getUserNotifications(userId) || [];
    const updatedNotifications = userNotifications.filter(id => id !== notificationId);
    await cacheService.set(`${this.userNotificationPrefix}${userId}`, updatedNotifications, this.defaultTTL);

    // Décrémenter le compteur si la notification n'était pas lue
    if (!notification.isRead) {
      const unreadCount = await cacheService.get(`unread_count:${userId}`) || 0;
      if (unreadCount > 0) {
        await cacheService.set(`unread_count:${userId}`, unreadCount - 1, this.defaultTTL);
      }
    }

    return true;
  }

  /**
   * Récupérer les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} limit - Limite de notifications à récupérer
   * @param {number} offset - Décalage pour la pagination
   * @returns {Promise<Array>} Liste des notifications
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    const notificationIds = await cacheService.get(`${this.userNotificationPrefix}${userId}`) || [];
    const paginatedIds = notificationIds.slice(offset, offset + limit);
    const notifications = [];

    for (const notificationId of paginatedIds) {
      const notification = await cacheService.get(`${this.notificationPrefix}${notificationId}`);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Récupérer le nombre de notifications non lues d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications non lues
   */
  async getUnreadCount(userId) {
    return await cacheService.get(`unread_count:${userId}`) || 0;
  }

  /**
   * Créer une notification de rappel de rendez-vous
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} appointment - Données du rendez-vous
   * @returns {Promise<Object>} Notification créée
   */
  async createAppointmentReminder(userId, appointment) {
    const { doctor, appointmentDate, startTime } = appointment;
    const title = 'Rappel de rendez-vous';
    const message = `Vous avez un rendez-vous avec Dr. ${doctor.firstName} ${doctor.lastName} le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime}`;

    return await this.createNotification(
      userId,
      title,
      message,
      'APPOINTMENT_REMINDER',
      { appointmentId: appointment.id }
    );
  }

  /**
   * Créer une notification de confirmation de rendez-vous
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} appointment - Données du rendez-vous
   * @returns {Promise<Object>} Notification créée
   */
  async createAppointmentConfirmation(userId, appointment) {
    const { doctor, appointmentDate, startTime } = appointment;
    const title = 'Rendez-vous confirmé';
    const message = `Votre rendez-vous avec Dr. ${doctor.firstName} ${doctor.lastName} le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime} a été confirmé`;

    return await this.createNotification(
      userId,
      title,
      message,
      'APPOINTMENT_CONFIRMED',
      { appointmentId: appointment.id }
    );
  }

  /**
   * Créer une notification d'annulation de rendez-vous
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} appointment - Données du rendez-vous
   * @returns {Promise<Object>} Notification créée
   */
  async createAppointmentCancellation(userId, appointment) {
    const { doctor, appointmentDate, startTime } = appointment;
    const title = 'Rendez-vous annulé';
    const message = `Votre rendez-vous avec Dr. ${doctor.firstName} ${doctor.lastName} prévu le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime} a été annulé`;

    return await this.createNotification(
      userId,
      title,
      message,
      'APPOINTMENT_CANCELLED',
      { appointmentId: appointment.id }
    );
  }

  /**
   * Créer une notification de nouveau message
   * @param {string} userId - ID de l'utilisateur destinataire
   * @param {Object} sender - Données de l'expéditeur
   * @param {string} message - Contenu du message
   * @param {string} conversationId - ID de la conversation
   * @returns {Promise<Object>} Notification créée
   */
  async createNewMessageNotification(userId, sender, message, conversationId) {
    const title = 'Nouveau message';
    const messageText = `Vous avez reçu un nouveau message de ${sender.firstName} ${sender.lastName}`;

    return await this.createNotification(
      userId,
      title,
      messageText,
      'NEW_MESSAGE',
      { 
        conversationId,
        senderId: sender.id,
        senderName: `${sender.firstName} ${sender.lastName}`
      }
    );
  }

  /**
   * Créer une notification de succès de paiement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} appointment - Données du rendez-vous
   * @returns {Promise<Object>} Notification créée
   */
  async createPaymentSuccessNotification(userId, appointment) {
    const { doctor, appointmentDate, startTime, consultationFee } = appointment;
    const title = 'Paiement réussi';
    const message = `Votre paiement de ${consultationFee}€ pour le rendez-vous avec Dr. ${doctor.firstName} ${doctor.lastName} le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime} a été effectué avec succès`;

    return await this.createNotification(
      userId,
      title,
      message,
      'PAYMENT_SUCCESS',
      { appointmentId: appointment.id, amount: consultationFee }
    );
  }

  /**
   * Générer un ID de notification unique
   * @returns {string} ID de notification
   */
  generateNotificationId() {
    return require('crypto').randomBytes(16).toString('hex');
  }
}

// Singleton
const notificationService = new NotificationService();

module.exports = notificationService;
