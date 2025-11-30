import { gql } from '@apollo/client';

// Abonnement aux notifications en temps réel
export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription NewNotification($userId: ID!) {
    newNotification(userId: $userId) {
      id
      title
      message
      type
      data
      createdAt
    }
  }
`;

// Requête pour obtenir les notifications d'un utilisateur
export const USER_NOTIFICATIONS_QUERY = gql`
  query UserNotifications($userId: ID!, $limit: Int, $offset: Int) {
    userNotifications(userId: $userId, limit: $limit, offset: $offset) {
      id
      title
      message
      type
      data
      read
      createdAt
    }
  }
`;

// Mutation pour marquer une notification comme lue
export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

// Mutation pour marquer toutes les notifications comme lues
export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($userId: ID!) {
    markAllNotificationsRead(userId: $userId) {
      success
    }
  }
`;
