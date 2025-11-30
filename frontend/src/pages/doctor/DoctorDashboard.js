import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, Button, Avatar, Chip, Divider, Alert, CircularProgress, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '../../graphql/auth';
import { DOCTOR_APPOINTMENTS_QUERY } from '../../graphql/appointment';
import { useAuth } from '../../contexts/AuthContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
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

const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  height: '100%',
}));

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);

  // Récupérer les rendez-vous du médecin
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError } = useQuery(DOCTOR_APPOINTMENTS_QUERY, {
    variables: { doctorId: user?.doctor?.id },
    skip: !user?.doctor?.id,
  });

  useEffect(() => {
    if (userData && userData.me && userData.me.doctor) {
      setDoctor(userData.me.doctor);
    }
  }, [userData]);

  useEffect(() => {
    if (appointmentsData && appointmentsData.doctorAppointments) {
      const allAppointments = appointmentsData.doctorAppointments;
      setAppointments(allAppointments);

      // Obtenir la date actuelle
      const today = dayjs().format('YYYY-MM-DD');

      // Séparer les rendez-vous par date
      const todayAppts = allAppointments.filter(appointment => 
        appointment.appointmentDate === today
      );
      const upcoming = allAppointments.filter(appointment => 
        dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isAfter(dayjs())
      );
      const past = allAppointments.filter(appointment => 
        dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isBefore(dayjs())
      );

      setTodayAppointments(todayAppts);
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
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return status;
    }
  };

  // Calculer les statistiques
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
  const pendingAppointments = appointments.filter(a => a.status === 'PENDING').length;
  const onlineAppointments = appointments.filter(a => a.consultationType === 'ONLINE').length;

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
              Dr. {doctor?.firstName} {doctor?.lastName}
            </Typography>
            <Typography variant="body1">
              {doctor?.specialty} - {doctor?.city}
            </Typography>
          </Box>
        </Box>
      </WelcomeCard>

      {/* Statistiques */}
      <Typography variant="h5" component="h2" gutterBottom>
        Vue d'ensemble
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <Typography variant="h4" color="primary">
              {completedAppointments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consultations terminées
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <Typography variant="h4" color="warning.main">
              {pendingAppointments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rendez-vous en attente
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <Typography variant="h4" color="info.main">
              {onlineAppointments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consultations en ligne
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <Typography variant="h4" color="success.main">
              {doctor?.consultationFee} €
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tarif par consultation
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Typography variant="h5" component="h2" gutterBottom>
        Actions rapides
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Gérer mon agenda
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/doctor/schedule')}
              >
                Gérer
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <CalendarMonthIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Mes rendez-vous
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/doctor/appointments')}
              >
                Voir
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Mes patients
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/doctor/patients')}
              >
                Voir
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
                onClick={() => navigate('/doctor/profile')}
              >
                Modifier
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
      </Grid>

      {/* Rendez-vous du jour */}
      <Typography variant="h5" component="h2" gutterBottom>
        Rendez-vous d'aujourd'hui
      </Typography>
      {todayAppointments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Vous n'avez aucun rendez-vous aujourd'hui.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {todayAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} elevation={2}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">
                      {dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).format('HH:mm')} - {appointment.endTime}
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
                        Démarrer
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </AppointmentCard>
          ))}
        </Box>
      )}

      {/* Prochains rendez-vous */}
      <Typography variant="h5" component="h2" gutterBottom>
        Prochains rendez-vous
      </Typography>
      {upcomingAppointments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Vous n'avez aucun rendez-vous à venir.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {upcomingAppointments.slice(0, 5).map((appointment) => (
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
                        Démarrer
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </AppointmentCard>
          ))}
          <Box textAlign="center" mt={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/doctor/appointments')}
            >
              Voir tous les rendez-vous
            </Button>
          </Box>
        </Box>
      )}
    </DashboardContainer>
  );
};

export default DoctorDashboard;
