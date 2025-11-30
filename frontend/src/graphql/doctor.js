import { gql } from '@apollo/client';

// Requête pour obtenir un médecin par son ID
export const DOCTOR_QUERY = gql`
  query Doctor($id: ID!) {
    doctor(id: $id) {
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
      createdAt
      rating
      reviewsCount
      availabilities {
        id
        doctorId
        dayOfWeek
        startTime
        endTime
        slotDuration
        consultationType
        isActive
      }
    }
  }
`;

// Requête pour obtenir les médecins par spécialité
export const DOCTORS_BY_SPECIALTY_QUERY = gql`
  query DoctorsBySpecialty($specialty: String!) {
    doctorsBySpecialty(specialty: $specialty) {
      id
      userId
      firstName
      lastName
      specialty
      city
      consultationFee
      rating
      reviewsCount
      languages
    }
  }
`;

// Requête pour rechercher des médecins
export const SEARCH_DOCTORS_QUERY = gql`
  query SearchDoctors($specialty: String, $city: String) {
    searchDoctors(specialty: $specialty, city: $city) {
      id
      userId
      firstName
      lastName
      specialty
      city
      consultationFee
      rating
      reviewsCount
      languages
    }
  }
`;

// Requête pour obtenir les disponibilités d'un médecin
export const DOCTOR_AVAILABILITIES_QUERY = gql`
  query DoctorAvailabilities($doctorId: ID!) {
    doctorAvailabilities(doctorId: $doctorId) {
      id
      doctorId
      dayOfWeek
      startTime
      endTime
      slotDuration
      consultationType
      isActive
    }
  }
`;

// Requête pour obtenir les créneaux disponibles d'un médecin pour une date donnée
export const AVAILABLE_SLOTS_QUERY = gql`
  query AvailableSlots($doctorId: ID!, $date: Date!) {
    availableSlots(doctorId: $doctorId, date: $date) {
      startTime
      endTime
      isAvailable
    }
  }
`;

// Mutation pour mettre à jour le profil du médecin
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

// Mutation pour créer une disponibilité
export const CREATE_AVAILABILITY_MUTATION = gql`
  mutation CreateAvailability($input: CreateAvailabilityInput!) {
    createAvailability(input: $input) {
      id
      doctorId
      dayOfWeek
      startTime
      endTime
      slotDuration
      consultationType
      isActive
    }
  }
`;

// Mutation pour supprimer une disponibilité
export const DELETE_AVAILABILITY_MUTATION = gql`
  mutation DeleteAvailability($id: ID!) {
    deleteAvailability(id: $id)
  }
`;
