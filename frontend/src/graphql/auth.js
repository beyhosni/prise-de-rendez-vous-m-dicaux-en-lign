import { gql } from '@apollo/client';

// Mutation pour l'inscription d'un patient
export const REGISTER_PATIENT_MUTATION = gql`
  mutation RegisterPatient($input: RegisterPatientInput!) {
    registerPatient(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        role
        patient {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

// Mutation pour l'inscription d'un médecin
export const REGISTER_DOCTOR_MUTATION = gql`
  mutation RegisterDoctor($input: RegisterDoctorInput!) {
    registerDoctor(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        role
        doctor {
          id
          firstName
          lastName
          specialty
        }
      }
    }
  }
`;

// Mutation pour la connexion
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
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
          insuranceNumber
        }
        doctor {
          id
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
    }
  }
`;

// Mutation pour rafraîchir le token
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        email
        role
      }
    }
  }
`;

// Mutation pour la déconnexion
export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

// Requête pour obtenir les informations de l'utilisateur connecté
export const ME_QUERY = gql`
  query Me {
    me {
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
        insuranceNumber
      }
      doctor {
        id
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
  }
`;

// Requête pour obtenir les informations d'un utilisateur par son ID
export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
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
        insuranceNumber
      }
      doctor {
        id
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
  }
`;
