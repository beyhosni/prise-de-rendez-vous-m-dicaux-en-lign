import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Alert, CircularProgress, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery, useMutation } from '@apollo/client';
import { APPOINTMENT_QUERY, PATIENT_APPOINTMENTS_QUERY } from '../graphql/appointment';
import { CREATE_PAYMENT_SESSION_MUTATION, CONFIRM_PAYMENT_MUTATION } from '../graphql/payment';
import { useAuth } from '../contexts/AuthContext';

// Configuration de Stripe
const stripePromise = loadStripe('pk_test_51234567890abcdef'); // Remplacer par votre clé publique Stripe

// Composants stylisés
const PaymentContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const PaymentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const CardElementContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

// Composant de formulaire de paiement
const PaymentForm = ({ appointmentId, appointment, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const [confirmPayment] = useMutation(CONFIRM_PAYMENT_MUTATION, {
    onCompleted: (data) => {
      if (data && data.confirmPayment) {
        setSucceeded(true);
        setProcessing(false);
        // Rediriger vers la page de confirmation
        navigate(`/patient/appointments?payment=success&appointmentId=${appointmentId}`);
      }
    },
    onError: (error) => {
      setError(error.message);
      setProcessing(false);
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      // Confirmer le paiement dans notre système
      confirmPayment({
        variables: {
          paymentIntentId: paymentIntent.id
        }
      });
    }
  };

  if (succeeded) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5" color="primary" gutterBottom>
          Paiement réussi !
        </Typography>
        <Typography variant="body1" gutterBottom>
          Votre rendez-vous a été confirmé et payé avec succès.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/patient/appointments')}
        >
          Voir mes rendez-vous
        </Button>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Informations de paiement
      </Typography>
      <CardElementContainer>
        <CardElement options={{ hidePostalCode: true }} />
      </CardElementContainer>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={!stripe || processing}
        size="large"
      >
        {processing ? 'Traitement en cours...' : `Payer ${appointment.consultationFee} €`}
      </Button>
    </form>
  );
};

// Composant principal de paiement
const Payment = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer les informations du rendez-vous
  const { data: appointmentData, loading: appointmentLoading, error: appointmentError } = useQuery(APPOINTMENT_QUERY, {
    variables: { id: appointmentId },
    skip: !appointmentId,
  });

  // Mutation pour créer une session de paiement
  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createPaymentSession) {
        setClientSecret(data.createPaymentSession.clientSecret);
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  useEffect(() => {
    if (appointmentData && appointmentData.appointment) {
      setAppointment(appointmentData.appointment);

      // Créer une session de paiement
      createPaymentSession({
        variables: {
          input: {
            appointmentId,
            paymentMethod: 'CREDIT_CARD',
            successUrl: `${window.location.origin}/patient/appointments?payment=success&appointmentId=${appointmentId}`,
            cancelUrl: `${window.location.origin}/payment/${appointmentId}?canceled=true`,
          }
        }
      });
    }
  }, [appointmentData, appointmentId, createPaymentSession]);

  if (appointmentLoading || loading) {
    return (
      <PaymentContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </PaymentContainer>
    );
  }

  if (appointmentError || !appointment) {
    return (
      <PaymentContainer maxWidth="md">
        <Alert severity="error">Erreur lors du chargement des informations du rendez-vous</Alert>
      </PaymentContainer>
    );
  }

  // Vérifier si l'utilisateur est le patient concerné
  if (user && user.patient && appointment.patientId !== user.patient.id) {
    return (
      <PaymentContainer maxWidth="md">
        <Alert severity="error">Vous n'êtes pas autorisé à payer pour ce rendez-vous</Alert>
      </PaymentContainer>
    );
  }

  return (
    <PaymentContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Paiement du rendez-vous
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <PaymentPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Détails du rendez-vous
        </Typography>
        <Typography variant="body1">
          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {appointment.doctor?.specialty}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {appointment.appointmentDate} à {appointment.startTime}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {appointment.consultationType === 'ONLINE' ? 'Consultation en ligne' : 'Consultation en personne'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">
          Montant à payer: {appointment.consultationFee} €
        </Typography>
      </PaymentPaper>

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentPaper elevation={2}>
            <PaymentForm 
              appointmentId={appointmentId} 
              appointment={appointment} 
              clientSecret={clientSecret} 
            />
          </PaymentPaper>
        </Elements>
      )}
    </PaymentContainer>
  );
};

export default Payment;
