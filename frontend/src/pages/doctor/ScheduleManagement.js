import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, FormControl, InputLabel, Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, List, ListItem, ListItemText, IconButton, Switch, FormControlLabel, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { DOCTOR_AVAILABILITIES_QUERY, CREATE_AVAILABILITY_MUTATION, DELETE_AVAILABILITY_MUTATION, UPDATE_AVAILABILITY_MUTATION } from '../../graphql/doctor';
import { useAuth } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const ScheduleContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SchedulePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const AvailabilityCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const ScheduleManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    consultationType: 'IN_PERSON',
    isActive: true,
  });

  // Récupérer les disponibilités du médecin
  const { data: availabilitiesData, loading: availabilitiesLoading, error: availabilitiesError } = useQuery(DOCTOR_AVAILABILITIES_QUERY, {
    variables: { doctorId: user?.doctor?.id },
    skip: !user?.doctor?.id,
  });

  // Mutations pour gérer les disponibilités
  const [createAvailability] = useMutation(CREATE_AVAILABILITY_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createAvailability) {
        setAvailabilities(prev => [...prev, data.createAvailability]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        handleCloseDialog();
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const [updateAvailability] = useMutation(UPDATE_AVAILABILITY_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updateAvailability) {
        setAvailabilities(prev => 
          prev.map(availability => 
            availability.id === data.updateAvailability.id 
              ? data.updateAvailability 
              : availability
          )
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        handleCloseDialog();
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const [deleteAvailability] = useMutation(DELETE_AVAILABILITY_MUTATION, {
    onCompleted: (data) => {
      if (data && data.deleteAvailability) {
        setAvailabilities(prev => 
          prev.filter(availability => availability.id !== data.deleteAvailability)
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

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
        consultationType: 'IN_PERSON',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAvailability(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  const handleSubmit = () => {
    setError('');

    if (editingAvailability) {
      updateAvailability({
        variables: {
          id: editingAvailability.id,
          input: formData
        }
      });
    } else {
      createAvailability({
        variables: {
          input: {
            ...formData,
            doctorId: user.doctor.id
          }
        }
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

  if (loading) {
    return (
      <ScheduleContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ScheduleContainer>
    );
  }

  return (
    <ScheduleContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion de mes disponibilités
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Disponibilité {editingAvailability ? 'modifiée' : 'ajoutée'} avec succès</Alert>}

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
              Vous n'avez aucune disponibilité enregistrée.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajoutez vos disponibilités pour permettre aux patients de prendre rendez-vous.
            </Typography>
          </Box>
        ) : (
          <List>
            {availabilities.map((availability) => (
              <React.Fragment key={availability.id}>
                <AvailabilityCard elevation={1}>
                  <Box>
                    <Typography variant="h6">
                      {daysOfWeek.find(day => day.value === availability.dayOfWeek)?.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {availability.startTime} - {availability.endTime}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Créneaux de {availability.slotDuration} minutes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {consultationTypes.find(type => type.value === availability.consultationType)?.label}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={availability.isActive}
                          onChange={(e) => {
                            updateAvailability({
                              variables: {
                                id: availability.id,
                                input: {
                                  ...availability,
                                  isActive: e.target.checked
                                }
                              }
                            });
                          }}
                          />
                        }
                      />
                    />
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
                  </Box>
                </AvailabilityCard>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </SchedulePaper>

      {/* Dialogue pour ajouter/modifier une disponibilité */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAvailability ? 'Modifier la disponibilité' : 'Ajouter une disponibilité'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
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
                id="start-time"
                name="startTime"
                label="Heure de début"
                type="time"
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
                id="end-time"
                name="endTime"
                label="Heure de fin"
                type="time"
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
            <Grid item xs={12} sm={6}>
              <TextField
                id="slot-duration"
                name="slotDuration"
                label="Durée des créneaux (minutes)"
                type="number"
                value={formData.slotDuration}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: 15,
                  max: 120,
                  step: 15,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
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
          <Button onClick={handleCloseDialog} color="primary" startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" startIcon={<SaveIcon />}>
            {editingAvailability ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/doctor')}
        >
          Retour au tableau de bord
        </Button>
      </Box>
    </ScheduleContainer>
  );
};

export default ScheduleManagement;
