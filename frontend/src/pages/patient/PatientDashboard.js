import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, Button, Avatar, Chip, Divider, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '../../graphql/auth';
import { PATIENT_APPOINTMENTS_QUERY } from '../../graphql/appointment';
import { useAuth } from '../../contexts/AuthContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const WelcomeCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
  color: 'white',
}));

const ActionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const AppointmentCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);

  // Récupérer les rendez-vous du patient
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError } = useQuery(PATIENT_APPOINTMENTS_QUERY, {
    variables: { patientId: user?.patient?.id },
    skip: !user?.patient?.id,
  });

  useEffect(() => {
    if (userData && userData.me && userData.me.patient) {
      setPatient(userData.me.patient);
    }
  }, [userData]);

  useEffect(() => {
    if (appointmentsData && appointmentsData.patientAppointments) {
      const allAppointments = appointmentsData.patientAppointments;
      setAppointments(allAppointments);

      // Séparer les rendez-vous à venir et passés
      const now = dayjs();
      const upcoming = allAppointments.filter(appointment => 
        dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isAfter(now)
      );
      const past = allAppointments.filter(appointment => 
        dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isBefore(now)
      );

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
      setLoading(false);
    }
  }, [appointmentsData]);

  if (userLoading || appointmentsLoading) {
    return (
      <DashboardContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </DashboardContainer>
    );
  }

  if (userError || appointmentsError) {
    return (
      <DashboardContainer maxWidth="lg">
        <Alert severity="error">Erreur lors du chargement des informations</Alert>
      </DashboardContainer>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'success';
      case 'CANCELLED_BY_PATIENT':
      case 'CANCELLED_BY_DOCTOR':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'CANCELLED_BY_PATIENT':
        return 'Annulé par le patient';
      case 'CANCELLED_BY_DOCTOR':
        return 'Annulé par le médecin';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return status;
    }
  };

  return (
    <DashboardContainer maxWidth="lg">
      {/* Carte de bienvenue */}
      <WelcomeCard elevation={3}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: 'white', color: 'primary.main' }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Bonjour, {patient?.firstName} {patient?.lastName}
            </Typography>
            <Typography variant="body1">
              Bienvenue dans votre espace patient. Gérez facilement vos rendez-vous médicaux.
            </Typography>
          </Box>
        </Box>
      </WelcomeCard>

      {/* Actions rapides */}
      <Typography variant="h5" component="h2" gutterBottom>
        Actions rapides
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Chercher un médecin
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/search-doctors')}
              >
                Rechercher
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <CalendarMonthIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Prendre RDV
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/search-doctors')}
              >
                Prendre RDV
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <VideoCallIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Consultation vidéo
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/patient/appointments')}
              >
                Mes RDV
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Mon profil
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/patient/profile')}
              >
                Modifier
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
      </Grid>

      {/* Rendez-vous à venir */}
      <Typography variant="h5" component="h2" gutterBottom>
        Mes prochains rendez-vous
      </Typography>
      {upcomingAppointments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Vous n'avez aucun rendez-vous à venir.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/search-doctors')}
          >
            Prendre un rendez-vous
          </Button>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {upcomingAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} elevation={2}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">
                      {dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).format('dddd D MMMM YYYY à HH:mm')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.consultationType === 'ONLINE' ? 'Consultation en ligne' : 'Consultation en personne'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Chip 
                      label={getStatusText(appointment.status)} 
                      color={getStatusColor(appointment.status)} 
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={3} textAlign="right">
                    {appointment.consultationType === 'ONLINE' && appointment.status === 'CONFIRMED' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VideoCallIcon />}
                        onClick={() => navigate(`/consultation/${appointment.id}`)}
                      >
                        Rejoindre
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </AppointmentCard>
          ))}
        </Box>
      )}

      {/* Historique des rendez-vous */}
      <Typography variant="h5" component="h2" gutterBottom>
        Historique des rendez-vous
      </Typography>
      {pastAppointments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Vous n'avez aucun rendez-vous passé.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {pastAppointments.slice(0, 5).map((appointment) => (
            <AppointmentCard key={appointment.id} elevation={2}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">
                      {dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).format('dddd D MMMM YYYY à HH:mm')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.consultationType === 'ONLINE' ? 'Consultation en ligne' : 'Consultation en personne'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Chip 
                      label={getStatusText(appointment.status)} 
                      color={getStatusColor(appointment.status)} 
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={3} textAlign="right">
                    {appointment.status === 'COMPLETED' && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/patient/appointments/${appointment.id}`)}
                      >
                        Voir les détails
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </AppointmentCard>
          ))}
          {pastAppointments.length > 5 && (
            <Box textAlign="center" mt={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/patient/appointments')}
              >
                Voir tout l'historique
              </Button>
            </Box>
          )}
        </Box>
      )}
    </DashboardContainer>
  );
};

export default PatientDashboard;
