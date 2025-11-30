import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Rating, TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Chip, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { APPOINTMENT_QUERY, CREATE_REVIEW_MUTATION } from '../graphql/appointment';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const ReviewContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const ReviewPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const DoctorCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const DoctorAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  marginBottom: theme.spacing(2),
  bgcolor: theme.palette.primary.main,
}));

const ReviewAppointment = () => {
  const { user } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Récupérer les informations du rendez-vous
  const { data: appointmentData, loading: appointmentLoading, error: appointmentError } = useQuery(APPOINTMENT_QUERY, {
    variables: { id: appointmentId },
    skip: !appointmentId,
  });

  // Mutation pour créer une évaluation
  const [createReview] = useMutation(CREATE_REVIEW_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createReview) {
        setSuccess('Merci pour votre évaluation !');
        setTimeout(() => {
          setSuccess('');
          navigate('/patient/appointments');
        }, 3000);
        setSubmitting(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setSubmitting(false);
    }
  });

  useEffect(() => {
    if (appointmentData && appointmentData.appointment) {
      setAppointment(appointmentData.appointment);
      setLoading(false);
    }
  }, [appointmentData]);

  const handleOpenReviewDialog = () => {
    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setRating(5);
    setReviewText('');
  };

  const handleSubmitReview = () => {
    setSubmitting(true);
    setError('');

    createReview({
      variables: {
        input: {
          appointmentId,
          rating,
          comment: reviewText.trim()
        }
      }
    });
  };

  if (loading) {
    return (
      <ReviewContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ReviewContainer>
    );
  }

  if (!appointment) {
    return (
      <ReviewContainer maxWidth="md">
        <Alert severity="error">Rendez-vous non trouvé</Alert>
      </ReviewContainer>
    );
  }

  // Vérifier si l'utilisateur est le patient concerné
  if (user.role !== 'PATIENT' || appointment.patientId !== user.patient.id) {
    return (
      <ReviewContainer maxWidth="md">
        <Alert severity="error">Vous n'êtes pas autorisé à évaluer ce rendez-vous</Alert>
      </ReviewContainer>
    );
  }

  // Vérifier si le rendez-vous est terminé
  if (appointment.status !== 'COMPLETED') {
    return (
      <ReviewContainer maxWidth="md">
        <Alert severity="info">Vous ne pouvez évaluer que les rendez-vous terminés</Alert>
      </ReviewContainer>
    );
  }

  return (
    <ReviewContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Évaluer ma consultation
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <ReviewPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Détails du rendez-vous
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">
              Date: {dayjs(`${appointment.appointmentDate} ${appointment.startTime}`).format('dddd D MMMM YYYY à HH:mm')}
            </Typography>
            <Typography variant="body1">
              Type: {appointment.consultationType === 'ONLINE' ? 'Consultation en ligne' : 'Consultation en personne'}
            </Typography>
            <Typography variant="body1">
              Médecin: Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
            </Typography>
            <Typography variant="body1">
              Spécialité: {appointment.doctor?.specialty}
            </Typography>
          </Grid>
        </Grid>

        <Box textAlign="center" mt={3}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleOpenReviewDialog}
          >
            Évaluer cette consultation
          </Button>
        </Box>
      </ReviewPaper>

      {/* Carte du médecin */}
      <DoctorCard elevation={2}>
        <DoctorAvatar>
          <PersonIcon fontSize="large" />
        </DoctorAvatar>
        <Typography variant="h6" gutterBottom>
          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {appointment.doctor?.specialty}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {appointment.doctor?.city}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tarif: {appointment.doctor?.consultationFee} €
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          {appointment.doctor?.languages && appointment.doctor.languages.map((language, index) => (
            <Chip key={index} label={language} size="small" variant="outlined" />
          ))}
        </Box>
      </DoctorCard>

      {/* Dialogue d'évaluation */}
      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Évaluer votre consultation</DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Comment s'est passée votre consultation ?
            </Typography>
            <Rating
              name="rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              size="large"
              precision={0.5}
              icon={<StarIcon fontSize="inherit" />}
              emptyIcon={<StarIcon fontSize="inherit" />}
            />
          </Box>
          <TextField
            fullWidth
            label="Votre commentaire (optionnel)"
            multiline
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer l'évaluation'}
          </Button>
        </DialogActions>
      </Dialog>
    </ReviewContainer>
  );
};

export default ReviewAppointment;
