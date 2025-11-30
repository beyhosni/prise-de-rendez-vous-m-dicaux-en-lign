import { gql } from '@apollo/client';

// Requête pour obtenir un rendez-vous par son ID
export const APPOINTMENT_QUERY = gql`
  query Appointment($id: ID!) {
    appointment(id: $id) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Requête pour obtenir les rendez-vous d'un patient
export const PATIENT_APPOINTMENTS_QUERY = gql`
  query PatientAppointments($patientId: ID!) {
    patientAppointments(patientId: $patientId) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Requête pour obtenir les rendez-vous d'un médecin
export const DOCTOR_APPOINTMENTS_QUERY = gql`
  query DoctorAppointments($doctorId: ID!) {
    doctorAppointments(doctorId: $doctorId) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour créer un rendez-vous
export const CREATE_APPOINTMENT_MUTATION = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour annuler un rendez-vous
export const CANCEL_APPOINTMENT_MUTATION = gql`
  mutation CancelAppointment($appointmentId: ID!, $reason: String) {
    cancelAppointment(appointmentId: $appointmentId, reason: $reason) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour confirmer un rendez-vous
export const CONFIRM_APPOINTMENT_MUTATION = gql`
  mutation ConfirmAppointment($appointmentId: ID!) {
    confirmAppointment(appointmentId: $appointmentId) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour marquer un rendez-vous comme terminé
export const COMPLETE_APPOINTMENT_MUTATION = gql`
  mutation CompleteAppointment($appointmentId: ID!, $notes: String) {
    completeAppointment(appointmentId: $appointmentId, notes: $notes) {
      id
      patientId
      doctorId
      appointmentDate
      startTime
      endTime
      consultationType
      status
      reason
      notes
      createdAt
      updatedAt
    }
  }
`;
