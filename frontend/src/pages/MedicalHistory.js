import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { MEDICAL_HISTORY_QUERY } from '../graphql/medical';
import { useAuth } from '../contexts/AuthContext';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const HistoryContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const HistoryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const HistoryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const MedicalHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Récupérer l'historique médical du patient
  const { data: medicalHistoryData, loading: medicalHistoryLoading, error: medicalHistoryError } = useQuery(MEDICAL_HISTORY_QUERY, {
    variables: { patientId: user?.patient?.id },
    skip: !user?.patient?.id,
  });

  useEffect(() => {
    if (medicalHistoryData && medicalHistoryData.medicalHistory) {
      setMedicalHistory(medicalHistoryData.medicalHistory);
      setLoading(false);
    }
  }, [medicalHistoryData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedRecord(null);
  };

  const formatRecordDate = (date) => {
    return dayjs(date).format('DD MMMM YYYY');
  };

  const getRecordTypeIcon = (type) => {
    switch (type) {
      case 'CONSULTATION':
        return <MedicalServicesIcon />;
      case 'PRESCRIPTION':
        return <MedicationIcon />;
      case 'HOSPITALIZATION':
        return <LocalHospitalIcon />;
      default:
        return <MedicalServicesIcon />;
    }
  };

  const getRecordTypeLabel = (type) => {
    switch (type) {
      case 'CONSULTATION':
        return 'Consultation';
      case 'PRESCRIPTION':
        return 'Ordonnance';
      case 'HOSPITALIZATION':
        return 'Hospitalisation';
      case 'ANALYSIS':
        return 'Analyse médicale';
      case 'VACCINATION':
        return 'Vaccination';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <HistoryContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </HistoryContainer>
    );
  }

  if (error) {
    return (
      <HistoryContainer maxWidth="lg">
        <Alert severity="error">Erreur lors du chargement de l'historique médical</Alert>
      </HistoryContainer>
    );
  }

  // Filtrer les enregistrements par type
  const consultations = medicalHistory.filter(record => record.type === 'CONSULTATION');
  const prescriptions = medicalHistory.filter(record => record.type === 'PRESCRIPTION');
  const hospitalizations = medicalHistory.filter(record => record.type === 'HOSPITALIZATION');
  const analyses = medicalHistory.filter(record => record.type === 'ANALYSIS');
  const vaccinations = medicalHistory.filter(record => record.type === 'VACCINATION');

  return (
    <HistoryContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Mon historique médical
      </Typography>

      <HistoryPaper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Button
            variant={activeTab === 0 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 0)}
            sx={{ mr: 2 }}
          >
            Tous
          </Button>
          <Button
            variant={activeTab === 1 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 1)}
            sx={{ mr: 2 }}
          >
            Consultations
          </Button>
          <Button
            variant={activeTab === 2 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 2)}
            sx={{ mr: 2 }}
          >
            Ordonnances
          </Button>
          <Button
            variant={activeTab === 3 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 3)}
            sx={{ mr: 2 }}
          >
            Analyses
          </Button>
          <Button
            variant={activeTab === 4 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 4)}
            sx={{ mr: 2 }}
          >
            Hospitalisations
          </Button>
          <Button
            variant={activeTab === 5 ? 'contained' : 'text'}
            onClick={() => handleTabChange(null, 5)}
          >
            Vaccinations
          </Button>
        </Box>
      </HistoryPaper>

      {medicalHistory.length === 0 ? (
        <HistoryPaper elevation={2}>
          <Box p={4} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              Aucun enregistrement médical trouvé.
            </Typography>
          </Box>
        </HistoryPaper>
      ) : (
        <Grid container spacing={3}>
          {(activeTab === 0 ? medicalHistory :
            activeTab === 1 ? consultations :
            activeTab === 2 ? prescriptions :
            activeTab === 3 ? analyses :
            activeTab === 4 ? hospitalizations :
            vaccinations
          ).map((record) => (
            <Grid item xs={12} sm={6} md={4} key={record.id}>
              <HistoryCard elevation={2}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getRecordTypeIcon(record.type)}
                    </Avatar>
                    <Chip 
                      label={getRecordTypeLabel(record.type)} 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {record.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {record.description}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      {formatRecordDate(record.date)}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(record)}
                    >
                      Voir
                    </Button>
                  </Box>
                </CardContent>
              </HistoryCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogue de détails */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l'enregistrement médical</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                  {getRecordTypeIcon(selectedRecord.type)}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {selectedRecord.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getRecordTypeLabel(selectedRecord.type)} - {formatRecordDate(selectedRecord.date)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography variant="body1">
                    {selectedRecord.description}
                  </Typography>
                </Grid>

                {selectedRecord.doctor && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>Médecin</Typography>
                    <Typography variant="body1">
                      Dr. {selectedRecord.doctor.firstName} {selectedRecord.doctor.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRecord.doctor.specialty}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Date</Typography>
                  <Typography variant="body1">
                    {formatRecordDate(selectedRecord.date)}
                  </Typography>
                </Grid>

                {selectedRecord.facility && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Établissement</Typography>
                    <Typography variant="body1">
                      {selectedRecord.facility}
                    </Typography>
                  </Grid>
                )}

                {selectedRecord.documents && selectedRecord.documents.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Documents associés</Typography>
                    <List>
                      {selectedRecord.documents.map((document, index) => (
                        <ListItem key={index} button>
                          <ListItemIcon>
                            <CalendarMonthIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={document.title} 
                            secondary={document.uploadDate ? formatRecordDate(document.uploadDate) : ''} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </HistoryContainer>
  );
};

export default MedicalHistory;
