import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Paper, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { APPOINTMENT_QUERY } from '../graphql/appointment';
import { CONSULTATION_QUERY, APPOINTMENT_CONSULTATION_QUERY, CREATE_CONSULTATION_MUTATION, START_CONSULTATION_MUTATION, JOIN_CONSULTATION_MUTATION, END_CONSULTATION_MUTATION } from '../graphql/video';
import { useAuth } from '../contexts/AuthContext';
import CloseIcon from '@mui/icons-material/Close';

// Importer Jitsi Meet
const JitsiMeetExternalAPI = window.JitsiMeetExternalAPI;

// Composants stylisés
const VideoContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const VideoPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

const JitsiContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  minHeight: '500px',
}));

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const [jitsiApi, setJitsiApi] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConsultationStarted, setIsConsultationStarted] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [consultationEnded, setConsultationEnded] = useState(false);

  // Récupérer les informations du rendez-vous
  const { data: appointmentData, loading: appointmentLoading, error: appointmentError } = useQuery(APPOINTMENT_QUERY, {
    variables: { id: appointmentId },
    skip: !appointmentId,
  });

  // Récupérer les informations de la consultation si elle existe déjà
  const { data: consultationData, loading: consultationLoading, error: consultationError } = useQuery(APPOINTMENT_CONSULTATION_QUERY, {
    variables: { appointmentId },
    skip: !appointmentId,
  });

  // Mutation pour créer une consultation
  const [createConsultation] = useMutation(CREATE_CONSULTATION_MUTATION, {
    onCompleted: (data) => {
      if (data && data.createConsultation) {
        setConsultation(data.createConsultation);
        initializeJitsi(data.createConsultation);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Mutation pour démarrer une consultation
  const [startConsultation] = useMutation(START_CONSULTATION_MUTATION, {
    onCompleted: (data) => {
      if (data && data.startConsultation) {
        setConsultation(prev => ({
          ...prev,
          ...data.startConsultation
        }));
        initializeJitsi(data.startConsultation);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Mutation pour rejoindre une consultation
  const [joinConsultation] = useMutation(JOIN_CONSULTATION_MUTATION, {
    onCompleted: (data) => {
      if (data && data.joinConsultation) {
        setConsultation(prev => ({
          ...prev,
          ...data.joinConsultation
        }));
        initializeJitsi(data.joinConsultation);
      }
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Mutation pour terminer une consultation
  const [endConsultation] = useMutation(END_CONSULTATION_MUTATION, {
    onCompleted: (data) => {
      if (data && data.endConsultation) {
        setConsultation(data.endConsultation);
        setConsultationEnded(true);
        disposeJitsi();
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Initialiser Jitsi Meet
  const initializeJitsi = (consultationData) => {
    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si'; // Utiliser le domaine de Jitsi Meet
    const options = {
      roomName: consultationData.roomId,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: true,
      },
      interfaceConfigOverwrite: {
        // Masquer certains éléments de l'interface
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    };

    const api = new JitsiMeetExternalAPI(domain, options);
    setJitsiApi(api);
    setIsConsultationStarted(true);
    setLoading(false);

    // Écouter les événements
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Rejoint la conférence vidéo');
    });

    api.addEventListener('readyToClose', () => {
      handleEndConsultation();
    });
  };

  // Nettoyer Jitsi Meet
  const disposeJitsi = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
      setJitsiApi(null);
      setIsConsultationStarted(false);
    }
  };

  // Gérer la fin de la consultation
  const handleEndConsultation = () => {
    if (user.role === 'DOCTOR') {
      // Seul le médecin peut officiellement terminer la consultation
      setShowEndDialog(true);
    } else {
      // Le patient quitte simplement la consultation
      disposeJitsi();
      navigate(user.role === 'PATIENT' ? '/patient/appointments' : '/doctor/appointments');
    }
  };

  // Confirmer la fin de la consultation
  const confirmEndConsultation = () => {
    endConsultation({
      variables: {
        appointmentId
      }
    });
    setShowEndDialog(false);
  };

  // Initialiser les données
  useEffect(() => {
    if (appointmentData && appointmentData.appointment) {
      setAppointment(appointmentData.appointment);

      // Vérifier si la consultation existe déjà
      if (consultationData && consultationData.appointmentConsultation) {
        setConsultation(consultationData.appointmentConsultation);
        initializeJitsi(consultationData.appointmentConsultation);
      } else {
        // La consultation n'existe pas encore
        if (user.role === 'DOCTOR') {
          // Le médecin crée la consultation
          createConsultation({
            variables: {
              appointmentId
            }
          });
        } else {
          // Le patient attend que le médecin crée la consultation
          setLoading(false);
        }
      }
    }
  }, [appointmentData, consultationData, user.role, appointmentId, createConsultation]);

  // Nettoyer Jitsi Meet lors du démontage du composant
  useEffect(() => {
    return () => {
      disposeJitsi();
    };
  }, []);

  if (appointmentLoading || consultationLoading) {
    return (
      <VideoContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </VideoContainer>
    );
  }

  if (appointmentError || !appointment) {
    return (
      <VideoContainer maxWidth="lg">
        <Alert severity="error">Erreur lors du chargement des informations du rendez-vous</Alert>
      </VideoContainer>
    );
  }

  // Vérifier si l'utilisateur est autorisé à accéder à cette consultation
  if (user.role === 'PATIENT' && appointment.patientId !== user.patient.id) {
    return (
      <VideoContainer maxWidth="lg">
        <Alert severity="error">Vous n'êtes pas autorisé à accéder à cette consultation</Alert>
      </VideoContainer>
    );
  }

  if (user.role === 'DOCTOR' && appointment.doctorId !== user.doctor.id) {
    return (
      <VideoContainer maxWidth="lg">
        <Alert severity="error">Vous n'êtes pas autorisé à accéder à cette consultation</Alert>
      </VideoContainer>
    );
  }

  // Si le patient et que la consultation n'est pas encore démarrée
  if (user.role === 'PATIENT' && !consultation && !isConsultationStarted) {
    return (
      <VideoContainer maxWidth="lg">
        <VideoPaper elevation={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Consultation vidéo
          </Typography>
          <Typography variant="h6" gutterBottom>
            En attente du médecin...
          </Typography>
          <Typography variant="body1" paragraph>
            Le médecin va bientôt démarrer la consultation. Veuillez patienter.
          </Typography>
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress size={60} />
          </Box>
          <Box mt={4} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/patient/appointments')}
            >
              Retour à mes rendez-vous
            </Button>
          </Box>
        </VideoPaper>
      </VideoContainer>
    );
  }

  // Si le médecin et que la consultation n'est pas encore démarrée
  if (user.role === 'DOCTOR' && !consultation && !isConsultationStarted) {
    return (
      <VideoContainer maxWidth="lg">
        <VideoPaper elevation={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Consultation vidéo
          </Typography>
          <Typography variant="h6" gutterBottom>
            Prêt à commencer ?
          </Typography>
          <Typography variant="body1" paragraph>
            Cliquez sur le bouton ci-dessous pour démarrer la consultation avec votre patient.
          </Typography>
          <Box mt={4} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => {
                createConsultation({
                  variables: {
                    appointmentId
                  }
                });
              }}
            >
              Démarrer la consultation
            </Button>
          </Box>
          <Box mt={2} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/doctor/appointments')}
            >
              Retour à mes rendez-vous
            </Button>
          </Box>
        </VideoPaper>
      </VideoContainer>
    );
  }

  // Consultation terminée
  if (consultationEnded) {
    return (
      <VideoContainer maxWidth="lg">
        <VideoPaper elevation={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Consultation terminée
          </Typography>
          <Typography variant="body1" paragraph>
            La consultation a été enregistrée avec succès.
          </Typography>
          <Box mt={4} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(user.role === 'PATIENT' ? '/patient/appointments' : '/doctor/appointments')}
            >
              Retour à mes rendez-vous
            </Button>
          </Box>
        </VideoPaper>
      </VideoContainer>
    );
  }

  // Consultation en cours
  return (
    <VideoContainer maxWidth="lg">
      <VideoPaper elevation={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Consultation vidéo
          </Typography>
          <IconButton color="primary" onClick={handleEndConsultation}>
            <CloseIcon />
          </IconButton>
        </Box>
        <JitsiContainer ref={jitsiContainerRef} />
      </VideoPaper>

      {/* Dialogue de confirmation pour terminer la consultation (médecin uniquement) */}
      {user.role === 'DOCTOR' && (
        <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
          <DialogTitle>Terminer la consultation</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir terminer cette consultation ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEndDialog(false)}>Annuler</Button>
            <Button onClick={confirmEndConsultation} color="primary">
              Terminer
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </VideoContainer>
  );
};

export default VideoConsultation;
