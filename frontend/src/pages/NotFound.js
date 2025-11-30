import React from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

// Composants stylisés
const NotFoundContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  padding: theme.spacing(3),
}));

const NotFoundPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  maxWidth: 500,
}));

const ErrorCode = styled(Typography)(({ theme }) => ({
  fontSize: '8rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  lineHeight: 1,
}));

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSearch = () => {
    navigate('/search-doctors');
  };

  return (
    <NotFoundContainer maxWidth="md">
      <NotFoundPaper elevation={3}>
        <ErrorCode variant="h1">404</ErrorCode>
        <Typography variant="h4" component="h2" gutterBottom>
          Page non trouvée
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Box display="flex" gap={2} justifyContent="center" mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            Accueil
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Chercher un médecin
          </Button>
        </Box>
      </NotFoundPaper>
    </NotFoundContainer>
  );
};

export default NotFound;
