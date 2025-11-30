import React from 'react';
import { Container, Typography, Button, Box, Grid, Paper, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../contexts/AuthContext';

// Composants stylisés
const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8, 2),
  background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
  color: 'white',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  '& > svg': {
    fontSize: 48,
    color: theme.palette.primary.main,
  },
}));

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirection selon le rôle de l'utilisateur
  const handleGetStarted = () => {
    if (isAuthenticated) {
      switch (user?.role) {
        case 'PATIENT':
          navigate('/patient');
          break;
        case 'DOCTOR':
          navigate('/doctor');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Section Hero */}
      <HeroSection>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Plateforme de Prise de Rendez-vous Médicaux
        </Typography>
        <Typography variant="h5" paragraph align="center">
          Consultez des médecins en ligne ou en présentiel, payez en toute sécurité et recevez des rappels automatiques
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleGetStarted}
          sx={{ mt: 2 }}
        >
          {isAuthenticated ? 'Accéder à mon espace' : 'Commencer'}
        </Button>
      </HeroSection>

      {/* Section Fonctionnalités */}
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
        Nos Services
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FeatureCard>
            <CardContent>
              <FeatureIcon>
                <SearchIcon />
              </FeatureIcon>
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Recherche de Médecins
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Trouvez le médecin qu'il vous faut par spécialité, localisation ou disponibilité
              </Typography>
            </CardContent>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FeatureCard>
            <CardContent>
              <FeatureIcon>
                <CalendarMonthIcon />
              </FeatureIcon>
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Prise de Rendez-vous
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Réservez votre consultation en quelques clics, 24h/24 et 7j/7
              </Typography>
            </CardContent>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FeatureCard>
            <CardContent>
              <FeatureIcon>
                <VideoCallIcon />
              </FeatureIcon>
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Consultations Vidéo
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Consultez votre médecin à distance depuis chez vous
              </Typography>
            </CardContent>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FeatureCard>
            <CardContent>
              <FeatureIcon>
                <SecurityIcon />
              </FeatureIcon>
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Paiements Sécurisés
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Payez en ligne en toute sécurité avec notre partenaire Stripe
              </Typography>
            </CardContent>
          </FeatureCard>
        </Grid>
      </Grid>

      {/* Section CTA pour les médecins */}
      <Paper
        sx={{
          p: 4,
          backgroundColor: 'primary.main',
          color: 'white',
          borderRadius: 2,
          textAlign: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Vous êtes un professionnel de santé ?
        </Typography>
        <Typography variant="body1" paragraph>
            Rejoignez notre plateforme et développez votre patientèle
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={() => navigate('/register?role=doctor')}
        >
          S'inscrire en tant que médecin
        </Button>
      </Paper>

      {/* Section Témoignages (optionnel) */}
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
        Ce que disent nos utilisateurs
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="body1" paragraph>
              "J'ai pu trouver un pédiatre disponible le jour même grâce à cette plateforme. Très pratique !"
            </Typography>
            <Typography variant="subtitle2" align="right">
              - Sophie M., Paris
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="body1" paragraph>
              "Les consultations vidéo sont un vrai gain de temps. Je recommande vivement !"
            </Typography>
            <Typography variant="subtitle2" align="right">
              - Marc L., Lyon
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="body1" paragraph>
              "En tant que médecin, cette plateforme m'a permis d'optimiser mon agenda et d'élargir ma patientèle."
            </Typography>
            <Typography variant="subtitle2" align="right">
              - Dr. Dubois, Marseille
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
