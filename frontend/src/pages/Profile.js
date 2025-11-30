import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, TextField, Button, Avatar, Chip, Divider, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ME_QUERY } from '../graphql/auth';
import { UPDATE_PATIENT_PROFILE_MUTATION, UPDATE_DOCTOR_PROFILE_MUTATION } from '../graphql/profile';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';

// Composants stylisés
const ProfileContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  bgcolor: theme.palette.primary.main,
}));

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      languages: ['Français'],
    }
  });

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);

  // Mutations pour mettre à jour le profil
  const [updatePatientProfile] = useMutation(UPDATE_PATIENT_PROFILE_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updatePatientProfile) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const [updateDoctorProfile] = useMutation(UPDATE_DOCTOR_PROFILE_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updateDoctorProfile) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  useEffect(() => {
    if (userData && userData.me) {
      setProfile(userData.me);

      // Pré-remplir le formulaire avec les données actuelles
      if (userData.me.patient) {
        reset({
          firstName: userData.me.patient.firstName,
          lastName: userData.me.patient.lastName,
          dateOfBirth: userData.me.patient.dateOfBirth,
          phone: userData.me.patient.phone,
          address: userData.me.patient.address,
          city: userData.me.patient.city,
          postalCode: userData.me.patient.postalCode,
          insuranceNumber: userData.me.patient.insuranceNumber,
        });
      } else if (userData.me.doctor) {
        reset({
          firstName: userData.me.doctor.firstName,
          lastName: userData.me.doctor.lastName,
          specialty: userData.me.doctor.specialty,
          licenseNumber: userData.me.doctor.licenseNumber,
          phone: userData.me.doctor.phone,
          officeAddress: userData.me.doctor.officeAddress,
          city: userData.me.doctor.city,
          postalCode: userData.me.doctor.postalCode,
          languages: userData.me.doctor.languages,
          consultationFee: userData.me.doctor.consultationFee,
          bio: userData.me.doctor.bio,
        });
      }

      setLoading(false);
    }
  }, [userData, reset]);

  const onSubmit = (data) => {
    setError('');

    if (user.role === 'PATIENT') {
      updatePatientProfile({
        variables: {
          input: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            phone: data.phone,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            insuranceNumber: data.insuranceNumber,
          }
        }
      });
    } else if (user.role === 'DOCTOR') {
      updateDoctorProfile({
        variables: {
          input: {
            firstName: data.firstName,
            lastName: data.lastName,
            specialty: data.specialty,
            licenseNumber: data.licenseNumber,
            phone: data.phone,
            officeAddress: data.officeAddress,
            city: data.city,
            postalCode: data.postalCode,
            languages: data.languages,
            consultationFee: parseFloat(data.consultationFee),
            bio: data.bio,
          }
        }
      });
    }
  };

  if (userLoading) {
    return (
      <ProfileContainer maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ProfileContainer>
    );
  }

  if (userError || !profile) {
    return (
      <ProfileContainer maxWidth="md">
        <Alert severity="error">Erreur lors du chargement des informations du profil</Alert>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Mon profil
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Profil mis à jour avec succès</Alert>}

      <ProfilePaper elevation={2}>
        <Box textAlign="center" mb={3}>
          <ProfileAvatar>
            <PersonIcon fontSize="large" />
          </ProfileAvatar>
          <Typography variant="h6">
            {user.role === 'PATIENT' ? 'Patient' : user.role === 'DOCTOR' ? 'Médecin' : 'Administrateur'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.email}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'Le prénom est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="firstName"
                    label="Prénom"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Le nom est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="lastName"
                    label="Nom"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>

            {/* Champs spécifiques aux patients */}
            {user.role === 'PATIENT' && (
              <>
                <Grid item xs={12}>
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    rules={{ required: 'La date de naissance est requise' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="dateOfBirth"
                        label="Date de naissance"
                        type="date"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={!!errors.dateOfBirth}
                        helperText={errors.dateOfBirth?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        id="phone"
                        label="Téléphone"
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="insuranceNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        id="insuranceNumber"
                        label="Numéro d'assurance"
                        error={!!errors.insuranceNumber}
                        helperText={errors.insuranceNumber?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Champs spécifiques aux médecins */}
            {user.role === 'DOCTOR' && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="specialty"
                    control={control}
                    rules={{ required: 'La spécialité est requise' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="specialty"
                        label="Spécialité"
                        error={!!errors.specialty}
                        helperText={errors.specialty?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="licenseNumber"
                    control={control}
                    rules={{ required: 'Le numéro de licence est requis' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="licenseNumber"
                        label="Numéro de licence"
                        error={!!errors.licenseNumber}
                        helperText={errors.licenseNumber?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="consultationFee"
                    control={control}
                    rules={{ 
                      required: 'Le tarif de consultation est requis',
                      pattern: {
                        value: /^[0-9]+(\.[0-9]{1,2})?$/,
                        message: 'Veuillez entrer un montant valide'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="consultationFee"
                        label="Tarif de consultation (€)"
                        error={!!errors.consultationFee}
                        helperText={errors.consultationFee?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        id="phone"
                        label="Téléphone"
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="address"
                    label={user.role === 'DOCTOR' ? "Adresse du cabinet" : "Adresse"}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="city"
                    label="Ville"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="postalCode"
                    label="Code postal"
                    error={!!errors.postalCode}
                    helperText={errors.postalCode?.message}
                  />
                )}
              />
            </Grid>

            {/* Champ bio pour les médecins */}
            {user.role === 'DOCTOR' && (
              <Grid item xs={12}>
                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="bio"
                      label="Biographie"
                      multiline
                      rows={4}
                      error={!!errors.bio}
                      helperText={errors.bio?.message}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>

          <Box mt={3} display="flex" justifyContent="center">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
            >
              Enregistrer les modifications
            </Button>
          </Box>
        </Box>
      </ProfilePaper>
    </ProfileContainer>
  );
};

export default Profile;
