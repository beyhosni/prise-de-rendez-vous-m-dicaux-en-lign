import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, Button, Avatar, Chip, Divider, Alert, CircularProgress, List, ListItem, ListItemText, ListItemIcon, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '../../graphql/auth';
import { useAuth } from '../../contexts/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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

const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  height: '100%',
}));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Données factices pour les statistiques (à remplacer par des requêtes GraphQL réelles)
  const [stats, setStats] = useState({
    totalPatients: 1245,
    totalDoctors: 89,
    totalAppointments: 3421,
    totalRevenue: 125430,
    onlineAppointments: 1234,
    newUsersThisMonth: 67,
    growthRate: 12.5,
  });

  const [recentAppointments, setRecentAppointments] = useState([
    {
      id: '1',
      patientName: 'Jean Dupont',
      doctorName: 'Dr. Martin',
      date: '15/12/2023',
      time: '10:30',
      type: 'ONLINE',
      status: 'CONFIRMED',
    },
    {
      id: '2',
      patientName: 'Marie Durand',
      doctorName: 'Dr. Lefebvre',
      date: '15/12/2023',
      time: '14:00',
      type: 'IN_PERSON',
      status: 'PENDING',
    },
    {
      id: '3',
      patientName: 'Pierre Bernard',
      doctorName: 'Dr. Petit',
      date: '14/12/2023',
      time: '16:15',
      type: 'ONLINE',
      status: 'COMPLETED',
    },
  ]);

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);

  useEffect(() => {
    if (userData && userData.me) {
      setLoading(false);
    }
  }, [userData]);

  if (userLoading) {
    return (
      <DashboardContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </DashboardContainer>
    );
  }

  if (userError) {
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
              Tableau de bord administrateur
            </Typography>
            <Typography variant="body1">
              Bienvenue dans votre espace d'administration. Gérez la plateforme et surveillez son activité.
            </Typography>
          </Box>
        </Box>
      </WelcomeCard>

      {/* Statistiques principales */}
      <Typography variant="h5" component="h2" gutterBottom>
        Vue d'ensemble de la plateforme
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {stats.totalPatients}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patients inscrits
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon color="success" fontSize="small" />
              <Typography variant="caption" color="success.main" ml={0.5}>
                +{stats.newUsersThisMonth} ce mois-ci
              </Typography>
            </Box>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <MedicalServicesIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {stats.totalDoctors}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Médecins inscrits
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <CalendarMonthIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {stats.totalAppointments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rendez-vous totaux
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <AttachMoneyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {stats.totalRevenue.toLocaleString()} €
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revenus générés
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
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Gérer les utilisateurs
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/users')}
              >
                Gérer
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <MedicalServicesIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Valider les médecins
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/doctors')}
              >
                Valider
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Rapports et statistiques
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/reports')}
              >
                Voir
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard elevation={2}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Configuration système
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/settings')}
              >
                Configurer
              </Button>
            </CardContent>
          </ActionCard>
        </Grid>
      </Grid>

      {/* Rendez-vous récents */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" component="h2" gutterBottom>
            Rendez-vous récents
          </Typography>
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Médecin</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.patientName}</TableCell>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>{appointment.date} à {appointment.time}</TableCell>
                      <TableCell>
                        {appointment.type === 'ONLINE' ? (
                          <Box display="flex" alignItems="center">
                            <VideoCallIcon fontSize="small" sx={{ mr: 1 }} />
                            En ligne
                          </Box>
                        ) : 'En personne'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(appointment.status)} 
                          color={getStatusColor(appointment.status)} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            Activité de la plateforme
          </Typography>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Consultations en ligne
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {stats.onlineAppointments} ce mois-ci
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(stats.onlineAppointments / stats.totalAppointments) * 100} 
              sx={{ mb: 2 }} 
            />

            <Typography variant="h6" gutterBottom>
              Taux de croissance
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              +{stats.growthRate}% ce mois-ci
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={stats.growthRate * 5} 
              sx={{ mb: 2 }} 
            />

            <Box mt={2}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => navigate('/admin/reports')}
              >
                Voir les rapports détaillés
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default AdminDashboard;
