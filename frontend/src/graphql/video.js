import { gql } from '@apollo/client';

// Requête pour obtenir une consultation par son ID
export const CONSULTATION_QUERY = gql`
  query Consultation($id: ID!) {
    consultation(id: $id) {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;

// Requête pour obtenir une consultation par ID de rendez-vous
export const APPOINTMENT_CONSULTATION_QUERY = gql`
  query AppointmentConsultation($appointmentId: ID!) {
    appointmentConsultation(appointmentId: $appointmentId) {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;

// Requête pour obtenir les consultations de l'utilisateur connecté
export const MY_CONSULTATIONS_QUERY = gql`
  query MyConsultations {
    myConsultations {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;

// Mutation pour créer une consultation
export const CREATE_CONSULTATION_MUTATION = gql`
  mutation CreateConsultation($appointmentId: ID!) {
    createConsultation(appointmentId: $appointmentId) {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;

// Mutation pour démarrer une consultation
export const START_CONSULTATION_MUTATION = gql`
  mutation StartConsultation($input: StartConsultationInput!) {
    startConsultation(input: $input) {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;

// Mutation pour rejoindre une consultation
export const JOIN_CONSULTATION_MUTATION = gql`
  mutation JoinConsultation($appointmentId: ID!) {
    joinConsultation(appointmentId: $appointmentId) {
      token
      roomUrl
      expiresAt
    }
  }
`;

// Mutation pour terminer une consultation
export const END_CONSULTATION_MUTATION = gql`
  mutation EndConsultation($appointmentId: ID!) {
    endConsultation(appointmentId: $appointmentId) {
      id
      appointmentId
      roomId
      roomUrl
      status
      startedAt
      endedAt
      createdAt
    }
  }
`;
