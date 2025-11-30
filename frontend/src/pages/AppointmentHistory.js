import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Card, CardContent, Button, Chip, Grid, Tabs, Tab, CircularProgress, Alert, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { PATIENT_APPOINTMENTS_QUERY, DOCTOR_APPOINTMENTS_QUERY } from '../graphql/appointment';
import { useAuth } from '../contexts/AuthContext';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const HistoryContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const AppointmentCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointment-tabpanel-${index}`}
      aria-labelledby={`appointment-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AppointmentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer les rendez-vous du patient ou du médecin
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError } = useQuery(
    user.role === 'PATIENT' ? PATIENT_APPOINTMENTS_QUERY : DOCTOR_APPOINTMENTS_QUERY,
    {
      variables: { 
        [user.role === 'PATIENT' ? 'patientId' : 'doctorId']: 
        user.role === 'PATIENT' ? user.patient.id : user.doctor.id 
      },
      skip: !user,
    }
  );

  useEffect(() => {
    if (appointmentsData) {
      const appointments = user.role === 'PATIENT' 
        ? appointmentsData.patientAppointments 
        : appointmentsData.doctorAppointments;

      // Filtrer les rendez-vous
      let filtered = appointments;

      if (filterStatus) {
        filtered = filtered.filter(appointment => appointment.status === filterStatus);
      }

      if (searchQuery) {
        filtered = filtered.filter(appointment => {
          const searchLower = searchQuery.toLowerCase();
          const doctorName = user.role === 'PATIENT' 
            ? `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.toLowerCase()
            : '';
          const patientName = user.role === 'DOCTOR'
            ? `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.toLowerCase()
            : '';

          return doctorName.includes(searchLower) || 
                 patientName.includes(searchLower) ||
                 appointment.reason?.toLowerCase().includes(searchLower);
        });
      }

      setFilteredAppointments(filtered);
      setLoading(false);
    }
  }, [appointmentsData, filterStatus, searchQuery, user.role]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  if (appointmentsLoading) {
    return (
      <HistoryContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </HistoryContainer>
    );
  }

  if (appointmentsError) {
    return (
      <HistoryContainer maxWidth="lg">
        <Alert severity="error">Erreur lors du chargement des rendez-vous</Alert>
      </HistoryContainer>
    );
  }

  // Séparer les rendez-vous à venir et passés
  const now = dayjs();
  const upcomingAppointments = filteredAppointments.filter(appointment => 
    dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isAfter(now)
  );
  const pastAppointments = filteredAppointments.filter(appointment => 
    dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).isBefore(now)
  );

  return (
    <HistoryContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {user.role === 'PATIENT' ? 'Mes rendez-vous' : 'Mes consultations'}
      </Typography>

      {/* Filtres */}
      <FilterPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon />,
              }}
              placeholder={user.role === 'PATIENT' ? "Médecin, motif..." : "Patient, motif..."}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                label="Statut"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<FilterListIcon />}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="CONFIRMED">Confirmé</MenuItem>
                <MenuItem value="CANCELLED_BY_PATIENT">Annulé par le patient</MenuItem>
                <MenuItem value="CANCELLED_BY_DOCTOR">Annulé par le médecin</MenuItem>
                <MenuItem value="COMPLETED">Terminé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarMonthIcon />}
              onClick={() => navigate(user.role === 'PATIENT' ? '/search-doctors' : '/doctor/schedule')}
              fullWidth
            >
              {user.role === 'PATIENT' ? 'Prendre un nouveau rendez-vous' : 'Gérer mon agenda'}
            </Button>
          </Grid>
        </Grid>
      </FilterPaper>

      {/* Onglets pour séparer les rendez-vous à venir et passés */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Rendez-vous à venir (${upcomingAppointments.length})`} />
          <Tab label={`Rendez-vous passés (${pastAppointments.length})`} />
        </Tabs>
      </Box>

      {/* Rendez-vous à venir */}
      <TabPanel value={tabValue} index={0}>
        {upcomingAppointments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Vous n'avez aucun rendez-vous à venir.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate(user.role === 'PATIENT' ? '/search-doctors' : '/doctor/schedule')}
            >
              {user.role === 'PATIENT' ? 'Prendre un rendez-vous' : 'Configurer mes disponibilités'}
            </Button>
          </Paper>
        ) : (
          <Box>
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
                      {user.role === 'PATIENT' ? (
                        <Typography variant="body1" mt={1}>
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          <Typography variant="body2" color="text.secondary">
                            {appointment.doctor?.specialty}
                          </Typography>
                        </Typography>
                      ) : (
                        <Typography variant="body1" mt={1}>
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </Typography>
                      )}
                      {appointment.reason && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Motif: {appointment.reason}
                        </Typography>
                      )}
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
                      {appointment.status === 'PENDING' && user.role === 'DOCTOR' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/doctor/appointment/${appointment.id}`)}
                        >
                          Gérer
                        </Button>
                      )}
                      {appointment.status === 'PENDING' && user.role === 'PATIENT' && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/patient/appointment/${appointment.id}`)}
                        >
                          Détails
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </AppointmentCard>
            ))}
          </Box>
        )}
      </TabPanel>

      {/* Rendez-vous passés */}
      <TabPanel value={tabValue} index={1}>
        {pastAppointments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Vous n'avez aucun rendez-vous passé.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {pastAppointments.map((appointment) => (
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
                      {user.role === 'PATIENT' ? (
                        <Typography variant="body1" mt={1}>
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          <Typography variant="body2" color="text.secondary">
                            {appointment.doctor?.specialty}
                          </Typography>
                        </Typography>
                      ) : (
                        <Typography variant="body1" mt={1}>
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </Typography>
                      )}
                      {appointment.reason && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Motif: {appointment.reason}
                        </Typography>
                      )}
                      {appointment.notes && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Notes: {appointment.notes}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Chip 
                        label={getStatusText(appointment.status)} 
                        color={getStatusColor(appointment.status)} 
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} textAlign="right">
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/${user.role === 'PATIENT' ? 'patient' : 'doctor'}/appointment/${appointment.id}`)}
                      >
                        Détails
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </AppointmentCard>
            ))}
          </Box>
        )}
      </TabPanel>
    </HistoryContainer>
  );
};

export default AppointmentHistory;
