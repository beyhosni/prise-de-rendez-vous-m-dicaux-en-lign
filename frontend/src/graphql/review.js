import { gql } from '@apollo/client';

// Requête pour obtenir les évaluations d'un médecin
export const DOCTOR_REVIEWS_QUERY = gql`
  query DoctorReviews($doctorId: ID!, $page: Int, $limit: Int) {
    doctorReviews(doctorId: $doctorId, page: $page, limit: $limit) {
      reviews {
        id
        appointmentId
        patientId
        rating
        comment
        createdAt
        patient {
          id
          firstName
          lastName
        }
      }
      totalPages
      totalCount
      averageRating
    }
  }
`;

// Requête pour obtenir les évaluations d'un patient
export const PATIENT_REVIEWS_QUERY = gql`
  query PatientReviews($patientId: ID!, $page: Int, $limit: Int) {
    patientReviews(patientId: $patientId, page: $page, limit: $limit) {
      reviews {
        id
        appointmentId
        doctorId
        rating
        comment
        createdAt
        doctor {
          id
          firstName
          lastName
          specialty
        }
      }
      totalPages
      totalCount
    }
  }
`;

// Mutation pour créer une évaluation
export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      appointmentId
      patientId
      doctorId
      rating
      comment
      createdAt
    }
  }
`;

// Mutation pour mettre à jour une évaluation
export const UPDATE_REVIEW_MUTATION = gql`
  mutation UpdateReview($reviewId: ID!, $input: UpdateReviewInput!) {
    updateReview(reviewId: $reviewId, input: $input) {
      id
      appointmentId
      patientId
      doctorId
      rating
      comment
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour supprimer une évaluation
export const DELETE_REVIEW_MUTATION = gql`
  mutation DeleteReview($reviewId: ID!) {
    deleteReview(reviewId: $reviewId) {
      id
    }
  }
`;
