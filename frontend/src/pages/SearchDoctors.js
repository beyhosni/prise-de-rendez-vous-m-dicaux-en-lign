import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, TextField, Button, InputAdornment, MenuItem, Chip, Rating, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_DOCTORS_QUERY, DOCTORS_BY_SPECIALTY_QUERY } from '../graphql/doctor';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Composants stylisés
const SearchContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SearchBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

const DoctorCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const DoctorMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.grey[500],
}));

const specialties = [
  'Toutes',
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

const SearchDoctors = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    specialty: '',
    city: '',
    searchQuery: '',
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchDoctors] = useLazyQuery(SEARCH_DOCTORS_QUERY, {
    onCompleted: (data) => {
      if (data && data.searchDoctors) {
        setDoctors(data.searchDoctors);
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  const [getDoctorsBySpecialty] = useLazyQuery(DOCTORS_BY_SPECIALTY_QUERY, {
    onCompleted: (data) => {
      if (data && data.doctorsBySpecialty) {
        setDoctors(data.doctorsBySpecialty);
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  useEffect(() => {
    // Effectuer une recherche initiale
    handleSearch();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setLoading(true);
    setError('');

    if (searchParams.specialty && searchParams.specialty !== 'Toutes') {
      getDoctorsBySpecialty({
        variables: {
          specialty: searchParams.specialty
        }
      });
    } else {
      searchDoctors({
        variables: {
          specialty: searchParams.specialty === 'Toutes' ? null : searchParams.specialty,
          city: searchParams.city || null
        }
      });
    }
  };

  const handleBookAppointment = (doctorId) => {
    navigate(`/patient/book-appointment?doctorId=${doctorId}`);
  };

  return (
    <SearchContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Trouver un médecin
      </Typography>

      <SearchBar>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Spécialité"
              name="specialty"
              select
              value={searchParams.specialty}
              onChange={handleInputChange}
              variant="outlined"
            >
              {specialties.map((specialty) => (
                <MenuItem key={specialty} value={specialty}>
                  {specialty}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ville"
              name="city"
              value={searchParams.city}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Recherche (nom, spécialité...)"
              name="searchQuery"
              value={searchParams.searchQuery}
              onChange={handleInputChange}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSearch}
                      disabled={loading}
                      startIcon={<SearchIcon />}
                    >
                      Rechercher
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </SearchBar>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" my={4}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {doctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor.id}>
              <DoctorCard>
                <DoctorMedia>
                  <PersonIcon sx={{ fontSize: 80 }} />
                </DoctorMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doctor.specialty}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" ml={1}>
                      {doctor.city}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Tarif: {doctor.consultationFee} €
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Rating name="read-only" value={doctor.rating || 4} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" ml={1}>
                      ({doctor.reviewsCount || 0} avis)
                    </Typography>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {doctor.languages && doctor.languages.slice(0, 3).map((language, index) => (
                      <Chip key={index} label={language} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VideoCallIcon />}
                      onClick={() => navigate(`/doctor/${doctor.id}`)}
                    >
                      Voir profil
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CalendarMonthIcon />}
                      onClick={() => handleBookAppointment(doctor.id)}
                    >
                      Prendre RDV
                    </Button>
                  </Box>
                </CardContent>
              </DoctorCard>
            </Grid>
          ))}
        </Grid>
      )}

      {doctors.length === 0 && !loading && !error && (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            Aucun médecin trouvé pour ces critères
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Essayez de modifier vos filtres de recherche
          </Typography>
        </Box>
      )}
    </SearchContainer>
  );
};

export default SearchDoctors;
