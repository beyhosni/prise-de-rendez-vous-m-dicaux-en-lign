import { gql } from '@apollo/client';

// Mutation pour mettre à jour le profil patient
export const UPDATE_PATIENT_PROFILE_MUTATION = gql`
  mutation UpdatePatientProfile($input: UpdatePatientProfileInput!) {
    updatePatientProfile(input: $input) {
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
    }
  }
`;

// Mutation pour mettre à jour le profil médecin
export const UPDATE_DOCTOR_PROFILE_MUTATION = gql`
  mutation UpdateDoctorProfile($input: UpdateDoctorProfileInput!) {
    updateDoctorProfile(input: $input) {
      id
      userId
      firstName
      lastName
      specialty
      licenseNumber
      phone
      officeAddress
      city
      postalCode
      languages
      consultationFee
      bio
    }
  }
`;
