import React, { useState, useEffect } from 'react';
import { Container, Paper, Box, TextField, Button, Typography, Alert, Tabs, Tab, MenuItem, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { REGISTER_PATIENT_MUTATION, REGISTER_DOCTOR_MUTATION } from '../../graphql/auth';
import { useAuth } from '../../contexts/AuthContext';

// Composant stylisé
const RegisterContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  padding: theme.spacing(2),
}));

const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 600,
}));

const specialties = [
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

const languages = [
  'Français',
  'Anglais',
  'Espagnol',
  'Allemand',
  'Italien',
  'Arabe',
  'Chinois',
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const roleParam = searchParams.get('role') || 'patient';

  const [tabValue, setTabValue] = useState(roleParam === 'doctor' ? 1 : 0);
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [registerPatient] = useMutation(REGISTER_PATIENT_MUTATION);
  const [registerDoctor] = useMutation(REGISTER_DOCTOR_MUTATION);

  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      languages: ['Français'],
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (roleParam === 'doctor') {
      setTabValue(1);
    }
  }, [roleParam]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setRegisterError('');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setRegisterError('');

    try {
      let result;

      if (tabValue === 0) {
        // Inscription patient
        result = await registerPatient({
          variables: {
            input: {
              email: data.email,
              password: data.password,
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
      } else {
        // Inscription médecin
        result = await registerDoctor({
          variables: {
            input: {
              email: data.email,
              password: data.password,
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

      if (result && result.data) {
        const { accessToken, refreshToken } = tabValue === 0 
          ? result.data.registerPatient 
          : result.data.registerDoctor;

        // Connecter l'utilisateur après l'inscription
        await login(data.email, data.password);
      }
    } catch (error) {
      setRegisterError(error.message || 'Une erreur est survenue lors de l'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContainer maxWidth="md">
      <RegisterPaper elevation={3}>
        <Typography component="h1" variant="h4" gutterBottom>
          Inscription
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="Patient" />
          <Tab label="Médecin" />
        </Tabs>

        {registerError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{registerError}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: '100%' }}
        >
          <Grid container spacing={2}>
            {/* Champs communs */}
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
                    autoComplete="given-name"
                    autoFocus
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
                    autoComplete="family-name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'L'adresse e-mail est requise',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Adresse e-mail invalide'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Adresse e-mail"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Le mot de passe est requis',
                  minLength: {
                    value: 6,
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Mot de passe"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: 'Veuillez confirmer votre mot de passe',
                  validate: value => value === password || 'Les mots de passe ne correspondent pas'
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirmer le mot de passe"
                    type="password"
                    id="confirmPassword"
                    autoComplete="new-password"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                  />
                )}
              />
            </Grid>

            {/* Champs spécifiques aux patients */}
            {tabValue === 0 && (
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
                        autoComplete="tel"
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
                        label="Adresse"
                        autoComplete="street-address"
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
                        autoComplete="address-level2"
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
                        autoComplete="postal-code"
                        error={!!errors.postalCode}
                        helperText={errors.postalCode?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Champs spécifiques aux médecins */}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}>
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
                        select
                        label="Spécialité"
                        error={!!errors.specialty}
                        helperText={errors.specialty?.message}
                      >
                        {specialties.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
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
                        label="Numéro de licence médicale"
                        error={!!errors.licenseNumber}
                        helperText={errors.licenseNumber?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="officeAddress"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        id="officeAddress"
                        label="Adresse du cabinet"
                        error={!!errors.officeAddress}
                        helperText={errors.officeAddress?.message}
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
                <Grid item xs={12}>
                  <Controller
                    name="languages"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        id="languages"
                        select
                        SelectProps={{
                          multiple: true,
                          value: field.value || [],
                          onChange: (e) => field.onChange(e.target.value),
                        }}
                        label="Langues parlées"
                        error={!!errors.languages}
                        helperText={errors.languages?.message}
                      >
                        {languages.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="bio"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        margin="normal"
                        fullWidth
                        multiline
                        rows={4}
                        id="bio"
                        label="Biographie"
                        error={!!errors.bio}
                        helperText={errors.bio?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Inscription en cours...' : 'S'inscrire'}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Déjà un compte ?{' '}
            <Button component="a" href="/login" variant="body2">
              Se connecter
            </Button>
          </Typography>
        </Box>
      </RegisterPaper>
    </RegisterContainer>
  );
};

export default Register;
