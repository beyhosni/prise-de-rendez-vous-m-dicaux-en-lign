import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Pagination, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { DOCTORS_QUERY, UPDATE_DOCTOR_STATUS_MUTATION } from '../../graphql/admin';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const ManagementContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const DoctorCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const specialties = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Pédiatrie',
  'Gynécologie',
  'Ophtalmologie',
  'ORL',
  'Radiologie',
  'Neurologie',
  'Psychiatrie',
  'Rhumatologie',
  'Urologie',
  'Gastro-entérologie',
  'Endocrinologie',
  'Pneumologie',
];

const DoctorManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Récupérer les médecins
  const { data: doctorsData, loading: doctorsLoading, error: doctorsError } = useQuery(DOCTORS_QUERY, {
    variables: { 
      page,
      limit: 10,
      search: searchQuery,
      specialty: specialtyFilter,
      status: statusFilter
    },
  });

  // Mutation pour mettre à jour le statut d'un médecin
  const [updateDoctorStatus] = useMutation(UPDATE_DOCTOR_STATUS_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updateDoctorStatus) {
        setDoctors(prev => 
          prev.map(doctor => 
            doctor.id === data.updateDoctorStatus.id 
              ? data.updateDoctorStatus 
              : doctor
          )
        );
        setSuccess('Statut du médecin mis à jour avec succès');
        setTimeout(() => setSuccess(''), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  });

  useEffect(() => {
    if (doctorsData && doctorsData.doctors) {
      setDoctors(doctorsData.doctors.doctors);
      setTotalPages(doctorsData.doctors.totalPages);
      setLoading(false);
    }
  }, [doctorsData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleSpecialtyFilterChange = (e) => {
    setSpecialtyFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedDoctor(null);
  };

  const handleUpdateDoctorStatus = (doctorId, isActive, isVerified) => {
    updateDoctorStatus({
      variables: {
        doctorId,
        isActive,
        isVerified
      }
    });
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
        Gestion des médecins
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Barre de recherche et filtres */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Rechercher un médecin..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="specialty-filter-label">Spécialité</InputLabel>
            <Select
              labelId="specialty-filter-label"
              id="specialty-filter"
              value={specialtyFilter}
              label="Spécialité"
              onChange={handleSpecialtyFilterChange}
            >
              <MenuItem value="">Toutes</MenuItem>
              {specialties.map((specialty) => (
                <MenuItem key={specialty} value={specialty}>
                  {specialty}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Statut</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Statut"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="active">Actifs</MenuItem>
              <MenuItem value="inactive">Inactifs</MenuItem>
              <MenuItem value="verified">Vérifiés</MenuItem>
              <MenuItem value="unverified">Non vérifiés</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {doctors.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun médecin correspondant à votre recherche.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Spécialité</TableCell>
                  <TableCell>Ville</TableCell>
                  <TableCell>Tarif</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        {doctor.firstName} {doctor.lastName}
                      </Box>
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.city}</TableCell>
                    <TableCell>{doctor.consultationFee} €</TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Chip 
                          label={doctor.isActive ? 'Actif' : 'Inactif'} 
                          color={doctor.isActive ? 'success' : 'error'} 
                          size="small" 
                        />
                        <Chip 
                          label={doctor.isVerified ? 'Vérifié' : 'Non vérifié'} 
                          color={doctor.isVerified ? 'primary' : 'warning'} 
                          size="small" 
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDoctorDetails(doctor)}
                        >
                          Voir
                        </Button>
                        <Button
                          variant={doctor.isActive ? "outlined" : "contained"}
                          color={doctor.isActive ? "error" : "success"}
                          startIcon={doctor.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          onClick={() => handleUpdateDoctorStatus(doctor.id, !doctor.isActive, doctor.isVerified)}
                        >
                          {doctor.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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

      {/* Dialogue de détails du médecin */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Détails du médecin</DialogTitle>
        <DialogContent>
          {selectedDoctor && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDoctor.specialty}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={selectedDoctor.isActive ? 'Actif' : 'Inactif'} 
                      color={selectedDoctor.isActive ? 'success' : 'error'} 
                      size="small" 
                    />
                    <Chip 
                      label={selectedDoctor.isVerified ? 'Vérifié' : 'Non vérifié'} 
                      color={selectedDoctor.isVerified ? 'primary' : 'warning'} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Contact</Typography>
                  <Typography variant="body2" paragraph>
                    Email: {selectedDoctor.email}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Téléphone: {selectedDoctor.phone}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Adresse</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedDoctor.officeAddress}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedDoctor.postalCode} {selectedDoctor.city}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Informations professionnelles</Typography>
                  <Typography variant="body2" paragraph>
                    Numéro de licence: {selectedDoctor.licenseNumber}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Tarif: {selectedDoctor.consultationFee} €
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Langues</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {selectedDoctor.languages && selectedDoctor.languages.map((language, index) => (
                      <Chip key={index} label={language} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Biographie</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedDoctor.bio || 'Aucune biographie disponible.'}
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
              handleUpdateDoctorStatus(
                selectedDoctor.id, 
                !selectedDoctor.isActive, 
                !selectedDoctor.isVerified
              );
            }}
          >
            {selectedDoctor?.isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementContainer>
  );
};

export default DoctorManagement;
