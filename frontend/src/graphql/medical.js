import { gql } from '@apollo/client';

// Requête pour obtenir les documents médicaux
export const MEDICAL_DOCUMENTS_QUERY = gql`
  query MedicalDocuments($patientId: ID, $doctorId: ID) {
    medicalDocuments(patientId: $patientId, doctorId: $doctorId) {
      id
      title
      type
      description
      fileUrl
      fileName
      fileSize
      createdAt
      updatedAt
      patientId
      doctorId
    }
  }
`;

// Mutation pour téléverser un document médical
export const UPLOAD_MEDICAL_DOCUMENT_MUTATION = gql`
  mutation UploadMedicalDocument($file: Upload!, $title: String!, $type: String!, $description: String, $patientId: ID, $doctorId: ID) {
    uploadMedicalDocument(file: $file, title: $title, type: $type, description: $description, patientId: $patientId, doctorId: $doctorId) {
      id
      title
      type
      description
      fileUrl
      fileName
      fileSize
      createdAt
      updatedAt
      patientId
      doctorId
    }
  }
`;

// Mutation pour supprimer un document médical
export const DELETE_MEDICAL_DOCUMENT_MUTATION = gql`
  mutation DeleteMedicalDocument($documentId: ID!) {
    deleteMedicalDocument(documentId: $documentId) {
      id
      title
      type
      description
      fileUrl
      fileName
      fileSize
      createdAt
      updatedAt
      patientId
      doctorId
    }
  }
`;
