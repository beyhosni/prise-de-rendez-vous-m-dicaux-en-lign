import { gql } from '@apollo/client';

// Requête pour obtenir les utilisateurs
export const USERS_QUERY = gql`
  query Users($page: Int, $limit: Int, $search: String, $role: String, $status: String) {
    users(page: $page, limit: $limit, search: $search, role: $role, status: $status) {
      users {
        id
        email
        role
        isActive
        createdAt
        patient {
          id
          firstName
          lastName
          dateOfBirth
          phone
          address
          city
          postalCode
        }
        doctor {
          id
          firstName
          lastName
          specialty
          phone
          officeAddress
          city
          postalCode
          consultationFee
          isVerified
        }
      }
      totalPages
      totalCount
    }
  }
`;

// Requête pour obtenir les médecins
export const DOCTORS_QUERY = gql`
  query Doctors($page: Int, $limit: Int, $search: String, $specialty: String, $status: String) {
    doctors(page: $page, limit: $limit, search: $search, specialty: $specialty, status: $status) {
      doctors {
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
        consultationFee
        isVerified
        isActive
        createdAt
      }
      totalPages
      totalCount
    }
  }
`;

// Requête pour obtenir les patients
export const PATIENTS_QUERY = gql`
  query Patients($page: Int, $limit: Int, $search: String, $status: String) {
    patients(page: $page, limit: $limit, search: $search, status: $status) {
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
        isActive
        createdAt
      }
      totalPages
      totalCount
    }
  }
`;

// Requête pour obtenir les statistiques
export const STATS_QUERY = gql`
  query Stats {
    stats {
      totalPatients
      totalDoctors
      totalAppointments
      totalRevenue
      onlineAppointments
      newUsersThisMonth
      growthRate
    }
  }
`;

// Mutation pour mettre à jour le statut d'un utilisateur
export const UPDATE_USER_STATUS_MUTATION = gql`
  mutation UpdateUserStatus($userId: ID!, $isActive: Boolean!) {
    updateUserStatus(userId: $userId, isActive: $isActive) {
      id
      email
      role
      isActive
      createdAt
    }
  }
`;

// Mutation pour mettre à jour le statut d'un médecin
export const UPDATE_DOCTOR_STATUS_MUTATION = gql`
  mutation UpdateDoctorStatus($doctorId: ID!, $isActive: Boolean!, $isVerified: Boolean) {
    updateDoctorStatus(doctorId: $doctorId, isActive: $isActive, isVerified: $isVerified) {
      id
      userId
      firstName
      lastName
      specialty
      isVerified
      isActive
      createdAt
    }
  }
`;

// Mutation pour valider un médecin
export const VERIFY_DOCTOR_MUTATION = gql`
  mutation VerifyDoctor($doctorId: ID!) {
    verifyDoctor(doctorId: $doctorId) {
      id
      userId
      firstName
      lastName
      isVerified
    }
  }
`;

// Requête pour obtenir les rapports
export const REPORTS_QUERY = gql`
  query Reports($startDate: Date, $endDate: Date, $type: String) {
    reports(startDate: $startDate, endDate: $endDate, type: $type) {
      id
      type
      data
      generatedAt
    }
  }
`;

// Mutation pour générer un rapport
export const GENERATE_REPORT_MUTATION = gql`
  mutation GenerateReport($input: GenerateReportInput!) {
    generateReport(input: $input) {
      id
      type
      data
      generatedAt
    }
  }
`;
