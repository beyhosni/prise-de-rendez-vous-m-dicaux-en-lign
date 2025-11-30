import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, IconButton, Chip, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { MEDICAL_DOCUMENTS_QUERY, UPLOAD_MEDICAL_DOCUMENT_MUTATION, DELETE_MEDICAL_DOCUMENT_MUTATION } from '../graphql/medical';
import { useAuth } from '../contexts/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const DocumentsContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const DocumentCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const UploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const documentTypes = [
  { value: 'PRESCRIPTION', label: 'Ordonnance' },
  { value: 'ANALYSIS', label: 'Résultats d'analyse' },
  { value: 'RADIOLOGY', label: 'Radiologie' },
  { value: 'CERTIFICATE', label: 'Certificat médical' },
  { value: 'OTHER', label: 'Autre' },
];

const MedicalDocuments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [documentDescription, setDocumentDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Récupérer les documents médicaux
  const { data: documentsData, loading: documentsLoading, error: documentsError } = useQuery(MEDICAL_DOCUMENTS_QUERY, {
    variables: { 
      [user.role === 'PATIENT' ? 'patientId' : 'doctorId']: 
      user.role === 'PATIENT' ? user.patient.id : user.doctor.id
    },
    skip: !user,
  });

  // Mutation pour téléverser un document
  const [uploadMedicalDocument] = useMutation(UPLOAD_MEDICAL_DOCUMENT_MUTATION, {
    onCompleted: (data) => {
      if (data && data.uploadMedicalDocument) {
        setDocuments(prev => [data.uploadMedicalDocument, ...prev]);
        setSuccess('Document téléversé avec succès');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseUploadDialog();
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
      setUploading(false);
      setUploadProgress(0);
    }
  });

  // Mutation pour supprimer un document
  const [deleteMedicalDocument] = useMutation(DELETE_MEDICAL_DOCUMENT_MUTATION, {
    onCompleted: (data) => {
      if (data && data.deleteMedicalDocument) {
        setDocuments(prev => 
          prev.filter(document => document.id !== data.deleteMedicalDocument.id)
        );
        setSuccess('Document supprimé avec succès');
        setTimeout(() => setSuccess(''), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  });

  useEffect(() => {
    if (documentsData && documentsData.medicalDocuments) {
      setDocuments(documentsData.medicalDocuments);
      setLoading(false);
    }
  }, [documentsData]);

  const handleOpenUploadDialog = () => {
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setSelectedFile(null);
    setDocumentTitle('');
    setDocumentType('OTHER');
    setDocumentDescription('');
    setUploadProgress(0);
    setUploading(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!documentTitle) {
        setDocumentTitle(file.name.split('.')[0]);
      }
    }
  };

  const handleUploadFile = () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    uploadMedicalDocument({
      variables: {
        file: selectedFile,
        title: documentTitle,
        type: documentType,
        description: documentDescription,
        [user.role === 'PATIENT' ? 'patientId' : 'doctorId']: 
        user.role === 'PATIENT' ? user.patient.id : user.doctor.id
      },
      context: {
        fetchOptions: {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        },
      },
    });
  };

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteMedicalDocument({
        variables: { documentId }
      });
    }
  };

  const handleDownloadDocument = (documentUrl, documentTitle) => {
    // Créer un lien temporaire pour télécharger le fichier
    const link = document.createElement('a');
    link.href = documentUrl;
    link.target = '_blank';
    link.download = documentTitle;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType ? docType.label : type;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DocumentsContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </DocumentsContainer>
    );
  }

  return (
    <DocumentsContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {user.role === 'PATIENT' ? 'Mes documents médicaux' : 'Documents des patients'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Zone de téléversement */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <UploadArea onClick={() => fileInputRef.current?.click()}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Téléverser un document médical
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cliquez ici ou glissez-déposez un fichier (PDF, JPG, PNG)
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
        </UploadArea>
      </Paper>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun document médical trouvé.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {documents.map((document) => (
            <Grid item xs={12} sm={6} md={4} key={document.id}>
              <DocumentCard elevation={2}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Chip 
                      label={getDocumentTypeLabel(document.type)} 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom noWrap>
                    {document.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {document.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Taille: {formatFileSize(document.fileSize)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ajouté le: {dayjs(document.createdAt).format('DD/MM/YYYY')}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadDocument(document.fileUrl, document.title)}
                    >
                      Télécharger
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </DocumentCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogue de téléversement */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Téléverser un document médical</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedFile && (
              <Box mb={2}>
                <Typography variant="body1">
                  Fichier sélectionné: {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taille: {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Titre du document"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              select
              label="Type de document"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              margin="normal"
              required
            >
              {documentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description"
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />

            {uploading && (
              <Box mt={2}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="text.secondary" align="center" mt={1}>
                  {uploadProgress}% complété
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Annuler
          </Button>
          <Button
            onClick={handleUploadFile}
            color="primary"
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Téléversement en cours...' : 'Téléverser'}
          </Button>
        </DialogActions>
      </Dialog>
    </DocumentsContainer>
  );
};

export default MedicalDocuments;
