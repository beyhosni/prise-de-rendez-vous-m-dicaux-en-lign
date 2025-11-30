import { gql } from '@apollo/client';

// Requête pour obtenir un paiement par son ID
export const PAYMENT_QUERY = gql`
  query Payment($id: ID!) {
    payment(id: $id) {
      id
      appointmentId
      amount
      currency
      status
      paymentMethod
      stripeSessionId
      stripePaymentIntentId
      paidAt
      refundedAt
      createdAt
      updatedAt
    }
  }
`;

// Requête pour obtenir les paiements d'un rendez-vous
export const APPOINTMENT_PAYMENTS_QUERY = gql`
  query AppointmentPayments($appointmentId: ID!) {
    appointmentPayments(appointmentId: $appointmentId) {
      id
      appointmentId
      amount
      currency
      status
      paymentMethod
      stripeSessionId
      stripePaymentIntentId
      paidAt
      refundedAt
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour créer une session de paiement
export const CREATE_PAYMENT_SESSION_MUTATION = gql`
  mutation CreatePaymentSession($input: CreatePaymentInput!) {
    createPaymentSession(input: $input) {
      sessionId
      paymentUrl
      clientSecret
    }
  }
`;

// Mutation pour confirmer un paiement
export const CONFIRM_PAYMENT_MUTATION = gql`
  mutation ConfirmPayment($paymentIntentId: String!) {
    confirmPayment(paymentIntentId: $paymentIntentId) {
      id
      appointmentId
      amount
      currency
      status
      paymentMethod
      stripePaymentIntentId
      paidAt
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour traiter un remboursement
export const PROCESS_REFUND_MUTATION = gql`
  mutation ProcessRefund($input: ProcessRefundInput!) {
    processRefund(input: $input) {
      id
      appointmentId
      amount
      currency
      status
      paymentMethod
      stripePaymentIntentId
      paidAt
      refundedAt
      createdAt
      updatedAt
    }
  }
`;
