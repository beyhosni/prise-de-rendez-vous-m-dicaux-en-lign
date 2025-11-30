import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem, TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Switch, FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ME_QUERY } from '../../graphql/auth';
import { DOCTOR_AVAILABILITIES_QUERY, CREATE_AVAILABILITY_MUTATION, DELETE_AVAILABILITY_MUTATION } from '../../graphql/doctor';
import { useAuth } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';

// Composants stylisés
const ScheduleContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SchedulePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const AvailabilityCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const daysOfWeek = [
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'TUESDAY', label: 'Mardi' },
  { value: 'WEDNESDAY', label: 'Mercredi' },
  { value: 'THURSDAY', label: 'Jeudi' },
  { value: 'FRIDAY', label: 'Vendredi' },
  { value: 'SATURDAY', label: 'Samedi' },
  { value: 'SUNDAY', label: 'Dimanche' },
];

const consultationTypes = [
  { value: 'IN_PERSON', label: 'En personne' },
  { value: 'ONLINE', label: 'En ligne' },
  { value: 'BOTH', label: 'Les deux' },
];

const ManageSchedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    consultationType: 'BOTH',
    isActive: true,
  });

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);

  // Récupérer les disponibilités du médecin
  const { data: availabilitiesData, loading: availabilitiesLoading, error: availabilitiesError, refetch } = useQuery(DOCTOR_AVAILABILITIES_QUERY, {
    variables: { doctorId: user?.doctor?.id },
    skip: !user?.doctor?.id,
  });

  // Mutation pour créer une disponibilité
  const [createAvailability] = useMutation(CREATE_AVAILABILITY_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createAvailability) {
        setSuccess('Disponibilité créée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        refetch();
        handleCloseDialog();
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  });

  // Mutation pour supprimer une disponibilité
  const [deleteAvailability] = useMutation(DELETE_AVAILABILITY_MUTATION, {
    onCompleted: (data) => {
      if (data && data.deleteAvailability) {
        setSuccess('Disponibilité supprimée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        refetch();
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  });

  useEffect(() => {
    if (userData && userData.me && userData.me.doctor) {
      setDoctor(userData.me.doctor);
    }
  }, [userData]);

  useEffect(() => {
    if (availabilitiesData && availabilitiesData.doctorAvailabilities) {
      setAvailabilities(availabilitiesData.doctorAvailabilities);
      setLoading(false);
    }
  }, [availabilitiesData]);

  const handleOpenDialog = (availability = null) => {
    if (availability) {
      setEditingAvailability(availability);
      setFormData({
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotDuration: availability.slotDuration,
        consultationType: availability.consultationType,
        isActive: availability.isActive,
      });
    } else {
      setEditingAvailability(null);
      setFormData({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        consultationType: 'BOTH',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAvailability(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  const handleSubmit = () => {
    if (!editingAvailability) {
      createAvailability({
        variables: {
          input: {
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            slotDuration: parseInt(formData.slotDuration),
            consultationType: formData.consultationType,
            isActive: formData.isActive,
          }
        }
      });
    } else {
      // Pour la modification, nous utiliserions une mutation UPDATE_AVAILABILITY_MUTATION si elle existait
      // Pour l'instant, nous supprimons l'ancienne et créons une nouvelle
      deleteAvailability({
        variables: {
          id: editingAvailability.id
        }
      }).then(() => {
        createAvailability({
          variables: {
            input: {
              dayOfWeek: formData.dayOfWeek,
              startTime: formData.startTime,
              endTime: formData.endTime,
              slotDuration: parseInt(formData.slotDuration),
              consultationType: formData.consultationType,
              isActive: formData.isActive,
            }
          }
        });
      });
    }
  };

  const handleDeleteAvailability = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      deleteAvailability({
        variables: { id }
      });
    }
  };

  const getDayLabel = (dayValue) => {
    const day = daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : dayValue;
  };

  const getConsultationTypeLabel = (typeValue) => {
    const type = consultationTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  };

  if (userLoading || availabilitiesLoading) {
    return (
      <ScheduleContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ScheduleContainer>
    );
  }

  if (userError || availabilitiesError) {
    return (
      <ScheduleContainer maxWidth="md">
        <Alert severity="error">Erreur lors du chargement des informations</Alert>
      </ScheduleContainer>
    );
  }

  return (
    <ScheduleContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Gérer mes disponibilités
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <SchedulePaper elevation={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Mes disponibilités
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Ajouter une disponibilité
          </Button>
        </Box>

        {availabilities.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              Vous n'avez aucune disponibilité configurée.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Ajouter une disponibilité
            </Button>
          </Box>
        ) : (
          <Box>
            {availabilities.map((availability) => (
              <AvailabilityCard key={availability.id} elevation={2}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">
                        {getDayLabel(availability.dayOfWeek)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {availability.startTime} - {availability.endTime}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Durée des créneaux: {availability.slotDuration} minutes
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Type: {getConsultationTypeLabel(availability.consultationType)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Statut: {availability.isActive ? 'Actif' : 'Inactif'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3} textAlign="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(availability)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteAvailability(availability.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </AvailabilityCard>
            ))}
          </Box>
        )}
      </SchedulePaper>

      {/* Boîte de dialogue pour ajouter/modifier une disponibilité */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAvailability ? 'Modifier une disponibilité' : 'Ajouter une disponibilité'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="day-of-week-label">Jour de la semaine</InputLabel>
                <Select
                  labelId="day-of-week-label"
                  id="day-of-week"
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                  label="Jour de la semaine"
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Heure de début"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Heure de fin"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="consultation-type-label">Type de consultation</InputLabel>
                <Select
                  labelId="consultation-type-label"
                  id="consultation-type"
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleInputChange}
                  label="Type de consultation"
                >
                  {consultationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Durée des créneaux (minutes)"
                type="number"
                name="slotDuration"
                value={formData.slotDuration}
                onChange={handleInputChange}
                inputProps={{ min: 15, max: 120, step: 15 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Disponibilité active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {editingAvailability ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </ScheduleContainer>
  );
};

export default ManageSchedule;
