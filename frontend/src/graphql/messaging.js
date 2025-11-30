import { gql } from '@apollo/client';

// Requête pour obtenir les conversations d'un utilisateur
export const CONVERSATIONS_QUERY = gql`
  query Conversations($userId: ID!) {
    conversations(userId: $userId) {
      id
      lastMessage
      lastMessageAt
      unreadCount
      patient {
        id
        userId
        firstName
        lastName
      }
      doctor {
        id
        userId
        firstName
        lastName
      }
    }
  }
`;

// Requête pour obtenir les messages d'une conversation
export const MESSAGES_QUERY = gql`
  query Messages($conversationId: ID!) {
    messages(conversationId: $conversationId) {
      id
      content
      senderId
      sentAt
      isRead
    }
  }
`;

// Mutation pour envoyer un message
export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      senderId
      sentAt
      isRead
    }
  }
`;

// Mutation pour marquer des messages comme lus
export const MARK_MESSAGES_READ_MUTATION = gql`
  mutation MarkMessagesRead($conversationId: ID!) {
    markMessagesRead(conversationId: $conversationId) {
      success
    }
  }
`;

// Abonnement aux nouveaux messages
export const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription NewMessage($conversationId: ID!) {
    newMessage(conversationId: $conversationId) {
      id
      content
      senderId
      sentAt
      isRead
    }
  }
`;
