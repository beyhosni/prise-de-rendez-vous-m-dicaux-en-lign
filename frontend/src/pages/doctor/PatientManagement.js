import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, Button, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Pagination } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { DOCTOR_PATIENTS_QUERY } from '../../graphql/doctor';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const ManagementContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const PatientCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const PatientAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  bgcolor: theme.palette.primary.main,
}));

const PatientManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'table'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Récupérer les patients du médecin
  const { data: patientsData, loading: patientsLoading, error: patientsError } = useQuery(DOCTOR_PATIENTS_QUERY, {
    variables: { 
      doctorId: user?.doctor?.id,
      page,
      limit: 10,
      search: searchQuery
    },
    skip: !user?.doctor?.id,
  });

  useEffect(() => {
    if (patientsData && patientsData.doctorPatients) {
      setPatients(patientsData.doctorPatients.patients);
      setTotalPages(patientsData.doctorPatients.totalPages);
      setLoading(false);
    }
  }, [patientsData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return (
      <ManagementContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ManagementContainer>
    );
  }

  return (
    <ManagementContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion de mes patients
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Barre de recherche et contrôles */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Rechercher un patient..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '70%' }}
        />
        <Box>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            sx={{ mr: 1 }}
          >
            Grille
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
          >
            Tableau
          </Button>
        </Box>
      </Paper>

      {patients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Vous n'avez aucun patient correspondant à votre recherche.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Vue en grille */}
          {viewMode === 'grid' && (
            <Grid container spacing={3}>
              {patients.map((patient) => (
                <Grid item xs={12} sm={6} md={4} key={patient.id}>
                  <PatientCard elevation={2}>
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <PatientAvatar>
                        <PersonIcon fontSize="large" />
                      </PatientAvatar>
                      <Typography variant="h6" gutterBottom>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {patient.dateOfBirth ? `${dayjs().diff(dayjs(patient.dateOfBirth), 'year')} ans` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {patient.city}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {patient.phone}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewPatientDetails(patient)}
                        sx={{ mt: 2 }}
                      >
                        Voir le profil
                      </Button>
                    </CardContent>
                  </PatientCard>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Vue en tableau */}
          {viewMode === 'table' && (
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Date de naissance</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Ville</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          {patient.firstName} {patient.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {patient.dateOfBirth ? dayjs(patient.dateOfBirth).format('DD/MM/YYYY') : ''}
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.city}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewPatientDetails(patient)}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Dialogue de détails du patient */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Détails du patient</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.dateOfBirth ? `Né(e) le ${dayjs(selectedPatient.dateOfBirth).format('DD MMMM YYYY')} (${dayjs().diff(dayjs(selectedPatient.dateOfBirth), 'year')} ans)` : ''}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Contact</Typography>
                  <Typography variant="body2" paragraph>
                    Téléphone: {selectedPatient.phone}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Email: {selectedPatient.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Adresse</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPatient.address}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPatient.postalCode} {selectedPatient.city}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Informations médicales</Typography>
                  <Typography variant="body2" paragraph>
                    Numéro d'assurance: {selectedPatient.insuranceNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Historique des rendez-vous</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPatient.appointmentCount || 0} rendez-vous
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Dernier rendez-vous: {selectedPatient.lastAppointmentDate ? dayjs(selectedPatient.lastAppointmentDate).format('DD MMMM YYYY') : 'Aucun'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Fermer</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              handleCloseDetailsDialog();
              navigate(`/doctor/medical-records/${selectedPatient.id}`);
            }}
          >
            Voir dossier médical
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementContainer>
  );
};

export default PatientManagement;
