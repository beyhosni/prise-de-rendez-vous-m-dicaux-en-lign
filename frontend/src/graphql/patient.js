import { gql } from '@apollo/client';

// Requête pour obtenir un patient par son ID
export const PATIENT_QUERY = gql`
  query Patient($id: ID!) {
    patient(id: $id) {
      id
      userId
      firstName
      lastName
      dateOfBirth
      phone
      address
      city
      postalCode
      insuranceNumber
      createdAt
    }
  }
`;

// Requête pour obtenir les patients d'un médecin
export const DOCTOR_PATIENTS_QUERY = gql`
  query DoctorPatients($doctorId: ID!, $page: Int, $limit: Int, $search: String) {
    doctorPatients(doctorId: $doctorId, page: $page, limit: $limit, search: $search) {
      patients {
        id
        userId
        firstName
        lastName
        dateOfBirth
        phone
        address
        city
        postalCode
        insuranceNumber
        email
        appointmentCount
        lastAppointmentDate
      }
      totalPages
      totalCount
    }
  }
`;
