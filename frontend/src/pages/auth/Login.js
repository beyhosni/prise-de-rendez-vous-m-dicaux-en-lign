import React, { useState } from 'react';
import { Container, Paper, Box, TextField, Button, Typography, Alert, Tabs, Tab, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';

// Composant stylisé
const LoginContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 400,
}));

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLoginError('');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setLoginError('');

    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        setLoginError(result.message);
      }
    } catch (error) {
      setLoginError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer maxWidth="sm">
      <LoginPaper elevation={3}>
        <Typography component="h1" variant="h4" gutterBottom>
          Connexion
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
          <Tab label="Administrateur" />
        </Tabs>

        {loginError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{loginError}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Adresse e-mail"
            name="email"
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'L'adresse e-mail est requise',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Adresse e-mail invalide'
              }
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mot de passe"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password', {
              required: 'Le mot de passe est requis',
              minLength: {
                value: 6,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
              }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Mot de passe oublié ?
            </Link>
          </Box>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Pas encore de compte ?{' '}
            <Link 
              component={RouterLink} 
              to={tabValue === 0 ? '/register?role=patient' : tabValue === 1 ? '/register?role=doctor' : '#'}
            >
              {tabValue === 0 ? 'S'inscrire en tant que patient' : tabValue === 1 ? 'S'inscrire en tant que médecin' : 'Contactez l'administrateur'}
            </Link>
          </Typography>
        </Box>
      </LoginPaper>
    </LoginContainer>
  );
};

export default Login;
