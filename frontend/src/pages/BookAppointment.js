import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, Alert, CircularProgress, Chip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { DOCTOR_QUERY, AVAILABLE_SLOTS_QUERY } from '../graphql/doctor';
import { CREATE_APPOINTMENT_MUTATION } from '../graphql/appointment';
import { useAuth } from '../contexts/AuthContext';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const BookAppointmentContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const DoctorInfoPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const TimeSlotPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TimeSlotButton = styled(Button)(({ theme, available }) => ({
  margin: theme.spacing(0.5),
  minWidth: '80px',
  backgroundColor: available ? theme.palette.primary.main : theme.palette.grey[300],
  color: available ? theme.palette.primary.contrastText : theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: available ? theme.palette.primary.dark : theme.palette.grey[300],
  },
}));

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const doctorId = searchParams.get('doctorId');

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState('IN_PERSON');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);

  // Récupérer les informations du médecin
  const { data: doctorData, loading: doctorLoading, error: doctorError } = useQuery(DOCTOR_QUERY, {
    variables: { id: doctorId },
    skip: !doctorId,
  });

  // Récupérer les créneaux disponibles pour la date sélectionnée
  const { data: slotsData, loading: slotsLoading, error: slotsError } = useQuery(AVAILABLE_SLOTS_QUERY, {
    variables: {
      doctorId,
      date: selectedDate.format('YYYY-MM-DD'),
    },
    skip: !doctorId,
  });

  // Mutation pour créer un rendez-vous
  const [createAppointment] = useMutation(CREATE_APPOINTMENT_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createAppointment) {
        setAppointmentId(data.createAppointment.id);
        setSuccess(true);
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Gérer la sélection d'un créneau horaire
  const handleTimeSlotSelect = (timeSlot) => {
    if (timeSlot.isAvailable) {
      setSelectedTime(timeSlot);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    if (!selectedTime) {
      setError('Veuillez sélectionner un créneau horaire');
      return;
    }

    setLoading(true);
    setError('');

    createAppointment({
      variables: {
        input: {
          doctorId,
          appointmentDate: selectedDate.format('YYYY-MM-DD'),
          startTime: selectedTime.startTime,
          consultationType,
          reason: appointmentReason,
        }
      }
    });
  };

  // Rediriger vers la page de paiement
  useEffect(() => {
    if (success && appointmentId) {
      navigate(`/payment/${appointmentId}`);
    }
  }, [success, appointmentId, navigate]);

  if (doctorLoading) {
    return (
      <BookAppointmentContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </BookAppointmentContainer>
    );
  }

  if (doctorError || !doctorData || !doctorData.doctor) {
    return (
      <BookAppointmentContainer maxWidth="md">
        <Alert severity="error">Erreur lors du chargement des informations du médecin</Alert>
      </BookAppointmentContainer>
    );
  }

  const doctor = doctorData.doctor;
  const availableSlots = slotsData ? slotsData.availableSlots : [];

  return (
    <BookAppointmentContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Prendre un rendez-vous
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Informations du médecin */}
        <Grid item xs={12} md={4}>
          <DoctorInfoPaper elevation={2}>
            <Typography variant="h6">Dr. {doctor.firstName} {doctor.lastName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {doctor.specialty}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {doctor.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tarif: {doctor.consultationFee} €
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">
              {doctor.bio}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {doctor.languages && doctor.languages.map((language, index) => (
                <Chip key={index} label={language} size="small" variant="outlined" />
              ))}
            </Box>
          </DoctorInfoPaper>
        </Grid>

        {/* Sélection de la date et des créneaux horaires */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Calendrier */}
            <Grid item xs={12} md={6}>
              <TimeSlotPaper elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Sélectionner une date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    disablePast
                  />
                </LocalizationProvider>
              </TimeSlotPaper>
            </Grid>

            {/* Créneaux horaires */}
            <Grid item xs={12} md={6}>
              <TimeSlotPaper elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Créneaux disponibles
                </Typography>
                {slotsLoading ? (
                  <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress />
                  </Box>
                ) : slotsError ? (
                  <Alert severity="error">Erreur lors du chargement des créneaux</Alert>
                ) : (
                  <Box display="flex" flexWrap="wrap">
                    {availableSlots.map((timeSlot, index) => (
                      <TimeSlotButton
                        key={index}
                        variant={selectedTime && selectedTime.startTime === timeSlot.startTime ? "contained" : "outlined"}
                        available={timeSlot.isAvailable}
                        onClick={() => handleTimeSlotSelect(timeSlot)}
                        disabled={!timeSlot.isAvailable}
                      >
                        {timeSlot.startTime}
                      </TimeSlotButton>
                    ))}
                  </Box>
                )}
              </TimeSlotPaper>
            </Grid>

            {/* Type de consultation et motif */}
            <Grid item xs={12}>
              <TimeSlotPaper elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Détails du rendez-vous
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Type de consultation:
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant={consultationType === 'IN_PERSON' ? 'contained' : 'outlined'}
                        onClick={() => setConsultationType('IN_PERSON')}
                      >
                        En personne
                      </Button>
                      <Button
                        variant={consultationType === 'ONLINE' ? 'contained' : 'outlined'}
                        onClick={() => setConsultationType('ONLINE')}
                      >
                        En ligne
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Motif (optionnel):
                    </Typography>
                    <textarea
                      style={{ width: '100%', minHeight: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={appointmentReason}
                      onChange={(e) => setAppointmentReason(e.target.value)}
                      placeholder="Décrivez brièvement la raison de votre consultation"
                    />
                  </Grid>
                </Grid>

                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!selectedTime || loading}
                    size="large"
                  >
                    {loading ? 'Création en cours...' : 'Confirmer le rendez-vous'}
                  </Button>
                </Box>
              </TimeSlotPaper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </BookAppointmentContainer>
  );
};

export default BookAppointment;
