import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Divider, Alert, CircularProgress, Grid, Card, CardContent, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useQuery, useMutation } from '@apollo/client';
import { SYSTEM_SETTINGS_QUERY, UPDATE_SYSTEM_SETTINGS_MUTATION } from '../../graphql/admin';
import { useAuth } from '../../contexts/AuthContext';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import PaymentIcon from '@mui/icons-material/Payment';
import EmailIcon from '@mui/icons-material/Email';

// Composants stylisés
const SettingsContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SettingsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const SettingsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const SystemSettings = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // Paramètres généraux
    platformName: 'Prise de Rendez-vous Médicaux',
    platformDescription: 'Plateforme de prise de rendez-vous médicaux en ligne',
    contactEmail: 'contact@medapp.com',
    supportPhone: '+33 1 23 45 67 89',

    // Paramètres de notification
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    appointmentReminderHours: 24,

    // Paramètres de sécurité
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
    twoFactorAuthEnabled: false,

    // Paramètres de paiement
    stripePublishableKey: '',
    currency: 'EUR',

    // Paramètres de langue
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'en'],

    // Paramètres de messagerie
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseTls: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Récupérer les paramètres système
  const { data: settingsData, loading: settingsLoading, error: settingsError } = useQuery(SYSTEM_SETTINGS_QUERY);

  // Mutation pour mettre à jour les paramètres système
  const [updateSystemSettings] = useMutation(UPDATE_SYSTEM_SETTINGS_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updateSystemSettings) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  });

  useEffect(() => {
    if (settingsData && settingsData.systemSettings) {
      setSettings(settingsData.systemSettings);
      setLoading(false);
    }
  }, [settingsData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = () => {
    updateSystemSettings({
      variables: {
        input: settings
      }
    });
  };

  if (loading) {
    return (
      <SettingsContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Configuration système
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Paramètres enregistrés avec succès</Alert>}

      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} label="Général" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Sécurité" />
          <Tab icon={<PaymentIcon />} label="Paiement" />
          <Tab icon={<LanguageIcon />} label="Langue" />
          <Tab icon={<EmailIcon />} label="Messagerie" />
        </Tabs>

        {/* Onglet Général */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Paramètres généraux de la plateforme
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom de la plateforme"
                name="platformName"
                value={settings.platformName}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description de la plateforme"
                name="platformDescription"
                value={settings.platformDescription}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email de contact"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Téléphone du support"
                name="supportPhone"
                value={settings.supportPhone}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Notifications */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Paramètres de notification
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotificationsEnabled}
                    onChange={handleInputChange}
                    name="emailNotificationsEnabled"
                    color="primary"
                  />
                }
                label="Activer les notifications par e-mail"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotificationsEnabled}
                    onChange={handleInputChange}
                    name="smsNotificationsEnabled"
                    color="primary"
                  />
                }
                label="Activer les notifications par SMS"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotificationsEnabled}
                    onChange={handleInputChange}
                    name="pushNotificationsEnabled"
                    color="primary"
                  />
                }
                label="Activer les notifications push"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Heures avant le rappel de rendez-vous"
                name="appointmentReminderHours"
                value={settings.appointmentReminderHours}
                onChange={handleInputChange}
                margin="normal"
                type="number"
                helperText="Nombre d'heures avant l'envoi du rappel"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Sécurité */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Paramètres de sécurité
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longueur minimale du mot de passe"
                name="passwordMinLength"
                value={settings.passwordMinLength}
                onChange={handleInputChange}
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Délai d'expiration de session (minutes)"
                name="sessionTimeoutMinutes"
                value={settings.sessionTimeoutMinutes}
                onChange={handleInputChange}
                margin="normal"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuthEnabled}
                    onChange={handleInputChange}
                    name="twoFactorAuthEnabled"
                    color="primary"
                  />
                }
                label="Activer l'authentification à deux facteurs"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Paiement */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Paramètres de paiement
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Clé publique Stripe"
                name="stripePublishableKey"
                value={settings.stripePublishableKey}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="currency-label">Devise</InputLabel>
                <Select
                  labelId="currency-label"
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={handleInputChange}
                >
                  <MenuItem value="EUR">EUR (Euro)</MenuItem>
                  <MenuItem value="USD">USD (Dollar américain)</MenuItem>
                  <MenuItem value="GBP">GBP (Livre sterling)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Langue */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Paramètres de langue
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="default-language-label">Langue par défaut</InputLabel>
                <Select
                  labelId="default-language-label"
                  id="defaultLanguage"
                  name="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={handleInputChange}
                >
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="en">Anglais</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" gutterBottom>
                Langues supportées
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.supportedLanguages.includes('fr')}
                    onChange={(e) => {
                      const newLanguages = [...settings.supportedLanguages];
                      if (e.target.checked && !newLanguages.includes('fr')) {
                        newLanguages.push('fr');
                      } else if (!e.target.checked) {
                        const index = newLanguages.indexOf('fr');
                        if (index > -1) {
                          newLanguages.splice(index, 1);
                        }
                      }
                      setSettings(prev => ({
                        ...prev,
                        supportedLanguages: newLanguages
                      }));
                    }}
                    color="primary"
                  />
                }
                label="Français"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.supportedLanguages.includes('en')}
                    onChange={(e) => {
                      const newLanguages = [...settings.supportedLanguages];
                      if (e.target.checked && !newLanguages.includes('en')) {
                        newLanguages.push('en');
                      } else if (!e.target.checked) {
                        const index = newLanguages.indexOf('en');
                        if (index > -1) {
                          newLanguages.splice(index, 1);
                        }
                      }
                      setSettings(prev => ({
                        ...prev,
                        supportedLanguages: newLanguages
                      }));
                    }}
                    color="primary"
                  />
                }
                label="Anglais"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Messagerie */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Paramètres de messagerie
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hôte SMTP"
                name="smtpHost"
                value={settings.smtpHost}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Port SMTP"
                name="smtpPort"
                value={settings.smtpPort}
                onChange={handleInputChange}
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Nom d'utilisateur SMTP"
                name="smtpUsername"
                value={settings.smtpUsername}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mot de passe SMTP"
                name="smtpPassword"
                value={settings.smtpPassword}
                onChange={handleInputChange}
                margin="normal"
                type="password"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smtpUseTls}
                    onChange={handleInputChange}
                    name="smtpUseTls"
                    color="primary"
                  />
                }
                label="Utiliser TLS"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Bouton d'enregistrement */}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Enregistrer les paramètres
        </Button>
      </Box>
    </SettingsContainer>
  );
};

export default SystemSettings;
